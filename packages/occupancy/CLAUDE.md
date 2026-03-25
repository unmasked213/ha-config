# CLAUDE - Occupancy

> **Scope:** Presence detection, door sensors, bed state, room transitions
> **Last reviewed:** 2026-02
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

The occupancy domain provides whole-home presence detection by fusing steady sensors (motion/occupancy), edge sensors (doors), and sleep context into per-area binary presence states. It exposes a reusable YAML anchor system for area instantiation and feeds downstream consumers like lighting and HVAC.

---

## Structure

| File | Purpose |
|------|---------|
| `presence_detection.yaml` | Core presence system with YAML anchors |
| `doors.yaml` | Unified door sensors (contact + vibration fallback) |
| `bed_state.yaml` | Sleep context detection |
| `presence_desks.yaml` | Desk occupancy with time-window analysis |
| `floor02_travel_tracking.yaml` | Room transition confidence scoring |
| `presence_activity_card.yaml` | UI card helper entities |

---

## Key Components

- **`presence_detection.yaml`** — Central file defining the `&presence_area_base` YAML anchor reused by all area presence sensors (bedroom, office, floor_00, floor_01, floor_02). Reduced to 17 `expand()` calls scoped via `area_entities()` — not global iteration (previously 15+ unscoped calls re-evaluating the full entity registry on every state change).
- **`doors.yaml`** — Unified door sensors exposing `contributing_raw_sensors` attribute. Raw sensors are auto-excluded to prevent double-counting.
- **`bed_state.yaml`** — Produces `binary_sensor.bed_state_asleep_likely_bedroom` with `device_class: safety`. Bed occupancy ALWAYS dominates time-of-day logic.
- **`floor02_travel_tracking.yaml`** — Fires `room_occupancy_change` events with room transition data and produces `sensor.floor02_zone_active`. Uses `namespace()` with `dict()` merge to accumulate scores across loop iterations.

**Key entities:**

| Entity Type | Pattern | Examples |
|-------------|---------|----------|
| Area presence | `binary_sensor.presence_<area>` | `presence_bedroom`, `presence_floor_02` |
| Desk presence | `binary_sensor.desk_<location>_presence` | `desk_office_presence` |
| Unified doors | `binary_sensor.door_<location>` | `door_house`, `door_office` |
| Door timestamps | `input_datetime.door_<location>_last_change` | |

**Area IDs:** bedroom_2, office, 2nd_floor, 1st_floor, ground_floor

**Depends on raw sensors:**
- FP2 presence sensors (`binary_sensor.presence_sensor_fp2_*`)
- Door contact sensors (`binary_sensor.ds*_position`)
- Vibration sensors (`binary_sensor.vs*_vibration`)
- Motion sensors (`binary_sensor.ds*_motion`)

---

## Development Workflows

### Area Presence Instantiation

```yaml
- binary_sensor:
    - name: "Presence [Area]"
      <<: *presence_area_base
      variables:
        area: "[area_id]"
        edge_hold: 30  # or 15 for high-traffic
        excluded_entities: []
```

### Presence-Based Automation Trigger

```yaml
trigger:
  - platform: state
    entity_id: binary_sensor.presence_floor_02
    to: 'on'
conditions:
  - condition: time
    after: '06:00:00'
    before: '22:00:00'
```

**Before modifying:** Grep for `presence_` and `door_` entity usage across packages.

---

## Conventions for AI Assistants

### Two-Tiered Presence Model

- Steady sensors (motion/occupancy): TRUE while active
- Edge sensors (doors): Trigger presence for configurable hold duration
- Default edge_hold: 30s (high-traffic areas: 15s)

### Constraints

1. **YAML Anchor `&presence_area_base`** — Reused across all area presence sensors. Structural changes ripple to bedroom, office, floor_00, floor_01, floor_02.

2. **Auto-Exclusion of Raw Sensors** — Doors expose `contributing_raw_sensors` attribute. These are auto-excluded to prevent double-counting.

3. **Sleep Context is Safety-Critical** — `binary_sensor.bed_state_asleep_likely_bedroom` uses device_class: safety. Bed occupancy ALWAYS dominates time-of-day logic.

### Anti-Patterns

- Don't add new presence areas without using `&presence_area_base` anchor
- Don't hardcode sensor lists — use `area_entities()` filter
- Don't modify edge_hold without understanding impact on lighting response
- Don't assume door sensors are contact-only (vibration fallback exists)

### Coupling Warnings

**This domain affects:**
- Lighting automation (all `packages/lights/*.yaml`)
- HVAC control
- Activity alerts

**Cross-references:**
- Root: /CLAUDE.md
- Architecture: /ARCHITECTURE.md
- Lights (consumer): packages/lights/

---

## TODOs & Gaps

- **Confidence Tier is Unconsumed** — Every area presence sensor produces a `confidence_tier` attribute (6 levels: absent, edge_triggered, stale, activity_only, definitive, reinforced). No automation reads this attribute — all consumers use binary state only. (Meta-Insights 2026-02-07)

- **Room Transition Events Fire Into Void** — `floor02_travel_tracking.yaml` fires `room_occupancy_change` events with room transition data, and produces `sensor.floor02_zone_active`. Zero automations listen for either. (Meta-Insights 2026-02-07)

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-02-24 | `b350903` | Restructured to 8-section format |

*Last Updated: 2026-02-24*
