# CLAUDE - Phone Card

> **Scope:** Phone control panel — find my phone, ringer mode, flashlight toggle
> **Last reviewed:** 2026-04
> **Read root CLAUDE.md and www/base/docs/CLAUDE.md first for session protocol and UI governance rules**

---

## Summary

A single-file Web Component for controlling Cam's Android phone (Samsung Galaxy M23 5G) via HA Companion App scripts. Provides three controls (Find My Phone button, a split-button ringer mode selector Normal/Vibrate/Silent, flashlight toggle), a live location map via HA's built-in `<ha-map>`, and a status strip showing distance/ETA/signal/last-updated. All phone actions call HA scripts which send commands to the phone via `notify.mobile_app_phone_c`. The card reads state entities and uses surgical DOM updates on `set hass()` to avoid full re-renders.

---

## Structure

| File | Purpose |
|------|---------|
| `phone-card.js` | Single entry point — card class, editor stub, rendering, ringer mode split button with dropdown menu, flashlight toggle, find-my-phone action |

**Companion YAML:** `packages/device/phone_control.yaml` — scripts (find, ringer modes, flashlight toggle) and a template sensor for flashlight state.

---

## Key Components

### Entities

| Entity | Type | Source | Usage |
|--------|------|--------|-------|
| `sensor.phone_c_ringer_mode` | Sensor | `mobile_app` integration | Current ringer mode (`normal`, `vibrate`, `silent`) |
| `binary_sensor.phone_c_flashlight` | Template sensor | `packages/device/phone_control.yaml` | Flashlight on/off state (derived from notification attributes) |
| `person.cam` | Person | HA core | Map marker + auto-fit bounds |
| `zone.home` | Zone | HA core | Home zone circle rendered on the map |
| `sensor.location_status_display` | Template | `packages/travel/map.yaml` | Good/Lost signal status in strip |
| `sensor.location_distance_display` | Template | `packages/travel/map.yaml` | Distance from home (km or m) |
| `sensor.location_eta_display` | Template | `packages/travel/map.yaml` | ETA home (adjusted Google travel time) |
| `sensor.location_updated_display` | Template | `packages/travel/map.yaml` | Relative last-updated text |

**Person dispatch coupling:** The four `sensor.location_*_display` sensors switch their underlying data source based on `input_boolean.location_info_selector` (off = E, on = C). The phone card displays whichever person the selector currently points to — it does **not** flip the selector. If the strip shows Enhy's numbers while the map shows Cam's marker, that's the selector state, not a bug.

### Scripts Called

All actions call HA scripts via `hass.callService('script', scriptId)`:

| Script | Trigger | Action |
|--------|---------|--------|
| `phone_c_find` | Find button | Alarm stream max → ringer normal → ring volume 100% → notification volume 100% → flashlight on → TTS announcement |
| `phone_c_ringer_normal` | Menu: Normal | Sets ringer mode to normal |
| `phone_c_ringer_vibrate` | Menu: Vibrate | Sets ringer mode to vibrate |
| `phone_c_ringer_silent` | Menu: Silent | Sets ringer mode to silent |
| `phone_c_flashlight_toggle` | Flashlight button | Toggles flashlight based on current `binary_sensor.phone_c_flashlight` state |

### Card Config

```yaml
type: custom:phone-card
card_title: Phone                                       # optional
ringer_entity: sensor.phone_c_ringer_mode               # optional, this is the default
flashlight_entity: binary_sensor.phone_c_flashlight     # optional, this is the default
location_entity: person.cam                             # optional, this is the default
home_zone: zone.home                                    # optional, this is the default
status_entities:                                        # optional, defaults shown; partial overrides allowed
  status: sensor.location_status_display
  distance: sensor.location_distance_display
  eta: sensor.location_eta_display
  updated: sensor.location_updated_display
```

### UI Layout

```
┌────────────────────────────────────────┐
│ ■ Phone                                │  Card header
├────────────────────────────────────────┤
│ [🔔 Find] [🔊 Normal ▾] [🔦]          │  Action buttons
│                                        │
│ ┌────────────────────────────────────┐ │
│ │      ha-map (240px, autoFit)       │ │  Interactive map
│ │       📍 person.cam  ⊙ home        │ │
│ └────────────────────────────────────┘ │
│  📶 Good   📍 12km   🕑 18m   🔄 2m ago │  Status strip
└────────────────────────────────────────┘
```

### Split Button (Ringer Mode)

Uses the shared `ui-split` component pattern:
- **Main button** — shows current ringer mode icon + label
- **Arrow button** — toggles a `ui-menu` dropdown with Normal/Vibrate/Silent options
- Menu item click calls the corresponding ringer script and closes the menu
- Click-outside closes the menu (document-level listener attached in `connectedCallback`, cleaned up in `disconnectedCallback`)
- Selected menu item gets `ui-menu__item--selected` class

### Flashlight Toggle

`ui-btn--toggle` with `is-selected` class when flashlight is on. Calls `phone_c_flashlight_toggle` script which reads current state and sends the opposite command.

### Find My Phone

`ui-btn--accent ui-btn--filled` button. Calls `phone_c_find` script which runs a multi-step sequence: sets ringer to normal, maxes ring + notification volume, turns on flashlight, and plays a TTS announcement via the phone speaker.

### Map + Status Strip

- `<ha-map>` is mounted once in `mountMap()` (awaits `customElements.whenDefined("ha-map")`), stored on `this._mapEl`
- Map config: `entities = [location_entity, home_zone]`, `autoFit: true`, `fitZones: true`, `zoom: 15`, `interactiveZones: false`, `renderPassive: false`
- On each `set hass()`, `updateValues()` re-assigns `this._mapEl.hass = this._hass` — this is the standard `ha-map` refresh pattern; the element internally diffs and moves the marker without rebuilding
- Status strip: four `<span>` elements with `data-key` attributes (`status`, `distance`, `eta`, `updated`) — `updateStatusStrip()` reads each config'd entity and writes `textContent`. Unknown/unavailable states render as an em-dash `—`
- `disconnectedCallback()` nulls `this._mapEl` so a re-attach triggers a fresh `mountMap()`

### DOM Update Strategy

Initial `render()` builds the full DOM once, then calls `mountMap()` + `updateStatusStrip()`. Subsequent `set hass()` calls use `updateValues()` for surgical updates:
- Ringer icon + label updated via `innerHTML` on the main split button
- Menu item selected state toggled
- Flashlight button `is-selected` class toggled
- `ha-map` hass reference refreshed
- Status strip text rewritten via `textContent`

### Editor

`PhoneCardEditor` — stub that displays "This card has no configurable options." Uses inline styles in light DOM (standard for Lovelace editors).

---

## Shared UI System Integration

### What It Uses

| Import | Usage |
|--------|-------|
| `foundation.js` | Tokens — via `window.uiFoundation` adopted stylesheet |
| `components.js` | `uiComponents` — `ui-card`, `ui-card-header`, `ui-btn`, `ui-btn--accent`, `ui-btn--filled`, `ui-btn--toggle`, `ui-btn--icon`, `ui-split`, `ui-menu` |
| `helpers.js` | `applyThemeClass` — theme sync on `set hass()` |

### External Components

- `<ha-map>` — HA frontend's Leaflet-based map component (same one powering the native `type: map` card). Registered globally by HA; the card awaits `customElements.whenDefined("ha-map")` before mounting.

### What It Does NOT Use

- `tooltips.js`, `toggles.js`, `checkboxes.js`, `radios.js`, `skeletons.js`, `number-input.js`, `drawer.js`, `modals.js`, `toasts.js`, `screen-border.js`, `utilities.js`

### Design System Violations

| Issue | Current | Notes |
|-------|---------|-------|
| Styles in `<style>` tag | Card-specific CSS injected via `innerHTML` in `render()` | Should use `new CSSStyleSheet()` + `adoptedStyleSheets` — current pattern causes style re-injection on every render call |
| Map container height | `240px` fixed (4px-aligned) | No token for map height. Documented exception — same class as other fixed content-area heights in the system. |
| SVG icon sizing | Inline `width`/`height` attributes (`18px`, `20px`, `16px`) | Mixed sizes not derived from `--ui-icon-*` tokens |

---

## Development Workflows

### Adding a New Phone Action

1. Create a script in `packages/device/phone_control.yaml` using `notify.mobile_app_phone_c`
2. Add a button in the `render()` method
3. Wire the click handler in `attachEvents()`
4. If the action has state, add an entity reference to `setConfig()` defaults and read it in `updateValues()`

### Testing Changes

1. Click Find — verify phone rings at max volume with TTS announcement
2. Toggle ringer modes via split button menu — verify icon and label update
3. Click flashlight toggle — verify `is-selected` state matches phone flashlight
4. Click outside the ringer menu while open — verify it closes
5. Light/dark themes — verify all elements adapt via tokens

---

## Conventions for AI Assistants

### Anti-Patterns

- Don't add direct `notify.mobile_app_phone_c` calls in the card — all phone commands go through scripts in `phone_control.yaml`. The card only calls scripts
- Don't full re-render on every `set hass()` — use `updateValues()` for surgical updates after the initial render
- Don't remove the document-level click listener cleanup in `disconnectedCallback` — without it, the menu close handler leaks across card lifecycle events
- Don't assume `phone_c_find` script exists in `scripts.yaml` — it's defined in the device package (`packages/device/phone_control.yaml`)
- Don't flip `input_boolean.location_info_selector` from this card — it's user-owned state driving the `packages/travel/map.yaml` sensor dispatch. The phone card **displays** status, it does not **mutate** the selector
- Don't rebuild `<ha-map>` on every hass update — mount once, then reassign `this._mapEl.hass`. Rebuilding resets zoom/pan and causes a visible flash

### Coupling

**Upstream (entities):**
- `sensor.phone_c_ringer_mode` — `mobile_app` integration (Android Companion App)
- `binary_sensor.phone_c_flashlight` — template sensor in `packages/device/phone_control.yaml`
- `person.cam` — HA core person entity (map marker source)
- `zone.home` — HA core zone (home radius overlay on map)
- `sensor.location_status_display`, `sensor.location_distance_display`, `sensor.location_eta_display`, `sensor.location_updated_display` — template sensors in `packages/travel/map.yaml`, dispatched by `input_boolean.location_info_selector`

**Upstream (scripts):**
- `script.phone_c_find` — multi-step find sequence
- `script.phone_c_ringer_normal`, `_vibrate`, `_silent` — ringer mode commands
- `script.phone_c_flashlight_toggle` — flashlight toggle
- All defined in `packages/device/phone_control.yaml`

**Shared UI system:**
- `www/base/foundation.js` — tokens
- `www/base/components.js` — `uiComponents`
- `www/base/helpers.js` — `applyThemeClass`

**Consumed by:**
- Dashboard views that include `custom:phone-card`

### Cross-References

- Root: `/CLAUDE.md`
- UI governance: `/www/base/docs/CLAUDE.md`
- Device domain: `/packages/device/CLAUDE.md`
- Phone scripts: `/packages/device/phone_control.yaml`
- Travel/location domain: `/packages/travel/CLAUDE.md`
- Location sensors: `/packages/travel/map.yaml`
- Architecture: `/ARCHITECTURE.md`

---

## TODOs & Gaps

- **Styles use `<style>` tag, not `adoptedStyleSheets`** — card-specific CSS is injected via `innerHTML` in `render()`. This means styles are re-parsed on every render call. Should migrate to `new CSSStyleSheet()` + `replaceSync()` + `adoptedStyleSheets` to match the pattern used by other cards.
- **Status strip person coupling** — strip values reflect whichever person `input_boolean.location_info_selector` points to, while the map marker is locked to `location_entity` (default `person.cam`). If the selector is set to E, the strip reads Enhy's numbers. Could be resolved with per-person sensors scoped to `location_entity`, but that duplicates the sensors in `packages/travel/map.yaml`.
- **No Esc-to-close on ringer menu** — click-outside closes it, but keyboard Esc does not.
- **Flashlight state is indirect** — derived from `sensor.phone_c_active_notification_count` attributes by scanning for `com.android.systemui` / `Torch turned on`. This is fragile to Android version changes that alter notification text.
- **No error handling on script calls** — `callScript()` is fire-and-forget with no catch or toast feedback.
- **Single-phone only** — hardcoded to Cam's phone (`phone_c`). Not parameterised for Enhy's phone.

---

## Changelog

| Date | Commit | Change |
|------|--------|--------|
| 2026-04-16 | — | Replaced map placeholder with real `<ha-map>` integration + 4-item status strip (signal/distance/ETA/updated). Added `location_entity`, `home_zone`, `status_entities` config keys. Doc sync. |
| 2026-04-11 | — | Initial CLAUDE.md created |

*Last Updated: 2026-04-16*
