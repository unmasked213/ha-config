# Report Viewer Card — Build Specification

## Purpose

A custom Home Assistant dashboard card that renders intelligence reports stored as markdown files. Replaces viewing raw markdown in a file editor with a proper document viewer integrated into the existing shared UI design system.

## Context

Four analysis prompts generate structured markdown reports about the HA configuration. These reports are 10–40KB each, stored in `/config/docs/reports/` with dated versions inside category folders. The card must handle all four report types and any future categories without structural assumptions beyond markdown conventions.

---

## 1. Architecture

### Card Type

Shadow DOM custom element registered as `report-viewer-card`. Follows the same architectural pattern as `presence-activity-card` in `www/cards/presence-activity-card/`.

### Integration Points

| System | File | How to consume |
|--------|------|----------------|
| Design tokens | `www/base/foundation.js` | `window.uiFoundation` via `adoptedStyleSheets` |
| Components | `www/base/components.js` | `uiComponents` stylesheet + utility functions |
| Theme sync | `www/base/helpers.js` | `applyThemeClass(this, hass)` in `set hass()` |
| Collapsible sections | `www/base/components.js` | `initCollapsibleSections` pattern (adapt, don't import directly — the card needs heading-level collapse, not the generic version) |
| Copy to clipboard | `www/base/components.js` | `handleCopyButton` utility for code block copy |
| Toasts | `www/base/toasts.js` | `showToast()` for copy confirmation feedback |

### Files to Read Before Building

Read these in order. They contain the architectural constraints and patterns to follow.

1. `/config/www/cards/report-viewer-card/SPEC.md` — this file; full build specification, feature set, data layer, acceptance criteria
2. `/config/ARCHITECTURE.md` — system overview, integration tiers, data flows
3. `/config/www/base/docs/CLAUDE.md` — shared UI constraints, token governance, anti-patterns
4. `/config/www/base/docs/spec.md` — design token definitions, component specifications, geometry rules
5. `/config/www/base/docs/authoring.md` — component creation patterns, skeleton structure, event patterns
6. `/config/www/base/README.md` — system index, file inventory
7. `/config/www/base/foundation.js` — READ-ONLY, single source of truth for all design tokens
8. `/config/www/base/components.js` — shared component styles and utility functions
9. `/config/www/base/helpers.js` — `applyThemeClass` and other shared utilities
10. `/config/www/cards/presence-activity-card/presence-activity-card.js` — reference implementation for card architecture, settings panel drawer pattern, `adoptedStyleSheets`, HA helper integration

### File Location

```
www/cards/report-viewer-card/
  SPEC.md                  # This file — build specification (read first)
  report-viewer-card.js    # Main card
  markdown-renderer.js     # markdown-it setup, plugins, semantic detection
```

Third-party libraries (markdown-it, Prism) live in `www/vendor/` — a shared location alongside `www/base/` and `www/cards/`. Any card can import from it. Do not bundle dependencies inside individual card folders.

```
www/vendor/
  markdown-it.min.js
  prism-core.min.js
  prism-yaml.min.js
  prism-python.min.js
  prism-bash.min.js
  prism-json.min.js
  prism-jinja2.min.js
```

Keep card code to two files maximum. The renderer is separated because it's the most complex piece and benefits from isolation, but everything else lives in the main card file. This follows the existing pattern where each custom card has its own folder under `www/cards/`.

---

## 2. Data Layer

### Strategy: Preloaded Latest Reports

Preload the most recent report per category into sensor attributes on startup and refresh hourly. Five sensors (one per active markdown category), each reading the most recent file. This gives instant tab switching with zero loading delay.

Reports are 10–40KB text. Five categories means 50–200KB total in sensor attributes — trivial memory cost. Exclude these sensors from the recorder.

### Report Index Sensor

A `command_line` sensor that scans `/config/docs/reports/` and returns the folder structure as a JSON attribute.

```yaml
command_line:
  - sensor:
      name: report_index
      command: >-
        python3 -c "
        import json, os
        base = '/config/docs/reports'
        index = {}
        for cat in sorted(os.listdir(base)):
          cat_path = os.path.join(base, cat)
          if not os.path.isdir(cat_path):
            continue
          files = sorted([
            f for f in os.listdir(cat_path)
            if f.endswith('.md')
          ], reverse=True)
          if files:
            index[cat] = files
        print(json.dumps(index))
        "
      value_template: "{{ now().isoformat() }}"
      json_attributes:
        - config-intel
        - meta-insights
        - failure-mode
        - shared-ui-audit
        - components-review
        - project-audit
      scan_interval: 3600
```

**Important:** The `json_attributes` list above won't work because the keys are dynamic. Use `json_attributes_template` instead:

```yaml
      json_attributes_template: "{{ value | string }}"
```

Or better — return the entire index as a single attribute:

```yaml
command_line:
  - sensor:
      name: report_index
      command: >-
        python3 -c "
        import json, os
        base = '/config/docs/reports'
        index = {}
        for cat in sorted(os.listdir(base)):
          cat_path = os.path.join(base, cat)
          if not os.path.isdir(cat_path):
            continue
          files = sorted([
            f for f in os.listdir(cat_path)
            if f.endswith('.md')
          ], reverse=True)
          if files:
            index[cat] = files
        print(json.dumps({'index': index}))
        "
      value_template: "{{ now().isoformat() }}"
      json_attributes_template: "{{ value }}"
      scan_interval: 3600
```

The card reads `state_attr('sensor.report_index', 'index')` to get the full category?files mapping.

### Report Content Sensors

One sensor per category that reads the most recent file. These are the preloaded content sensors.

```yaml
command_line:
  - sensor:
      name: report_content_config_intel
      command: "cat \"$(ls -1 /config/docs/reports/config-intel/*.md 2>/dev/null | sort -r | head -1)\" 2>/dev/null || echo ''"
      value_template: "{{ now().isoformat() }}"
      json_attributes_template: >-
        {{ {'content': value, 'filename': value | regex_findall('/([^/]+)$') | first | default('')} | tojson }}
      scan_interval: 3600
```

Repeat for each category: `meta_insights`, `failure_mode`, `shared_ui_audit`, `components_review`, `project_audit`.

**Note on attribute size:** Sensor state is capped at 255 chars (hence the timestamp as state value). Attributes have a soft 16KB limit in the recorder but the state machine handles larger values. Exclude these sensors from the recorder:

```yaml
recorder:
  exclude:
    entities:
      - sensor.report_index
      - sensor.report_content_config_intel
      - sensor.report_content_meta_insights
      - sensor.report_content_failure_mode
      - sensor.report_content_shared_ui_audit
      - sensor.report_content_components_review
      - sensor.report_content_project_audit
```

### Version Switching

For historical report access (not latest), the card needs to load a specific file on demand. Use a `shell_command` + `input_text` pattern:

```yaml
input_text:
  report_viewer_request:
    name: Report Viewer File Request
    max: 255

shell_command:
  load_report: >-
    cat "/config/docs/reports/{{ states('input_text.report_viewer_request') }}" > /dev/null

command_line:
  - sensor:
      name: report_content_on_demand
      command: "cat \"/config/docs/reports/$(cat /tmp/report_request.txt 2>/dev/null)\" 2>/dev/null || echo ''"
      value_template: "{{ now().isoformat() }}"
      json_attributes_template: "{{ {'content': value} | tojson }}"
      scan_interval: 86400
```

**Simpler alternative:** Since most usage will be the latest report per category (already preloaded), version switching can be deferred to v1.1. For v1, the preloaded sensors are sufficient. The version dropdown should still appear in the UI (showing available dates from the index sensor), but clicking a non-latest version shows a message like "Load previous versions via the file editor" until on-demand loading is implemented.

**Decision for Claude Code:** Implement the preloaded sensors for v1. The version dropdown UI should be built but only the latest report is actually loadable. Wire up on-demand loading in a follow-up.

### Sensor Package File

Create as: `/config/packages/dashboard/report_viewer.yaml`

This package contains all the sensors, input helpers, and recorder exclusions for the report viewer card. Follow the existing package pattern — see how `packages/occupancy/presence_activity_card.yaml` structures its helpers.

---

## 3. Report Structure Analysis

### Filename Convention

All reports follow: `YYYY-MM-DD-HH-MM-{type}.md`

Lexicographic sort equals chronological sort — no date parsing needed for ordering. The index sensor sorts descending, so `files[0]` is always the most recent.

### Structural Constants (all four report types)

- Section 1 is always a two-column metadata table (key-value pairs)
- Section 2 is always an Executive Summary
- The final section is always an Evidence Log
- All headings use `##` for sections and `###` for subsections
- Tables are the primary data carrier
- Code blocks include language hints (yaml, bash, python, json, jinja2)
- Citation format is consistent: `path:line` or `path:line-range`

### Per-Report Structures

#### Config-Intel (14 sections)

Table-dominant. Severity columns (Critical/High/Medium/Low). Status columns (Matches/Drift/Resolved/Unchanged/Worsened/New). Confidence labels in brackets (`[snapshot]`, `[registry-based]`, `[best-effort pattern matching]`). Strikethrough (`~~text~~`) for resolved items — this is semantic state, not decoration. Seven subsections under Implementation Quality (7a–7g). Code blocks with language hints.

#### Meta-Insights (7 sections)

Prose-dominant with structured sub-blocks per insight. Each insight has nested structure: Evidence (bulleted citations), Latent Potential (prose), Verification Required (conditional), Why This Wasn't Obvious (prose), Implementation Sketch (prose/code), Tradeoffs (prose). Candidates Not Included table is auxiliary context. System Capability Profile is prose per subsystem.

#### Failure-Mode (11 sections)

Mixed tables and prose. Unique content: cascade maps — indented tree diagrams with `?` arrows inside code blocks:

```
binary_sensor.presence_home [unavailable]
  ? automation.lights_presence (trigger: state) [packages/lighting/presence.yaml:12]
  ? light.living_room (action: turn_off) [packages/lighting/presence.yaml:28]
  ? [STOP: leaves HA at device]
```

These are not standard code and should not get syntax highlighting. Section 10 (Cascade Trace Template) is reference material — good candidate for default-collapsed state. Tier column (Tier 1 provable / Tier 2 structurally possible). Detectability column.

#### Shared-UI Audit (12 sections)

Table-dominant. Component Inventory table uses `?/?/Partial` symbols. Conformance Findings table has Confidence column (High/Medium/Low). Architectural Assessment is prose. Documentation Drift table. Gaps and Redundancy table with Type column (Planned-not-implemented / Implemented-not-documented / Redundant / Orphaned).

### Structural Variables

| Property | Config-Intel | Meta-Insights | Failure-Mode | Shared-UI Audit |
|----------|-------------|---------------|--------------|-----------------|
| Sections | 14 | 7 | 11 | 12 |
| Table:Prose ratio | 85:15 | 30:70 | 55:45 | 75:25 |
| Unique content | strikethrough state, 7x subsections | nested insight blocks | cascade trees | ?/?/Partial symbols |
| Default-collapse candidates | Evidence Log | Candidates Not Included, Evidence Log | Cascade Trace Template, Evidence Log | Evidence Log |

---

## 4. Features — Tier 1 (v1 Core)

### 4.1 Folder Scanner & Navigation

The card reads the index sensor and builds a tab bar from discovered categories. Empty categories (no files or no folder) are hidden — the tab does not appear. Adding a new report type means creating a folder and generating a report; the tab appears on next sensor refresh.

Tab bar should consume the visual language of the shared UI (see `spec.md` for tab patterns if defined, otherwise follow the PAC settings tab styling: `pac-settings-tabs` and `pac-settings-tab` classes). Tabs are auto-populated, not hardcoded.

### 4.2 Version Selector

Inline in the tab bar row, right-aligned. Compact dropdown showing just the date portion extracted from the filename (`2026-02-10 16:05`). Defaults to most recent — no interaction needed. Hidden when only one report exists in a category.

For v1: UI is built and populated from the index sensor, but only the latest (preloaded) report is loadable. Non-latest entries are visually present but disabled/greyed with a tooltip explaining they'll be available in a future update.

### 4.3 Markdown Rendering

Use **markdown-it** as the parser. More extensible than marked.js, better plugin ecosystem.

Required plugins/features:
- Tables (core, enabled by default)
- Strikethrough (`~~text~~` — core plugin, enable explicitly)
- Fenced code blocks with language hints (core)
- Task lists (if present in reports — check)

**Do NOT use the built-in HA markdown card.** This is a custom renderer inside Shadow DOM.

Bundle a minified copy in `www/vendor/`. No CDN, no external runtime dependency. markdown-it is ~100KB minified.

### 4.4 Syntax Highlighting

Use **Prism** for code block syntax highlighting. Lighter than highlight.js, better YAML and Jinja2 support.

Required language packs: YAML, bash/shell, Python, JSON, Jinja2.

Load Prism with only the needed languages. Bundle in `www/vendor/` alongside markdown-it.

Prism theme: build a custom theme using the design tokens from `foundation.js`. The code block background should use `var(--ui-elevated-2)` or similar surface token, with syntax colours derived from the existing palette. Do not use Prism's default themes — they won't match the dark UI.

### 4.5 Table Styling

Tables are the primary content format. They need first-class styling, not browser defaults.

- Full-width within the content area
- Token-driven colours: `var(--ui-border-color-light)` for borders, `var(--ui-elevated-1)` for header row background, `var(--ui-surface)` for body
- Horizontal scroll on overflow (some tables have 8+ columns)
- Compact cell padding using space tokens
- Header row visually distinct (weight, background, border)
- Striped rows optional — test both and decide

### 4.6 Table of Contents (ToC)

Left-anchored collapsible panel. Adapted from the PAC settings drawer pattern.

**What to reuse from PAC:**
- Absolute positioning over content (`position: absolute; top: 0; left: 0; bottom: 0`)
- Backdrop scrim (`var(--ui-overlay-scrim)`)
- Elastic slide-in animation (mirror the `pac-drawer-open` keyframes for left-side entry)
- Close on backdrop click
- `max-width: 85%` guard
- `var(--ui-elevated-2)` surface

**What to change:**
- Slides from **left** (not right) — ToC is document structure, left-anchored navigation is convention
- Width: **240px** (narrower than PAC's 288px — heading text with indent levels doesn't need settings-width controls)
- Click behaviour: **scroll to section AND close the panel** (not stay open like settings). ToC is point-and-go, not configure-and-adjust
- Trigger button: top-**left** (not top-right), following the panel's slide direction. Same hover-reveal opacity pattern as the PAC settings cog

**ToC generation:**
- Parse rendered HTML for `h2` and `h3` elements
- Build a nested list: `h2` entries at top level, `h3` entries indented beneath their parent `h2`
- Each entry is clickable, scrolls to the corresponding heading with `scrollIntoView({ behavior: 'smooth', block: 'start' })`
- Active section highlighting: track scroll position and highlight the current section in the ToC
- Respect `prefers-reduced-motion` for scroll behaviour

### 4.7 Collapsible Sections

Click any `##` heading to fold everything beneath it until the next `##`. Click any `###` heading to fold until the next `###` or `##`.

- localStorage persistence keyed by report category + section heading (fold states survive refresh)
- Collapse-all / expand-all toggle in the card toolbar
- Staggered animation using existing motion tokens (`var(--ui-motion-fast)`)
- Chevron indicator on headings showing fold state (rotates on toggle)
- Respect `prefers-reduced-motion`

**Default-collapsed sections:**
- Evidence Log (all report types)
- Candidates Not Included (meta-insights)
- Cascade Trace Template (failure-mode)

Detect these by heading text match. The heading text is stable across report versions because the prompts define fixed section names.

### 4.8 Copy Functionality

Three levels:

1. **Full document copy** — button in the card toolbar. Copies the raw markdown source (not rendered HTML). Shows toast confirmation via `showToast()`.

2. **Per-section copy** — small copy icon appears on `##` heading hover (same opacity-on-hover pattern as the settings cog: invisible by default, 0.4 on container hover, 1.0 on icon hover). Copies raw markdown from that heading to the next heading of equal or higher level.

3. **Per-code-block copy** — copy button on each rendered code block. Use the existing `handleCopyButton` pattern from `components.js`.

### 4.9 Compact Metadata Header

Parse the section 1 metadata table (always two-column key-value) and render it as a compact card header instead of a full-width table. This is the report's identity bar — report type, date, key parameters — rendered as a tight horizontal or wrapped layout above the content.

Display the metadata inline (key: value pairs separated by dividers or in a subtle pill layout) rather than as a markdown table. The full table remains in the markdown for copy operations, but the visual rendering should be more space-efficient.

---

## 5. Features — Tier 2 (Semantic Enhancement)

These build on the core renderer and add report-aware intelligence.

### 5.1 Severity Badges

Detect table cells containing exactly: `Critical`, `High`, `Medium`, `Low`.

Render as colour-coded badges using semantic tokens from the design system:
- Critical: error colour (check `foundation.js` for `--ui-status-error` or equivalent)
- High: warning colour
- Medium: accent or info colour
- Low: muted/subtle colour

Implementation: post-process rendered table HTML. Find `<td>` elements whose `textContent.trim()` matches the severity vocabulary. Wrap content in a `<span class="rvc-badge rvc-badge--critical">` (or similar) with background colour from tokens.

### 5.2 Status Badges

Same pattern as severity, different vocabulary:
- `Matches` / `Validated` / `Complete` / `Resolved` ? success/green
- `Drift` / `Partial` / `Unchanged` ? warning/amber
- `Worsened` / `Missing` / `New` ? error/red
- `Not documented` / `Not executed` ? muted/grey

Also detect `?` / `?` / `Partial` in shared-ui-audit component inventory tables.

### 5.3 Resolved Item Dimming

Detect `<del>` elements (rendered from `~~strikethrough~~`) in table rows. Offer a toggle in the card toolbar: "Show resolved" / "Hide resolved". When hidden, rows containing `<del>` content are either removed from the DOM or set to `display: none`. Show a count badge: "3 resolved hidden".

Default state: shown but dimmed (reduced opacity, e.g., 0.5).

### 5.4 Cascade Tree Styling

Detect code blocks in failure-mode reports that contain the `?` pattern (cascade maps). These should NOT get syntax highlighting from Prism.

Detection heuristic: a fenced code block (no language hint, or language hint of `text`) where 50%+ of non-empty lines contain `?` or start with whitespace followed by `?`.

Render with distinct visual treatment:
- Entity names (anything before `[` or `(`) in the text's strong colour
- Arrow `?` in accent colour
- Edge type annotations `(trigger: state)` in muted colour
- Citation brackets `[path:line]` in subtle monospace
- Indentation preserved with connecting lines (like a tree view)

### 5.5 Citation Styling

Detect inline code spans matching citation patterns:
- `path/to/file.yaml:42` (path:line)
- `path/to/file.yaml:42-47` (path:line-range)
- `.storage/lovelace.dashboard_home:/views/2/cards/5#js3` (JSON pointer)

Render with consistent monospace styling and subtle background. Don't linkify — there's nowhere useful to link to from the dashboard.

---

## 6. Card Configuration

```yaml
type: custom:report-viewer-card
index_sensor: sensor.report_index
content_sensors:
  config-intel: sensor.report_content_config_intel
  meta-insights: sensor.report_content_meta_insights
  failure-mode: sensor.report_content_failure_mode
  shared-ui-audit: sensor.report_content_shared_ui_audit
  components-review: sensor.report_content_components_review
  project-audit: sensor.report_content_project_audit
default_category: config-intel
toc: true
collapsible: true
severity_badges: true
status_badges: true
resolved_toggle: true
```

All options except `index_sensor` and `content_sensors` should have sensible defaults (all true, default_category falls back to first available category).

---

## 7. UI Layout

### Overall Structure

```
+----------------------------------------------+
¦ [=]  Tab Bar: config-intel | insights | ...  ¦ ? ToC trigger (left), tabs (center), version dropdown (right)
¦      [metadata header: date, path, params]   ¦ ? Compact metadata from section 1
+----------------------------------------------¦
¦ [toolbar: collapse-all | expand-all | copy]  ¦ ? Resolved toggle here too
+----------------------------------------------¦
¦                                              ¦
¦  ## Executive Summary                     [?]¦ ? Section copy icon on hover
¦  4-6 sentences of prose...                   ¦
¦                                              ¦
¦  ## System Metrics                        [?]¦
¦  +------------------------------+            ¦
¦  ¦ Metric ¦ Observed ¦ Status   ¦            ¦
¦  +--------+----------+----------¦            ¦
¦  ¦ YAML   ¦ 12,450   ¦ Matches  ¦ ? badge   ¦
¦  +------------------------------+            ¦
¦                                              ¦
¦  ? ## Evidence Log (collapsed by default)    ¦
¦                                              ¦
+----------------------------------------------+
```

### ToC Panel (when open)

```
+----------------------------------------------+
¦ ToC         ¦ (dimmed content behind scrim)   ¦
¦             ¦                                 ¦
¦ 1. Metadata ¦                                 ¦
¦ 2. Summary  ¦? active                         ¦
¦ 3. Metrics  ¦                                 ¦
¦    3a. Sub  ¦                                 ¦
¦ 4. Docs     ¦                                 ¦
¦ ...         ¦                                 ¦
¦             ¦                                 ¦
¦ [x close]   ¦                                 ¦
+----------------------------------------------+
```

### Card Container

- `var(--ui-surface)` background
- `var(--ui-radius-xl)` border radius
- `overflow: hidden` on container
- Content area scrolls independently (not the whole card)
- Min-height to prevent collapse when loading

---

## 8. Styling Rules

### Token Consumption

Every visual value must trace to a foundation.js token. No hardcoded `px`, `hex`, `rgb`, or timing values except where documented as intentional micro-adjustments.

Check `spec.md` for the token naming convention and available tokens. Key categories:
- Space: `--ui-space-1` through `--ui-space-12`
- Typography: `--ui-font-xs` through `--ui-font-xl`, weights, line heights
- Colours: `--ui-text`, `--ui-text-strong`, `--ui-text-mute`, surface levels, border colours
- Motion: `--ui-motion-fast`, `--ui-motion-med`
- Geometry: `--ui-radius-s` through `--ui-radius-xl`, border widths

### Touch Targets

All interactive elements (tab buttons, ToC entries, toolbar buttons, copy icons) must meet the 48px minimum touch target. Use the PAC pattern: visual content stays compact, touch target achieved via padding/min-height.

### Dark Theme

The system is dark-themed. All surfaces, text, and borders use dark theme tokens. There is no light theme to support (theme equality means both themes are defined in foundation.js, but the dashboard uses dark).

### Reduced Motion

All animations must respect `prefers-reduced-motion: reduce`. Use the same media query pattern as PAC:

```css
@media (prefers-reduced-motion: reduce) {
  .rvc-toc-panel,
  .rvc-section--collapsing {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
```

### CSS Class Prefix

Use `rvc-` (report-viewer-card) for all card-specific classes to avoid collision with shared UI classes.

---

## 9. Rendering Pipeline

```
Raw markdown (from sensor attribute)
  ?
markdown-it parse ? HTML string
  ?
Insert into Shadow DOM container
  ?
Post-processing passes:
  1. Extract metadata table ? render as compact header
  2. Apply Prism highlighting to code blocks (skip cascade trees)
  3. Detect severity/status vocabulary in table cells ? add badge classes
  4. Detect strikethrough in table rows ? add resolved class
  5. Detect cascade tree code blocks ? add tree styling classes
  6. Generate ToC from h2/h3 elements
  7. Attach collapsible section handlers to headings
  8. Attach per-section copy handlers
  9. Attach per-code-block copy handlers
  10. Apply default-collapsed state to known sections
  11. Restore localStorage fold states
```

This is a sequential pipeline, not concurrent. Each pass operates on the DOM after insertion. Keep passes idempotent — re-running the pipeline on the same content should produce the same result (important for when the sensor updates and the card re-renders).

---

## 10. Existing Patterns to Follow

### From presence-activity-card

- Constructor pattern: `attachShadow`, config/hass fields, state tracking
- `setConfig()` validation and defaults
- `set hass()` with `applyThemeClass` call
- `connectedCallback()` with `adoptedStyleSheets` assignment
- `disconnectedCallback()` cleanup
- `getCardSize()` for layout hints
- Settings drawer: animation, backdrop, close-on-backdrop, tab switching
- Hover-reveal trigger button (settings cog pattern ? adapt for ToC trigger)
- localStorage persistence (adapt from `_settings` pattern for fold states)
- Card-specific `CSSStyleSheet` created via `new CSSStyleSheet()` + `replaceSync()`

### From components.js

- `handleCopyButton` for code block copy
- Collapsible section animation pattern (adapt for heading-level collapse)
- Staggered animation timing

### From helpers.js

- `applyThemeClass(this, hass)` — call in `set hass()`

---

## 11. Edge Cases

### Empty State

If a category has no reports (or the content sensor returns empty), show a clean centered message: "No reports generated" in muted text. This state should be visually minimal — no icons, no call-to-action, just the text.

### Sensor Unavailable

If a content sensor is `unavailable` or `unknown`, show "Report unavailable" in the content area. Don't hide the tab — the category exists in the index, the content just isn't loadable right now.

### Very Long Reports

Config-intel reports can be 40KB+ with 14 sections. The content area must scroll independently. The ToC is essential for navigation. Collapsible sections reduce cognitive load. The card should not attempt to render the entire report into a single massive DOM tree without virtualization — but given that 40KB of markdown produces maybe 1000–2000 DOM nodes, virtualization is probably unnecessary. Test and verify.

### Markdown Edge Cases

- Tables with `|` in cell content (markdown-it handles this if properly escaped)
- Code blocks inside table cells (rare but possible in evidence logs)
- Nested emphasis inside strikethrough: `~~**bold resolved**~~`
- Very wide tables (8+ columns) — horizontal scroll wrapper required
- Empty table cells — should render as empty, not collapse

### Theme Changes

`applyThemeClass` is called on every `hass` update. If the theme changes mid-session, the card should re-sync. Prism highlighting colours should use CSS custom properties so they respond to theme changes without re-rendering.

---

## 12. What NOT to Build

- **JSON viewer** — components-review outputs JSON, not markdown. Separate concern, separate card. Exclude from v1.
- **Version diffing** — comparing two dated reports side by side. Future feature.
- **Multi-report comparison** — viewing two categories simultaneously. Future feature.
- **Export to PDF** — the markdown source is the export format. Copy button is sufficient.
- **Annotation/commenting** — not a collaboration tool.
- **Full-text search** — deferred to v1.1. The ToC and collapsible sections handle navigation for v1.
- **On-demand file loading** — deferred to v1.1. Preloaded latest is sufficient for v1.
- **Report freshness indicator** — deferred. Nice to have but not core.

---

## 13. Build Order

1. **Sensor package** — Create `/config/packages/dashboard/report_viewer.yaml` with index sensor and content sensors. Verify they populate correctly.

2. **Card skeleton** — Shadow DOM, `adoptedStyleSheets`, `setConfig`, `set hass`, empty render. Verify it appears on dashboard.

3. **Tab bar + index** — Read index sensor, render category tabs, switch between them. Verify tab switching works with empty content areas.

4. **Markdown rendering** — Integrate markdown-it, render content from sensors into the active tab's content area. Verify basic markdown renders correctly (headings, paragraphs, code blocks, tables).

5. **Table styling** — Apply token-driven table styles. Verify tables look correct with the dark theme.

6. **Syntax highlighting** — Integrate Prism, apply to fenced code blocks. Verify YAML and Python highlighting works. Build custom Prism theme from tokens.

7. **Collapsible sections** — Heading click handlers, fold/unfold animation, localStorage persistence, default-collapsed sections. Verify fold states survive page refresh.

8. **ToC panel** — Left-anchored drawer, generated from headings, click-to-scroll-then-close. Verify navigation works on a 14-section report.

9. **Copy functionality** — Full document, per-section, per-code-block. Verify toast feedback.

10. **Metadata header** — Parse section 1 table, render as compact header. Verify across all four report types.

11. **Semantic badges** — Severity, status, resolved dimming. Verify detection accuracy across report types.

12. **Cascade tree styling** — Detect and style failure-mode cascade maps. Verify they don't interfere with normal code blocks.

13. **Version dropdown** — Read index sensor for historical files, render dropdown, disable non-latest entries for v1.

14. **Polish** — Touch targets, reduced motion, edge cases, theme change handling.

---

## 14. Acceptance Criteria

The card is complete when:

1. All four markdown report types render correctly with proper heading hierarchy, tables, code blocks, and inline formatting
2. Tab switching between categories is instant (preloaded sensors)
3. ToC panel opens from left, lists all sections, click scrolls to section and closes panel
4. Sections collapse/expand on heading click with localStorage persistence
5. Severity and status badges render with correct colours in table cells
6. Strikethrough content is detected and the resolved toggle works
7. Copy works at all three levels (document, section, code block) with toast feedback
8. Metadata section 1 renders as a compact header, not a full-width table
9. Code blocks have syntax highlighting (except cascade trees)
10. All interactive elements meet 48px touch target
11. All visual values trace to foundation.js tokens
12. Reduced motion is respected
13. Empty states render cleanly
14. Version dropdown appears with historical dates (even if only latest is loadable in v1)