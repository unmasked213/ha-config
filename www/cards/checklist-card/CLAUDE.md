# CLAUDE - Checklist Card

> **Scope:** Animated todo checklist — fetches and toggles items from any HA `todo` entity
> **Last reviewed:** 2026-04
> **Read root CLAUDE.md and www/base/docs/CLAUDE.md first for session protocol and UI governance rules**

---

## Summary

A single-file Web Component that renders a todo list as an animated checklist. Items are fetched via WebSocket from any HA `todo` entity, displayed with bespoke two-stroke checkmark animations and firework celebration on completion. Uses optimistic UI updates with catch-based rollback and patch-based diffing to avoid full re-renders. The simplest custom card in the collection — no settings, no drawer, no tooltips, no companion YAML.

---

## Structure

| File | Purpose |
|------|---------|
| `checklist-card.js` | Single entry point — card class, editor stub, styles, patch diffing, checkbox animation, optimistic toggle |

No companion YAML. No helper entities. The card works with any HA `todo` entity out of the box.

---

## Key Components

### Card Config

```yaml
type: custom:checklist-card
entity: todo.shopping_list  # required — any todo entity
```

The only config key is `entity`. No optional parameters.

### Data Fetching

Items are fetched via WebSocket using `todo.get_items` with `return_response: true`:

```js
hass.connection.sendMessagePromise({
  type: "call_service",
  domain: "todo",
  service: "get_items",
  service_data: { status: ["needs_action", "completed"] },
  target: { entity_id: config.entity },
  return_response: true,
});
```

Refetches trigger when the entity's `last_updated` timestamp changes in `set hass()`. A generation counter (`_fetchGen`) prevents stale async responses from clobbering newer results.

### Internal State

| Field | Type | Purpose |
|-------|------|---------|
| `_items` | Map | `uid → { uid, summary, checked }` — canonical model |
| `_rowEls` | Map | `uid → DOM element` — row references for direct mutation |
| `_animTimers` | Map | `uid → setTimeout ID` — pending animation cleanup |
| `_fetchGen` | Number | Generation counter — prevents stale fetch races |
| `_lastEntityUpdate` | String | Entity `last_updated` timestamp — triggers refetch only on change |

### Patch-Based Diffing

`_patch(serverItems)` compares incoming items against current DOM:

1. **Remove** — rows whose UID is no longer in the server set are removed from DOM
2. **Update** — existing rows with changed status snap to the correct state (if not mid-animation). Changed summaries update the label text.
3. **Create** — new UIDs get fresh row elements appended to the container

Items are replaced wholesale (`this._items = incoming`), not merged.

### Optimistic Toggle

On row click:
1. Flip `item.checked` immediately (local model)
2. Apply animation classes to checkbox strokes, label, and firework
3. Fire `todo.update_item` service call (no `await`)
4. On `.catch()` — revert `item.checked`, snap row back to previous state via `_snapRow()`

### Checkbox Animation

Bespoke two-stroke checkmark — the same visual pattern as `work-actions-card`:

| Element | Check animation | Uncheck |
|---------|----------------|---------|
| `.check-before` | 400ms: shrinks to 0, repositions, rotates 45°, grows to 5px | Instant snap (class removal) |
| `.check-after` | 400ms: shrinks to 0, repositions, rotates -45°, grows to 10px | Instant snap |
| `.label` | 300ms move (padding nudge) + 400ms strikethrough fade-in | Instant snap |
| `.firework` | 500ms: 4px dot emits 6 box-shadow particles (100ms delay) | Instant snap |

Cleanup timer runs at 600ms — must exceed the longest animation (firework 500ms + 100ms delay). Timer is tracked per-row in `_animTimers` and cleared on disconnect, re-toggle, or snap.

Unchecking is instant — no reverse animation. Classes are simply removed.

### Empty State

When the container has no child elements, a CSS `::after` pseudo-element shows "No items" in muted text.

### Editor

`ChecklistCardEditor` — stub displaying "Configure with: entity (required)". Inline styles, light DOM.

---

## Shared UI System Integration

### What It Uses

| Import | Usage |
|--------|-------|
| `foundation.js` | Tokens — via `window.uiFoundation` adopted stylesheet |
| `helpers.js` | `applyThemeClass` — theme sync on `set hass()` |

### What It Does NOT Use

- `components.js` — notably absent; the card uses no shared component classes (no `ui-card`, `ui-btn`, `ui-card-header`)
- `tooltips.js`, `toggles.js`, `checkboxes.js`, `radios.js`, `skeletons.js`, `number-input.js`, `drawer.js`, `modals.js`, `toasts.js`, `screen-border.js`, `utilities.js`

### Design System Violations

| Issue | Current | Notes |
|-------|---------|-------|
| Row grid column | `30px` fixed | Checkbox column width — not a `--ui-space-*` token (nearest: `--ui-space-7` = 28px or `--ui-space-8` = 32px) |
| Row min-height | `30px` | Below 48px touch target minimum — row click area is the full row width but height is short |
| Checkbox size | `15px × 15px` | Bespoke — not the shared `checkboxes.js` component (same deliberate choice as work-actions-card) |
| Check stroke dimensions | `2px` height, `5px`/`10px` widths, `8px` top | Coupled geometric set — changing any value breaks the checkmark shape |
| Check stroke geometry | `right: 60%`, `left: 40%` split | Positional — defines the checkmark's inflection point |
| Firework dot | `4px × 4px`, `left: -25px`, `top: 8px` | Positional anchor for particle origin |
| Firework particle spread | `±15px`, `±14px`, `±8px` | Box-shadow offsets for 6-point radial burst |
| Animation timings | `0.3s`, `0.4s`, `0.5s ease` | Not `--ui-motion-*` tokens — tuned for the multi-element choreography |
| Label transition | `0.3s ease` | Hardcoded — not a motion token |
| Label line-height | `1.45` | Not `--ui-font-line-height-*` — between `s` (1.3) and `m` (1.5) |
| Label padding animation | `8px` → `4px` | Nudge effect — not token-derived |
| Container padding | `var(--ui-space-6) var(--ui-space-9)` | Asymmetric — wide horizontal padding for visual centering |
| No `ui-card` wrapper | Card uses `.checklist` directly | Missing card header, accent bar, and standard card structure |

---

## Development Workflows

### Testing Changes

1. Add items to the todo entity — verify rows appear without page reload
2. Click unchecked item — verify check animation plays (strokes → label → firework)
3. Click checked item — verify instant uncheck (no reverse animation)
4. Rapid toggle — verify no animation stacking (timer cleared on re-toggle)
5. Remove item from entity externally — verify row disappears on next refetch
6. Rename item externally — verify label updates without animation
7. Toggle item externally (e.g., via HA UI) — verify row snaps to correct state
8. Service call failure — verify row reverts to previous state
9. Empty list — verify "No items" message displays
10. Light/dark themes — verify tokens adapt (accent, text, borders, surface)

---

## Conventions for AI Assistants

### Anti-Patterns

- Don't replace the bespoke checkbox with the shared `checkboxes.js` — deliberate design choice (same as work-actions-card)
- Don't `await` the toggle service call — fire-and-forget with catch-based rollback is the pattern
- Don't remove `_fetchGen` — prevents stale async fetch responses from overwriting newer data
- Don't remove `_animTimers` cleanup in `disconnectedCallback` — leaked timers cause errors on detached DOM
- Don't change check stroke geometry values independently — they are a coupled set (`right: 60%`, `left: 40%`, `top: 8px`, widths `5px`/`10px`, rotations `±45deg`)
- Don't add reverse uncheck animations — the instant snap is intentional (checking is the celebratory moment, unchecking is a correction)
- Don't re-render the full container on `set hass()` — the card only refetches when `last_updated` changes, and uses patch diffing to update the DOM

### Coupling

**Upstream (data source):**
- Any HA `todo` entity — fetches items via WebSocket `todo.get_items` with `return_response: true`
- Toggles items via `todo.update_item` (fire-and-forget with rollback)
- No specific entity dependency — entity is configured per-card

**Shared UI system:**
- `www/base/foundation.js` — tokens (side-effect import for `uiFoundation`)
- `www/base/helpers.js` — `applyThemeClass`

**Consumed by:**
- Dashboard views that include `custom:checklist-card`

### Cross-References

- Root: `/CLAUDE.md`
- UI governance: `/www/base/docs/CLAUDE.md`
- Work-actions-card: `/www/cards/work-actions-card/CLAUDE.md` (shares the checkbox and firework animation pattern)
- Architecture: `/ARCHITECTURE.md`

---

## TODOs & Gaps

- **Touch target undersized** — row min-height is `30px`, below the 48px system minimum. The full row width is clickable but the vertical target is short on touch devices.
- **No card header or accent bar** — uses a plain `.checklist` container without the standard `ui-card` / `ui-card-header` structure used by other cards.
- **No `components.js` adoption** — the card only adopts `uiFoundation` + its own styles. If shared component classes were added to the HTML (e.g., `ui-card`), they wouldn't render without adopting `uiComponents`.
- **No keyboard interaction** — rows are click-only. No `tabindex`, `role`, or Enter/Space handling.
- **No ARIA attributes** — checkbox role, checked state, and list semantics not declared.
- **No add/delete/reorder** — read-and-toggle only. Items must be managed externally (HA UI, automations, or other cards).
- **No loading state** — if the WebSocket fetch is slow, the container shows "No items" until data arrives, then items appear abruptly.
- **No error feedback** — service call failures silently revert the toggle. No toast or visual error indication.

---

## Changelog

| Date | Commit | Change |
|------|--------|--------|
| 2026-04-11 | — | Initial CLAUDE.md created |

*Last Updated: 2026-04-11*
