# CLAUDE.md Restructuring Project Brief

> **Purpose:** This document provides comprehensive context for restructuring the AI instruction files in this Home Assistant configuration repository. Read this entire document carefully before creating an implementation plan.

---

## Executive Summary

**Current state:** Single monolithic `/config/CLAUDE.md` file (~850 lines) containing all AI instructions—session protocol, architecture details, naming conventions, subsystem documentation, patterns, and operational guidance.

**Decision:** Restructure into domain-specific CLAUDE.md files distributed across the repository, with a slimmed-down root CLAUDE.md for core rules and session protocol.

**Rationale:** This approach is explicitly endorsed by Claude Code's official documentation as the intended design pattern for repositories of this size and complexity. The current 850-line file risks instruction loss—the docs warn that bloated files cause Claude to ignore rules buried in noise.

**Key enabler:** Claude Code natively supports hierarchical CLAUDE.md loading. Child directory files load automatically when working with files in those directories. This substantially reduces the discovery problem for file-scoped work—though high-level questions that don't touch files still require explicit traversal guidance.

---

## Background: The Analysis Process

This restructuring decision was reached through a structured analysis process involving five AI systems (Claude Opus 4.5, ChatGPT, Gemini, Grok, and a separate Claude instance) reviewing the proposal from different angles.

### Initial Analysis Document

A comprehensive analysis document was prepared covering:

- Repository context (~320,000 lines, ~130 automations, ~40 custom components, ~13 functional domains)
- Current CLAUDE.md structure and content breakdown
- Proposed structure with domain-specific files
- Benefits analysis (B1-B6)
- Risk assessment (R1-R8)
- Implementation considerations
- Alternative approaches
- Open questions

### Initial AI Perspectives (Summary)

Five AI systems reviewed the proposal. Initial stances ranged from skeptical (Claude Opus 4.5, wanting stronger evidence of actual problems) to moderately supportive (ChatGPT, Gemini, Grok at 75-80% confidence).

**Common concerns across all reviewers:**
- Discovery risk (R1): Would Claude reliably find and load domain files?
- Cross-domain context loss (R7): Would spanning multiple domains cause missed rules?
- Enforcement mechanism: Index/routing in root seemed judgment-dependent

**Key proposals that emerged:**
- Mechanical/imperative triggers rather than soft pointers (ChatGPT, Gemini)
- CONTRACTS.md for cross-domain coupling invariants (ChatGPT)
- Decision tree in root as primary router (Grok)
- Stricter threshold for creating domain files (Grok)
- "Traversal Rule" for high-level questions (Gemini)

See Appendix A for detailed breakdown of each AI's initial position.

### The Pivotal Discovery

The analysis was then cross-referenced against Claude Code's official documentation, specifically the "Configure your environment" and "Write an effective CLAUDE.md" sections.

**Key findings from the documentation:**

1. **Native hierarchical loading:** Child CLAUDE.md files are pulled in on demand when working with files in those directories.

2. **Explicit warnings against bloat (paraphrased):**
   - Bloated CLAUDE.md files cause Claude to ignore instructions
   - If the file is too long, important rules get lost in the noise
   - Repeated non-compliance with a rule often indicates the file is too long

3. **Design philosophy (paraphrased):** CLAUDE.md is loaded every session, so only include things that apply broadly. For domain knowledge or workflows that are only relevant sometimes, use skills instead.

4. **Pruning guidance (paraphrased):** For each line, ask "Would removing this cause Claude to make mistakes?" If not, cut it.

### Post-Documentation Consensus

After reviewing the official documentation, all five AI perspectives converged:

| Aspect | Before Docs | After Docs |
|--------|-------------|------------|
| Discovery risk (R1) | High concern, needs prompt engineering | Substantially reduced for file-scoped work |
| 850-line file assessment | Suboptimal but functional | Actively counterproductive per docs |
| Proposed structure validity | Good idea, uncertain enforcement | Matches intended design pattern |
| Overall confidence | 75-80% proceed | 90%+ proceed |

**Key insight:** The discovery problem that dominated the initial analysis is largely solved at the tooling level for file-scoped work. Claude Code automatically loads child CLAUDE.md files when working in those directories. High-level questions still need explicit traversal guidance.

---

## Current Repository Structure

```
/config/
├── CLAUDE.md                 # Current monolithic (~850 lines)
├── ARCHITECTURE.md           # System architecture documentation
├── configuration.yaml        # Main HA config
├── packages/                  # PRIMARY configuration location
│   ├── ai/                   # AI integrations
│   ├── communication/        # WhatsApp, notifications
│   ├── device/               # Cameras, media players
│   ├── lights/               # Lighting automation
│   ├── occupancy/            # Presence detection, doors
│   ├── server/               # Frontend, GitHub sync
│   └── [additional domains]
├── custom_components/        # Third-party (DO NOT MODIFY)
├── www/
│   └── base/                 # UI design system
│       └── docs/
│           └── CLAUDE.md     # Domain-specific (EXISTS, working well)
├── pyscript/                 # Python automations
├── themes/                   # Theme files
└── .claude/                  # Session state and tools
    ├── session.md
    ├── session_history.md
    └── ha
```

### Current CLAUDE.md Content Breakdown

| Section | Approx Lines | Content |
|---------|--------------|---------|
| Session Continuity Protocol | ~120 | Session.md handling, resume phrases, update triggers |
| Repository Overview | ~30 | What this repo is, key technologies |
| Directory Structure | ~80 | Full directory tree with annotations |
| Configuration Architecture | ~40 | Package-based organisation explanation |
| Naming Conventions | ~50 | Entity ID patterns, script naming, file organisation |
| Major Subsystems | ~100 | Presence, doors, lighting, WhatsApp, AI, cameras |
| Design Token System | ~50 | Token hierarchy, implementation flow |
| Custom Components | ~40 | Critical components list |
| Development Workflows | ~80 | Adding automations, helpers, pyscript |
| File Modification Guidelines | ~50 | Safe/caution/never modify lists |
| Git Workflow | ~40 | Branch strategy, commit format |
| Testing and Validation | ~30 | Pre-deployment checks, common issues |
| Common Patterns | ~80 | AI generation, WhatsApp, presence, time-based |
| Security Considerations | ~40 | Secrets management, API keys |
| Technical Debt | ~30 | Known issues |
| Operational Guidance | ~80 | Coupling hotspots, observability |
| Quick Reference | ~60 | Common files, entity patterns |
| Summary | ~50 | Critical guidelines, scale metrics |

### Existing Precedent

The UI design system already uses domain-specific CLAUDE.md successfully:

**`/config/www/base/docs/CLAUDE.md`** (~330 lines)
- Binding rules specific to the UI token system
- Priority hierarchy for design decisions
- Token governance rules
- Anti-patterns specific to UI work
- Decision trees for spacing, radius, colour, elevation

This pattern has worked well—when working on UI components, Claude reads the domain-specific file and gets focused, relevant rules without unrelated HA configuration guidance.

---

## Additional Mechanisms from Documentation

The Claude Code docs recommend several mechanisms beyond child CLAUDE.md files for managing context efficiently:

### @imports

Root CLAUDE.md can import additional files via `@path/to/file` syntax. Useful for larger reference blocks that should be available but not inline in root. Keeps root scannable while making detailed content accessible.

### Skills (.claude/skills/)

For domain knowledge or workflows that are only relevant sometimes, skills load on demand without bloating every conversation. Better suited for:
- Repeatable procedures ("create new presence exclusion rule")
- Reference material needed occasionally
- Workflows invoked explicitly rather than passively applied

Skills are invoked when relevant rather than loaded every session.

**Key distinction:**
- **CLAUDE.md (root/domain):** Passive context. Rules that apply whenever you are in this space (e.g., "Always use input_boolean for room state").
- **Skills (.claude/skills/):** Active workflows. Step-by-step procedures invoked on command (e.g., "Run the new_automation wizard").

**Phase guidance:** For Phases 1-3, we are only moving context to domain CLAUDE.md files. Converting procedures to skills is deferred to Phase 4 (Evaluation). This reduces moving parts during the critical migration.

### Hooks

For "must happen every time with zero exceptions" requirements, hooks provide deterministic enforcement. Unlike advisory CLAUDE.md instructions (which may be deprioritised in long files), hooks execute reliably. Consider hooks for:
- Pre-commit validation
- Mandatory checks before file modification
- Any rule where non-compliance is unacceptable

**Implication for this restructuring:** Some content currently in CLAUDE.md may be better suited to skills or hooks. Evaluate during migration whether each rule is:
- Advisory context → CLAUDE.md (root or domain)
- Repeatable procedure → skill
- Deterministic requirement → hook

---

## Target Structure

### Root Level (Slim)

```
/config/
├── CLAUDE.md                 # Slim: ~120-150 lines
├── ARCHITECTURE.md           # Unchanged
```

**Root CLAUDE.md should contain:**

1. **Pruning manifesto** (2-3 lines at top)
   - "This file is deliberately kept under 150 lines. Every line here must be something that would cause noticeable mistakes if removed. If a rule only applies in one subdirectory, it belongs in that subdirectory's CLAUDE.md."

2. **Session protocol** (~60-80 lines)
   - session.md handling
   - Resume phrases
   - Update triggers
   - Context check rules

3. **Universal safety rails** (~30-40 lines)
   - Secrets handling (never commit, always use secrets.yaml)
   - Git workflow (branch strategy, commit format)
   - File modification safety (never/caution/safe lists)

4. **Orientation table** (~20-30 lines)
   - Brief mapping of domains to child CLAUDE.md locations (this stays permanently)
   - Note that child files load automatically for file-scoped work
   - Guidance for cross-domain work
   - **Map & Traverse rule:** "If a user asks a question about a specific domain but mentions no files, consult the Orientation Table and read the relevant `packages/[domain]/CLAUDE.md` (and other likely domains if ambiguous) before responding. Only ask the user if required inputs are missing to implement safely."
   - **Cross-domain tasks:** "For tasks spanning multiple domains (e.g., presence-triggered notification): identify the primary driving domain, read that CLAUDE.md first, then read secondary domain(s) if the task modifies entities there. Consult all relevant domains before proceeding."

### Domain-Specific Files

```
/config/packages/
├── occupancy/
│   └── CLAUDE.md             # Presence system rules (~80-100 lines)
├── communication/
│   └── CLAUDE.md             # WhatsApp/notification rules (~60-80 lines)
└── [others as validated]

/config/www/base/docs/
└── CLAUDE.md                 # Already exists, unchanged
```

---

## Domain Candidates Assessment

### Tier 1: Create Now

**packages/occupancy/CLAUDE.md**
- Highest complexity subsystem
- YAML anchors, template sensors, multiple areas
- Coupling hotspot (drives lighting, HVAC, alerts)
- Many non-obvious constraints and exclusion rules
- Estimated: ~80-100 lines
- **Size threshold:** If this exceeds ~120 lines after migration, consider splitting further (e.g., `occupancy/presence/CLAUDE.md` + `occupancy/doors/CLAUDE.md`) or moving procedural content to skills

**packages/communication/CLAUDE.md**
- Custom components (extended_openai_conversation)
- AI integration patterns
- Contact mapping logic
- Message flow rules
- WhatsApp-specific constraints
- Estimated: ~60-80 lines

### Tier 2: Evaluate After Tier 1 Validation

**packages/lights/CLAUDE.md**
- Presence integration rules
- Manual override logic
- Time-based brightness patterns
- However: Lighting is largely an *output* of other systems
- May not need own file if rules are simple enough
- Decision: Wait and assess after occupancy/communication

### Tier 3: Probably Not Needed

| Domain | Reason |
|--------|--------|
| packages/ai/ | Simple service calls, patterns straightforward |
| packages/device/ | Straightforward device configs |
| packages/network/ | Minimal complexity |
| packages/weather/ | Standard integrations |
| packages/time/ | Simple triggers |
| packages/shopping/ | Limited scope |
| packages/travel/ | Limited scope |
| packages/server/ | Mostly frontend, covered by www/base |
| packages/health/ | Limited scope |

---

## Domain CLAUDE.md Template

Each domain file should follow this structure:

**Naming convention:** Use uppercase `CLAUDE.md` consistently, matching the existing pattern established by `/config/CLAUDE.md` and `/config/www/base/docs/CLAUDE.md`. Do not introduce variations like `.claude.md` or `domain.claude.md`.

```markdown
# CLAUDE.md — [Domain Name]

> **Scope:** [What this subsystem does]
> **Last reviewed:** YYYY-MM
> **Read root /config/CLAUDE.md first for session protocol and universal rules**

## Key Files

[List of primary files in this domain with brief purpose]

## Critical Constraints

[Non-negotiable rules that must not be violated]
[Format as clear, imperative statements]

## Naming Conventions

[Domain-specific entity ID patterns]
[Any deviations from global conventions]

## Common Patterns

[Frequently used patterns in this domain]
[Include brief code examples where helpful]

## Coupling Warnings

[What this domain affects]
[What affects this domain]
[Specific files/entities to check when making changes]

## Anti-Patterns

[What not to do]
[Common mistakes to avoid]
[Why these are problematic]

## Cross-References

- Root: /config/CLAUDE.md
- Architecture: /config/ARCHITECTURE.md
- Related domains: [if applicable]
```

---

## Implementation Strategy

### Recommended Approach: Incremental with Validation

**Phase 1: Occupancy Domain**

1. Create `packages/occupancy/CLAUDE.md` using template
2. Extract relevant content from root CLAUDE.md
3. Remove extracted content from root (keep only orientation table entry)
4. Test with several occupancy-related tasks
5. Validate automatic loading works as expected

**Phase 2: Communication Domain**

1. Create `packages/communication/CLAUDE.md`
2. Extract relevant content from root
3. Remove extracted content from root (keep only orientation table entry)
4. Test with WhatsApp/notification tasks
5. Validate automatic loading

**Phase 3: Root Cleanup**

1. Verify orientation table is complete and accurate (this stays permanently)
2. Restructure root into four clear sections (manifesto, protocol, safety, orientation)
3. Prune aggressively using docs guidance: "Would removing this cause mistakes?"
4. **Avoid "ghosts":** Ensure removed sections are not replaced with vague summaries that reference content no longer present. Remove duplicated domain rules entirely; the orientation table provides the map.
5. Target: ~120-150 lines
6. Identify any "must happen every time" rules that should become hooks

**Important:** The orientation table stays in root permanently—it's cheap and helps high-level queries. What gets removed is duplicated domain content, not the map.

**Phase 4: Evaluation**

1. Assess whether lights/ needs own file
2. Consider CONTRACTS.md for coupling invariants if cross-domain issues arise
3. Consider skills (`.claude/skills/`) for repeatable workflows
4. Document lessons learned

### Validation Criteria

After each phase, verify:

- [ ] Child CLAUDE.md loads automatically when working in that directory
- [ ] Rules in child file are being followed
- [ ] No regression in areas covered by root file
- [ ] Cross-domain work doesn't suffer from missing context

**Cross-domain regression test (run after Phase 2):**

Deliberately test 4-5 typical cross-domain tasks to check for regression:

1. "When someone arrives home at night, turn on porch light at 30% and send me a WhatsApp welcome message"
2. "Create exclusion rule so office occupancy doesn't trigger living room lights after 23:00"
3. "Add new family member to WhatsApp notifications and make sure presence events reach them"

Watch for these failure modes:
- Forgets coupling constraints that used to live in root
- Fails to load one of the child files when it should
- Starts hallucinating rules that are no longer present

**Threshold:** If any of these behaviours occur more than once per 5 tasks, escalate priority of either stronger cross-domain scaffolding in root or early evaluation of CONTRACTS.md.

### Rollback Plan

If issues arise:
- Child files can be deleted
- Root content can be restored from git history
- Structure is non-destructive—child files are additive

---

## Key Risks and Mitigations

### R7: Cross-Domain Context Loss (Primary Remaining Risk)

**Scenario:** Task spans multiple domains (e.g., "add presence-triggered WhatsApp notification")

**Mitigations:**
1. Root file includes brief orientation table noting which domains to consider
2. Claude Code loads child files when any file in that directory is accessed
3. For explicitly cross-domain tasks, instruction in root: "When task spans domains, read relevant child CLAUDE.md files before proceeding"
4. Consider CONTRACTS.md if this proves problematic

### R3: Inconsistency Drift

**Scenario:** Domain files develop inconsistent structure/terminology over time

**Mitigations:**
1. Strict template adherence
2. "Last reviewed" date in each file header
3. Periodic review tied to significant domain changes
4. Template defined in this document

---

## Additional Considerations from AI Review

### CONTRACTS.md (ChatGPT proposal)

A dedicated file for cross-domain coupling invariants:
- Documents subsystem interfaces
- "When doing X, also check Y" rules
- Presence→lights, occupancy→alerts, WhatsApp flows

**Decision:** Not implementing initially. Evaluate after Phase 4 if cross-domain issues arise. The coupling information may fit adequately in individual domain files' "Coupling Warnings" sections.

### Skills as First-Class Option (Phase 4)

The docs explicitly recommend skills for "domain knowledge or workflows that are only relevant sometimes" since they load on demand without bloating every conversation.

**Strong candidates for skills (evaluate in Phase 4):**
- "Create new presence exclusion rule" workflow
- "Add new WhatsApp contact mapping" workflow
- "Create new automation following standard pattern" workflow
- Reference material needed occasionally but not every session

**Decision:** Deferred to Phase 4. During Phases 1-3, focus solely on CLAUDE.md migration to reduce moving parts. Skills evaluation happens after core restructuring is validated.

### Traversal Rule (Gemini suggestion)

For high-level questions that don't touch files (automatic loading wouldn't fire), the root file needs explicit guidance. This is now captured as the **Map & Traverse pattern** in the root orientation section:

> "If a user asks a question about a specific domain but mentions no files, consult the Orientation Table and read the relevant `packages/[domain]/CLAUDE.md` (and other likely domains if ambiguous) before responding. Only ask the user if required inputs are missing to implement safely."

**Decision:** Include in root CLAUDE.md orientation section.

---

## Success Metrics

After full implementation:

1. **Root file size:** ~120-150 lines (down from ~850)
2. **Domain file existence:** occupancy, communication confirmed; others as validated
3. **Instruction adherence:** No increase in rule violations
4. **Cross-domain work:** No significant friction increase
5. **Maintenance:** Easier to update domain-specific rules
6. **Onboarding:** New context (human or AI) can understand domain rules quickly

---

## Request for Implementation Plan

Based on this brief, create a detailed implementation plan that includes:

1. **Audit of current CLAUDE.md:** Categorise each section as:
   - Universal (stays in root)
   - Occupancy-specific (moves to packages/occupancy/CLAUDE.md)
   - Communication-specific (moves to packages/communication/CLAUDE.md)
   - Other domain (note which)
   - Repeatable procedure (note as skill candidate for Phase 4—do not action now)
   - Deterministic requirement (candidate for hook)
   - Redundant/removable

2. **Draft structure for root CLAUDE.md:** Outline the three sections with specific content

3. **Draft structure for packages/occupancy/CLAUDE.md:** Apply template, identify content to extract

4. **Draft structure for packages/communication/CLAUDE.md:** Apply template, identify content to extract

5. **Skills/hooks candidates:** List content better suited to skills or hooks, but note that skills conversion is deferred to Phase 4

6. **Migration sequence:** Specific steps with validation checkpoints

7. **Risk monitoring:** How to detect if restructuring causes problems

---

*Brief prepared: 2026-01-29*
*Repository: Home Assistant configuration*
*Current CLAUDE.md: ~850 lines*
*Target structure: Root (~120-150 lines) + domain files (~60-100 lines each)*

---

## Appendix A: Detailed AI Perspectives (Pre-Documentation)

### Claude Opus 4.5 (initial stance: skeptical)
- Argued the case for adoption was weaker than it appeared
- Flagged discovery problem (R1) as the real enemy
- Noted cross-domain work frequency as underweighted risk
- Suggested content-type split as alternative (rules vs reference)
- Wanted stronger evidence of actual problem before adding complexity

### ChatGPT (stance: adopt with caveats)
- Supported hybrid split
- Emphasised need for deterministic routing mechanism
- Proposed CONTRACTS.md for cross-domain coupling invariants
- Suggested mechanical triggers over judgment-dependent discovery
- Recommended enforcing domain-read rules in session protocol

### Gemini (stance: proceed)
- Rated discovery risk likelihood as High (disagreed with Medium)
- Noted fragmentation severity is High for Home Assistant specifically due to coupling
- Recommended imperative triggers in root file
- Suggested "Context Check" step in session protocol
- Proposed domain files contain "tribal knowledge" not obvious from code

### Grok (stance: moderately in favour)
- Leaned 75-80% toward adoption
- Suggested stricter threshold for domain files (two of three criteria)
- Recommended decision tree in root as primary mitigation
- Proposed phased migration with long validation period
- Noted 850 lines isn't catastrophic but isn't optimal
