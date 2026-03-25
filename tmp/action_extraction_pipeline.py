"""Meeting action extraction pipeline.

Extracts personal action items from meeting summaries in todo.meeting_summaries
and populates todo.c_work_actions, using AI classification to handle duplicates
and progressions.

Registered as service: pyscript.action_extraction_pipeline
Called by automation with data: {dry_run: false}

Reference documents:
  - action-extraction-plan-v2.1-final.md (architecture and design rationale)
  - action-extraction-implementation-spec.md (service call patterns, prompt, parsing)
"""

import json
import hashlib
import re
from datetime import datetime, timedelta, timezone


# ─────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────

SUMMARY_ENTITY = "todo.meeting_summaries"
ACTIONS_ENTITY = "todo.c_work_actions"
LEDGER_ENTITY = "todo.action_pipeline_ledger"
AI_ENTITY = "ai_task.openai_ai_task"

LEASE_TTL_SECONDS = 300
COMPLETED_LOOKBACK_DAYS = 90
LEDGER_PRUNE_DAYS = 14

NOTIFICATION_ID_LATEST = "action_pipeline_latest"
NOTIFICATION_ID_ERROR = "action_pipeline_error"
NOTIFICATION_ID_INFO = "action_pipeline_info"
NOTIFICATION_ID_DRYRUN = "action_pipeline_dryrun"

CLASSIFICATION_STRUCTURE = {
    "verdicts": {
        "selector": {"text": {"multiline": True}},
        "description": (
            "A JSON array of verdict objects. Each object must have: "
            "candidate_index (integer), verdict (string: NEW|PROGRESSION|DUPLICATE), "
            "matched_uid (string or null), reason (string). "
            "PROGRESSION objects may also have: updated_due_date (string YYYY-MM-DD or null), "
            "updated_text (string or null)."
        ),
        "required": True,
    }
}

PROMPT_TEMPLATE = """You are classifying candidate work actions from a meeting summary against an existing action list.

C is a person who tracks work obligations in a todo list. New meeting summaries produce candidate actions. Your job is to determine whether each candidate is genuinely new, an update to an existing item, or a restatement of something already tracked.

## EXISTING ACTIONS (from C's current todo list)

{existing_actions_block}

## CANDIDATE ACTIONS (extracted from a new meeting summary)

Source meeting: {source_meeting_title}
Meeting date: {source_meeting_date}

{candidate_actions_block}

## CLASSIFICATION RULES

For each candidate, return exactly one verdict:

NEW — No semantic match exists in the existing actions (active or completed). This is a genuinely new work obligation.

PROGRESSION — Matches an existing active (needs_action) item, but the candidate carries new information: a changed deadline, narrower scope, evidence the task has moved forward (e.g. from "research X" to "test X"), or a status shift (e.g. from "do X" to "follow up on X"). The underlying obligation is the same but the state has advanced.

DUPLICATE — Matches an existing item (active or completed) and adds no new information. The action was restated in the meeting without any change to scope, deadline, or status.

## HOW TO DISTINGUISH PROGRESSION FROM DUPLICATE

- A date change (from no date to a specific date, or from one date to another) is always PROGRESSION.
- A scope refinement (generic to specific) is PROGRESSION. Example: "research web call options for Microsoft/Google compatibility" becoming "test Google Meet link with Google contact for virtual compatibility" — the task moved from research to execution.
- A status shift ("do X" becoming "follow up on X" or "chase X" or "confirm X") is PROGRESSION.
- A verbatim or near-verbatim restatement with no new date, no new context, and no evidence of movement is DUPLICATE.

## COMPLETED ITEMS

A candidate matching a completed item is DUPLICATE only if context indicates it refers to the same obligation instance — typically when meeting dates are within a fortnight and the due dates match. A candidate that resembles a completed item but comes from a significantly later meeting, or references a new event, time period, or deliverable, is NEW (a recurrence, not a duplicate). Example: "book room for quarterly" completed in March reappearing in a June summary for a September quarterly is NEW.

## SAFETY RULES — CRITICAL

- If uncertain between NEW and DUPLICATE, classify as NEW. A duplicate that C manually removes costs seconds. A missed action costs professional credibility.
- If uncertain between PROGRESSION and DUPLICATE, classify as PROGRESSION. An unnecessary update is harmless. A missed update means C is working from stale information.
- Never classify a genuinely new action as DUPLICATE. When in doubt, add.

## OUTPUT FORMAT

The "verdicts" field must contain only a valid JSON array — no markdown code fences, no commentary, no text outside the array. Each element must have:

- "candidate_index": integer (0-based, matching the candidate list order)
- "verdict": "NEW" or "PROGRESSION" or "DUPLICATE"
- "matched_uid": the UID string of the matched existing item, or null for NEW
- "reason": one sentence explaining the classification

For PROGRESSION only, optionally include:
- "updated_due_date": "YYYY-MM-DD" if the candidate has a different/new date, otherwise null
- "updated_text": the candidate's action text ONLY if it is strictly more specific than the existing text. Never paraphrase, generalise, or editorially rewrite. If in doubt, set to null — the existing text stands.

The "verdicts" field must contain ONLY the JSON array. No commentary, no markdown, no preamble."""

RETRY_PREFIX = (
    "IMPORTANT: Your previous response in the \"verdicts\" field was not valid JSON. "
    "You MUST return a valid JSON array in the \"verdicts\" field. The array must conform "
    "exactly to the schema specified below. Return ONLY the JSON array — no markdown code "
    "fences, no commentary, no explanation outside the array.\n\n"
)


# ─────────────────────────────────────────────────────────────────────
# Utility functions
# ─────────────────────────────────────────────────────────────────────

def notify(title, message, notification_id):
    """Send a persistent notification."""
    service.call(
        "persistent_notification", "create",
        title=title,
        message=message,
        notification_id=notification_id,
    )


def normalise_due(due_value):
    """Normalise a due date to YYYY-MM-DD string, or None.

    Handles: None, empty string, the literal string "null",
    date-only strings, full ISO datetimes with timezone.
    """
    if not due_value:
        return None
    s = str(due_value).strip()
    if s.lower() == "null":
        return None
    # Full datetime — take date portion before T
    if "T" in s:
        return s.split("T")[0]
    return s


def compute_state_hash(summary_text, due_date):
    """SHA-256 hash for manual edit detection.

    Canonical form: stripped_summary + \\x00 + normalised_due (or empty).
    """
    normalised = normalise_due(due_date) or ""
    canonical = f"{summary_text.strip()}\x00{normalised}"
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def parse_metadata(description):
    """Parse key:value pairs from a description field.

    Returns {"_fields": {...}, "_progressions": [...]}.
    Only lines before the first --- separator are parsed into _fields.
    Lines after --- separators are collected as raw progression blocks.
    """
    if not description:
        return {"_fields": {}, "_progressions": []}

    result = {"_fields": {}, "_progressions": []}
    current_block = []
    past_first_separator = False

    for line in description.split("\n"):
        stripped = line.strip()

        if stripped == "---":
            if current_block:
                result["_progressions"].append("\n".join(current_block))
                current_block = []
            past_first_separator = True
            continue

        if ": " in stripped and not past_first_separator:
            key, value = stripped.split(": ", 1)
            key = key.strip().lower().replace(" ", "_")
            result["_fields"][key] = value.strip()

        if stripped:
            current_block.append(stripped)

    if current_block:
        result["_progressions"].append("\n".join(current_block))

    return result


def has_been_manually_edited(item, meta):
    """Check if an action item was edited by C since the pipeline last wrote it.

    Returns True if manual edits detected, False if unmodified or unknown.
    """
    stored_hash = meta["_fields"].get("pipeline_state_hash")
    if not stored_hash:
        # No pipeline metadata — predates pipeline or metadata removed.
        # Treat as unmodified (allow update).
        return False

    current_due_normalised = normalise_due(item.get("due"))
    current_hash = compute_state_hash(item["summary"], current_due_normalised)

    if current_hash == stored_hash:
        return False

    # Hash mismatch — try fallback string comparison
    stored_summary = meta["_fields"].get("pipeline_last_summary")
    stored_due = meta["_fields"].get("pipeline_last_due")

    if stored_summary is None:
        return False  # no fallback data — treat as unmodified

    summary_match = item["summary"].strip() == stored_summary.strip()
    due_match = normalise_due(item.get("due")) == normalise_due(stored_due)

    return not (summary_match and due_match)


def should_include_completed(item, now):
    """Check if a completed item is recent enough to include in the AI prompt."""
    meta = parse_metadata(item.get("description", ""))
    last_wrote = meta["_fields"].get("pipeline_last_wrote")

    if not last_wrote:
        return True  # no pipeline timestamp — include unconditionally

    try:
        wrote_dt = datetime.fromisoformat(last_wrote)
        if wrote_dt.tzinfo is None:
            wrote_dt = wrote_dt.replace(tzinfo=timezone.utc)
        cutoff = now - timedelta(days=COMPLETED_LOOKBACK_DAYS)
        return wrote_dt >= cutoff
    except (ValueError, TypeError):
        return True  # unparseable — include to be safe


def find_item_by_uid(items, uid):
    """Find a todo item in a list by its UID."""
    for item in items:
        if item.get("uid") == uid:
            return item
    return None


# ─────────────────────────────────────────────────────────────────────
# Phase 2 — Extraction
# ─────────────────────────────────────────────────────────────────────

def extract_meeting_metadata(description, summary_field):
    """Extract meeting date and title from description, with fallback to summary field.

    Scans for - Date: and - Title: lines anywhere in the description,
    since real summaries vary in header structure (# Meeting, ## Meeting,
    # Meeting Summary / ## Meeting, etc.).

    Returns (meeting_date, meeting_title). Either may be None.
    """
    meeting_date = None
    meeting_title = None

    if description:
        for line in description.split("\n"):
            stripped = line.strip()
            if stripped.startswith("- Date:") and not meeting_date:
                meeting_date = stripped.split("- Date:", 1)[1].strip()
            elif stripped.startswith("- Title:") and not meeting_title:
                meeting_title = stripped.split("- Title:", 1)[1].strip()

    # Fallback: derive from summary field
    # Format: "MM-DD Meeting Title|transcript_filename"
    if not meeting_date and summary_field:
        parts = summary_field.split(" ", 1)
        if parts:
            meeting_date = parts[0]  # MM-DD only — degraded provenance

    if not meeting_title and summary_field and "|" in summary_field:
        title_part = summary_field.split("|")[0]
        parts = title_part.split(" ", 1)
        if len(parts) > 1:
            meeting_title = parts[1].strip()

    return meeting_date, meeting_title


def extract_actions(description, summary_field):
    """Phase 2: deterministic extraction of action candidates.

    Returns (candidates, meeting_date, meeting_title, contract_violation).
    candidates is a list of dicts with: action_text, due_date, source_meeting_date,
    source_meeting_title.
    contract_violation is True if more than half the action lines failed to parse.
    """
    if not description:
        return [], None, None, False

    # Normalise line endings
    text = description.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in text.split("\n")]

    # Extract meeting metadata
    meeting_date, meeting_title = extract_meeting_metadata(text, summary_field)

    # Find ## My Actions section
    in_section = False
    raw_action_lines = []

    for line in lines:
        stripped = line.strip()

        if not in_section:
            # Match any heading level for "My Actions"
            if re.match(r'^#+\s+My Actions', stripped):
                in_section = True
            continue

        # Inside the My Actions section
        if re.match(r'^#+\s+', stripped):
            # Hit the next section header — stop
            break
        if not stripped:
            # Blank line — skip, don't terminate
            continue
        if stripped.startswith("- "):
            raw_action_lines.append(stripped)
        # Non-bullet, non-blank, non-header lines are silently skipped

    if not raw_action_lines:
        return [], meeting_date, meeting_title, False

    # Parse action lines
    candidates = []
    malformed_count = 0

    for raw_line in raw_action_lines:
        # Strip leading "- " (with any whitespace variation)
        content = re.sub(r'^-\s+', '', raw_line)

        if " | " in content:
            parts = content.rsplit(" | ", 1)
            action_text = parts[0].strip()
            date_part = parts[1].strip()

            # Defensive split validation
            if re.match(r'^\d{4}-\d{2}-\d{2}$', date_part):
                due_date = date_part
            elif re.match(r'(?i)^none$', date_part):
                due_date = None
            else:
                # Pipe was part of action text, not a delimiter
                action_text = content.strip()
                due_date = None
        else:
            action_text = content.strip()
            due_date = None

        if not action_text:
            malformed_count += 1
            log.warning(f"Action pipeline: empty action text from line: {raw_line}")
            continue

        candidates.append({
            "action_text": action_text,
            "due_date": due_date,
            "source_meeting_date": meeting_date,
            "source_meeting_title": meeting_title,
        })

    # Contract violation check
    total_lines = len(raw_action_lines)
    contract_violation = malformed_count > (total_lines / 2) if total_lines > 0 else False

    # Intra-summary deduplication (exact match after normalisation)
    seen = {}
    deduped = []
    for c in candidates:
        key = c["action_text"].strip().lower()
        if key in seen:
            existing = seen[key]
            # Keep the more specific due date
            if c["due_date"] and not existing["due_date"]:
                existing["due_date"] = c["due_date"]
            elif c["due_date"] and existing["due_date"] and c["due_date"] > existing["due_date"]:
                existing["due_date"] = c["due_date"]
            log.info(f"Action pipeline: collapsed duplicate action: {c['action_text']}")
        else:
            seen[key] = c
            deduped.append(c)

    return deduped, meeting_date, meeting_title, contract_violation


# ─────────────────────────────────────────────────────────────────────
# Phase 3 — Fetch existing actions
# ─────────────────────────────────────────────────────────────────────

def fetch_existing_actions(now):
    """Fetch all items from todo.c_work_actions (active + recent completed).

    Returns list of item dicts, or None on failure.
    """
    try:
        response = service.call(
            "todo", "get_items",
            entity_id=ACTIONS_ENTITY,
            status=["needs_action", "completed"],
            return_response=True,
        )
        all_items = response[ACTIONS_ENTITY]["items"]
    except Exception as e:
        log.error(f"Action pipeline: cannot read {ACTIONS_ENTITY}: {e}")
        return None

    # Apply temporal truncation to completed items
    filtered = []
    for item in all_items:
        if item["status"] == "needs_action":
            filtered.append(item)
        elif item["status"] == "completed":
            if should_include_completed(item, now):
                filtered.append(item)

    return filtered


# ─────────────────────────────────────────────────────────────────────
# Phase 4 — AI classification
# ─────────────────────────────────────────────────────────────────────

def format_existing_actions(items):
    """Format existing action items for the AI prompt."""
    if not items:
        return "(No existing actions)"

    lines = []
    for item in items:
        uid = item["uid"]
        status = item["status"]
        summary = item["summary"]
        due = item.get("due", "no date")
        meta = parse_metadata(item.get("description", ""))
        source = meta["_fields"].get("source", "unknown")
        m_date = meta["_fields"].get("meeting_date", "unknown")

        line = f"[{uid}] [{status}] {summary} | Due: {due} | Source: {source}, {m_date}"

        # Include most recent progression only
        progs = meta["_progressions"]
        if len(progs) > 1:
            # First element is the header block; last is most recent progression
            line += f"\n  Last progression: {progs[-1]}"

        lines.append(line)

    return "\n".join(lines)


def format_candidate_actions(candidates):
    """Format candidate actions for the AI prompt."""
    lines = []
    for i, c in enumerate(candidates):
        due = c["due_date"] or "no date"
        lines.append(f"[{i}] {c['action_text']} | Due: {due}")
    return "\n".join(lines)


def build_prompt(existing_items, candidates, meeting_title, meeting_date):
    """Assemble the full ai_task instructions string."""
    return PROMPT_TEMPLATE.format(
        existing_actions_block=format_existing_actions(existing_items),
        source_meeting_title=meeting_title or "unknown",
        source_meeting_date=meeting_date or "unknown",
        candidate_actions_block=format_candidate_actions(candidates),
    )


def parse_verdicts_json(raw_string):
    """Parse the verdicts JSON string from the AI response.

    Strips markdown code fences if present. Returns parsed list or None.
    """
    if not raw_string:
        return None
    cleaned = raw_string.strip()
    # Strip code fences
    if cleaned.startswith("```"):
        # Remove opening fence (with optional language tag)
        first_newline = cleaned.find("\n")
        if first_newline != -1:
            cleaned = cleaned[first_newline + 1:]
        # Remove closing fence
        if cleaned.rstrip().endswith("```"):
            cleaned = cleaned.rstrip()[:-3].rstrip()
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return parsed
        return None
    except (json.JSONDecodeError, TypeError):
        return None


def validate_verdict(verdict, existing_uids):
    """Validate a single verdict object. Returns (is_valid, reason)."""
    if not isinstance(verdict, dict):
        return False, "not a dict"

    ci = verdict.get("candidate_index")
    v = verdict.get("verdict")
    uid = verdict.get("matched_uid")

    if not isinstance(ci, int):
        return False, "missing or non-integer candidate_index"
    if v not in ("NEW", "PROGRESSION", "DUPLICATE"):
        return False, f"unrecognised verdict: {v}"
    if v in ("PROGRESSION", "DUPLICATE") and not uid:
        return False, f"{v} missing matched_uid"
    if uid and uid not in existing_uids:
        return False, f"matched_uid {uid[:8]}... not in comparison set"

    return True, None


def classify(existing_items, candidates, meeting_title, meeting_date):
    """Phase 4: AI classification with one retry on parse failure.

    Returns list of validated verdict dicts, or None on total failure.
    """
    prompt = build_prompt(existing_items, candidates, meeting_title, meeting_date)
    existing_uids = {item["uid"] for item in existing_items}

    raw_response_1 = None
    raw_response_2 = None

    # First attempt
    try:
        response = service.call(
            "ai_task", "generate_data",
            task_name="action_classification",
            instructions=prompt,
            entity_id=AI_ENTITY,
            structure=CLASSIFICATION_STRUCTURE,
            return_response=True,
        )
        raw_response_1 = response.get("data", {}).get("verdicts", "")
    except Exception as e:
        log.error(f"Action pipeline: ai_task call failed: {e}")
        raw_response_1 = f"EXCEPTION: {e}"

    verdicts = parse_verdicts_json(raw_response_1)

    # Retry on parse failure
    if verdicts is None:
        log.warning("Action pipeline: first AI response not valid JSON, retrying")
        retry_prompt = RETRY_PREFIX + prompt
        try:
            response = service.call(
                "ai_task", "generate_data",
                task_name="action_classification_retry",
                instructions=retry_prompt,
                entity_id=AI_ENTITY,
                structure=CLASSIFICATION_STRUCTURE,
                return_response=True,
            )
            raw_response_2 = response.get("data", {}).get("verdicts", "")
        except Exception as e:
            log.error(f"Action pipeline: ai_task retry failed: {e}")
            raw_response_2 = f"EXCEPTION: {e}"

        verdicts = parse_verdicts_json(raw_response_2)

        if verdicts is None:
            # Both attempts failed
            notify(
                "Action Pipeline: AI Response Failed",
                (
                    f"Both attempts returned unparseable output.\n"
                    f"Attempt 1: {str(raw_response_1)[:50]}...\n"
                    f"Attempt 2: {str(raw_response_2)[:50]}..."
                ),
                NOTIFICATION_ID_ERROR,
            )
            return None

    # Validate individual elements — skip invalid ones, keep valid ones
    validated = []
    for v in verdicts:
        is_valid, reason = validate_verdict(v, existing_uids)
        if is_valid:
            validated.append(v)
        else:
            ci = v.get("candidate_index", "?")
            log.warning(f"Action pipeline: skipping verdict for candidate {ci}: {reason}")

    return validated


def resolve_collisions(verdicts):
    """Deterministic post-classification collision resolution.

    candidate_index reflects extraction order (top-to-bottom in ## My Actions).
    Higher index = appears later = assumed more refined version.
    """
    # Build map of matched_uid -> list of verdicts targeting it
    uid_targets = {}
    for v in verdicts:
        uid = v.get("matched_uid")
        if uid:
            uid_targets.setdefault(uid, []).append(v)

    for uid, targeting in uid_targets.items():
        if len(targeting) <= 1:
            continue

        progressions = [v for v in targeting if v["verdict"] == "PROGRESSION"]

        # Many-to-one PROGRESSION: keep only highest index
        if len(progressions) > 1:
            keeper = max(progressions, key=lambda v: v["candidate_index"])
            for v in progressions:
                if v is not keeper:
                    v["verdict"] = "DUPLICATE"
                    v["reason"] = (
                        f"Reclassified: candidate {keeper['candidate_index']} "
                        f"is a later progression against same item."
                    )

        # PROGRESSION + DUPLICATE against same UID: no change needed,
        # PROGRESSION takes precedence by design

    return verdicts


# ─────────────────────────────────────────────────────────────────────
# Phase 5 — Write
# ─────────────────────────────────────────────────────────────────────

def update_description_for_progression(current_desc, new_summary, new_due,
                                        meeting_title, meeting_date,
                                        source_uid, reason, now_iso):
    """Update description for a PROGRESSION write (no manual edit).

    Updates pipeline markers in-place via regex, then appends a progression block.
    The description field REPLACES the entire value, so we must read-modify-write.
    """
    normalised = normalise_due(new_due)
    new_hash = compute_state_hash(new_summary, normalised)

    desc = current_desc or ""

    # Update pipeline markers in-place
    desc = re.sub(r'(?m)^pipeline_last_wrote:.*$', f'pipeline_last_wrote: {now_iso}', desc)
    desc = re.sub(r'(?m)^pipeline_last_summary:.*$', f'pipeline_last_summary: {new_summary}', desc)
    desc = re.sub(r'(?m)^pipeline_last_due:.*$', f'pipeline_last_due: {normalised or "null"}', desc)
    desc = re.sub(r'(?m)^pipeline_state_hash:.*$', f'pipeline_state_hash: {new_hash}', desc)

    # If markers didn't exist (pre-pipeline item), add them so the item
    # gets manual edit protection going forward.
    if "pipeline_last_wrote:" not in desc:
        desc += (
            f"\npipeline_last_wrote: {now_iso}"
            f"\npipeline_last_summary: {new_summary}"
            f"\npipeline_last_due: {normalised or 'null'}"
            f"\npipeline_state_hash: {new_hash}"
        )

    # Append progression block
    progression = (
        f"\n---\n"
        f"Progression: {meeting_title} ({meeting_date})\n"
        f"Detail: {reason}\n"
        f"Updated: {now_iso}\n"
        f"Summary UID: {source_uid}"
    )
    desc += progression

    return desc


def append_progression_only(current_desc, meeting_title, meeting_date,
                            source_uid, reason, candidate_text,
                            candidate_due, now_iso):
    """Append progression context without updating markers (manual edit detected)."""
    desc = current_desc or ""

    progression = (
        f"\n---\n"
        f"Progression (text preserved — manual edit detected): "
        f"{meeting_title} ({meeting_date})\n"
        f"Detail: {reason}\n"
        f"Candidate text: {candidate_text}\n"
        f"Candidate due: {candidate_due or 'null'}\n"
        f"Noted: {now_iso}\n"
        f"Summary UID: {source_uid}"
    )
    desc += progression

    return desc


def write_results(verdicts, candidates, existing_items, meeting_title,
                  meeting_date, source_uid, now):
    """Phase 5: execute writes for classified candidates.

    Returns (new_count, prog_count, dup_count, skip_count, fail_count).
    """
    now_iso = now.isoformat()
    existing_summaries = {
        item["summary"]
        for item in existing_items
        if item["status"] == "needs_action"
    }

    new_count = 0
    prog_count = 0
    dup_count = 0
    skip_count = 0
    fail_count = 0

    for v in verdicts:
        ci = v.get("candidate_index")
        verdict = v["verdict"]

        if ci is None or ci < 0 or ci >= len(candidates):
            log.warning(f"Action pipeline: invalid candidate_index {ci}, skipping")
            skip_count += 1
            continue

        candidate = candidates[ci]

        if verdict == "NEW":
            try:
                item_summary = candidate["action_text"]

                # Check for summary text collision
                if item_summary in existing_summaries:
                    item_summary = f"{item_summary} ({meeting_date})"

                # Build description with metadata — use the ACTUAL summary
                # that will be written, not the original candidate text.
                # If collision disambiguation changed the text, the hash
                # and pipeline_last_summary must reflect the modified version.
                normalised = normalise_due(candidate["due_date"])
                state_hash = compute_state_hash(item_summary, normalised)

                description = (
                    f"Source: {candidate['source_meeting_title'] or 'unknown'}\n"
                    f"Meeting date: {candidate['source_meeting_date'] or 'unknown'}\n"
                    f"Extracted: {now_iso}\n"
                    f"Summary UID: {source_uid}\n"
                    f"pipeline_last_wrote: {now_iso}\n"
                    f"pipeline_last_summary: {item_summary}\n"
                    f"pipeline_last_due: {normalised or 'null'}\n"
                    f"pipeline_state_hash: {state_hash}"
                )

                kwargs = {
                    "entity_id": ACTIONS_ENTITY,
                    "item": item_summary,
                    "description": description,
                }
                if candidate["due_date"]:
                    kwargs["due_date"] = candidate["due_date"]

                service.call("todo", "add_item", **kwargs)

                # Track the new summary to prevent collisions within the batch
                existing_summaries.add(item_summary)
                new_count += 1

            except Exception as e:
                log.error(f"Action pipeline: failed to write NEW item '{candidate['action_text'][:40]}': {e}")
                fail_count += 1

        elif verdict == "PROGRESSION":
            matched_uid = v.get("matched_uid")
            matched_item = find_item_by_uid(existing_items, matched_uid)

            if not matched_item:
                log.warning(f"Action pipeline: PROGRESSION target {matched_uid} not found, skipping")
                skip_count += 1
                continue

            try:
                current_summary = matched_item["summary"]
                current_desc = matched_item.get("description", "") or ""
                current_due = matched_item.get("due")
                meta = parse_metadata(current_desc)

                reason = v.get("reason", "")
                updated_text = v.get("updated_text")
                updated_due = v.get("updated_due_date")

                manual_edit = has_been_manually_edited(matched_item, meta)

                if manual_edit:
                    # Manual edit detected — append context only, don't overwrite
                    new_desc = append_progression_only(
                        current_desc, meeting_title, meeting_date,
                        source_uid, reason, candidate["action_text"],
                        candidate["due_date"], now_iso,
                    )

                    service.call(
                        "todo", "update_item",
                        entity_id=ACTIONS_ENTITY,
                        item=current_summary,
                        description=new_desc,
                    )

                    notify(
                        "Action Pipeline: Manual Edit Preserved",
                        (
                            f"Item: {current_summary[:60]}\n"
                            f"Manual edit detected — progression context appended "
                            f"but summary/due not overwritten.\n"
                            f"Source: {meeting_title} ({meeting_date})"
                        ),
                        NOTIFICATION_ID_INFO,
                    )

                else:
                    # No manual edit — full update permitted
                    # Determine the new state after update
                    new_summary = updated_text if updated_text else current_summary
                    new_due = updated_due if updated_due else current_due

                    new_desc = update_description_for_progression(
                        current_desc, new_summary, new_due,
                        meeting_title, meeting_date, source_uid,
                        reason, now_iso,
                    )

                    kwargs = {
                        "entity_id": ACTIONS_ENTITY,
                        "item": current_summary,  # identifies the item
                        "description": new_desc,
                    }
                    if updated_text:
                        kwargs["rename"] = updated_text
                    if updated_due:
                        kwargs["due_date"] = updated_due

                    service.call("todo", "update_item", **kwargs)

                    # Update our tracking if summary changed
                    if updated_text:
                        existing_summaries.discard(current_summary)
                        existing_summaries.add(updated_text)

                prog_count += 1

            except Exception as e:
                log.error(
                    f"Action pipeline: failed to update PROGRESSION item "
                    f"'{matched_item['summary'][:40]}': {e}"
                )
                fail_count += 1

        elif verdict == "DUPLICATE":
            log.info(
                f"Action pipeline: DUPLICATE — '{candidate['action_text'][:50]}' "
                f"matched {v.get('matched_uid', '?')[:8]} — {v.get('reason', '')}"
            )
            dup_count += 1

        else:
            skip_count += 1

    return new_count, prog_count, dup_count, skip_count, fail_count


# ─────────────────────────────────────────────────────────────────────
# Dry-run reporting
# ─────────────────────────────────────────────────────────────────────

def report_dry_run(source_uid, meeting_title, meeting_date, candidates,
                   verdicts, existing_items):
    """Build and send the dry-run notification."""
    lines = [
        f"Summary: {source_uid[:8]} | Meeting: {meeting_title} ({meeting_date})",
        "",
    ]

    for v in verdicts:
        ci = v.get("candidate_index", "?")
        verdict = v["verdict"]
        reason = v.get("reason", "")

        if ci is not None and 0 <= ci < len(candidates):
            action_text = candidates[ci]["action_text"]
        else:
            action_text = "(invalid index)"

        lines.append(f"[{ci}] {verdict} — {action_text}")
        lines.append(f"  Reason: {reason}")

        if verdict == "PROGRESSION":
            matched = find_item_by_uid(existing_items, v.get("matched_uid"))
            matched_text = matched["summary"][:50] if matched else "?"
            lines.append(
                f"  Matched: {matched_text}, "
                f"update_text={v.get('updated_text')}, "
                f"update_due={v.get('updated_due_date')}"
            )
        elif verdict == "DUPLICATE":
            matched = find_item_by_uid(existing_items, v.get("matched_uid"))
            matched_text = matched["summary"][:50] if matched else "?"
            lines.append(f"  Matched: {matched_text}")

        lines.append("")

    notify("Action Pipeline: DRY RUN", "\n".join(lines), NOTIFICATION_ID_DRYRUN)


# ─────────────────────────────────────────────────────────────────────
# Ledger management
# ─────────────────────────────────────────────────────────────────────

def read_ledger():
    """Read all items from the pipeline ledger. Returns list or None on failure."""
    try:
        response = service.call(
            "todo", "get_items",
            entity_id=LEDGER_ENTITY,
            status=["needs_action"],
            return_response=True,
        )
        return response[LEDGER_ENTITY]["items"]
    except Exception as e:
        log.error(f"Action pipeline: cannot read ledger: {e}")
        return None


def build_ledger_lookup(ledger_items, now):
    """Build lookup sets from ledger items.

    Returns (complete_set, failed_set, processing_dict).
    processing_dict maps UID -> started_at string.
    """
    complete = set()
    failed = set()
    processing = {}

    for item in ledger_items:
        uid = item["summary"]  # ledger item summary = source summary UID
        meta = parse_metadata(item.get("description", ""))
        status = meta["_fields"].get("status", "")

        if status == "complete":
            complete.add(uid)
        elif status == "failed":
            failed.add(uid)
        elif status == "processing":
            processing[uid] = meta["_fields"].get("started_at", "")

    return complete, failed, processing


def is_lease_expired(started_at_str, now):
    """Check if a processing lease has exceeded the TTL."""
    try:
        lease_start = datetime.fromisoformat(started_at_str)
        if lease_start.tzinfo is None:
            lease_start = lease_start.replace(tzinfo=timezone.utc)
        return (now - lease_start).total_seconds() >= LEASE_TTL_SECONDS
    except (ValueError, TypeError):
        return True  # unparseable — treat as expired


def acquire_lease(summary_uid, meeting_date, meeting_title, now):
    """Write a 'processing' entry to the ledger. Returns True on success."""
    now_iso = now.isoformat()
    try:
        service.call(
            "todo", "add_item",
            entity_id=LEDGER_ENTITY,
            item=summary_uid,
            description=(
                f"status: processing\n"
                f"started_at: {now_iso}\n"
                f"source_meeting_date: {meeting_date or 'unknown'}\n"
                f"source_meeting_title: {meeting_title or 'unknown'}"
            ),
        )
        return True
    except Exception as e:
        notify(
            "Action Pipeline: FAILED",
            f"Cannot write ledger for {summary_uid[:8]}: {e}",
            NOTIFICATION_ID_ERROR,
        )
        return False


def reacquire_expired_lease(summary_uid, meeting_date, meeting_title, now):
    """Update a stale 'processing' ledger entry by removing and re-adding.

    todo.update_item replaces description, so we use it directly.
    Returns True on success.
    """
    now_iso = now.isoformat()
    try:
        service.call(
            "todo", "update_item",
            entity_id=LEDGER_ENTITY,
            item=summary_uid,
            description=(
                f"status: processing\n"
                f"started_at: {now_iso}\n"
                f"source_meeting_date: {meeting_date or 'unknown'}\n"
                f"source_meeting_title: {meeting_title or 'unknown'}"
            ),
        )
        notify(
            "Action Pipeline: Stale Lease Recovered",
            (
                f"Summary: {summary_uid[:8]}\n"
                f"Orphaned 'processing' lease recovered after TTL expiry.\n"
                f"Re-processing."
            ),
            NOTIFICATION_ID_INFO,
        )
        return True
    except Exception as e:
        notify(
            "Action Pipeline: FAILED",
            f"Cannot re-acquire lease for {summary_uid[:8]}: {e}",
            NOTIFICATION_ID_ERROR,
        )
        return False


def update_ledger_complete(summary_uid, candidate_count, write_count, now):
    """Update ledger entry from processing to complete."""
    now_iso = now.isoformat()
    try:
        service.call(
            "todo", "update_item",
            entity_id=LEDGER_ENTITY,
            item=summary_uid,
            description=(
                f"status: complete\n"
                f"candidate_count: {candidate_count}\n"
                f"write_count: {write_count}\n"
                f"completed_at: {now_iso}"
            ),
        )
    except Exception as e:
        # Non-critical — TTL will handle the stale processing lease
        log.warning(f"Action pipeline: ledger finalisation failed for {summary_uid[:8]}: {e}")


def update_ledger_failed(summary_uid, error_description, now):
    """Update ledger entry from processing to failed."""
    now_iso = now.isoformat()
    try:
        service.call(
            "todo", "update_item",
            entity_id=LEDGER_ENTITY,
            item=summary_uid,
            description=(
                f"status: failed\n"
                f"started_at: {now_iso}\n"
                f"error: {error_description}"
            ),
        )
    except Exception as e:
        log.warning(f"Action pipeline: ledger failure update failed for {summary_uid[:8]}: {e}")


def prune_ledger(now):
    """Delete complete/failed ledger entries older than 14 days."""
    ledger_items = read_ledger()
    if not ledger_items:
        return

    cutoff = now - timedelta(days=LEDGER_PRUNE_DAYS)

    for item in ledger_items:
        meta = parse_metadata(item.get("description", ""))
        status = meta["_fields"].get("status", "")

        if status not in ("complete", "failed"):
            continue

        started_at_str = meta["_fields"].get("started_at") or meta["_fields"].get("completed_at", "")
        try:
            ts = datetime.fromisoformat(started_at_str)
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            if ts < cutoff:
                service.call(
                    "todo", "remove_item",
                    entity_id=LEDGER_ENTITY,
                    item=item["summary"],
                )
                log.info(f"Action pipeline: pruned ledger entry {item['summary'][:8]}")
        except (ValueError, TypeError):
            continue


# ─────────────────────────────────────────────────────────────────────
# Per-summary orchestration
# ─────────────────────────────────────────────────────────────────────

def process_single_summary(summary_item, now, dry_run, ledger_processing):
    """Process a single meeting summary through Phases 2-5.

    ledger_processing is the dict of UID -> started_at for active processing leases,
    needed to handle expired lease re-acquisition.
    """
    uid = summary_item["uid"]
    summary_field = summary_item["summary"]
    description = summary_item.get("description", "")
    uid_short = uid[:8]

    # ── Extract meeting metadata early (needed for lease) ────────
    meeting_date, meeting_title = extract_meeting_metadata(description, summary_field)

    # ── Lease acquisition (skip in dry_run) ──────────────────────
    if not dry_run:
        if uid in ledger_processing:
            # Expired lease — re-acquire
            if not reacquire_expired_lease(uid, meeting_date, meeting_title, now):
                return
        else:
            # New lease
            if not acquire_lease(uid, meeting_date, meeting_title, now):
                return

    # ── Phase 2: Extract ─────────────────────────────────────────
    candidates, meeting_date, meeting_title, contract_violation = extract_actions(
        description, summary_field
    )

    if contract_violation:
        msg = f"Summary: {uid_short}\nContract violation — processing aborted."
        notify("Action Pipeline: Contract Violation", msg, NOTIFICATION_ID_ERROR)
        if not dry_run:
            update_ledger_failed(uid, "Contract violation: majority of action lines malformed", now)
        return

    if not candidates:
        log.info(f"Action pipeline: zero actions in summary {uid_short}")
        if not dry_run:
            update_ledger_complete(uid, 0, 0, now)
        return

    # ── Phase 3: Fetch existing actions ──────────────────────────
    existing_items = fetch_existing_actions(now)
    if existing_items is None:
        if not dry_run:
            update_ledger_failed(uid, "Cannot read existing actions", now)
        return

    # ── Phase 4: Classify ────────────────────────────────────────
    verdicts = classify(existing_items, candidates, meeting_title, meeting_date)
    if verdicts is None:
        if not dry_run:
            update_ledger_failed(uid, "AI classification failed", now)
        return

    # Post-classification collision resolution
    verdicts = resolve_collisions(verdicts)

    # Check for candidates that received no verdict
    classified_indices = {v.get("candidate_index") for v in verdicts}
    missing = [i for i in range(len(candidates)) if i not in classified_indices]
    if missing:
        # Safety bias: treat missing verdicts as unclassified, not silent drops.
        # Log them so C can see what the AI missed.
        missing_texts = [candidates[i]["action_text"][:50] for i in missing]
        log.warning(
            f"Action pipeline: AI returned no verdict for candidate(s) {missing}. "
            f"Actions: {missing_texts}"
        )
        # Add them as NEW with an explicit reason — missed actions are worse
        # than false positives.
        for i in missing:
            verdicts.append({
                "candidate_index": i,
                "verdict": "NEW",
                "matched_uid": None,
                "reason": "No verdict returned by AI — added as NEW per safety bias.",
            })

    # ── Phase 5: Write or dry-run report ─────────────────────────
    if dry_run:
        report_dry_run(uid, meeting_title, meeting_date, candidates, verdicts, existing_items)
        return

    new_count, prog_count, dup_count, skip_count, fail_count = write_results(
        verdicts, candidates, existing_items,
        meeting_title, meeting_date, uid, now,
    )

    # ── Ledger finalisation ──────────────────────────────────────
    total_writes = new_count + prog_count
    total_ok = total_writes + dup_count + skip_count

    if total_ok > 0:
        update_ledger_complete(uid, len(candidates), total_writes, now)
    else:
        update_ledger_failed(uid, f"All {fail_count} writes failed", now)

    # ── Notify ───────────────────────────────────────────────────
    notify(
        "Action Pipeline: Complete",
        (
            f"Summary: {uid_short}\n"
            f"Meeting: {meeting_title} ({meeting_date})\n"
            f"Candidates: {len(candidates)}\n"
            f"NEW: {new_count} | PROGRESSION: {prog_count} | "
            f"DUPLICATE: {dup_count} | Skipped: {skip_count}"
            + (f" | Failed: {fail_count}" if fail_count > 0 else "")
        ),
        NOTIFICATION_ID_LATEST,
    )


# ─────────────────────────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────────────────────────

@service
def action_extraction_pipeline(dry_run=False):
    """Main pipeline entry point. Called by trigger automation.

    Args:
        dry_run: If True, classify but don't write. No ledger updates.
    """
    now = datetime.now(timezone.utc)

    # ── Read meeting summaries ───────────────────────────────────
    try:
        response = service.call(
            "todo", "get_items",
            entity_id=SUMMARY_ENTITY,
            status=["needs_action"],
            return_response=True,
        )
        summary_items = response[SUMMARY_ENTITY]["items"]
    except Exception as e:
        notify(
            "Action Pipeline: FAILED",
            f"Cannot read {SUMMARY_ENTITY}: {e}",
            NOTIFICATION_ID_ERROR,
        )
        return

    # ── Read ledger ──────────────────────────────────────────────
    if not dry_run:
        ledger_items = read_ledger()
        if ledger_items is None:
            notify(
                "Action Pipeline: FAILED",
                "Cannot read ledger — aborting.",
                NOTIFICATION_ID_ERROR,
            )
            return
        ledger_complete, ledger_failed, ledger_processing = build_ledger_lookup(
            ledger_items, now
        )
    else:
        # Dry run still needs to identify which summaries to process,
        # but uses empty sets so nothing is excluded (re-runnable).
        ledger_items = read_ledger() or []
        ledger_complete, ledger_failed, ledger_processing = build_ledger_lookup(
            ledger_items, now
        )

    # ── Identify unprocessed summaries ───────────────────────────
    if dry_run:
        # Dry-run processes ALL summaries regardless of ledger state,
        # making it fully repeatable for validation.
        unprocessed = list(summary_items)
    else:
        unprocessed = []
        for item in summary_items:
            uid = item["uid"]
            if uid in ledger_complete or uid in ledger_failed:
                continue  # Already processed or failed (delete ledger entry to retry)
            if uid in ledger_processing:
                if is_lease_expired(ledger_processing[uid], now):
                    pass  # Expired lease — will be re-acquired in process_single_summary
                else:
                    continue  # Active lease, skip
            unprocessed.append(item)

    if not unprocessed:
        return  # Silent abort — nothing to process

    # Sort chronologically (oldest first)
    unprocessed.sort(key=lambda x: x.get("due", ""))

    # ── Process each summary sequentially ────────────────────────
    for summary_item in unprocessed:
        process_single_summary(summary_item, now, dry_run, ledger_processing)

        # NOTE: existing actions are re-fetched inside process_single_summary
        # at Phase 3 for each iteration, so new items from previous iterations
        # are visible to subsequent classifications.

    # ── Ledger pruning (after all summaries processed) ───────────
    if not dry_run:
        prune_ledger(now)
