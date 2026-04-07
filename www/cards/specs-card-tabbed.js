// | START: specs-card-tabbed.js
// |  PATH: /config/www/cards/specs-card-tabbed.js
// InputsInferred: []
// Tabbed specs/system-info card for Home Assistant Lovelace.
// Renders multi-tab data grids with collapsible sections, per-value semantic colouring,
// and clipboard export (single tab or all tabs) formatted as a fenced code block.
// Platform: Home Assistant frontend (custom Lovelace card, Shadow DOM).
// Depends on: /local/base/foundation.js (uiFoundation constructable stylesheet),
//   /local/base/components.js (uiComponents stylesheet, handleCopyButton, initCollapsibleSections, toggleAllSections),
//   /local/base/templates.js (parseTemplate — resolves Jinja-style templates against hass state),
//   /local/base/helpers.js (applyThemeClass — sets theme CSS class on host element from hass theme)
import "/local/base/foundation.js";
import { uiComponents, handleCopyButton, initCollapsibleSections, toggleAllSections } from "/local/base/components.js";
import { parseTemplate } from "/local/base/templates.js";
import { applyThemeClass, initButtons } from "/local/base/helpers.js";

class SpecsCardTabbedEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
  }
  connectedCallback() {
    this.innerHTML = `<p style="padding:16px;color:var(--secondary-text-color)">This card has no configurable options.</p>`;
  }
}
customElements.define("specs-card-tabbed-editor", SpecsCardTabbedEditor);

class SpecsCardTabbed extends HTMLElement {
  static getConfigElement() {
    return document.createElement("specs-card-tabbed-editor");
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
    this._isRendered = false;
    this._activeTab = null;
  }

  setConfig(config) {
    if (!config.tabs || Object.keys(config.tabs).length === 0) {
      throw new Error("You must define at least one tab");
    }

    this._config = {
      card_title: config.card_title || "System Context",
      copy_title: config.copy_title || "System Information",
      tabs: config.tabs
    };

    // Set initial active tab to first tab
    this._activeTab = Object.keys(this._config.tabs)[0];

    if (this._hass) {
      this.render();
    }
  }

  // HA calls the hass setter on every state change. Full render runs only once;
  // subsequent calls take the updateValues() fast path to avoid destroying DOM/event state.
  set hass(hass) {
    this._hass = hass;
    applyThemeClass(this, hass);
    if (this._config) {
      if (!this._isRendered) {
        this.render();
      } else {
        this.updateValues();
      }
    }
  }

  // adoptedStyleSheets requires constructable CSSStyleSheet instances exported
  // by foundation.js (window.uiFoundation) and components.js (uiComponents).
  connectedCallback() {
    this.shadowRoot.adoptedStyleSheets = [window.uiFoundation, uiComponents];
    initButtons(this.shadowRoot);
  }

  // Forces a full render on next hass update if the element is re-inserted into
  // the DOM, since the shadow root innerHTML is cleared or stale after detach.
  disconnectedCallback() {
    this._isRendered = false;
  }

  getCardSize() {
    return 6;
  }

  // Produces a slug used as a data-label attribute value for targeted DOM lookups
  // in updateValues(). Must stay in sync with the data-label attributes set in renderTabContent().
  sanitizeLabel(label) {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  // Resolves section data from either inline config or a sensor attribute.
  // data_source format: { entity: 'sensor.ha_system_context', attribute: 'gotchas' }
  // Returns a plain object of { label: value } pairs.
  resolveSectionData(section) {
    if (section.data_source && this._hass) {
      const { entity, attribute } = section.data_source;
      const stateObj = this._hass.states[entity];
      if (stateObj && stateObj.attributes && stateObj.attributes[attribute]) {
        return stateObj.attributes[attribute];
      }
      // Fallback: return empty if sensor unavailable
      return {};
    }
    return section.data || {};
  }

  // Fast-path updater: walks the existing DOM using data-tab / data-section / data-label
  // selectors to patch only the value text and colour class, avoiding a full re-render.
  updateValues() {
    if (!this._config || !this._hass || !this._isRendered) return;

    const root = this.shadowRoot;
    if (!root) return;

    for (const [tabKey, tab] of Object.entries(this._config.tabs)) {
      for (const [sectionKey, section] of Object.entries(tab.sections || {})) {
        const data = this.resolveSectionData(section);
        for (const [label, value] of Object.entries(data)) {
          const dataLabel = this.sanitizeLabel(label);
          const valueEl = root.querySelector(
            `[data-tab="${tabKey}"] [data-section="${sectionKey}"] [data-label="${dataLabel}"] .ui-data-row__value`
          );
          if (valueEl) {
            const processedValue = parseTemplate(value, this._hass);
            this.applyValueWithColor(valueEl, processedValue);
          }
        }
      }
    }
  }

  // Handles two value formats returned by parseTemplate / range_to_label:
  //   1. Object: { text: string, color: string } — structured colour from range_to_label
  //   2. String with colon-delimited colour suffix: "6.4 GB:warning"
  // Both formats map to ui-text--{colour} utility classes defined in the foundation stylesheet.
  // The colour class set is fixed: success, warning, error, info, muted.
  applyValueWithColor(element, value) {
    // Remove any existing color classes
    element.classList.remove('ui-text--success', 'ui-text--warning', 'ui-text--error', 'ui-text--info', 'ui-text--muted');

    // Debug: log values that might have color suffixes
    if (typeof value === 'string' && value.includes(':')) {
      console.log('[applyValueWithColor] String with colon:', value);
    }

    if (value && typeof value === 'object' && value.text !== undefined) {
      // Object with text and color from range_to_label
      element.textContent = value.text;
      if (value.color) {
        element.classList.add(`ui-text--${value.color}`);
      }
    } else if (typeof value === 'string') {
      // Check for color suffix in plain string (e.g., "6.4 GB:warning")
      const colorMatch = value.match(/^(.+):(warning|error|success|info|muted)$/);
      if (colorMatch) {
        element.textContent = colorMatch[1];
        element.classList.add(`ui-text--${colorMatch[2]}`);
      } else {
        element.textContent = value;
      }
    } else {
      // Fallback for other types
      element.textContent = value;
    }
  }

  // Builds a markdown-fenced code block for clipboard paste. Strips colour metadata
  // from values so the output is plain text. When tabKey is null, all tabs are included
  // with block-character separators between them.
  generateClipboardText(tabKey = null) {
    const labelColumnWidth = 28;
    const tabs = tabKey 
      ? { [tabKey]: this._config.tabs[tabKey] }
      : this._config.tabs;

    let text = '```\n';
    text += `${this._config.copy_title}`;
    if (tabKey) {
      const tabCopyLabel = this._config.tabs[tabKey].copy_label || this._config.tabs[tabKey].label;
      text += ` — ${tabCopyLabel}`;
    }
    text += '\n';
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `${'═'.repeat(30)}\n\n`;

    const tabEntries = Object.entries(tabs);
    for (let t = 0; t < tabEntries.length; t++) {
      const [, tab] = tabEntries[t];
      
      if (!tabKey && tabEntries.length > 1) {
        const tabCopyLabel = tab.copy_label || tab.label;
        text += `${'▓'.repeat(3)} ${tabCopyLabel.toUpperCase()} ${'▓'.repeat(3)}\n\n`;
      }

      const sectionEntries = Object.entries(tab.sections || {});
      for (let s = 0; s < sectionEntries.length; s++) {
        const [, section] = sectionEntries[s];
        const sectionCopyTitle = section.copy_title || section.title;

        text += `${'-'.repeat(10)} ${sectionCopyTitle.toUpperCase()}\n`;

        const data = this.resolveSectionData(section);
        for (const [label, value] of Object.entries(data)) {
          const processedValue = parseTemplate(value, this._hass);
          // Extract text from color objects
          const displayValue = (processedValue && typeof processedValue === 'object' && processedValue.text !== undefined)
            ? processedValue.text
            : processedValue;
          const dots = '.'.repeat(Math.max(1, labelColumnWidth - label.length));
          text += `${label}${dots} ${displayValue}\n`;
        }

        text += `${'-'.repeat(labelColumnWidth)}\n`;

        if (s < sectionEntries.length - 1) {
          text += '\n';
        }
      }

      if (t < tabEntries.length - 1) {
        text += '\n\n\n';
      }
    }

    text += '```';
    return text;
  }

  renderTabBar() {
    const tabs = Object.entries(this._config.tabs)
      .map(([tabKey, tab]) => {
        const isActive = tabKey === this._activeTab;
        const activeClass = isActive ? 'ui-tab-bar__tab--active' : '';
        return `<button class="ui-tab-bar__tab ${activeClass}" data-tab-id="${tabKey}">${tab.label}</button>`;
      })
      .join('');

    return `<div class="ui-tab-bar">${tabs}</div>`;
  }

  renderTabContent(tabKey, tab) {
    const isActive = tabKey === this._activeTab;
    const sections = Object.entries(tab.sections || {})
      .map(([sectionKey, section]) => {
        const data = this.resolveSectionData(section);
        const dataRows = Object.entries(data)
          .map(([label, value]) => {
            const processedValue = parseTemplate(value, this._hass);
            const dataLabel = this.sanitizeLabel(label);
            // Handle color objects from range_to_label
            let displayValue, colorClass = '';
            // DEBUG: remove after testing
            if (label === 'CPU' || label === 'Memory' || label === 'Entities') {
              console.log('[specs-card-tabbed] label:', label, 'processedValue:', processedValue, 'type:', typeof processedValue);
            }

            if (processedValue && typeof processedValue === 'object' && processedValue.text !== undefined) {
              displayValue = processedValue.text;
              if (processedValue.color) {
                colorClass = ` ui-text--${processedValue.color}`;
              }
            } else if (typeof processedValue === 'string') {
              const colorMatch = processedValue.match(/^(.+):(warning|error|success|info|muted)$/);
              if (colorMatch) {
                displayValue = colorMatch[1];
                colorClass = ` ui-text--${colorMatch[2]}`;
              } else {
                displayValue = processedValue;
              }
            } else {
              displayValue = processedValue;
            }


            return `
              <div class="ui-data-row ui-data-row--relaxed" data-label="${dataLabel}">
                <span class="ui-data-row__label">${label}</span>
                <span class="ui-data-row__value${colorClass}">${displayValue}</span>
              </div>`;
          })
          .join('');

        const sectionId = `${tabKey}-${sectionKey}`;
        return `
          <div class="ui-collapsible-section" data-section-id="${sectionId}" data-initial-state="expanded">
            <button class="ui-collapsible-section__header">
              <span class="ui-collapsible-section__title">${section.title}</span>
              <span class="ui-collapsible-section__arrow"></span>
            </button>
            <div class="ui-collapsible-section__content">
              ${dataRows}
            </div>
          </div>`;
      })
      .join('');

    return `
      <div class="tab-panel ${isActive ? 'tab-panel--active' : ''}" data-tab="${tabKey}">
        ${sections}
      </div>`;
  }

  render() {
    if (!this._config || !this._hass) return;

    const tabBar = this.renderTabBar();
    const tabPanels = Object.entries(this._config.tabs)
      .map(([tabKey, tab]) => this.renderTabContent(tabKey, tab))
      .join('');

    this.shadowRoot.innerHTML = `
      <style>
        .ui-card {
          height: calc(var(--ui-space-9) * 13);
          min-height: calc(var(--ui-space-9) * 13);
          max-height: calc(var(--ui-space-9) * 13);
          display: flex;
          flex-direction: column;
        }

        .tab-panel {
          display: none;
        }

        .tab-panel--active {
          display: block;
        }

        /* Override collapsible header to match section-header styling */
        .ui-collapsible-section__header {
          padding: var(--ui-space-2) 0;
          min-height: auto;
        }

        .ui-collapsible-section__title {
          padding-left: 0;
          font-size: var(--ui-font-xs);
          color: var(--ui-text-mute);
        }

        .ui-collapsible-section {
          margin-bottom: var(--ui-space-4);
        }

        .ui-collapsible-section:last-child {
          margin-bottom: 0;
        }

        .content-container {
          margin-top: var(--ui-space-4);
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .content-container::-webkit-scrollbar {
          display: none;
        }

        .copy-menu-wrapper {
          position: relative;
        }

        .copy-menu-wrapper .ui-menu {
          bottom: auto;
          top: calc(100% + var(--ui-menu-offset));
        }
      </style>

      <div class="ui-card">
        <div class="ui-card-header">
          <div class="ui-card-header__accent"></div>
          <h2 class="ui-card-header__title">${this._config.card_title}</h2>
        </div>

        <div class="ui-card-actions">
          <div class="copy-menu-wrapper">
            <button id="copyBtn" class="ui-copy-btn" aria-label="Copy options" aria-haspopup="true" aria-expanded="false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <div class="ui-menu" role="menu" id="copyMenu">
              <button class="ui-menu__item" role="menuitem" data-action="copy-tab">Copy Tab</button>
              <button class="ui-menu__item" role="menuitem" data-action="copy-all">Copy All</button>
            </div>
          </div>
          <button class="ui-btn ui-btn--accent ui-btn--icon ui-btn--large" id="toggleAllBtn" aria-label="Toggle all sections">
            <span class="ui-btn__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </span>
          </button>
        </div>

        ${tabBar}

        <div class="content-container">
          ${tabPanels}
        </div>
      </div>
    `;

    this._isRendered = true;
    this.attachEvents();
  }

  // Class-toggle tab switch — avoids re-rendering tab content so collapsible
  // section state and scroll position within each panel are preserved.
  switchTab(tabKey) {
    if (!this._config.tabs[tabKey]) return;

    this._activeTab = tabKey;
    const root = this.shadowRoot;

    // Update tab buttons
    root.querySelectorAll('.ui-tab-bar__tab').forEach(btn => {
      btn.classList.toggle('ui-tab-bar__tab--active', btn.dataset.tabId === tabKey);
    });

    // Update tab panels
    root.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('tab-panel--active', panel.dataset.tab === tabKey);
    });
  }

  attachEvents() {
    const root = this.shadowRoot;
    if (!root) return;

    // Initialize collapsible sections
    initCollapsibleSections(root);

    // Tab switching
    root.querySelectorAll('.ui-tab-bar__tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tabId);
      });
    });

    // Toggle all sections (across ALL tabs, not just visible)
    const toggleAllBtn = root.querySelector('#toggleAllBtn');
    const toggleIcon = toggleAllBtn?.querySelector('.ui-btn__icon svg');

    // Check initial state
    const sections = root.querySelectorAll('.ui-collapsible-section');
    const collapsedCount = root.querySelectorAll('.ui-collapsible-section--collapsed').length;
    let isExpanded = collapsedCount < sections.length / 2;

    // Set initial icon
    if (toggleIcon) {
      if (isExpanded) {
        toggleIcon.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"></line>';
      } else {
        toggleIcon.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>';
      }
    }

    if (toggleAllBtn && toggleIcon) {
      toggleAllBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        // Toggle ALL sections across all tabs
        toggleAllSections(root, isExpanded);

        if (isExpanded) {
          toggleIcon.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"></line>';
        } else {
          toggleIcon.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>';
        }
      });
    }

    // Copy menu
    const copyBtn = root.querySelector('#copyBtn');
    const copyMenu = root.querySelector('#copyMenu');

    if (copyBtn && copyMenu) {
      // Toggle menu on button click
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = copyMenu.classList.contains('ui-menu--open');
        copyMenu.classList.toggle('ui-menu--open', !isOpen);
        copyBtn.setAttribute('aria-expanded', !isOpen);
      });

      // Handle menu item clicks
      copyMenu.querySelectorAll('.ui-menu__item').forEach(item => {
        item.addEventListener('click', async () => {
          const action = item.dataset.action;
          const clipboardText = action === 'copy-tab'
            ? this.generateClipboardText(this._activeTab)
            : this.generateClipboardText();

          // Close menu
          copyMenu.classList.remove('ui-menu--open');
          copyBtn.setAttribute('aria-expanded', 'false');

          // Perform copy with feedback
          await handleCopyButton(copyBtn, clipboardText);
        });
      });

      // Close menu on click outside
      root.addEventListener('click', (e) => {
        if (!copyBtn.contains(e.target) && !copyMenu.contains(e.target)) {
          copyMenu.classList.remove('ui-menu--open');
          copyBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }
}

customElements.define("specs-card-tabbed", SpecsCardTabbed);
// |   END: specs-card-tabbed.js
