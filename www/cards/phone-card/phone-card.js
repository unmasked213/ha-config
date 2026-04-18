// /config/www/cards/phone-card.js
import "/local/base/foundation.js";
import { uiComponents } from "/local/base/components.js";
import { applyThemeClass } from "/local/base/helpers.js";

class PhoneCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
  }
  connectedCallback() {
    this.innerHTML = `<p style="padding:16px;color:var(--secondary-text-color)">This card has no configurable options.</p>`;
  }
}
customElements.define("phone-card-editor", PhoneCardEditor);

class PhoneCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("phone-card-editor");
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
    this._isRendered = false;
    this._menuOpen = false;
  }

  setConfig(config) {
    this._config = {
      card_title: config.card_title || "Phone",
      ringer_entity: config.ringer_entity || "sensor.phone_c_ringer_mode",
      flashlight_entity: config.flashlight_entity || "binary_sensor.phone_c_flashlight",
      location_entity: config.location_entity || "person.cam",
      home_zone: config.home_zone || "zone.home",
      places_entity: config.places_entity || "sensor.location_cam_phone",
      status_entities: Object.assign({
        status: "sensor.location_status_display",
        distance: "sensor.location_distance_display",
        eta: "sensor.location_eta_display",
        updated: "sensor.location_updated_display"
      }, config.status_entities || {})
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
    this._boundHandleOutsideClick = this._handleOutsideClick.bind(this);
    document.addEventListener("click", this._boundHandleOutsideClick);
  }

  disconnectedCallback() {
    this._isRendered = false;
    this._mapEl = null;
    document.removeEventListener("click", this._boundHandleOutsideClick);
  }

  _handleOutsideClick(e) {
    if (this._menuOpen && !this.shadowRoot.contains(e.target)) {
      this.closeMenu();
    }
  }

  getCardSize() {
    return 3;
  }

  getRingerMode() {
    const entity = this._hass?.states?.[this._config.ringer_entity];
    return entity?.state || "normal";
  }

  getRingerLabel(mode) {
    const labels = {
      normal: "Normal",
      vibrate: "Vibrate",
      silent: "Silent"
    };
    return labels[mode] || mode;
  }

  getRingerIcon(mode) {
    const icons = {
      normal: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
      vibrate: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M0 15h2V9H0v6zm3 2h2V7H3v10zm19-8v6h2V9h-2zm-3 8h2V7h-2v10zM16.5 3h-9C6.67 3 6 3.67 6 4.5v15c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zM16 19H8V5h8v14z"/></svg>`,
      silent: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`
    };
    return icons[mode] || icons.normal;
  }

  isFlashlightOn() {
    const entity = this._hass?.states?.[this._config.flashlight_entity];
    return entity?.state === "on";
  }

  updateValues() {
    if (!this._config || !this._hass || !this._isRendered) return;

    const root = this.shadowRoot;
    const mainBtn = root.querySelector(".ui-split__main");
    const mode = this.getRingerMode();

    if (mainBtn) {
      mainBtn.innerHTML = `
        <span class="ui-split__icon">${this.getRingerIcon(mode)}</span>
        <span class="ui-split__label">${this.getRingerLabel(mode)}</span>
      `;
    }

    // Update selected state in menu
    root.querySelectorAll(".ui-menu__item").forEach(item => {
      item.classList.toggle("ui-menu__item--selected", item.dataset.mode === mode);
    });

    // Update flashlight toggle state
    const torchBtn = root.querySelector("#torchBtn");
    if (torchBtn) {
      torchBtn.classList.toggle("is-selected", this.isFlashlightOn());
    }

    // Keep ha-map's hass reference fresh so the marker moves without re-render
    if (this._mapEl) this._mapEl.hass = this._hass;

    // Update status strip text
    this.updateStatusStrip();

    // Update location overlay label
    this.updateLocationLabel();
  }

  getStatusText(entityId) {
    const entity = this._hass?.states?.[entityId];
    const state = entity?.state;
    if (!state || state === "unknown" || state === "unavailable") return "—";
    return state;
  }

  updateStatusStrip() {
    const root = this.shadowRoot;
    const cfg = this._config.status_entities;
    const map = {
      status: cfg.status,
      distance: cfg.distance,
      eta: cfg.eta,
      updated: cfg.updated
    };
    Object.keys(map).forEach(key => {
      const el = root.querySelector(`.phone-card__status-value[data-key="${key}"]`);
      if (el) el.textContent = this.getStatusText(map[key]);
    });
  }

  async mountMap() {
    const slot = this.shadowRoot.querySelector("#mapSlot");
    if (!slot || this._mapEl) return;

    // ha-map is lazy-loaded by HA — only registered when a map card is
    // present. On dashboards without one, we trigger the bundle by
    // creating a throwaway hui-map-card via the official card-helpers API.
    if (!customElements.get("ha-map")) {
      try {
        const helpers = await window.loadCardHelpers();
        await helpers.createCardElement({
          type: "map",
          entities: [this._config.home_zone]
        });
      } catch (e) {
        console.warn("[phone-card] Failed to bootstrap ha-map loader:", e);
      }
    }

    // Give the lazy import a short deadline; if it never resolves,
    // surface a visible fallback instead of hanging forever.
    const deadline = new Promise((_, rej) => setTimeout(() => rej(new Error("ha-map load timeout")), 5000));
    try {
      await Promise.race([customElements.whenDefined("ha-map"), deadline]);
    } catch (e) {
      slot.textContent = "Map unavailable";
      slot.style.display = "flex";
      slot.style.alignItems = "center";
      slot.style.justifyContent = "center";
      slot.style.color = "var(--ui-text-mute)";
      console.error("[phone-card]", e);
      return;
    }

    const map = document.createElement("ha-map");
    map.hass = this._hass;
    map.entities = [this._config.location_entity, this._config.home_zone];
    map.zoom = 15;
    map.autoFit = true;
    map.fitZones = true;
    map.interactiveZones = false;
    map.renderPassive = false;

    slot.appendChild(map);
    this._mapEl = map;

    this.injectMapShadowStyles(map);
  }

  injectMapShadowStyles(map) {
    // ha-map's shadow root hosts the Leaflet container. Inject our
    // styles directly — CSS custom properties inherit through shadow
    // boundaries so our --ui-* and --phone-card-map-* tokens resolve.
    const apply = () => {
      if (!map.shadowRoot || map._phoneCardStyled) return;
      const styleEl = document.createElement("style");
      styleEl.textContent = `
        .leaflet-control-zoom,
        .leaflet-control-attribution,
        mwc-icon-button {
          display: none !important;
        }
        .leaflet-tile {
          filter: var(--phone-card-map-filter, none) !important;
          transition: filter 0.3s ease;
        }
        .leaflet-container {
          background: var(--ui-elevated-1) !important;
        }
        .leaflet-overlay-pane path {
          stroke: var(--ui-accent, rgba(35, 165, 245, 1)) !important;
          stroke-opacity: 0.8 !important;
          fill: var(--ui-accent, rgba(35, 165, 245, 1)) !important;
          fill-opacity: 0.12 !important;
        }
      `;
      map.shadowRoot.appendChild(styleEl);
      map._phoneCardStyled = true;
    };
    apply();
    if (!map._phoneCardStyled) requestAnimationFrame(apply);
  }

  getLocationLabel() {
    const entity = this._hass?.states?.[this._config.places_entity];
    if (!entity || entity.state === "unknown" || entity.state === "unavailable") {
      return { name: "—", area: "" };
    }
    const a = entity.attributes || {};
    const abbreviate = s => s
      ?.replace(/\bAvenue\b/i, "Av")
      ?.replace(/\bRoad\b/i, "Rd")
      ?.replace(/\bStreet\b/i, "St")
      ?.replace(/\bLane\b/i, "Ln")
      ?.replace(/\bDrive\b/i, "Dr");
    const name = abbreviate(a.street) || a.place_name || entity.state || "Unknown";
    const area = a.neighbourhood || a.city || a.locality || "";
    const postcode = (a.postal_code || "").trim().split(" ")[0];
    const areaLine = [area, postcode].filter(Boolean).join(" · ");
    return { name, area: areaLine };
  }

  updateLocationLabel() {
    const root = this.shadowRoot;
    const { name, area } = this.getLocationLabel();
    const nameEl = root.querySelector(".phone-card__map-label-name");
    const areaEl = root.querySelector(".phone-card__map-label-area");
    if (nameEl) nameEl.textContent = name;
    if (areaEl) {
      areaEl.textContent = area;
      areaEl.style.display = area ? "block" : "none";
    }
  }

  focusMap() {
    if (this._mapEl?.fitMap) this._mapEl.fitMap();
  }

  toggleMenu() {
    this._menuOpen = !this._menuOpen;
    const root = this.shadowRoot;
    const split = root.querySelector(".ui-split");
    const menu = root.querySelector(".ui-menu");

    split.classList.toggle("ui-split--open", this._menuOpen);
    menu.classList.toggle("ui-menu--open", this._menuOpen);
  }

  closeMenu() {
    this._menuOpen = false;
    const root = this.shadowRoot;
    const split = root.querySelector(".ui-split");
    const menu = root.querySelector(".ui-menu");

    split?.classList.remove("ui-split--open");
    menu?.classList.remove("ui-menu--open");
  }

  async callScript(scriptId) {
    await this._hass.callService("script", scriptId);
  }

  render() {
    if (!this._config || !this._hass) return;

    const mode = this.getRingerMode();
    const flashlightOn = this.isFlashlightOn();

    this.shadowRoot.innerHTML = `
      <style>
        .phone-card {
          display: flex;
          flex-direction: column;
          gap: var(--ui-space-4);
          padding: var(--ui-space-4);
        }

        .phone-card__actions {
          display: flex;
          gap: var(--ui-space-3);
          align-items: center;
        }

        .ui-split__icon {
          display: flex;
          align-items: center;
        }

        .ui-split__label {
          position: relative;
          z-index: 1;
        }

        :host {
          --phone-card-map-filter: saturate(60%) brightness(0.98) contrast(1.02);
        }
        :host(.dark-theme) {
          --phone-card-map-filter: saturate(45%) brightness(0.82) contrast(1.08) hue-rotate(185deg);
        }

        .phone-card__map {
          position: relative;
          border-radius: var(--ui-radius-xl);
          height: 240px; /* 60×4, 4px-grid aligned */
          overflow: hidden;
          background: var(--ui-elevated-1);
        }

        .phone-card__map ha-map {
          width: 100%;
          height: 100%;
          display: block;
          --map-background-color: var(--ui-elevated-1);
        }

        .phone-card__map-label {
          position: absolute;
          bottom: var(--ui-space-3);
          left: var(--ui-space-3);
          z-index: 2;
          background: var(--ui-elevated-2);
          border-radius: var(--ui-radius-l);
          padding: var(--ui-space-3) var(--ui-space-4);
          color: var(--ui-text);
          max-width: 60%;
          line-height: 1.3;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
          pointer-events: none;
        }

        .phone-card__map-label-name {
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .phone-card__map-label-area {
          font-size: 0.75rem;
          color: var(--ui-text-mute);
          margin-top: 2px;
        }

        .phone-card__map-focus {
          position: absolute;
          bottom: var(--ui-space-3);
          right: var(--ui-space-3);
          z-index: 2;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: var(--ui-radius-l);
          background: var(--ui-elevated-2);
          color: var(--ui-text);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
          transition: transform var(--ui-motion-fast, 120ms), background var(--ui-motion-fast, 120ms);
        }

        .phone-card__map-focus:hover {
          background: var(--ui-elevated-3);
          transform: scale(1.04);
        }

        .phone-card__map-focus:active {
          transform: scale(0.96);
        }

        .phone-card__map-focus svg {
          width: 18px;
          height: 18px;
        }

        .phone-card__status {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ui-space-4);
          padding: var(--ui-space-2) var(--ui-space-1);
          color: var(--ui-text-mute);
          font: var(--ui-type-body-s);
        }

        .phone-card__status-item {
          display: inline-flex;
          align-items: center;
          gap: var(--ui-space-2);
        }

        .phone-card__status-item svg {
          width: 16px;
          height: 16px;
          opacity: 0.8;
          flex-shrink: 0;
        }

        .phone-card__status-value {
          font-variant-numeric: tabular-nums;
        }
      </style>

      <div class="ui-card">
        <div class="ui-card-header">
          <div class="ui-card-header__accent"></div>
          <h2 class="ui-card-header__title">${this._config.card_title}</h2>
        </div>

        <div class="phone-card">
          <div class="phone-card__actions">
            <!-- Find My Phone -->
            <button class="ui-btn ui-btn--accent ui-btn--filled" id="findBtn" aria-label="Find my phone">
              <ha-icon icon="fluent:phone-shake-24-regular"></ha-icon>
              <span>Find</span>
            </button>

            <!-- Ringer Mode Split Button -->
            <div class="ui-split">
              <button class="ui-split__main" id="ringerMain">
                <span class="ui-split__icon">${this.getRingerIcon(mode)}</span>
                <span class="ui-split__label">${this.getRingerLabel(mode)}</span>
              </button>
              <button class="ui-split__arrow" id="ringerArrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>

              <div class="ui-menu" role="menu">
                <button class="ui-menu__item ${mode === 'normal' ? 'ui-menu__item--selected' : ''}" data-mode="normal" role="menuitem">
                  Normal
                </button>
                <button class="ui-menu__item ${mode === 'vibrate' ? 'ui-menu__item--selected' : ''}" data-mode="vibrate" role="menuitem">
                  Vibrate
                </button>
                <button class="ui-menu__item ${mode === 'silent' ? 'ui-menu__item--selected' : ''}" data-mode="silent" role="menuitem">
                  Silent
                </button>
              </div>
            </div>

            <!-- Flashlight Toggle -->
            <button class="ui-btn ui-btn--toggle ui-btn--icon ${flashlightOn ? 'is-selected' : ''}" id="torchBtn" aria-label="Toggle flashlight">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 14l3 3v5h6v-5l3-3V9H6v5zm5-12h2v3h-2V2zM3.5 5.88l1.41-1.41 2.12 2.12L5.62 8 3.5 5.88zm13.46.71l2.12-2.12 1.41 1.41L18.38 8l-1.42-1.41z"/>
              </svg>
            </button>
          </div>

          <div class="phone-card__map" id="mapSlot">
            <div class="phone-card__map-label" id="mapLabel">
              <div class="phone-card__map-label-name">—</div>
              <div class="phone-card__map-label-area"></div>
            </div>
            <button class="phone-card__map-focus" id="mapFocusBtn" aria-label="Recentre map">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 9V5a1 1 0 0 1 1-1h4"/>
                <path d="M4 15v4a1 1 0 0 0 1 1h4"/>
                <path d="M20 9V5a1 1 0 0 0-1-1h-4"/>
                <path d="M20 15v4a1 1 0 0 1-1 1h-4"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>

          <div class="phone-card__status" role="status">
            <span class="phone-card__status-item">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              <span class="phone-card__status-value" data-key="status">—</span>
            </span>
            <span class="phone-card__status-item">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              <span class="phone-card__status-value" data-key="distance">—</span>
            </span>
            <span class="phone-card__status-item">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
              <span class="phone-card__status-value" data-key="eta">—</span>
            </span>
            <span class="phone-card__status-item">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4a8 8 0 1 0 7.73 10H17.65A5.997 5.997 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35zM12.5 8H11v5l4.25 2.52.75-1.23-3.5-2.08V8z"/></svg>
              <span class="phone-card__status-value" data-key="updated">—</span>
            </span>
          </div>
        </div>
      </div>
    `;

    this._isRendered = true;
    this.attachEvents();
    this.mountMap();
    this.updateStatusStrip();
    this.updateLocationLabel();
  }

  attachEvents() {
    const root = this.shadowRoot;

    // Find button
    const findBtn = root.querySelector("#findBtn");
    findBtn?.addEventListener("click", () => {
      this.callScript("phone_c_find");
    });

    // Split button arrow toggles menu
    const ringerArrow = root.querySelector("#ringerArrow");
    ringerArrow?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    // Menu items
    root.querySelectorAll(".ui-menu__item").forEach(item => {
      item.addEventListener("click", (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.callScript(`phone_c_ringer_${mode}`);
        this.closeMenu();
      });
    });

    // Flashlight toggle
    const torchBtn = root.querySelector("#torchBtn");
    torchBtn?.addEventListener("click", () => {
      this.callScript("phone_c_flashlight_toggle");
    });

    // Map focus / recentre button
    const focusBtn = root.querySelector("#mapFocusBtn");
    focusBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.focusMap();
    });
  }
}

customElements.define("phone-card", PhoneCard);