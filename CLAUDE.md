# CLAUDE - ha-config

## Summary

Home Assistant configuration for a two-person household (Cam and Enhy), running on HA OS. The system manages ~3,098 runtime entities (3,927 in registry) across 14 domain packages, 36 custom integrations, a token-driven UI design system, and Python automations. AI-assisted development uses cross-device session persistence (PC via Claude Desktop, tablet/phone via HA addon).

---

## Structure

| Path | Description |
|------|-------------|
| `configuration.yaml` | Core HA loader — minimal, delegates to packages via `!include_dir_named` |
| `automations.yaml` | Root automations (~35 top-level, ~110 with nested aliases) |
| `scripts.yaml` | 48 reusable service-call sequences (68 in registry incl. UI/integration-created) |
| `scenes.yaml` | Named scene snapshots |
| `frigate.yml` | Frigate NVR config (C11 camera, MQTT, go2rtc) |
| `secrets.yaml` | Credentials store (gitignored, `!secret` references only) |
| `packages/` | **14 domain packages** — primary config (62 YAML files, ~10.9K lines) |
| `custom_components/` | **36 installed integrations** (never modify directly) |
| `www/` | Web assets — UI design system (`base/`), custom cards (`cards/`), community cards, media |
| `system_context.yaml` | Single source of truth for static system context (read by pyscript → `sensor.ha_system_context`) |
| `pyscript/` | Python automations (12 files) — CV detection, calendar ops, logging, system context, action extraction |
| `themes/` | Theme definitions — Material You (active), Catppuccin, VisionOS, Olympus (legacy) |
| `ui/` | Dashboard config — lovelace resources, views, templates, extra modules |
| `.storage/` | HA internal storage — dashboards (JSON), auth, registries (~32 MB, never modify) |
| `.claude/` | AI session management — session.md, rules/, hooks/, mcp.json |
| `docs/` | Reports (config-intel, failure-mode, meta-insights, shared-ui-audit) and reference docs |
| `addons/` | Local HA add-ons (ha-config-ai-agent) |
| `ai_adversarial_system/` | Same-model collaboration pattern documentation and workspace |
| `media/` | AI-generated images, recordings, transcripts |
| `ARCHITECTURE.md` | System architecture documentation (v10.4) |
| `README.md` | Quick reference with auto-generated metrics (snapshot injected by `git_sync.sh` at commit time) |
| `readme_snapshot.j2` | Jinja2 template for README metrics — rendered via HA template API during git sync |
| `scripts/claude_dispatch.sh` | Addon-side dispatch watcher for Claude Code bridge |
| `docs/projects/claude/bridge/claude-dispatch-protocol.md` | Dispatch protocol reference and claude.ai setup instructions |
| `git_sync.sh` | Git synchronisation script |
| `extract_js.py` | JavaScript extraction utility |
| `ip_bans.yaml` | IP ban list |
| `ui-lovelace.yaml` | Legacy dashboard config |
| `example.yaml` | Reference/template file |

**Directories not listed above** (runtime/generated, not manually edited): `appdaemon/`, `bin/`, `blueprints/`, `custom_icons/`, `deps/`, `downloads/`, `go2rtc-*/`, `llmvision/`, `python_scripts/`, `scripts/`, `templates/`, `tmp/`, `tts/`, `uploads/`

---

## Key Components

### Domain Packages (`packages/`)

Each domain has its own `CLAUDE.md` at `packages/<domain>/CLAUDE.md`, auto-loaded via `.claude/rules/`.

| Domain | Files | Purpose | Key Entry Points |
|--------|-------|---------|-----------------|
| **ai** | 8 | AI text/image generation, prompts, Claude bridge + Code Dispatch, Alexa TTS | `ai_main.yaml`, `claude_bridge.yaml`, `prompt_manager.yaml` |
| **communication** | 6 | WhatsApp messaging, notifications, transcript pipeline | `whatsapp_config.yaml`, `alerts.yaml`, `transcript_pipeline.yaml` |
| **dashboard** | 1 | Report viewer backend sensors | `report_viewer.yaml` |
| **device** | 10 | Cameras, covers/blinds, PC state, pet devices, Govee, Sonos | `cameras.yaml`, `curtains.yaml`, `pc.yaml` |
| **health** | 2 | Withings body composition metrics (C and E) | `health.yaml`, `weight.yaml` |
| **lights** | 5 | Per-floor lighting automation with manual override | `lights.yaml`, `lights_office.yaml`, `auto_lights.yaml` |
| **network** | 1 | Device scanning, 63 MAC-to-device mappings | `ip_and_mac_address_mapping.yaml` |
| **occupancy** | 6 | Presence detection (YAML anchors), doors, bed state, travel tracking | `presence_detection.yaml`, `doors.yaml`, `bed_state.yaml` |
| **server** | 12 | Git sync, frontend helpers, server stats, theme management | `github_sync.yaml`, `frontend/frontend_server_stats.yaml` |
| **shopping** | 2 | Shopping lists (Tesco/Amazon), supermarket busyness | `shopping_list.yaml`, `tesco_sensors.yaml` |
| **time** | 4 | Alarm tracking, hourly triggers, calendar event creation | `alarm_time.yaml`, `hourly_triggers.yaml` |
| **travel** | 2 | Two-person location tracking, ETA, railway info | `map.yaml`, `railway.yaml` |
| **weather** | 1 | Pirate Weather forecasts, AI clothing suggestions | `frontend_weather.yaml` |
| **work** | 2 | Meeting action extraction pipeline, AI classification | `work.yaml`, `work_actions_card.yaml` |

### UI Design System (`www/base/`)

Token-driven design system with 16 JS files. `foundation.js` is **READ-ONLY** (single source of truth for tokens). Governed by `www/base/docs/CLAUDE.md`.

### Custom Cards (`www/cards/`)

| Card | Files | Purpose |
|------|-------|---------|
| `prompt-manager/` | 9 | AI prompt CRUD, scoring, versioning, HA backend sync |
| `report-viewer-card/` | 2 | Dynamic markdown report display |
| `presence-activity-card/` | 3 | Presence visualisation |
| `ui-catalogue-card/` | 8 | Dev-time component showcase |
| `checklist-card/` | 1 | Todo list with animated checkboxes |
| `priority-matrix-card/` | 5 | Task prioritisation matrix with circle sliders, scoring, FLIP animations, weights drawer |
| `pico-hid-card/` | 1 | USB HID typing device controller |
| `work-actions-card/` | 1 | Work todo list with completion animations, dropdown menu settings, meeting summary drawer, edit modal, new item indicators, touch interactions |
| `phone-card/` | 1 | Phone display card |

### Python Automations (`pyscript/`)

Key files: `dad_car_detection.py` (driveway CV + OpenAI Vision fallback), `action_extraction_pipeline.py` (meeting action extraction), `save_uploaded_file.py`, `log_errors.py`, `recorder_stats.py`, calendar cleanup scripts.

### AI Agent Add-on (`addons/ha-config-ai-agent/`)

FastAPI add-on for natural language HA config management. Python 3.11+, OpenAI Agents SDK. Phase 7 of 8 (security hardening).

---

## Development Workflows

### Environment

This configuration is accessed from two environments:
- **Windows (Claude Desktop):** `A:\` via Samba share
- **HA OS (Claude Terminal addon):** `/config/`

These paths are equivalent. `A:\packages\` and `/config/packages/` refer to the same files.

### Setup

- **HA version:** 2026.3.4 on HA OS 17.1
- **No CI/CD pipeline** — local development only
- **IDE config:** `.vscode/`, `.cursor/` present

### Git Workflow

- Branch pattern: `claude/<description>-<session-id>` (MUST match or push fails)
- Commit format: `<Action> <component> <description>`
- Sync script: `git_sync.sh`

### Common Commands

```bash
# HA add-on only — haq (HA Query) is on PATH via SessionStart hook
haq state <entity_id>      # State, attributes, last_changed
haq list <pattern>         # List matching entities (regex)
haq filter <state>         # All entities in state: on, off, unavailable
haq call <domain> <service> <entity>  # Call a service
```

### Live Entity Access

| Environment | MCP tools | haq CLI | Config location |
|-------------|-----------|---------|-----------------|
| **Desktop (Code tab)** | 22 tools via Nabu Casa | No | `~/.claude.json` → `https://…nabu.casa/api/mcp` (type: http) |
| **HA add-on** | 22 tools via Supervisor | Yes | `.claude/mcp.json` → `supervisor/core/api/mcp/sse` (type: sse) |
| **Desktop (Chat tab)** | None | No | MCP not supported in Chat mode |

> **Note:** The Supervisor CLI `ha` is a separate tool (system management). `haq` avoids conflicting with it.

**MCP tools (22):** `HassTurnOn`, `HassTurnOff`, `HassSetPosition`, `HassStopMoving`, `HassCancelAllTimers`, `HassFanSetSpeed`, `HassLightSet`, `HassMediaUnpause`, `HassMediaPause`, `HassMediaNext`, `HassMediaPrevious`, `HassSetVolume`, `HassSetVolumeRelative`, `HassMediaPlayerMute`, `HassMediaPlayerUnmute`, `HassMediaSearchAndPlay`, `HassListAddItem`, `HassListCompleteItem`, `HassBroadcast`, `GetDateTime`, `calendar_get_events`, `todo_get_items`, `GetLiveContext`

### Testing & Validation

No automated test suite. Validation approach:
1. HA Logs → 2. Automation Traces → 3. Template Tester → 4. Browser Console → 5. Entity States

### Related Documentation

- **ARCHITECTURE.md** — System architecture, data flows, entity relationships
- **www/base/README.md** — UI system index for dashboard/card work
- **docs/reports/** — Intel, Failure Mode, Meta-Insights, and UI Audit reports

---

## Conventions for AI Assistants

### Session Continuity

**Multi-device access:** PC (Claude Desktop with `--resume`), Tablet/Phone (HA addon, no `--resume`). File-based persistence provides cross-device continuity. See `.claude/README.md` for rationale.

#### On Resume ("continue" / "pick up where we left off")

1. Read `.claude/session.md` immediately
2. Check timestamp for staleness:
   - **≤3 days:** Resume normally, no prompt needed
   - **>3 days:** Acknowledge before diving in: "Last session was X days ago — [brief summary]. Still working on this, or starting fresh?"
3. Resume work from context — don't ask what we were doing (unless stale)

#### Recognizing User Phrases

| Phrase | Action |
|--------|--------|
| "continue" / "pick up where we left off" | Read session.md, resume |
| "fresh start" / "new task" / "clear session" | Archive current as Paused (if incomplete), clear session.md |
| "show history" / "what have we worked on" | Read session_history.md, summarize |
| "resume [topic]" | Search history for topic, restore context to session.md |
| "archive this" / "pause this" | Move current task to history as Paused |

#### Updating session.md — Events

| Event | Action |
|-------|--------|
| New task starts | If current task incomplete → archive as Paused. Then clear and write fresh context |
| Same task continues | Update status, add files touched, refine context |
| Task completes | Mark Complete, add to Recent, add to history |
| Task abandoned/paused | Mark Paused, archive to history with note of progress |

#### Mandatory Update Triggers

Update session.md **immediately** after:
- Modifying any file
- Completing a sub-task or milestone
- Making a key decision
- Before any "waiting for user input" state
- When context would be hard to reconstruct

This is mechanical, not judgment-based. When in doubt, update.

#### session.md Structure

```markdown
# Session State
> I update this automatically as we work. Say "continue" to resume.

## Active Task
[One-line description]

## Status
[In Progress / Paused / Complete] — [Brief status note]

## Context
- [Key point needed to resume]

## Rationale
- [Decision: why this approach over alternative]

## Files This Session
- `path/to/file` — [what changed]

## Next Steps
1. [Next action]

## Blockers
[Any blockers, or "None"]

## Gotchas
- [What failed and why — non-obvious learnings only]

## Recent
- [Newest completed task] — [brief outcome]

---
*Updated: YYYY-MM-DD ~HH:MM*
```

**Section notes:**
- **Recent:** Newest first. Max 3 entries. 4th pushes oldest to session_history.md.
- **Rationale:** Task-scoped. Capture constraint-driven or non-obvious decisions. Omit if empty.
- **Gotchas:** Session-scoped (persists across task changes). Promote generalizable ones to domain CLAUDE.md. Omit if empty.

### Safety Rails

#### Secrets Management
- Never commit credentials; always use `!secret` tags
- API keys in secrets.yaml only (OpenAI, Anthropic, WhatsApp, etc.)

#### File Modification Rules
- **Safe:** packages/, automations.yaml, scripts.yaml, pyscript/, themes/
- **Caution:** configuration.yaml, frigate.yml
- **Never:** custom_components/, secrets.yaml, .storage/, *.db*

#### Comment Formatting Standard

Preserve decorative comment boxes when editing:
```yaml
# ╭────────────────────╮
# │   SECTION NAME
# ╰────────────────────╯
```

### Naming Conventions

- **Lights:** `light.<location>_<descriptor>`
- **Presence:** `binary_sensor.presence_<area>`
- **Doors:** `binary_sensor.door_<location>`
- **Cameras:** `camera.c<NN>` (C01–C13)
- **WhatsApp:** `input_*.whatsapp_c_<feature>`
- **Person prefixes:** C = Cam, E = Enhy

### Domain Documentation

Domain rules auto-load via `.claude/rules/` when touching files in these paths. All 14 package domains have `CLAUDE.md` at `packages/<domain>/CLAUDE.md`, auto-triggered on `packages/<domain>/**`:

> ai, communication, dashboard, device, health, lights, network, occupancy, server, shopping, time, travel, weather, work

**UI/Design System:** `www/base/docs/CLAUDE.md` — triggers on `www/base/**`, `www/cards/**`

For discussions outside these paths, read the relevant CLAUDE.md manually.

---

## TODOs & Gaps

- **281 unavailable entities** (9.1% of runtime) — trend: 979→751→152→251→173→**281** (regressed)
- **Floor 01 raw sensor coupling** — bypasses occupancy abstraction, fragile to sensor renames
- **Health domain duplicate sensors** — `health.yaml` and `weight.yaml` define overlapping sensors; last-loaded wins
- ~~**Health domain division-by-zero**~~ — resolved 2026-03-05: availability guards added
- ~~**No startup recovery on Floor 01**~~ — resolved 2026-03-05: both floors now have startup triggers
- **Confidence tier unconsumed** — 6-level presence scoring, zero automation readers
- **Room transition events fire into void** — `floor02_travel_tracking.yaml` events have no listeners
- **Mixed automation alias styles** — ~55% compliant with naming convention
- **Dashboard JS residual rgba()** — 73.7% var-vs-rgba token adoption (stable)
- **tesco_sensors.yaml misnomer** — actually tracks Sainsbury's Local, not Tesco
- **No automated test suite** — validation is manual (HA logs, traces, template tester)

---

## Changelog

| Date | Commit | Change |
|------|--------|--------|
| 2026-03-25 | — | Full metrics sweep: HA 2026.2.3→2026.3.4, entities 2,943→3,098, unavailable 173→281, ARCHITECTURE.md v10.0→v10.4, token adoption 73.6%→73.7%, www/base 15→16 JS files, .storage ~29→~32 MB, prompt-manager file count 8→9 (highlight.js module added) |
| 2026-02-24 | `b350903` | Restructured to 8-section format; added Structure, Key Components, Development Workflows, TODOs & Gaps sections; preserved session continuity protocol, safety rails, and quick reference |
| 2026-02-22 | — | Previous version: pruned operational guide (~189 lines) |

---

*Last Updated: 2026-03-25*
