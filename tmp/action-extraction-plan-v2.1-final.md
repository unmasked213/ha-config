# Meeting Action Extraction Pipeline — Implementation Plan v2.1

## Context

This plan describes an automated pipeline that extracts personal action items from meeting summaries and populates a dedicated todo list in Home Assistant. The system owner uses this todo list to track work obligations. Errors in this pipeline — missed actions, false duplicates, phantom entries — have direct professional consequences. Treat every design decision as high-stakes.

The system owner is referred to as **C** throughout. C is the device owner in all meeting transcripts and the person whose actions are being tracked.

### Changelog from v1

Six specific improvements incorporated from adversarial review:

1. **Trigger mechanism**: replaced vague "state change" trigger with explicit snapshot-diff model that identifies exactly which item is new.
2. **Processing lease**: idempotency ledger now uses two-phase state (processing → complete) to prevent concurrent runs from double-writing.
3. **Manual edit protection**: pipeline tracks its own last-written state per action item and will not overwrite user-curated text.
4. **Temporal scoping for completed items**: completed actions are no longer treated as permanent duplicate blockers — recurrence is permitted when temporal and contextual signals indicate a new obligation instance.
5. **Intra-summary deduplication**: exact-duplicate lines within a single summary are collapsed before classification.
6. **One retry on malformed AI output**: a single retry with a format-correction wrapper is permitted before aborting.

Everything else from v1 is preserved. No new abstractions, no new verdict categories, no additional AI calls. The pipeline remains a single-pass design with conservative bias toward adding rather than dropping.

### Changelog from v2

Five hardening fixes incorporated from second adversarial review:

7. **Lease TTL**: stale `processing` leases now expire after 300 seconds, preventing permanent deadlock if the pipeline crashes mid-execution.
8. **Automation concurrency control**: trigger automation must use `mode: single` to prevent overlapping runs at the HA engine level, reducing the ledger's role to crash recovery rather than real-time race prevention.
9. **Defensive split validation**: the `rsplit` parser now validates the right-hand side against a date regex before accepting the split, preventing pipe characters in action text from corrupting extraction.
10. **Completed item temporal truncation**: only completed items from the last 90 days are included in the AI prompt, preventing unbounded context growth.
11. **Ledger pruning**: `complete` and `failed` ledger entries older than 14 days are cleaned up on each run. Pipeline state hash added alongside human-readable metadata for programmatic integrity verification.

**Critical correction from implementation discovery:** HA's `todo.update_item` and `todo.remove_item` identify target items by their current summary text, not by UID. The plan refers to updating "by UID" conceptually (UIDs are used internally for matching and tracking), but the actual service calls must pass the item's current summary string. See the implementation specification for exact service call patterns.

---

## System Landscape

| Entity | Role |
|---|---|
| `todo.meeting_summaries` | Source. Structured meeting summaries land here via an existing IMAP → Python → HA pipeline. Each item contains a markdown description with extracted sections including `## My Actions`. |
| `todo.meeting_transcripts` | Reference. Full verbatim transcripts matched by timestamp to summaries. Not read by this pipeline unless future phases require disambiguation. |
| `todo.c_work_actions` | Target. C's personal work action list. This pipeline is the sole automated writer. C may also add, complete, edit, or remove items manually at any time. |

---

## Source Data Contract

Every item in `todo.meeting_summaries` has the following structure.

**`summary` field** (the item title): format is `MM-DD Meeting Title|transcript_filename`. The date prefix is the meeting date. The pipe-delimited filename links to the corresponding transcript.

**`description` field**: a markdown document with consistent section headers. The section relevant to this pipeline is `## My Actions`. Each action within that section follows the format:

```
- Action description text | YYYY-MM-DD
- Action description text | None
```

The delimiter is ` | ` (space-pipe-space). The date is either an ISO date or the literal string `None`. There are no sub-items, no nested lists, no multi-line actions. Every action is a single line beginning with `- `.

**`due` field**: an ISO 8601 timestamp representing when the summary was processed, not the meeting date. The meeting date is embedded in the summary title and in the `## Meeting` metadata block within the description.

This format has been validated across all existing summaries and is produced by a controlled prompt. Deviations from this format are logged as errors, not silently tolerated.

**Contract violation threshold**: if more than half the action lines in a single summary fail to parse against the expected format, the entire summary is marked as failed-contract and processing stops for that summary. Partial corruption should not produce partial writes.

---

## Pipeline Phases

### Phase 1 — Trigger and Lease Acquisition

#### Trigger mechanism

HA todo entities do not emit clean per-item-added events. A state change on `todo.meeting_summaries` indicates something changed at the entity level, but not what. The automation must determine which item is new.

**Automation concurrency control:** the trigger automation must be configured with `mode: single`. This guarantees that HA will never run two instances of this pipeline simultaneously, even if `todo.meeting_summaries` updates rapidly in succession. Overlapping triggers are queued or dropped at the engine level. The ledger then serves purely as a durable recovery mechanism across restarts, not as a real-time race-condition blocker.

**Required approach — snapshot diff:**

1. On trigger, immediately fetch all `needs_action` items from `todo.meeting_summaries` (full item list with UIDs).
2. Compare UIDs against the idempotency ledger (see below). Any UID not present in the ledger as `processing`, `complete`, or `failed` is a candidate for processing. Failed entries require manual investigation — delete the ledger entry to allow reprocessing.
3. If exactly one unprocessed UID is found, proceed. If zero are found (trigger was spurious or item already processed), abort silently. If more than one is found, process them sequentially in chronological order (oldest `due` timestamp first).

This approach is resilient to HA restarts, state restoration events, and rapid successive updates. It never depends on reconstructing a delta from the trigger event itself.

#### Idempotency ledger

A dedicated todo list: `todo.action_pipeline_ledger`. Each item represents one processed (or in-progress) summary.

**Item schema:**
- `summary` field: the source summary UID.
- `description` field: structured metadata:
  ```
  status: processing|complete|failed
  source_meeting_date: YYYY-MM-DD
  source_meeting_title: Meeting Title
  candidate_count: N
  write_count: N
  started_at: ISO timestamp
  completed_at: ISO timestamp or null
  error: error description or null
  ```
- `status` field: always `needs_action` (HA-managed; the pipeline's own status lives in the description).

**Two-phase lease protocol:**

1. Before any extraction or classification, write a ledger entry with `status: processing` for the summary UID being handled. This is the lease acquisition.
2. If a ledger entry already exists for that UID with `status: complete`, abort — it has already been processed.
3. If a ledger entry exists with `status: processing`, check its `started_at` timestamp. If the lease is older than 300 seconds, treat it as orphaned — the previous run crashed. Forcefully re-acquire by updating `started_at` to now and proceed. If the lease is younger than 300 seconds, abort — another run is actively handling it. (Note: with `mode: single` on the automation, the only realistic scenario for a stale `processing` lease is an HA restart or service crash, not a concurrent run. The TTL is a safety net, not a primary concurrency mechanism.)
4. Only after all writes in Phase 5 complete successfully, update the ledger entry to `status: complete` with final counts and timestamp.
5. If the pipeline fails at any point after lease acquisition, update the ledger entry to `status: failed` with an error description. Failed entries can be manually re-triggered by deleting them from the ledger.

This prevents concurrent runs from both passing the "not yet processed" check and double-writing.

---

### Phase 2 — Extract

Pure deterministic extraction. No AI involvement.

**Pre-processing:**
1. Normalise line endings (replace `\r\n` and `\r` with `\n`).
2. Trim trailing whitespace from each line.

**Section extraction:**
1. Locate the `## My Actions` section using pattern `^\s*##\s+My Actions`. This tolerates minor whitespace variation.
2. Capture every subsequent line matching `^\s*-\s+` until the next line matching `^\s*##\s+` or end of string.
3. Blank lines within the section are ignored, not treated as terminators or errors.

**Action line parsing:**
1. For each captured line, strip the leading `- ` (or `- ` with leading whitespace).
2. Split on ` | ` using rsplit with maxsplit=1 to separate action text from due date.
3. **Defensive split validation:** before accepting the split, check the right-hand side against the pattern `^\d{4}-\d{2}-\d{2}$` or `(?i)^none$`. If the right-hand side does not match either pattern, the pipe character was part of the action text, not a delimiter. In that case, recombine the full string as the action text and set due date to null.
4. Validate: the action text (left side, or recombined full string) must be non-empty. If empty, log the malformed line with full context and skip it (do not abort the batch unless the contract violation threshold is breached).
5. Normalise: if the date portion is `None`, `none`, empty, or missing, set due date to null.

**Meeting metadata extraction:**
1. Extract the meeting date from the `- Date:` line within the `## Meeting` block. This field includes the year and is the authoritative source.
2. If the `- Date:` line is missing or unparseable, fall back to the `MM-DD` prefix from the summary title, but mark the batch as degraded provenance. In live mode, this is a logged warning. The batch still processes — the MM-DD prefix combined with the item's `due` timestamp (which contains the year) is sufficient to resolve the year unambiguously for recent summaries.
3. Extract the meeting title from the `- Title:` line. If missing, use the title portion of the summary field (between the date prefix and the pipe delimiter).

**Intra-summary deduplication:**
After extraction, compare all candidate action lines within the same summary. If two lines have identical action text (exact string match after whitespace normalisation), collapse them into one, keeping the more specific due date (a concrete date wins over null; a later date wins over an earlier date). Log the collapse.

Near-duplicates within a single summary (similar but not identical text) are not collapsed automatically — they proceed to AI classification as separate candidates. The AI is better positioned to judge whether "send agenda to Talia" and "share agenda with Talia" are the same obligation than a string comparator is.

**Output of Phase 2**: a list of candidate action objects:

```yaml
- action_text: "Research web call options for Microsoft/Google compatibility"
  due_date: null
  source_meeting_date: "2026-03-05"
  source_meeting_title: "Google Face-to-Face Event Planning Coordination"
  source_summary_uid: "80dbfbf4-1cb7-11f1-af52-88aedd0fdad7"
```

If zero candidates remain after extraction and deduplication, update the ledger to `complete` with `candidate_count: 0` and `write_count: 0`, then stop.

---

### Phase 3 — Fetch Existing Actions

Read all items from `todo.c_work_actions` in both `needs_action` and `completed` states.

For each existing item, capture: UID, summary text, description text, status, and due date.

**Why both statuses are needed:**
- Active items are the primary comparison set for detecting PROGRESSION and DUPLICATE.
- Completed items prevent re-adding actions that have already been done — but with temporal and contextual scoping (see Phase 4 classification rules).

**Completed item temporal truncation:** only completed items from the last 90 days are included in the comparison set sent to the AI. An action completed 6 months ago is irrelevant for duplicate detection — if it reappears in a new summary, it is overwhelmingly likely to be a new obligation instance (recurrence), not a stale reference. This keeps the AI prompt focused and prevents unbounded context growth over the system's lifetime. Active (`needs_action`) items are always included in full regardless of age.

If this fetch fails, abort. Do not classify without the comparison set — proceeding blind guarantees duplicates.

---

### Phase 4 — Classify via AI

Single-pass classification. Send the candidate actions and the full existing action list to `ai_task`.

#### Classification Categories

For each candidate action, the AI must return exactly one verdict:

| Verdict | Meaning | Pipeline Action |
|---|---|---|
| `NEW` | No semantic match in existing actions (active or completed). This is a genuinely new obligation. | Add to `todo.c_work_actions`. |
| `PROGRESSION` | Matches an existing `needs_action` item but carries new information: a changed deadline, refined scope, partial completion, or escalation. The underlying obligation is the same but the state has moved forward. | Update the matched existing item (with constraints — see Phase 5). |
| `DUPLICATE` | Matches an existing item (active or completed) with no new information. The action was restated in the meeting but nothing changed. | Skip. Log for audit. |

#### Distinguishing PROGRESSION from DUPLICATE

This is the hardest classification boundary. The AI must reason about whether the candidate adds information that would change how C prioritises or executes the action.

Rules to encode in the prompt:

- A **date change** (from null to a specific date, or from one date to another) is always PROGRESSION.
- A **scope refinement** (generic → specific, e.g., "research options" → "test Google Meet link") is PROGRESSION.
- A **status reference** (e.g., "follow up on X" where X was previously "do X") is PROGRESSION — the task has moved from initial to follow-up.
- A **verbatim or near-verbatim restatement** with no new date, no new context, and no evidence of movement is DUPLICATE.

#### Completed action handling — temporal scoping

A candidate that semantically matches a completed item is DUPLICATE **only if** the context indicates it refers to the same obligation instance. Signals that it is the same instance: the source meeting dates are close together (within the same week or fortnight), the due dates are identical or both null, and there is no language suggesting a new cycle.

A candidate that resembles a completed item but comes from a meeting significantly later, or whose context indicates a new deliverable, new time period, or new event, should be classified as NEW. Example: "book room for quarterly" completed in March and reappearing in a June summary for the September quarterly is NEW — it is a recurrence, not a duplicate.

Encode this in the prompt with explicit examples.

#### Safety bias

- "If uncertain between NEW and DUPLICATE, classify as NEW. A duplicate that is manually removed costs seconds. A missed action costs professional credibility."
- "If uncertain between PROGRESSION and DUPLICATE, classify as PROGRESSION. An unnecessary update is harmless. A missed update means C is working from stale information."
- "Never classify a genuinely new action as DUPLICATE. When in doubt, err towards adding."

#### Collision rules

After receiving the AI response, apply these deterministic checks before proceeding to writes:

- **Many-to-one**: if two or more candidates are classified as PROGRESSION against the same existing item UID, only the candidate with the highest index (i.e., appearing latest in the action list) is applied as PROGRESSION. The others are reclassified as DUPLICATE (the latest one subsumes them).
- **Contradictory verdicts**: if one candidate is DUPLICATE against an existing UID and another is PROGRESSION against the same UID in the same batch, the PROGRESSION takes precedence (it carries new information; the duplicate is redundant by definition).

#### AI Prompt Structure

The prompt must contain:

1. **Role statement**: "You are classifying candidate work actions against an existing action list to prevent duplicates while preserving genuine updates."

2. **The existing action list**: every item from Phase 3, formatted clearly with UID, status, summary text, due date, and description/history.

3. **The candidate actions**: every item from Phase 2 with full metadata.

4. **Classification rules**: the verdict definitions, progression/duplicate distinction rules, temporal scoping rules for completed items, and safety bias statements above. Include concrete examples drawn from the real data (e.g., the Google Meet research → test progression chain from the existing summaries).

5. **Output format**: "Respond with a JSON array and nothing else. No markdown fencing, no preamble, no commentary."

   Each element:
   ```json
   {
     "candidate_index": 0,
     "verdict": "NEW",
     "matched_uid": null,
     "reason": "No existing action relates to researching web call compatibility options."
   }
   ```

   For PROGRESSION:
   ```json
   {
     "candidate_index": 2,
     "verdict": "PROGRESSION",
     "matched_uid": "existing-item-uid",
     "reason": "Same obligation as 'research web call options' but now scoped to testing a specific Google Meet link. Scope has narrowed from research to execution.",
     "updated_due_date": "2026-03-08",
     "updated_text": null
   }
   ```

   `matched_uid` is required for PROGRESSION and DUPLICATE, null for NEW. `updated_due_date` is populated for PROGRESSION only if the candidate carries a different date than the existing item. `updated_text` is populated for PROGRESSION only if the candidate's action text is strictly more specific than the existing text — never to paraphrase, generalise, or editorially rewrite.

6. **Text update constraint**: "If you populate `updated_text`, it must preserve all concrete entities, deadlines, systems, and names present in either the candidate or existing text. It must not broaden scope, introduce inferred tasks, or paraphrase for style. Its only purpose is to replace a vague description with a more specific one. If in doubt, leave `updated_text` as null — the existing text stands."

#### AI Response Parsing

Parse the JSON response. Strip markdown code fences if present (`\`\`\`json` / `\`\`\``) before parsing.

**On parse failure — one retry permitted.** Send the identical prompt plus a hard wrapper: "Your previous response was not valid JSON. Return only a valid JSON array conforming exactly to the schema specified. No other text." If the second attempt also fails to parse, abort the batch. Update ledger to `status: failed` with the raw response logged.

If any element has an unrecognised verdict string, or a PROGRESSION/DUPLICATE element is missing `matched_uid`, or a `matched_uid` doesn't exist in the fetched comparison set: skip that individual candidate (log it as unclassifiable) but continue processing the remaining candidates. Do not abort the entire batch for one bad element.

---

### Phase 5 — Write

#### Manual edit protection

Before updating any existing item (PROGRESSION), the pipeline must check whether C has manually edited it since the pipeline last touched it.

**Mechanism:** every item written or updated by the pipeline includes a machine-readable marker in its description — a line of the format:

```
pipeline_last_wrote: YYYY-MM-DDTHH:MM:SS
pipeline_last_summary: exact summary text at time of write
pipeline_last_due: YYYY-MM-DD or null (date-only, normalised from HA's potentially full ISO datetime)
pipeline_state_hash: sha256(summary_text + normalised_due_date)
```

**Due date normalisation:** HA may return the `due` field as a date-only string (`2026-03-15`) or as a full ISO datetime (`2026-03-15T00:00:00+00:00`), depending on whether `due_date` or `due_datetime` was used when creating the item. The pipeline always normalises due dates to date-only format (`YYYY-MM-DD`) before storing in `pipeline_last_due` and before computing the state hash. The same normalisation must be applied when reading the current item's `due` field for comparison. Without this, hash verification will false-positive on every item with a due date.

Before applying a PROGRESSION update, read the existing item's current summary text and due date. Compare against the pipeline's last-known state using two methods: first, verify `pipeline_state_hash` against a freshly computed hash using `sha256(current_summary + normalised_current_due)`. If the hash matches, the item is unmodified. If the hash is missing or corrupted (e.g., C inadvertently edited the metadata), fall back to string comparison against `pipeline_last_summary` and `pipeline_last_due` (with the current due date normalised before comparison). The hash is the programmatic fast path; the human-readable fields are the fallback and the audit trail.

- If they match (or the marker is absent because this is a pre-pipeline item), proceed with the update.
- If they don't match, C has manually refined the item. In this case: **do not overwrite the summary text or due date**. Instead, append the progression note to the description only. The human-curated text is preserved, and the new context from the meeting is still recorded.

This protects against the pipeline undoing manual refinements while still capturing progression history.

#### Write operations

**NEW items:**
- Call `todo.add_item` on `todo.c_work_actions`.
- `item` (summary): the action text as extracted.
- `due_date`: the due date from the candidate, if present.
- `description`: structured metadata block:
  ```
  Source: {source_meeting_title}
  Meeting date: {source_meeting_date}
  Extracted: {current_timestamp}
  Summary UID: {source_summary_uid}
  pipeline_last_wrote: {current_timestamp}
  pipeline_last_summary: {action_text}
  pipeline_last_due: {normalised_due_date or null}
  pipeline_state_hash: {sha256(action_text + normalised_due_date)}
  ```

**PROGRESSION items (no manual edit detected):**
- Call `todo.update_item` on the matched existing item (identified by its current summary text — see implementation specification for service call details).
- If `updated_due_date` is provided and differs from current, update the due date.
- If `updated_text` is provided, update the summary text.
- Append to the existing description:
  ```
  ---
  Progression: {source_meeting_title} ({source_meeting_date})
  Detail: {reason from AI classification}
  Updated: {current_timestamp}
  Summary UID: {source_summary_uid}
  ```
- Update the `pipeline_last_wrote`, `pipeline_last_summary`, `pipeline_last_due`, and `pipeline_state_hash` markers to reflect the new state.

**PROGRESSION items (manual edit detected):**
- Do not modify summary text or due date.
- Append to the existing description only:
  ```
  ---
  Progression (text preserved — manual edit detected): {source_meeting_title} ({source_meeting_date})
  Detail: {reason from AI classification}
  Candidate text: {candidate action text}
  Candidate due: {candidate due date or null}
  Noted: {current_timestamp}
  Summary UID: {source_summary_uid}
  ```
- Do not update the `pipeline_last_summary`, `pipeline_last_due`, or `pipeline_state_hash` markers (they now reflect the manually edited state, which the pipeline should continue to respect).

**DUPLICATE items:**
- No write to `todo.c_work_actions`.
- Log: candidate text, matched UID, reason, source summary UID.

#### Ledger finalisation

After all candidates in the batch have been processed (written, skipped, or logged), update the ledger entry for this summary UID:

```
status: complete
candidate_count: {total extracted}
write_count: {NEW + PROGRESSION writes}
completed_at: {current_timestamp}
```

#### Ledger pruning

After ledger finalisation, scan the ledger for stale entries. Delete any item with `status: complete` or `status: failed` whose `started_at` timestamp is older than 14 days. This prevents unbounded ledger growth. Active `processing` leases are never pruned — they are handled by the TTL mechanism in Phase 1.

---

## Error Handling

| Failure Point | Behaviour |
|---|---|
| Phase 1 snapshot diff finds no new UIDs | Abort silently. No ledger entry created. |
| Phase 1 ledger entry already exists as `processing`, `complete`, or `failed` | If `complete` or `failed`, abort for that UID (failed entries require manual deletion to retry). If `processing` and younger than 300 seconds, abort (active run). If `processing` and older than 300 seconds, treat as orphaned — re-acquire lease and proceed. |
| Phase 2 action line fails format validation | Log the malformed line. Skip it. Continue extracting remaining lines. If more than half the lines fail, mark summary as failed-contract, update ledger to `failed`, stop. |
| Phase 2 meeting date missing from Meeting block | Fall back to summary title prefix. Log as degraded provenance. Continue. |
| Phase 2 meeting title missing from Meeting block | Fall back to summary title field. Log. Continue. |
| Phase 3 cannot read `todo.c_work_actions` | Abort. Update ledger to `failed`. |
| Phase 4 AI returns unparseable JSON | Retry once with format-correction wrapper. If second attempt fails, abort. Update ledger to `failed`. Log raw response. |
| Phase 4 individual element has invalid verdict or missing matched_uid | Skip that candidate. Log as unclassifiable. Process remaining candidates normally. |
| Phase 4 matched_uid doesn't exist in comparison set | Skip that candidate. Log. Process remaining candidates. |
| Phase 5 individual write fails | Log the failure. Continue with remaining candidates. Ledger is updated to `complete` only if at least one write succeeded or all candidates were legitimately skipped. If all writes failed, update ledger to `failed`. |
| Phase 5 fails after some writes but before all | Ledger stays as `processing`. The 300-second TTL in Phase 1 ensures this lease will expire, allowing the summary to be reprocessed on the next trigger. Successfully written items now exist in the comparison set — the AI will classify re-extracted versions as DUPLICATE, and only the failed writes will be retried as NEW or PROGRESSION. This is the self-healing property of the design. |

---

## Validation Protocol

Before enabling live writes, run the full pipeline in dry-run mode against all existing summaries in `todo.meeting_summaries`.

1. Process each summary through Phases 1–4 in chronological order (oldest first, matching the order they would have arrived in production).
2. Simulate Phase 5 by maintaining an in-memory representation of `todo.c_work_actions` rather than writing to the real entity. Apply simulated writes including description metadata so that subsequent summaries in the sequence see realistic comparison data.
3. After processing all summaries, output the full simulated todo list and the classification log showing every verdict with its reason.
4. C will manually review every classification. Any misclassification requires a prompt revision before live deployment.

**Additional test scenarios to verify manually** (these do not need automated test infrastructure — just manual runs with crafted inputs):

- Same summary UID processed twice (should abort on second run via ledger).
- Stale `processing` lease older than 300 seconds (should be re-acquired and reprocessed).
- Summary with zero actions (should complete cleanly with zero writes).
- Summary with exact-duplicate internal lines (should collapse before classification).
- Candidate matching a recently completed action from the same week (should be DUPLICATE).
- Candidate matching an action completed months ago in a new temporal context (should be NEW).

This validation step is mandatory. Do not skip it.

---

## Implementation Constraints

- All HA services are called natively via pyscript's service access. The REST API (Nabu Casa URL and bearer token in the ha-development skill) is available for manual testing but is not used by the pipeline itself.
- `ai_task` is the AI integration point. Use whichever model is configured as default in HA's AI integration.
- The automation should be implemented as an HA automation for the trigger shell, with `mode: single` to prevent overlapping executions. The bulk of Phases 2–5 orchestrated in a single `pyscript` component (pyscript is required over `python_script` due to import requirements — hashlib, json, re). One execution surface for the pipeline logic, one automation to invoke it.
- `todo.action_pipeline_ledger` must be created as a Local To-do list in HA before deployment.
- All logging should use `persistent_notification.create` so C can review pipeline activity without checking HA system logs.

---

## Future Considerations (Out of Scope for Initial Implementation)

- **Others' Actions tracking**: the summaries contain `## Others' Actions` with the same consistent format, extended with an assignee field (`action | assignee | date`). A parallel pipeline could extract these into a separate todo list for C's visibility into delegated work.
- **Completion detection**: if a later summary's text references an action as done, the AI could auto-complete the corresponding todo item. This carries higher risk and should only be considered after the core pipeline has proven reliable.
- **Transcript fallback**: if a summary's `## My Actions` section is empty but the transcript suggests actions were assigned, the pipeline could flag this for manual review. This requires reading from `todo.meeting_transcripts` and is a significant complexity increase.

---

## Implementation Specification

A companion document (`action-extraction-implementation-spec.md`) resolves all implementation-level ambiguities: exact service call signatures, full AI prompt text, pyscript skeleton, metadata parser code, hash canonical form, logging templates, dry-run mode, and the trigger automation YAML. That document is required reading for the implementer alongside this plan.
