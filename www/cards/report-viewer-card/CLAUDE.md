# CLAUDE - Report Viewer Card

> **Scope:** Markdown document viewer — renders intelligence reports with tabbed navigation, syntax highlighting, semantic badges, collapsible sections, ToC drawer, and three-level copy
> **Last reviewed:** 2026-04
> **Read root CLAUDE.md and www/base/docs/CLAUDE.md first for session protocol and UI governance rules**

---

## Summary

A two-file Web Component that renders large-scale intelligence reports (10–40KB markdown) stored in `docs/reports/`. Reports are loaded from HA sensor attributes (latest version) or fetched directly via HTTP (historical versions). The card provides category tabs auto-populated from an index sensor, a version dropdown, full markdown rendering via markdown-it with Prism syntax highlighting, a 10-pass post-processing pipeline (metadata extraction, badges, cascade trees, resolved rows, collapsible sections, ToC, copy buttons), and a shared-drawer ToC panel. Designed to handle four distinct report types — each with different structural conventions — without type-specific code paths.

---

## Structure

| File | Purpose |
|------|---------|
| `report-viewer-card.js` | Entry point and card class. Editor stub, styles, rendering pipeline, tab/version navigation, ToC, collapsible sections, badge detection, cascade tree parsing, copy handlers, metadata extraction. |
| `markdown-renderer.js` | Markdown-it + Prism loader. Dynamically loads vendor scripts from `www/vendor/`, configures markdown-it instance, exports `initRenderer()`, `renderMarkdown()`, `highlightCodeBlocks()`, `isCascadeTree()`. |
| `SPEC.md` | Original build specification. Comprehensive reference covering data layer design, report structure analysis, feature tiers, and acceptance criteria. The code is authoritative where it diverges. |

**Companion YAML:** `packages/dashboard/report_viewer.yaml` — 1 index sensor + 6 content sensors + recorder exclusion.

**Vendor dependencies (in `www/vendor/`):** `markdown-it.min.js`, `prism-core.min.js`, `prism-markup.min.js`, `prism-markup-templating.min.js`, `prism-yaml.min.js`, `prism-python.min.js`, `prism-bash.min.js`, `prism-json.min.js`, `prism-jinja2.min.js`.

---

## Key Components

### Data Layer

**Index sensor** (`sensor.report_index`) scans `docs/reports/` subdirectories, discovers categories with `.md` files, and returns a `{ index: { category: [files...] } }` attribute. Files are sorted descending (lexicographic = chronological). Also copies files to `www/reports/` for direct HTTP access. Refreshes hourly.

**Content sensors** (6, one per category) each read the most recent `.md` file and store the full markdown in a `content` attribute. State is a timestamp (markdown exceeds the 255-char state limit). All `sensor.report_*` entities are excluded from the recorder.

**Version switching:** Latest reports come from preloaded sensor attributes (instant). Non-latest versions are fetched directly via `fetch()` from the `reports_path` config (`/local/reports` default, mapped to `www/reports/` via the index sensor's copy step).

### Card Config

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
default_category: config-intel  # optional, falls back to first available
toc: true                       # optional, default true
collapsible: true               # optional, default true
severity_badges: true           # optional, default true
status_badges: true             # optional, default true
resolved_toggle: true           # optional, default true
```

### Tab Navigation

Tabs are auto-populated from the index sensor — only categories that have both `.md` files in the index AND a configured content sensor appear. Adding a new report type requires only creating a folder and generating a report; the tab appears on next sensor refresh. Tab switching between preloaded categories is instant.

### Version Dropdown

Right-aligned in the tab row. Shows dates extracted from filenames (`YYYY-MM-DD HH:MM`). Hidden when only one version exists. Selecting a non-latest version triggers a direct `fetch()` to load the file. Uses the shared `ui-menu` component.

### Rendering Pipeline

Content goes through a sequential 10-pass post-processing pipeline. Each pass is wrapped in try/catch so one failure doesn't break the rest:

1. **Metadata extraction** — parses first table (2-column key-value) or bold-key paragraphs into a compact grid header; source elements hidden but kept in DOM for copy
2. **Table wrapping** — wraps all `<table>` elements in scroll containers (`rvc-table-wrap`) for horizontal overflow
3. **Syntax highlighting** — Prism applied to fenced code blocks (skips cascade trees)
4. **Cascade tree styling** — detects `→` arrow patterns in code blocks, parses into entity/arrow/meta/ref/stop spans
5. **Resolved row dimming** — detects `<del>` in table rows, adds `rvc-resolved-row` class (0.5 opacity)
6. **Semantic badges** — severity (Critical/High/Medium/Low) and status (20+ vocabulary words) detected in table cells, wrapped in colored badge spans
7. **ToC generation** — builds button list from h2/h3 headings for the drawer panel
8. **Collapsible sections** — wraps content after h2/h3 in toggle containers, applies localStorage fold state
9. **Code copy buttons** — hover-reveal copy button on each `<pre>` block
10. **Section copy buttons** — copy icon appended to each h2 heading, copies raw markdown of that section

### Metadata Header

Two extraction strategies (tried in order):
1. **Two-column table** — first table with exactly 2 header cells → rows become key-value pairs
2. **Bold-key lines** — `**Key:** Value` patterns in paragraphs/blockquotes before the first h2

Rendered as a compact 2-column CSS grid (`rvc-metadata`) above the content. Source elements are hidden via `display: none` but remain in DOM so full-document copy includes them.

### Semantic Badges

**Severity** (exact match, case-insensitive): Critical → error, High → warning, Medium → info, Low → muted.

**Status** (startsWith rules, case-insensitive): ~20 vocabulary words mapped to success/warning/error/muted. Includes `✓`/`✗` unicode symbols. Cells containing `<del>` are skipped (resolved row dimming takes priority).

### Cascade Tree Styling

Detects code blocks where 50%+ of non-empty lines contain `→` (failure-mode report cascade maps). These are exempt from Prism highlighting. Parsed into styled spans:
- `rvc-cascade-entity` — entity names (text-strong)
- `rvc-cascade-arrow` — `→` characters (accent)
- `rvc-cascade-meta` — bracket metadata (text-mute)
- `rvc-cascade-ref` — file path references (text-mute, reduced opacity)
- `rvc-cascade-stop` — `[STOP:...]` markers (warning, bold)

### Collapsible Sections

h2 and h3 headings are clickable toggles. Content between a heading and the next heading of equal/higher level is wrapped in a `rvc-section-content` container with max-height transition.

**localStorage persistence:** keyed by `rvc-fold:{category}:{headingText}`. States survive page refresh.

**Default-collapsed sections** (matched case-insensitively): "evidence log", "candidates not included", "cascade trace template".

CSS triangle chevron rotates from 90° (expanded) to 0° (collapsed).

### Table of Contents

Uses the shared `drawer.js` component (`openDrawer`/`closeDrawer`). Populated with buttons for each h2 and h3 heading. h3 entries are indented. Clicking an entry:
1. Expands the section if collapsed
2. Scrolls to the heading (`scrollIntoView`, respects reduced motion)
3. Closes the drawer

### Copy Functionality

Three levels, all using `handleCopyButton` from `components.js`:
1. **Full document** — copies raw markdown source (toolbar button)
2. **Per-section** — copies raw markdown from h2 to next h2 (icon appended to heading)
3. **Per-code-block** — copies code text (hover-reveal button on `<pre>`)

### Refresh

Toolbar button calls `homeassistant.update_entity` on all configured sensors (index + content). Spin animation (0.6s) on the refresh icon during the call. Forces content and index cache invalidation after completion.

### Prism Theme

Token-driven syntax highlighting theme — all colors from `foundation.js` semantic tokens:
- Keywords → `--ui-info`
- Strings → `--ui-success`
- Numbers/booleans → `--ui-warning`
- Properties/tags → `--ui-accent`
- Comments → `--ui-text-mute` (italic)
- Deleted → `--ui-error`

### Container Layout

Full viewport height minus header: `height: calc(100dvh - var(--header-height, 56px) - 10 * var(--ui-space-3))`. Content area scrolls independently. Tab row and toolbar are sticky.

---

## Shared UI System Integration

### What It Uses

| Import | Usage |
|--------|-------|
| `foundation.js` | Tokens — via `window.uiFoundation` adopted stylesheet |
| `components.js` | `uiComponents` — card header, tab bar (pill variant), buttons, copy buttons, menu. Also `handleCopyButton` utility function. |
| `skeletons.js` | `uiSkeletons` — `ui-skeleton-reveal` class for content entry |
| `drawer.js` | `uiDrawer` stylesheet + `openDrawer()`/`closeDrawer()` — ToC panel |
| `helpers.js` | `applyThemeClass` — theme sync on `set hass()` |
| `utilities.js` | `escapeHtml` — used in badge application and cascade tree rendering |

### What It Does NOT Use

- `toggles.js`, `checkboxes.js`, `radios.js` — no form controls
- `number-input.js` — no numeric inputs
- `tooltips.js` — no info icons or rich tooltips
- `toasts.js`, `screen-border.js` — copy feedback uses `handleCopyButton`'s built-in checkmark animation
- `modals.js` — no modals

### Design System Violations

| Issue | Current | Notes |
|-------|---------|-------|
| Collapsible chevron | `5px × 4px` CSS triangle borders | Sub-token geometry for a minimal directional indicator — no icon token at this scale |
| Badge padding | `0.1em 0.5em` | Em-relative, not token-driven — scales with context font size for inline table badges |
| Badge font-size | `0.9em` | Relative sizing for inline table context |
| Blockquote border-left | `3px solid var(--ui-accent)` | Between `--ui-border-width-s` (1px) and `--ui-border-width-m` (2px) — 3px is markdown convention |
| Cascade tree border-left | `3px solid var(--ui-accent)` | Same as blockquote — consistent accent-line weight |
| Table scroll max-height | `50vh` | Viewport-relative — no token for scroll container height |
| Container height | `calc(100dvh - var(--header-height, 56px) - 10 * var(--ui-space-3))` | Dynamic viewport calculation — inherently card-specific |
| Empty cell pseudo-content | em-dash (`\2014`) at 0.4 opacity | Visual placeholder — no shared pattern for empty table cells |
| Refresh spin animation | `0.6s ease-in-out` | One-shot rotation — no token for single-rotation animations |
| Code font stack | `'SF Mono', 'Cascadia Code', 'Fira Code', monospace` | Explicit monospace stack — no `--ui-font-mono` token exists |
| Version trigger padding | `var(--ui-space-1) var(--ui-space-3)` | Compact vertical padding for inline dropdown trigger |
| Sticky table headers | `position: sticky; top: 0; z-index: 1` | Positional — necessary for scrollable table usability |

---

## Development Workflows

### Adding a New Report Category

1. Create a subdirectory under `docs/reports/<category-name>/`
2. Generate a `.md` report into that directory (filename: `YYYY-MM-DD-HH-MM-<type>.md`)
3. Add a content sensor in `packages/dashboard/report_viewer.yaml` (copy an existing one, update the glob path)
4. Add the category mapping to the card's `content_sensors` config
5. The tab appears automatically on next hourly sensor refresh (or manual refresh)

### Adding a New Default-Collapsed Section

Add the heading text (lowercase) to the `DEFAULT_COLLAPSED` array in `report-viewer-card.js`. Matching is case-insensitive with `includes()`.

### Adding a New Badge Vocabulary

- **Severity:** Add to `SEVERITY_MAP` (exact match, lowercase key → badge class suffix)
- **Status:** Add to `STATUS_RULES` array (test function + class). Order matters — first match wins

### Testing Changes

1. Switch between category tabs — content loads instantly from sensors
2. Select a non-latest version from dropdown — verify file fetch and rendering
3. Verify metadata header extraction on each report type (table vs bold-key format)
4. Click h2/h3 headings — sections collapse/expand, chevron rotates
5. Refresh page — verify fold states persist via localStorage
6. Open ToC drawer — verify entries match headings, click scrolls and closes
7. Hover code block — verify copy button appears, click copies content
8. Verify severity/status badges render correctly in table cells
9. Verify cascade trees in failure-mode reports get styled markup, not Prism highlighting
10. Verify strikethrough rows are dimmed (0.5 opacity)
11. Click refresh button — verify spin animation, sensors update
12. Copy full document — verify raw markdown (not HTML) is copied
13. Light/dark themes — verify all elements adapt
14. Reduced motion — verify all animations/transitions suppressed

---

## Conventions for AI Assistants

### Anti-Patterns

- Don't re-render content on every `set hass()` — content updates are gated by `_lastContentKey` comparison. Only re-render when the sensor state timestamp changes or the active category/version changes
- Don't apply Prism highlighting to cascade trees — `isCascadeTree()` in `markdown-renderer.js` detects them via the `→` heuristic (50%+ of non-empty lines)
- Don't remove the `_run()` try/catch wrappers in the post-processing pipeline — one failing pass must not prevent the others from running
- Don't modify `markdown-renderer.js` to import HA-specific modules — it's intentionally framework-agnostic (only depends on vendor scripts)
- Don't hardcode report categories — tabs are auto-populated from the index sensor. Adding a new type should require zero card code changes
- Don't read report content from sensor state — content is in attributes (`state_attr(..., 'content')`). State is a timestamp only (255-char HA limit)
- Don't add `sensor.report_*` entities without recorder exclusion — 10-40KB of markdown per sensor per hourly refresh will bloat the database
- Don't remove source elements after metadata extraction — they are hidden (`display: none`) but kept in DOM so full-document copy includes the original table
- Don't apply badges to cells containing `<del>` — resolved row dimming takes priority over status badges
- Don't load Prism language packs out of order — `markup` must load before `markup-templating`, which must load before `jinja2`

### Coupling

**Upstream (data source):**
- `sensor.report_index` — index sensor with `index` attribute (category → files mapping)
- `sensor.report_content_{category}` — 6 content sensors with `content` + `filename` attributes
- `packages/dashboard/report_viewer.yaml` — sensor definitions + recorder exclusion
- `docs/reports/` — source markdown files (categories = subdirectories)
- `www/reports/` — copied files for direct HTTP access (non-latest version fetch)

**Vendor scripts:**
- `www/vendor/markdown-it.min.js` — markdown parser (~100KB)
- `www/vendor/prism-*.min.js` — syntax highlighting (core + 7 language packs)

**Shared UI system:**
- `www/base/foundation.js` — tokens
- `www/base/components.js` — `uiComponents`, `handleCopyButton`
- `www/base/skeletons.js` — `uiSkeletons`
- `www/base/drawer.js` — `uiDrawer`, `openDrawer`, `closeDrawer`
- `www/base/helpers.js` — `applyThemeClass`
- `www/base/utilities.js` — `escapeHtml`

**Consumed by:**
- Dashboard views that include `custom:report-viewer-card`

### Cross-References

- Root: `/CLAUDE.md`
- UI governance: `/www/base/docs/CLAUDE.md`
- Dashboard domain: `/packages/dashboard/CLAUDE.md`
- Sensor package: `/packages/dashboard/report_viewer.yaml`
- Build specification: `/www/cards/report-viewer-card/SPEC.md`
- Report source files: `/docs/reports/`
- Architecture: `/ARCHITECTURE.md`

---

## TODOs & Gaps

- **Editor is a stub** — `ReportViewerCardEditor` shows "Configure this card in YAML." with no actual form. Sensor entity IDs must be configured manually.
- **No active ToC highlighting** — ToC entries have an `is-active` class defined in CSS but no scroll-position tracking is implemented to set it.
- **No expand-all / collapse-all toggle** — the SPEC calls for a toolbar toggle, but it's not implemented. Individual heading clicks are the only fold control.
- **No resolved toggle** — the SPEC defines a "Show resolved / Hide resolved" toggle with count badge. Currently, resolved rows are always shown at 0.5 opacity with no way to fully hide or restore them.
- **No report freshness indicator** — deferred from SPEC.
- **No full-text search** — deferred to v1.1 per SPEC.
- **Version dropdown click-outside listener is per-render** — `_updateVersionDropdown` adds a click listener to `shadowRoot` on every call without removing previous listeners. Multiple tab switches accumulate listeners (minor memory leak).
- **`_fetchAndRenderFile` has no retry** — if the direct file fetch fails, the user must manually retry by re-selecting the version.

---

## Changelog

| Date | Commit | Change |
|------|--------|--------|
| 2026-04-11 | — | Initial CLAUDE.md created |

*Last Updated: 2026-04-11*
