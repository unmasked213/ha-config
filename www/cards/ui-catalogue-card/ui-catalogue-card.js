// ══════════════════════════════════════════════════════════════════════════════
//  UI CATALOGUE CARD
//  Single-card component catalogue for the shared UI design system.
//  Renders every component in its real Shadow DOM environment with adopted
//  stylesheets, matching exactly how production cards see them.
// ══════════════════════════════════════════════════════════════════════════════

import "/local/base/foundation.js";
import { uiComponents } from "/local/base/components.js";
import { uiToggles } from "/local/base/toggles.js";
import { uiCheckboxes } from "/local/base/checkboxes.js";
import { uiRadios } from "/local/base/radios.js";
import { uiSkeletons } from "/local/base/skeletons.js";
import { uiDrawer } from "/local/base/drawer.js";
import { uiNumberInput } from "/local/base/number-input.js";
import { applyThemeClass, initButtons } from "/local/base/helpers.js";

import { catalogueStyles } from "./styles.js";
import { COMPONENT_REGISTRY, getCategories, getComponentsByCategory } from "./registry.js";
import * as renderMethods from "./render.js";
import * as eventMethods from "./events.js";
import * as demoMethods from "./demos.js";


class UICatalogueCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
  }
  connectedCallback() {
    this.innerHTML = `<p style="padding:16px;color:var(--secondary-text-color)">This card has no configurable options.</p>`;
  }
}
customElements.define("ui-catalogue-card-editor", UICatalogueCardEditor);


class UICatalogueCard extends HTMLElement {

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this._rootEl = document.createElement("div");
    this._rootEl.className = "cat-app";
    this.shadow.appendChild(this._rootEl);

    this.state = {
      activeCategory: "Controls",
      activeComponent: "button",
      activeVariant: null,
      searchTerm: "",
      sidebarOpen: false,
      headerMenuOpen: false,
    };

    this._hass = null;
    this._config = {};

    // Bound handlers for cleanup
    this._outsideClickHandler = (e) => {
      const path = e.composedPath?.() || [];
      if (this.state.sidebarOpen) {
        const sidebar = this.shadow.querySelector(".cat-sidebar");
        if (sidebar && !path.includes(sidebar)) {
          this.state.sidebarOpen = false;
          sidebar.classList.remove("is-open");
          const bd = this.shadow.getElementById("catSidebarBackdrop");
          if (bd) bd.classList.remove("is-visible");
        }
      }
      // Close header menu on outside click
      if (this.state.headerMenuOpen) {
        const inDropdown = path.some(el => el.classList?.contains("dropdown-container"));
        if (!inDropdown) {
          this.state.headerMenuOpen = false;
          const menu = this.shadow.getElementById("catHeaderMenu");
          if (menu) menu.classList.remove("ui-menu--open");
        }
      }
    };
  }


  // ── HA Lifecycle ────────────────────────────────────────────────────────

  set hass(hass) {
    const themeChanged = this._hass?.themes?.darkMode !== hass?.themes?.darkMode;
    this._hass = hass;
    if (themeChanged) {
      applyThemeClass(this, hass);
      const cb = this.shadow?.querySelector("#catHeaderMenuDarkMode .ui-checkbox__input");
      if (cb) cb.checked = hass?.themes?.darkMode ?? false;
    }
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    this._config = config || {};
  }

  getCardSize() {
    return 12;
  }

  static getConfigElement() {
    return document.createElement("ui-catalogue-card-editor");
  }

  static getStubConfig() {
    return {};
  }


  // ── Custom Element Lifecycle ────────────────────────────────────────────

  connectedCallback() {
    this.shadow.adoptedStyleSheets = [
      window.uiFoundation,
      uiComponents,
      uiToggles,
      uiCheckboxes,
      uiRadios,
      uiSkeletons,
      uiDrawer,
      uiNumberInput,
      catalogueStyles,
    ];

    if (this._hass) {
      applyThemeClass(this, this._hass);
    }

    document.addEventListener("click", this._outsideClickHandler, true);
    this.render();
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._outsideClickHandler, true);
  }
}


// ── Mixin module methods onto prototype ───────────────────────────────────

Object.assign(UICatalogueCard.prototype, renderMethods);
Object.assign(UICatalogueCard.prototype, eventMethods);
Object.assign(UICatalogueCard.prototype, demoMethods);

UICatalogueCard.prototype._updateCatClearButton = function () {
  const btn = this.shadow.getElementById("catSearchClear");
  if (btn) btn.style.display = this.state.searchTerm ? "inline-flex" : "none";
};


// ── Register ─────────────────────────────────────────────────────────────

customElements.define("ui-catalogue-card", UICatalogueCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ui-catalogue-card",
  name: "UI Catalogue",
  description: "Interactive component catalogue for the shared UI design system.",
});
