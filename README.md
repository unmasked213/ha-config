# Home Assistant Configuration

This is the working config for a mature, architecture-driven Home Assistant system.

System logic is organised into package-scoped domains, each with its own localised AI context. `configuration.yaml` acts only as a bootstrap layer, all substantive beaviour resides within the domain structure. 

The system operates at a non-trivial scale, with purposeful complexity and nuance. Metrics are derived from live sensor data.



---

## Repository Structure

<!-- TREE:START -->

```
/config/
├── configuration.yaml                # HA bootstrap (delegates to packages)
├── automations.yaml                  # Root automations
├── scripts.yaml                      # Reusable service-call sequences
├── scenes.yaml                       # Scene snapshots
│
├── packages/                         # 14 domain packages, 63 YAML files
│   ├── ai/                           # AI generation, prompts, Alexa TTS
│   ├── communication/                # WhatsApp, notifications, transcripts
│   ├── dashboard/                    # Report viewer backend
│   ├── device/                       # Cameras, covers, PC, pet devices, Sonos
│   ├── health/                       # Body composition (Withings)
│   ├── lights/                       # Per-floor lighting automation
│   ├── network/                      # Device scanning, MAC mapping
│   ├── occupancy/                    # Presence detection, doors, bed state
│   ├── server/                       # Git sync, frontend, server stats
│   ├── shopping/                     # Shopping lists, store busyness
│   ├── time/                         # Alarms, calendar, hourly triggers
│   ├── travel/                       # Location tracking, ETA, railway
│   ├── weather/                      # Forecasts, AI clothing suggestions
│   └── work/                         # Meeting action extraction
│
├── pyscript/                         # 12 Python automations
├── custom_components/                # 36 third-party integrations
├── www/                              # Web assets
│   ├── base/                         # UI design system (16 JS files)
│   ├── cards/                        # Custom card implementations
│   └── community/                    # Third-party card library
│
├── themes/                           # Material You, Catppuccin, VisionOS
├── ui/                               # Dashboard views, templates, resources
├── templates/                        # Custom button card templates
├── docs/                             # Reports and reference documentation
├── addons/                           # Local add-ons (ha-config-ai-agent)
└── .claude/                          # AI session management
```
<!-- TREE:END -->

---

<!-- SNAPSHOT:START -->

## Key Metrics

> Auto-generated from live sensor data at each git sync. Source: [`readme_snapshot.j2`](readme_snapshot.j2)

### Platform

| Component | Version |
|-----------|---------|
| HA Core | 2026.3.4 |
| HA OS | 17.1 |
| Supervisor | 2026.03.2 |
| Installed | 2023-03-30 |

### Hardware

| Spec | Value |
|------|-------|
| CPU | 11th Gen Intel(R) Core(TM) i7-1165G7 @ 2.80GHz |
| Threads | 8 |
| RAM | 32.0 GB |
| Disk | 139.7 GB used / 938.2 GB total |

### Entities

3098 total, 281 unavailable

| Domain | Count |
|--------|------:|
| Sensors | 1453 |
| Binary sensors | 171 |
| Automations | 82 |
| Scripts | 68 |
| Scenes | 147 |
| Lights | 45 |
| Switches | 210 |
| Covers | 11 |
| Climate | 0 |
| Media players | 6 |
| Cameras | 31 |
| Helpers | 341 |
| Updates | 128 |
| Zones | 37 |

### Infrastructure

| Resource | Count |
|----------|------:|
| Custom integrations | 36 |
| HACS integrations | 82 |
| Add-ons | 16 |
| Lovelace resources | 64 |

### Dashboard

| Metric | Value |
|--------|------:|
| Views | 122 |
| Total cards | 10036 |
| Custom | 5502 |
| Standard | 4534 |

### Config Scale

| Metric | Lines |
|--------|------:|
| Total | 320,872 |
| YAML | 52,067 |
| Dashboard JSON | 250,264 |

### Storage

| Metric | Value |
|--------|-------|
| DB engine | SQLite |
| Retention | 7 days |
| DB size | 3.4 GB |

---

*Snapshot taken: 2026-03-25 03:56 UTC*
<!-- SNAPSHOT:END -->

---

## Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture, data flows, entity relationships |
| [CLAUDE.md](CLAUDE.md) | AI assistant context, session protocol, safety rails |
| `packages/*/CLAUDE.md` | Domain-specific rules (all 13 domains) |
| [www/base/README.md](www/base/README.md) | UI design system project map |
| [www/base/docs/](www/base/docs/) | UI spec, authoring guide, AI briefing |
| `docs/reports/` | Config intel, failure mode, meta-insights, UI audit reports |

---

## Development

This configuration is developed using Claude Code across two environments:
- **PC:** Claude Code Desktop (file access via Samba at `A:\`)
- **Tablet/Phone:** HA addon (file access at `/config/`)

The `.claude/` directory provides session persistence for cross-device continuity.

---

## Not Included

- Setup instructions — not a template
- Contributing guidelines — no external contributors
- Credentials — in gitignored `secrets.yaml`

---

*Last Updated: 2026-03-25*
