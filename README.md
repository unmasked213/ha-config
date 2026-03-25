# Home Assistant Configuration

Personal Home Assistant configuration for a two-person household (Cam and Enhy), running on HA OS 17.1 with Home Assistant 2026.2.2.

**This is not a template repository.** It's a living configuration maintained with assistance from AI coding tools. Not intended for reuse or contribution.

---

## Repository Structure

```
/config/
├── configuration.yaml        # Core HA config (minimal loader, delegates to packages)
├── automations.yaml          # Root automations (~36 top-level)
├── scripts.yaml              # 48 reusable scripts
├── scenes.yaml               # Scene snapshots
├── frigate.yml               # Frigate NVR config (camera C11)
│
├── packages/                 # Primary configuration (13 domains, 60 YAML files)
│   ├── ai/                   # AI text/image generation, prompts, Claude bridge
│   ├── communication/        # WhatsApp, notifications, transcript pipeline
│   ├── dashboard/            # Report viewer backend
│   ├── device/               # Cameras, covers, PC state, pet devices
│   ├── health/               # Body composition, weight (Withings)
│   ├── lights/               # Per-floor lighting automation
│   ├── network/              # Device scanning, MAC mapping
│   ├── occupancy/            # Presence detection, doors, bed state
│   ├── server/               # Frontend, git sync, server stats
│   ├── shopping/             # Shopping lists, store busyness
│   ├── time/                 # Alarms, calendar, hourly triggers
│   ├── travel/               # Location tracking, ETA, railway
│   └── weather/              # Forecasts, AI clothing suggestions
│
├── custom_components/        # 42 third-party integrations
├── www/                      # Web-accessible assets
│   ├── base/                 # Token-driven UI design system (14 JS files)
│   ├── cards/                # Custom card implementations (4 modular cards + standalone)
│   └── community/            # Third-party card library
│
├── pyscript/                 # Python automations (9 files — CV, calendar, logging)
├── themes/                   # Theme definitions (Material You active, Catppuccin, VisionOS)
├── ui/                       # Dashboard config (lovelace resources, views, templates)
├── docs/                     # Reports and reference documentation
├── addons/                   # Local HA add-ons (ha-config-ai-agent)
├── ai_adversarial_system/    # Same-model collaboration workspace
│
└── .claude/                  # AI assistant tooling
    ├── session.md            # Current task snapshot
    ├── session_history.md    # Rolling task archive (20 entries)
    ├── rules/                # Path-based domain rule auto-injection
    ├── hooks/                # SessionStart hooks
    ├── skills/               # Reusable workflows
    ├── haq                   # HA Query CLI wrapper
    └── mcp.json              # MCP connection config
```

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
