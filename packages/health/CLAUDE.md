# CLAUDE - Health Domain

> **Scope:** Body composition metrics from Withings smart scale for two people
> **Last reviewed:** 2026-02
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

The health domain computes body composition metrics (BMI, fat/muscle/bone/hydration percentages, mass indices, ratios) from raw Withings smart scale data for two people (C and E). These computed sensors are consumed exclusively by dashboard health cards with no automation dependencies.

---

## Structure

| File | Purpose |
|------|---------|
| `health.yaml` | C-only computed metrics: fat/muscle/bone/hydration percentages, BMI, body surface area, mass indices, ratios |
| `weight.yaml` | Both C and E: raw weight wrappers, fat/bone/muscle/fat-free/hydration sensors, percentages, BMI, body surface area, mass indices |

---

## Key Components

### Hardcoded Heights

BMI and body surface area calculations use hardcoded heights:
- C height = 1.83m (6ft)
- E height = 1.70m

### Withings Sensor Naming

All raw data comes from Withings integration sensors:
- Pattern: `sensor.withings_{c|e}_{metric}`
- Metrics: `weight`, `fat_mass`, `fat_free_mass`, `muscle_mass`, `bone_mass`, `hydration`

### Duplicate Sensors

`health.yaml` and `weight.yaml` both define sensors with the same names (e.g., "C Fat Mass Percentage", "C BMI"). The last-loaded file wins. This may cause unexpected values if load order changes.

### Division-by-Zero Protection

All percentage and ratio sensors have `availability` guards that check the divisor is not `unknown`/`unavailable` and is `> 0`. When Withings reports unavailable or 0kg, these sensors become `unavailable` instead of erroring. State templates also use `float(0)` / `float(1)` defaults as a fallback.

---

## Development Workflows

### Adding New Metrics

When adding new computed metrics, follow the existing pattern of template sensors that reference `sensor.withings_{c|e}_{metric}` entities. Ensure new sensors are added to `weight.yaml` (for both people) rather than `health.yaml` (C-only) unless there is a specific reason for asymmetry.

### Testing

Verify template sensors by checking their states in Developer Tools > States after a reload. Watch for `unknown` or `unavailable` states which indicate the upstream Withings sensors are not reporting.

---

## Conventions for AI Assistants

### Naming Conventions

- Raw Withings sensors: `sensor.withings_{c|e}_{metric}`
- Computed percentage sensors follow the pattern of the person prefix (C/E) plus the metric name

### Anti-Patterns

- Don't add new sensors to `health.yaml` that duplicate definitions in `weight.yaml` -- this worsens the existing duplicate sensor problem
- Don't omit `availability` guards on new percentage/ratio sensors -- follow the existing pattern that checks the divisor is available and `> 0`
- Don't change hardcoded heights without confirming with the user

### Coupling Warnings

**This domain depends on:**
- Withings integration -- all `sensor.withings_*` entities

**This domain is consumed by:**
- Dashboard health cards display these computed metrics (UI-only -- no automations consume health data)
- Sleep metrics (Withings sleep_score, deep_sleep, rem_sleep, snoring) are also UI-only with no automation consumers (Meta-Insights 2026-02-07)

### Cross-References

- Root: /CLAUDE.md

---

## TODOs & Gaps

- **Duplicate sensors:** `health.yaml` and `weight.yaml` define overlapping sensors with the same names; load order determines which wins. These should be deduplicated.
- ~~**Division-by-zero:**~~ Resolved 2026-03-05 — all percentage/ratio sensors now have `availability` guards.

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-02-24 | `b350903` | Restructured to 8-section format; all existing content preserved |
| 2026-03-05 | — | Division-by-zero fix: added availability guards to all 13 percentage/ratio sensors |

*Last Updated: 2026-03-05*
