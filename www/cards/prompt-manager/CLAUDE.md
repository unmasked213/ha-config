# CLAUDE - Prompt Manager Card

> **Scope:** AI prompt library — CRUD, scoring, versioning, template variables, HA backend sync
> **Last reviewed:** 2026-03
> **Read root CLAUDE.md and www/base/docs/CLAUDE.md first for session protocol and UI governance rules**

---

## Summary

The Prompt Manager Card is a full CRUD interface for an AI prompt library stored in Home Assistant. It supports scoring, versioning, template variable substitution, and dual-write persistence to both a custom HA backend component and localStorage. The card also integrates with HA snapshot injection for pre-filling prompts with live system context.

---

## Structure

| File | Purpose |
|------|---------|
| `prompt-manager.js` | Entry point and card class. Imports all modules and mixes in render/event methods. Owns all state. |
| `modules/render.js` | All rendering methods — card shell, prompt grid, modals (add/edit/view/fill/history/table/dev), header |
| `modules/events.js` | All event handlers — CRUD operations (add, update, delete), FAB animation, outside-click/Esc dismissal |
| `modules/data.js` | Persistence — dual-write to HA backend (`prompt_manager` WebSocket) and `localStorage` fallback; migration from old schema |
| `modules/scoring.js` | AI scoring, prompt optimization, scope directives, backend polling for async results |
| `modules/variables.js` | Template variable extraction (`{{name}}` syntax) and substitution for fill-in modal |
| `modules/constants.js` | `TOOLTIP_CONTENT`, `CATEGORY_META`, `CATEGORIES`, `uuid()` helper |
| `modules/highlight.js` | Syntax highlighting for prompt content |
| `modules/styles.js` | Card-specific CSS (separate from shared UI tokens) |

---

## Key Components

### Entry Point

`prompt-manager.js` is the card class. It imports all modules, mixes in render and event methods, and owns all state via `this.state`.

### Backend Storage via Custom Component

Data is persisted via the `prompt_manager` custom component through two HA WebSocket commands:
- `prompt_manager/get_prompts` — fetch all prompts on card load
- `prompt_manager/set_prompts` — save after every mutation

**Dual-write pattern:** Every save calls `savePromptsToLocalStorage()` AND `savePromptsToBackend()`. Backend failure sets `localStorage["ai_prompts_unsynced"]` and is retried on next connection. Never remove the localStorage fallback.

### HA Snapshot Inject Button

The fill-modal inject button reads `sensor.ha_server_snapshot` attribute `snapshot` via the HA state object. This is populated by `packages/ai/ha_snapshot_sensor.yaml`. If the entity is unavailable, the inject button silently produces empty content.

### Scoring (Category-Scoped)

Auto-scoring on add/update uses the **first category** as the rubric. `Reference` category prompts are never scored. Scoring calls an async HA operation and polls for result — do not assume synchronous completion.

### Category Rules

**Reference is exclusive.** Selecting Reference deselects all other categories (with a pulse-out animation). Selecting any other category while Reference is active replaces Reference. The dropdown trigger is blocked (red border + tooltip) when Reference is the sole category — the user must remove it via chip click first.

**Uncategorized is a save-time fallback.** If a prompt has real categories alongside Uncategorized, the save handler (`handleFormSubmit`) strips Uncategorized. This runs only at save time, not during editing, to avoid disrupting the UI flow.

### Save-Time Content Normalisation

`handleFormSubmit` strips outer triple-backtick fences from prompt content on save. Detection: first/last 3 characters of trimmed content. Language identifiers on the opening fence are also stripped. Internal sequential fences are preserved. This normalises prompts pasted from dev-mode copies back into clean stored content.

### Copy Output Wrapping

Copy output adapts to prompt type and mode:
- **Reference category** → always wrapped in triple-backtick fence
- **Non-reference + dev mode** → fenced, with `<pm-source id="slug" />` inside the fence
- **Non-reference + normal mode** → raw content, no fence

When copy will fence the output, `substituteVariables` receives `skipFenceWrap=true` to prevent double-fencing of multiline variable values.

### Collapsible `<inputs>` Block (View Modal)

The view modal detects a leading `<inputs>` XML block (case-insensitive, tag-boundary-aware) and renders it as a collapsed toggle pill showing the child element count. The toggle uses `aria-expanded` and a max-height CSS transition. The edit textarea always shows the full raw content — collapsing is view-only.

### Visibility Change Guard

`prompt-manager.js` skips backend re-fetch on `visibilitychange` when `showAddForm`, `editingPrompt`, or `fillingPrompt` is truthy. Without this, switching browser tabs and returning triggers `_fetchAndApplyBackendPrompts()` → `render()`, which rebuilds the DOM and wipes unsaved form input.

### State Management

The `this.state` object lives only for the page session. On page refresh the state is re-initialised from localStorage/backend. Never try to persist state fields directly.

### Module Coupling

- **render.js** <- reads `this.state`, `this.config`; writes to `this.shadow` (DOM)
- **events.js** <- mutates `this.state`; calls `savePrompts()`, `scorePrompt()`, `render()`
- **data.js** <- depends on `hass.connection`; `migratePrompt()` runs on every load (schema migration)
- **scoring.js** <- depends on HA `hass` object for service calls and `hass.states` for poll-based fallback; returns scores asynchronously
- **variables.js** <- pure functions, no HA dependency; `substituteVariables` accepts `skipFenceWrap` flag from events.js fill-copy handler

### Shared UI System Dependency

The card adopts stylesheets from:
- `/local/base/foundation.js` — tokens (imported for side-effects)
- `/local/base/components.js` — `uiComponents` adopted stylesheet
- `/local/base/checkboxes.js` — `uiCheckboxes` adopted stylesheet

If base files change structure, verify `adoptedStyleSheets` adoption still works.

---

## Development Workflows

### Working with Prompts

All CRUD mutations flow through `events.js`, which mutates `this.state`, then calls `savePrompts()` (dual-write) and `render()`.

### Adding a New Modal

1. Add render method in `render.js`
2. Add corresponding event handlers in `events.js`
3. Ensure Esc and outside-click dismissal are wired up (required for all modals)

### Testing Changes

1. Verify dual-write: confirm both localStorage and backend are updated after a mutation
2. Verify scoring: add/update a non-Reference prompt and confirm async score polling completes
3. Verify inject: open fill modal, click inject, confirm snapshot content appears (requires `sensor.ha_server_snapshot` to be available)

---

## Conventions for AI Assistants

### Anti-Patterns

- Don't rename `prompt_manager/get_prompts` or `prompt_manager/set_prompts` without updating `custom_components/prompt_manager/`
- Don't remove the localStorage fallback — it's the safety net when HA is unreachable
- Don't add render methods to `events.js` or event handlers to `render.js` — modules are separated by concern
- Don't add a new modal state without also adding Esc/outside-click dismissal
- Don't score `Reference` category prompts — they bypass scoring intentionally
- Don't assume `hass.connection` is available at construction time — check before use
- Don't allow Reference to coexist with other categories — exclusivity is enforced in `_toggleCategory` and the dropdown trigger guard
- Don't call `_updateCategoryChips` synchronously after `_pulseOutChips` — the DOM rebuild destroys the animation. The state change and chip rebuild are deferred by a 700ms `setTimeout` matching the CSS animation duration in styles.js. Changing either duration requires updating the other
- Don't add `stopPropagation()` to a click handler without also calling `hideRichTooltip()` and clearing error borders — persistent tooltips use a document-level click-outside listener that `stopPropagation` blocks. See the dropdown trigger and chip removal handlers for the pattern
- Don't call `render()` or `_fetchAndApplyBackendPrompts()` while a form/fill modal is open — it rebuilds the DOM and wipes unsaved user input
- Don't add prompt content to the search filter — title, description, and categories give relevant results. Content matching was tested and removed because prompt bodies are long enough that most queries matched most prompts, drowning out relevant hits
- Don't make the grid copy button show the fill modal in dev mode — the `filledContent` bypass at `copyPrompt(prompt, this._devMode ? prompt.content : null)` is intentional. Dev-mode grid copy produces raw template content with `<pm-source>` provenance tag inside a fence, for AI consumption. The view-modal copy path omits `filledContent`, so it shows the fill modal even in dev mode — that's the user-facing copy path. These two paths serve different purposes

### UI Token Exceptions

**Syntax highlighting (`.pm-highlighted` rules)** — All styles scoped to `.pm-highlighted` are exempt from `--ui-*` token constraints. The highlighting layer serves different goals than the UI component layer: (1) **Syntax colour palette** — Dracula-derived, desaturated to harmonise with the UI token palette. Defined as scoped `--hl-*` CSS variables with dark and light variants. (2) **Rendered markdown** — bold (`font-weight: 700`), heading sizing (`font-size: 1.15em`), and hidden markdown markers (`font-size: 0`) require values the token scale doesn't provide (`--ui-font-weight-l` caps at 500, no heading-size token exists).

**Sub-token spacing for visual precision** — Badge padding (`3px 10px`), badge gap (`6px`), chip gap (`5px`), and header-menu dot size (`7px`) use hardcoded px values that sit between token scale increments. These are intentional optical adjustments for small, dense UI elements where the 4→8px token jump is too coarse.

**Table modal width** — The table modal uses `clamp(400px, 95%, 1200px)` which exceeds `--ui-modal-max-width-l` (960px). A multi-column data table with sortable headers requires the extra width to avoid horizontal truncation. No token covers this use case.

### Coupling Warnings

**Depends on:**
- `custom_components/prompt_manager/` — WebSocket command handler (backend)
- `script.score_prompt` — AI scoring (UI-created, not in YAML)
- `script.optimize_prompt` — AI optimization (UI-created, not in YAML)
- `script.update_prompt_description` — AI description generation (UI-created, not in YAML)
- `script.generate_variable_descriptions` — AI variable descriptions (UI-created, not in YAML)
- `packages/server/ha_snapshot_sensor.yaml` — provides `sensor.ha_server_snapshot.snapshot` for inject
- `www/base/components.js`, `checkboxes.js`, `foundation.js` — shared UI system

**Consumed by:**
- Dashboard views that include the `prompt-manager-card` custom element

### Cross-References

- Root: /CLAUDE.md
- UI governance: /www/base/docs/CLAUDE.md
- HA backend: /custom_components/prompt_manager/
- Snapshot sensor: /packages/server/ha_snapshot_sensor.yaml
- Architecture: /ARCHITECTURE.md S3 (Prompt Manager Card subsystem)

---

## TODOs & Gaps

- **Legacy `prompt_ai_request` event automation** — `packages/ai/prompt_manager.yaml` defines a `generate_prompt_fields_automation` that listens for `prompt_ai_request` events. The current card does not fire this event; it calls scripts directly via `hass.callService`. The automation appears unused and may be removable.

---

## Changelog

| Date | Commit | Change |
|------|--------|--------|
| 2026-04-02 | — | Audit fixes: silent AI failure logging, backend write serialization, phantom date fix, visibility guard extended to all modals, outside-click menu scoping, copy timer cleanup, collision-resistant IDs, migration forward-compat, fabricated score fallback removal, keydown listener dedup. Docs: added 4 UI-created script dependencies, scoring.js poll fallback coupling, legacy automation gap |
| 2026-03-29 | — | Save: outer fence stripping, Uncategorized cleanup. Copy: category/dev-mode-aware wrapping, skipFenceWrap param. Categories: Reference exclusivity with pulse-out animation, dropdown guard. View: collapsible `<inputs>` block. Fixes: tooltip dismissal for stopPropagation handlers, visibility-change form-wipe guard, pulse-out animation race. Code comments added to all 5 module files |
| 2026-03-28 | — | Added FLIP grid animations, diagonal intro animation, scope dropdown flash fix. Replaced hardcoded scrollbar colours with `--ui-scrollbar-thumb`, chip-pop-in timing with `--ui-switch-motion`. Documented Dracula palette and sub-token spacing as UI exceptions |
| 2026-03-25 | — | Fixed ha_snapshot_sensor.yaml path: packages/ai/ → packages/server/. Added missing highlight.js to structure table |
| 2026-02-24 | b350903 | Restructured to 8-section format |

*Last Updated: 2026-04-02*
