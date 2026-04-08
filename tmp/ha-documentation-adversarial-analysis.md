# Adversarial Analysis: Documentation Layer Structural Weaknesses

**Generated:** 2026-04-07
**Source:** Complete documentation layer (`ha-documentation-complete.md`)
**Purpose:** Identify places where a model operating autonomously could plausibly misinterpret, overlook, or contradict documented rules despite having documentation injected into context.

---

## Finding 1: `.claude/README.md` Claims Only 5 Domains Have Auto-Injection Rules (Actually 15)

**Documents involved:**
- `.claude/README.md` lines ~1714-1715: *"Note: Only 5 of 13 package domains currently have auto-injection rules. The remaining 8 (dashboard, device, health, network, server, shopping, time, travel, weather) have CLAUDE.md files but no .claude/rules/ pointer — they rely on the root CLAUDE.md directing Claude to read them manually when working in those paths."*
- Actual filesystem: 15 rule files exist (all 14 domains + shared-ui)

**The problem:** The `.claude/README.md` explicitly states only 5 domains have auto-injection rules and names the 8 that don't. This was accurate when written (2026-02-24) but is now stale — all 14 domains have rules. However, the README is included in the assembled documentation and is the only document that explains *how the rules system works*. A model reading it will believe 8 domains rely on manual reads, when in fact all domains auto-inject.

**Concrete scenario:** A model working on a high-level question about shopping might skip reading the domain CLAUDE.md because the README says "they rely on the root CLAUDE.md directing Claude to read them manually" — and the root CLAUDE.md's orientation section says rules "auto-load via `.claude/rules/`", creating a contradiction about what actually happens.

**Confidence:** High that the stale README is a real documentation contradiction. Medium that it causes wrong output — the auto-injection happens regardless of what the README says.

---

## Finding 2: Five Cross-References Point to Non-Existent Files

**Documents involved:**
- `www/cards/work-actions-card/CLAUDE.md` → references `docs/work/transcript_pipeline_readme.md` — **does not exist**
- `packages/device/CLAUDE.md` → references `docs/reference/dad_car_detection/DAD_CAR_DETECTION.md` — **does not exist**
- `packages/ai/CLAUDE.md` → references `docs/projects/claude/bridge/claude-dispatch-protocol.md` — **does not exist**
- `packages/work/CLAUDE.md` → references `pyscript/speaker_rename.py` — **does not exist**
- `packages/work/CLAUDE.md` → references `tmp/action-extraction-plan-v2.1-final.md` — **does not exist**
- Root `CLAUDE.md` → lists `frigate.yml` in the Structure table — **does not exist at `/config/`**

**Concrete scenario:** A model is asked to understand the dispatch protocol. It reads `packages/ai/CLAUDE.md`, which says "Protocol reference: `docs/projects/claude/bridge/claude-dispatch-protocol.md`". The model attempts to read the file, gets an error, and either halts or proceeds without the protocol details that the CLAUDE.md assumed would be available. For `speaker_rename.py` — the work domain CLAUDE.md documents it as a companion pyscript file and the work-actions-card CLAUDE.md describes its API. A model asked to modify speaker rename behavior would attempt to read a file that doesn't exist.

**Confidence:** High — verified via filesystem. These are real broken links that would cause a model to waste turns or miss context.

---

## Finding 3: The `pyscript/` Directory Has No Documentation and Inconsistent Auto-Injection

**Documents involved:**
- Root `CLAUDE.md` Structure table: lists `pyscript/` as "Python automations (12 files)"
- `.claude/rules/work.md`: includes path `pyscript/action_extraction_pipeline.py` — only one of 12 pyscript files
- No `pyscript/CLAUDE.md` exists
- No `.claude/rules/` entry covers `pyscript/` as a whole

**The problem:** The pyscript directory contains 12 Python files handling CV detection, calendar ops, logging, system context, theme sync, and more. Only `action_extraction_pipeline.py` gets auto-injected context (via the work rule). The other 11 files — including safety-critical ones like `dad_car_detection.py` (welfare-relevant driveway detection with OpenAI Vision fallback) — have zero auto-injected guidance.

**Concrete scenario:** A model is asked to modify `pyscript/dad_car_detection.py`. No rule fires. No pyscript CLAUDE.md exists. The device domain CLAUDE.md mentions the file but wouldn't auto-inject (the rule triggers on `packages/device/**`, not `pyscript/**`). The model would operate with only root-level guidance — missing the specific coupling warnings about AI fallback toggles, contrast thresholds, and the OpenAI Vision API dependency.

**Confidence:** High — this is a real coverage gap with practical consequences.

---

## Finding 4: `automations.yaml`, `scripts.yaml`, and `scenes.yaml` Have No Auto-Injection and No Domain CLAUDE.md

**Documents involved:**
- Root `CLAUDE.md` Structure table: lists these as primary config files
- `ARCHITECTURE.md` Section 4: *"Automations split between root file and packages"*
- `ARCHITECTURE.md` Section 9: *"automations.yaml: 35 top-level automations"*
- No `.claude/rules/` entry for `automations.yaml`, `scripts.yaml`, or `scenes.yaml`

**The problem:** `automations.yaml` contains ~35 top-level automations across 2,533 lines. `scripts.yaml` contains 48 scripts across 3,967 lines. These are among the largest files in the repository. A model editing them receives zero domain-specific context beyond the root CLAUDE.md. The root CLAUDE.md lists these as "Safe" to modify but provides no guidance on their internal structure, naming patterns, or coupling relationships.

**Concrete scenario:** A model is asked to add a new automation. It could reasonably add it to `automations.yaml` or to a domain package file. The root CLAUDE.md doesn't state a preference. `ARCHITECTURE.md` Section 11 "Red Flags" says "Adding to root YAML instead of packages" is a red flag — but ARCHITECTURE.md is not auto-injected for any path, and a model would need to independently decide to read it.

**Confidence:** High that this is a coverage gap. Medium-high that it causes wrong placement decisions.

---

## Finding 5: README.md Domain Count Conflicts with Every Other Document

**Documents involved:**
- `README.md` line ~1168: *"packages/*/CLAUDE.md — Domain-specific rules (all 13 domains)"*
- Root `CLAUDE.md`: *"14 domain packages"* (multiple locations)
- `ARCHITECTURE.md`: *"14 package domains"*
- `system_context.yaml`: Lists 14 domains including `work`

**The problem:** README.md says 13 domains; everything else says 14. The work domain (added 2026-03-11) was added after the README was last fully updated.

**Concrete scenario:** Minor — a model asked "how many domains are there?" that consults the README would give the wrong count. More importantly, this kind of small inconsistency erodes trust in the documentation layer: if a model encounters conflicting numbers, it may question other documented facts.

**Confidence:** High that this is a real inconsistency. Low that it causes meaningful wrong output.

---

## Finding 6: Root CLAUDE.md "Safe/Caution/Never" Classification Is Misleadingly Coarse

**Documents involved:**
- Root `CLAUDE.md` Safety Rails: *"Safe: packages/, automations.yaml, scripts.yaml, pyscript/, themes/"*
- Root `CLAUDE.md` Safety Rails: *"Caution: configuration.yaml, frigate.yml"*
- `frigate.yml` does not exist at `/config/`
- Domain CLAUDE.md files contain critical constraints within `packages/`

**The problem:** The root CLAUDE.md tells a model to exercise caution with `frigate.yml`, but the file doesn't exist. More broadly, the "Safe/Caution/Never" classification in root CLAUDE.md is extremely coarse. `packages/` is listed as "Safe" as a whole, but domain CLAUDE.md files contain critical constraints (e.g., don't add a second automation targeting `todo.meeting_summaries`, don't remove the pet fountain polling, cover positions must be 1-95%). A model that reads only the root classification would reasonably assume all package edits are safe without further checking.

**Concrete scenario:** A model is asked to "clean up unused automations in the device package." The root CLAUDE.md says `packages/` is "Safe." It proceeds to remove the pet fountain polling automation (appears unused at first glance — it just presses a button hourly). The device CLAUDE.md explicitly calls this "welfare-critical" and an anti-pattern to remove — but the root's "Safe" classification gives false confidence.

**Confidence:** High. The "Safe" label for all of `packages/` is meaningfully misleading given the critical constraints documented in domain files.

---

## Finding 7: Cross-Domain Coupling Checks Are Structurally Unenforceable

**Documents involved:**
- `ARCHITECTURE.md` Section 5 "Before Modifying" table: 13 "check first" instructions
- Every domain CLAUDE.md "Coupling Warnings" section
- Root `CLAUDE.md`: *"For discussions outside these paths, read the relevant CLAUDE.md manually"*

**Specific unenforceable rules:**
1. *"If modifying Presence detection → Check packages/occupancy/CLAUDE.md; lights, activity alerts, cover vacancy checks"* — No hook enforces this. A model modifying `presence_detection.yaml` gets the occupancy CLAUDE.md auto-injected but does NOT get lights, device, or communication CLAUDE.md injected.
2. *"If modifying FP2 entity names → Floor 01 lighting (raw refs) AND cover vacancy checks"* — FP2 entities are referenced in occupancy, lights, and device packages. Renaming one requires checking three domains. No mechanism ensures all three are consulted.
3. *"If modifying Health sensors → Both health.yaml AND weight.yaml (duplicate definitions exist)"* — Both files are in the same domain, so the health CLAUDE.md auto-injects. But the instruction to check both files is buried in a coupling table in ARCHITECTURE.md, not in the health CLAUDE.md's anti-patterns section (which says "Don't add new sensors to health.yaml that duplicate definitions in weight.yaml" — slightly different guidance).

**Concrete scenario:** A model renames an FP2 sensor in `packages/occupancy/presence_detection.yaml`. The occupancy CLAUDE.md loads and mentions anchor patterns but doesn't mention Floor 01 raw sensor coupling (that's in the lights CLAUDE.md). The model completes the rename, breaking Floor 01 lighting silently.

**Confidence:** High. Cross-domain coupling enforcement relies entirely on a model voluntarily reading additional CLAUDE.md files, with no structural guarantee it will do so.

---

## Finding 8: Critical Rules Buried by Document Density

**Documents involved:**
- `ARCHITECTURE.md`: 1,069 lines. The single most critical safety information — the "Before Modifying" table (Section 5, lines ~704-722) — sits after 700+ lines of directory structure, naming conventions, and subsystem descriptions.
- `system_context.yaml`: 300+ lines of YAML. The "gotchas" section contains 30+ entries of varying criticality. *"Floor 01 lighting: Uses raw FP2 entity IDs, bypassing presence abstraction — rename breaks silently"* sits at the same visual level as *"Integration count: Includes frontend cards, not just backend services"*.
- Work-actions-card CLAUDE.md: 636 lines. The "Design System Violations" table (29 entries) contains both critical coupling information and trivial cosmetic notes at the same density.

**What gets missed:** A model skimming ARCHITECTURE.md is likely to absorb Section 1 (directory structure) and Section 3 (subsystem descriptions) but deprioritize Section 5 (coupling hotspots) and Section 7 (recovery characteristics) — yet these are where the actionable safety information lives.

**Concrete scenario:** A model asked to "update the presence system" reads ARCHITECTURE.md. It processes the first 600 lines (structure, naming, subsystems) and by the time it reaches the "Before Modifying" table at line 704, context window attention has degraded. It misses the specific cross-domain checks required.

**Confidence:** Medium-high. This is inherent to long documents and depends on model attention patterns, but the information architecture actively works against salience — the most dangerous information is deepest in the longest documents.

---

## Finding 9: Domain CLAUDE.md Files Assume Root CLAUDE.md Persists in Context

**Documents involved:**
- Every domain CLAUDE.md header: *"Read root CLAUDE.md first for session protocol and universal rules"*
- Auto-injection mechanism: `.claude/rules/*.md` injects only the domain CLAUDE.md, not the root

**The problem:** Every domain CLAUDE.md opens with "Read root CLAUDE.md first." But auto-injection doesn't inject the root — it's loaded at conversation start as the project instruction file. If a conversation has been running long enough for context compression to occur, the root CLAUDE.md content may have been partially or fully compressed. The domain CLAUDE.md's instruction to "read root first" becomes unenforceable — the model can't re-read it unless it explicitly uses a Read tool call.

**Critical missing context if root is compressed:** Git branch naming pattern (`claude/<description>-<session-id>`), commit format, secrets management rules, session.md update triggers, the "Safe/Caution/Never" file modification tiers, comment formatting standard (decorative boxes).

**Concrete scenario:** A long conversation where the model has been doing extensive UI work. It's asked to commit changes. The root CLAUDE.md (with git conventions) was loaded 50+ turns ago and may be compressed. The model proceeds with a generic commit message format rather than `<Action> <component> <description>`.

**Confidence:** Medium. Depends on conversation length and compression behavior, but the structural assumption (that root context persists) is architecturally fragile.

---

## Finding 10: The `ui/` Directory's Load-Bearing Constraint Lives Only in Volatile Auto-Memory

**Documents involved:**
- Root `CLAUDE.md` Structure table: lists `ui/` as "Dashboard config — lovelace resources, views, templates, extra modules"
- No `ui/CLAUDE.md`, no `.claude/rules/` entry for `ui/`
- `MEMORY.md`: *"configuration.yaml line 54-56: lovelace: mode: yaml with resources: !include ui/ui_lovelace_resources.yaml — In YAML mode, HA loads resources ONLY from the YAML file. .storage/lovelace_resources is HACS bookkeeping only — it does NOT load cards. NEVER remove entries from ui/ui_lovelace_resources.yaml assuming storage will cover them."*
- No permanent CLAUDE.md, ARCHITECTURE.md section, or domain doc captures this constraint

**The problem:** `ui/ui_lovelace_resources.yaml` is described in MEMORY.md as the *single source of truth for resource loading* in YAML mode. Removing entries from it breaks card loading. This critical constraint exists only in auto-memory — not in any CLAUDE.md, not in ARCHITECTURE.md, not in any auto-injected rule. The `themes/` and `addons/` directories similarly have zero documentation coverage.

**Concrete scenario:** A model is asked to clean up unused lovelace resources. It reads `ui/ui_lovelace_resources.yaml`, sees entries that also appear in `.storage/lovelace_resources`, and removes the "duplicates" from the YAML file — breaking all custom card loading. The MEMORY.md warning exists precisely because this happened before, but MEMORY.md is capped at 200 lines and could be displaced by future entries.

**Confidence:** High. The `ui/` directory contains a load-bearing file with a non-obvious constraint, and the only documentation for it is in volatile auto-memory rather than any permanent CLAUDE.md.

---

## Finding 11: `RESTRUCTURING_BRIEF.md` Contains Stale Guidance That Contradicts Current State

**Documents involved:**
- `.claude/RESTRUCTURING_BRIEF.md` lines ~2013-2025: Tier 3 assessment says packages/ai/, packages/device/, packages/server/, packages/shopping/, packages/time/, packages/travel/, packages/weather/, packages/health/ "Probably Not Needed" for CLAUDE.md files
- Reality: All of these domains now have CLAUDE.md files and auto-injection rules

**The problem:** The RESTRUCTURING_BRIEF is included in the assembled documentation and contains an explicit assessment that most domains don't need CLAUDE.md files. If a model reads this document (which it might during any meta-documentation task), it could conclude that domain CLAUDE.md files for these 8 domains are unnecessary or low-value — and deprioritize reading or maintaining them.

**Concrete scenario:** A model asked to "review the documentation structure" reads the RESTRUCTURING_BRIEF and reports that 8 domain CLAUDE.md files exist contrary to the original assessment that they were "Probably Not Needed," suggesting they might be candidates for removal.

**Confidence:** Medium. The RESTRUCTURING_BRIEF is clearly historical, but it contains authoritative-sounding assessments that directly contradict the current state.

---

## Summary

| # | Category | Severity | Confidence |
|---|----------|----------|------------|
| 1 | Conflicting guidance | Low | High |
| 2 | Stale cross-references | Medium | High |
| 3 | Coverage gap | Medium-High | High |
| 4 | Coverage gap | Medium | High |
| 5 | Conflicting guidance | Low | High |
| 6 | Ambiguous priority / misleading | Medium-High | High |
| 7 | Unenforceable instructions | High | High |
| 8 | Density vs salience | Medium | Medium-High |
| 9 | Implicit assumptions | Medium | Medium |
| 10 | Coverage gap | High | High |
| 11 | Stale guidance | Low-Medium | Medium |

The highest-risk findings are **#7** (cross-domain coupling checks are structurally unenforceable), **#10** (the `ui/` load-bearing constraint lives only in volatile memory), and **#3** (pyscript has no documentation coverage despite containing safety-critical code). These three represent scenarios where a model operating autonomously would produce wrong output not from ignoring documentation, but because the documentation architecture structurally cannot deliver the right context at the right time.
