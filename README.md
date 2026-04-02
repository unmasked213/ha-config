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
├── pyscript/                         # 13 Python automations
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

| | |
|--|--|
| **Platform** | HA Core 2026.3.4 · OS 17.1 · Supervisor 2026.03.2 |
| **Hardware** | 11th Gen Intel(R) Core(TM) i7-1165G7 @ 2.80GHz · 8 threads · 32.0 GB RAM · 140.8 / 938.2 GB disk |
| **Storage** | SQLite · 7 day retention · 3.4 GB |
| **Config** | 357,288 lines (52,170 YAML · 250,174 dashboard JSON) |
| **Integrations** | 36 custom · 82 HACS · 16 add-ons · 64 lovelace resources |
| **Dashboard** | 122 views · 10,036 cards (5,501 custom / 4,535 standard) |
| | |
| **Entities** | **2,997 total** (247 unavailable) |
| Sensors | 1,366 sensor · 168 binary |
| Automation | 83 automations · 68 scripts · 147 scenes |
| Hardware | 45 lights · 206 switches · 11 covers · 6 media players |
| Other | 31 cameras · 341 helpers · 128 updates · 37 zones |

*Snapshot taken: 2026-03-30 15:42 BST*
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
