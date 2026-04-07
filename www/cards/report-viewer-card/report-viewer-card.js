/**
 * Report Viewer Card v1
 *
 * Renders intelligence reports stored as markdown files.
 * See SPEC.md in this directory for the full build specification.
 */

import { applyThemeClass } from '/local/base/helpers.js';
import { uiComponents, handleCopyButton } from '/local/base/components.js';
import { uiSkeletons } from '/local/base/skeletons.js';
import { initRenderer, renderMarkdown, highlightCodeBlocks, isCascadeTree } from './markdown-renderer.js';
import { escapeHtml } from '/local/base/utilities.js';
import { uiDrawer, openDrawer, closeDrawer } from '/local/base/drawer.js';

/**
 * Format a category slug into a display name.
 * "config-intel" → "Config Intel"
 */
function formatCategoryName(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Extract a display date from report filename.
 * "2026-02-10-16-05-config-intel.md" → "2026-02-10 16:05"
 */
function formatVersionDate(filename) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})-(\d{2})-(\d{2})/);
  if (!m) return filename;
  return `${m[1]} ${m[2]}:${m[3]}`;
}

/**
 * Severity vocabulary → badge class suffix (exact match)
 */
const SEVERITY_MAP = {
  'critical': 'critical',
  'high': 'high',
  'medium': 'medium',
  'low': 'low',
};

/**
 * Status vocabulary → badge class suffix
 * Checked with startsWith for partial matches like "Drift (+1.1%)"
 */
const STATUS_RULES = [
  // Exact matches first
  { test: t => t === '\u2713', cls: 'success' },
  { test: t => t === '\u2717', cls: 'error' },
  // startsWith matches
  { test: t => t.startsWith('matches'), cls: 'success' },
  { test: t => t.startsWith('validated'), cls: 'success' },
  { test: t => t.startsWith('complete'), cls: 'success' },
  { test: t => t.startsWith('resolved'), cls: 'success' },
  { test: t => t.startsWith('clean'), cls: 'success' },
  { test: t => t.startsWith('good'), cls: 'success' },
  { test: t => t.startsWith('stable'), cls: 'success' },
  { test: t => t.startsWith('improved'), cls: 'success' },
  { test: t => t.startsWith('none found'), cls: 'success' },
  { test: t => t.startsWith('no issues'), cls: 'success' },
  { test: t => t.startsWith('drift'), cls: 'warning' },
  { test: t => t.startsWith('partial'), cls: 'warning' },
  { test: t => t.startsWith('unchanged'), cls: 'warning' },
  { test: t => t.startsWith('minor issues'), cls: 'warning' },
  { test: t => t.startsWith('slight'), cls: 'warning' },
  { test: t => t.startsWith('adequate'), cls: 'warning' },
  { test: t => t.startsWith('mixed'), cls: 'warning' },
  { test: t => t.startsWith('worsened'), cls: 'error' },
  { test: t => t.startsWith('missing'), cls: 'error' },
  { test: t => t.startsWith('needs attention'), cls: 'error' },
  { test: t => t === 'new', cls: 'error' },
  { test: t => t.startsWith('not documented'), cls: 'muted' },
  { test: t => t.startsWith('not executed'), cls: 'muted' },
];

/**
 * Copy icon SVG (matches handleCopyButton's icon)
 */
const COPY_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a 2 2 0 0 1-2-2V4a 2 2 0 0 1 2-2h9a 2 2 0 0 1 2 2v1"></path></svg>';

/**
 * Section headings that should be collapsed by default.
 * Matched case-insensitively against heading text.
 */
const DEFAULT_COLLAPSED = [
  'evidence log',
  'candidates not included',
  'cascade trace template',
];

/* ── Card-specific styles ──────────────────────────────────────────────── */

const cardStyles = new CSSStyleSheet();
cardStyles.replaceSync(`
  :host {
    display: block;
    margin: var(--ui-space-3);
  }

  .rvc-container {
    position: relative;
    background: var(--ui-surface);
    color: var(--ui-text);
    border-radius: var(--ui-radius-l);
    overflow: hidden;
    padding: var(--ui-space-4);
    display: flex;
    flex-direction: column;
    height: calc(100dvh - var(--header-height, 56px) - 10 * var(--ui-space-3));
    box-sizing: border-box;
  }

  .rvc-container .ui-card-actions {
    top: var(--ui-space-4);
    right: var(--ui-space-4);
  }

  /* ── Tab row (bar + version dropdown) ────────────────────────────────── */

  .rvc-tab-row {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: var(--ui-space-2);
    padding-bottom: var(--ui-space-3);
    margin-bottom: var(--ui-space-4);
    padding-right: var(--ui-space-10);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-med);
    flex-shrink: 0;
  }

  /* ── Tab bar overrides (pill variant, matching prompt-manager) ────────── */

  .rvc-tab-row .ui-tab-bar {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .rvc-tab-row .ui-tab-bar::-webkit-scrollbar {
    display: none;
  }

  /* ── Version dropdown (uses shared .ui-menu) ─────────────────────────── */

  .rvc-version-wrap {
    position: relative;
    flex-shrink: 0;
    margin-left: auto;
  }

  .rvc-version-wrap--hidden {
    display: none;
  }

  .rvc-version-trigger {
    display: flex;
    align-items: center;
    gap: var(--ui-space-1);
    padding: var(--ui-space-1) var(--ui-space-3);
    background: transparent;
    border: var(--ui-border-width-s) solid var(--ui-border-color-light);
    border-radius: var(--ui-radius-pill);
    color: var(--ui-text-mute);
    font-family: inherit;
    font-size: var(--ui-font-xs);
    min-height: var(--ui-space-10);
    cursor: pointer;
    transition: border-color var(--ui-motion-fast), color var(--ui-motion-fast);
    white-space: nowrap;
  }

  .rvc-version-trigger:hover {
    border-color: var(--ui-border-color-med);
    color: var(--ui-text);
  }

  .rvc-version-trigger:focus-visible {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: 2px;
  }

  .rvc-version-trigger svg {
    width: 10px;
    height: 10px;
    transition: transform var(--ui-motion-fast);
  }

  .rvc-version-wrap.is-open .rvc-version-trigger svg {
    transform: rotate(180deg);
  }

  .rvc-version-wrap .ui-menu {
    bottom: auto;
    top: calc(100% + var(--ui-menu-offset));
    min-width: 160px;
  }

  /* ── Content area ────────────────────────────────────────────────────── */

  .rvc-content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .rvc-content::-webkit-scrollbar {
    display: none;
  }

  .rvc-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: var(--ui-text-mute);
    font-size: var(--ui-font-m);
  }

  /* ── Rendered markdown ─────────────────────────────────────────────────── */

  .rvc-markdown {
    font-size: var(--ui-font-s);
    color: var(--ui-text);
    line-height: var(--ui-font-line-height-l);
  }

  .rvc-markdown h1 {
    font-size: var(--ui-font-xl);
    font-weight: var(--ui-font-weight-xl);
    color: var(--ui-text-strong);
    margin: var(--ui-space-6) 0 var(--ui-space-3);
    padding-bottom: var(--ui-space-2);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
  }

  .rvc-markdown h1:first-child {
    margin-top: 0;
  }

  .rvc-markdown h2 {
    font-size: var(--ui-font-l);
    font-weight: var(--ui-font-weight-xl);
    color: var(--ui-text-strong);
    margin: var(--ui-space-5) 0 var(--ui-space-2);
    padding-bottom: var(--ui-space-1);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
  }

  .rvc-markdown h3 {
    font-size: var(--ui-font-m);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text-strong);
    margin: var(--ui-space-4) 0 var(--ui-space-2);
  }

  .rvc-markdown h4,
  .rvc-markdown h5,
  .rvc-markdown h6 {
    font-size: var(--ui-font-s);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text-strong);
    margin: var(--ui-space-3) 0 var(--ui-space-1);
  }

  .rvc-markdown p {
    margin: 0 0 var(--ui-space-3);
  }

  .rvc-markdown ul,
  .rvc-markdown ol {
    margin: 0 0 var(--ui-space-3);
    padding-left: var(--ui-space-5);
  }

  .rvc-markdown li {
    margin-bottom: var(--ui-space-1);
  }

  .rvc-markdown li > ul,
  .rvc-markdown li > ol {
    margin-top: var(--ui-space-1);
    margin-bottom: 0;
  }

  .rvc-markdown strong {
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text-strong);
  }

  .rvc-markdown em {
    font-style: italic;
  }

  .rvc-markdown del {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .rvc-markdown hr {
    border: none;
    border-top: var(--ui-border-width-s) solid var(--ui-border-color-light);
    margin: var(--ui-space-4) 0;
  }

  .rvc-markdown a {
    color: var(--ui-accent);
    text-decoration: none;
  }

  .rvc-markdown a:hover {
    text-decoration: underline;
  }

  .rvc-markdown blockquote {
    margin: 0 0 var(--ui-space-3);
    padding: var(--ui-space-2) var(--ui-space-4);
    border-left: 3px solid var(--ui-accent);
    background: var(--ui-elevated-1);
    border-radius: 0 var(--ui-radius-s) var(--ui-radius-s) 0;
    color: var(--ui-text-mute);
  }

  .rvc-markdown blockquote p:last-child {
    margin-bottom: 0;
  }

  /* ── Inline code ───────────────────────────────────────────────────────── */

  .rvc-markdown code {
    font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
    font-size: 0.9em;
    padding: 0.15em 0.4em;
    background: var(--ui-elevated-2);
    border-radius: var(--ui-radius-xs);
    color: var(--ui-text);
  }

  /* ── Code blocks ───────────────────────────────────────────────────────── */

  .rvc-markdown pre {
    margin: 0 0 var(--ui-space-3);
    padding: var(--ui-space-3);
    background: var(--ui-elevated-2);
    border-radius: var(--ui-radius-m);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .rvc-markdown pre::-webkit-scrollbar {
    display: none;
  }

  .rvc-markdown pre code {
    padding: 0;
    background: none;
    border-radius: 0;
    font-size: var(--ui-font-xs);
    line-height: var(--ui-font-line-height-l);
    white-space: pre;
  }

  /* ── Table scroll wrapper ──────────────────────────────────────────────── */

  .rvc-table-wrap {
    overflow-x: auto;
    overflow-y: auto;
    max-height: 50vh;
    margin: 0 0 var(--ui-space-3);
    border-radius: var(--ui-radius-s);
    scrollbar-width: none;
  }

  .rvc-table-wrap::-webkit-scrollbar {
    display: none;
  }

  /* ── Tables ────────────────────────────────────────────────────────────── */

  .rvc-markdown table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--ui-font-xs);
    margin: 0;
  }

  .rvc-markdown th {
    text-align: left;
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text-strong);
    padding: var(--ui-space-2) var(--ui-space-3);
    border-bottom: var(--ui-border-width-m) solid var(--ui-border-color-med);
    background: var(--ui-elevated-1);
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .rvc-markdown td {
    padding: var(--ui-space-2) var(--ui-space-3);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
    vertical-align: top;
  }

  .rvc-markdown td:empty::after {
    content: '\u2014';
    color: var(--ui-text-mute);
    opacity: 0.4;
  }

  .rvc-markdown tr:last-child td {
    border-bottom: none;
  }

  .rvc-markdown tbody tr:hover {
    background: var(--ui-state-hover);
  }

  /* ── Collapsible sections ──────────────────────────────────────────────── */

  .rvc-markdown h2,
  .rvc-markdown h3 {
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: var(--ui-space-2);
  }

  .rvc-markdown h2::before,
  .rvc-markdown h3::before {
    content: '';
    display: inline-block;
    width: 0;
    height: 0;
    border-left: 5px solid currentColor;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    flex-shrink: 0;
    transition: transform var(--ui-motion-fast);
    transform: rotate(90deg);
  }

  .rvc-markdown h2.rvc-collapsed::before,
  .rvc-markdown h3.rvc-collapsed::before {
    transform: rotate(0deg);
  }

  .rvc-section-content {
    overflow: hidden;
    transition: max-height var(--ui-motion-med), opacity var(--ui-motion-fast);
    max-height: none;
    opacity: 1;
  }

  .rvc-section-content.rvc-hidden {
    max-height: 0 !important;
    opacity: 0;
    overflow: hidden;
  }

  /* ── ToC trigger (uses shared .ui-copy-btn inside .ui-card-actions) ──── */

  /* ── ToC backdrop ──────────────────────────────────────────────────────── */

  /* ── ToC drawer overrides ──────────────────────────────────────────────── */

  .rvc-container {
    --ui-drawer-radius: var(--ui-radius-l);
  }

  .ui-drawer__title {
    font-size: var(--ui-font-s);
  }

  .rvc-toc-list {
    padding: var(--ui-space-2) 0;
  }

  .rvc-toc-entry {
    display: block;
    width: 100%;
    background: transparent;
    border: none;
    text-align: left;
    padding: var(--ui-space-2) var(--ui-space-4);
    font-family: inherit;
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
    cursor: pointer;
    transition: background var(--ui-motion-fast), color var(--ui-motion-fast);
    min-height: var(--ui-space-10);
    display: flex;
    align-items: center;
  }

  .rvc-toc-entry:hover {
    background: var(--ui-state-hover);
    color: var(--ui-text);
  }

  .rvc-toc-entry--h3 {
    padding-left: var(--ui-space-8);
    font-size: var(--ui-font-xs);
  }

  .rvc-toc-entry.is-active {
    color: var(--ui-accent);
    font-weight: var(--ui-font-weight-l);
  }

  /* ── Semantic badges ──────────────────────────────────────────────────── */

  .rvc-badge {
    display: inline-block;
    padding: 0.1em 0.5em;
    border-radius: var(--ui-radius-pill);
    font-size: 0.9em;
    font-weight: var(--ui-font-weight-l);
    line-height: 1.4;
    white-space: nowrap;
  }

  .rvc-badge--critical {
    background: var(--ui-error-faint);
    color: var(--ui-error);
  }

  .rvc-badge--high {
    background: var(--ui-warning-faint);
    color: var(--ui-warning);
  }

  .rvc-badge--medium {
    background: var(--ui-info-faint);
    color: var(--ui-info);
  }

  .rvc-badge--low {
    background: var(--ui-state-hover);
    color: var(--ui-text-mute);
  }

  .rvc-badge--success {
    background: var(--ui-success-faint);
    color: var(--ui-success);
  }

  .rvc-badge--warning {
    background: var(--ui-warning-faint);
    color: var(--ui-warning);
  }

  .rvc-badge--error {
    background: var(--ui-error-faint);
    color: var(--ui-error);
  }

  .rvc-badge--muted {
    background: var(--ui-state-hover);
    color: var(--ui-text-mute);
  }

  .rvc-resolved-row {
    opacity: 0.5;
  }

  /* ── Metadata header ──────────────────────────────────────────────────── */

  .rvc-metadata {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--ui-space-1) var(--ui-space-4);
    padding: var(--ui-space-3) var(--ui-space-4);
    margin: 0 0 var(--ui-space-4);
    background: var(--ui-elevated-0);
    border-radius: var(--ui-radius-s);
    font-size: var(--ui-font-xs);
    line-height: var(--ui-font-line-height-m);
  }

  .rvc-meta-key {
    color: var(--ui-text-mute);
    white-space: nowrap;
  }

  .rvc-meta-val {
    color: var(--ui-text);
    font-weight: var(--ui-font-weight-l);
    text-align: right;
  }

  /* ── Copy buttons ───────────────────────────────────────────────────────── */

  .rvc-copy-code {
    position: absolute;
    top: var(--ui-space-1);
    right: var(--ui-space-1);
    width: var(--ui-space-10);
    height: var(--ui-space-10);
    background: var(--ui-elevated-3);
    border: none;
    border-radius: var(--ui-radius-s);
    color: var(--ui-text-mute);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity var(--ui-motion-fast), background var(--ui-motion-fast);
  }

  .rvc-markdown pre {
    position: relative;
  }

  .rvc-markdown pre:hover .rvc-copy-code {
    opacity: 0.7;
  }

  .rvc-copy-code:hover {
    opacity: 1 !important;
    background: var(--ui-elevated-4);
  }

  /* Section copy button — positioned at end of heading row */
  .rvc-copy-section {
    flex-shrink: 0;
    margin-left: auto;
  }

  /* ── Prism syntax theme (token-driven) ─────────────────────────────────── */

  .rvc-markdown .token.comment,
  .rvc-markdown .token.prolog,
  .rvc-markdown .token.doctype,
  .rvc-markdown .token.cdata {
    color: var(--ui-text-mute);
    font-style: italic;
  }

  .rvc-markdown .token.punctuation {
    color: var(--ui-text-mute);
  }

  .rvc-markdown .token.property,
  .rvc-markdown .token.tag,
  .rvc-markdown .token.constant,
  .rvc-markdown .token.symbol {
    color: var(--ui-accent);
  }

  .rvc-markdown .token.boolean,
  .rvc-markdown .token.number {
    color: var(--ui-warning);
  }

  .rvc-markdown .token.selector,
  .rvc-markdown .token.string,
  .rvc-markdown .token.char,
  .rvc-markdown .token.attr-value,
  .rvc-markdown .token.inserted {
    color: var(--ui-success);
  }

  .rvc-markdown .token.operator,
  .rvc-markdown .token.entity,
  .rvc-markdown .token.url {
    color: var(--ui-text);
  }

  .rvc-markdown .token.atrule,
  .rvc-markdown .token.keyword {
    color: var(--ui-info);
  }

  .rvc-markdown .token.function,
  .rvc-markdown .token.class-name {
    color: var(--ui-accent);
  }

  .rvc-markdown .token.attr-name {
    color: var(--ui-warning);
  }

  .rvc-markdown .token.deleted {
    color: var(--ui-error);
  }

  .rvc-markdown .token.important,
  .rvc-markdown .token.bold {
    font-weight: var(--ui-font-weight-l);
  }

  .rvc-markdown .token.italic {
    font-style: italic;
  }

  /* ── Cascade tree styling ─────────────────────────────────────────────── */

  .rvc-cascade {
    border-left: 3px solid var(--ui-accent);
  }

  .rvc-cascade-arrow {
    color: var(--ui-accent);
    font-weight: var(--ui-font-weight-l);
  }

  .rvc-cascade-entity {
    color: var(--ui-text-strong);
  }

  .rvc-cascade-meta {
    color: var(--ui-text-mute);
  }

  .rvc-cascade-ref {
    color: var(--ui-text-mute);
    opacity: 0.6;
    font-size: 0.9em;
  }

  .rvc-cascade-stop {
    color: var(--ui-warning);
    font-weight: var(--ui-font-weight-l);
  }

  /* ── Loading state ─────────────────────────────────────────────────────── */

  .rvc-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: var(--ui-text-mute);
    font-size: var(--ui-font-m);
  }

  /* ── Refresh button spin ─────────────────────────────────────────────── */

  .rvc-refresh__icon {
    transition: transform var(--ui-motion-fast);
  }

  .rvc-refresh--spinning .rvc-refresh__icon {
    animation: rvc-spin 0.6s ease-in-out;
  }

  @keyframes rvc-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .rvc-container *,
    .rvc-section-content {
      animation: none !important;
      transition-duration: 0.01ms !important;
    }
  }
`);


/* ── Config editor (stub) ──────────────────────────────────────────────── */

class ReportViewerCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; }

  connectedCallback() {
    if (this.shadowRoot) return;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        p { color: var(--secondary-text-color, #888); font-size: 14px; margin: 16px 0; }
      </style>
      <p>Configure this card in YAML.</p>
    `;
  }
}

customElements.define('report-viewer-card-editor', ReportViewerCardEditor);


/* ── Card class ────────────────────────────────────────────────────────── */

class ReportViewerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this._config = null;
    this._hass = null;
    this._rendered = false;
    this._rendererReady = false;
    this._activeCategory = null;
    this._activeVersion = 0;
    this._lastIndex = null;
    this._lastContentKey = null;
    this._rawContent = null;
  }

  /**
   * Card configuration with defaults
   */
  setConfig(config) {
    if (!config.index_sensor) {
      throw new Error('report-viewer-card: index_sensor is required');
    }
    if (!config.content_sensors || typeof config.content_sensors !== 'object') {
      throw new Error('report-viewer-card: content_sensors map is required');
    }

    this._config = {
      title: config.title || 'Reports',
      index_sensor: config.index_sensor,
      content_sensors: config.content_sensors,
      reports_path: config.reports_path || '/local/reports',
      default_category: config.default_category || null,
      toc: config.toc !== false,
      collapsible: config.collapsible !== false,
      severity_badges: config.severity_badges !== false,
      status_badges: config.status_badges !== false,
      resolved_toggle: config.resolved_toggle !== false,
    };

    this._rendered = false;
    if (this._hass && this.isConnected) {
      this._render();
    }
  }

  /**
   * Home Assistant connection
   */
  set hass(hass) {
    this._hass = hass;
    applyThemeClass(this, hass);

    if (!this._config || !this.isConnected) return;

    if (!this._rendered) {
      this._render();
      return;
    }

    // Check if index changed — rebuild tabs if so
    const indexState = hass.states[this._config.index_sensor];
    const newIndex = indexState?.attributes?.index;
    const indexStr = JSON.stringify(newIndex);
    if (indexStr !== this._lastIndex) {
      this._lastIndex = indexStr;
      this._buildTabs(newIndex);
    }

    // Check if active content changed — update content area
    this._updateContent();
  }

  get hass() {
    return this._hass;
  }

  static getConfigElement() {
    return document.createElement('report-viewer-card-editor');
  }

  /**
   * Card height hint for Lovelace layout
   */
  getCardSize() {
    return 8;
  }

  /**
   * Connected to DOM
   */
  connectedCallback() {
    if (window.uiFoundation) {
      this.shadowRoot.adoptedStyleSheets = [window.uiFoundation, uiComponents, uiSkeletons, uiDrawer, cardStyles];
    } else {
      this.shadowRoot.adoptedStyleSheets = [uiComponents, uiSkeletons, uiDrawer, cardStyles];
      console.warn('[ReportViewerCard] uiFoundation not found');
    }

    if (this._config && this._hass) {
      this._render();
    }

    // Load markdown-it asynchronously
    if (!this._rendererReady) {
      initRenderer().then(() => {
        this._rendererReady = true;
        // Re-render content now that markdown is available
        if (this._rendered && this._activeCategory) {
          this._lastContentKey = null;
          this._updateContent();
        }
      }).catch(err => {
        console.error('[ReportViewerCard] Failed to load markdown renderer:', err);
      });
    }
  }

  /**
   * Disconnected from DOM
   */
  disconnectedCallback() {
    this._rendered = false;
  }

  /* ── Refresh ─────────────────────────────────────────────────────────── */

  /**
   * Force-refresh all report sensors via homeassistant.update_entity
   */
  async _refreshSensors() {
    if (!this._hass || !this._config) return;

    const btn = this.shadowRoot.querySelector('.rvc-refresh');
    if (btn?.classList.contains('rvc-refresh--spinning')) return;

    // Spin the icon while refreshing
    if (btn) btn.classList.add('rvc-refresh--spinning');

    // Collect all sensor entity_ids
    const entities = [this._config.index_sensor];
    for (const sensorId of Object.values(this._config.content_sensors)) {
      if (sensorId) entities.push(sensorId);
    }

    try {
      await this._hass.callService('homeassistant', 'update_entity', {
        entity_id: entities,
      });
      // Force content re-check after sensors update
      this._lastContentKey = null;
      this._lastIndex = null;
    } catch (err) {
      console.error('[ReportViewerCard] Failed to refresh sensors:', err);
    } finally {
      if (btn) setTimeout(() => btn.classList.remove('rvc-refresh--spinning'), 600);
    }
  }

  /* ── Render ──────────────────────────────────────────────────────────── */

  /**
   * Full render — structural shell with tab bar and content area
   */
  _render() {
    const cardTitle = this._config.title || 'Reports';
    this.shadowRoot.innerHTML = `
      <div class="rvc-container">
        <div class="ui-card-actions">
          <button class="rvc-refresh ui-copy-btn" aria-label="Refresh reports">
            <svg class="rvc-refresh__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button class="rvc-copy-doc ui-copy-btn" aria-label="Copy document">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a 2 2 0 0 1-2-2V4a 2 2 0 0 1 2-2h9a 2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <button class="rvc-toc-toggle ui-copy-btn" aria-label="Table of contents">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="ui-drawer-backdrop"></div>
        <div class="ui-drawer">
          <div class="ui-drawer__header">
            <h3 class="ui-drawer__title">Contents</h3>
            <button class="ui-drawer__close" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="ui-drawer__content rvc-toc-list"></div>
        </div>
        <div class="ui-card-header">
          <div class="ui-card-header__accent"></div>
          <h2 class="ui-card-header__title">${cardTitle}</h2>
        </div>
        <div class="rvc-tab-row">
          <div class="ui-tab-bar ui-tab-bar--pill"></div>
        </div>
        <div class="rvc-content">
          <div class="rvc-empty">No reports loaded</div>
        </div>
      </div>
    `;
    this._rendered = true;

    // ToC event listeners
    const tocToggle = this.shadowRoot.querySelector('.rvc-toc-toggle');
    const tocClose = this.shadowRoot.querySelector('.ui-drawer__close');
    const tocBackdrop = this.shadowRoot.querySelector('.ui-drawer-backdrop');
    const copyDoc = this.shadowRoot.querySelector('.rvc-copy-doc');

    const refreshBtn = this.shadowRoot.querySelector('.rvc-refresh');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this._refreshSensors());
    if (tocToggle) tocToggle.addEventListener('click', () => this._openToc());
    if (tocClose) tocClose.addEventListener('click', () => this._closeToc());
    if (tocBackdrop) tocBackdrop.addEventListener('click', () => this._closeToc());
    if (copyDoc) copyDoc.addEventListener('click', () => this._copyFullDocument());

    // Read index and build tabs
    const indexState = this._hass.states[this._config.index_sensor];
    const index = indexState?.attributes?.index;
    this._lastIndex = JSON.stringify(index);
    this._buildTabs(index);
  }

  /**
   * Build tab buttons from the index sensor data
   */
  _buildTabs(index) {
    const tabBar = this.shadowRoot.querySelector('.ui-tab-bar');
    if (!tabBar) return;

    // Get categories that have reports AND have a configured content sensor
    const categories = [];
    if (index && typeof index === 'object') {
      for (const cat of Object.keys(index)) {
        if (this._config.content_sensors[cat] && index[cat]?.length > 0) {
          categories.push(cat);
        }
      }
    }

    const tabRow = this.shadowRoot.querySelector('.rvc-tab-row');

    if (categories.length === 0) {
      if (tabRow) tabRow.style.display = 'none';
      this._activeCategory = null;
      this._showEmpty('No reports generated');
      return;
    }

    if (tabRow) tabRow.style.display = '';

    // Determine which tab to activate
    if (!this._activeCategory || !categories.includes(this._activeCategory)) {
      this._activeCategory = this._config.default_category && categories.includes(this._config.default_category)
        ? this._config.default_category
        : categories[0];
    }

    // Store index for version lookup
    this._index = index;

    // Build tab buttons + version dropdown
    const tabsHtml = categories.map(cat => {
      const isActive = cat === this._activeCategory;
      return `<button class="ui-tab-bar__tab${isActive ? ' ui-tab-bar__tab--active' : ''}"
                      data-category="${cat}"
                      role="tab"
                      aria-selected="${isActive}">${formatCategoryName(cat)}</button>`;
    }).join('');

    tabBar.innerHTML = tabsHtml;

    // Add version dropdown to the tab row (outside tab bar to avoid overflow clipping)
    let versionWrap = tabRow?.querySelector('.rvc-version-wrap');
    if (!versionWrap && tabRow) {
      versionWrap = document.createElement('div');
      versionWrap.className = 'rvc-version-wrap';
      versionWrap.innerHTML = `
        <button class="rvc-version-trigger" aria-haspopup="true" aria-expanded="false">
          <span class="rvc-version-label"></span>
          <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l4 4 4-4"/></svg>
        </button>
        <div class="ui-menu" role="listbox"></div>`;
      tabRow.appendChild(versionWrap);
    }

    // Attach tab click handlers
    tabBar.querySelectorAll('.ui-tab-bar__tab').forEach(btn => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.category));
    });

    // Populate version dropdown for active category
    this._updateVersionDropdown();

    // Show content for active tab
    this._updateContent();
  }

  /**
   * Switch to a different category tab
   */
  _switchTab(category) {
    if (category === this._activeCategory) return;
    this._activeCategory = category;
    this._activeVersion = 0;

    // Update tab active states
    const tabBar = this.shadowRoot.querySelector('.ui-tab-bar');
    if (tabBar) {
      tabBar.querySelectorAll('.ui-tab-bar__tab').forEach(btn => {
        const isActive = btn.dataset.category === category;
        btn.classList.toggle('ui-tab-bar__tab--active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
      });
    }

    // Update version dropdown for new category
    this._updateVersionDropdown();

    // Reset content tracking so _updateContent renders fresh
    this._lastContentKey = null;
    this._updateContent();
  }

  /**
   * Populate the version dropdown for the active category.
   * Hidden when only one version exists. Non-latest entries disabled for v1.
   */
  _updateVersionDropdown() {
    const wrap = this.shadowRoot.querySelector('.rvc-version-wrap');
    if (!wrap) return;

    const files = this._index?.[this._activeCategory] || [];

    // Hide when only one version (or none)
    if (files.length <= 1) {
      wrap.classList.add('rvc-version-wrap--hidden');
      return;
    }

    wrap.classList.remove('rvc-version-wrap--hidden');

    // Set trigger label to latest version
    const label = wrap.querySelector('.rvc-version-label');
    if (label) label.textContent = formatVersionDate(files[0]);

    // Build menu items
    const menu = wrap.querySelector('.ui-menu');
    if (!menu) return;

    menu.innerHTML = files.map((file, i) => {
      const date = formatVersionDate(file);
      const selected = i === 0 ? ' ui-menu__item--selected' : '';
      return `<button class="ui-menu__item${selected}" role="option" data-index="${i}">${date}</button>`;
    }).join('');

    // Toggle menu on trigger click
    const trigger = wrap.querySelector('.rvc-version-trigger');
    const closeMenu = () => {
      wrap.classList.remove('is-open');
      menu.classList.remove('ui-menu--open');
      trigger?.setAttribute('aria-expanded', 'false');
    };

    if (trigger) {
      trigger.onclick = (e) => {
        e.stopPropagation();
        const isOpen = wrap.classList.toggle('is-open');
        menu.classList.toggle('ui-menu--open', isOpen);
        trigger.setAttribute('aria-expanded', String(isOpen));
      };
    }

    // Menu item click handlers
    menu.querySelectorAll('.ui-menu__item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(item.dataset.index, 10);
        menu.querySelectorAll('.ui-menu__item').forEach(el =>
          el.classList.remove('ui-menu__item--selected')
        );
        item.classList.add('ui-menu__item--selected');
        if (label) label.textContent = item.textContent;
        closeMenu();
        if (idx !== this._activeVersion) {
          this._activeVersion = idx;
          this._lastContentKey = null;
          this._updateContent();
        }
      });
    });

    // Close when clicking outside
    this.shadowRoot.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) closeMenu();
    });
  }

  /**
   * Update the content area for the active category
   */
  _updateContent() {
    if (!this._activeCategory) return;

    // Non-latest version: fetch the file directly
    if (this._activeVersion > 0) {
      const files = this._index?.[this._activeCategory] || [];
      const filename = files[this._activeVersion];
      if (!filename) {
        this._showEmpty('Version not found');
        return;
      }
      const contentKey = `${this._activeCategory}::v${this._activeVersion}::${filename}`;
      if (contentKey === this._lastContentKey) return;
      this._lastContentKey = contentKey;
      this._fetchAndRenderFile(this._activeCategory, filename);
      return;
    }

    // Latest version: use preloaded sensor content
    const sensorId = this._config.content_sensors[this._activeCategory];
    if (!sensorId) {
      this._showEmpty('Report unavailable');
      return;
    }

    const sensorState = this._hass.states[sensorId];
    if (!sensorState || sensorState.state === 'unavailable' || sensorState.state === 'unknown') {
      this._showEmpty('Report unavailable');
      return;
    }

    const content = sensorState.attributes?.content;
    if (!content) {
      this._showEmpty('No reports generated');
      return;
    }

    // Only re-render content if it actually changed
    const contentKey = `${this._activeCategory}::${sensorState.state}`;
    if (contentKey === this._lastContentKey) return;
    this._lastContentKey = contentKey;

    this._renderContent(content);
  }

  /**
   * Fetch a specific report file and render it.
   */
  async _fetchAndRenderFile(category, filename) {
    const contentEl = this.shadowRoot.querySelector('.rvc-content');
    if (!contentEl) return;

    contentEl.innerHTML = `<div class="rvc-loading">Loading report\u2026</div>`;

    try {
      const url = `${this._config.reports_path}/${category}/${filename}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      const content = await resp.text();
      this._renderContent(content);
    } catch (err) {
      console.error('[ReportViewerCard] Failed to fetch report:', err);
      this._showEmpty('Failed to load report');
      this._lastContentKey = null;
    }
  }

  /**
   * Render markdown content into the content area with all post-processing.
   */
  _renderContent(content) {
    const contentEl = this.shadowRoot.querySelector('.rvc-content');
    if (!contentEl) return;

    if (!this._rendererReady) {
      contentEl.innerHTML = `<div class="rvc-loading">Loading renderer\u2026</div>`;
      return;
    }

    this._rawContent = content;
    const html = renderMarkdown(content);
    contentEl.innerHTML = `<div class="rvc-markdown ui-skeleton-reveal">${html}</div>`;

    // Post-process passes — each wrapped so one failure doesn't break the rest
    const _run = (fn) => { try { fn(); } catch (e) { console.error('[ReportViewerCard]', e); } };
    _run(() => this._extractMetadata(contentEl));
    _run(() => this._wrapTables(contentEl));
    _run(() => highlightCodeBlocks(contentEl));
    _run(() => this._styleCascadeTrees(contentEl));
    _run(() => this._applyResolvedRows(contentEl));
    _run(() => this._applyBadges(contentEl));
    _run(() => this._buildToc(contentEl));
    _run(() => this._attachCollapsible(contentEl));
    _run(() => this._attachCodeCopy(contentEl));
    _run(() => this._attachSectionCopy(contentEl, content));
  }

  /**
   * Extract metadata from the report top and render as a compact grid header.
   * Supports three formats:
   *   1. Two-column table (| Field | Value |)
   *   2. Bold-key lines (**Key:** Value) in paragraphs or blockquotes
   */
  _extractMetadata(root) {
    const md = root.querySelector('.rvc-markdown');
    if (!md) return;

    const pairs = [];
    const sourceEls = []; // elements to hide after extraction

    // Strategy 1: two-column table
    const firstTable = md.querySelector('table');
    if (firstTable) {
      const headerCells = firstTable.querySelectorAll('thead th');
      if (headerCells.length === 2) {
        firstTable.querySelectorAll('tbody tr').forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length === 2) {
            const key = cells[0].textContent.trim();
            const val = cells[1].textContent.trim();
            if (key && val) pairs.push({ key, val });
          }
        });
        if (pairs.length > 0) {
          sourceEls.push(firstTable);
          // Hide heading above table if it says "metadata"
          let prev = firstTable.previousElementSibling;
          while (prev && prev.tagName === 'HR') { sourceEls.push(prev); prev = prev.previousElementSibling; }
          if (prev && /^H[1-6]$/.test(prev.tagName) && /report metadata|metadata/i.test(prev.textContent)) {
            sourceEls.push(prev);
          }
        }
      }
    }

    // Strategy 2: **Key:** Value lines (plain paragraphs or blockquotes)
    if (pairs.length === 0) {
      const boldKeyRe = /^\*\*(.+?):\*\*\s*(.+)$/;
      const children = Array.from(md.children);

      for (const el of children) {
        // Stop at first heading that isn't the title (h1)
        if (/^H[2-6]$/.test(el.tagName)) break;
        // Stop at hr (section divider)
        if (el.tagName === 'HR') { sourceEls.push(el); break; }

        const tag = el.tagName;
        if (tag !== 'P' && tag !== 'BLOCKQUOTE') continue;

        // Get raw text lines from the element
        const text = tag === 'BLOCKQUOTE'
          ? (el.querySelector('p')?.innerHTML || el.innerHTML)
          : el.innerHTML;

        // Split on <br> tags or newlines to handle multiple bold-key pairs in one element
        const lines = text.split(/<br\s*\/?>|\n/i);
        let matched = 0;

        for (const line of lines) {
          // Strip HTML tags for matching, but preserve the raw value
          const plain = line.replace(/<[^>]+>/g, '').trim();
          const m = plain.match(/^(.+?):\s+(.+)$/);
          if (m) {
            // Verify the key part was bold (contained <strong>)
            if (/<strong>/.test(line)) {
              pairs.push({ key: m[1], val: m[2] });
              matched++;
            }
          }
        }

        if (matched > 0) sourceEls.push(el);
      }
    }

    if (pairs.length === 0) return;

    // Build compact header (2-column grid)
    const header = document.createElement('div');
    header.className = 'rvc-metadata';

    pairs.forEach(pair => {
      const key = document.createElement('span');
      key.className = 'rvc-meta-key';
      key.textContent = pair.key;
      header.appendChild(key);

      const val = document.createElement('span');
      val.className = 'rvc-meta-val';
      val.textContent = pair.val;
      header.appendChild(val);
    });

    // Insert header before the markdown content
    md.insertBefore(header, md.firstChild);

    // Hide source elements (but keep in DOM for copy)
    sourceEls.forEach(el => { el.style.display = 'none'; });

    // Hide orphaned HRs in the preamble (before the first visible H2+)
    for (const el of Array.from(md.children)) {
      if (el === header) continue;
      if (el.style.display === 'none') continue;
      if (/^H[2-6]$/.test(el.tagName)) break;
      if (el.tagName === 'HR') el.style.display = 'none';
    }
  }

  /**
   * Escape HTML special characters.
   */

  /**
   * Wrap all <table> elements in scroll containers for horizontal overflow
   */
  _wrapTables(root) {
    const tables = root.querySelectorAll('.rvc-markdown table');
    tables.forEach(table => {
      const wrapper = document.createElement('div');
      wrapper.className = 'rvc-table-wrap';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  /**
   * Make h2/h3 headings collapsible, wrapping their content in toggle containers.
   */
  _attachCollapsible(root) {
    if (!this._config.collapsible) return;

    const md = root.querySelector('.rvc-markdown');
    if (!md) return;

    const headings = md.querySelectorAll('h2, h3');
    headings.forEach(heading => {
      const level = heading.tagName; // H2 or H3
      const stopTags = level === 'H2' ? ['H2'] : ['H2', 'H3'];

      // Collect sibling elements until the next heading of same or higher level
      const siblings = [];
      let el = heading.nextElementSibling;
      while (el && !stopTags.includes(el.tagName)) {
        siblings.push(el);
        el = el.nextElementSibling;
      }

      if (siblings.length === 0) return;

      // Wrap siblings in a container
      const wrapper = document.createElement('div');
      wrapper.className = 'rvc-section-content';
      heading.after(wrapper);
      siblings.forEach(s => wrapper.appendChild(s));

      // Determine initial state
      const storageKey = this._foldKey(heading.textContent.trim());
      const savedState = localStorage.getItem(storageKey);
      const headingText = heading.textContent.trim().toLowerCase();
      const defaultCollapsed = DEFAULT_COLLAPSED.some(s => headingText.includes(s));

      let collapsed;
      if (savedState !== null) {
        collapsed = savedState === '1';
      } else {
        collapsed = defaultCollapsed;
      }

      if (collapsed) {
        heading.classList.add('rvc-collapsed');
        wrapper.classList.add('rvc-hidden');
      }

      // Click handler
      heading.addEventListener('click', () => {
        const isCollapsed = heading.classList.toggle('rvc-collapsed');
        wrapper.classList.toggle('rvc-hidden', isCollapsed);
        localStorage.setItem(storageKey, isCollapsed ? '1' : '0');
      });
    });
  }

  /**
   * Build a localStorage key for fold state persistence.
   */
  _foldKey(headingText) {
    return `rvc-fold:${this._activeCategory}:${headingText}`;
  }

  /**
   * Detect severity/status vocabulary in table cells and wrap with badge spans.
   */
  _applyBadges(root) {
    if (!this._config.severity_badges && !this._config.status_badges) return;

    const cells = root.querySelectorAll('.rvc-markdown td');
    cells.forEach(td => {
      // Skip cells with strikethrough — resolved row dimming takes priority
      if (td.querySelector('del')) return;

      const text = td.textContent.trim();
      const lower = text.toLowerCase();

      // Check severity vocabulary (exact match, case-insensitive)
      if (this._config.severity_badges && SEVERITY_MAP[lower]) {
        td.innerHTML = `<span class="rvc-badge rvc-badge--${SEVERITY_MAP[lower]}">${escapeHtml(text)}</span>`;
        return;
      }

      // Check status vocabulary (startsWith rules, case-insensitive)
      if (this._config.status_badges) {
        const rule = STATUS_RULES.find(r => r.test(lower));
        if (rule) {
          td.innerHTML = `<span class="rvc-badge rvc-badge--${rule.cls}">${escapeHtml(text)}</span>`;
        }
      }
    });
  }

  /**
   * Detect table rows containing strikethrough (del) content and dim them.
   */
  _applyResolvedRows(root) {
    const rows = root.querySelectorAll('.rvc-markdown tbody tr');
    rows.forEach(tr => {
      if (tr.querySelector('del')) {
        tr.classList.add('rvc-resolved-row');
      }
    });
  }

  /**
   * Detect cascade tree code blocks and apply styled markup.
   * Parses entity names, arrows, metadata brackets, file refs, and stop markers.
   */
  _styleCascadeTrees(root) {
    const codeEls = root.querySelectorAll('.rvc-markdown pre code');
    codeEls.forEach(code => {
      const text = code.textContent;
      if (!isCascadeTree(text)) return;

      code.parentElement.classList.add('rvc-cascade');

      const lines = text.split('\n');
      code.innerHTML = lines.map(line => {
        if (!line.trim()) return '';

        const m = line.match(/^(\s*)(→\s*)?(.*)$/);
        if (!m) return escapeHtml(line);

        const [, indent, arrow, rest] = m;
        let html = indent || '';

        if (arrow) {
          html += `<span class="rvc-cascade-arrow">${escapeHtml(arrow)}</span>`;
        }

        if (!rest) return html;

        // Split on bracket groups [...]
        const parts = rest.split(/(\[[^\]]*\])/g);
        for (const part of parts) {
          if (!part) continue;

          if (part.startsWith('[') && part.endsWith(']')) {
            const inner = part.slice(1, -1);
            if (/^(STOP|downstream):/i.test(inner)) {
              html += `<span class="rvc-cascade-stop">${escapeHtml(part)}</span>`;
            } else if (inner.includes('/') && /:\d/.test(inner)) {
              html += `<span class="rvc-cascade-ref">${escapeHtml(part)}</span>`;
            } else {
              html += `<span class="rvc-cascade-meta">${escapeHtml(part)}</span>`;
            }
          } else if (part.trim()) {
            html += `<span class="rvc-cascade-entity">${escapeHtml(part)}</span>`;
          } else {
            html += part;
          }
        }

        return html;
      }).join('\n');
    });
  }

  /**
   * Build the ToC entry list from the rendered markdown headings.
   */
  _buildToc(root) {
    if (!this._config.toc) return;

    const tocList = this.shadowRoot.querySelector('.rvc-toc-list');
    if (!tocList) return;

    const headings = root.querySelectorAll('.rvc-markdown h2, .rvc-markdown h3');
    if (headings.length === 0) {
      tocList.innerHTML = '';
      return;
    }

    tocList.innerHTML = '';
    headings.forEach((heading, i) => {
      const btn = document.createElement('button');
      btn.className = `rvc-toc-entry${heading.tagName === 'H3' ? ' rvc-toc-entry--h3' : ''}`;
      btn.textContent = heading.textContent.trim();
      btn.addEventListener('click', () => {
        // Expand section if collapsed
        if (heading.classList.contains('rvc-collapsed')) {
          heading.click();
        }
        const motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        heading.scrollIntoView({ behavior: motionOk ? 'smooth' : 'auto', block: 'start' });
        this._closeToc();
      });
      tocList.appendChild(btn);
    });
  }

  /**
   * Open the ToC panel.
   */
  _openToc() {
    openDrawer(this.shadowRoot);
  }

  _closeToc() {
    closeDrawer(this.shadowRoot);
  }

  /**
   * Add copy buttons to code blocks.
   */
  _attachCodeCopy(root) {
    const pres = root.querySelectorAll('.rvc-markdown pre');
    pres.forEach(pre => {
      const code = pre.querySelector('code');
      if (!code) return;

      const btn = document.createElement('button');
      btn.className = 'rvc-copy-code';
      btn.setAttribute('aria-label', 'Copy code');
      btn.innerHTML = COPY_ICON;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCopyButton(btn, code.textContent);
      });
      pre.appendChild(btn);
    });
  }

  /**
   * Add copy buttons to h2 section headings.
   * Copies raw markdown from heading to next h2.
   */
  _attachSectionCopy(root, rawMarkdown) {
    const headings = root.querySelectorAll('.rvc-markdown h2');
    headings.forEach(heading => {
      const btn = document.createElement('button');
      btn.className = 'rvc-copy-section ui-copy-btn';
      btn.setAttribute('aria-label', 'Copy section');
      btn.innerHTML = COPY_ICON;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sectionText = this._extractSection(heading.textContent.trim(), rawMarkdown);
        handleCopyButton(btn, sectionText);
      });
      heading.appendChild(btn);
    });
  }

  /**
   * Extract a section's raw markdown by heading text.
   * Returns text from the heading line to the next ## heading.
   */
  _extractSection(headingText, rawMarkdown) {
    const lines = rawMarkdown.split('\n');
    let start = -1;
    let end = lines.length;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (start === -1) {
        // Find the heading line (## Heading Text)
        if (line.match(/^##\s/) && line.includes(headingText)) {
          start = i;
        }
      } else {
        // Find the next h2 heading
        if (line.match(/^##\s/)) {
          end = i;
          break;
        }
      }
    }

    if (start === -1) return headingText;
    return lines.slice(start, end).join('\n').trim();
  }

  /**
   * Copy the full raw markdown document.
   */
  _copyFullDocument() {
    if (!this._rawContent) return;
    const btn = this.shadowRoot.querySelector('.rvc-copy-doc');
    if (btn) {
      handleCopyButton(btn, this._rawContent);
    }
  }

  /**
   * Show an empty/error state message
   */
  _showEmpty(message) {
    const contentEl = this.shadowRoot.querySelector('.rvc-content');
    if (contentEl) {
      contentEl.innerHTML = `<div class="rvc-empty">${message}</div>`;
    }
    this._lastContentKey = null;
  }
}

customElements.define('report-viewer-card', ReportViewerCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'report-viewer-card',
  name: 'Report Viewer',
  description: 'Renders intelligence reports stored as markdown files',
});
