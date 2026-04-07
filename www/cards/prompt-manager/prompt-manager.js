// | START: prompt-manager.js
// |  PATH: www/cards/prompt-manager/prompt-manager.js
// InputsInferred: []
// Entry point and card class. Owns all state via this.state. Render and event
// methods are mixed in from modules/render.js and modules/events.js via
// Object.assign on the prototype — exported functions in those files become
// instance methods with `this` bound to the card.
// Depends on: ./modules/render.js, ./modules/events.js, ./modules/data.js,
//   ./modules/highlight.js, ./modules/styles.js,
//   /local/base/foundation.js (side-effect: registers --ui-* tokens),
//   /local/base/helpers.js, /local/base/components.js, /local/base/checkboxes.js,
//   /local/base/number-input.js,
//   custom_components/prompt_manager (WebSocket backend)
import '/local/base/foundation.js';
import { applyThemeClass, initButtons } from '/local/base/helpers.js';
import { uiComponents } from '/local/base/components.js';
import { uiCheckboxes } from '/local/base/checkboxes.js';
import '/local/base/number-input.js';
import { pmStyles } from './modules/styles.js';
import { loadPromptsFromStorage, savePromptsToLocalStorage, savePromptsToBackend, fetchPromptsFromBackend, attemptBackendSync } from './modules/data.js';
import { initHighlighter } from './modules/highlight.js';
import * as renderMethods from './modules/render.js';
import * as eventMethods from './modules/events.js';



class PromptManagerCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
  }
  connectedCallback() {
    this.innerHTML = `<p style="padding:16px;color:var(--secondary-text-color)">This card has no configurable options.</p>`;
  }
}
customElements.define("prompt-manager-card-editor", PromptManagerCardEditor);

class PromptManagerCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("prompt-manager-card-editor");
  }
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this._rootEl = document.createElement("div");
    this._rootEl.className = "pm-root";
    this.shadow.appendChild(this._rootEl);

    this.config = {};
    this._devMode = false;
    this.state = {
      prompts: [],
      searchTerm: "",
      selectedCategory: null,
      showAddForm: false,
      editingPrompt: null,
      deleteConfirmation: null,
      viewingPrompt: null,
      optimizingPrompt: null,
      movement: {},
      selectedScope: "No Focus",
      scopeDropdownOpen: false,
      scoring: {},
      justScored: {},
      showTableModal: false,
      headerMenuOpen: false,
      tableColumns: {
        category: true,
        score: true,
        version: false,
        uses: false,
        tokens: false,
        description: false
      },
      tableSort: { column: 'score', direction: 'desc' },
      // Form category dropdown state (arrays for multi-select)
      formCategory: {
        add: [],   // [] = no selection
        edit: []   // Will be populated when editing
      },
      formCategoryOpen: {
        add: false,
        edit: false
      },
      // Version history modal
      versionHistoryPrompt: null,
      // Fill-in modal for prompts with variables
      fillingPrompt: null,
      // Dev tools — manual score modal (stores prompt id)
      devScoreModal: null
    };

    this._pendingBackendSync = false;
    this._justScoredTimers = new Map();
    this._gridSnapshots = null;
    this._introPlayed = false;

    this._outsideClickBound = false;
    this._escBound = false;
    this._searchKeyBound = false;
    this._outsideClickHandler = this._handleOutsideClick.bind(this);
    this._escHandler = this._handleEsc.bind(this);
    this._hoverTooltipTimer = null;

    // Bind handlers that are passed directly to addEventListener
    this.handleSearchInput = this.handleSearchInput.bind(this);
    this.handleSearchClear = this.handleSearchClear.bind(this);
    this.handleFormCancel = this.handleFormCancel.bind(this);

    this._visibilityHandler = null;
    this._devModeOffTimer = null;
  }

  setConfig(config) {
    this.config = config;
    this.state.prompts = loadPromptsFromStorage();
    this.render();
  }

  set hass(hass) {
    const firstLoad = !this._hass;
    this._hass = hass;
    applyThemeClass(this, hass);  // Sync theme with HA

    // Track dev mode entity — re-render on change
    const devEntity = 'input_boolean.prompt_manager_dev_mode';
    const newDev = hass?.states?.[devEntity]?.state === 'on';
    if (newDev !== this._devMode) {
      this._devMode = newDev;
      if (!firstLoad
        && !this.state.showAddForm && !this.state.editingPrompt
        && !this.state.fillingPrompt && !this.state.optimizingPrompt
        && !this.state.versionHistoryPrompt && !this.state.devScoreModal
        && !this.state.deleteConfirmation && !this.state.showTableModal) {
        this.render();
      }
    }

    if (firstLoad) {
      this._fetchAndApplyBackendPrompts();
    } else {
      if (this._pendingBackendSync && hass?.connection) {
        attemptBackendSync(this._hass, this.state.prompts).then(synced => {
          if (synced) this._pendingBackendSync = false;
        });
      }
    }
  }

  async _fetchAndApplyBackendPrompts() {
    const result = await fetchPromptsFromBackend(this._hass);
    if (!result) {
      // Backend unavailable — play intro on whatever data we have
      this._playIntro();
      return;
    }
    this.state.prompts = result.prompts;
    if (result.shouldSeedBackend) {
      const synced = await savePromptsToBackend(this._hass, this.state.prompts);
      this._pendingBackendSync = !synced;
    }
    savePromptsToLocalStorage(this.state.prompts);
    this.render();
    this._playIntro();
    if (this._pendingBackendSync) {
      attemptBackendSync(this._hass, this.state.prompts).then(synced => {
        if (synced) this._pendingBackendSync = false;
      });
    }
  }

  connectedCallback() {
    // Cancel any pending dev mode auto-off timer (user returned in time)
    if (this._devModeOffTimer) {
      clearTimeout(this._devModeOffTimer);
      this._devModeOffTimer = null;
    }

    // Adopt UI system stylesheets
    this.shadow.adoptedStyleSheets = [
      window.uiFoundation,
      uiComponents,
      uiCheckboxes,
      pmStyles
    ];

    initButtons(this.shadow);

    // Pre-load Prism + custom prompt grammar (fire-and-forget —
    // ready well before the user opens a view modal)
    initHighlighter();

    if (!this._outsideClickBound) {
      document.addEventListener(
        "click",
        this._outsideClickHandler,
        true
      );
      this._outsideClickBound = true;
    }
    if (!this._escBound) {
      document.addEventListener(
        "keydown",
        this._escHandler,
        true
      );
      this._escBound = true;
    }
    if (!this._searchKeyBound) {
      this.addEventListener(
        "keydown",
        (e) => {
          const input = this.shadow.getElementById("search-input");
          if (input && document.activeElement === input)
            e.stopPropagation();
        },
        { capture: true }
      );
      this._searchKeyBound = true;
    }
    // Skip backend re-fetch while any modal is open — the fetch calls
    // render() which rebuilds the DOM, wiping unsaved user input.
    this._visibilityHandler = () => {
      if (document.visibilityState === "visible"
        && !this.state.showAddForm && !this.state.editingPrompt
        && !this.state.fillingPrompt && !this.state.optimizingPrompt
        && !this.state.versionHistoryPrompt && !this.state.devScoreModal
        && !this.state.deleteConfirmation && !this.state.showTableModal) {
        this._fetchAndApplyBackendPrompts();
      }
    };
    document.addEventListener(
      "visibilitychange",
      this._visibilityHandler
    );
    if (!this.state.prompts.length) {
      this.state.prompts = loadPromptsFromStorage();
      this.render();
    } else {
      this.render();
    }
    // Fallback: if backend fetch hasn't triggered the intro within
    // 2s (slow network or no hass connection), play it on current data.
    clearTimeout(this._introFallbackTimer);
    this._introFallbackTimer = setTimeout(() => this._playIntro(), 2000);
  }

  disconnectedCallback() {
    if (this._outsideClickBound) {
      document.removeEventListener(
        "click",
        this._outsideClickHandler,
        true
      );
      this._outsideClickBound = false;
    }
    if (this._escBound) {
      document.removeEventListener(
        "keydown",
        this._escHandler,
        true
      );
      this._escBound = false;
    }
    if (this._visibilityHandler) {
      document.removeEventListener(
        "visibilitychange",
        this._visibilityHandler
      );
      this._visibilityHandler = null;
    }
    clearTimeout(this._searchTimer);
    clearTimeout(this._hoverTooltipTimer);
    clearTimeout(this._introFallbackTimer);
    clearTimeout(this._devModeOffTimer);
    clearTimeout(this._refPulseTimer); // See _toggleCategory in events.js
    this._devModeOffTimer = null;
    this._justScoredTimers.forEach((timerId) => clearTimeout(timerId));
    this._justScoredTimers.clear();
    if (this._copyTimers) {
      this._copyTimers.forEach((timerId) => clearTimeout(timerId));
      this._copyTimers.clear();
    }

    // If dev mode is on, start a 3-minute countdown to turn it off
    if (this._devMode && this._hass?.connection) {
      this._devModeOffTimer = setTimeout(() => {
        this._devModeOffTimer = null;
        if (this._devMode && this._hass?.connection) {
          this._hass.callService('input_boolean', 'turn_off', {
            entity_id: 'input_boolean.prompt_manager_dev_mode'
          });
        }
      }, 3 * 60 * 1000);
    }
  }
}

Object.assign(PromptManagerCard.prototype, renderMethods);
Object.assign(PromptManagerCard.prototype, eventMethods);

// Signals to the HA Lovelace resource loader that this card is registered
PromptManagerCard.stub = true;
customElements.define("prompt-manager-card", PromptManagerCard);
// |   END: prompt-manager.js
