# Meeting Action Extraction Pipeline — Implementation Specification

This document is an appendix to `action-extraction-plan-v2.1.md`. It resolves every implementation-level ambiguity in the plan to the point where an AI coding agent can execute without improvisation. Read the plan first; this document assumes full familiarity with the pipeline phases.

---

## 1. Execution Surface

**Decision: pyscript.**

`python_script` is sandboxed — no `import hashlib`, no `import json`, no `import re`. This pipeline requires all three. `pyscript` is confirmed available on the HA instance and supports full Python imports, HA service calls via `service.call()`, and `task.executor()` for blocking operations.

The pipeline is implemented as a single pyscript function registered as an HA service. The trigger automation calls this service. All logic from Phase 2 through Phase 5 (extraction, fetch, classification, write) lives in one pyscript file. No logic is split across YAML, Jinja, or helpers.

**File location:** `/config/pyscript/action_extraction_pipeline.py` for the pipeline logic. `/config/packages/work/work.yaml` for the trigger automation. See section 16 for rationale.

---

## 2. Pre-existing Entity Status

**`todo.c_work_actions`**: exists. Currently contains one test item (`Test entry from Claude chat`, UID `893ce524-18c5-11f1-8f48-88aedd0fdad7`). This test item should be removed before go-live but does not affect pipeline development.

**`todo.action_pipeline_ledger`**: does not exist. Must be created as a Local To-do list in HA before first run. No special configuration required.

---

## 3. Critical Service Call Correction

The plan states "update by UID" in several places. **This is wrong at the service call level.** HA's `todo.update_item` identifies the target item by its current summary text (`item` field), not by UID. UIDs are used internally by the pipeline to track and match items, but the actual service call must pass the item's current summary text.

This has two implications:

1. When calling `todo.update_item`, always pass the item's current `summary` value (as read from `get_items`) in the `item` field. The `rename` field carries the new summary text if it's being changed.

2. If two items in the same todo list have identical summary text, the update is ambiguous and HA's behaviour is undefined. The pipeline must ensure it never creates duplicate summary text in `todo.c_work_actions`. Before writing a NEW item, check that no existing active item has the same summary. If a collision exists, append the source meeting date in parentheses to disambiguate.

Similarly, `todo.remove_item` identifies by summary text, not UID.

---

## 4. Service Call Reference

**In pyscript, all HA services are called natively — no REST calls needed.** The Nabu Casa URL and bearer token (defined in the ha-development skill) exist for manual testing and for Claude Bridge operations, but the pipeline uses pyscript's direct service access.

```python
# Read todo items (both statuses in one call)
response = service.call(
    "todo", "get_items",
    entity_id="todo.c_work_actions",
    status=["needs_action", "completed"],
    return_response=True
)
items = response["todo.c_work_actions"]["items"]

# Add a todo item
service.call(
    "todo", "add_item",
    entity_id="todo.c_work_actions",
    item="Action text here",
    due_date="2026-03-15",       # optional, omit if null
    description="Metadata here"   # optional
)

# Update a todo item (identify by CURRENT summary text)
# IMPORTANT: the description field REPLACES the entire description.
# To append, you must read the current description first, concatenate,
# and write the full combined string back.
service.call(
    "todo", "update_item",
    entity_id="todo.c_work_actions",
    item="Current summary text",         # identifies the item
    rename="New summary text",           # optional, only if changing
    due_date="2026-03-20",               # optional, only if changing
    description="Full replacement description"  # optional, REPLACES entire description
)

# Remove a todo item (identify by CURRENT summary text)
service.call(
    "todo", "remove_item",
    entity_id="todo.c_work_actions",
    item="Summary text to remove"
)

# AI classification
response = service.call(
    "ai_task", "generate_data",
    task_name="action_classification",
    instructions="<full prompt here>",
    entity_id="ai_task.openai_ai_task",
    structure={
        "verdicts": {
            "selector": {"text": {"multiline": True}},
            "description": "JSON array of verdict objects",
            "required": True
        }
    },
    return_response=True
)
verdicts_json = response["data"]["verdicts"]  # string containing JSON array
verdicts = json.loads(verdicts_json)

# Persistent notification
service.call(
    "persistent_notification", "create",
    title="Action Pipeline: Run Complete",
    message="Processed summary 80dbfbf4... | 3 candidates | 2 written | 1 duplicate",
    notification_id="action_pipeline_latest"
)
```

**Important pyscript note:** `service.call()` syntax may vary between pyscript versions. In some versions it's `hass.services.call("domain", "service", **kwargs)` or `service.call("domain", "service", **data)`. The implementer must verify the exact pyscript API available on this instance.

**Critical: description field is replace-only.** The `todo.update_item` service replaces the entire description, it does not append. Every progression write must read the current description, concatenate the new block, and write the full string back:

```python
def append_progression_to_item(entity_id: str, item_summary: str, new_block: str,
                                rename: str = None, due_date: str = None,
                                update_pipeline_markers: dict = None):
    """Append a progression block to an existing item's description.

    Reads current description, appends new_block after a --- separator,
    optionally updates pipeline_last_* markers in the header, and writes
    the full combined description back.
    """
    # Read current item to get existing description
    response = service.call(
        "todo", "get_items",
        entity_id=entity_id,
        status=["needs_action", "completed"],
        return_response=True
    )
    current_desc = ""
    for item in response[entity_id]["items"]:
        if item["summary"] == item_summary:
            current_desc = item.get("description", "") or ""
            break

    # If updating pipeline markers, replace them in the header
    if update_pipeline_markers:
        for key, value in update_pipeline_markers.items():
            # Replace existing marker line
            import re
            pattern = rf"^{re.escape(key)}:.*$"
            replacement = f"{key}: {value}"
            if re.search(pattern, current_desc, re.MULTILINE):
                current_desc = re.sub(pattern, replacement, current_desc, count=1, flags=re.MULTILINE)

    # Append new progression block
    full_desc = current_desc.rstrip() + "\n---\n" + new_block

    # Build update kwargs
    update_kwargs = {
        "entity_id": entity_id,
        "item": item_summary,
        "description": full_desc
    }
    if rename:
        update_kwargs["rename"] = rename
    if due_date:
        update_kwargs["due_date"] = due_date

    service.call("todo", "update_item", **update_kwargs)
```

---

## 5. Metadata Parsing Specification

Both the ledger descriptions and action item descriptions use the same format: line-separated `key: value` pairs with optional `---` separators for progression history blocks.

**Parser rules:**

```python
def parse_metadata(description: str) -> dict:
    """Parse key: value pairs from a description field.
    Returns dict of header values (before first ---) and a list of
    progression blocks (after each ---) if present."""

    if not description:
        return {"_fields": {}, "_progressions": []}

    result = {"_fields": {}, "_progressions": []}
    current_block = []
    past_first_separator = False

    for line in description.split("\n"):
        stripped = line.strip()

        if stripped == "---":
            # Separator — start a new progression block
            if current_block:
                result["_progressions"].append("\n".join(current_block))
                current_block = []
            past_first_separator = True
            continue

        if ": " in stripped and not past_first_separator:
            # Only parse header fields (before first ---).
            # Progression blocks may contain keys like "Summary UID"
            # that would overwrite the original source metadata.
            key, value = stripped.split(": ", 1)
            key = key.strip().lower().replace(" ", "_")
            result["_fields"][key] = value.strip()

        if stripped:
            current_block.append(stripped)

    if current_block:
        result["_progressions"].append("\n".join(current_block))

    return result
```

**Field access examples:**

```python
meta = parse_metadata(item["description"])
status = meta["_fields"].get("status")                          # for ledger
last_wrote = meta["_fields"].get("pipeline_last_wrote")         # for action items
last_summary = meta["_fields"].get("pipeline_last_summary")     # for edit detection
state_hash = meta["_fields"].get("pipeline_state_hash")         # for edit detection
started_at = meta["_fields"].get("started_at")                  # for lease TTL
```

**Edge case handling:**
- If description is null/empty, return empty fields and empty progressions.
- Header fields (before the first `---`) are the canonical metadata. Progression blocks below may contain similarly-named keys (e.g., `Summary UID`) but these are not parsed into `_fields` — they exist only as raw text within their progression block.
- Unknown keys in the header section are stored without error. The parser is permissive.
- For ledger items (which have no `---` separators), all key-value pairs are parsed into `_fields`.

---

## 6. Due Date Normalisation and Hash Canonical Form

HA may return the `due` field as a date-only string (`2026-03-15`) or as a full ISO datetime (`2026-03-15T00:00:00+00:00`). The pipeline always normalises to date-only format before storing, hashing, or comparing.

```python
import hashlib

def normalise_due(due_value: str | None) -> str | None:
    """Normalise a due date to YYYY-MM-DD format, or None.

    Handles: None, empty string, date-only, full ISO datetime.
    """
    if not due_value:
        return None
    # If it contains 'T', it's a datetime — take the date part
    if "T" in due_value:
        return due_value.split("T")[0]
    # Already date-only or unknown format — return stripped
    return due_value.strip()


def compute_state_hash(summary_text: str, due_date: str | None) -> str:
    """Compute SHA-256 hash of pipeline-written state for edit detection.

    Canonical form: summary_text + null byte + normalised_due_date_string
    Null due date is represented as empty string.
    All inputs are stripped of leading/trailing whitespace before hashing.
    Due dates are normalised to YYYY-MM-DD before hashing.
    """
    normalised_due = normalise_due(due_date) or ""
    canonical = f"{summary_text.strip()}\x00{normalised_due}"
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
```

**Why null byte separator:** prevents `("action text2026", "")` and `("action text", "2026")` from producing the same hash. A null byte cannot appear in either field.

**Verification logic in Phase 5:**

```python
def has_been_manually_edited(item: dict, meta: dict) -> bool:
    """Check if an action item has been edited by C since the pipeline last wrote it."""
    stored_hash = meta["_fields"].get("pipeline_state_hash")
    if not stored_hash:
        # No pipeline metadata — item predates the pipeline or metadata was removed.
        # Treat as unmodified (allow update).
        return False

    # Normalise the current due date before comparison — HA may return
    # a full datetime even though the pipeline wrote a date-only string.
    current_due_normalised = normalise_due(item.get("due"))

    current_hash = compute_state_hash(
        item["summary"],
        current_due_normalised
    )
    if current_hash == stored_hash:
        return False

    # Hash mismatch — try fallback string comparison in case hash was corrupted
    stored_summary = meta["_fields"].get("pipeline_last_summary")
    stored_due = meta["_fields"].get("pipeline_last_due")

    if stored_summary is None:
        return False  # no fallback data either — treat as unmodified

    summary_match = (item["summary"].strip() == stored_summary.strip())
    # Normalise both sides for due date comparison
    due_match = (normalise_due(item.get("due")) == normalise_due(stored_due))

    return not (summary_match and due_match)
```

---

## 7. Completed Item Temporal Truncation

HA todo items have no native `completed_at` timestamp. Available fields on completed items are: `summary`, `uid`, `status`, `due`, `description`.

**Truncation source for pipeline-created items:** the `pipeline_last_wrote` field in the description metadata. If this timestamp is older than 90 days, exclude from the comparison set.

**Items without pipeline metadata** (manually added by C and then completed): include unconditionally. These are rare and won't cause meaningful context growth. The absence of metadata means we can't age them, and excluding them risks false-positive re-addition.

**Items with pipeline metadata but no `pipeline_last_wrote`** (possible in degraded states): include unconditionally.

```python
from datetime import datetime, timedelta, timezone

COMPLETED_LOOKBACK_DAYS = 90

def should_include_completed(item: dict, now: datetime) -> bool:
    """Determine if a completed item should be included in the AI comparison set."""
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
        return True  # unparseable timestamp — include to be safe
```

---

## 8. AI Task Prompt

### 8a. Structure parameter

```python
CLASSIFICATION_STRUCTURE = {
    "verdicts": {
        "selector": {"text": {"multiline": True}},
        "description": "A JSON array of verdict objects. Each object must have: candidate_index (integer), verdict (string: NEW|PROGRESSION|DUPLICATE), matched_uid (string or null), reason (string). PROGRESSION objects may also have: updated_due_date (string YYYY-MM-DD or null), updated_text (string or null).",
        "required": True
    }
}
```

The `structure` parameter ensures the AI returns a response with a `verdicts` field. The field value is a JSON string that the pipeline parses.

### 8b. Instructions template

This is the full prompt text. Variable placeholders are wrapped in `{curly_braces}`.

```
You are classifying candidate work actions from a meeting summary against an existing action list.

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

The "verdicts" field must contain ONLY the JSON array. No commentary, no markdown, no preamble.
```

### 8c. Formatting the existing actions block

```python
def format_existing_actions(items: list[dict]) -> str:
    lines = []
    for item in items:
        uid = item["uid"]
        status = item["status"]
        summary = item["summary"]
        due = item.get("due", "no date")
        meta = parse_metadata(item.get("description", ""))
        source = meta["_fields"].get("source", "unknown")
        meeting_date = meta["_fields"].get("meeting_date", "unknown")

        line = f"[{uid}] [{status}] {summary} | Due: {due} | Source: {source}, {meeting_date}"

        # Include recent progression history if present
        if meta["_progressions"]:
            recent = meta["_progressions"][-1]  # most recent progression only
            line += f"\n  Last progression: {recent}"

        lines.append(line)

    if not lines:
        return "(No existing actions)"

    return "\n".join(lines)
```

### 8d. Formatting the candidate actions block

```python
def format_candidate_actions(candidates: list[dict]) -> str:
    lines = []
    for i, c in enumerate(candidates):
        due = c["due_date"] or "no date"
        lines.append(f"[{i}] {c['action_text']} | Due: {due}")
    return "\n".join(lines)
```

### 8e. Retry wrapper

If the first `ai_task.generate_data` call returns a `verdicts` string that does not parse as valid JSON, send exactly one retry with the following modified instructions (prepended to the original prompt):

```
IMPORTANT: Your previous response in the "verdicts" field was not valid JSON. You MUST return a valid JSON array in the "verdicts" field. The array must conform exactly to the schema specified below. Return ONLY the JSON array — no markdown code fences, no commentary, no explanation outside the array.

```

If the retry also fails to parse, abort. Log the raw response from both attempts.

---

## 9. Post-Classification Collision Resolution

After parsing the AI verdicts, apply these deterministic corrections before writes:

```python
def resolve_collisions(verdicts: list[dict]) -> list[dict]:
    """Apply deterministic post-classification rules.

    Assumes candidate_index reflects extraction order (top-to-bottom
    within the ## My Actions section). Higher index = appears later
    in the action list = more likely to be the most refined version.
    This is guaranteed by the Phase 2 extraction loop.
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
        duplicates = [v for v in targeting if v["verdict"] == "DUPLICATE"]

        # Many-to-one PROGRESSION: keep only the latest candidate (highest index = latest in meeting)
        if len(progressions) > 1:
            keeper = max(progressions, key=lambda v: v["candidate_index"])
            for v in progressions:
                if v is not keeper:
                    v["verdict"] = "DUPLICATE"
                    v["reason"] = f"Reclassified: another candidate ({keeper['candidate_index']}) is a later progression against same item."

        # PROGRESSION + DUPLICATE against same UID: PROGRESSION wins, DUPLICATE stays
        # (no change needed — this is already the correct state)

    return verdicts
```

---

## 10. Trigger Automation YAML

```yaml
alias: "Action Extraction Pipeline Trigger"
description: "Triggers action extraction when a new meeting summary arrives"
mode: single
triggers:
  - trigger: state
    entity_id: todo.meeting_summaries
actions:
  - delay:
      seconds: 5
  - action: pyscript.action_extraction_pipeline
    data:
      dry_run: false
```

The 5-second delay is a debounce — it allows the todo entity state to settle after the upstream pipeline writes the summary item. Without it, the trigger might fire on an intermediate state.

`pyscript.action_extraction_pipeline` is the service exposed by the pyscript file (see section 14).

---

## 11. Ledger Error Handling

If the ledger (`todo.action_pipeline_ledger`) cannot be read in Phase 1:

```python
try:
    ledger_response = service.call(
        "todo", "get_items",
        entity_id="todo.action_pipeline_ledger",
        status=["needs_action"],
        return_response=True
    )
    ledger_items = ledger_response["todo.action_pipeline_ledger"]["items"]
except Exception as e:
    # Ledger unreadable — cannot verify idempotency.
    # ABORT. Do not proceed without the ledger.
    service.call(
        "persistent_notification", "create",
        title="Action Pipeline: FAILED",
        message=f"Cannot read ledger: {e}",
        notification_id="action_pipeline_error"
    )
    return
```

If a ledger write fails (lease acquisition or finalisation):

```python
try:
    service.call(
        "todo", "add_item",
        entity_id="todo.action_pipeline_ledger",
        item=summary_uid,
        description=f"status: processing\nstarted_at: {now_iso}\nsource_meeting_date: {meeting_date}\nsource_meeting_title: {meeting_title}"
    )
except Exception as e:
    # Cannot acquire lease — abort.
    service.call(
        "persistent_notification", "create",
        title="Action Pipeline: FAILED",
        message=f"Cannot write ledger for {summary_uid}: {e}",
        notification_id="action_pipeline_error"
    )
    return
```

Ledger finalisation failure (updating processing → complete) is non-critical — the TTL mechanism will expire the stale lease on next run. Log it but do not undo the writes already made.

---

## 12. Sequential Processing of Backlogged Summaries

When Phase 1 finds multiple unprocessed summary UIDs, they are processed in a single automation execution as an internal loop. With `mode: single`, the automation will not re-trigger for each — the loop must handle all of them.

```python
# Phase 1: build ledger lookup sets from fetched ledger items
ledger_complete = set()    # UIDs with status: complete
ledger_failed = set()      # UIDs with status: failed (block until manually deleted)
ledger_processing = {}     # UID -> started_at for active leases

for ledger_item in ledger_items:
    uid = ledger_item["summary"]  # ledger item summary = source summary UID
    meta = parse_metadata(ledger_item.get("description", ""))
    status = meta["_fields"].get("status", "")
    started_at = meta["_fields"].get("started_at", "")

    if status == "complete":
        ledger_complete.add(uid)
    elif status == "failed":
        ledger_failed.add(uid)
    elif status == "processing":
        ledger_processing[uid] = started_at

# Identify unprocessed summaries
# A summary is unprocessed if its UID is not complete, not failed,
# and not in an active (non-expired) processing lease.
now = datetime.now(timezone.utc)
unprocessed = []
for summary_item in summary_items:
    uid = summary_item["uid"]
    if uid in ledger_complete or uid in ledger_failed:
        continue
    if uid in ledger_processing:
        # Check TTL
        try:
            lease_start = datetime.fromisoformat(ledger_processing[uid])
            if lease_start.tzinfo is None:
                lease_start = lease_start.replace(tzinfo=timezone.utc)
            if (now - lease_start).total_seconds() < LEASE_TTL_SECONDS:
                continue  # active lease, skip
            # Expired lease — will be re-acquired below
        except (ValueError, TypeError):
            pass  # unparseable timestamp — treat as expired
    unprocessed.append(summary_item)

# Sort chronologically (oldest first)
unprocessed.sort(key=lambda x: x.get("due", ""))

# Process each sequentially
for summary_item in unprocessed:
    process_single_summary(summary_item, now, dry_run)
    # Re-fetch existing actions before next iteration,
    # because the previous iteration may have written new items
```

The re-fetch between iterations is critical. If summary A creates a new action, summary B must see it in the comparison set or it will be classified as NEW again.

---

## 13. Logging Format Templates

All notifications use `persistent_notification.create`. The `notification_id` field allows updating/replacing previous notifications.

**Successful run:**
```
title: "Action Pipeline: Complete"
message: "Summary: {summary_uid_short}\nMeeting: {meeting_title} ({meeting_date})\nCandidates: {count}\nNEW: {new_count} | PROGRESSION: {prog_count} | DUPLICATE: {dup_count} | Skipped: {skip_count}"
notification_id: "action_pipeline_latest"
```

**Failed run:**
```
title: "Action Pipeline: FAILED"
message: "Summary: {summary_uid_short}\nPhase: {phase_number}\nError: {error_description}"
notification_id: "action_pipeline_error"
```

**Contract violation:**
```
title: "Action Pipeline: Contract Violation"
message: "Summary: {summary_uid_short}\nMalformed lines: {bad_count}/{total_count}\nThreshold exceeded — processing aborted."
notification_id: "action_pipeline_error"
```

**AI parse failure (both attempts):**
```
title: "Action Pipeline: AI Response Failed"
message: "Summary: {summary_uid_short}\nBoth attempts returned unparseable output.\nAttempt 1: {first_50_chars}...\nAttempt 2: {first_50_chars}..."
notification_id: "action_pipeline_error"
```

**Manual edit detected during PROGRESSION:**
```
title: "Action Pipeline: Manual Edit Preserved"
message: "Item: {item_summary_short}\nManual edit detected — progression context appended to description but summary/due not overwritten.\nSource: {meeting_title} ({meeting_date})"
notification_id: "action_pipeline_info"
```

**Lease TTL triggered:**
```
title: "Action Pipeline: Stale Lease Recovered"
message: "Summary: {summary_uid_short}\nOrphaned 'processing' lease from {started_at} recovered after TTL expiry.\nRe-processing."
notification_id: "action_pipeline_info"
```

`{summary_uid_short}` is the first 8 characters of the UID for readability.

---

## 14. Dry-Run Mode

The pipeline function accepts a `dry_run` parameter (boolean, default `false`).

When `dry_run=true`:

- Phase 1 executes the snapshot diff to identify unprocessed summaries, but **skips lease acquisition** (no ledger write). This allows the same summary to be re-run in dry-run mode repeatedly without blocking.
- Phases 2–4 execute normally (extract, fetch existing, classify).
- Phase 5 does NOT write to `todo.c_work_actions`. Instead, it builds a full text report of what would have been written.
- The ledger is NOT updated (no lease, no completion record).
- A persistent notification is created with the full dry-run report.

```
title: "Action Pipeline: DRY RUN"
message: "Summary: {uid_short} | Meeting: {title} ({date})\n\n{for each candidate:}\n[{index}] {verdict} — {action_text}\n  Reason: {reason}\n  {if PROGRESSION: matched → {matched_summary}, update_text={updated_text}, update_due={updated_due}}\n  {if DUPLICATE: matched → {matched_summary}}\n{end for}"
notification_id: "action_pipeline_dryrun"
```

For the validation protocol (processing all historical summaries), run the pipeline in dry-run mode once per summary in chronological order. Since dry-run doesn't write to the action list, the second and subsequent summaries won't see the simulated writes from earlier ones. To do a proper sequential simulation, a separate validation script should be written that maintains an in-memory action list and simulates writes — but for initial prompt validation, running each summary independently in dry-run mode is sufficient to verify that the AI classifies sensibly.

---

## 15. Pyscript Service Registration Skeleton

```python
"""Meeting action extraction pipeline.

Registered as service: pyscript.action_extraction_pipeline
Called by automation with: dry_run (bool)
"""

import json
import hashlib
import re
from datetime import datetime, timedelta, timezone

# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────

SUMMARY_ENTITY = "todo.meeting_summaries"
ACTIONS_ENTITY = "todo.c_work_actions"
LEDGER_ENTITY = "todo.action_pipeline_ledger"
AI_ENTITY = "ai_task.openai_ai_task"
LEASE_TTL_SECONDS = 300
COMPLETED_LOOKBACK_DAYS = 90
NOTIFICATION_ID_LATEST = "action_pipeline_latest"
NOTIFICATION_ID_ERROR = "action_pipeline_error"
NOTIFICATION_ID_INFO = "action_pipeline_info"
NOTIFICATION_ID_DRYRUN = "action_pipeline_dryrun"


# ──────────────────────────────────────────────
# Helper functions
# ──────────────────────────────────────────────

def parse_metadata(description):
    # ... as defined in section 5

def normalise_due(due_value):
    # ... as defined in section 6

def compute_state_hash(summary_text, due_date):
    # ... as defined in section 6

def has_been_manually_edited(item, meta):
    # ... as defined in section 6

def should_include_completed(item, now):
    # ... as defined in section 7

def format_existing_actions(items):
    # ... as defined in section 8c

def format_candidate_actions(candidates):
    # ... as defined in section 8d

def resolve_collisions(verdicts):
    # ... as defined in section 9

def append_progression_to_item(entity_id, item_summary, new_block, **kwargs):
    # ... as defined in section 4 (read-append-write pattern)

def notify(title, message, notification_id):
    service.call(
        "persistent_notification", "create",
        title=title, message=message, notification_id=notification_id
    )

def extract_actions(description):
    """Phase 2: deterministic extraction from summary description."""
    # ... implements section extraction, action line parsing,
    #     defensive split validation, intra-summary dedup

def build_prompt(existing_items, candidates, meeting_title, meeting_date):
    """Build the full ai_task instructions string."""
    # ... uses templates from section 8b

def classify(existing_items, candidates, meeting_title, meeting_date):
    """Phase 4: AI classification with one retry on parse failure."""
    # ... calls ai_task.generate_data, parses response,
    #     retries once on JSON parse failure

def write_results(verdicts, candidates, existing_items, meeting_title, meeting_date, source_uid, dry_run):
    """Phase 5: write NEW/PROGRESSION items, skip DUPLICATE, respect manual edits."""
    # ... implements all write operations from plan section Phase 5


# ──────────────────────────────────────────────
# Main pipeline
# ──────────────────────────────────────────────

@service
def action_extraction_pipeline(dry_run=False):
    """Main entry point. Called by trigger automation."""
    now = datetime.now(timezone.utc)

    # Phase 1: snapshot diff + lease acquisition
    # ... fetch summaries, fetch ledger, identify unprocessed, acquire lease

    # Loop over unprocessed summaries (section 12)
    for summary_item in unprocessed:
        # Phase 2: extract
        # Phase 3: fetch existing (re-fetch each iteration)
        # Phase 4: classify
        # Phase 5: write (or dry-run report)
        # Ledger finalisation
        pass

    # Ledger pruning
    # ... delete complete/failed entries older than 14 days
```

This skeleton is the structural contract. The implementer fills in function bodies using the specifications above. Every function signature, every constant, every service call pattern is defined. No improvisation required.

---

## 16. File Locations

**Pyscript file:** `/config/pyscript/action_extraction_pipeline.py`
Pyscript has its own directory convention separate from the packages structure. The file lives here and is discoverable by pyscript automatically.

**Trigger automation YAML:** `/config/packages/work/work.yaml`
A new `work` package. This is the domain-level home for everything related to C's job — meeting transcript pipeline, action extraction, Pico delivery, and any future work tooling. The package YAML references the pyscript service; the pyscript file doesn't need to know about the package structure.

The implementer should create both directories if they don't exist (`mkdir -p`).
