# CLAUDE - Pico HID Card

> **Scope:** Dashboard controller for a Raspberry Pi Pico 2 W USB HID keyboard emulator — text loading, typing control, preset configuration, device status
> **Last reviewed:** 2026-04
> **Read root CLAUDE.md and www/base/docs/CLAUDE.md first for session protocol and UI governance rules**

---

## Summary

A single-file Web Component that controls a Raspberry Pi Pico 2 W running as a USB HID keyboard emulator. The card communicates directly with the Pico via HTTP REST API — no Home Assistant entities, services, or automations are involved. Users paste text into the card, send it to the device's buffer, then trigger humanised typing which physically types the text via USB as if a real person were at the keyboard. Three typing presets (Natural, Careful, Urgent) configure the device's humanisation engine. A 2-second polling loop tracks device status and typing progress.

---

## Structure

| File | Purpose |
|------|---------|
| `pico-hid-card.js` | Single entry point — card class, editor class, styles, presets, polling, API communication, all rendering and event handling |

**Firmware backup (reference only, not card code):** `docs/projects/pico-hid/pico_hid_files_backup/` — `boot.py` (USB descriptor lockdown), `code.py` (typing engine + HTTP server), `settings.toml` (WiFi config). These files live on the Pico device; the backup is for reference.

**Handover doc:** `docs/projects/pico-hid/pico-hid-card-handover.md` — original build specification. Some planned features (8 config sliders, collapsible config panel) were replaced by the preset system. The code is authoritative where it diverges from the handover.

This card is intentionally single-file. No companion YAML, no HA helper entities, no domain package.

---

## Key Components

### Device Context

The Pico 2 W appears to the target computer as a **Logitech K120 keyboard** (spoofed VID/PID in `boot.py`). It has two modes:

| Mode | Description |
|------|-------------|
| **Stealth** | Normal operation — USB drive and CDC disabled, only HID keyboard exposed. No visible sign it's a Pico. |
| **Maintenance** | USB drive and CDC re-enabled for firmware updates. One-shot: auto-returns to stealth on next reboot. |

The device sits on a static IP (`192.168.4.176`) on the home WiFi network, spoofing its HTTP `Server` header as `lighttpd/1.4.59`. The hostname is `living-room-sensor`.

### Communication Model

The card talks directly to the Pico via `fetch()`. No HA proxy, no `rest_command`, no WebSocket. CORS headers are set on the Pico server.

All requests use a 3-second `AbortSignal.timeout` (5 seconds for text upload). Responses are JSON. Failed requests return `null` from `_fetch()` — callers handle this as offline/error state.

Two content types are used:
- `POST /send` — `text/plain` body (raw text, not JSON-wrapped)
- All other POSTs — `application/json` body

### Card Config

```yaml
type: custom:pico-hid-card
pico_url: http://192.168.4.176  # optional, this is the default
```

The only config key is `pico_url`. Trailing slashes are stripped on set.

### Pico HTTP API

| Endpoint | Method | Request | Response | Notes |
|----------|--------|---------|----------|-------|
| `/health` | GET | — | `{"ok":true,"mode":"stealth\|maintenance"}` | Device mode check |
| `/send` | POST | `text/plain` body | `{"status":"Saved: N chars ready."}` | 50,000 byte limit enforced server-side. Rejects if currently typing. Resets buffer offset (no append). |
| `/status` | GET | — | `{"chars":N,"typing":bool,"sent":N,"total":N,"elapsed":N}` | Polled every 2 seconds |
| `/type` | POST | `""` | `{"status":"Typing started."}` | Sets a flag; actual typing starts in firmware main loop. Resumes from `buffer_offset` if previously stopped. |
| `/stop` | POST | `""` | `{"status":"Stopping...\|Cancelled.\|Not typing."}` | Pauses at current position; `/type` resumes from there |
| `/config` | GET | — | Full config object (8 keys) | RAM-only config; reboot resets to defaults |
| `/config` | POST | JSON partial update | Updated config + optional `"note"` | Clamped to LIMITS. If typing, returns `"note":"Applied on next run."` (config is snapshot at type start) |
| `/maintenance` | POST | `""` | `{"status":"Rebooting..."}` | Sets NVM flag; reboots immediately or after typing completes |

### Firmware Config Keys

8 parameters controlling the humanisation engine. Config is **RAM-only** — rebooting the Pico resets to defaults. Changes during typing take effect on the next `/type` call (config is snapshot at type start).

| Key | Range | Default | Unit | Description |
|-----|-------|---------|------|-------------|
| `wpm` | 40–150 | 55 | words/min | Base typing speed |
| `jitter_pct` | 15–50 | 30 | % | Random timing variation per keypress |
| `punct_pause_ms` | 50–500 | 200 | ms | Pause after punctuation |
| `think_chance` | 0.05–2.0 | 0.5 | % | Probability of a thinking pause at word boundaries |
| `think_min_ms` | 100–500 | 500 | ms | Minimum thinking pause duration |
| `think_max_ms` | 300–6000 | 3000 | ms | Maximum thinking pause duration |
| `typo_rate` | 0.1–3.0 | 1.5 | % | Error rate (adjacent-key, transpositions, skip-word) |
| `fatigue_pct` | 2–30 | 15 | % | Slowdown by end of text (linear ramp from 1.0 to 1.0 + fatigue) |

Cross-validation: `think_min_ms` is clamped to never exceed `think_max_ms`.

### Humanisation Engine (Firmware)

The typing engine in `code.py` produces realistic human-like typing through:
- **Per-session pace** — random multiplier (0.85–1.15) applied to all delays, so identical texts produce different timing profiles
- **Thinking pauses** — weighted distribution (60% short, 30% medium, 10% long) at word boundaries
- **Adjacent-key typos** — uses physical QWERTY adjacency map, types wrong key then backspaces to correct
- **Transposition errors** — swaps two adjacent characters, pauses, then corrects
- **Skip-word errors** — simulates eyes jumping ahead: types part of a later word, then backtracks
- **Fatigue** — linear slowdown over the course of the text
- **Heading-aware pauses** — detects meeting minutes structure (numbered items, section headers) and adds structural pauses
- **Speed-scaled structural delays** — heading/paragraph pauses scale relative to 55 WPM baseline
- **UK keyboard layout** — maps characters through `UK_SHIFT` table for correct key codes on UK-layout hosts
- **WiFi-independent typing** — WiFi failure during typing does not interrupt USB HID output; `/stop` becomes unreachable but typing completes

### Internal State

| Field | Type | Purpose |
|-------|------|---------|
| `_state.online` | Boolean | Device reachable via `/status` poll |
| `_state.mode` | String | `'stealth'`, `'maintenance'`, or `'unknown'` |
| `_state.typing` | Boolean | Device is currently typing |
| `_state.charsSent` | Number | Characters typed so far in current run |
| `_state.charsTotal` | Number | Total characters in current typing run |
| `_state.charsRemaining` | Number | Characters remaining in buffer |
| `_state.elapsed` | Number | Seconds since typing started |
| `_state.bufferLoaded` | Boolean | Text has been sent to the device buffer |
| `_state.picoConfig` | Object | Last-fetched config from device (8 keys) |
| `_state.textValue` | String | Current textarea content (preserved across re-renders) |
| `_state.activePreset` | String | Currently selected preset ID |
| `_syncingConfig` | Boolean | Guard flag — suppresses `ui-change` events during programmatic slider value sync |

### Pause/Resume

The device supports pause/resume via `buffer_offset`. When the card detects that typing was stopped mid-buffer (`!typing && bufferLoaded && charsSent > 0 && charsRemaining > 0`), it shows "Resume" instead of "Type". The next `/type` call resumes from where it left off. Some characters may re-type on resume if the firmware crashed mid-character.

### Polling

2-second interval via `setInterval`. Each poll:
1. `GET /status` — updates typing state, character counts, elapsed time
2. If status fails → marks offline, updates status indicator
3. If typing just completed (was typing, now not) → shows "Typing complete." toast
4. Calls `_updateStatus()` for surgical DOM updates (no full re-render)

On connect: `_fetchHealth()` and `_fetchConfig()` are called once alongside the poll start.

### Status Indicator

The card header accent bar (`ui-card-header__accent`) shows device state:
- **Green** (`is-online`) — device reachable, idle
- **Red** (`is-offline`) — device unreachable
- **Amber pulse** (`is-typing`) — device actively typing (1.2s ease-in-out opacity pulse)

### Presets

Three preset buttons replace the originally-planned config slider panel:

| Preset | WPM | Jitter | Typo Rate | Think Chance | Fatigue | Use Case |
|--------|-----|--------|-----------|--------------|---------|----------|
| **Natural** | 150 | 15% | 0.3% | 0.1% | 5% | Fast, realistic typing with minimal errors |
| **Careful** | 80 | 40% | 2.5% | 1.5% | 20% | Slower, more hesitant, as if composing on the fly |
| **Urgent** | 150 | 15% | 0.1% | 0.05% | 3% | Fast with minimal pauses and almost no errors |

Applying a preset sends `POST /config` with the full config object. If the device is typing, the response includes `"note":"Applied on next run."` — the card shows this as a toast.

### Button State Logic

| Button | Enabled when | Notes |
|--------|-------------|-------|
| **Add** (Send) | `online` | Sends textarea content to device buffer |
| **Clear** | `online && bufferLoaded && !typing` | Calls `POST /clear` (see TODOs) |
| **Type/Resume** | `online && bufferLoaded && !typing` | Label switches to "Resume" when paused |
| **Stop** | `typing` (hidden otherwise) | Visible only while typing, replaces Type button |
| **Maintenance** | `online` | Triggers maintenance mode reboot |
| **Presets** | `online` | All three disabled when offline |

### Character Limit

50,000 characters, enforced both client-side (`maxlength` on textarea, pre-send length check) and server-side (firmware rejects bodies > 50,000 bytes). The card shows a character remaining counter that appears at 40,000 chars (warning at 40k, danger at 45k, "Limit reached" at 50k).

### Toast

Card-specific toast (not the shared UI `showToast()` system). Fixed-position bottom-center, slide-up animation via CSS transform, auto-dismiss after 2.5 seconds. Error toasts get a red border (`--ui-error`).

### Editor

`PicoHidCardEditor` — minimal visual editor providing a text input for `pico_url`. Uses inline styles (not the shared UI system) — this is the standard pattern for Lovelace card editors which render in a different context.

---

## Shared UI System Integration

### What It Uses

| Import | Usage |
|--------|-------|
| `foundation.js` | Tokens — spacing, color, radius, shadow, elevation, typography, motion (side-effect import for `uiFoundation`) |
| `components.js` | `uiComponents` — `ui-card-header`, `ui-btn`, `ui-btn--accent`, `ui-btn--filled`, `ui-btn--outline`, `ui-btn--danger`, `ui-btn--muted`, `ui-btn--small`, `ui-btn--toggle`, `ui-input`, `ui-progress`, `ui-progress--thin` |
| `helpers.js` | `applyThemeClass`, `initInputs` (floating label on textarea), `initButtons` |
| `tooltips.js` | `<ui-info-icon>` custom element with structured tooltip content (side-effect import) |

### What It Does NOT Use

- `toggles.js`, `checkboxes.js`, `radios.js` — no toggle/checkbox/radio controls
- `drawer.js` — no settings drawer (presets replaced the planned config panel)
- `skeletons.js` — no loading state (device appears immediately as online or offline)
- `number-input.js` — no number inputs
- `screen-border.js`, `toasts.js` — uses card-specific toast, not the shared toast/border system
- `modals.js` — no modals
- `utilities.js` — card has its own `_escHtml()`

### Design System Violations

| Issue | Current | Notes |
|-------|---------|-------|
| Accent pulse animation | `1.2s ease-in-out infinite` | Custom keyframe for typing status — no token equivalent for pulsing opacity |
| Preset button layout | Card-specific `.preset-btn` class with column flex | Two-line button (label + description) — no shared component for this pattern |
| Textarea floating label offset | `translateY(-34px)` | Specific to the taller textarea pill — standard input label uses a different offset |
| Textarea field height | `140px` fixed | Card-specific content area height — no token for textarea dimensions |
| Textarea min-height | `160px` on both wrapper and pill | Taller than standard input — content-driven sizing |
| Toast positioning | `position: fixed; bottom; left: 50%; z-index: 1000` | Card-specific toast — does not use the shared `showToast()` system |
| Toast slide-up animation | `translateY(100px)` → `translateY(0)` | Custom entrance — shared toasts have their own animation |
| Card container border-radius | `--ui-radius-l` | Uses `radius-l` instead of the more common `radius-xl` for cards |
| Editor styling | Inline CSS with `var(--card-background-color)` etc. | Lovelace editor context uses HA native CSS variables, not the shared UI system |

---

## Development Workflows

### Changing the API Contract

If the Pico firmware adds/removes/changes an endpoint:
1. Update the relevant `_fetch`/`_post`/`_postText` call in the card
2. Update the API table in this document
3. Note: `/send` uses `text/plain`, everything else uses `application/json`
4. The firmware backup in `docs/projects/pico-hid/pico_hid_files_backup/` should be updated to match

### Adding a New Preset

1. Add an entry to the `_presets` getter (id, label, desc, config object with all 8 keys)
2. The preset row auto-renders from the array
3. Ensure the config values are within the firmware's LIMITS ranges

### Testing Changes

1. Verify status indicator: green when device reachable, red when unreachable, amber pulse when typing
2. Paste text → Add → verify "Saved: N chars ready." toast appears
3. Click Type → verify progress bar appears and updates, character counts increment
4. Click Stop mid-typing → verify "Stopping..." toast, button switches to "Resume"
5. Click Resume → verify typing continues from where it stopped
6. Click Clear → verify buffer cleared (note: currently broken, see TODOs)
7. Toggle between presets → verify active state styling switches, config sent to device
8. Try to Add while device is typing → verify "Cannot load text while typing." toast
9. Character count: type 40,000+ chars → verify warning/danger states on counter
10. Disconnect device → verify status goes red, buttons disable
11. Click Maintenance → verify device reboots into maintenance mode
12. Light/dark themes — verify all elements adapt via tokens
13. Reduced motion — verify preset button transitions are suppressed

---

## Conventions for AI Assistants

### Anti-Patterns

- Don't add HA entity dependencies — this card is pure HTTP to the Pico. No `hass.states`, no `hass.callService`, no `rest_command`. The only `hass` usage is `applyThemeClass()` for theme sync
- Don't full re-render on poll — `_updateStatus()` surgically updates DOM elements by ID. The only full `render()` call is on `setConfig()` and first `hass` set
- Don't call `render()` from `set hass()` after first load — it destroys textarea content and resets the text entry. `_state.textValue` preserves the value across renders but unnecessary renders still cause a flash
- Don't send JSON to `/send` — it expects `text/plain` body. Use `_postText()`, not `_post()`
- Don't assume config changes take effect immediately during typing — the firmware snapshots config at type start. Changes apply on the next `/type` call
- Don't remove the `_syncingConfig` guard — without it, programmatic slider value updates fire `ui-change` events that write back to the device, creating an infinite loop
- Don't increase the polling interval beyond 2 seconds — the progress bar and elapsed time display need frequent updates for responsive feel during typing
- Don't persist the Pico's config to HA — the firmware intentionally resets config on reboot to prevent stale settings from a previous session

### Security Considerations

- The Pico spoofs its USB identity as a Logitech K120 keyboard. The `boot.py` USB descriptor lockdown is essential — without it, the device exposes a USB drive and CDC serial port that would identify it as a Pico
- The device hostname is `living-room-sensor` — deliberately innocuous
- The HTTP server spoofs its header as `lighttpd/1.4.59`
- WiFi credentials are in `settings.toml` on the device, not in HA config
- The `pico_url` config key contains the device's static IP — this is the only network coupling

### Coupling

**Upstream (device):**
- Raspberry Pi Pico 2 W at `http://192.168.4.176` (configurable via `pico_url`)
- Firmware: `boot.py` + `code.py` + `settings.toml` (CircuitPython)
- Backup copy: `docs/projects/pico-hid/pico_hid_files_backup/`
- API contract: 8 endpoints (see API table above)

**Shared UI system:**
- `www/base/foundation.js` — tokens (side-effect import for `uiFoundation`)
- `www/base/components.js` — `uiComponents`
- `www/base/helpers.js` — `applyThemeClass`, `initInputs`, `initButtons`
- `www/base/tooltips.js` — `<ui-info-icon>` (side-effect import)

**Not coupled to:**
- No HA entities, automations, scripts, or packages
- No domain package (no `packages/*/` dependency)
- No helper entities (no `pac_*` or `wac_*` style persistence)

**Consumed by:**
- Dashboard views that include `custom:pico-hid-card`

### Cross-References

- Root: `/CLAUDE.md`
- UI governance: `/www/base/docs/CLAUDE.md`
- Handover doc: `/docs/projects/pico-hid/pico-hid-card-handover.md`
- Firmware backup: `/docs/projects/pico-hid/pico_hid_files_backup/`
- Architecture: `/ARCHITECTURE.md`
- System context — Pico entry: `/system_context.yaml` (section: `capabilities` / `subsystems`)

---

## TODOs & Gaps

- **Clear button calls non-existent endpoint** — `_clearBuffer()` sends `POST /clear` but the firmware has no `/clear` route. The request silently fails (returns `null`), and the card shows "Could not clear buffer." toast. Either the firmware needs a `/clear` endpoint, or the card should send `POST /send` with an empty body, or clear should be client-side only (reset textarea + state without device call).

- **Dead config slider code** — `_updateConfig()` queries `ui-circle-slider[data-key]` elements, and `_syncingConfig` guards against feedback loops. But `render()` creates no circle sliders — presets replaced them. The dead code (`_updateConfig`, `_syncingConfig`, `_sliderHtml`, `_fetchConfig`) can be removed if config sliders are not planned for reintroduction. `_fetchConfig()` itself is still called on connect but its result is only consumed by the dead `_updateConfig()`.

- **No Esc/backdrop close for anything** — the card has no panels or modals that would need dismissal, but if a config panel is ever re-added, Esc and click-outside dismissal should be wired.

- **Preset active state is client-only** — `_state.activePreset` defaults to `'natural'` and is only updated on preset click. It does not verify against the device's actual config, so if the device has different values (e.g., after a reboot), the active preset indicator may be wrong.

- **Toast uses card-specific implementation** — does not use the shared `showToast()` from `www/base/toasts.js`. The card predates the shared toast system. Migration would simplify the code and bring consistent toast positioning/animation.

- **Character limit mismatch potential** — client enforces `CHAR_LIMIT = 50000` as character count (`str.length`), firmware enforces `len(request.body) > 50000` as byte count. Multi-byte UTF-8 characters could pass client validation but fail server-side.

- **No offline queue** — if the device is offline when Add/Type is clicked, the action fails immediately. There is no retry or queue mechanism.

- **Editor uses inline styles** — `PicoHidCardEditor` uses raw inline CSS with HA-native CSS variables, not the shared UI system. This is standard for Lovelace editors but noted for completeness.

---

## Changelog

| Date | Commit | Change |
|------|--------|--------|
| 2026-04-11 | — | Initial CLAUDE.md created |

*Last Updated: 2026-04-11*
