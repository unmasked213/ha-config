# CLAUDE - Presence Activity Card

> **Scope:** Real-time presence activity display — two-section layout showing active and recently-off sensors with color fade, floor indicators, settings panel, and toast notifications
> **Last reviewed:** 2026-04
> **Read root CLAUDE.md and www/base/docs/CLAUDE.md first for session protocol and UI governance rules**

---

## Summary

A multi-file Web Component that displays real-time activity from the occupancy domain's area presence sensors. Active sensors (top section, newest at bottom) and recently-off sensors (bottom section, newest at top) converge at a center divider to create a focal point of recency. Items show color-coded freshness (binary threshold for active, continuous power-curve fade for recent), floor-colored accent indicators, and elapsed time. A slide-out settings panel persists configuration to HA helper entities. Optional toast notifications with rate limiting and screen border flash provide ambient alerts.

---

## Structure

| File | Purpose |
|------|---------|
| `presence-activity-card.js` | Entry point and card class. Imports shared UI and modules, owns all state, renders two-section layout, settings panel (3 tabs), toast system, scroll management. |
| `color-fade.js` | `ActivityColorCalculator` class — binary threshold for active items, continuous power-curve interpolation for recent items. Reads `--ui-activity-*` CSS tokens with hardcoded fallbacks. Also exports `formatElapsedTime()` and `getSecondsElapsed()`. |
| `floor-resolver.js` | `FloorResolver` class — fetches area, floor, entity, and device registries via WebSocket, caches for session lifetime, resolves entity → area → floor with HSL-rotated floor colors. |
| `presence-activity-card-v2-context.md` | Historical planning document from December 2025. Some decisions diverge from final implementation (e.g., planned unified list, shipped two-section). Reference only — the code is authoritative. |

**Companion YAML:** `packages/occupancy/presence_activity_card.yaml` — 23 HA helper entities for persistent settings.

---

## Key Components

### Data Source

The card does **not** query individual sensors. It reads attributes from area presence sensors (configured in `area_sensors`), which aggregate per-area activity via the `&presence_area_base` YAML anchor in `presence_detection.yaml`.

**Key attributes consumed per sensor:**

| Attribute | Usage |
|-----------|-------|
| `area_id` | Floor resolution via `FloorResolver` |
| `area_name` | Display name fallback |
| `active_sensors` | JSON array of currently-on entity IDs → populates active section |
| `recently_off_sensors` | JSON array of recently-off entity IDs (1800s ceiling) → populates recent section |

Camera entities (`binary_sensor.c##_*`) are handled separately — they are not included in area presence sensors by design. When the camera filter is enabled, the card scans `hass.states` directly for matching entities.

### Card Config

```yaml
type: custom:presence-activity-card
area_sensors:
  - binary_sensor.presence_bedroom
  - binary_sensor.presence_office
  - binary_sensor.presence_floor_02_2
  - binary_sensor.presence_floor_01
  - binary_sensor.presence_floor_00
```

Optional overrides: `active_rows`, `recent_rows`, `active_threshold`, `recent_fade_duration`, `fade_curve`, `floor_colors` (map of floor_id → CSS color).

### Two-Section Layout

- **Active (top):** sensors currently on, sorted oldest → newest (newest at bottom, near center divider)
- **Recent (bottom):** sensors recently off, sorted newest → oldest (newest at top, near center divider)
- Center divider creates a convergence point of most-current information
- Section heights are fixed based on row count settings, with hidden scrollbars

### Color Fade System

**Active items** use a binary threshold (`activeThreshold`, default 60s):
- Fresh (< threshold): vivid orange text + amber secondary
- Stale (>= threshold): faded peach at low opacity

**Recent items** use continuous interpolation with a power curve (`fadeCurve`, default 0.7):
- Progress = `(elapsed / fadeDuration) ^ 0.7`, clamped to 0–1
- Text: white → dimgray
- Secondary: green → orange-brown
- Opacity: 1.0 → 0.5
- Font size: 0.95em → 0.8em

Color endpoints are read from `--ui-activity-*` CSS custom properties via `loadColorsFromElement()`. If tokens are unavailable, hardcoded fallback values matching the light theme are used.

### Floor Resolution

`FloorResolver` fetches four HA registries in parallel on first init:
- `config/area_registry/list`
- `config/floor_registry/list`
- `config/entity_registry/list`
- `config/device_registry/list`

Entity → area resolution uses direct area assignment with device-based fallback. Floor colors are HSL-rotated from a base hue (200) with 45-degree increments per floor level. Config overrides via `floor_colors` are applied after init.

Results are cached for the session — call `refresh()` to rebuild after floor/area registry changes.

### Filter System

Three filter layers, all persisted to HA helpers:

| Filter | Entities | Default |
|--------|----------|---------|
| Area (5 toggles) | `pac_filter_area_*` | all ON |
| Door (3 toggles) | `pac_filter_door_*` | all ON |
| Camera (1 toggle) | `pac_filter_cameras` | OFF |

`_passesFilters()` checks area → door → camera in order. Filter changes skip toast detection (`_isFilterChange` flag).

### Settings Panel

Slide-out panel from right edge with backdrop scrim. Three tabs:

| Tab | Controls |
|-----|----------|
| **Layout** | Active/recent row counts (`<ui-number-input>`), active/recent max items (`<ui-number-input>`), active threshold + fade duration (range sliders with value labels) |
| **Filters** | Area toggle buttons, door toggle buttons, camera toggle button |
| **Alerts** | Toast notification switch, screen border flash switch, test mode per-area toggle buttons |

Pattern: immediate local update + async HA `persistHelper()` write. Settings are re-read from helpers on every `set hass()` call to pick up external changes.

### Settings Persistence

23 HA helper entities defined in `packages/occupancy/presence_activity_card.yaml`, all prefixed `pac_`:

| Category | Helpers | Type |
|----------|---------|------|
| Layout | `pac_active_rows`, `pac_recent_rows`, `pac_active_max_items`, `pac_recent_max_items`, `pac_recent_fade_duration`, `pac_active_threshold` | `input_number` |
| Area filters | `pac_filter_area_bedroom`, `_office`, `_2nd_floor`, `_1st_floor`, `_ground_floor` | `input_boolean` |
| Door filters | `pac_filter_door_office`, `_bedroom`, `_house` | `input_boolean` |
| Camera filter | `pac_filter_cameras` | `input_boolean` |
| Toast | `pac_toast_notifications`, `pac_toast_screen_border` | `input_boolean` |
| Test mode | `pac_test_presence_bedroom`, `_office`, `_2nd_floor`, `_1st_floor`, `_ground_floor` | `input_boolean` |

### Toast Notifications

When enabled, new items entering the active list trigger browser toast notifications via the shared `showToast()` system:
- Rate limited: max 3 per 5-second window
- Overflow is batched into a summary toast after the window expires
- Optional screen border flash via `flashScreenBorder()`
- Camera false positive suppression: if a light in the same area turned off within 2 seconds, the camera motion toast is suppressed (`_isLightOffFalsePositive`)

### Test Mode

Per-area virtual presence toggles (`pac_test_presence_*`) inject a virtual sensor into the area presence calculation. These are read by `presence_detection.yaml` via the `test_entity` variable on each area sensor. Toggle ON to simulate occupancy, OFF to clear.

### Animations

| Animation | Trigger | Implementation |
|-----------|---------|---------------|
| Item enter | New item appears | `pac-item--entering` — slide from left (320ms, spring curve) |
| Item exit | Item removed from list | `pac-item--exiting` — slide right + fade (250ms) |
| Settings panel open | FAB click | `pac-drawer-open` keyframe — slide from right with elastic settle (450ms) |
| Settings FAB show | Container hover | Scale + opacity from tooltip-origin (tooltip tokens for intro, 180ms ease-in for outro) |
| Skeleton fade | First data load | Staggered opacity fade (150ms + 40ms stagger per row) |
| Scroll reset | 1 minute idle | Smooth scroll to top (respects `prefers-reduced-motion`) |
| Cog icon | Container hover | Multi-phase SVG: inner circle draws → outer circle draws then fades → gear teeth morph outward with 30s continuous rotation |

### Scroll Management

The recent section tracks scroll position:
- Scroll indicator (radial gradient overlay) appears when scrolled down
- Auto-reset to top after 60 seconds of scroll inactivity
- Respects `prefers-reduced-motion` for smooth vs instant reset

### Item Interaction

Click or Enter/Space on an item dispatches `hass-more-info` event to open the HA entity dialog. Items have `role="button"`, `tabindex="0"`, and visible focus ring.

### DOM Update Strategy

- Surgical per-property updates via `_updateItemElement()` — only touches DOM when values actually changed
- Items are created programmatically (no `innerHTML`) for XSS safety
- Reorder is conditional — DOM order is only adjusted when it doesn't match data order
- Exit animations use a `_exitingItems` Map to track pending removals

### Initialization

Race-guarded via `_initializePromise` — concurrent `_initialize()` calls await the same promise instead of starting parallel inits. Skeleton loading state shows shimmer rows until first data arrives, then fades them out with stagger.

---

## Shared UI System Integration

### What It Uses

| Import | Usage |
|--------|-------|
| `foundation.js` | Tokens — spacing, color, radius, shadow, elevation, typography, motion |
| `components.js` | `uiComponents` — card surface, buttons, FAB, sliders, inputs |
| `helpers.js` | `applyThemeClass`, `getHelperNumber`, `getHelperBoolean`, `persistHelper`, `initButtons` |
| `tooltips.js` | `<ui-info-icon>` custom element (registered as side-effect import) |
| `toggles.js` | `uiToggles` — switch styles for alert toggles |
| `skeletons.js` | `uiSkeletons` — shimmer loading state |
| `number-input.js` | `uiNumberInput` — `<ui-number-input>` for row/item count settings |
| `screen-border.js` | `flashScreenBorder()` — screen border flash for toast alerts |
| `toasts.js` | `showToast()` — browser toast notifications |

### What It Does NOT Use

- `drawer.js` — settings panel is card-specific (not the shared drawer component)
- `modals.js` — no modals in this card
- `checkboxes.js`, `radios.js` — not needed
- `utilities.js` — no string/color utilities needed (card has its own `_parseJsonAttribute`)

### Design System Violations

Remaining known divergences. All intentional.

| Issue | Current | Notes |
|-------|---------|-------|
| Entry animation timing | `320ms cubic-bezier(0.34, 1.56, 0.64, 1)` | Spring overshoot curve — no token equivalent; tuned for the slide-in feel |
| Exit animation timing | `250ms cubic-bezier(0.4, 0, 1, 1)` | Accelerate-out — faster than entry for snappy dismiss |
| Settings panel animation | `450ms cubic-bezier(0.22, 1, 0.36, 1)` with elastic keyframes | Multi-step settle (overshoot → bounce → rest) — not reducible to a single token |
| FAB outro timing | `180ms ease-in` | Separate from token-based tooltip intro timing for asymmetric show/hide |
| Floor indicator dimensions | `2px × 0.7em` | Sub-token sizing for minimal accent line |
| Settings panel width | `calc(var(--ui-space-10) * 6)` = 288px | Token-derived but no dedicated panel-width token exists |
| Inline input width | `72px` | Fixed width for compact number inputs in settings — between token steps |
| Slider thumb geometry | `5px` half-width, `4px` inner radius | Custom gap/radius for carved-out track geometry |
| SVG cog animation | Multi-phase with 30s rotation | Entirely custom; no token coverage for SVG path morphing |
| Scroll indicator gradient | `radial-gradient` with surface color | Hardcoded gradient shape — no token for gradient patterns |
| Settings close button radius | `50%` (circle) | Intentional circle — `--ui-radius-pill` would also work but 50% is standard for icon-only circles |

---

## Development Workflows

### Changing Settings Helpers

1. Add the `input_number` or `input_boolean` in `packages/occupancy/presence_activity_card.yaml`
2. Add a key to the `HELPERS` constant map in `presence-activity-card.js`
3. Add a default to `_settings` in the constructor
4. Add `_loadSettingsFromHelpers` read logic
5. Add UI control in the settings panel HTML
6. Wire handler in `_attachSettingsHandlers`
7. Restart HA (new helpers require restart)

### Adding a New Area Filter

1. Add `input_boolean.pac_filter_area_<name>` in the YAML
2. Add to `HELPERS`, `AREA_FILTER_MAP`, and `_settings` defaults
3. Add toggle button in the Filters tab HTML

### Testing Changes

1. Verify active items appear with orange/amber coloring, stale items dim after threshold
2. Verify recent items fade continuously over the fade duration
3. Verify floor indicator colors match floor registry (or config overrides)
4. Toggle area/door/camera filters — items appear/disappear without triggering toasts
5. Enable toast notifications — new active items show toast; rapid activity batches
6. Enable screen border — flash accompanies toasts
7. Toggle test mode — virtual presence appears in active list
8. Open/close settings panel — backdrop blocks interaction, Esc does not close (click close or backdrop)
9. Adjust sliders — value labels update, colors respond immediately
10. Scroll recent section — indicator appears; wait 1 minute idle — auto-resets
11. Light/dark themes — all elements adapt via tokens, color calculator reloads
12. Reduced motion — all animations disabled

---

## Conventions for AI Assistants

### Anti-Patterns

- Don't query individual sensors directly — the card reads aggregated attributes from area presence sensors only (cameras are the sole exception)
- Don't full re-render on `set hass()` — use `_updateLists()` → `_updateVisuals()` for surgical DOM updates
- Don't use `innerHTML` for item creation — programmatic DOM construction prevents XSS
- Don't remove the `_initializePromise` race guard — concurrent init calls during rapid `hass`/`setConfig` sequencing will cause duplicate FloorResolver fetches
- Don't assume `_floorResolver` is initialized in `set hass()` — it may be `null` before first `_initialize()` completes
- Don't fire toast notifications on filter changes — the `_isFilterChange` flag suppresses them
- Don't remove the camera false positive check — without it, every light-off triggers a camera motion toast
- Don't change `_exitingItems` to a Set — it stores `setTimeout` IDs that need clearing on disconnect
- Don't modify `presence_activity_card.yaml` helpers without restarting HA — new helpers require a restart to register
- Don't replace the settings panel with the shared `drawer.js` — it was deliberately kept card-specific (the shared drawer has different interaction patterns)
- Don't remove skeleton loading state — without it, the card shows empty sections during the async FloorResolver init

### Coupling

**Upstream (data source):**
- `binary_sensor.presence_*` — area presence sensors (5 areas), defined in `packages/occupancy/presence_detection.yaml`
- Area sensor attributes: `active_sensors`, `recently_off_sensors`, `area_id`, `area_name`
- `presence_detection.yaml` reads `pac_test_presence_*` helpers via the `test_entity` variable
- Camera entities (`binary_sensor.c##_*`) — scanned directly from `hass.states` when camera filter is ON

**Settings helpers (23):**
- Defined in `packages/occupancy/presence_activity_card.yaml`
- All prefixed `pac_` — see Settings Persistence section for full list

**Shared UI system:**
- `www/base/foundation.js` — tokens (side-effect import for `uiFoundation`)
- `www/base/components.js` — `uiComponents`
- `www/base/helpers.js` — `applyThemeClass`, `getHelperNumber`, `getHelperBoolean`, `persistHelper`, `initButtons`
- `www/base/tooltips.js` — `<ui-info-icon>` (side-effect import)
- `www/base/toggles.js` — `uiToggles`
- `www/base/skeletons.js` — `uiSkeletons`
- `www/base/number-input.js` — `uiNumberInput`
- `www/base/screen-border.js` — `flashScreenBorder`
- `www/base/toasts.js` — `showToast`

**Activity color tokens** (defined in `foundation.js`):
- `--ui-activity-active-fresh`, `--ui-activity-active-fresh-secondary`
- `--ui-activity-active-stale`, `--ui-activity-active-stale-opacity`
- `--ui-activity-recent-fresh`, `--ui-activity-recent-fresh-secondary`
- `--ui-activity-recent-faded`, `--ui-activity-recent-faded-secondary`

**Consumed by:**
- Dashboard views that include `custom:presence-activity-card`

### Cross-References

- Root: `/CLAUDE.md`
- UI governance: `/www/base/docs/CLAUDE.md`
- Occupancy domain: `/packages/occupancy/CLAUDE.md`
- Presence detection: `/packages/occupancy/presence_detection.yaml`
- Settings helpers: `/packages/occupancy/presence_activity_card.yaml`
- Door sensors: `/packages/occupancy/doors.yaml` (for `last_state_change` attribute)
- Architecture: `/ARCHITECTURE.md`

---

## TODOs & Gaps

- **Editor is a stub** — `getConfigElement()` returns an empty `<div>`. No visual editor for dashboard config.
- **Settings panel has no Esc-to-close** — close button and backdrop click work, but keyboard Esc does not dismiss the panel.
- **Context doc divergence** — `presence-activity-card-v2-context.md` describes a unified list design. The implementation shipped with two sections. The context doc is historical reference only.
- **No FLIP animation on reorder** — items are reordered via DOM append without positional animation (unlike work-actions-card and priority-matrix-card which use FLIP).
- **Toast batch color** — batch toast uses hardcoded `rgb(255, 180, 46)` amber for screen border, not a token.
- **Slider rollback indicator** — visual track element created but the rollback UX (showing where the user started dragging) only triggers on backward drags, not forward.
- **`recently_off_sensors` 1800s ceiling** — the backend template uses a fixed 1800s window regardless of the card's `recentFadeDuration` setting. Items beyond 1800s will never appear even if fade duration is set higher.

---

## Changelog

| Date | Commit | Change |
|------|--------|--------|
| 2026-04-11 | — | Initial CLAUDE.md created |

*Last Updated: 2026-04-11*
