# CLAUDE - Specs Card Tabbed

> **Scope:** Multi-tab data grid card — primary rendering surface for the HA server snapshot, with collapsible sections, semantic value colouring, and clipboard export
> **Last reviewed:** 2026-04
> **Read root CLAUDE.md and www/base/docs/CLAUDE.md first for session protocol and UI governance rules**

---

## Summary

A single-file Web Component that renders tabbed data grids from HA entity states and sensor attributes. While generic enough for any tabbed key-value display, its primary and most important use case is rendering the **HA server snapshot** — the system's most comprehensive context output, spanning hardware specs, entity counts, diagnostics, subsystem descriptions, gotchas, file locations, naming patterns, data flows, and known issues across two tabs (Specifications + Context). This is one of two rendering surfaces for `system_context.yaml`; the other is `sensor.ha_server_snapshot` which formats the same data as XML-tagged text for AI consumption (used by the prompt manager's inject button). The card's "Copy All" export produces a structured fenced code block that is routinely pasted into AI conversations as system context.

Each tab contains collapsible sections of key-value rows with per-value semantic colouring (success/warning/error/info/muted). Values support Jinja-style template resolution via the shared `parseTemplate` system, including `range_to_label` for threshold-based colour assignment. The card uses the fast-path `updateValues()` pattern — full render runs once, subsequent `set hass()` calls surgically patch value text and colour classes.

---

## Structure

| File | Purpose |
|------|---------|
| `specs-card-tabbed.js` | Single entry point — card class, editor stub, tab bar, collapsible sections, value colour resolution, clipboard export, surgical DOM updates |

No companion YAML. No helper entities. Data comes from entities and sensor attributes configured per-tab.

**Primary config:** `docs/reference/server-info-card.md` — the full YAML card config for the server snapshot instance. This is the card's most important deployment.

---

## Key Components

### Server Snapshot — Primary Use Case

The card's most important deployment is the "Server Info" instance (config at `docs/reference/server-info-card.md`). It renders two tabs:

| Tab | Sections | Data sources |
|-----|----------|--------------|
| **Spec** (Specifications) | Overview, HA, System, Storage, MQTT, Network, Frontend, Entities, Diagnostics, Health | Inline templates resolving ~40 sensor entities with `range_to_label` colouring for CPU temp, load, disk, memory, errors, unavailable entities |
| **Context** | Gotchas, Files, Naming, Subsystems, Flows, Capabilities, Issues, Shared UI | Inline `data` mirroring `system_context.yaml` sections — static prose, not template-resolved |

The Spec tab is live data (updates every `set hass()`); the Context tab is static reference text baked into the card config YAML. Together they form the human-readable counterpart to `sensor.ha_server_snapshot` (the AI-formatted XML version of the same information).

The "Copy All" output from this card is routinely pasted into AI conversations as comprehensive system context. The fenced code block format, dot-padded labels, and tab separators are all designed for this purpose.

### Card Config

```yaml
type: custom:specs-card-tabbed
card_title: System Context          # optional, default shown
copy_title: System Information      # optional, used in clipboard export header
tabs:
  overview:
    label: Overview                 # tab button text
    copy_label: System Overview     # optional, used in clipboard export
    sections:
      hardware:
        title: Hardware
        copy_title: Hardware Specs  # optional, used in clipboard export
        data:                       # inline key-value pairs
          CPU: "{{ states('sensor.processor_use') }}%"
          Memory: "{{ states('sensor.memory_use_percent') }}%"
      # OR use data_source to pull from a sensor attribute:
      gotchas:
        title: Gotchas
        data_source:
          entity: sensor.ha_system_context
          attribute: gotchas
```

### Data Resolution

Two sources per section, checked in order:

1. **`data_source`** — reads a sensor attribute object (`state_attr(entity, attribute)`). The attribute must contain a plain `{ label: value }` object. Used for dynamic data like `sensor.ha_system_context` attributes.
2. **`data`** — inline key-value pairs in the card config. Values can contain Jinja-style templates resolved by `parseTemplate()`.

If `data_source` is specified and the sensor/attribute is available, it takes precedence. Falls back to empty `{}` if unavailable.

### Template Resolution

Values are processed through `parseTemplate()` from `www/base/templates.js`, which resolves Jinja-style template strings (`{{ states('sensor.x') }}`) against live `hass` state. This runs on both initial render and every `updateValues()` pass.

### Semantic Value Colouring

Values can carry colour metadata in two formats:

| Format | Example | Usage |
|--------|---------|-------|
| Object with `text` + `color` | `{ text: "6.4 GB", color: "warning" }` | Returned by `range_to_label` in templates |
| Colon-delimited suffix | `"6.4 GB:warning"` | Inline in config values |

Colours map to `ui-text--{color}` utility classes: `success`, `warning`, `error`, `info`, `muted`.

### DOM Update Strategy

- `render()` builds the full DOM once (tabs, sections, rows)
- `updateValues()` is the fast path on every subsequent `set hass()` — walks the DOM using `data-tab` / `data-section` / `data-label` selectors and patches only the value text content and colour class
- Tab switching uses class toggles (`tab-panel--active`), preserving scroll position and collapsible section state per tab

### Tab Bar

Uses the shared `ui-tab-bar` component with `ui-tab-bar__tab` buttons. Active tab gets `ui-tab-bar__tab--active`. Switching calls `switchTab()` which toggles classes on both tab buttons and tab panels — no re-render.

### Collapsible Sections

Uses the shared `initCollapsibleSections()` and `toggleAllSections()` from `components.js`. Each section starts expanded (`data-initial-state="expanded"`). Toggle-all button (accent icon button in card actions) collapses/expands all sections across all tabs, with icon switching between minus (collapse) and plus (expand).

### Clipboard Export

`generateClipboardText()` produces a formatted fenced code block:

- **Copy Tab** — exports only the active tab's sections
- **Copy All** — exports all tabs with block-character separators (`▓▓▓ TAB NAME ▓▓▓`)
- Values are stripped of colour metadata (plain text only)
- Labels are dot-padded to a fixed 28-character column width
- Header includes the `copy_title` and generation timestamp

Copy menu uses the shared `ui-menu` with `handleCopyButton` for the copy + visual feedback.

### Editor

`SpecsCardTabbedEditor` — stub displaying "This card has no configurable options." Config is YAML-only.

---

## Shared UI System Integration

### What It Uses

| Import | Usage |
|--------|-------|
| `foundation.js` | Tokens — via `window.uiFoundation` adopted stylesheet |
| `components.js` | `uiComponents` — `ui-card`, `ui-card-header`, `ui-card-actions`, `ui-tab-bar`, `ui-data-row`, `ui-collapsible-section`, `ui-copy-btn`, `ui-menu`, `ui-btn`. Also `handleCopyButton`, `initCollapsibleSections`, `toggleAllSections`. |
| `templates.js` | `parseTemplate` — resolves Jinja-style templates against `hass` state |
| `helpers.js` | `applyThemeClass`, `initButtons` |

### What It Does NOT Use

- `tooltips.js`, `toggles.js`, `checkboxes.js`, `radios.js`, `skeletons.js`, `number-input.js`, `drawer.js`, `modals.js`, `toasts.js`, `screen-border.js`, `utilities.js`

### Design System Violations

| Issue | Current | Notes |
|-------|---------|-------|
| Styles in `<style>` tag | Card-specific CSS injected via `innerHTML` in `render()` | Should use `new CSSStyleSheet()` + `adoptedStyleSheets` — re-parses on every full render |
| Card fixed height | `calc(var(--ui-space-9) * 13)` = 520px | Token-derived but non-standard fixed height — forces scrollable content area |
| Collapsible header padding override | `padding: var(--ui-space-2) 0` | Overrides shared component's default padding for tighter layout |
| Collapsible title overrides | `padding-left: 0`, `font-size: var(--ui-font-xs)`, `color: var(--ui-text-mute)` | Overrides shared component defaults to match section-header styling |
| Clipboard column width | `28` chars fixed | Hardcoded formatting constant — not a UI token |
| Debug console.log statements | Lines 148, 258–259 | Left from development — should be removed |

---

## Development Workflows

### Adding a New Tab

1. Add a key under `tabs` in the card config YAML
2. Define `label`, optional `copy_label`, and `sections` with `data` or `data_source`
3. Tab auto-renders from config — no code changes needed

### Adding a New Colour

1. Add the colour name to the regex in `applyValueWithColor()` (line ~160)
2. Add a corresponding `ui-text--{color}` class removal in the cleanup line (~144)
3. Ensure the class exists in `foundation.js`

### Testing Changes

1. Switch between tabs — verify content changes, scroll position preserved per tab
2. Collapse/expand individual sections — verify animation plays
3. Toggle all sections — verify icon switches, all tabs affected
4. Copy Tab — verify only active tab's data in clipboard, formatted as fenced code block
5. Copy All — verify all tabs included with `▓` separators
6. Verify semantic colours: values with `:warning` suffix show amber, objects with `color: "error"` show red
7. Update a sensor value externally — verify `updateValues()` patches the DOM without full re-render
8. Light/dark themes — verify colour classes adapt

---

## Conventions for AI Assistants

### Anti-Patterns

- Don't full re-render on every `set hass()` — `updateValues()` is the fast path. Full `render()` only runs once; re-rendering destroys collapsible section state, scroll position, and menu state
- Don't hardcode tab or section keys — they are driven entirely by card config YAML
- Don't strip the `data-tab` / `data-section` / `data-label` attributes — `updateValues()` depends on them for targeted DOM patching
- Don't add new colour names without also adding them to the cleanup line in `applyValueWithColor()` — stale classes will persist across updates
- Don't remove `sanitizeLabel()` — it normalises label text to slugs for `data-label` attribute matching

### Coupling

**Upstream (data source):**
- Any HA entity state — accessed via `parseTemplate()` template resolution
- Sensor attributes — accessed via `data_source` config (e.g., `sensor.ha_system_context`)
- `www/base/templates.js` — `parseTemplate()` resolves Jinja-style templates against `hass`

**Server snapshot ecosystem (primary use case):**
- `system_context.yaml` — single source of truth for static system context (executive context, gotchas, file locations, naming, subsystems, data flows, capabilities, known issues)
- `pyscript/system_context.py` — publishes `system_context.yaml` as `sensor.ha_system_context` attributes
- `packages/server/ha_snapshot_sensor.yaml` — the AI-formatted counterpart (`sensor.ha_server_snapshot.snapshot`), consumed by prompt manager's inject button
- `packages/server/frontend/frontend_server_stats.yaml` — command_line sensors providing the live metrics (entity counts, uptime, MQTT, storage, CPU, memory, disk, database, backups, dashboard complexity)
- `docs/reference/server-info-card.md` — the full card config YAML for the server snapshot instance

**Shared UI system:**
- `www/base/foundation.js` — tokens
- `www/base/components.js` — `uiComponents`, `handleCopyButton`, `initCollapsibleSections`, `toggleAllSections`
- `www/base/templates.js` — `parseTemplate`
- `www/base/helpers.js` — `applyThemeClass`, `initButtons`

**Consumed by:**
- Dashboard views that include `custom:specs-card-tabbed`

### Cross-References

- Root: `/CLAUDE.md`
- UI governance: `/www/base/docs/CLAUDE.md`
- Server snapshot card config: `/docs/reference/server-info-card.md`
- System context source: `/system_context.yaml`
- AI snapshot sensor: `/packages/server/ha_snapshot_sensor.yaml`
- Server stats sensors: `/packages/server/frontend/frontend_server_stats.yaml`
- Server domain: `/packages/server/CLAUDE.md`
- Specs card (non-tabbed variant): `/www/cards/specs-card/specs-card.js`
- Template system: `/www/base/templates.js`
- Architecture: `/ARCHITECTURE.md`

---

## TODOs & Gaps

- **Debug console.log statements** — `applyValueWithColor` (line ~148) and `renderTabContent` (lines ~258–259) contain debug logging that should be removed.
- **Styles use `<style>` tag, not `adoptedStyleSheets`** — card-specific CSS is injected via `innerHTML` in `render()`, same issue as `phone-card`.
- **No Esc-to-close on copy menu** — click-outside closes it, but keyboard Esc does not.
- **Copy menu click-outside listener not scoped** — added to the shadow root on every `render()` without removal tracking.
- **No loading/empty state** — if a `data_source` sensor is unavailable, the section renders with no rows and no feedback.
- **Fixed card height** — `calc(var(--ui-space-9) * 13)` = 520px may clip content on smaller screens or overflow on larger ones. Not responsive.

---

## Changelog

| Date | Commit | Change |
|------|--------|--------|
| 2026-04-11 | — | Initial CLAUDE.md created |

*Last Updated: 2026-04-11*
