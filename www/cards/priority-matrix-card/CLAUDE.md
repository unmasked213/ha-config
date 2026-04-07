# CLAUDE - Priority Matrix Card

> **Scope:** Interactive task prioritisation matrix with scoring, sorting, and todo entity persistence
> **Last reviewed:** 2026-03
> **Read root CLAUDE.md and www/base/docs/CLAUDE.md first for session protocol and UI governance rules**

---

## Summary

The Priority Matrix Card is an interactive scoring matrix for prioritising HA build tasks. Each task is scored across six criteria (1–3) to produce a composite priority score (0–100). Tasks are persisted as items in a `local_todo` entity, with scores stored as JSON in the description field. The card features inline task creation, circle slider scoring, sortable columns with FLIP animations, configurable weights via a settings drawer, and rich tooltips on column headers.

---

## Structure

| File | Purpose |
|------|---------|
| `priority-matrix-card.js` | Entry point and card class. Imports shared UI, adopts stylesheets, owns state, delegates to render/events modules. |
| `render.js` | DOM construction — card shell, column headers, task rows (`.ui-input`, `<ui-circle-slider>`, score badge, delete button), weights drawer content, info icon tooltips. |
| `events.js` | All event handlers — inline add, drawer open/close, weight changes, circle slider value/tap, sorting, column header tooltips, delete with fade-out, FLIP animations, debounced HA service calls. |
| `styles.js` | Card-specific CSS — layout (flex rows, column alignment), score badge, new-task pulse, drawer overrides, mobile responsive. |
| `constants.js` | Criteria definitions (keys, labels, tooltips, direction), scoring formula, JSON parse/serialize, score-level thresholds. |

---

## Key Components

### Data Model

**Entity:** `todo.ha_priorities` (created via UI as a Local to-do list, not YAML)

Each todo item maps to a task:
- `summary` = task name
- `description` = JSON blob: `{"time":2,"function":2,"blocking":2,"impact":2,"motivation":2,"size":2}`
- `uid` = HA-assigned unique identifier (used for updates/deletes)

### Scoring

Six criteria, each scored 1–3:

| Criterion | Key | Direction | 1 means | 3 means |
|-----------|-----|-----------|---------|---------|
| Time urgency | `time` | positive | No rush | Urgent |
| Function urgency | `function` | positive | Nice-to-have | Critical |
| Blocking value | `blocking` | positive | Standalone | Major blocker |
| Impact | `impact` | positive | Minor polish | Transformative |
| Motivation | `motivation` | positive | Avoiding it | Want to do it |
| Size | `size` | **inverted** | Quick win (boosts score) | Massive (lowers score) |

**Composite score formula (0–100):**
```
positive_sum = sum(task[k] * weight[k] for k in [time, function, blocking, impact, motivation])
adjusted_size = (4 - task.size) * weight.size
score = round((positive_sum + adjusted_size) / max_possible * 100)
```

Weights default to 1.0, configurable 0–3 in 0.5 steps via the settings drawer.

### Card Config

```yaml
type: custom:priority-matrix-card
entity: todo.ha_priorities     # required
title: HA priority matrix      # optional, default shown
weights:                       # optional, all default 1.0
  time: 1.0
  function: 1.0
  blocking: 1.0
  impact: 1.0
  motivation: 1.0
  size: 1.0
```

### Shared UI Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `.ui-input`, `.ui-input--quiet` | `components.js` | Task name fields (quiet variant hides label when populated) |
| `.ui-input` | `components.js` | Add-task inline input |
| `<ui-circle-slider>` | `ui-circle-slider.js` | Per-criterion scoring (type="interactive", size=64, min=1, max=3) |
| `<ui-number-input>` | `number-input.js` | Weight steppers in drawer (min=0, max=3, step=0.5) |
| `.ui-btn`, `.ui-btn--icon` | `components.js` | Delete button per row |
| `.ui-fab`, `.ui-drawer` | `components.js`, `drawer.js` | Settings drawer with FAB trigger |
| `<ui-info-icon>` | `tooltips.js` | Card header info, drawer header info |
| `showRichTooltip` | `tooltips.js` | Column header hover/long-press tooltips |
| `ui-attention-pulse` | `components.js` | New-task border pulse animation |
| `--ui-circle-fill` | `components.js` | Circle slider fill colour override (available but not currently used) |

### Animations

| Animation | Trigger | Implementation |
|-----------|---------|---------------|
| FLIP reorder | Sort change, score change, add/delete | `flipRows()` — snapshots positions, reorders DOM, animates delta with stagger |
| Entry | New task from server | `animateRowEntry()` — fade in + slide up (350ms) |
| Fade out | Delete | Web Animation API — opacity 0 over 250ms, then DOM removal |
| New-task pulse | Task added after initial load | `ui-attention-pulse` keyframe (5 iterations), then border fades to transparent |
| Debounced re-sort | Score slider committed | `scheduleSortIfNeeded()` — 300ms debounce prevents animation stacking |

### Persistence

- **Score change:** debounced 500ms → `todo.update_item` (description JSON)
- **Name change:** debounced 500ms → `todo.update_item` (rename)
- **Add task:** `todo.add_item` with default scores (all 2s)
- **Delete task:** optimistic DOM removal → `todo.remove_item`
- **Load:** `todo.get_items` via `hass.connection.sendMessagePromise` with `return_response: true`
- **Sync:** reacts to entity `last_updated` changes in `set hass()`

---

## Development Workflows

### Adding a New Criterion

1. Add entry to `CRITERIA` array in `constants.js` (key, label, shortLabel, direction, tooltip)
2. Update `computeScore()` — add to `positiveKeys` if positive, or handle inversion
3. Column header and slider row are generated from `CRITERIA` automatically
4. Update card info icon tooltip items in `render.js`

### Testing Changes

1. Add/remove tasks — verify FLIP animations, pulse on new, fade on delete
2. Drag sliders — verify score updates live, re-sort on commit if sorting by that criterion
3. Open weights drawer — verify steppers update scores in real time
4. Sort by different columns — verify FLIP animation, arrow indicators
5. Tap circle slider — verify reset to 2 with wobble
6. Hover column headers — verify rich tooltips appear
7. Reload page — verify all tasks load without pulse animation

---

## Conventions for AI Assistants

### Anti-Patterns

- Don't create the `todo.ha_priorities` entity via YAML — `local_todo` is UI-only, YAML causes errors
- Don't re-render the full card on `set hass()` — use surgical DOM updates via `patchTasks()`
- Don't fire service calls on every drag tick — only `ui-change` (committed) triggers persistence
- Don't call `flipRows()` when `sortAndReorder()` already does it — causes double animation
- Don't snapshot positions after DOM changes — snapshot before, reorder, then FLIP
- Don't remove the `_initialLoadDone` guard — without it, all tasks pulse on page load
- Don't use arbitrary CSS values — all styling derives from foundation.js tokens

### Coupling Warnings

**Depends on:**
- `todo.ha_priorities` — Local to-do entity (created via HA UI)
- `www/base/foundation.js`, `components.js`, `number-input.js`, `drawer.js`, `tooltips.js` — shared UI system
- `www/cards/ui-circle-slider.js` — circle slider web component

**Consumed by:**
- Dashboard views that include the `priority-matrix-card` custom element

### Cross-References

- Root: `/CLAUDE.md`
- UI governance: `/www/base/docs/CLAUDE.md`
- Architecture: `/ARCHITECTURE.md`
- Lovelace resources: `/ui/ui_lovelace_resources.yaml`

---

## TODOs & Gaps

- Mobile layout needs refinement — column headers hidden but no labels on sliders
- No confirmation dialog on delete — could add a modal or undo pattern
- Weights are stored in card config only — changing dashboard config resets them

---

## Changelog

| Date | Commit | Change |
|------|--------|--------|
| 2026-03-28 | — | Initial build: 5-file card with circle sliders, number input weights drawer, FLIP animations, inline add, rich tooltips, quiet input variant, 1–3 scoring scale |

*Last Updated: 2026-03-28*
