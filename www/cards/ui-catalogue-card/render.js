// ══════════════════════════════════════════════════════════════════════════════
//  RENDER MODULE
//  Main render, navigation, view switching, and demo area composition.
// ══════════════════════════════════════════════════════════════════════════════

import {
  getCategories,
  getComponentsByCategory,
  getComponentById,
  searchComponents,
  CATEGORY_ORDER,
} from "./registry.js";
import { COMPONENT_USAGE } from "./usage.js";


// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(str) {
  const el = document.createElement("span");
  el.textContent = str;
  return el.innerHTML;
}


// ── Main Render ──────────────────────────────────────────────────────────────

export function render() {
  const categories = getCategories();
  const { activeCategory, activeComponent, searchTerm } = this.state;

  // Determine component list (search or category-based)
  let components;
  if (searchTerm) {
    components = searchComponents(searchTerm);
  } else {
    components = getComponentsByCategory(activeCategory);
  }

  const active = getComponentById(activeComponent);

  this._rootEl.innerHTML = `
    ${this.renderHeader()}
    ${this.renderCategoryTabs(categories)}
    <div class="cat-body">
      <div class="cat-sidebar-backdrop" id="catSidebarBackdrop"></div>
      ${this.renderSidebar(components)}
      <div class="cat-demo">
        ${active ? this.renderComponentView(active) : this.renderEmpty()}
      </div>
    </div>
  `;

  this.setupEventListeners();
  this.setupDemoListeners();
}


// ── Header ───────────────────────────────────────────────────────────────────

export function renderHeader() {
  const isDark = this._hass?.themes?.darkMode ?? false;

  return `
    <div class="cat-header">
      <button class="cat-header__sidebar-btn" id="sidebarToggle" aria-label="Toggle sidebar">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"/></svg>
      </button>
      <div class="ui-card-header">
        <div class="ui-card-header__accent"></div>
        <h2 class="ui-card-header__title">UI Catalogue</h2>
        <ui-info-icon data-tooltip-key="cardHeader" position="bottom"></ui-info-icon>
      </div>
      <div class="cat-header-actions">
        <div class="cat-search-container">
          <div class="ui-input">
            <div class="ui-input__pill${this.state.searchTerm ? ' has-value' : ''}">
              <label class="ui-input__label">Search...</label>
              <input type="text" class="ui-input__field" id="catSearch" value="${esc(this.state.searchTerm)}" autocomplete="off" autocapitalize="off" spellcheck="false" />
            </div>
          </div>
          <button id="catSearchClear" class="cat-clear-button">✕</button>
        </div>
        <div class="dropdown-container cat-header-menu">
          <button class="ui-btn ui-btn--icon" id="catHeaderMenuBtn" aria-label="More options">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
          </button>
          <div class="ui-menu ui-menu--down${this.state.headerMenuOpen ? ' ui-menu--open' : ''}" id="catHeaderMenu">
            <button class="ui-menu__item" id="catHeaderMenuDarkMode">Dark Mode<span class="cat-header-menu__toggle"><input type="checkbox" class="ui-checkbox__input" tabindex="-1" ${isDark ? 'checked' : ''}><span class="ui-checkbox__box"><svg class="ui-checkbox__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span></button>
          </div>
        </div>
      </div>
    </div>
  `;
}


// ── Category Tabs ────────────────────────────────────────────────────────────

export function renderCategoryTabs(categories) {
  const { activeCategory, searchTerm } = this.state;
  return `
    <div class="cat-tabs">
      <div class="ui-tab-bar ui-tab-bar--pill" id="catTabs">
        ${categories.map(c => `
          <button
            class="ui-tab-bar__tab${!searchTerm && activeCategory === c ? " ui-tab-bar__tab--active" : ""}"
            data-category="${esc(c)}"
          >${esc(c)}</button>
        `).join("")}
      </div>
    </div>
  `;
}


// ── Sidebar ──────────────────────────────────────────────────────────────────

export function renderSidebar(components) {
  const { activeComponent, sidebarOpen, searchTerm } = this.state;

  let itemsHtml;
  if (searchTerm && components.length > 0) {
    // Group search results by category, sorted by canonical order
    const grouped = {};
    components.forEach(c => {
      if (!grouped[c.category]) grouped[c.category] = [];
      grouped[c.category].push(c);
    });
    const sortedCats = CATEGORY_ORDER.filter(c => grouped[c]);
    itemsHtml = sortedCats.map(cat => `
      <div class="cat-sidebar__group-label">${esc(cat)}</div>
      ${grouped[cat].map(c => sidebarItem(c, activeComponent)).join("")}
    `).join("");
  } else {
    itemsHtml = components.map(c => sidebarItem(c, activeComponent)).join("");
  }

  return `
    <nav class="cat-sidebar${sidebarOpen ? " is-open" : ""}" id="catSidebar" role="listbox" aria-label="Components">
      ${itemsHtml}
      ${components.length === 0 ? `
        <div style="padding: var(--ui-space-4); color: var(--ui-text-mute); font-size: var(--ui-font-s);">
          No components found
        </div>
      ` : ""}
    </nav>
  `;
}

function sidebarItem(c, activeId) {
  return `
    <div
      class="cat-sidebar__item${activeId === c.id ? " is-active" : ""}"
      data-component="${c.id}"
      role="option"
      tabindex="0"
      aria-selected="${activeId === c.id}"
    >
      <span class="cat-sidebar__dot cat-sidebar__dot--${c.status}"></span>
      ${esc(c.name)}
    </div>
  `;
}


// ── Component View ───────────────────────────────────────────────────────────

export function renderComponentView(comp) {
  const usage = renderUsageSection(comp);
  return `
    ${this.renderComponentHeader(comp)}
    ${this.renderDemoArea(comp)}
    ${usage ? `<div class="cat-section-label">Usage</div>${usage}` : ""}
  `;
}


// ── Component Header ─────────────────────────────────────────────────────────

export function renderComponentHeader(comp) {
  const statusColor = comp.status === 'stable' ? 'success' : comp.status === 'beta' ? 'warning' : comp.status === 'deprecated' ? 'error' : 'muted';
  return `
    <div class="cat-comp-header">
      <div class="cat-comp-header__top">
        <div class="cat-comp-header__title">${esc(comp.name)}</div>
        <span class="ui-badge ui-badge--${statusColor}">${comp.status}</span>
      </div>
      <div class="cat-comp-header__desc">${esc(comp.description)}</div>
      <div class="cat-comp-header__meta">
        <span class="cat-comp-header__source">${esc(comp.source)}</span>
        ${comp.tags.length ? '<span class="cat-comp-header__sep">·</span>' : ''}
        ${comp.tags.map(t => `<span class="cat-comp-header__tag">${esc(t)}</span>`).join("")}
      </div>
    </div>
  `;
}


// ── Usage Section ────────────────────────────────────────────────────────────

const COPY_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

function renderUsageSection(comp) {
  const usage = COMPONENT_USAGE[comp.id];
  if (!usage) return "";

  const blocks = [];

  // Markup code block
  if (usage.markup) {
    blocks.push(`
      <div class="cat-usage__block">
        <span class="cat-usage__label">HTML</span>
        <button class="cat-usage__copy" data-usage-copy aria-label="Copy markup">${COPY_ICON}</button>
        <code class="cat-usage__code">${esc(usage.markup)}</code>
      </div>
    `);
  }

  // JS import + init block
  if (usage.jsImport || (usage.jsInit && !usage.cssOnly)) {
    const jsCode = [usage.jsImport, usage.jsInit].filter(Boolean).join("\n\n");
    blocks.push(`
      <div class="cat-usage__block">
        <span class="cat-usage__label">JavaScript</span>
        <button class="cat-usage__copy" data-usage-copy aria-label="Copy JS">${COPY_ICON}</button>
        <code class="cat-usage__code">${esc(jsCode)}</code>
      </div>
    `);
  }

  // API pills
  const pills = [];
  if (usage.cssOnly) {
    pills.push(`<span class="cat-usage__pill cat-usage__pill--css">CSS-only</span>`);
  } else if (usage.jsInit) {
    pills.push(`<span class="cat-usage__pill cat-usage__pill--js">JS required</span>`);
  }
  if (usage.events && usage.events.length > 0) {
    usage.events.forEach(e => {
      pills.push(`<span class="cat-usage__pill cat-usage__pill--event">${esc(e)}</span>`);
    });
  }

  // Notes
  const notesHtml = usage.notes
    ? `<div class="cat-usage__note">${esc(usage.notes)}</div>`
    : "";

  return `
    <div class="cat-usage">
      ${blocks.join("")}
      ${pills.length ? `<div class="cat-usage__api">${pills.join("")}</div>` : ""}
      ${notesHtml}
    </div>
  `;
}


// ── Demo Area ────────────────────────────────────────────────────────────────

export function renderDemoArea(comp) {
  // Delegate to the component's demo function
  const fn = this[comp.demoFn];
  if (typeof fn === "function") {
    return fn.call(this, comp);
  }
  return `<div class="cat-empty"><div class="cat-empty__text">Demo not implemented for ${esc(comp.name)}</div></div>`;
}


// ── Empty State ──────────────────────────────────────────────────────────────

export function renderEmpty() {
  return `
    <div class="cat-empty">
      <div class="cat-empty__icon">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19M17,12H12V17H17V12M7,7H12V12H7V7Z"/></svg>
      </div>
      <div class="cat-empty__text">Select a component from the sidebar</div>
    </div>
  `;
}


// ── Playground Wrapper ───────────────────────────────────────────────────────

export function renderPlayground(canvasHTML, variants, activeVariant, opts = {}) {
  const canvasClass = [
    "cat-playground__canvas",
    opts.left ? "cat-playground__canvas--left" : "",
    opts.col ? "cat-playground__canvas--col" : "",
  ].filter(Boolean).join(" ");

  const hasVariants = variants && variants.length > 0;

  return `
    <div class="cat-playground">
      <div class="${canvasClass}" id="playgroundCanvas">
        ${canvasHTML}
      </div>
      ${hasVariants ? `
        <div class="cat-playground__controls" id="playgroundControls">
          ${variants.map(v => `
            <button
              class="cat-chip${activeVariant === v ? " is-active" : ""}"
              data-variant="${esc(v)}"
            >${esc(v)}</button>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}


// ── States Grid Wrapper ──────────────────────────────────────────────────────

export function renderStatesGrid(label, items, opts = {}) {
  const gridClass = [
    "cat-states",
    opts.wide ? "cat-states--wide" : "",
    opts.narrow ? "cat-states--narrow" : "",
  ].filter(Boolean).join(" ");

  return `
    <div class="cat-demo-section">
      <div class="cat-section-label">${esc(label)}</div>
      <div class="${gridClass}">
        ${items.map(item => `
          <div class="cat-state-box">
            <div class="cat-state-preview${item.tall ? " cat-state-preview--tall" : ""}${item.auto ? " cat-state-preview--auto" : ""}">
              ${item.html}
            </div>
            <div class="cat-state-label">${esc(item.label)}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}
