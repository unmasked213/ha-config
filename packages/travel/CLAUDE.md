# CLAUDE - Travel Domain

> **Scope:** Location tracking, ETA, railway
> **Last reviewed:** 2026-02
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

Handles real-time location tracking and ETA display for two people (Cam and Enhy), including Google Travel Time integration, stale location detection, battery/charging status, and a map focus UI. Also includes a minimal railway information helper.

---

## Structure

| File | Purpose |
|------|---------|
| `map.yaml` | Map focus toggles, person selector, distance/ETA/status/movement/battery display sensors for two people |
| `railway.yaml` | Train service summary input text (single helper, minimal) |

---

## Key Components

### Two-Person Location System (`map.yaml`)

All location sensors are dual: C (Cam) and E (Enhy). `input_boolean.location_info_selector` toggles which person's data is displayed:
- **off** = E (default)
- **on** = C

### ETA Calculation Logic

`sensor.location_eta_display` adjusts Google Travel Time with elapsed time since last update:
- Uses a **15-minute recency window** -- if update is older than 15 min, caps the adjustment at 15 min
- Formats output as `Xh Ym` or just `Xm`

### Stale Location Detection

`sensor.location_status_display` returns "Lost" if:
- Sensor is `unknown`/`unavailable`, OR
- Current lat/lon equals previous lat/lon AND last update > 5 minutes ago

### Battery Display

Includes battery level + charging indicator (lightning bolt) and colour coding:
- Red (<=20%), Yellow (<=50%), Green (>50%)

### Key Entities

- `sensor.location_cam_phone`, `sensor.location_enhy_phone` -- Places integration
- `sensor.google_travel_time_c`, `sensor.google_travel_time_e` -- Google Travel Time
- `sensor.phone_c_battery_level`, `sensor.phone_e_battery_level` -- Mobile App battery
- `input_boolean.location_info_selector` -- person toggle
- `sensor.location_eta_display` -- formatted ETA
- `sensor.location_status_display` -- stale/lost detection

---

## Development Workflows

- When testing ETA display, verify the 15-minute recency window caps correctly by checking `sensor.location_eta_display` attributes.
- Stale location detection can be tested by checking `sensor.location_status_display` when a phone has been stationary for >5 minutes.
- Toggle `input_boolean.location_info_selector` to verify both person views render correctly.

---

## Conventions for AI Assistants

### Naming Conventions

| Entity Type | Pattern | Examples |
|-------------|---------|----------|
| Location sensors | `sensor.location_{person}_phone` | `sensor.location_cam_phone` |
| Travel time | `sensor.google_travel_time_{c\|e}` | `sensor.google_travel_time_c` |
| Phone battery | `sensor.phone_{c\|e}_battery_level` | `sensor.phone_c_battery_level` |

### Coupling Warnings

**This domain depends on:**
- Google Travel Time integration -- `sensor.google_travel_time_c`, `sensor.google_travel_time_e`
- Places integration -- `sensor.location_cam_phone`, `sensor.location_enhy_phone`
- Mobile App -- battery and charging sensors

### Cross-References

- Root: /CLAUDE.md
- Device (mobile): packages/device/mobile_device.yaml

---

## TODOs & Gaps

- **`map.yaml` unguarded state access** — Three `states[variable].last_updated` calls at lines 63, 88, 125 without `default` filters or `is not none` guards. If a travel/target sensor entity is removed or temporarily unavailable, template throws `AttributeError`. (Intel Report I-03, 2026-03-15)

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-03-25 | — | Added map.yaml unguarded state access to TODOs (from Intel Report I-03) |
| 2026-02-24 | `b350903` | Restructured to 8-section format |

*Last Updated: 2026-03-25*
