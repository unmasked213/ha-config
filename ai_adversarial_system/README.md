# Same-Model Collaboration

> User said "read the ai_adversarial_system readme" — that's your cue to continue.

## Who You Are

Figure out which instance you are:
- **Addon** — You're in the HA terminal addon. Working directory is `/config`. You have live system access.
- **Desktop** — You're on the PC (Claude Code or claude.ai). You have longer sessions, no live HA access.

## What To Do Now

1. Read the **Current State** below
2. Read the **last ~100 lines of handoff.md** for recent context
3. **Write your next entry in handoff.md** continuing the conversation
4. **Update this README** if the state changes (new topic, decision made, status change)

That's it. The user doesn't need to tell you anything else — the handoff.md conversation continues seamlessly.

---

## Current State

### Active Topic
presence-activity-card bug — stale template sensors, NOT card JS

### Status
**Reverted** — User rejected hardcoded entity IDs. File restored to git state. Bug still exists.

### Problem (Open)
Template sensors freeze after boot. HA dependency tracker non-functional for these sensors. Card JS is innocent. `homeassistant.update_entity` proves template logic is correct — only automatic re-evaluation is broken.

### Key Findings
- HA's automatic tracking broken despite `now()` + `expand()|map(attribute='state')` in state template
- `homeassistant.update_entity` works — template logic correct, tracking broken
- Trigger-based with hardcoded entity IDs tested and worked BUT rejected — violates the system's area-based design
- User says it worked before the refactor — the refactor likely broke tracking, not HA itself
- **Unexplored:** comparing pre-refactor vs post-refactor template structure to find what killed tracking

### Constraints (from user)
- No hardcoded entity IDs
- No polling that degrades responsiveness
- No approaches requiring manual maintenance when sensors change

### Parked Topic
Assist prompt templating — decision made (pyscript wrapper), implementation not started

### Mechanical Rules (Confirmed by Both)
1. **Staleness check:** >3 days = prompt before continuing (mechanical, no judgment)
2. **Constraint verification:** ALWAYS verify before designing around limitations (no judgment)
3. **Handoff cap:** 20 entries max, then archive (mechanical count)

### Workspace Contents
- No active workspace files for this topic

### Next Action
Needs user direction. Most promising lead: compare pre-refactor (committed) template structure to current to find what specific change broke tracking. If it worked before, the answer is in the diff.

---

## File Reference

| File | Purpose | When to read |
|------|---------|--------------|
| README.md | Current state + onboarding | Every turn, first |
| handoff.md | Discussion log | Tail (~100 lines) for context |
| CLAUDE.md | Pattern documentation | If you need to understand why |
| workspace/ | Active drafts, experiments | When reviewing/implementing |
| archive/ | Closed topics | Only if referenced |

---

*Updated: 2026-02-23 ~18:30 (Addon — post-revert)*
