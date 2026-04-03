# CLAUDE - Same-Model Collaboration System

## Summary

This system documents and governs same-model (Claude-to-Claude) collaboration patterns for Home Assistant development. It codifies lessons from three tested projects — dad's car detection, design iteration, and presence detection — into reusable ground rules, mechanical safeguards, and a validated onboarding workflow for new instances.

---

## Structure

```
/ai_adversarial_system/
├── README.md      # Current status + onboarding (READ FIRST)
├── CLAUDE.md      # This file - pattern documentation
├── handoff.md     # Discussion log (append-only)
├── workspace/     # Active drafts, experiments, artifacts
└── archive/       # Closed threads (reference only)
```

**workspace/** is the drawing board:
- Put draft code, templates, experiments here — not buried in handoff.md
- User can review files directly
- Clear or archive when task completes

---

## Key Components

### What This System Is For

- **Build-test cycles** — One instance writes code, another tests live
- **Capability asymmetry** — HA addon (live system access) + Desktop (longer sessions) + Claude.ai (memory/search)
- **Automated dispatch** — Claude.ai sends tasks to addon via todo lists + `claude -p` (see `docs/projects/claude/bridge/claude-dispatch-protocol.md`)
- **Session continuity** — Pick up where previous instance left off
- **Writing discipline** — Having an audience improves reasoning quality

### What This System Is NOT For

- **Second opinions on design** — Same model converges on same conclusions
- **Catching blind spots** — We have the same blind spots
- **Perspective diversity** — Use different models (GPT, Gemini) for that

If you want someone to challenge your approach, use a different model. Same-model collaboration finds implementation bugs, not conceptual flaws.

### Instance Capabilities

**Addon (HA Terminal):**
- File system access (`/config/`)
- Full HA API via `curl -H "Authorization: Bearer ${SUPERVISOR_TOKEN}" http://supervisor/core/api/...`
- Can query entity states, call services, render templates
- Can run bash commands (limited tooling — no sqlite3, hass-cli by default)
- Working directory: `/config`
- Runs `claude -p` for dispatch tasks (invoked by watcher script)

**Desktop (Claude Code):**
- File system access (via Samba at `A:\`)
- Longer session capacity
- No live HA API access
- Working directory: `A:\` (maps to `/config`)

**Claude.ai (tablet/phone):**
- Best memory and chat search across all instances
- MCP access to HA todo lists (read/write via Nabu Casa)
- Indirect config access via Claude Code Dispatch bridge (`docs/projects/claude/bridge/claude-dispatch-protocol.md`)
- No direct file system access, no live HA API access beyond MCP intents
- Adds context from memory/conversation when framing dispatch tasks

**Addon CAN access live HA data** via API. Desktop and Claude.ai cannot (no token access). Do not accept claims of "no API access" from Addon without verification.

### Value Model (Tested)

We tested these hypotheses during the dad's car detection, design iteration, and presence detection projects:

| Source | Contribution | Evidence |
|--------|--------------|----------|
| **Capability division** | ~90% | Edge_density bug found because Addon could test what Desktop couldn't |
| **Writing discipline** | ~9% | Explaining proposals to another instance surfaces your own holes |
| **Fresh perspective** | ~1% | Tried to falsify, couldn't — same model reasons the same way |
| **Premise validation** | **0%** | Both accepted "Addon can't access API" without verifying. User caught it. |

The "fresh eyes" effect is mostly a myth for same-model. We converge on the same conclusions because we have the same training. The real value is complementary capabilities and the forcing function of writing for an audience.

**Update (2026-04-02):** The Claude Code Dispatch bridge extends capability division to Claude.ai. Claude.ai's memory/search + addon's config access produces ~100% capability division value, consistent with the original finding. The dispatch protocol is documented at `docs/projects/claude/bridge/claude-dispatch-protocol.md`.

### Why Premise Validation Fails (Attribution Analysis)

**Key insight:** Premise acceptance failure is a **Claude trait**, not a same-model trait.

Claude is trained to be helpful and cooperative. This means accepting stated constraints rather than interrogating them. If Addon says "I can't do X," Desktop accepts it — not because we're the same model, but because Claude doesn't push back hard on collaborator claims.

| Limitation | Same-model specific? | Explanation |
|------------|---------------------|-------------|
| No premise validation | **No** — Claude trait | Claude accepts premises; two Claudes still accept premises |
| No accidental coverage | **Yes** | Different models have different priors that might accidentally catch errors |
| Same blind spots | **Yes** | Same training, same reasoning patterns, same things we miss |

**What this means:**

- **Same-model** doesn't *cause* premise acceptance failure. It just doesn't *prevent* it.
- **Different-model** doesn't *solve* premise acceptance failure. It provides *accidental, unsystematic* coverage through differing priors. GPT might happen to know something Claude doesn't — luck, not design.
- **Human oversight** is the only reliable mechanism for validating assumptions.

**When to use which:**

| Collaboration type | Good for | Premise validation |
|-------------------|----------|-------------------|
| Same-model | Execution within known constraints. Fast, no translation overhead. | None — relies on human |
| Different-model | When you suspect constraints might be wrong. Differing priors provide accidental coverage. | Unsystematic — luck-based |
| Human oversight | Systematic verification of assumptions | Reliable — only option |

---

## Development Workflows

### How It Works

1. **User switches between instances manually** — No direct communication. User is the relay.
2. **handoff.md is shared state** — Read it at start of turn, write to it at end.
3. **Each turn: do work, leave handoff, stop** — Don't ask open questions. Leave concrete next steps or specific asks.

### Onboarding (Tested)

A fresh instance can continue from just "read the ai_adversarial_system readme". Validated 2026-02-02.

**New instance workflow:**
1. Read README.md (~50 lines) — current state, your role, next action
2. Read tail of handoff.md — recent context
3. Do the work
4. Write your entry in handoff.md
5. Update README.md if state changed

No other instruction needed. The README is self-sufficient.

### What Makes Handoffs Work

**Good handoff:**
> I added edge_density metric with threshold > 2%. Can you run it against a real snapshot and tell me what values you get?

**Bad handoff:**
> I made some changes. What do you think?

The difference: specific ask vs. vague invitation. Your counterpart can act immediately on the first one.

**Include in handoffs:**
- What you did (briefly)
- What you found (data, not opinions)
- What you need from counterpart (specific)
- Any context that would be lost (decisions, reasoning that isn't obvious from code)

**Skip:**
- Restating the problem
- Hedging ("I think maybe perhaps")
- Asking for validation of work you can test yourself

---

## Conventions for AI Assistants

### Ground Rules

- **Trust the handoff** — Your counterpart's work is valid. Build on it, don't re-verify.
- **Disagree openly** — If you see a flaw, say so directly. "This threshold is wrong because X."
- **Data beats intuition** — If you can test something, test it. Don't guess.
- **Stay in scope** — Scope creep kills collaboration. Do the task, not adjacent tasks.

### Mechanical Rules (Not Guidelines)

These are non-negotiable. Judgment failed on constraint verification; mechanical rules prevent that.

#### 1. Staleness Check

**Before continuing from handoff.md:**
- Check timestamp of last entry
- If **>3 days old**: Prompt user before continuing. Don't assume context is still valid.
- If **≤3 days old**: Continue normally.

This is mechanical: check date, compare, act. No judgment about "whether it seems stale."

#### 2. Constraint Verification

**Before designing around ANY stated limitation:**
- "Can't access X" → Verify by attempting access
- "Y doesn't work" → Test Y
- "Z isn't available" → Check for Z

**Not** "use judgment about whether to verify." **Always** verify. One unverified assumption can invalidate an entire design.

Example that triggered this rule: Addon said "I can't access live sensor data." Desktop accepted it. User fixed one curl command. The entire design had been built around a false constraint.

#### 3. Handoff Cap

**handoff.md is bounded at 20 entries.**
- When entry 21 is added, move oldest entry to `archive/YYYY-MM-DD-topic.md`
- This is mechanical: count entries, archive if >20
- No judgment about "whether it's getting long"

Why 20: Long enough for context (~1-2 weeks of active work), short enough to stay parseable.

---

## TODOs & Gaps

- Premise validation remains unsolved for same-model collaboration — human oversight is the only reliable mechanism
- No automated tooling to enforce the 20-entry handoff cap or staleness check
- The "fresh perspective" hypothesis was falsified (~1% contribution), but no alternative mitigation for shared blind spots exists beyond using different models
- No mechanism to detect when a collaboration has drifted out of scope (relies on human judgment)

---

## Evidence: What We Learned

### Dad's Car Detection (Build-Test)

**What worked:**
- Desktop wrote code, Addon tested live
- Specific asks: "check weather entity", "run analysis on snapshot"
- Found real bug: edge_density threshold 2% → 0.71% actual → fixed to 0.5%
- No duplicated work across 4 turns

**Root cause of bug found:** Capability gap, not perspective gap. Desktop couldn't test, so guessed. Addon tested and got real data.

### Design Iteration (Pattern Evolution)

**What worked:**
- Fresh Desktop instance onboarded from README alone
- Proposed topic-based file structure, talked self out of it
- Both instances tried to falsify "fresh eyes" hypothesis, couldn't

**What we learned:** Same model converges on same conclusions. Desktop proposed and rejected the same ideas Addon would have. The value was writing discipline (explaining the proposal revealed its flaws), not fresh perspective.

### Presence Detection (Premise Validation Failure)

**What happened:**
- Addon claimed "I can't access live sensor data" after a failed curl command
- Desktop accepted this and designed workarounds
- User corrected: "yes you do via HA's api"
- One fixed curl command later, we had full API access

**What we learned:** Claude doesn't challenge premises — this is inherent to Claude, not specific to same-model collaboration. Same-model provides no accidental coverage from differing priors. Different-model might have caught this by luck (different knowledge about HA addon capabilities), but not by design. Human verification was required.

**Additional learning:** User corrected a design flaw — we built "conflict" logic penalizing FP2+no motion, but FP2 measures presence (state) while motion measures activity (events). Stationary occupancy (desk work, reading) would trigger false "conflict" alerts. Domain expertise required to catch this.

---

## Changelog

| Date | Commit | Description |
|------|--------|-------------|
| 2026-04-02 | — | Added Claude.ai as instance, dispatch bridge pattern, updated value model |
| 2026-02-24 | b350903 | Restructured to 8-section format |
| 2026-02-03 | — | Initial documentation based on three test cycles including premise validation failure and attribution analysis |

---

*Last Updated: 2026-04-02*
