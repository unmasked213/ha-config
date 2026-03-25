# CLAUDE - Work

> **Scope:** Meeting action extraction pipeline — automated work obligation tracking
> **Last reviewed:** 2026-03
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

The work domain automates extraction of personal action items from meeting summaries. An IMAP pipeline (external) deposits structured summaries into `todo.meeting_summaries`. This package triggers a pyscript pipeline that parses actions, classifies them against the existing list using AI, and writes to `todo.work_actions`. The pipeline handles duplicates, progressions, and manual edit protection.

---

## Structure

| File | Purpose |
|------|---------|
| `work.yaml` | Trigger automation — fires pipeline on `todo.meeting_summaries` state change |
| `work_actions_card.yaml` | HA helper entities for work-actions-card settings (6 helpers: height, show completed, sort order, hover tooltips, new indicator expiry, completed shelf life) |

**Companion pyscript file:** `pyscript/action_extraction_pipeline.py` — all pipeline logic (Phases 2-5)

**Transcript/summary files:** `www/transcripts/` — persistent storage with no cleanup cutoff. Naming convention: `MM-DD_Slugified_Title_summary.txt` and `MM-DD_Slugified_Title_transcript.txt`. Slugification: strip `[Plaud-AutoFlow]` tag, replace non-alphanumeric with `_`, collapse consecutive underscores.

**Design documents (read-only reference, not deployed):**
- `tmp/action-extraction-plan-v2.1-final.md` — architecture and design rationale
- `tmp/action-extraction-implementation-spec.md` — service call patterns, prompt, parsing rules

---

## Key Components

### Entities

| Entity | Type | Role |
|--------|------|------|
| `todo.meeting_summaries` | Local To-do | Source — structured meeting summaries with `## Actions` sections |
| `todo.meeting_transcripts` | Local To-do | Reference — verbatim transcripts (not read by pipeline) |
| `todo.work_actions` | Local To-do | Target — C's personal work action list |
| `todo.action_pipeline_ledger` | Local To-do | Idempotency ledger — tracks processed summaries |
| `ai_task.openai_ai_task` | AI Task | Classification engine — determines NEW/PROGRESSION/DUPLICATE |

### Pipeline Phases

1. **Trigger + Lease** — automation fires, pyscript acquires ledger lease (`mode: single` prevents concurrency)
2. **Extract** — deterministic parsing of `## Actions` section, `| date` delimiter splitting
3. **Fetch** — reads existing items from `todo.work_actions` (active + completed within 90 days)
4. **Classify** — AI determines verdict per candidate: NEW, PROGRESSION, or DUPLICATE
5. **Write** — adds new items, updates progressions (with manual edit protection), skips duplicates

### Classification Verdicts

| Verdict | Meaning | Action |
|---------|---------|--------|
| NEW | No semantic match exists | Add to `todo.work_actions` |
| PROGRESSION | Matches existing active item with new info (date, scope, status) | Update matched item |
| DUPLICATE | Matches existing item, no new info | Skip (log only) |

### Safety Mechanisms

- **Idempotency ledger** — two-phase lease (`processing` → `complete`) prevents double-writes
- **Lease TTL** — 300-second expiry recovers from crashed runs
- **Manual edit protection** — SHA-256 hash + fallback string comparison detects user edits; pipeline appends context instead of overwriting
- **Contract violation** — aborts if >50% of action lines fail to parse
- **Safety bias** — uncertain classifications default to NEW (missed action > false duplicate)

### Notifications

Only errors produce persistent notifications:
- `action_pipeline_error` — AI parse failure, ledger failures, contract violations

Success/info events go to `log.info` only.

---

## Development Workflows

### Testing the Pipeline

```bash
# Dry-run against all existing summaries (no writes, no ledger updates)
haq call pyscript action_extraction_pipeline  # then pass dry_run: true via service call

# Or via REST API:
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://supervisor/core/api/services/pyscript/action_extraction_pipeline" \
  -d '{"dry_run": true}'
```

### Reprocessing a Failed Summary

1. Find the failed entry in `todo.action_pipeline_ledger`
2. Delete it
3. Trigger any state change on `todo.meeting_summaries` (or call the service manually)

### Modifying the AI Prompt

The prompt template is `PROMPT_TEMPLATE` in `pyscript/action_extraction_pipeline.py`. Changes affect classification behaviour across all future runs. Test with dry-run first.

---

## Conventions for AI Assistants

### Entity Naming

- Action items: `todo.work_actions`
- Ledger: `todo.action_pipeline_ledger`
- Source summaries: `todo.meeting_summaries`

### Anti-Patterns

- Don't modify `todo.action_pipeline_ledger` manually unless reprocessing a failed entry
- Don't add a second automation targeting `todo.meeting_summaries` — `mode: single` assumes sole ownership
- Don't change the `CLASSIFICATION_STRUCTURE` without updating the prompt to match
- Don't remove pipeline metadata from action item descriptions — breaks manual edit detection

### Coupling

- **AI package** — uses `ai_task.openai_ai_task` for classification
- **Communication package** — meeting summaries originate from the IMAP transcript pipeline
- **Dashboard** — `work-actions-card` in `www/cards/` displays `todo.work_actions`; card settings persist to `input_number.wac_max_height`, `input_boolean.wac_show_completed`, `input_select.wac_sort_order`, `input_boolean.wac_hover_tooltips`, `input_number.wac_new_indicator_hours`, `input_number.wac_completed_shelf_days`

### Cross-references

- Root: /CLAUDE.md
- Architecture: /ARCHITECTURE.md
- Pipeline code: /pyscript/action_extraction_pipeline.py
- Design docs: /tmp/action-extraction-plan-v2.1-final.md

---

## TODOs & Gaps

- **Dry-run overwrites per-summary** — each summary replaces the same log entry; no cumulative report
- **No cumulative simulation** — dry-run can't test PROGRESSION/DUPLICATE across summaries (comparison set isn't populated between runs)
- **Ledger `complete` entries lose meeting metadata** — `source_meeting_date` and `source_meeting_title` dropped on finalisation

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-03-11 | — | Initial deployment: pipeline, trigger automation, ledger entity |

*Last Updated: 2026-03-11*
