# Home Assistant Configuration

A production Home Assistant system organised into 14 package-scoped domains, each with localised AI context. `configuration.yaml` acts as a bootstrap layer - all substantive behaviour resides within the domain structure.

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
├── packages/                         # 14 domain packages, 64 YAML files
│   ├── ai/                           # AI generation, prompts, Alexa TTS
│   ├── communication/                # WhatsApp, notifications, transcripts
│   ├── dashboard/                    # Report viewer backend
│   ├── device/                       # Cameras, covers, PC, pet devices, Sonos
│   ├── health/                       # Body composition (Withings)
│   ├── lights/                       # Per-floor lighting automation
│   ├── network/                      # Device scanning, MAC mapping
│   ├── occupancy/                    # Presence detection, doors, bed state
│   ├── server/                       # Git sync, frontend, server stats, session cleanup
│   ├── shopping/                     # Shopping lists, store busyness
│   ├── time/                         # Alarms, calendar, hourly triggers
│   ├── travel/                       # Location tracking, ETA, railway
│   ├── weather/                      # Forecasts, AI clothing suggestions
│   └── work/                         # Meeting action extraction
│
├── pyscript/                         # 13 Python automations
├── custom_components/                # 29 third-party integrations
├── www/                              # Web assets
│   ├── base/                         # UI design system (18 JS files)
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

| | |
|--|--|
| **Platform** | HA Core 2026.4.2 · OS 17.2 · Supervisor 2026.04.0 |
| **Hardware** | 11th Gen Intel(R) Core(TM) i7-1165G7 @ 2.80GHz · 8 threads · 32.0 GB RAM · 564.8 / 938.2 GB disk |
| **Storage** | SQLite · 7 day retention · 1.9 GB |
| **Config** | 324,612 lines (49,954 YAML · 228,813 dashboard JSON) |
| **Integrations** | 29 custom · 76 HACS · 16 add-ons · 47 lovelace resources |
| **Dashboard** | 109 views · 9,405 cards (5,164 custom / 4,241 standard) |
| **Entities** | **3,009 total** (144 unavailable) |
| Sensors | 1,408 sensor · 175 binary |
| Automation | 86 automations · 68 scripts · 147 scenes |
| Hardware | 45 lights · 200 switches · 10 covers · 6 media players |
| Other | 29 cameras · 346 helpers · 121 updates · 37 zones |

*Auto-generated from live sensor data at each git sync. Last updated: 2026-04-15 14:35 BST*
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

---

## Development

Developed with [Claude Code](https://claude.ai/claude-code) across PC (Desktop, Samba) and mobile (HA addon). The `.claude/` directory provides cross-device session persistence.
