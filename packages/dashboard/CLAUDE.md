# CLAUDE - Dashboard Domain

> **Scope:** Report viewer backend sensors for the report-viewer-card
> **Last reviewed:** 2026-02
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

Provides backend sensor infrastructure for the report viewer dashboard card. Dynamically discovers report categories from the filesystem, loads markdown content into sensor attributes, and manages recorder exclusions to prevent database bloat.

---

## Structure

| File | Purpose |
|------|---------|
| `report_viewer.yaml` | Index sensor + 6 content sensors for `docs/reports/` categories; recorder exclusions |

---

## Key Components

### Report Discovery (Dynamic)

The index sensor scans `docs/reports/` subdirectories and discovers categories automatically. Adding a new report type only requires creating a folder and generating a `.md` file -- no YAML changes needed. Categories with no `.md` files are excluded (e.g. `components-review` which has only JSON).

### Content Storage Model

Report markdown is stored in sensor **attributes** (10-40KB per report). Sensor state is a timestamp only (HA state values are capped at 255 chars). The card reads `state_attr('sensor.report_content_*', 'content')`.

### Recorder Exclusion

All `sensor.report_*` entities are excluded from the recorder via entity glob. Without this, 10-40KB of markdown per sensor would be written to the database on every hourly refresh, causing significant DB bloat.

### Refresh Interval

All sensors refresh hourly (`scan_interval: 3600`). New reports appear within 1 hour of generation.

### Key Entities

- `sensor.report_index` -- single index with `index` attribute listing all discovered categories
- `sensor.report_content_{category}` -- one per category, markdown in `content` attribute

---

## Development Workflows

- To add a new report type: create a subdirectory under `docs/reports/` and place a `.md` file in it. The index sensor will discover it on the next hourly refresh (or trigger a manual refresh).
- To verify report content loading, inspect `state_attr('sensor.report_content_{category}', 'content')` in Developer Tools > Template.
- Confirm recorder exclusion is working by checking that `sensor.report_*` entities do not appear in the History panel.

---

## Conventions for AI Assistants

### Naming Conventions

| Entity Type | Pattern | Examples |
|-------------|---------|----------|
| Index sensor | `sensor.report_index` | Single index with `index` attribute |
| Content sensors | `sensor.report_content_{category}` | `report_content_config_intel`, `report_content_failure_mode` |

Category names match directory names under `docs/reports/` with hyphens (e.g. `config-intel`, `meta-insights`, `shared-ui-audit`).

### Content is in Attributes, Not State

Always read report content from `state_attr('sensor.report_content_*', 'content')`, never from the sensor state (which is a timestamp only).

### Recorder Exclusion is Mandatory

Any new `sensor.report_*` entity must be added to the recorder exclusion glob. Without this, large markdown payloads will bloat the database on every refresh cycle.

### Coupling Warnings

**This domain depends on:**
- `docs/reports/` directory structure (categories = subdirectories)
- Python3 available in the HA container (used by command_line sensors)

**This domain is consumed by:**
- `www/cards/report-viewer-card/` custom card component

### Cross-References

- Root: /CLAUDE.md
- Architecture: /ARCHITECTURE.md
- Report files: docs/reports/
- Card component: www/cards/report-viewer-card/

---

## TODOs & Gaps

None currently identified.

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-02-24 | `b350903` | Restructured to 8-section format |

*Last Updated: 2026-02-24*
