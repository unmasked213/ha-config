// /config/www/cards/priority-matrix-card/priority-matrix-card.js
// Entry point — card class and custom element registration

import "/local/base/foundation.js";
import { uiComponents } from "/local/base/components.js";
import { applyThemeClass, initButtons } from "/local/base/helpers.js";
import { uiNumberInput } from "/local/base/number-input.js";
import { uiDrawer } from "/local/base/drawer.js";
import "/local/cards/ui-circle-slider.js";

import { cardStyles } from "./styles.js";
import { buildCard, updateSortIndicators } from "./render.js";
import { attachEvents, fetchItems, updateFooter, recalcAllScores } from "./events.js";
import { DEFAULT_WEIGHTS } from "./constants.js";

/* ── Editor ───────────────────────────────────────────────────────────── */
class PriorityMatrixCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; }
  connectedCallback() {
    this.innerHTML = `<p style="padding:var(--ui-space-4);color:var(--ui-text-mute)">
      Configure with: entity (required), title (optional), weights (optional)</p>`;
  }
}
customElements.define("priority-matrix-card-editor", PriorityMatrixCardEditor);

/* ── Card ─────────────────────────────────────────────────────────────── */
class PriorityMatrixCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("priority-matrix-card-editor");
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
    this._rendered = false;
    this._tasks = new Map();  // uid → { uid, summary, scores }
    this._weights = { ...DEFAULT_WEIGHTS };
    this._sortKey = "score";
    this._sortDir = "desc";
    this._lastEntityUpdate = null;
    this._fetchGen = 0;
    this._initialLoadDone = false;
  }

  setConfig(config) {
    if (!config.entity) throw new Error("entity is required");
    this._config = {
      entity: config.entity,
      title: config.title ?? "HA priority matrix",
      weights: { ...DEFAULT_WEIGHTS, ...config.weights },
    };
    this._weights = { ...this._config.weights };

    if (this._hass) {
      if (!this._rendered) this._buildUI();
      this._fetchItems();
    }
  }

  set hass(hass) {
    this._hass = hass;
    applyThemeClass(this, hass);
    if (!this._config) return;

    if (!this._rendered) this._buildUI();

    const entity = hass.states[this._config.entity];
    if (!entity) return;

    if (entity.last_updated !== this._lastEntityUpdate) {
      this._lastEntityUpdate = entity.last_updated;
      this._fetchItems();
    }
  }

  connectedCallback() {
    this.shadowRoot.adoptedStyleSheets = [
      window.uiFoundation,
      uiComponents,
      uiNumberInput,
      uiDrawer,
      cardStyles,
    ];
    initButtons(this.shadowRoot);

    if (this._hass) applyThemeClass(this, this._hass);

    if (this._hass && this._config && !this._rendered) {
      this._buildUI();
      this._fetchItems();
    }
  }

  disconnectedCallback() {
    this._rendered = false;
    this._tasks.clear();
    this._lastEntityUpdate = null;
  }

  getCardSize() {
    return 4;
  }

  _buildUI() {
    if (this._rendered) return;

    buildCard(this.shadowRoot, this._config);

    this._rendered = true;
    attachEvents(this);
    updateSortIndicators(this.shadowRoot, this._sortKey, this._sortDir);
  }

  _fetchItems() {
    fetchItems(this);
  }
}

customElements.define("priority-matrix-card", PriorityMatrixCard);
