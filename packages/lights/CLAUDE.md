# CLAUDE - Lights

> **Scope:** Light automation, manual override, brightness scheduling, color space conversion
> **Last reviewed:** 2026-02
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

The lights domain controls automated lighting across all floors, including presence-triggered on/off, manual override detection, brightness scheduling by time-of-day, and bedroom gradient rendering via CIE color space conversion. Each area uses a different sensor coupling strategy, making this a high-coupling domain.

---

## Structure

| File | Purpose |
|------|---------|
| `lights.yaml` | Floor 01 & Floor 02 automation with manual override |
| `lights_office.yaml` | Office lighting with external control detection |
| `lights2.yaml` | UI dropdowns, virtual lights, dynamic room mapping |
| `lights_bedroom.yaml` | Bedroom UI gradients with XY→RGB conversion |
| `auto_lights.yaml` | Base timer and boolean definitions |

---

## Key Components

### Manual Override Timer System

- **Base timer:** `timer.light_override` — 2 minutes (in `auto_lights.yaml`)
- **Extended:** `minutes_to_respect_manual_input: 5` in Floor 01 automation
- **IMPORTANT:** `restore: true` means override persists across HA restarts
- **Check:** `timer.light_override` state == `'idle'` before automation acts

### First-On-Only Brightness Rule

Brightness is set **only** when light transitions OFF → ON:
```yaml
condition:
  - condition: state
    entity_id: light.target
    state: 'off'  # CRITICAL: prevents mid-session brightness jumps
```

Time-based brightness: 10% (01:00-07:00), 100% otherwise.
**DO NOT** remove the "currently off" condition.

### Sensor Coupling per Area

| Area | Approach | Sensors |
|------|----------|---------|
| Floor 02 | Abstracted | `binary_sensor.presence_floor_02` |
| Office | Abstracted | `binary_sensor.presence_office`, `binary_sensor.door_office` |
| Floor 01 | **Raw sensors** | `ms05_motion`, `ms04_motion`, `vs00_vibration`, `vs05_vibration`, `presence_sensor_fp2_*` |

**Floor 01 bypasses occupancy abstraction.** If occupancy package renames any Floor 01 raw sensors, `lights.yaml` will break silently.

### Darkness Detection (Floor 02)

Dual-trigger logic:
- **Primary:** Sun elevation (twilight +/-30 minutes)
- **Fallback:** Lux < 50 (gloomy days without clear twilight)
- **Lux source:** `binary_sensor.presence_floor_02_2` (note the `_2` suffix)

### Quiet Hours Activity Filter (Floor 01 only)

During 00:00-07:00, vibration alone cannot trigger lights:
- Requires evidence of recent activity from OTHER sensors
- Lookback window: 1 hour (`< 3600` seconds)
- **Purpose:** Filter false triggers from wind/pets at night
- **Implementation:** Uses `namespace()` pattern to propagate loop state to outer scope

### Startup Recovery (Both Floors)

Both floors have a `homeassistant` / `start` trigger. On restart, if presence is detected and it's dark, lights turn on immediately.
- **Floor 02:** Checks `binary_sensor.presence_floor_02` state.
- **Floor 01:** Uses `expand(motion_sensors)` to check if any raw sensor is currently `on`. Skips the quiet hours activity filter on startup (intentional — restoring state, not responding to a new event).

### Absence Timeouts

| Area | Timeout | Notes |
|------|---------|-------|
| Floor 01 | 2 minutes | `minutes_of_absence_till_auto_off` |
| Floor 02 | 10 seconds | Fast stair clearing |
| Bedroom/Office | No auto-off | UI control only |

### Color Space Mathematics (Bedroom)

`lights_bedroom.yaml` contains CIE 1931 XY → sRGB conversion for gradient rendering:

- **Macros:** `clamp01`, `compand` (gamma correction), `xy_to_rgba`
- **Matrix:** Standard XYZ→sRGB transformation
- **Purpose:** Generate CSS `radial-gradient()` for dashboard card
- **Light positioning:** Up to 9 lights, sizes cycle `50%`, `70%`, `90%`

This is UI generation, not device control.

---

## Development Workflows

No special commands or test procedures are documented. Key workflow considerations:

- When modifying Floor 01 lighting, grep for all raw sensor entity IDs across both occupancy and lights packages to avoid silent breakage.
- Test darkness detection changes on actual gloomy days — lux threshold 50 was empirically derived.
- After changing override timer durations, verify behavior persists across HA restarts (`restore: true`).

---

## Conventions for AI Assistants

### Anti-Patterns

- Don't remove the "light is off" condition from brightness automation
- Don't assume Floor 01 uses occupancy abstraction (it doesn't)
- Don't modify override timer duration without understanding HA restart behavior
- Don't change lux threshold (50) without testing on actual gloomy days

### Coupling Warnings

**Upstream dependency:** Occupancy domain (`packages/occupancy/`) — Floor 02 and Office use abstracted presence sensors. Changes to `binary_sensor.presence_floor_02` or `binary_sensor.presence_office` directly affect lighting.

**Floor 01 danger zone:** Uses raw sensor entity IDs directly. Any rename in the occupancy package will silently break Floor 01 lighting.

**Cross-references:**
- Root: /CLAUDE.md
- Occupancy (upstream): packages/occupancy/CLAUDE.md
- UI design system: www/base/docs/CLAUDE.md

---

## TODOs & Gaps

- ~~Floor 01 lacks startup recovery~~ — Resolved 2026-03-05. Both floors now have startup recovery.
- Floor 01 bypasses occupancy abstraction, creating a fragile raw-sensor coupling that could be migrated to use `binary_sensor.presence_floor_01`.

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-02-24 | `b350903` | Restructured to 8-section format |
| 2026-03-05 | — | Added startup recovery to Floor 01 (matches Floor 02 pattern) |

*Last Updated: 2026-03-05*
