# CLAUDE - Server Domain

> **Scope:** Git sync, frontend helpers, server statistics, dashboard infrastructure, theme management, TTS setup
> **Last reviewed:** 2026-02
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

The server domain provides system-level infrastructure including git-based backup, frontend helper entities for dashboard rendering, comprehensive server statistics (entity counts, uptime, MQTT metrics, storage), and theme/TTS management. It is the backbone that dashboard cards and system monitoring rely on.

---

## Structure

| File | Purpose |
|------|---------|
| `github_sync.yaml` | Shell command + sensor for git backup; shows toast notification and fires `notify_e_or_c` event on completion |
| `ha_snapshot_sensor.yaml` | Pre-formatted HA server snapshot for prompt manager inject button; static sections read from `sensor.ha_system_context` |
| `frontend/advanced_camera_card_backend.yaml` | Camera main/secondary view selectors with mirror-previous automation |
| `frontend/bubble_modules.yaml` | Event-driven storage for Bubble Card module config |
| `frontend/daily_affirmation.yaml` | Deterministic daily affirmation sensor (210 entries, seeded by date) |
| `frontend/frontend_animated_header_cycle.yaml` | Rotating header message display (7-second timer cycle) |
| `frontend/frontend_auto_refresh.yaml` | Configurable auto-refresh via browser_mod.navigate |
| `frontend/frontend_dad_joke.yaml` | REST sensor fetching dad jokes from icanhazdadjoke.com every 2 hours |
| `frontend/frontend_server_stats.yaml` | **Largest file** -- entity/domain counts, uptime, MQTT stats, storage breakdown, backup stats, DB config, dashboard complexity, system info (Python/Docker/kernel versions) |
| `frontend/frontend_tester_entities.yaml` | Generic test entities (boolean, number, select, text) for UI development |
| `frontend/frontend_theme_management.yaml` | Sets "Material You" dark theme on server boot |
| `frontend/frontend_tts_setup.yaml` | TTS helpers (message input, model selector, whisper mode toggle); script is **commented out** |

---

## Key Components

### Server Stats Shell Commands

`frontend_server_stats.yaml` contains many `command_line` sensors that run shell commands inside the HA container:
- **Supervisor API access** -- uses `/run/supervisor.token` for backup stats, installation info, Docker/kernel versions
- **MQTT broker access** -- uses `mosquitto_sub` to query `$SYS` topics from `core-mosquitto`
- **Filesystem scanning** -- `du`, `find`, `wc` across `/config`, `/media`, `/share`
- **Scan intervals vary:** 60s (Docker), 3600s (most stats), 6000s (dashboard complexity, line counts), 86400s (installation info, Python/kernel)
- **Command timeouts:** 15-90 seconds depending on complexity

These sensors **only work on Home Assistant OS** with Supervisor. They will fail silently on Container or Core installs.

### Dashboard Complexity Scoring

`sensor.dashboard_complexity` parses all `lovelace*` files in `.storage/`:
- **Formula:** `total_cards + (custom_cards * 2) + views`
- Custom cards weighted 2x because they indicate advanced configuration
- Uses `jq` for JSON parsing -- requires `jq` in container

### Camera View Mirror Logic

`camera_mirror_previous_view` automation: when main view selector changes, the secondary view automatically switches to show what the main was previously displaying. This gives a picture-in-picture effect.

- **Main selector:** `input_select.camera_main_view_selector` (8 options: C13, C10, C09, C07, C04, Doorbell, Garden, Front)
- **Secondary selector:** `input_select.camera_secondary_view_selector` (same options)
- Camera options overlap with `packages/device/cameras.yaml` -- the selectors are defined here, not there

### Auto Refresh

`frontend_auto_refresh.yaml` triggers page reloads via `browser_mod.navigate`. Requires:
- browser_mod integration installed
- `sensor.current_view_path` provides the target path (defaults to `/dashboard-home/security`)

### TTS Setup

`frontend_tts_setup.yaml` defines helpers (input_text, input_select, input_boolean) but the `script.send_tts_message` is entirely commented out. The helpers are still live -- likely consumed by the UI directly.

### Key Entities

- **Stat sensors:** `sensor.uptime_formatted`, `sensor.dashboard_complexity`, `sensor.entity_domain_breakdown`
- **Frontend lists:** `sensor.addons_frontend_list`, `sensor.integrations_frontend_count`
- **MQTT sensors:** `sensor.mqtt_broker_uptime`, `sensor.mqtt_clients_connected`
- **Camera selectors:** `input_select.camera_main_view_selector`, `input_select.camera_secondary_view_selector`

---

## Development Workflows

### Before Modifying

Check which dashboard cards reference `sensor.entity_domain_breakdown`, `sensor.dashboard_complexity`, `sensor.uptime_formatted`, etc. before making changes.

### Working with Server Stats

Command-line sensors have varying scan intervals (60s to 86400s) and timeouts (15-90s). When adjusting scan intervals, always verify the `command_timeout` is sufficient for the command to complete. Slow commands may overlap if intervals are reduced.

### Testing Shell Commands

Server stats shell commands require the Supervisor API and `mosquitto_sub`. These only work in HA OS environments. Test by checking sensor states after reload; failed commands produce empty or error states silently.

---

## Conventions for AI Assistants

### Naming Conventions

| Entity Type | Pattern | Examples |
|-------------|---------|----------|
| Server stats | `sensor.{descriptive_name}` | `sensor.uptime_formatted`, `sensor.dashboard_complexity` |
| Frontend lists | `sensor.{type}_frontend_list` | `sensor.addons_frontend_list` |
| Frontend counts | `sensor.{type}_frontend_count` | `sensor.integrations_frontend_count` |
| MQTT sensors | `sensor.mqtt_{metric}` | `sensor.mqtt_broker_uptime`, `sensor.mqtt_clients_connected` |

### Anti-Patterns

- Don't increase scan intervals on command_line sensors without checking command_timeout -- slow commands may overlap
- Don't remove MQTT `$SYS` topic sensors without checking if the command_line versions are still active (both exist for resilience)
- Don't assume `camera_main_view_selector` options match `cameras.yaml` -- the selectors here include live views (Doorbell, Garden, Front) not present in camera feed settings

### Coupling Warnings

**This domain depends on:**
- Supervisor API (`/run/supervisor.token`) -- installation info, backup stats, Docker/kernel versions
- Mosquitto addon (`core-mosquitto`) -- MQTT broker stats
- browser_mod integration -- auto refresh
- `jq` binary in container -- dashboard complexity parsing
- Git sync shell script (`/config/git_sync.sh`, `/config/git_sync_result.txt`)

**This domain is consumed by:**
- Dashboard cards (specs-card, phone-card) reference these stat sensors
- `notify_e_or_c` event from git sync is consumed by communication/alerts

### Cross-References

- Root: /CLAUDE.md
- Architecture: /ARCHITECTURE.md
- Device/cameras (related selectors): packages/device/cameras.yaml
- Communication (git sync events): packages/communication/

---

## TODOs & Gaps

None currently identified.

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-02-24 | `b350903` | Restructured to 8-section format; all existing content preserved |

*Last Updated: 2026-02-24*
