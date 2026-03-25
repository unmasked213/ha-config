# CLAUDE - Time Domain

> **Scope:** Alarms, calendar, hourly triggers
> **Last reviewed:** 2026-02
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

Manages all time-related infrastructure including real-time date/time sensors, Echo alarm and timer tracking across 10+ Alexa devices, hourly-triggered automations (camera night vision, weekday phone alarm), and a dashboard calendar event creator. Also provides frontend timer helpers for dashboard countdown displays.

---

## Structure

| File | Purpose |
|------|---------|
| `time.yaml` | Time/date platform sensors, per-second timestamp sensor, frontend timer helpers (hours/minutes/seconds) |
| `alarm_time.yaml` | Echo alarm tracking, alarm/timer active detection across 10+ Alexa devices, bed shaker off button |
| `hourly_triggers.yaml` | Master hourly automation (24 time triggers + sunrise/sunset), camera night vision switching, weekday phone alarm automation |
| `calendar_frontend_add_event.yaml` | Dashboard calendar event creator with multi-day support, writes to `calendar.enhy` |

---

## Key Components

### Alarm/Timer Active Detection (`alarm_time.yaml`)

`alarm_or_timer_active` binary sensor checks 21 sensors across 10+ Echo devices (both `_next_alarm` and `_next_timer` variants).

**Devices referenced:** Echo Show 5, Echo Show 8, Echo Show 15, Echo 3G White Dot, Echo 4G Matter Hub, Echo Flex 01, Echo Flex 02, 4G White Dot, Alexa App for PC, "this_device"

### Weekday Alarm Automation (`hourly_triggers.yaml`)

"Alarms" automation (id: `1713243059859`):
- Triggers at 05:52 on weekdays only
- Skips UK public holidays (`calendar.united_kingdom_eng`)
- Sets phone alarm at hardcoded time (variable `alarm_time: 08:59`)
- Forces DND off, ringer to normal, alarm + ringer volume to max
- Uses Android intent actions via `notify.mobile_app_phone_c`

### Camera Night Vision Switching (`hourly_triggers.yaml`)

The hourly triggers automation switches C09 camera between colour mode (sunrise) and black/white mode (sunset).

### Calendar Event Creator (`calendar_frontend_add_event.yaml`)

Writes to `calendar.enhy` (not a shared calendar). Handles:
- All-day events (date only)
- Timed events (date + time)
- Multi-day events (with optional end date)
- Default duration: 1 hour if no end time specified

### Key Entities

- `sensor.current_time_seconds` -- per-second button-card updates
- `input_number.frontend_timer_*` -- dashboard timer UI helpers
- `binary_sensor.alarm_or_timer_active` -- aggregated alarm/timer state

---

## Development Workflows

- When adding or removing an Echo device, update the `alarm_or_timer_active` binary sensor list in `alarm_time.yaml` (both `_next_alarm` and `_next_timer` sensors must be added/removed).
- Test calendar event creation by verifying events appear in `calendar.enhy` (check all-day, timed, and multi-day variants).
- Hourly triggers can be validated via automation traces in HA UI.

---

## Conventions for AI Assistants

### Alexa Device Coupling

Adding or removing an Echo device requires updating the `alarm_or_timer_active` sensor list in `alarm_time.yaml`. Both `_next_alarm` and `_next_timer` variants must be present for each device.

### Coupling Warnings

**This domain depends on:**
- Alexa Media integration -- all alarm/timer sensors
- `calendar.united_kingdom_eng` -- holiday detection for alarm skip
- Mobile App -- `notify.mobile_app_phone_c` for phone alarm commands
- Reolink C09 camera -- night vision mode switching
- ZHA -- bed shaker button (`!secret hue_button_b02_ieee`)
- Sonoff USB plug -- `switch.sonoff_usb_plug` (bed shaker power)

**This domain is consumed by:**
- Dashboard timer UI references `input_number.frontend_timer_*`
- `sensor.current_time_seconds` enables per-second button-card updates

### Cross-References

- Root: /CLAUDE.md
- Device (bed shaker hardware): packages/device/
- Communication (alarm notifications): packages/communication/

---

## TODOs & Gaps

None currently identified.

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-03-25 | — | Corrected Alexa sensor count: 20→21 |
| 2026-02-24 | `b350903` | Restructured to 8-section format |

*Last Updated: 2026-03-25*
