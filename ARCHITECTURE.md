# | START: ARCHITECTURE.md
# |  PATH: /config/ARCHITECTURE.md


<!-- ARCH:HEADER:START -->
**Document Version:** 10.5
**Last Updated:** 2026-04-08
**Home Assistant Version:** 2026.4.1 | OS 17.2 | Supervisor 2026.03.3

This is a mature, intentionally architected Home Assistant configuration for a two-person household. Scale, abstraction, and layering are deliberate design choices. The system contains ~2,985 runtime entities (154 unavailable, 5.2%), ~341,457 lines of configuration, a token-driven UI design system, and AI-powered WhatsApp integration across 14 package domains.
<!-- ARCH:HEADER:END -->

---

## Table of Contents

1. [Directory Structure](#1-directory-structure)
2. [Naming Conventions](#2-naming-conventions)
3. [Major Subsystems](#3-major-subsystems)
4. [Architectural Decisions](#4-architectural-decisions)
5. [Coupling Hotspots](#5-coupling-hotspots)
6. [Data Flow and Key Relationships](#6-data-flow-and-key-relationships)
7. [Recovery Characteristics](#7-recovery-characteristics)
8. [Integration Inventory](#8-integration-inventory)
9. [Technical Debt and Legacy](#9-technical-debt-and-legacy)
10. [UI Design System Summary](#10-ui-design-system-summary)
11. [AI Assistant Context](#11-ai-assistant-context)
12. [Document Maintenance](#12-document-maintenance)

---

## 1. Directory Structure

```
/config/                               # Home Assistant config root
├── configuration.yaml                 # Core configuration (155 lines)
├── automations.yaml                   # Root automations (~35 top-level, 2,533 lines)
├── scripts.yaml                       # All scripts (3,967 lines)
├── scenes.yaml                        # Scene definitions (148 lines)
├── secrets.yaml                       # Sensitive credentials (gitignored)
│
<!-- ARCH:PACKAGES:START -->
├── packages/                          # PRIMARY EDIT LOCATION (62 files, 11,092 lines)
<!-- ARCH:PACKAGES:END -->
│   ├── ai/                            # AI integrations (8 files)
│   │   ├── CLAUDE.md                  # Domain context
│   │   ├── ai_main.yaml, ai_system_prompts.yaml, alexa.yaml
│   │   ├── generate_images.yaml, generate_text.yaml
│   │   ├── prompt_manager.yaml, rota_upload.yaml
│   │   └── claude_bridge.yaml         # Claude ↔ HA bidirectional text channel
│   │
│   ├── communication/                 # Messaging (6 files)
│   │   ├── CLAUDE.md                  # Domain context
│   │   ├── whatsapp_config.yaml       # Core WhatsApp, contact mapping
│   │   ├── c_whatsapp_auto_reply.yaml, whatsapp_e.yaml
│   │   ├── transcript_pipeline.yaml   # Plaud transcript fetcher via IMAP
│   │   └── alerts.yaml, activity_alerts.yaml
│   │
│   ├── dashboard/                     # Report viewer backend
│   │   ├── CLAUDE.md                  # Domain context
│   │   └── report_viewer.yaml         # Index + content sensors for docs/reports/
│   │
│   ├── device/                        # Device configs (9 files)
│   │   ├── CLAUDE.md                  # Domain context
│   │   └── cameras, curtains, driveway_detection, govee, mobile_device,
│   │       pc, pet_devices, phone_control, sonos
│   │
│   ├── health/                        # Body composition metrics
│   │   ├── CLAUDE.md                  # Domain context
│   │   └── health.yaml, weight.yaml
│   │
│   ├── lights/                        # Lighting automation (5 files)
│   │   ├── CLAUDE.md                  # Domain context - CRITICAL: Floor 01 coupling
│   │   ├── lights.yaml                # Floor 01 & 02 with manual override
│   │   ├── lights2.yaml, lights_bedroom.yaml, lights_office.yaml
│   │   └── auto_lights.yaml           # Timer and boolean definitions
│   │
│   ├── network/                       # Network scanning
│   │   ├── CLAUDE.md                  # Domain context
│   │   └── ip_and_mac_address_mapping.yaml
│   │
│   ├── occupancy/                     # Presence detection (6 files)
│   │   ├── CLAUDE.md                  # Domain context - YAML anchor patterns
│   │   ├── presence_detection.yaml    # Core system with &presence_area_base
│   │   ├── doors.yaml                 # Unified door sensors
│   │   ├── bed_state.yaml             # Sleep context detection
│   │   └── presence_desks.yaml, floor02_travel_tracking.yaml,
│   │       presence_activity_card.yaml
│   │
│   ├── server/                        # Server & frontend (13 files)
│   │   ├── CLAUDE.md                  # Domain context
│   │   ├── dir_tree.yaml, github_sync.yaml
│   │   ├── ha_snapshot_sensor.yaml    # Pre-formatted HA snapshot for prompt manager inject
│   │   └── frontend/                  # 11 files: camera views, stats, themes, TTS, etc.
│   │
│   ├── shopping/                      # Shopping list, store busyness
│   │   ├── CLAUDE.md                  # Domain context
│   │   └── shopping_list.yaml, tesco_sensors.yaml
│   │
│   ├── time/                          # Alarms, timers, hourly triggers (4 files)
│   │   ├── CLAUDE.md                  # Domain context
│   │   └── alarm_time.yaml, calendar_frontend_add_event.yaml,
│   │       hourly_triggers.yaml, time.yaml
│   │
│   ├── travel/                        # Location tracking, ETA
│   │   ├── CLAUDE.md                  # Domain context
│   │   └── map.yaml, railway.yaml
│   │
│   ├── weather/                       # Pirate Weather, AI clothing suggestion
│   │   ├── CLAUDE.md                  # Domain context
│   │   └── frontend_weather.yaml
│   │
│   └── work/                          # Meeting action extraction
│       ├── CLAUDE.md                  # Domain context
│       └── work.yaml, work_actions_card.yaml
│
<!-- ARCH:COMPONENTS:START -->
├── custom_components/                 # 28 custom integrations
<!-- ARCH:COMPONENTS:END -->
│   ├── ha_text_ai/                    # AI text generation
│   ├── whatsapp/, whatsapp_chat/      # WhatsApp integration
│   ├── frigate/                       # Camera NVR
│   ├── alexa_media/, pyscript/, browser_mod/
│   └── [29 more...]
│
├── www/                               # Web-accessible static files
<!-- ARCH:WWW_BASE:START -->
│   ├── base/                          # Shared UI foundation (17 files, 12,261 lines)
<!-- ARCH:WWW_BASE:END -->
│   │   ├── docs/                      # UI documentation
│   │   │   └── CLAUDE.md              # Token governance - READ-ONLY rules
│   │   ├── foundation.js              # Design tokens — READ-ONLY
│   │   ├── components.js              # Reusable components
│   │   └── [checkboxes, helpers, modals, radios, screen-border,
│   │        skeletons, templates, templates.test, toasts, toggles,
│   │        tooltips, utilities]
<!-- ARCH:WWW_CARDS:START -->
│   ├── cards/                         # Custom card implementations (34 JS files, 23,885 lines)
<!-- ARCH:WWW_CARDS:END -->
│   │   ├── prompt-manager/            # Prompt Manager card (modular, 9 files)
│   │   ├── presence-activity-card/    # Presence card (modular, 3 files)
│   │   ├── report-viewer-card/        # Report viewer card (2 files)
│   │   ├── ui-catalogue-card/         # UI component catalogue (7 files)
│   │   ├── checklist-card/            # Checklist card (1 file)
│   │   ├── pico-hid-card/             # Pico keyboard emulator card (1 file)
│   │   ├── work-actions-card/         # Work actions card (1 file)
│   │   └── [specs-card, specs-card-tabbed, phone-card, ui-circle-slider]
│   └── whatsapp_histories/            # Chat history storage
│
<!-- ARCH:PYSCRIPT:START -->
├── pyscript/                          # Python automation (14 files, 3,297 lines)
<!-- ARCH:PYSCRIPT:END -->
│   └── action_extraction_pipeline.py, dad_car_detection.py,
│       save_uploaded_file.py, log_errors.py, recorder_stats.py,
│       system_context.py, theme_sync.py, save_rota_image.py,
│       dump_log_breakdown.py,
│       calendar ops (3 files: cleanup, delete batch, delete single)
│
<!-- ARCH:THEMES:START -->
├── themes/                            # Theme files (4,563 lines)
<!-- ARCH:THEMES:END -->
│   └── material_you/ (active default), catppuccin/, visionos/, olympus (legacy)
│
├── docs/                              # Reports and reference documentation
│   ├── reports/                       # Generated analysis reports
│   │   ├── config-intel/              # Configuration intelligence reports
│   │   ├── failure-mode/              # Failure mode analysis
│   │   ├── meta-insights/             # Unused capability analysis
│   │   ├── shared-ui-audit/           # UI system audits
│   │   ├── components-review/         # Component review data
│   │   └── project-audit/             # Project-wide audit reports
│   └── reference/                     # Domain reference docs
│       ├── dad_car_detection/         # Driveway detection documentation
│       └── whatsapp/                  # WhatsApp setup & technical reference
│
├── .storage/                          # HA internal storage
│   ├── lovelace.dashboard_home        # Primary dashboard (5.4 MB)
│   ├── lovelace                       # Default dashboard (6.4 MB)
│   ├── lovelace.dashboard_tester      # Development dashboard (351 KB)
│   └── [11 more lovelace files: test/dev dashboards, echo_show, map,
│        developer_tools, playground_archive, resources, registries]
│
├── .claude/                           # AI assistant session management
│   ├── session.md, session_history.md
│   └── rules/                        # Auto-loading domain rules
│
├── ARCHITECTURE.md                    # This document
├── CLAUDE.md                          # Root AI assistant instructions
└── frigate.yml                        # Frigate NVR configuration
```

**Metric sources:** Sections between sentinel markers (`<!-- ARCH:*:START/END -->`) are auto-generated from live sensor data at each git sync. Other counts in this document are point-in-time observations from the date noted.

---

## 2. Naming Conventions

| Entity Type | Pattern | Examples |
|-------------|---------|----------|
| Lights | `light.<location>_<descriptor>` | `light.floor_02`, `light.bedroom` |
| Area presence | `binary_sensor.presence_<area>` | `presence_bedroom`, `presence_floor_02` |
| Desk presence | `binary_sensor.desk_<location>_presence` | `desk_office_presence` |
| Unified doors | `binary_sensor.door_<location>` | `door_house`, `door_office` |
| Cameras | `camera.c<NN>` | `camera.c01` through `camera.c13` |
| Camera helpers | `input_*.<c><NN>_<setting>` | `input_select.c01_day_night_mode` |
| Camera sliders | `input_number.c<NN>_image_<property>` | `c07_image_brightness` |
| WhatsApp helpers | `input_*.whatsapp_c_<feature>` | `whatsapp_c_message_to_send` |
| AI helpers | `input_*.ai_<feature>` | `ai_image_prompt`, `ai_temperature` |
| Automations | `<Domain> - <Feature>` or `<Domain> • <Feature>` | Mixed patterns (~55% compliant) |
| Scripts | `<device>_<action>_<target>` | Snake_case |
| Server stats | `sensor.<descriptive_name>` | `sensor.uptime_formatted` |
| Location sensors | `sensor.location_<person>_phone` | `sensor.location_cam_phone` |
| Health sensors | `sensor.withings_<person>_<metric>` | `sensor.withings_c_weight` |
| Phone volumes | `input_number.phone_<c\|e>_volume_<stream>` | `phone_c_volume_ringer` |

**Area IDs:** `bedroom_2`, `office`, `2nd_floor`, `1st_floor`, `ground_floor`
**Phone format:** `447XXXXXXXXX@s.whatsapp.net` (no leading +)
**Person prefixes:** C = Cam, E = Enhy (consistent across mobile_device, phone_control, pc)

---

## 3. Major Subsystems

### Presence Detection
**Status:** Mature
**Key files:** `/config/packages/occupancy/presence_detection.yaml`, `doors.yaml`, `bed_state.yaml`
**Architecture:** Two-tiered model — steady sensors (motion/occupancy from FP2) and edge sensors (doors). YAML anchor `&presence_area_base` provides DRY instantiation across all areas. Template sensors aggregate raw signals into unified presence per area with attributes: `lux`, `contributing_sensors`, `active_sensors`, `last_movement`, `confidence_tier` (6 levels: absent → reinforced). Default edge_hold: 30s (high-traffic: 15s). Auto-exclusion of raw sensors via `contributing_raw_sensors` attribute prevents double-counting. Uses `area_entities()` scoping within `expand()` calls for maintainability over hardcoded lists (~17 `expand()` calls remain, scoped via `area_entities()`).
**Rationale:** YAML anchor pattern documented in `/config/packages/occupancy/CLAUDE.md` as deliberate DRY abstraction.

### Lighting Automation
**Status:** Active development
**Key files:** `/config/packages/lights/lights.yaml`, `lights_office.yaml`, `auto_lights.yaml`
**Architecture:** Per-floor automations with manual override detection via `timer.light_override` (2 min base, 5 min extended). First-on-only brightness logic prevents mid-session brightness jumps. Time-based brightness: 10% during 01:00-07:00, 100% otherwise. Quiet hours activity filter on Floor 01 requires corroborating evidence from other sensors during 00:00-07:00 (uses `namespace()` pattern for Jinja2 loop state propagation). Floor 02 uses dual darkness detection: sun elevation (primary) + lux < 50 (fallback for gloomy days). Both floors have startup recovery (`homeassistant` start trigger). Absence timeouts: Floor 01 2 min, Floor 02 10 sec, Bedroom/Office no auto-off (UI control only).
**Rationale:** First-on-only and override timer documented in `/config/packages/lights/CLAUDE.md`.

### Door Monitoring
**Status:** Mature
**Key files:** `/config/packages/occupancy/doors.yaml`
**Architecture:** Unified door sensors combining contact + vibration fallback. `binary_sensor.door_*` are template sensors, not raw devices. Exposes `contributing_raw_sensors` attribute.
**Rationale:** Documented in `/config/packages/occupancy/CLAUDE.md`.

### WhatsApp/Communication
**Status:** Mature
**Key files:** `/config/packages/communication/whatsapp_config.yaml`, `c_whatsapp_auto_reply.yaml`, `whatsapp_e.yaml`, `transcript_pipeline.yaml`
**Architecture:** Contact mapping via `sensor.whatsapp_contacts_config` attributes (3 maps: `contacts_by_name`, `phone_to_name`, `full_name_to_name`). AI reply generation via `ha_text_ai.generate_text`. Message history stored as files in `/config/www/whatsapp_histories/`. Dual client isolation: clientId "c" and "e" are separate integrations. Transcript pipeline fetches Plaud transcripts via IMAP and writes to two todo lists (`todo.meeting_summaries` and `todo.meeting_transcripts`) with 7-day expiry. Message filtering required: exclude `status@broadcast` (WhatsApp stories) and `@g.us` (group chats). Unread state is dual: both `input_number` AND `input_boolean` must be cleared together.
**Rationale:** Documented in `/config/packages/communication/CLAUDE.md`.

### AI Text Generation
**Status:** Mature
**Key files:** `/config/packages/ai/generate_text.yaml`, `ai_system_prompts.yaml`, `prompt_manager.yaml`
**Architecture:** Multi-provider support via `ha_text_ai`. System prompts stored as sensor attributes (bypasses input_text 255 char limit). Event-driven prompt management: `prompt_ai_request` → `prompt_ai_response`. Image generation via DALL-E with local gallery (weekly cleanup, 30-day retention, max 50 entries). Alexa TTS requires SSML `<speak>` wrapping.
**Rationale:** Sensor attribute pattern documented in `/config/packages/ai/CLAUDE.md`.

### Claude Bridge
**Status:** Stable
**Key files:** `/config/packages/ai/claude_bridge.yaml`
**Architecture:** Bidirectional text channel between Claude (via MCP `todo` intents) and HA automations/scripts. Write path: Claude calls `HassListAddItem` on `todo.claude_bridge` → relay automation timestamps the payload and copies to `input_text.claude_bridge_payload` (~244 usable chars after timestamp prefix); todo item cleared after relay. Read path: HA scripts write to `todo.claude_bridge_response` (summary + description field); Claude reads via `todo_get_items` (no practical size limit on description).
**Rationale:** Enables Claude to trigger HA automations from conversation, and for HA to surface structured data back without a persistent webhook or polling loop.

### Prompt Manager Card
**Status:** Active development
**Key files:** `/config/www/cards/prompt-manager/prompt-manager.js` (entry), `/config/www/cards/prompt-manager/modules/` (8 modules), `/config/packages/server/ha_snapshot_sensor.yaml`
**Architecture:** Modular web component split into render, events, styles, constants, scoring, data, variables, highlight. Flat score-sorted grid (no tier groupings). Adopts shared UI system via `adoptedStyleSheets`. Data persisted via `prompt_manager` custom component (WebSocket commands `prompt_manager/get_prompts` / `prompt_manager/set_prompts`) with `localStorage` fallback. Fill-modal inject button reads `sensor.ha_server_snapshot.snapshot` attribute (from `/config/packages/server/ha_snapshot_sensor.yaml`) to inject HA system context into prompt templates.
**Rationale:** Documented in `/config/www/cards/prompt-manager/CLAUDE.md`.

### Camera/Frigate
**Status:** Stable
**Key files:** `/config/packages/device/cameras.yaml`, `frigate.yml`
**Architecture:** Object detection via Frigate NVR. Day/night mode switching based on `sun.sun` (managed in `hourly_triggers.yaml` for C09). WebRTC for low-latency streams. Camera view mirror logic in `frontend/advanced_camera_card_backend.yaml`.
**Rationale:** Documented in `/config/packages/device/CLAUDE.md`.

### Device Management
**Status:** Stable
**Key files:** `/config/packages/device/curtains.yaml`, `pc.yaml`, `pet_devices.yaml`, `driveway_detection.yaml`
**Architecture:** Cover morning phased open (`15% → 45% → 95%`) with vacancy guards, sun elevation gates, holiday awareness, abort triggers. Cover evening close at sun elevation < -4°, night safety check on person departure after dark. PC session state machine (off/locked/unlocked) via HASS.Agent heartbeat (150s grace period). Driveway car detection via pyscript CV with OpenAI Vision fallback. Pet water fountain hourly polling workaround (welfare-critical). Cover position clamped to 1-95% (never fully open/closed to protect mechanism).
**Rationale:** Documented in `/config/packages/device/CLAUDE.md`.

### UI Design System
**Status:** Active development
**Key files:** `/config/www/base/foundation.js`, `components.js`, `docs/spec.md`
**Architecture:** Token-driven design with governance-controlled tokens. All values derive from `foundation.js`. Strict governance: foundation.js is READ-ONLY. 16 JS files in `/config/www/base/` providing components, tooltips, modals, toggles, toasts, checkboxes, radios, drawer, utilities, templates, helpers, skeletons, screen-border. Priority hierarchy: safety/accessibility → immutable geometry → token adherence → state model → theme equality → user instruction. Number-input component added 2026-03-23 (`<ui-number-input>`, spec at `docs/componentry/number-input.md`).
**Rationale:** Documented in `/config/www/base/docs/CLAUDE.md`.

### Server Statistics
**Status:** Stable
**Key files:** `/config/packages/server/frontend/frontend_server_stats.yaml`
**Architecture:** Comprehensive server introspection via command_line sensors: Supervisor API queries, MQTT broker stats, filesystem scanning, entity/domain counts, dashboard complexity scoring. Only works on Home Assistant OS with Supervisor. Scan intervals vary: 60s (Docker) to 86400s (install info). Command timeouts 15-90s.
**Rationale:** Documented in `/config/packages/server/CLAUDE.md`.

### Weather & Clothing Suggestions
**Status:** Stable
**Key files:** `/config/packages/weather/frontend_weather.yaml`
**Architecture:** Pirate Weather hourly + 7-day forecast arrays stored in sensor attributes. AI clothing recommendation generated hourly via `ha_text_ai.ask_question` (5-min startup delay). Human-readable categorisation sensors (temperature/wind/precipitation).
**Rationale:** Documented in `/config/packages/weather/CLAUDE.md`.

### Meeting Action Extraction
**Status:** Active (deployed 2026-03-11)
**Key files:** `/config/packages/work/work.yaml`, `/config/pyscript/action_extraction_pipeline.py`
**Architecture:** Five-phase pipeline triggered by state changes on `todo.meeting_summaries`. Phase 1: snapshot-diff identifies unprocessed summaries via idempotency ledger (`todo.action_pipeline_ledger`) with two-phase lease (processing → complete, 300s TTL). Phase 2: deterministic extraction of `## My Actions` section with `| date` delimiter parsing and intra-summary dedup. Phase 3: fetch existing items from `todo.work_actions` (active + completed within 90 days). Phase 4: AI classification via `ai_task.generate_data` — each candidate gets a verdict: NEW, PROGRESSION, or DUPLICATE. Phase 5: write NEW items, update PROGRESSION items (with manual edit protection via SHA-256 hash), skip DUPLICATEs. Trigger automation uses `mode: single` for concurrency control. Safety bias: uncertain classifications default to NEW. Only error notifications are persistent; success events go to `log.info`. Dashboard display via work-actions-card (see below).
**Rationale:** Documented in `/config/packages/work/CLAUDE.md` and `/config/tmp/action-extraction-plan-v2.1-final.md`.

### Work Actions Card
**Status:** Active development
**Key files:** `/config/www/cards/work-actions-card/work-actions-card.js`, `/config/packages/work/work_actions_card.yaml`
**Architecture:** Single-file Web Component displaying `todo.work_actions` as an animated checklist. Patch-based diffing (no full re-renders). Optimistic toggle with fire-and-forget service calls and catch-based rollback. FLIP and entry/exit animations for layout transitions. Three interaction modes: single tap (toggle), double-tap (edit modal), hover/long-press (rich tooltip with meeting summary action). PM-style dropdown menu for sort (newest/urgency/active), completed filter, hover tooltip toggle, and height/expiry settings modal. New item indicators (pink dot, localStorage, configurable auto-expire). Meeting summary drawer fetches from `todo.meeting_summaries` on demand. Edit modal modifies item title and due date via `todo.update_item` — preserves pipeline description metadata (manual edit protection handles hash mismatch safely). Five HA input helpers for persistent settings.
**Rationale:** Documented in `/config/www/cards/work-actions-card/CLAUDE.md`.

### Report Viewer
**Status:** Stable (added 2026-02-12)
**Key files:** `/config/packages/dashboard/report_viewer.yaml`, `/config/www/cards/report-viewer-card/`
**Architecture:** Command-line sensors that index `docs/reports/` subdirectories and preload the latest markdown report per category as sensor attributes (10-40KB per report). The `report-viewer-card` custom card reads these sensors for instant tab switching. Categories are discovered dynamically — adding a new report type just requires creating a folder. Hourly refresh. Report content excluded from recorder to avoid database bloat (critical — without this, 10-40KB per sensor writes to DB every hour).

---

## 4. Architectural Decisions

Non-obvious choices that affect how work should be done. Each decision classified by evidence level.

| Decision | Rationale | Evidence | Classification |
|----------|-----------|----------|----------------|
| **Floor 01 uses raw FP2 sensors, Floor 02 uses presence abstraction** | Unknown — both approaches exist without documented reason for difference | `/config/packages/lights/CLAUDE.md:43-49` warns about coupling | **Undocumented** |
| **Automations split between root file and packages** | Historical organisation, both merged at runtime | `CLAUDE.md` notes both locations | **Documented** |
| **Dashboard JS coexists with token system** | Dashboard JS has majority token adoption alongside residual rgba()/hex. Two paradigms converging but not yet unified | Intel Reports track var-vs-rgba metric (73.7% as of Mar 15) | **Documented convergence** |
| **Presence uses YAML anchors for area instantiation** | DRY pattern — structural changes ripple automatically to all areas | `/config/packages/occupancy/CLAUDE.md` | **Documented** |
| **Manual override via timer with restore:true** | Persist override across HA restarts, 2-min base / 5-min extended | `/config/packages/lights/auto_lights.yaml:12-16` | **Documented** |
| **Contact mapping in sensor attributes** | Centralised source of truth for all WhatsApp routing (3 lookup maps) | `/config/packages/communication/CLAUDE.md` | **Documented** |
| **System prompts in sensor attributes** | Bypass input_text 255 char limit | `/config/packages/ai/CLAUDE.md` | **Documented** |
| **Report content in sensor attributes** | Bypass state 255-char cap; 10-40KB per report; recorder exclusion critical | `/config/packages/dashboard/CLAUDE.md` | **Documented** |
| **foundation.js is READ-ONLY** | Prevent token drift, enforce governance | `/config/www/base/docs/CLAUDE.md` | **Documented** |
| **Startup recovery on both floors** | Restore correct light state after HA restart | Both floors have `homeassistant` start trigger | **Documented** |
| **First-on-only brightness rule** | Prevent mid-session brightness jumps from automation | `/config/packages/lights/CLAUDE.md` | **Documented** |
| **Pet water fountain hourly polling** | Hardware doesn't push state; polling workaround is welfare-critical | `/config/packages/device/CLAUDE.md` | **Documented** |
| **Cover position clamped 1-95%** | Never fully open/closed to protect physical mechanism | `/config/packages/device/CLAUDE.md` | **Documented** |
| **WhatsApp dual-client isolation** | clientId "c" and "e" are separate integrations, must never mix | `/config/packages/communication/CLAUDE.md` | **Documented** |
| **PC session state never returns unknown** | 150-second heartbeat with 3-sensor consensus falls back to "off" | `/config/packages/device/CLAUDE.md` | **Documented** |
| **Door → Presence uses raw contact sensors** | `presence_detection.yaml` references raw contact/vibration sensors, not unified `binary_sensor.door_*` entities | Data flow verification | **Undocumented implementation detail** |
| **Dynamic report category discovery** | Adding a report type only requires creating a subdirectory under `docs/reports/` | `/config/packages/dashboard/CLAUDE.md` | **Documented** |
| **Shopping list text sanitisation** | Regex filter, whitespace normalisation, case normalisation, min 3 chars | `/config/packages/shopping/CLAUDE.md` | **Documented** |
| **Travel stale location detection** | Returns "Lost" if sensor is unknown/unavailable OR same coords + >5 min stale | `/config/packages/travel/CLAUDE.md` | **Documented** |
| **Work pipeline mode: single** | Prevents concurrency; sole automation targeting `todo.meeting_summaries` — adding second automation causes silent race conditions | `/config/packages/work/CLAUDE.md` | **Documented** |
| **Action extraction safety bias** | Uncertain AI classifications default to NEW (missed action is worse than false duplicate) | `/config/packages/work/CLAUDE.md` | **Documented** |

**Classification key:**
- **Documented** — Rationale explicitly stated in code comments or CLAUDE.md
- **Undocumented** — Decision exists but reasoning never recorded
- **Undocumented gap** — Absence of expected pattern, no stated reason
- **Documented convergence** — Active migration in progress

---

## 5. Coupling Hotspots

Consolidated from domain CLAUDE.md files, Intel Report (2026-03-15), and Failure Mode Report (2026-03-06).

### High-Impact Dependencies

| Entity | Dependents | Failure Impact |
|--------|------------|----------------|
| `binary_sensor.presence_floor_02` | Floor 02 lighting, TTS Activity Alerts | Stair lights fail (safety-critical) |
| `binary_sensor.presence_bedroom` | bed_state, office light timing | Sleep context wrong |
| `sun.sun` | All lighting, curtain automations | Total darkness detection loss |
| `media_player.sonos_speaker` | TTS, scripts | Voice announcements fail |
| `timer.light_override` | Floor 01 auto-lighting (8 refs) | Auto-lights suspended |
| `notify.mobile_app_phone_c` | Primary mobile notification service (18 refs in packages) | All mobile notifications fail |
| `sensor.whatsapp_contacts_config` | All WhatsApp routing (~15 refs) | Contact resolution fails; incoming messages dropped |
| `ha_text_ai` integration | Translation, chat autoreply, weather summary, prompt manager | AI features fail across multiple domains |
| `tts.openai_gpt_4o_mini_tts` | TTS Activity Alerts, weather TTS, scripts | All TTS announcements fail |
| `input_boolean.floor01_auto_active` | Floor 01 lighting control hub (8 refs) | Floor 01 auto-lights non-functional |
| `person.cam` | Presence automations, covers, notifications | Person-specific automation fails |
| `switch.sonoff_zbminil2_switch` | Floor 01 on/off control + state detection (9 refs) | Floor 01 lights completely uncontrollable |
| `calendar.united_kingdom_eng` | Cover holiday detection, weekday alarm skip | Used by device and time domains |
| `todo.meeting_summaries` | Action extraction pipeline trigger | Pipeline won't process new actions |
| `ai_task.openai_ai_task` | Action classification (work domain) | Action extraction falls back to NEW-all |

### Structural Coupling

| Source | Affects | Coupling Type | Warning |
|--------|---------|---------------|---------|
| `&presence_area_base` anchor | All area presence sensors | Template dependency | Anchor changes ripple to bedroom, office, all floors |
| FP2 raw sensors in Floor 01 | `/config/packages/lights/lights.yaml` | Entity reference | Bypasses abstraction — rename breaks silently |
| `foundation.js` tokens | All www/base components (16 files) | File dependency | Token changes require component verification |
| Tooltip dark mode values | `tooltips.js:605-623` | File dependency | Must manually sync with foundation.js |
| FP2 raw sensors in covers | Bedroom + office vacancy check | Entity reference | `/config/packages/device/CLAUDE.md` documents specific sensor IDs |
| Alexa device list (21 sensors) | `alarm_or_timer_active` binary sensor | Entity reference | Adding/removing Echo requires sensor list update |
| `docs/reports/` directory structure | Report viewer sensors + card | File dependency | Categories = subdirectories; requires Python3 in container |
| `map.yaml` state access (3 calls) | Travel template sensors | Template dependency | Unguarded `states[variable]` — entity unavailability causes `AttributeError` |

### Before Modifying

| If modifying... | Check first... |
|-----------------|----------------|
| Presence detection | `packages/occupancy/CLAUDE.md`; lights, activity alerts, cover vacancy checks |
| Lighting automation | Both `packages/lights/` AND `automations.yaml`; timer dependencies |
| WhatsApp | `packages/communication/CLAUDE.md`; contact mapping, client isolation |
| FP2 entity names | Floor 01 lighting (raw refs) AND cover vacancy checks |
| UI tokens / components | `www/base/docs/CLAUDE.md`; `tooltips.js` dark mode sync |
| YAML anchor `&presence_area_base` | All area presence sensors (ripple effect) |
| Dashboard cards | `.storage/lovelace.*` (JSON format) |
| Covers | Vacancy check sensor IDs, sun elevation gates, calendar dependency |
| Echo devices | `alarm_or_timer_active` sensor list in `alarm_time.yaml` |
| Camera view selectors | Both `server/frontend/advanced_camera_card_backend.yaml` AND `device/cameras.yaml` (options differ) |
| ICS calendar files | Pyscript calendar ops use backup + atomic write |
| Health sensors | Both `health.yaml` AND `weight.yaml` (duplicate definitions exist) |
| Shopping list sanitisation | `packages/shopping/CLAUDE.md` for regex and normalisation rules |
| Action pipeline | `packages/work/CLAUDE.md`; ledger entity, AI entity, pyscript file |
| Travel template sensors | `map.yaml` has 3 unguarded `states[variable]` calls at lines 63, 88, 125 |

---

## 6. Data Flow and Key Relationships

### Presence → Lighting
```
FP2/motion sensors → binary_sensor.presence_* (template aggregation)
  → packages/lights/*.yaml (trigger on state change)
  → light.* (turn_on/turn_off)
  ↳ timer.light_override gates automation (if active, suppressed)
  ↳ sun.sun / lux gates darkness detection
```

### Door → Presence
```
Contact + Vibration sensors → binary_sensor.door_* (unified template)
  → Presence edge_hold extended (30s default, 15s high-traffic)
  → binary_sensor.presence_* updated
  Note: Implementation uses raw contact/vibration sensors, not unified door entities
```

### WhatsApp Inbound
```
whatsapp_message event → Filter (exclude broadcasts, groups)
  → Contact lookup (phone_to_name → full_name_to_name → fuzzy → unknown)
  → Update unread (count + boolean — BOTH must clear together)
  → Log to history → [Optional] AI generate reply options
```

### WhatsApp Outbound
```
input_text change → Translation check → Phone lookup
  → whatsapp.send_message (clientId-isolated) → Log → Clear unread
  ↳ No delivery confirmation — counters cleared before send (silent loss risk)
```

### Manual Override
```
Physical switch → automation detects unexpected state
  → timer.light_override.start (2 min, restore:true)
  → Auto-lights check timer.idle → suppressed until expiry
```

### Cover Morning Phase
```
Time trigger → script.cover_morning_phase
  → Vacancy check (room empty ≥5min via raw FP2 sensors)
  → Sun elevation gate (weekday ≥3°, weekend/holiday ≥6°)
  → Phased open: 15% → 45% → 95% (1-min dwell)
  ↳ Abort: presence detected, manual close, timeout
```

### Cover Evening/Night
```
Sun elevation < -4° → automation → close covers
Person departure after dark → night safety check → close if empty
```

### Camera Day/Night
```
sun.sun → hourly_triggers.yaml → C09 colour/BW mode switch
packages/device/cameras.yaml → input_select day_night_mode per camera
```

### AI Prompt Pipeline
```
UI component → prompt_ai_request event
  → automation → ai_task.generate_data
  → prompt_ai_response event → UI update
```

### Weather → Clothing Suggestion
```
Hourly trigger + HA start (5-min delay) → ha_text_ai.ask_question
  → Context: condition, temp, humidity, wind, clouds, 24h forecast
  → input_text.ai_weather_clothing_suggestion
```

### Claude Bridge (Bidirectional)
```
Write: claude.ai → HassListAddItem → todo.claude_bridge
  → relay automation → input_text.claude_bridge_payload (~244 chars)
Read: HA → todo.add_item → todo.claude_bridge_response
  → claude.ai reads via todo_get_items (label=summary, description=full payload)
```

### Transcript Pipeline
```
Plaud recording → auto-email → Gmail (fragment0044)
  → IMAP event (subject must contain [Plaud-AutoFlow])
  → fetch automation → www/transcripts/*.txt (descriptive slugified filenames)
  → sensor.transcript_latest (attributes: transcript, summary, filename, timestamp)
  → todo.meeting_summaries (lightweight, Claude reads first)
  → todo.meeting_transcripts (full text, Claude reads on demand)
  ↳ Paired by due_datetime; daily cleanup removes items >7 days old
```

### Meeting Action Extraction
```
todo.meeting_summaries state change → automation (5s debounce, mode: single)
  → pyscript.action_extraction_pipeline
  → Phase 1: snapshot-diff vs todo.action_pipeline_ledger (lease acquisition)
  → Phase 2: parse ## My Actions section (deterministic, | date split)
  → Phase 3: fetch todo.work_actions (active + completed ≤90 days)
  → Phase 4: ai_task.generate_data → NEW / PROGRESSION / DUPLICATE per candidate
  → Phase 5: write NEW items, update PROGRESSION (hash-checked), skip DUPLICATE
  → Ledger finalised (processing → complete), pruned after 14 days
```

---

## 7. Recovery Characteristics

Based on Failure Mode Report (2026-03-06), located at `docs/reports/failure-mode/FAILURE_MODE_REPORT_2026-03-06.md`.

| Subsystem | Failure Mode | Recovery | Classification |
|-----------|--------------|----------|----------------|
| Presence Detection | FP2 unavailable | Template re-evaluates on sensor reconnect | Partial self-heal |
| Floor 01 Lighting | Automation fails | Startup recovery + sun elevation gate | Partial self-heal |
| Floor 02 Lighting | Automation fails | Lux fallback for darkness detection + startup recovery | Partial self-heal |
| Office Lighting | Presence office unavailable | No startup trigger | **Manual-only** |
| Sleep Context | Group unavailable | Fallback (unknown = asleep in window) | Self-heal |
| TTS Alerts | Sonos unavailable | None | Manual-only |
| Timer Override | Timer stuck | Expiry (5 min max) + restore:true survives restart | Self-heal |
| WhatsApp Contacts | Sensor unavailable | None — all message processing halts | **Manual-only** |
| WhatsApp Delivery | Integration offline | Counters cleared before delivery; silent message loss | **None** |
| Claude Bridge | Todo service unavailable | None — no timeout or watchdog | Manual-only |
| Mobile Notifications | Service fails | None | Manual-only |
| Curtains | Calendar unavailable | Logs and continues | Self-heal |
| Sun detection | sun.sun unavailable | HA core recovery | Self-heal |
| Action Pipeline | Ledger lease stuck | 300s TTL auto-expires; failed entries need manual cleanup | Partial self-heal |

**System characteristic:** Bifurcated resilience. Occupancy and lighting have mature availability guards and startup recovery. Communication and AI subsystems exhibit cliff-edge failure — a single external service outage (ha_text_ai, WhatsApp, IMAP) causes silent degradation with no feedback to the user.

**Critical cascade path — WhatsApp contact hub (FM highest risk):**
```
sensor.whatsapp_contacts_config [unavailable]
  → whatsapp_config.yaml:607 [template read: from_json] — contact lookup returns None
    → whatsapp_config.yaml:648 [condition: contact is not none] — blocks normal path
      → whatsapp_config.yaml:678-682 [else branch] — STOP: incoming message dropped
    → whatsapp_config.yaml:705 [template: contacts[sender]] — KeyError
      → STOP: automation halts mid-execution
```

**Critical cascade path — Floor 02 lighting:**
```
binary_sensor.presence_sensor_fp2_* [unavailable]
  → binary_sensor.presence_floor_02
  → automation.auto_lights_floor_02
  → light.floor_02 [STOP: safety-critical stair lights fail]
```

**Temporal risks:** DST-sensitive comparisons use `now().hour` without timezone-aware guards in 9 locations across: quiet hours (lights), sleep window (bed_state), desk presence, earliest time (curtains), busyness calculation (tesco_sensors). Impact is low (2x/year) but failures are silent.

---

## 8. Integration Inventory

### Core (system depends on)

| Integration | Purpose | Failure Impact |
|-------------|---------|----------------|
| Zigbee (ZHA) | Sensors, lights, switches | Most automation fails |
| MQTT | Device communication (Mosquitto) | Frigate, sensors fail |
| Frigate | Camera object detection | Camera automation fails |
| ha_text_ai | AI text generation | Auto-replies, prompts, weather summary fail |
| WhatsApp | Messaging | Communication features fail |
| Mobile App | Notifications, presence | Notifications fail |

### Feature (significant functionality)

| Integration | Purpose | Failure Impact |
|-------------|---------|----------------|
| Alexa Media | TTS, voice control, alarm tracking | Voice announcements, alarm detection fail |
| pyscript | Python automation (12 files) | Custom scripts fail |
| browser_mod | Browser control, auto-refresh | Popups, page refresh fail |
| Aqara FP2 | Presence detection (3 units) | Presence automation degrades |
| Pirate Weather | Weather data, AI clothing suggestion | Weather cards, forecast fail |
| Withings | Body composition metrics (24 template sensors) | Health dashboard fails |
| Google Travel Time | ETA calculations | Travel display fails |
| Powercalc | Per-device power estimation (40+ virtual sensors) | Energy monitoring fails |
| Node-RED | Additional automations | Supplemental automation fails |
| OpenAI TTS | Voice synthesis | TTS announcements fail |
| Reolink | Camera hardware (5 cameras) | Camera feeds fail |

### Peripheral (nice-to-have)

| Integration | Purpose | Failure Impact |
|-------------|---------|----------------|
| Popular Times | Supermarket busyness tracking | Shopping status fails |
| Network Scanner | Device discovery, MAC mapping (63 devices) | Network monitoring fails |
| Lunar Phase | Moon phase data | Dashboard display fails |
| Battery Notes | Battery tracking | Battery alerts fail |
| Waste Collection | Bin collection schedule | Reminder fails |
| AI Automation Suggester | Automation suggestions | Suggestion feature fails |
| PetKit | Pet device monitoring | Pet fountain status fails |
| Places | Location name resolution | Location display degrades |

### Known Quirks

- **alexa_media**: Requires periodic re-authentication
- **whatsapp**: Custom component, may need manual updates
- **frigate**: Separate NVR process, external dependency
- **tooltips.js**: Dark mode values must manually sync with foundation.js
- **tesco_sensors.yaml**: Despite the filename, tracks Sainsbury's Local (not Tesco)
- **server stats sensors**: Only work on HA OS with Supervisor, fail silently on other installs

---

## 9. Technical Debt and Legacy

| Item | Type | Impact | Status |
|------|------|--------|--------|
| Unavailable entities (see Entity Counts for current) | Entity bloat | Registry bloat, broken refs | Active — trend (manual, as of 2026-03-25): 979→949→779→801→800→758→751→152→251→325→173→281 |
| Dashboard JS residual rgba() calls | Dual paradigm | Maintenance burden | **Converging** — 73.7% var-vs-rgba adoption. See latest Intel Report |
| Floor 01 raw sensor coupling | Fragility | Silent failure on rename | Documented warning |
| Dashboard duplication (default vs home) | Redundancy | Confusion | Acknowledged |
| Mixed automation alias styles | Cosmetic | ~55% follow `Domain - Feature` | Migrate opportunistically |
| Test dashboards | Clutter | Minor storage | Consolidate if inactive |
| Health card JS duplication | Maintenance risk | 950-line blocks duplicated in 9 view locations | Acknowledged |
| Alerts table JS duplication | Maintenance risk | 5 copies of 378-line block = 1,890 lines redundant | Acknowledged |
| HS color extra_styles duplication | Maintenance risk | 8 copies of 316-line block = 2,528 lines redundant | Acknowledged |
| Health domain duplicate sensor definitions | Fragility | `health.yaml` and `weight.yaml` both define sensors with same names; last-loaded wins | Acknowledged |
| Room transition events unconsumed | Dead code | `floor02_travel_tracking.yaml` fires `room_occupancy_change` events and produces `sensor.floor02_zone_active`, but zero automations listen | Acknowledged |
| Confidence tier unconsumed | Dead code | 6-level scoring on every presence sensor; no automation reads it | Acknowledged |
| `map.yaml` unguarded state access | Fragility | 3 `states[variable].last_updated` calls without None guards (lines 63, 88, 125) — entity unavailability causes template failure | Identified (Intel Report I-03, Mar 15) |
| DST-sensitive `now().hour` comparisons | Temporal fragility | 9 instances across lights, bed_state, presence_desks, tesco_sensors — silent 1-hour offset 2x/year | Identified (Intel Report I-04, Mar 15) |

Previously resolved items (startup recovery, division-by-zero guards, namespace bugs, stale file cleanup, component removals) are tracked in the document changelog and git history.

**Automation distribution:**
- automations.yaml: 35 top-level automations (includes nested choose/conditions with multiple aliases)
- Packages: ~35 automations across package files
- Registry total: 82 (some from Node-RED, UI-created, or integration-generated)

<!-- ARCH:ENTITY_COUNTS:START -->
**Entity counts:**
- Runtime: 2,985 | Unavailable: 154 (5.2%)
- Dashboard-referenced: ~48% (52% unreferenced — many are legitimate helpers, stats sensors, or internal)
- Domain breakdown: 1,385 sensors, 170 binary, 84 automations, 68 scripts, 147 scenes, 45 lights, 205 switches, 27 cameras, 316 helpers

*Auto-generated from live sensor data. Last sync: 2026-04-08 03:57 UTC*
<!-- ARCH:ENTITY_COUNTS:END -->

---

## 10. UI Design System Summary

<!-- ARCH:UI_LOCATION:START -->
**Location:** `/config/www/base/` (17 files, 12,261 lines) with documentation in `/config/www/base/docs/`
<!-- ARCH:UI_LOCATION:END -->

**Key files:**
- `foundation.js` — Token definitions (READ-ONLY)
- `components.js` — Reusable UI components
- `docs/spec.md` — Full system specification
- `docs/CLAUDE.md` — AI governance rules
- `docs/authoring.md` — Component creation patterns
- `docs/componentry/tooltips.md` — Tooltip exception documentation
- `docs/componentry/number-input.md` — Number input specification (added 2026-03-23)

**Token governance:**
1. All values must derive from defined tokens
2. No arbitrary pixel values, custom colors, or interpolation
3. Critical geometry is immutable (Button 40px, Touch target 48px min)
4. foundation.js is READ-ONLY — propose changes in prose, wait for approval
5. Priority hierarchy: safety/accessibility → immutable geometry → token adherence → state model → theme equality → user instruction

**Custom cards:** `/config/www/cards/` contains 28 JS files across 8 card directories and 4 standalone files.

**Token adoption:** Full adoption in `www/base/` and `www/cards/` components. Dashboard inline JS is converging (73.7% var-vs-rgba adoption; majority var(), residual rgba()/hex from legacy and SVG icons). See latest Intel Report in `docs/reports/config-intel/` for current metrics.

**Exception:** Tooltips render in light DOM, requiring manual sync of dark mode values between `foundation.js` and `tooltips.js`. See `docs/componentry/tooltips.md`.

---

## 11. AI Assistant Context

### Non-Obvious Behaviours

1. **Presence edge_hold**: Door events extend presence 30s after motion clears — intentional for "in-transit"
2. **Unified door sensors**: `binary_sensor.door_*` are templates, not raw devices — but presence system uses raw sensors, not these
3. **Design tokens in JS**: Core system in `/config/www/base/foundation.js`, not theme files
4. **Dashboard storage**: Primary content in `.storage/lovelace.dashboard_home` (JSON)
5. **Floor 01 bypasses abstraction**: Uses raw FP2 entity IDs — fragile to renames
6. **Confidence tier is produced but unconsumed**: 6-level confidence scoring exists on every presence sensor but no automation reads it
7. **Room transition events fire into void**: `floor02_travel_tracking.yaml` fires `room_occupancy_change` events and produces `sensor.floor02_zone_active`, but zero automations listen
8. **Cover vacancy uses raw FP2 sensors**: Not unified presence entities — specific sensor IDs hardcoded
9. **PC session never returns unknown**: Falls back to "off" after 150s heartbeat timeout
10. **Pet fountain polling is welfare-critical**: Hourly button press forces sensor refresh; removal risks stale water data
11. **Bed occupancy group**: `group.bed_occupancy_sensors` is defined in `bed_state.yaml` with Withings in-bed sensors (C-side + E-side)
12. **Camera view selector mismatch**: `server/frontend/advanced_camera_card_backend.yaml` selector options do not exactly match `device/cameras.yaml` options (server includes live views like Doorbell, Garden, Front)
13. **Sleep metrics are UI-only**: Sleep score, deep_sleep, rem_sleep, snoring tracked but have zero automation consumers
14. **Occupancy expand() calls**: ~17 `expand()` calls remain in `presence_detection.yaml`, scoped via `area_entities()` — not eliminated as some documentation claims
15. **WhatsApp silent message loss**: Unread counters are cleared before delivery confirmation — if integration is offline, messages are lost silently
16. **Office lighting has no startup trigger**: Unlike Floor 01/02 which recover state on HA restart, office lighting requires manual intervention after restart

### Common Misconceptions

| Misconception | Reality |
|---------------|---------|
| "automations.yaml has all the automations" | Split between root (~35) and packages (~35); others from Node-RED/UI |
| "Dashboard JS bypasses token system" | Convergence in progress; 73.7% var-vs-rgba adoption |
| "Presence sensors are raw devices" | They're template aggregations via YAML anchor |
| "Door entities feed presence" | Presence uses raw contact/vibration sensors, not unified door entities |
| "olympus.yaml is the active theme" | Material You is set as default via `frontend_theme_management.yaml` |
| "tesco_sensors.yaml tracks Tesco" | Actually tracks Sainsbury's Local |
| "All lighting has startup recovery" | Only Floor 01 and Floor 02 — office lighting does not |

### Red Flags

- Editing `configuration.yaml` (minimal, rarely needs changes)
- Modifying `custom_components/` (external code)
- Adding to root YAML instead of packages
- Creating new dashboards instead of views
- Hardcoding values that should use tokens
- Changing Floor 01 sensor references without understanding coupling
- Modifying ICS calendar files without backup
- Removing pet fountain polling automation
- Mixing WhatsApp clientId "c" and "e"
- Adding a second automation targeting `todo.meeting_summaries` (breaks pipeline concurrency)

---

## 12. Document Maintenance

| Section | Update Trigger | Source |
|---------|----------------|--------|
| Directory Structure | Package/file changes | `find` |
| Naming Conventions | New pattern established | Entity registry |
| Major Subsystems | Architecture change | Domain CLAUDE.md |
| Architectural Decisions | Design choice made | CLAUDE.md, code comments |
| Coupling Hotspots | Dependency changed | Domain CLAUDE.md, Intel Report |
| Data Flow | Automation chain modified | Package review |
| Recovery Characteristics | Recovery added/removed | Failure Mode Report |
| Integration Inventory | Integration changed | `custom_components/` |
| Technical Debt | Debt resolved/created | Intel Report |
| UI Design System | Token changes, adoption progress | UI Audit Report, Intel Report |

**Update frequency:** After significant structural changes, or when running Intel/Failure Mode reports.

**Report locations:**
- Intel Reports: `/config/docs/reports/config-intel/`
- Failure Mode Reports: `/config/docs/reports/failure-mode/`
- Meta-Insights Reports: `/config/docs/reports/meta-insights/`
- Shared UI Audit Reports: `/config/docs/reports/shared-ui-audit/` - do **NOT** add reports to `/config/www/base/docs/...`
- Components Review: `/config/docs/reports/components-review/`
- Project Audit Reports: `/config/docs/reports/project-audit/`

---

# |   END: ARCHITECTURE.md
