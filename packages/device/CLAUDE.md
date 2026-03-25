# CLAUDE - Device Domain

> **Scope:** Hardware device control, camera feeds, covers/blinds, mobile phones, PC state, pet devices, Sonos, Govee heater, driveway car detection
> **Last reviewed:** 2026-02
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

The device domain manages all physical hardware integrations including camera feed configuration, motorized cover/blind control with phased opening logic, mobile phone volume and notification management, PC session state detection, pet device monitoring, and driveway car detection. It bridges raw hardware sensors and APIs into usable Home Assistant entities and automations.

---

## Structure

| File | Purpose |
|------|---------|
| `cameras.yaml` | Camera feed selector, image adjustment sliders (brightness/contrast/saturation/sharpness), feed display toggles for 12 cameras |
| `curtains.yaml` | Cover/blind automation: morning phased open (bedroom + office), evening close, night safety check, slider visibility auto-hide |
| `driveway_detection.yaml` | Dad's car detection entities: thresholds, AI fallback toggle, debug state (logic lives in `pyscript/dad_car_detection.py`) |
| `govee.yaml` | Govee heater REST API control via mode selector (Off/Fan Only/Low Heat/High Heat) |
| `mobile_device.yaml` | Phone volume sliders (C + E), device notification toggles, location update trigger |
| `pc.yaml` | C PC session state (off/locked/unlocked) via HASS.Agent heartbeat, REST notification endpoint |
| `pet_devices.yaml` | Pet supply low-level sensor (food + water), hourly water fountain polling workaround |
| `phone_control.yaml` | Find My Phone script (alarm + TTS + flashlight), ringer mode scripts, flashlight toggle |
| `sonos.yaml` | Sonos notification toggle |
| `structure.yaml` | Legacy blind open/close toggles, C bedroom window motor cover template |

---

## Key Components

### Cover Morning Phase Script

`script.cover_morning_phase` is a reusable phased-open script with comprehensive safety guards:
- **Vacancy required:** Room must be empty for >=5 minutes before opening
- **Sun elevation gates:** Weekday >=3 degrees, weekend/holiday >=6 degrees (uses `calendar.united_kingdom_eng`)
- **Phase targets:** 15% -> 45% -> 95% with 1-minute dwell between phases
- **Abort triggers:** Presence detected, manual closing, opposite motion, timeout
- **Retry logic:** One retry on timeout, then stops
- **Position clamped:** 1-95% (never fully open to protect mechanism)

### Cover Evening/Night Automation

- **Evening close:** Triggers at sun elevation < -4 degrees, closes all three covers to position 1
- **Night safety check:** When either person leaves after dark, ensures covers are closed
- **Both use the same target list:** `cover.curtain_3_a659`, `cover.window_blind_left`, `cover.window_blind_right`
- **Note:** `state_attr()` calls on cover positions (lines ~466-484) use `{% set pos = state_attr(...) %}` + `pos if pos is not none else 0` with `availability:` guards -- safe pattern despite Intel Report I-05 flagging it

### PC Session State

`sensor.c_pc_session` returns one of three states: `off`, `locked`, `unlocked`.
- **Heartbeat:** 150-second grace period across 3 HASS.Agent sensors
- **Lock detection:** Matches against 7 window-title fragments (lockscreen, logonui, etc.)
- **UNLOCK_WHITELIST:** Empty array -- add lowercase strings if apps contain "lock" in their title
- **Falls back to "off"** if all sensors go stale, never returns `unknown`/`unavailable`

### Driveway Detection

`driveway_detection.yaml` only defines entities (thresholds, toggles, debug text). The actual detection logic runs in `pyscript/dad_car_detection.py` using contrast analysis + white pixel percentage. AI fallback uses OpenAI Vision API (gated by `input_boolean.dad_car_ai_enabled`).

### Pet Water Fountain Polling Workaround

The dog water fountain does not push state changes reliably. `dog_water_fountain_polling` automation presses the reset_filter button hourly to force sensor refresh. This is a **welfare-critical workaround** -- removing it risks stale water level data.

### Key Entities

- **Camera IDs:** C01-C13 (not all have sliders -- only C05, C07, C08, C09 have feed_settings selectors)
- **Cover targets:** `cover.curtain_3_a659`, `cover.window_blind_left`, `cover.window_blind_right`
- **PC state:** `sensor.c_pc_session` (off/locked/unlocked)
- **FP2 presence sensors (raw):**
  - Bedroom: `binary_sensor.presence_sensor_fp2_07a0_presence_sensor_1_2`
  - Office: `binary_sensor.presence_sensor_fp2_1780_presence_sensor_1`

---

## Development Workflows

### Before Modifying

Grep for `cover.curtain_3_a659`, `cover.window_blind_`, `dad_car_`, and `c_pc_session` across packages before making changes.

### Testing Cover Automations

Cover phase scripts involve physical mechanisms with abort/retry logic. Test with position values in the 1-95% range only. Never use position 0 or 100, which may jam the mechanism.

### Driveway Detection

Detection logic is in `pyscript/dad_car_detection.py`, not in this domain's YAML. Entity definitions (thresholds, toggles) are here; logic changes require editing the pyscript file.

---

## Conventions for AI Assistants

### Naming Conventions

| Entity Type | Pattern | Examples |
|-------------|---------|----------|
| Camera sliders | `input_number.c{NN}_image_{property}` | `c07_image_brightness` |
| Camera feed toggles | `input_boolean.c{NN}_feed_display_video` | `c01_feed_display_video` |
| Camera feed settings | `input_select.c{NN}_feed_settings` | `c09_feed_settings` |
| Phone volumes | `input_number.phone_{c\|e}_volume_{stream}` | `phone_c_volume_ringer` |
| Cover sliders | `input_boolean.curtain_slider_visibility_{area}` | `curtain_slider_visibility_office` |
| Cover auto mode | `input_boolean.{area}_blinds_automatic_mode` | `office_blinds_automatic_mode` |

**Person prefixes:** C = Cam, E = Enhy (consistent across mobile_device, phone_control, pc)

### Anti-Patterns

- Don't remove the vacancy check from morning phase -- covers should not move while someone is in the room
- Don't change phase targets without testing the physical mechanism (position 0 or 100 may jam)
- Don't remove the pet fountain polling -- it's a welfare-critical workaround

### Coupling Warnings

**This domain depends on:**
- `pyscript/dad_car_detection.py` -- driveway detection logic
- `calendar.united_kingdom_eng` -- cover holiday detection
- `sun.sun` -- cover morning/evening triggers
- FP2 presence sensors (raw) -- cover morning phase vacancy check
  - Bedroom: `binary_sensor.presence_sensor_fp2_07a0_presence_sensor_1_2`
  - Office: `binary_sensor.presence_sensor_fp2_1780_presence_sensor_1`
- HASS.Agent sensors -- PC state (`sensor.a_a_lastsystemstatechange`, `sensor.a_a_activewindow_2`, `sensor.a_a_lastactive`)
- Govee API -- `!secret govee_api_key`, `!secret govee_heater_device_id`, `!secret govee_heater_model`
- PetKit integration -- `binary_sensor.freshelement_3_*`, `binary_sensor.dog_water_fountain_*`

**This domain is consumed by:**
- Communication (alerts may reference device states)
- Lights (no direct coupling, but covers affect lux readings)

### Cross-References

- Root: /CLAUDE.md
- Architecture: /ARCHITECTURE.md
- Driveway detection logic: pyscript/dad_car_detection.py
- Driveway detection docs: docs/reference/dad_car_detection/DAD_CAR_DETECTION.md
- Occupancy (upstream for covers): packages/occupancy/

---

## TODOs & Gaps

None currently identified.

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-02-24 | `b350903` | Restructured to 8-section format; all existing content preserved |

*Last Updated: 2026-02-24*
