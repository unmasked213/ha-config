# CLAUDE - Phone Card

> **Scope:** Phone control panel — find my phone, ringer mode, flashlight toggle
> **Last reviewed:** 2026-04
> **Read root CLAUDE.md and www/base/docs/CLAUDE.md first for session protocol and UI governance rules**

---

## Summary

A single-file Web Component for controlling Cam's Android phone (Samsung Galaxy M23 5G) via HA Companion App scripts. Provides three controls: a Find My Phone button (alarm + TTS + flashlight), a split-button ringer mode selector (Normal/Vibrate/Silent), and a flashlight toggle. All actions call HA scripts which send commands to the phone via `notify.mobile_app_phone_c`. The card reads two HA entities for current state and uses surgical DOM updates on `set hass()` to avoid full re-renders.

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
```

### UI Layout

```
┌────────────────────────────────────────┐
│ ■ Phone                                │  Card header
├────────────────────────────────────────┤
│ [🔔 Find] [🔊 Normal ▾] [🔦]          │  Action buttons
│                                        │
│ ┌────────────────────────────────────┐ │
│ │         Map placeholder            │ │  Placeholder area
│ └────────────────────────────────────┘ │
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

### DOM Update Strategy

Initial `render()` builds the full DOM once. Subsequent `set hass()` calls use `updateValues()` for surgical updates:
- Ringer icon + label updated via `innerHTML` on the main split button
- Menu item selected state toggled
- Flashlight button `is-selected` class toggled

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

### What It Does NOT Use

- `tooltips.js`, `toggles.js`, `checkboxes.js`, `radios.js`, `skeletons.js`, `number-input.js`, `drawer.js`, `modals.js`, `toasts.js`, `screen-border.js`, `utilities.js`

### Design System Violations

| Issue | Current | Notes |
|-------|---------|-------|
| Styles in `<style>` tag | Card-specific CSS injected via `innerHTML` in `render()` | Should use `new CSSStyleSheet()` + `adoptedStyleSheets` — current pattern causes style re-injection on every render call |
| Map placeholder height | `200px` fixed | Arbitrary — no token for placeholder dimensions |
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

### Coupling

**Upstream (entities):**
- `sensor.phone_c_ringer_mode` — `mobile_app` integration (Android Companion App)
- `binary_sensor.phone_c_flashlight` — template sensor in `packages/device/phone_control.yaml`

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
- Architecture: `/ARCHITECTURE.md`

---

## TODOs & Gaps

- **Map placeholder** — the card renders "Map placeholder" in a styled box. No map integration is implemented.
- **Styles use `<style>` tag, not `adoptedStyleSheets`** — card-specific CSS is injected via `innerHTML` in `render()`. This means styles are re-parsed on every render call. Should migrate to `new CSSStyleSheet()` + `replaceSync()` + `adoptedStyleSheets` to match the pattern used by other cards.
- **No Esc-to-close on ringer menu** — click-outside closes it, but keyboard Esc does not.
- **Flashlight state is indirect** — derived from `sensor.phone_c_active_notification_count` attributes by scanning for `com.android.systemui` / `Torch turned on`. This is fragile to Android version changes that alter notification text.
- **No error handling on script calls** — `callScript()` is fire-and-forget with no catch or toast feedback.
- **Single-phone only** — hardcoded to Cam's phone (`phone_c`). Not parameterised for Enhy's phone.

---

## Changelog

| Date | Commit | Change |
|------|--------|--------|
| 2026-04-11 | — | Initial CLAUDE.md created |

*Last Updated: 2026-04-11*
