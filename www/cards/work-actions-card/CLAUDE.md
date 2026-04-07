# CLAUDE - Work Actions Card

> **Scope:** Todo checklist card — displays and toggles items from `todo.work_actions`
> **Last reviewed:** 2026-03
> **Read root CLAUDE.md and www/base/docs/CLAUDE.md first for session protocol and UI governance rules**

---

## Summary

A single-file Web Component that renders work action items as an animated checklist. Items originate from the action extraction pipeline (see `packages/work/CLAUDE.md`) which writes to `todo.work_actions`. The card fetches items via WebSocket, renders with patch-based diffing, uses optimistic UI updates with error rollback, and supports inline editing, meeting summary viewing, and persistent settings.

---

## Structure

| File | Purpose |
|------|---------|
| `work-actions-card.js` | Single entry point — card class, editor, styles, settings, all logic |

**Companion YAML:** `packages/work/work_actions_card.yaml` — HA helper entities for persistent settings.

This card is intentionally single-file. The editor is minimal (entity + title config only).

---

## Key Components

### Entity & Services

| Entity | Role |
|--------|------|
| `todo.work_actions` | Default target — C's personal action list (populated by pipeline) |
| `todo.meeting_summaries` | Source — fetched on demand for meeting summary drawer |

**Services called:**
- `todo.get_items` (via `hass.connection.sendMessagePromise` with `return_response: true`) — fetches items from both entities
- `todo.update_item` (via `hass.callService`) — toggles status (fire-and-forget) and saves edits (title + due date)

### Interactions

| Gesture | Desktop | Touch (iPad/phone) | Action |
|---------|---------|-------------------|--------|
| Single tap/click | Click | Tap | Toggle checkbox |
| Double tap/click | Double-click (within 350ms) | Double-tap | Open edit modal |
| Hover | Mouseenter (200ms + 350ms delay) | — | Show rich tooltip with "View meeting" action |
| Long press | — | Hold 500ms | Show rich tooltip (same as hover) |

### Internal State

| Field | Type | Purpose |
|-------|------|---------|
| `_items` | Map | `uid → { uid, summary, checked, due, description }` — canonical model |
| `_rowEls` | Map | `uid → DOM element` — row references for direct mutation |
| `_animTimers` | Map | `uid → setTimeout ID` — pending animation cleanup |
| `_exitingRows` | Set | UIDs currently animating out (prevents `_patch()` from removing mid-exit) |
| `_exitTimers` | Map | `uid → setTimeout ID` — delayed exit after check animation |
| `_settings` | Object | `{ maxHeight, showCompleted, sortOrder }` — from HA helpers or DEFAULTS |
| `_drawerOpen` | Boolean | Defers settings animations while meeting summary drawer is open |
| `_settingsDirty` | Boolean | Tracks if settings changed while drawer was open |
| `_fetchGen` | Number | Generation counter — prevents stale async fetches from clobbering newer results |

### Patch-Based Diffing

`_patch(serverItems)` runs a multi-phase diff:
1. **Filter** — remove completed items from incoming if `showCompleted` is off (preserves items mid-exit)
2. **Sort** — reorder incoming Map if sort setting is non-Default
3. **Remove** — animate out rows whose UIDs are no longer in the incoming set (batched via `_processExitBatch`)
4. **Update/Create** — mutate changed properties on existing rows, create new rows
5. **Reorder + FLIP** — reorder DOM to match incoming order, FLIP animate existing rows that moved
6. **Entry animate** — fade in new rows with stagger (300ms base delay after FLIP)

### Optimistic Updates

On checkbox click:
1. Flip `item.checked` immediately (local model)
2. Apply animation classes to DOM
3. Fire service call (no `await`)
4. On `.catch()` — revert model, snap row back, cancel pending exit

### Custom Checkbox Animation

Bespoke two-stroke checkmark — not the shared UI system checkbox. Thin accent-colored strokes animate in sequence (400ms concurrent). Coupled geometry: `right: 60%` / `left: 40%` split, `top: 8px`, 45deg/-45deg rotation, 5px/10px widths.

### Firework Celebration Effect

On completion: 4px dot emits 6 box-shadow particles over 500ms with 100ms delay.

### Exit Animation (showCompleted off)

When checking an item with showCompleted off:
1. **0ms** — tick animation plays, UID added to `_exitingRows`
2. **600ms** — animation cleanup
3. **2100ms** — `_animateRowOut` fires → batched with any other simultaneous exits
4. **Batch** — all exiting rows fade out together (250ms), removed from DOM, remaining rows FLIP slide up with stagger

### Due Date Handling

**Urgency tiers:** overdue (`--ui-error`), soon/1-3 days (`--ui-warning`), future (`--ui-text-mute`), completed (`--ui-border-color-strong`).

**Formatting:** "Today", "Tomorrow", "Yesterday" for +-1 day; `en-GB` locale otherwise.

### Tooltips

Hover (desktop) or long-press (touch) shows a **persistent rich tooltip** with:
- **Title** — `Source:` field (meeting name)
- **Intro** — meeting date
- **Items** — progression history blocks
- **Action** — "View meeting" link → opens meeting summary drawer

**Timing:** 200ms dismiss-race safety gap + 350ms show delay = 550ms total. Mouseleave starts 500ms dismiss timer. Long-press on touch suppresses the subsequent click toggle.

### Dropdown Menu

Ellipsis button (top-right, always visible) opens a `ui-menu--down` dropdown (PM-style):
- **Sort** — cycles Newest first → Urgency first → Active first
- **Show/Hide completed** — toggles filter
- **Hover tooltips** — toggle with checkbox + inverted dot indicator (dot shows when OFF)
- **Clear all new** — marks all items as seen, removes new indicator dots
- **Settings** — opens modal with height and new indicator expiry inputs

Click-outside or Esc closes the menu. Settings changes are deferred while the meeting summary drawer is open.

### Meeting Summary Drawer

Right-side slide-out panel (shared `drawer.js`) repurposed as a contextual meeting summary viewer:
- Opened via "View meeting" action in the tooltip
- Fetches from `todo.meeting_summaries` via WebSocket, matches by title + date
- Renders summary with basic markdown: `## Heading` → `<h4>`, `- item` → `<li>`, `**bold:**` → `<strong>`
- Shows "Summary not available" if meeting is older than 7-day cleanup window

### Speaker Rename/Merge

Speaker badges in the drawer metadata area are interactive:
- **Tap** → opens a rename modal (text input pre-filled with current name)
- **Long-press (touch) / right-click (desktop)** → opens a merge modal (radio buttons listing other speakers)

Rename calls `pyscript.speaker_rename` to update all source files and entities for that meeting. Merge is the same service with `merge: true`, which also removes the ghost speaker from the Speakers metadata line.

After rename/merge, the drawer re-fetches the summary from `todo.meeting_summaries` and re-renders.

### Edit Modal

Double-tap on a row opens an edit modal (rendered in shadow DOM for styled input access):
- **Title** — text input with floating label, pre-filled and auto-selected
- **Due date** — native `<input type="date">` with floating label (iOS shows date wheel)
- Save persists via `todo.update_item` with `rename` + `due_date` — description field untouched (pipeline metadata preserved)
- Pipeline handles hash mismatch safely (appends instead of overwriting)

### New Item Indicator

Pink dot protruding from the top-left corner of the row card for items not yet interacted with. Uses localStorage for persistence:
- `wac-first:<uid>` — timestamp when item was first encountered
- `wac-seen:<uid>` — set when user interacts (double-tap/edit or "View meeting" — single-tap toggle does NOT mark as seen)

Auto-expires after configurable hours (default 48h). Never shown on completed items. "Mark All Read" menu option marks all items as seen.

### Delete Action

The edit modal (double-tap) includes a Delete button (`ui-btn--danger ui-btn--filled`). Clicking it replaces the modal content with a confirmation prompt showing the action title and a warning. Confirming calls `todo.remove_item` to permanently delete the item. The row is removed from DOM immediately (optimistic).

### Completed Shelf-Life

Completed items older than the configured shelf-life (default 7 days) are automatically hidden from the card. Uses the `Meeting date:` from the item's description as the age reference. Items without a meeting date are kept (no false removals). Configurable via the settings modal (1–90 days).

### Settings Persistence

| Setting | Helper Entity | Control | Default |
|---------|---------------|---------|---------|
| Height | `input_number.wac_max_height` | Number input in modal (200–5000px) | 600 |
| Show completed | `input_boolean.wac_show_completed` | Menu toggle | on |
| Sort order | `input_select.wac_sort_order` | Menu cycle | Newest first |
| Hover tooltips | `input_boolean.wac_hover_tooltips` | Menu toggle with checkbox + dot indicator | on |
| New indicator expiry | `input_number.wac_new_indicator_hours` | Number input in modal (1–168h) | 48 |
| Completed shelf life | `input_number.wac_completed_shelf_days` | Number input in modal (1–90 days) | 7 |

Pattern: immediate local update + async HA write. Settings read from helpers on every `set hass()` call to pick up external changes. Menu labels sync automatically.

---

## Shared UI System Integration

### What It Uses

| Import | Usage |
|--------|-------|
| `foundation.js` | Tokens — spacing, color, radius, shadow, elevation, typography, motion |
| `components.js` | `uiComponents` — card header, buttons, menu dropdown, inputs |
| `helpers.js` | `applyThemeClass`, `getHelperNumber`, `getHelperBoolean`, `getHelperSelect`, `persistHelper` — theme sync + HA helper entity read/write |
| `utilities.js` | `escapeHtml` — HTML escaping for dynamic content |
| `tooltips.js` | `showRichTooltip()` / `hideRichTooltip()` — persistent tooltips with action buttons |
| `toggles.js` | `uiToggles` — toggle switch styles (adopted) |
| `checkboxes.js` | `uiCheckboxes` — checkbox styles for menu toggle items |
| `drawer.js` | `uiDrawer` + `openDrawer()` / `closeDrawer()` — meeting summary panel |
| `modals.js` | `showModal()` — height settings modal (light DOM) |

### What It Does NOT Use

- `radios.js`, `skeletons.js` — not needed (note: speaker merge modal has its own inline radio buttons, not the shared `radios.js`)

### Design System Violations

Remaining known divergences. All intentional.

| Issue | Current | Notes |
|-------|---------|-------|
| Checkbox box size | `15px` | Bespoke stroke checkbox, not the 26px system checkbox |
| Check mark dimensions | `5px`, `10px`, `8px` | Geometric constraints of the stroke animation — coupled set |
| Animation timing (check) | `0.4s ease` | Tuned with label/firework; `ease` chosen over system curve |
| Animation timing (label) | `0.3s ease 0.1s` | Sequenced with check strokes |
| Animation timing (firework) | `0.5s ease 0.1s` | Celebration effect needs extra time |
| Firework offset | `-25px` | Positional — anchors particle origin near checkbox |
| Animation cleanup timer | `600ms` | JS timeout — must exceed longest animation |
| Tooltip 200ms safety gap | `setTimeout 200ms` | Works around tooltip system's 150ms deferred removal race condition |
| `maxHeight` naming | DEFAULTS key, method name, helper entity all use "maxHeight" / "max_height" | Legacy from when the setting was `max-height`. Now controls fixed `height`. Renaming the HA entity would orphan existing stored values. |
| Choreography: exit fade | `250ms ease-in-out` | Multi-element orchestration — not reducible to single-element motion tokens |
| Choreography: FLIP reflow | `450ms ease-in-out`, `50ms` stagger | Row slide-up after exit — `ease-in-out` essential to feel |
| Choreography: entry | `350ms ease-in-out`, `40ms` stagger | New row fade-in — sequenced with FLIP |
| Action card meta margin | `margin-top: -2px` | Optical vertical alignment on due date text |
| Settings modal input width | `width:100px` (inline) | Fixed width for number inputs in settings modal — no grid token fits |
| Modal removal delay | `setTimeout 150ms` | Safety buffer after 120ms fade to prevent flash on DOM removal |
| Speaker merge radio buttons | Inline custom radios | Not the shared `radios.js` — lightweight single-use in a modal |
| Speaker long-press timer | `500ms` | Matches the main card's long-press timing |

---

## Development Workflows

### Changing Animation Timing

The checkbox, label, and firework animations are sequenced. If you change one:
- Check strokes: 400ms concurrent
- Label strikethrough: 400ms (text-decoration delay 40%)
- Label move: 300ms with 100ms delay
- Firework: 500ms with 100ms delay
- JS cleanup timer: 600ms (must be >= max animation total)

### Testing Changes

1. Single tap — checkbox toggles with animation
2. Double-tap — edit modal opens with current values
3. Toggle rapidly — no animation stacking
4. Toggle with showCompleted off — tick plays, holds 1.5s, row fades out, remaining rows slide up
5. Hover/long-press — rich tooltip with "View meeting" action
6. Click "View meeting" — drawer opens with formatted meeting summary
7. FAB menu — sort cycles, completed toggles, settings opens modal
8. Settings changes while drawer open — deferred until drawer closes
13. Speaker chip tap — rename modal opens with current name
14. Speaker chip long-press/right-click — merge modal opens with other speakers
15. Rename save — drawer re-renders with updated names
16. Merge confirm — ghost speaker removed, lines reassigned
9. Edit save — title/due update immediately, service call persists
10. Light/dark themes — all elements adapt via tokens
11. Reduced motion — all animations disabled, instant state changes
12. Touch devices — long-press for tooltip, double-tap for edit, no text selection

---

## Conventions for AI Assistants

### Anti-Patterns

- Don't replace the bespoke checkbox with the system checkbox — deliberate design choice
- Don't re-render the items container — patch algorithm prevents this (breaks in-flight animations)
- Don't `await` the toggle service call — fire-and-forget with catch-based rollback
- Don't remove `_fetchGen` — prevents stale fetch race conditions
- Don't change check stroke geometry values independently — coupled set
- Don't modify the `description` field when editing items — pipeline metadata must be preserved
- Don't assume `hass` is available in `constructor()` — arrives later via setter
- Don't use `showModal()` for modals that need floating label inputs — `showModal` renders in light DOM without `adoptedStyleSheets`; use shadow DOM instead

### Coupling

**Upstream (data source):**
- `todo.work_actions` — populated by `pyscript/action_extraction_pipeline.py`
- `todo.meeting_summaries` — fetched on demand for drawer (7-day cleanup window)
- Pipeline writes `description` field with metadata — tooltips parse this, edit modal preserves it
- `pyscript/speaker_rename.py` — called by speaker rename/merge UI to update files and entities
- See `packages/work/CLAUDE.md` for pipeline details

**Settings helpers:**
- `input_number.wac_max_height`, `input_boolean.wac_show_completed`, `input_select.wac_sort_order`, `input_boolean.wac_hover_tooltips`, `input_number.wac_new_indicator_hours`, `input_number.wac_completed_shelf_days`
- Defined in `packages/work/work_actions_card.yaml`

**Shared UI system:**
- `www/base/foundation.js` — tokens
- `www/base/components.js` — `uiComponents` (card header, FAB, FAB menu, buttons, inputs)
- `www/base/helpers.js` — `applyThemeClass`
- `www/base/tooltips.js` — `showRichTooltip` / `hideRichTooltip`
- `www/base/toggles.js` — `uiToggles`
- `www/base/drawer.js` — `uiDrawer` + `openDrawer` / `closeDrawer`
- `www/base/modals.js` — `showModal`

**Consumed by:**
- Dashboard views that include `custom:work-actions-card`

### Cross-References

- Root: /CLAUDE.md
- UI governance: /www/base/docs/CLAUDE.md
- Work domain: /packages/work/CLAUDE.md
- Pipeline code: /pyscript/action_extraction_pipeline.py
- Pipeline docs: /docs/work/transcript_pipeline_readme.md
- Architecture: /ARCHITECTURE.md

---

## TODOs & Gaps

- **No keyboard interaction** — rows are click-only; no focus management or Enter/Space handling
- **No ARIA attributes** — checkbox role, checked state, and list semantics not declared
- **Checkbox hit area undersized** — 15px checkbox visual within 48px row; transparent padding could extend the target
- **Editor is stub** — shows a text hint only; no actual form fields for entity/title config
- **Long-press tooltip belongs in shared UI** — currently card-specific; should be a `tooltips.js` helper
- **Summary matching limited** — uses partial title match on `todo.meeting_summaries` (7-day retention); older meetings show "not available"

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-04-02 | — | Speaker rename/merge: tappable speaker chips in drawer metadata, rename modal (tap), merge modal (long-press/right-click), calls `pyscript.speaker_rename` to update source files and entities |
| 2026-03-15 | — | PM-style dropdown menu replacing FAB menu, hover tooltip toggle with checkbox + dot indicator, new item indicator (pink dot, localStorage, auto-expire), "Newest first" sort by meeting date, "Clear all new" menu option, elevated row backgrounds, header divider line, double-tap fix (delayed single-tap), row vertical alignment fixes. Shared utility extraction: `escapeHtml` → `utilities.js`, helper readers → `helpers.js`. Tooltip pointer-events fix moved to `tooltips.js`. |
| 2026-03-14 | — | Edit modal (double-tap), FAB menu replacing drawer settings, meeting summary drawer, tooltip action buttons, FLIP/entry/exit animations, touch support (long-press, text selection prevention), drawer corner radius fix |
| 2026-03-14 | — | Settings drawer: shared `drawer.js` component, max height / show completed / sort order settings, HA helper persistence |
| 2026-03-13 | — | UI tidy-up: token-ised CSS, rich tooltip, hover state, reduced-motion, unavailable entity state |
| 2026-03-13 | — | Initial CLAUDE.md created |

*Last Updated: 2026-04-02*
