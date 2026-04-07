// /config/www/cards/specs-card.js
import "/local/base/foundation.js";
import { uiComponents, initCollapsibleSections, toggleAllSections, handleCopyButton } from "/local/base/components.js";
import { parseTemplate } from "/local/base/templates.js";
import { applyThemeClass, initButtons } from "/local/base/helpers.js";

class SpecsCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
  }
  connectedCallback() {
    this.innerHTML = `<p style="padding:16px;color:var(--secondary-text-color)">This card has no configurable options.</p>`;
  }
}
customElements.define("specs-card-editor", SpecsCardEditor);

class SpecsCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("specs-card-editor");
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
    this._isRendered = false;
  }

  setConfig(config) {
    this._config = {
      card_title: config.card_title || "Specifications",
      copy_title: config.copy_title || "System Information",
      entities: config.entities || {},
      sections: config.sections || {}
    };

    if (this._hass) {
      this.render();
    }
  }

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

  connectedCallback() {
    this.shadowRoot.adoptedStyleSheets = [window.uiFoundation, uiComponents];
    initButtons(this.shadowRoot);
  }

  disconnectedCallback() {
    this._isRendered = false;
  }

  getCardSize() {
    return 6;
  }

  /**
   * Sanitize label for use as data attribute
   * @param {string} label - Label to sanitize
   * @returns {string} - Sanitized label
   */
  sanitizeLabel(label) {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  /**
   * Update only the values without re-rendering the entire card
   */
  updateValues() {
    if (!this._config || !this._hass || !this._isRendered) return;

    const root = this.shadowRoot;
    if (!root) return;

    for (const [sectionKey, section] of Object.entries(this._config.sections)) {
      const sectionEl = root.querySelector(`.ui-collapsible-section[data-section-id="${sectionKey}"]`);
      if (!sectionEl) continue;

      for (const [label, value] of Object.entries(section.data)) {
        const dataLabel = this.sanitizeLabel(label);
        const valueEl = sectionEl.querySelector(`[data-label="${dataLabel}"] .ui-data-row__value`);
        if (valueEl) {
          const processedValue = parseTemplate(value, this._hass);
          this.applyValueWithColor(valueEl, processedValue);
        }
      }
    }
  }

  // Apply value to element, handling color objects from range_to_label
  applyValueWithColor(element, value) {
    // Remove any existing color classes
    element.classList.remove('ui-text--success', 'ui-text--warning', 'ui-text--error', 'ui-text--info', 'ui-text--muted');

    if (value && typeof value === 'object' && value.text !== undefined) {
      // Object with text and color from range_to_label
      element.textContent = value.text;
      if (value.color) {
        element.classList.add(`ui-text--${value.color}`);
      }
    } else {
      // Plain string value
      element.textContent = value;
    }
  }

  /**
   * Generate clipboard text for copy button
   * @returns {string} - Formatted text for clipboard
   */
  generateClipboardText() {
    const labelColumnWidth = 28;

    let text = '```\n';
    text += `${this._config.copy_title}\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `${'═'.repeat(30)}\n\n`;

    const sections = Object.entries(this._config.sections);
    for (let i = 0; i < sections.length; i++) {
      const [sectionKey, section] = sections[i];

      text += `${'-'.repeat(10)} ${section.title.toUpperCase()}\n`;

      for (const [label, value] of Object.entries(section.data)) {
        const processedValue = parseTemplate(value, this._hass);
        // Extract text from color objects
        const displayValue = (processedValue && typeof processedValue === 'object' && processedValue.text !== undefined)
          ? processedValue.text
          : processedValue;
        const dots = '.'.repeat(Math.max(1, labelColumnWidth - label.length));
        text += `${label}${dots} ${displayValue}\n`;
      }

      text += `${'-'.repeat(labelColumnWidth)}\n`;

      if (i < sections.length - 1) {
        text += `\n\n\n\n`;
      }
    }

    text += '```';
    return text;
  }

  /**
   * Render sections with collapsible headers and data rows
   * @returns {string} - HTML string for sections
   */
  renderSections() {
    return Object.entries(this._config.sections)
      .map(([sectionKey, section]) => {
        const dataRows = Object.entries(section.data)
          .map(([label, value]) => {
            const processedValue = parseTemplate(value, this._hass);
            const dataLabel = this.sanitizeLabel(label);
            // Handle color objects from range_to_label
            let displayValue, colorClass = '';
            if (processedValue && typeof processedValue === 'object' && processedValue.text !== undefined) {
              displayValue = processedValue.text;
              if (processedValue.color) {
                colorClass = ` ui-text--${processedValue.color}`;
              }
            } else {
              displayValue = processedValue;
            }
            return `<div class="ui-data-row ui-data-row--compact" data-label="${dataLabel}"> <span class="ui-data-row__label">${label}</span> <span class="ui-data-row__value${colorClass}">${displayValue}</span> </div>`;
          })
          .join('');

        return `<div class="ui-collapsible-section" data-section-id="${sectionKey}" data-initial-state="expanded"> <button class="ui-collapsible-section__header"> <span class="ui-collapsible-section__title">${section.title}</span> <span class="ui-collapsible-section__arrow"></span> </button> <div class="ui-collapsible-section__content"> ${dataRows} </div> </div>`;
      })
      .join('');
  }

  render() {
    if (!this._config || !this._hass) return;

    const sectionsHTML = this.renderSections();

    this.shadowRoot.innerHTML = `
      <style>
        .ui-card {
          height: calc(var(--ui-space-9) * 13);
          min-height: calc(var(--ui-space-9) * 13);
          max-height: calc(var(--ui-space-9) * 13);
          display: flex;
          flex-direction: column;
        }

        .sections-container {
          flex: 1;
          min-height: 0;
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
      </style>

      <div class="ui-card">
        <div class="ui-card-header">
          <div class="ui-card-header__accent"></div>
          <h2 class="ui-card-header__title">${this._config.card_title}</h2>
        </div>

        <div class="ui-card-actions">
          <button id="copyBtn" class="ui-copy-btn" aria-label="Copy specifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="ui-btn ui-btn--accent ui-btn--icon ui-btn--large" id="toggleAllBtn" aria-label="Toggle all sections">
            <span class="ui-btn__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </span>
          </button>
        </div>

        <div class="sections-container ui-scrollable ui-scrollable--hidden">
          ${sectionsHTML}
        </div>
      </div>
    `;

    this._isRendered = true;
    this.attachEvents();
  }

  attachEvents() {
    const root = this.shadowRoot;
    if (!root) return;

    initCollapsibleSections(root);

    const copyBtn = root.querySelector("#copyBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const clipboardText = this.generateClipboardText();
        await handleCopyButton(copyBtn, clipboardText);
      });
    }

    const toggleAllBtn = root.querySelector("#toggleAllBtn");
    const toggleIcon = toggleAllBtn?.querySelector('.ui-btn__icon svg');

    // Check actual state of sections to set initial button state
    const sections = root.querySelectorAll('.ui-collapsible-section');
    const collapsedCount = root.querySelectorAll('.ui-collapsible-section--collapsed').length;
    let isExpanded = collapsedCount < sections.length / 2;

    // Set initial icon state
    if (toggleIcon) {
      if (isExpanded) {
        toggleIcon.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"></line>';
      } else {
        toggleIcon.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>';
      }
    }

    if (toggleAllBtn && toggleIcon) {
      toggleAllBtn.addEventListener("click", () => {
        isExpanded = !isExpanded;
        toggleAllSections(root, isExpanded);

        if (isExpanded) {
          toggleIcon.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"></line>';
        } else {
          toggleIcon.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>';
        }
      });
    }
  }
}

customElements.define("specs-card", SpecsCard);