// /config/www/cards/work-actions-card/work-actions-card.js
import "/local/base/foundation.js";
import { applyThemeClass, initButtons, getHelperNumber, getHelperBoolean, getHelperSelect, persistHelper } from "/local/base/helpers.js";
import { escapeHtml } from "/local/base/utilities.js";
import { uiComponents, initCollapsibleSections, toggleAllSections } from "/local/base/components.js";
import { showRichTooltip, hideRichTooltip } from "/local/base/tooltips.js";
import { uiCheckboxes } from "/local/base/checkboxes.js";
import { uiDrawer, openDrawer, closeDrawer } from "/local/base/drawer.js";
import { showModal } from "/local/base/modals.js";
import "/local/base/number-input.js";

/* ── Editor ───────────────────────────────────────────────────────────── */
class WorkActionsCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; }
  connectedCallback() {
    this.innerHTML = `<p style="padding:var(--ui-space-4);color:var(--ui-text-mute)">
      Configure with: entity (required), title (optional)</p>`;
  }
}
customElements.define("work-actions-card-editor", WorkActionsCardEditor);

/* ── Component Styles ─────────────────────────────────────────────────── */
const styles = new CSSStyleSheet();
styles.replaceSync(`
  .card {
    position: relative;
    background: var(--ui-surface);
    border-radius: var(--ui-radius-l);
    padding: var(--ui-space-6) var(--ui-space-9);
    display: flex;
    flex-direction: column;
    height: var(--wac-height, 600px);
    --ui-drawer-radius: var(--ui-radius-l);
  }

  .ui-card-header__title {
    flex: none;
  }

  .ui-card-header {
    padding-bottom: var(--ui-space-5);
    margin-bottom: var(--ui-space-4);
    margin-left: calc(-1 * var(--ui-space-5));
    margin-right: calc(-1 * var(--ui-space-5));
    padding-left: var(--ui-space-5);
    padding-right: var(--ui-space-5);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-med);
  }

  /* Drawer: round all corners, wider than default */
  .ui-drawer {
    border-radius: var(--ui-drawer-radius, var(--ui-radius-m));
    width: calc(var(--ui-space-10) * 8);
  }

  .ui-drawer__header .ui-copy-btn,
  .ui-drawer__header .ui-drawer__close {
    flex-shrink: 0;
  }

  .ui-drawer__header {
    gap: var(--ui-space-6);
  }

  /* Menu container */
  .wac-menu-container {
    position: absolute;
    right: var(--ui-space-4);
    top: var(--ui-space-6);
    z-index: 1;
  }

  .wac-menu-container .ui-menu--down {
    bottom: auto;
    top: calc(100% + var(--ui-space-2));
    right: 0;
    left: auto;
  }

  #wac-menu-btn {
    position: relative;
    overflow: visible;
  }

  .wac-menu__dot {
    position: absolute;
    top: 0;
    right: 0;
    width: var(--ui-space-2);
    height: var(--ui-space-2);
    border-radius: var(--ui-radius-pill);
    background: var(--ui-error);
    pointer-events: none;
  }

  .wac-menu__toggle {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    pointer-events: none;
  }

  .wac-menu__toggle .ui-checkbox__input {
    pointer-events: none;
  }

  .items {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--ui-space-3);
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: visible;
    scrollbar-width: none;
    padding-top: var(--ui-space-1);
    padding-left: var(--ui-space-1);
  }

  .items::-webkit-scrollbar {
    display: none;
  }

  .items:empty::after {
    content: "No items";
    color: var(--ui-text-mute);
    font-size: var(--ui-font-s);
    text-align: center;
    padding: var(--ui-space-4) 0;
  }

  .items[data-unavailable]::after {
    content: "Entity unavailable";
  }

  .row {
    position: relative;
    overflow: visible;
    display: grid;
    grid-template-columns: var(--ui-space-6) auto;
    align-items: start;
    cursor: pointer;
    padding: var(--ui-space-3) var(--ui-space-4);
    border-radius: var(--ui-radius-m);
    background: var(--ui-elevated-1);
    transition: background var(--ui-motion-fast);
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  .row:hover {
    background: var(--ui-elevated-2);
  }

  .row--new::before {
    content: "";
    position: absolute;
    top: -4px;
    left: -4px;
    width: 8px;
    height: 8px;
    border-radius: var(--ui-radius-pill);
    background: var(--ui-pink);
    z-index: 1;
  }

  .checkbox-outer {
    position: relative;
    display: grid;
    align-items: center;
    justify-items: center;
    height: 15px;
    width: 15px;
    margin-top: var(--ui-space-1);
  }

  .checkbox {
    position: relative;
    height: 15px;
    width: 15px;
    display: grid;
    align-items: center;
  }

  .check-stroke {
    position: absolute;
    height: var(--ui-border-width-m);
    background: var(--ui-accent);
    border-radius: var(--ui-border-width-m);
    width: 0;
  }

  .check-before {
    right: 60%;
    transform-origin: right bottom;
  }

  .check-after {
    left: 40%;
    transform-origin: left bottom;
  }

  .check-before.checked {
    width: 5px;
    top: 8px;
    transform: rotate(45deg);
  }

  .check-after.checked {
    width: 10px;
    top: 8px;
    transform: rotate(-45deg);
  }

  .check-before.animating {
    animation: check-01 0.4s ease forwards;
  }

  .check-after.animating {
    animation: check-02 0.4s ease forwards;
  }

  .label-wrap {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: var(--ui-space-2);
    min-width: 0;
  }

  .label {
    cursor: pointer;
    transition: color var(--ui-motion-med);
    user-select: none;
    color: var(--ui-text);
    text-decoration: none;
    overflow-wrap: break-word;
    word-break: break-word;
    min-width: 0;
  }

  .label.checked {
    color: var(--ui-border-color-strong);
    text-decoration: line-through;
    text-decoration-color: var(--ui-border-color-strong);
  }

  .label.animating {
    animation: move 0.3s ease 0.1s forwards, strike-in 0.4s ease forwards;
  }

  .due {
    font-size: var(--ui-font-xs);
    white-space: nowrap;
    user-select: none;
  }

  .due:empty {
    display: none;
  }

  .due--overdue {
    color: var(--ui-error);
  }

  .due--soon {
    color: var(--ui-warning);
  }

  .due--future {
    color: var(--ui-text-mute);
  }

  .due.checked {
    color: var(--ui-border-color-strong);
  }

  .firework {
    position: absolute;
    height: var(--ui-space-1);
    width: var(--ui-space-1);
    top: 8px;
    left: -25px;
    border-radius: var(--ui-radius-pill);
  }

  .firework.animating {
    animation: firework 0.5s ease forwards 0.1s;
  }

  /* ── Keyframes ─────────────────────────────────────────────────────── */

  @keyframes move {
    50%  { padding-left: 8px; padding-right: 0px; }
    100% { padding-right: 4px; }
  }

  @keyframes strike-in {
    0%   { text-decoration-color: transparent; }
    40%  { text-decoration-color: transparent; }
    100% { text-decoration-color: var(--ui-border-color-strong); }
  }

  @keyframes check-01 {
    0%   { width: 4px; top: auto; transform: rotate(0); }
    50%  { width: 0px; top: auto; transform: rotate(0); }
    51%  { width: 0px; top: 8px;  transform: rotate(45deg); }
    100% { width: 5px; top: 8px;  transform: rotate(45deg); }
  }

  @keyframes check-02 {
    0%   { width: 4px; top: auto; transform: rotate(0); }
    50%  { width: 0px; top: auto; transform: rotate(0); }
    51%  { width: 0px; top: 8px;  transform: rotate(-45deg); }
    100% { width: 10px; top: 8px; transform: rotate(-45deg); }
  }

  @keyframes firework {
    0% {
      opacity: 1;
      box-shadow:
        0 0 0 -2px var(--ui-accent),
        0 0 0 -2px var(--ui-accent),
        0 0 0 -2px var(--ui-accent),
        0 0 0 -2px var(--ui-accent),
        0 0 0 -2px var(--ui-accent),
        0 0 0 -2px var(--ui-accent);
    }
    30% { opacity: 1; }
    100% {
      opacity: 0;
      box-shadow:
        0 -15px 0 0 var(--ui-accent),
        14px -8px 0 0 var(--ui-accent),
        14px 8px 0 0 var(--ui-accent),
        0 15px 0 0 var(--ui-accent),
        -14px 8px 0 0 var(--ui-accent),
        -14px -8px 0 0 var(--ui-accent);
    }
  }

  /* ── Drawer header override ───────────────────────────────────────── */

  .wac-drawer-header {
    border-bottom: none;
    align-items: flex-start;
  }

  .wac-drawer-header__text {
    flex: 1;
    min-width: 0;
  }

  .wac-drawer-header__subtitle {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
    margin: var(--ui-space-1) 0 0 0;
  }

  .wac-drawer-header__subtitle:empty {
    display: none;
  }

  .wac-drawer-header__actions {
    display: flex;
    align-items: center;
    gap: var(--ui-space-2);
    flex-shrink: 0;
  }

  /* ── Drawer collapsible overrides ──────────────────────────────────── */

  .ui-drawer .ui-collapsible-section {
    margin-bottom: var(--ui-space-4);
  }

  .ui-drawer .ui-collapsible-section:last-child {
    margin-bottom: 0;
  }

  .ui-drawer .ui-collapsible-section__header {
    padding: var(--ui-space-4) 0;
    min-height: auto;
  }

  .ui-drawer .ui-collapsible-section__title {
    padding-left: 0;
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
  }

  .wac-drawer-toggle-all {
    flex-shrink: 0;
  }

  /* ── Summary markdown ──────────────────────────────────────────────── */

  .ui-drawer__content h3,
  .ui-drawer__content h4,
  .ui-drawer__content h5,
  .ui-drawer__content h6 {
    font-size: var(--ui-font-s);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text-strong);
    margin: var(--ui-space-4) 0 var(--ui-space-2) 0;
    text-transform: uppercase;
    letter-spacing: var(--ui-font-letter-spacing-m);
  }

  .ui-drawer__content h3:first-child,
  .ui-drawer__content h4:first-child {
    margin-top: 0;
  }

  .ui-drawer__content p {
    font-size: var(--ui-font-s);
    color: var(--ui-text);
    margin: 0 0 var(--ui-space-2) 0;
    line-height: var(--ui-font-line-height-l);
  }

  .wac-section-items {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-2);
  }

  .wac-owner-group__actions {
    background: var(--ui-elevated-1);
    border-radius: var(--ui-radius-m);
    padding: var(--ui-space-3);
  }

  .wac-action-card + .wac-action-card {
    margin-top: var(--ui-space-5);
  }

  .wac-action-card__text {
    font-size: var(--ui-font-s);
    color: var(--ui-text);
    line-height: var(--ui-font-line-height-l);
    margin: 0;
  }

  .wac-action-card__text strong {
    color: var(--ui-text-strong);
  }

  .wac-action-card__meta {
    margin-top: -2px;
    font-size: var(--ui-font-xs);
  }

  .wac-item-due {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
  }

  .wac-item-due--overdue {
    color: var(--ui-error);
    font-weight: var(--ui-font-weight-l);
  }

  .wac-item-due--soon {
    color: var(--ui-warning);
    font-weight: var(--ui-font-weight-l);
  }

  .wac-owner-group {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-2);
    padding-top: var(--ui-space-4);
  }

  .wac-owner-group:first-child {
    padding-top: 0;
  }

  .wac-owner-group > .ui-badge {
    align-self: flex-start;
  }

  .wac-summary-empty {
    color: var(--ui-text-mute);
    font-size: var(--ui-font-s);
  }

  /* ── Meeting metadata ─────────────────────────────────────────────── */

  .wac-meeting-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ui-space-2);
    padding-bottom: var(--ui-space-4);
    margin-bottom: var(--ui-space-4);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
  }

  .wac-meeting-meta--interactive .ui-badge[data-speaker] {
    cursor: pointer;
    transition: opacity var(--ui-motion-fast);
    -webkit-user-select: none;
    user-select: none;
  }

  .wac-meeting-meta--interactive .ui-badge[data-speaker]:active {
    opacity: 0.7;
  }

  /* ── Speaker rename/merge modal ────────────────────────────────────── */

  .wac-speaker-modal {
    background: var(--ui-elevated-2);
    border-radius: var(--ui-radius-l);
    box-shadow: var(--ui-shadow-4);
    padding: var(--ui-space-6);
    width: 90%;
    max-width: 340px;
    position: relative;
  }

  .wac-speaker-modal__title {
    font-size: var(--ui-font-l);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text);
    margin: 0 0 var(--ui-space-4);
  }

  .wac-speaker-modal__subtitle {
    font-size: var(--ui-font-s);
    color: var(--ui-text-mute);
    margin: 0 0 var(--ui-space-4);
  }

  .wac-speaker-modal .ui-input {
    margin-bottom: var(--ui-space-4);
  }

  .wac-speaker-modal .ui-input__pill {
    border-radius: var(--ui-radius-pill);
  }

  .wac-speaker-modal .ui-input__pill.has-value .ui-input__label,
  .wac-speaker-modal .ui-input__pill:focus-within .ui-input__label {
    transform: translateY(calc(-1 * var(--ui-input-label-offset))) scale(0.75);
  }

  .wac-speaker-modal .ui-input__pill.has-value:not(:focus-within) .ui-input__label {
    color: var(--ui-text-mute);
  }

  .wac-speaker-modal__buttons {
    display: flex;
    gap: var(--ui-space-3);
    justify-content: flex-end;
    margin-top: var(--ui-space-5);
  }

  .wac-merge-options {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-3);
  }

  .wac-merge-option {
    display: flex;
    align-items: center;
    gap: var(--ui-space-3);
    padding: var(--ui-space-3) var(--ui-space-4);
    border-radius: var(--ui-radius-m);
    background: var(--ui-elevated-1);
    cursor: pointer;
    transition: background var(--ui-motion-fast);
    border: none;
    width: 100%;
    text-align: left;
    color: var(--ui-text);
    font-size: var(--ui-font-s);
  }

  .wac-merge-option:hover {
    background: var(--ui-state-hover);
  }

  .wac-merge-option[aria-checked="true"] {
    background: var(--ui-accent-faint);
    outline: var(--ui-border-width-m) solid var(--ui-accent);
  }

  .wac-merge-option__radio {
    width: 16px;
    height: 16px;
    border-radius: var(--ui-radius-pill);
    border: var(--ui-border-width-m) solid var(--ui-border-color-strong);
    flex-shrink: 0;
    position: relative;
  }

  .wac-merge-option[aria-checked="true"] .wac-merge-option__radio {
    border-color: var(--ui-accent);
  }

  .wac-merge-option[aria-checked="true"] .wac-merge-option__radio::after {
    content: "";
    position: absolute;
    inset: 3px;
    border-radius: var(--ui-radius-pill);
    background: var(--ui-accent);
  }

  .wac-speaker-modal__warning {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
    margin: var(--ui-space-4) 0 0;
    line-height: var(--ui-font-line-height-l);
  }

  /* ── Edit modal ───────────────────────────────────────────────────── */

  .wac-modal-backdrop {
    position: absolute;
    inset: 0;
    background: var(--ui-overlay-scrim);
    z-index: var(--ui-z-dialog);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--ui-motion-fast);
  }

  .wac-modal-backdrop.is-visible {
    opacity: 1;
    pointer-events: auto;
  }

  .wac-modal {
    background: var(--ui-elevated-2);
    border-radius: var(--ui-radius-l);
    box-shadow: var(--ui-shadow-4);
    padding: var(--ui-space-6);
    width: 90%;
    max-width: 400px;
    position: relative;
  }

  .wac-modal__close {
    position: absolute;
    top: var(--ui-space-4);
    right: var(--ui-space-4);
    background: transparent;
    border: none;
    color: var(--ui-text-mute);
    cursor: pointer;
    width: var(--ui-space-9);
    height: var(--ui-space-9);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--ui-radius-pill);
    transition: background var(--ui-motion-fast), color var(--ui-motion-fast);
  }

  .wac-modal__close:hover {
    background: var(--ui-state-hover);
    color: var(--ui-text);
  }

  .wac-modal__title {
    font-size: var(--ui-font-xl);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text);
    margin: 0 0 var(--ui-space-5);
  }

  .wac-modal .ui-input {
    margin-bottom: var(--ui-space-4);
  }

  .wac-modal .ui-input__pill {
    border-radius: var(--ui-radius-pill);
  }

  .wac-modal .ui-input__pill.has-value .ui-input__label,
  .wac-modal .ui-input__pill:focus-within .ui-input__label {
    transform: translateY(calc(-1 * var(--ui-input-label-offset))) scale(0.75);
  }

  .wac-modal .ui-input__pill.has-value:not(:focus-within) .ui-input__label {
    color: var(--ui-text-mute);
  }

  .wac-modal .ui-input__pill--error {
    border-color: var(--ui-error);
  }

  .wac-edit-buttons {
    display: flex;
    gap: var(--ui-space-3);
    justify-content: flex-end;
    margin-top: var(--ui-space-5);
  }

  /* ── Reduced motion ─────────────────────────────────────────────────── */

  @media (prefers-reduced-motion: reduce) {
    .check-before.animating,
    .check-after.animating {
      animation: none;
    }
    .check-before.animating {
      width: 5px; top: 8px; transform: rotate(45deg);
    }
    .check-after.animating {
      width: 10px; top: 8px; transform: rotate(-45deg);
    }
    .label {
      transition: none;
    }
    .label.animating {
      animation: none;
    }
    .firework.animating {
      animation: none;
    }
    .row {
      transition: none;
    }
  }
`);

/* ── Settings Constants ──────────────────────────────────────────────── */
const DEFAULTS = {
  maxHeight: 600,
  showCompleted: true,
  sortOrder: "Newest first",
  hoverTooltips: true,
  newIndicatorHours: 48,
  completedShelfDays: 7,
};

const HELPERS = {
  maxHeight: "input_number.wac_max_height",
  showCompleted: "input_boolean.wac_show_completed",
  sortOrder: "input_select.wac_sort_order",
  hoverTooltips: "input_boolean.wac_hover_tooltips",
  newIndicatorHours: "input_number.wac_new_indicator_hours",
  completedShelfDays: "input_number.wac_completed_shelf_days",
};

/* ── Card ─────────────────────────────────────────────────────────────── */
class WorkActionsCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("work-actions-card-editor");
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
    this._rendered = false;
    this._container = null;
    this._items = new Map();       // uid → { uid, summary, checked, due, description }
    this._rowEls = new Map();      // uid → row DOM element
    this._animTimers = new Map();  // uid → setTimeout ID
    this._lastEntityUpdate = null;
    this._fetchGen = 0;
    this._settings = { ...DEFAULTS };
    this._helpersAvailable = null;
    this._exitingRows = new Set();   // UIDs currently animating out
    this._exitTimers = new Map();    // uid → setTimeout ID for delayed exit
    this._drawerOpen = false;
    this._settingsDirty = false;
    this._drawerSectionsExpanded = false;
    this._lastTapTime = 0;
    this._lastTapUid = null;
    this._menuOpen = false;
    this._localStorageCleaned = false;
    this._pendingWrites = new Set(); // Setting keys with in-flight HA writes
    this._drawerMeetingDate = null;   // Meeting date for current drawer
    this._drawerMeetingTitle = null;  // Meeting title for current drawer
    this._drawerSpeakers = [];        // Parsed speaker names for current drawer
  }

  setConfig(config) {
    if (!config.entity) throw new Error("entity is required");
    this._config = {
      entity: config.entity,
      title: config.title ?? "Actions",
    };
    if (this._hass) {
      if (!this._rendered) this._ensureContainer();
      this._fetchItems();
    }
  }

  set hass(hass) {
    this._hass = hass;
    applyThemeClass(this, hass);
    if (!this._config) return;

    const prevShowCompleted = this._settings.showCompleted;
    const prevSortOrder = this._settings.sortOrder;
    this._loadSettingsFromHelpers();
    this._applyMaxHeight();

    // Re-patch if filter/sort settings changed externally (e.g. Developer Tools)
    if (this._settings.showCompleted !== prevShowCompleted || this._settings.sortOrder !== prevSortOrder) {
      this._syncMenuLabels();
      if (this._hass && this._config) this._fetchItems();
    }

    const entity = hass.states[this._config.entity];
    if (!entity) {
      if (this._container) {
        this._container.dataset.unavailable = "";
        // Clear stale rows so :empty::after can render
        for (const [uid] of this._rowEls) {
          this._rowEls.get(uid).remove();
          if (this._animTimers.has(uid)) {
            clearTimeout(this._animTimers.get(uid));
            this._animTimers.delete(uid);
          }
        }
        this._rowEls.clear();
        this._items.clear();
      }
      return;
    }
    if (this._container) delete this._container.dataset.unavailable;

    if (entity.last_updated !== this._lastEntityUpdate) {
      this._lastEntityUpdate = entity.last_updated;
      if (!this._rendered) this._ensureContainer();
      this._fetchItems();
    }
  }

  connectedCallback() {
    this.shadowRoot.adoptedStyleSheets = [window.uiFoundation, uiComponents, uiCheckboxes, uiDrawer, styles];
    initButtons(this.shadowRoot);
  }

  disconnectedCallback() {
    this._rendered = false;
    this._rowEls.clear();
    this._items.clear();
    this._animTimers.forEach(t => clearTimeout(t));
    this._animTimers.clear();
    this._exitTimers.forEach(t => clearTimeout(t));
    this._exitTimers.clear();
    this._exitingRows.clear();
    if (this._exitBatchTimer) {
      clearTimeout(this._exitBatchTimer);
      this._exitBatchTimer = null;
    }
    clearTimeout(this._hoverTooltipTimer);
    clearTimeout(this._tooltipShowTimer);
    clearTimeout(this._singleTapTimer);
    this._container = null;
    this._lastEntityUpdate = null;
    if (this._escBound) {
      document.removeEventListener("keydown", this._handleEsc);
      this._escBound = false;
    }
    if (this._menuOutsideClick) {
      document.removeEventListener("click", this._menuOutsideClick);
      this._menuOutsideClick = null;
    }
  }

  getCardSize() {
    return 4;
  }

  /* ── Container ─────────────────────────────────────────────────────── */

  _ensureContainer() {
    if (this._container) return;
    this.shadowRoot.innerHTML = "";

    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "ui-card-header";

    const accent = document.createElement("div");
    accent.className = "ui-card-header__accent";

    const title = document.createElement("h2");
    title.className = "ui-card-header__title";
    title.textContent = this._config.title;

    const infoIcon = document.createElement("ui-info-icon");
    infoIcon.setAttribute("position", "bottom");
    infoIcon.tooltipContent = {
      title: this._config.title,
      intro: "Auto-populated from meeting transcripts. Updates when new actions are extracted or existing ones progress.",
      items: [
        { term: "Double-tap", desc: "Edit an action's title or due date" },
        { term: "Sort modes", desc: "Default (server order), Urgency (overdue first), Active (unchecked first)" },
        { term: "Meeting summary", desc: "Hover an action to see its source meeting, then click 'View meeting' to read the full summary" },
      ],
    };

    header.append(accent, title, infoIcon);

    this._container = document.createElement("div");
    this._container.className = "items";

    // Dropdown menu (PM-style)
    const menuContainer = document.createElement("div");
    menuContainer.className = "dropdown-container wac-menu-container";

    const menuBtn = document.createElement("button");
    menuBtn.className = "ui-btn ui-btn--icon";
    menuBtn.id = "wac-menu-btn";
    menuBtn.setAttribute("aria-label", "More options");
    menuBtn.innerHTML = `${!this._settings.hoverTooltips ? '<span class="wac-menu__dot"></span>' : ''}<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;

    const menu = document.createElement("div");
    menu.className = "ui-menu ui-menu--down";
    menu.id = "wac-menu";
    const checkboxSvg = '<svg class="ui-checkbox__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const hasNew = [...this._items.values()].some(i => !i.checked && this._isNewItem(i.uid));
    menu.innerHTML = `
      <button class="ui-menu__item" id="wac-menu-sort">Sort: ${this._settings.sortOrder}</button>
      <button class="ui-menu__item" id="wac-menu-completed">${this._settings.showCompleted ? "Hide" : "Show"} Done</button>
      ${hasNew ? '<button class="ui-menu__item" id="wac-menu-clear-new">Mark All Read</button>' : ''}
      <button class="ui-menu__item" id="wac-menu-tooltips">Tooltips<span class="wac-menu__toggle"><input type="checkbox" class="ui-checkbox__input" tabindex="-1" ${this._settings.hoverTooltips ? "checked" : ""}><span class="ui-checkbox__box">${checkboxSvg}</span></span></button>
      <button class="ui-menu__item" id="wac-menu-settings">\u2026 More</button>`;

    menuContainer.append(menuBtn, menu);

    // Meeting summary drawer (content set dynamically)
    const backdrop = document.createElement("div");
    backdrop.className = "ui-drawer-backdrop";

    const panel = document.createElement("div");
    panel.className = "ui-drawer";
    panel.innerHTML = `
      <div class="ui-drawer__header wac-drawer-header">
        <div class="wac-drawer-header__text">
          <h3 class="ui-drawer__title">Meeting Summary</h3>
          <p class="wac-drawer-header__subtitle"></p>
        </div>
        <div class="wac-drawer-header__actions">
          <button class="ui-copy-btn wac-drawer-copy" aria-label="Copy summary" title="Copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a 2 2 0 0 1-2-2V4a 2 2 0 0 1 2-2h9a 2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <button class="ui-btn ui-btn--icon ui-btn--small wac-drawer-toggle-all" aria-label="Toggle all sections">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button class="ui-drawer__close" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div class="ui-drawer__content"></div>`;

    card.append(menuContainer, backdrop, panel, header, this._container);
    this.shadowRoot.appendChild(card);
    this._rendered = true;
    this._attachSettingsHandlers();
    this._syncMenuLabels();

    // Esc: close FAB menu first, then drawer
    if (!this._escBound) {
      this._handleEsc = (e) => {
        if (e.key === "Escape") {
          // Priority: speaker modal → edit modal → FAB menu → drawer
          const speakerModal = this.shadowRoot.querySelector(".wac-modal-backdrop:has(.wac-speaker-modal)");
          if (speakerModal) {
            this._closeSpeakerModal();
            return;
          }
          const editModal = this.shadowRoot.querySelector(".wac-modal-backdrop");
          if (editModal) {
            this._closeEditModal();
            return;
          }
          const menu = this.shadowRoot.getElementById("wac-menu");
          if (menu?.classList.contains("ui-menu--open")) {
            this._menuOpen = false;
            menu.classList.remove("ui-menu--open");
            return;
          }
          const drawerPanel = this.shadowRoot.querySelector(".ui-drawer");
          if (drawerPanel?.classList.contains("is-open")) {
            this._closeSummaryDrawer();
          }
        }
      };
      document.addEventListener("keydown", this._handleEsc);
      this._escBound = true;
    }
  }

  /* ── Description parser ────────────────────────────────────────────── */

  _parseDescription(desc) {
    if (!desc) return null;

    const lines = desc.split("\n");
    let source = null;
    let meetingDate = null;
    const progressions = [];
    let inProgression = false;
    let currentProgression = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("Source:")) {
        source = trimmed.slice(7).trim();
      } else if (trimmed.startsWith("Meeting date:")) {
        meetingDate = trimmed.slice(13).trim();
      } else if (trimmed.startsWith("Progression") && trimmed.includes(":")) {
        if (currentProgression) progressions.push(currentProgression);
        currentProgression = { header: trimmed, detail: null };
        inProgression = true;
      } else if (inProgression && trimmed.startsWith("Detail:")) {
        if (currentProgression) currentProgression.detail = trimmed.slice(7).trim();
      } else if (trimmed === "---") {
        inProgression = true;
      }
    }
    if (currentProgression) progressions.push(currentProgression);

    // No pipeline structure found — show raw text as plain body
    if (!source && !meetingDate && !progressions.length) {
      return { title: "Details", body: desc };
    }

    const title = source || "Work Action";
    const intro = meetingDate || null;
    const items = progressions.map(p => ({
      term: "Progression",
      desc: p.detail || p.header,
    }));

    return { title, intro, items: items.length ? items : undefined };
  }

  /* ── Date helpers ───────────────────────────────────────────────────── */

  _parseDue(dueStr) {
    if (!dueStr) return null;
    if (!dueStr.includes("T")) {
      const [y, m, d] = dueStr.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(dueStr);
  }

  _getDueUrgency(dueStr) {
    const due = this._parseDue(dueStr);
    if (!due) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "overdue";
    if (diffDays <= 3) return "soon";
    return "future";
  }

  _formatDue(dueStr) {
    const due = this._parseDue(dueStr);
    if (!due) return "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";

    return due.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  _formatDrawerDue(dueStr) {
    const due = this._parseDue(dueStr);
    if (!due) return "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "tomorrow";
    if (diffDays === -1) return "yesterday";
    if (diffDays > 1 && diffDays <= 6) {
      return due.toLocaleDateString("en-GB", { weekday: "long" });
    }
    return due.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  /* ── Fetch ──────────────────────────────────────────────────────────── */

  async _fetchItems() {
    if (!this._hass || !this._config) return;

    const gen = ++this._fetchGen;

    try {
      const resp = await this._hass.connection.sendMessagePromise({
        type: "call_service",
        domain: "todo",
        service: "get_items",
        service_data: { status: ["needs_action", "completed"] },
        target: { entity_id: this._config.entity },
        return_response: true,
      });

      if (gen !== this._fetchGen) return;

      const raw = resp.response?.[this._config.entity]?.items || [];

      this._patch(raw);
    } catch (e) {
      console.warn("[work-actions-card] Failed to fetch items:", e);
    }
  }

  /* ── Patch (diff against current DOM) ───────────────────────────────── */

  _patch(serverItems) {
    const incoming = new Map();
    for (const item of serverItems) {
      if (!item.uid) continue;
      incoming.set(item.uid, {
        uid: item.uid,
        summary: item.summary,
        checked: item.status === "completed",
        due: item.due || null,
        description: item.description || null,
      });
    }

    // Clean up orphaned localStorage entries (once per mount)
    this._cleanupLocalStorage(incoming);

    // Filter: hide completed items if setting is off
    // Keep items that are mid-exit animation so they stay in the model
    if (!this._settings.showCompleted) {
      for (const [uid, item] of incoming) {
        if (item.checked && !this._exitingRows.has(uid)) incoming.delete(uid);
      }
    }

    // Shelf-life: auto-hide completed items whose due date (stamped at completion) exceeds configured days
    const shelfMs = this._settings.completedShelfDays * 24 * 60 * 60 * 1000;
    for (const [uid, item] of incoming) {
      if (!item.checked || !item.due) continue;
      const completedDate = this._parseDue(item.due);
      if (!completedDate) continue;
      if (Date.now() - completedDate.getTime() > shelfMs) {
        incoming.delete(uid);
      }
    }

    // Sort: reorder items based on sort setting
    if (true) { // Always sort — no passthrough mode
      const sorted = [...incoming.entries()].sort((a, b) =>
        this._compareBySortOrder(a[1], b[1])
      );
      incoming.clear();
      for (const [uid, item] of sorted) incoming.set(uid, item);
    }

    // 1. Remove rows whose uid is no longer in the server set
    for (const [uid] of this._rowEls) {
      if (!incoming.has(uid) && !this._exitingRows.has(uid)) {
        this._exitingRows.add(uid);
        if (this._animTimers.has(uid)) {
          clearTimeout(this._animTimers.get(uid));
          this._animTimers.delete(uid);
        }
        this._animateRowOut(uid);
      }
    }

    // 2. Update existing rows / create new ones
    const newUids = new Set();
    for (const [uid, item] of incoming) {
      if (this._rowEls.has(uid)) {
        const old = this._items.get(uid);
        if (old) {
          if (old.checked !== item.checked && !this._animTimers.has(uid)) {
            this._snapRow(uid, item.checked);
          }
          if (old.summary !== item.summary) {
            const label = this._rowEls.get(uid).querySelector(".label");
            if (label) label.textContent = item.summary;
          }
          if (old.due !== item.due) {
            const dueEl = this._rowEls.get(uid).querySelector(".due");
            if (dueEl) {
              const urgency = this._getDueUrgency(item.due);
              dueEl.className = `due${urgency ? ` due--${urgency}` : ""}${item.checked ? " checked" : ""}`;
              dueEl.textContent = this._formatDue(item.due);
            }
          }
        }
      } else {
        this._createRow(item);
        newUids.add(uid);
      }
    }

    // 3. Animate layout changes
    // One unified path: FLIP existing rows to new positions, entry-animate new rows.
    // Skip DOM reorder when exits are in flight (they handle their own FLIP after removal).
    if (this._exitingRows.size === 0) {
      // Snapshot existing rows before reorder
      const snapshots = [];
      for (const [uid] of incoming) {
        const row = this._rowEls.get(uid);
        if (row && !newUids.has(uid)) {
          snapshots.push({ el: row, top: row.getBoundingClientRect().top });
        }
      }

      // Reorder DOM to match incoming order
      for (const [uid] of incoming) {
        const row = this._rowEls.get(uid);
        if (row) this._container.appendChild(row);
      }

      // FLIP existing rows that moved
      this._flipRows(snapshots);

      // Entry-animate new rows after FLIP settles
      let entryIndex = 0;
      for (const uid of newUids) {
        const row = this._rowEls.get(uid);
        if (row) this._animateRowEntry(row, entryIndex++, 300);
      }
    } else {
      // Exits in flight — don't touch DOM order, just entry-animate new rows
      let entryIndex = 0;
      for (const uid of newUids) {
        const row = this._rowEls.get(uid);
        if (row) this._animateRowEntry(row, entryIndex++);
      }
    }

    this._items = incoming;
  }

  /* ── Snap a single row to a given checked state (no animation) ──────── */

  _snapRow(uid, checked) {
    const row = this._rowEls.get(uid);
    if (!row) return;

    if (this._animTimers.has(uid)) {
      clearTimeout(this._animTimers.get(uid));
      this._animTimers.delete(uid);
    }

    const before = row.querySelector(".check-before");
    const after  = row.querySelector(".check-after");
    const label  = row.querySelector(".label");
    const fw     = row.querySelector(".firework");
    const dueEl  = row.querySelector(".due");

    if (checked) {
      before.className = "check-stroke check-before checked";
      after.className  = "check-stroke check-after checked";
      label.className  = "label checked";
      if (dueEl) dueEl.classList.add("checked");
    } else {
      before.className = "check-stroke check-before";
      after.className  = "check-stroke check-after";
      label.className  = "label";
      if (dueEl) dueEl.classList.remove("checked");
    }
    fw.className = "firework";
  }

  /* ── Create a single row element ────────────────────────────────────── */

  _createRow(item) {
    const row = document.createElement("div");
    row.className = `row${!item.checked && this._isNewItem(item.uid) ? " row--new" : ""}`;
    row.dataset.id = item.uid;
    row.addEventListener("click", () => {
      const now = Date.now();
      if (this._lastTapUid === item.uid && now - this._lastTapTime < 350) {
        // Double-tap: cancel pending single-tap and any exit animation, open edit
        this._lastTapTime = 0;
        clearTimeout(this._singleTapTimer);
        if (this._exitTimers.has(item.uid)) {
          clearTimeout(this._exitTimers.get(item.uid));
          this._exitTimers.delete(item.uid);
          this._exitingRows.delete(item.uid);
        }
        this._markSeen(item.uid);
        this._openEditModal(item.uid);
        return;
      }
      this._lastTapTime = now;
      this._lastTapUid = item.uid;
      // Delay single-tap so double-tap can cancel it
      clearTimeout(this._singleTapTimer);
      this._singleTapTimer = setTimeout(() => {
        this._lastTapTime = 0;
        this._toggle(item.uid);
      }, 250);
    });

    // Shared tooltip builder (gated by hoverTooltips setting)
    const showRowTooltip = () => {
      if (!this._settings.hoverTooltips) return;
      const current = this._items.get(item.uid);
      if (!current?.description) return;
      const content = this._parseDescription(current.description);
      if (!content) return;
      content.action = {
        label: "View meeting",
        onClick: () => {
          this._markSeen(item.uid);
          this._openMeetingSummary(item.uid);
        },
      };
      hideRichTooltip();
      this._tooltipShowTimer = setTimeout(() => {
        showRichTooltip(row, content, { position: "top", delay: 500, persistent: true });
        // After tooltip renders, wire hover-to-keep-alive on the tooltip element itself
        setTimeout(() => {
          const tip = document.querySelector('.ui-tooltip--rich[role="dialog"]');
          if (tip && !tip._wacHoverBound) {
            tip._wacHoverBound = true;
            tip.addEventListener("mouseenter", () => clearTimeout(this._hoverTooltipTimer));
            tip.addEventListener("mouseleave", () => {
              this._hoverTooltipTimer = setTimeout(() => hideRichTooltip(), 300);
            });
          }
        }, 400);
      }, 200);
    };

    // Desktop: hover with debounced dismiss
    row.addEventListener("mouseenter", () => {
      clearTimeout(this._hoverTooltipTimer);
      clearTimeout(this._tooltipShowTimer);
      showRowTooltip();
    });
    row.addEventListener("mouseleave", () => {
      clearTimeout(this._tooltipShowTimer);
      this._hoverTooltipTimer = setTimeout(() => hideRichTooltip(), 500);
    });

    // Touch: long-press (500ms hold) to show tooltip instead of toggling
    let longPressTimer = null;
    let longPressFired = false;
    row.addEventListener("touchstart", (e) => {
      longPressFired = false;
      longPressTimer = setTimeout(() => {
        longPressFired = true;
        showRowTooltip();
      }, 500);
    }, { passive: true });
    row.addEventListener("touchend", () => {
      clearTimeout(longPressTimer);
      // If long-press showed a tooltip, suppress the click toggle
      if (longPressFired) {
        longPressFired = false;
        row.addEventListener("click", (e) => {
          e.stopImmediatePropagation();
        }, { once: true, capture: true });
      }
    });
    row.addEventListener("touchmove", () => clearTimeout(longPressTimer), { passive: true });
    row.addEventListener("touchcancel", () => clearTimeout(longPressTimer));

    const outer = document.createElement("div");
    outer.className = "checkbox-outer";

    const checkbox = document.createElement("div");
    checkbox.className = "checkbox";

    const before = document.createElement("span");
    before.className = `check-stroke check-before${item.checked ? " checked" : ""}`;

    const after = document.createElement("span");
    after.className = `check-stroke check-after${item.checked ? " checked" : ""}`;

    checkbox.append(before, after);
    outer.appendChild(checkbox);

    const labelWrap = document.createElement("div");
    labelWrap.className = "label-wrap";

    const label = document.createElement("span");
    label.className = `label${item.checked ? " checked" : ""}`;
    label.textContent = item.summary;

    const dueEl = document.createElement("span");
    const urgency = this._getDueUrgency(item.due);
    dueEl.className = `due${urgency ? ` due--${urgency}` : ""}${item.checked ? " checked" : ""}`;
    dueEl.textContent = this._formatDue(item.due);

    const fw = document.createElement("span");
    fw.className = "firework";

    labelWrap.append(label, dueEl, fw);
    row.append(outer, labelWrap);

    this._container.appendChild(row);
    this._rowEls.set(item.uid, row);
  }

  /* ── Toggle (optimistic + fire-and-forget service call) ─────────────── */

  _toggle(uid) {
    const item = this._items.get(uid);
    if (!item) return;

    hideRichTooltip();

    const next = !item.checked;
    item.checked = next;

    const row = this._rowEls.get(uid);
    if (!row) return;

    const before = row.querySelector(".check-before");
    const after  = row.querySelector(".check-after");
    const label  = row.querySelector(".label");
    const fw     = row.querySelector(".firework");
    const dueEl  = row.querySelector(".due");

    if (this._animTimers.has(uid)) {
      clearTimeout(this._animTimers.get(uid));
      this._animTimers.delete(uid);
    }

    if (next) {
      before.className = "check-stroke check-before animating";
      after.className  = "check-stroke check-after animating";
      label.className  = "label checked animating";
      fw.className     = "firework animating";
      if (dueEl) dueEl.classList.add("checked");

      // Reserve exit slot now so _patch() doesn't remove the row
      // before the hold delay expires
      const willExit = !this._settings.showCompleted;
      if (willExit) this._exitingRows.add(uid);

      this._animTimers.set(uid, setTimeout(() => {
        before.className = "check-stroke check-before checked";
        after.className  = "check-stroke check-after checked";
        label.className  = "label checked";
        fw.className     = "firework";
        this._animTimers.delete(uid);

        // Hold briefly then animate out
        if (willExit) {
          this._exitTimers.set(uid, setTimeout(() => {
            this._exitTimers.delete(uid);
            this._animateRowOut(uid);
          }, 1500));
        }
      }, 600));
    } else {
      before.className = "check-stroke check-before";
      after.className  = "check-stroke check-after";
      label.className  = "label";
      fw.className     = "firework";
      if (dueEl) dueEl.classList.remove("checked");

      // Cancel pending exit if user unchecks during hold period
      if (this._exitingRows.has(uid)) {
        this._exitingRows.delete(uid);
        if (this._exitTimers.has(uid)) {
          clearTimeout(this._exitTimers.get(uid));
          this._exitTimers.delete(uid);
        }
      }
    }

    const serviceData = { item: uid, status: next ? "completed" : "needs_action" };
    if (next) {
      // Save original due date before overwriting, stamp completion date
      item._originalDue = item.due;
      const today = new Date();
      serviceData.due_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    } else if (item._originalDue !== undefined) {
      // Restore original due date on uncheck
      if (item._originalDue) {
        serviceData.due_date = item._originalDue;
      }
      delete item._originalDue;
    }
    this._hass.callService(
      "todo", "update_item", serviceData, { entity_id: this._config.entity }
    ).catch(() => {
      item.checked = !next;
      this._snapRow(uid, !next);
      // Cancel pending exit on rollback
      if (this._exitingRows.has(uid)) {
        this._exitingRows.delete(uid);
        if (this._exitTimers.has(uid)) {
          clearTimeout(this._exitTimers.get(uid));
          this._exitTimers.delete(uid);
        }
      }
    });
  }

  /* ── Row animations ───────────────────────────────────────────────────── */

  /**
   * Queue a row for animated exit. Multiple calls in the same tick
   * are batched into one fade + one FLIP pass to prevent stacking.
   */
  _animateRowOut(uid) {
    if (!this._pendingExits) this._pendingExits = new Set();
    this._pendingExits.add(uid);

    if (!this._exitBatchTimer) {
      this._exitBatchTimer = setTimeout(() => this._processExitBatch(), 0);
    }
  }

  _processExitBatch() {
    this._exitBatchTimer = null;
    const batch = this._pendingExits;
    this._pendingExits = null;
    if (!batch || !batch.size) return;

    // Collect valid rows to exit
    const exitRows = [];
    for (const uid of batch) {
      const row = this._rowEls.get(uid);
      if (!row) {
        this._exitingRows.delete(uid);
        continue;
      }
      exitRows.push({ uid, row });
    }
    if (!exitRows.length) return;

    // Reduced motion: remove all instantly
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const { uid, row } of exitRows) {
        row.remove();
        this._rowEls.delete(uid);
        this._items.delete(uid);
        this._exitingRows.delete(uid);
      }
      return;
    }

    // Record positions of ALL non-exiting rows before any removal
    const exitUids = new Set(batch);
    const snapshots = [];
    this._container.querySelectorAll(".row").forEach(el => {
      if (!exitUids.has(el.dataset.id)) {
        snapshots.push({ el, top: el.getBoundingClientRect().top });
      }
    });

    // Fade out all exiting rows together
    for (const { row } of exitRows) {
      row.style.pointerEvents = "none";
      row.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 250, easing: "ease-in-out", fill: "forwards" }
      );
    }

    // After fade, remove all at once, then one FLIP pass
    setTimeout(() => {
      for (const { uid, row } of exitRows) {
        row.remove();
        this._rowEls.delete(uid);
        this._items.delete(uid);
        this._exitingRows.delete(uid);
      }
      this._flipRows(snapshots);
    }, 250);
  }

  /**
   * FLIP animation: smoothly slide rows from old to new positions.
   */
  _flipRows(snapshots) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Calculate deltas and split by direction
    const upGroup = [];   // negative delta — rows moving up
    const downGroup = []; // positive delta — rows moving down

    for (const { el, top } of snapshots) {
      if (!el.parentNode) continue;
      const newTop = el.getBoundingClientRect().top;
      const delta = top - newTop;
      if (Math.abs(delta) < 1) continue;

      if (delta > 0) {
        upGroup.push({ el, delta });    // old position was lower → moving up
      } else {
        downGroup.push({ el, delta });  // old position was higher → moving down
      }
    }

    // Up group: stagger top-to-bottom (natural DOM order)
    upGroup.forEach(({ el, delta }, i) => {
      el.animate([
        { transform: `translateY(${delta}px)` },
        { transform: "translateY(0)" },
      ], { duration: 450, easing: "ease-in-out", delay: i * 50, fill: "backwards" });
    });

    // Down group: stagger bottom-to-top (reverse order)
    downGroup.reverse();
    downGroup.forEach(({ el, delta }, i) => {
      el.animate([
        { transform: `translateY(${delta}px)` },
        { transform: "translateY(0)" },
      ], { duration: 450, easing: "ease-in-out", delay: i * 50, fill: "backwards" });
    });
  }

  /**
   * Animate a new row entering: fade in + slide up.
   */
  _animateRowEntry(row, index, baseDelay = 0) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    row.animate([
      { opacity: 0, transform: "translateY(8px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], {
      duration: 350,
      easing: "ease-in-out",
      delay: baseDelay + index * 40,
      fill: "backwards",
    });
  }

  /* ── Settings: helpers ───────────────────────────────────────────────── */

  _loadSettingsFromHelpers() {
    if (!this._hass) return;
    const test = this._hass.states[HELPERS.maxHeight];
    this._helpersAvailable = !!test;
    if (!this._helpersAvailable) return;

    // Skip keys with in-flight writes to prevent stale HA state overwriting local values
    if (!this._pendingWrites.has("maxHeight"))
      this._settings.maxHeight = getHelperNumber(this._hass, HELPERS.maxHeight, DEFAULTS.maxHeight);
    if (!this._pendingWrites.has("showCompleted"))
      this._settings.showCompleted = getHelperBoolean(this._hass, HELPERS.showCompleted, DEFAULTS.showCompleted);
    if (!this._pendingWrites.has("sortOrder"))
      this._settings.sortOrder = getHelperSelect(this._hass, HELPERS.sortOrder, DEFAULTS.sortOrder);
    if (!this._pendingWrites.has("hoverTooltips"))
      this._settings.hoverTooltips = getHelperBoolean(this._hass, HELPERS.hoverTooltips, DEFAULTS.hoverTooltips);
    if (!this._pendingWrites.has("newIndicatorHours"))
      this._settings.newIndicatorHours = getHelperNumber(this._hass, HELPERS.newIndicatorHours, DEFAULTS.newIndicatorHours);
    if (!this._pendingWrites.has("completedShelfDays"))
      this._settings.completedShelfDays = getHelperNumber(this._hass, HELPERS.completedShelfDays, DEFAULTS.completedShelfDays);
  }

  async _writeSettingToHelper(settingKey, value) {
    this._settings[settingKey] = value;

    // Defer visual updates while drawer is open — apply once on close
    if (this._drawerOpen) {
      this._settingsDirty = true;
    } else if (settingKey === "maxHeight") {
      this._applyMaxHeight();
    } else {
      this._applySettings();
    }

    if (!this._hass || !this._helpersAvailable) return;
    const entityId = HELPERS[settingKey];
    if (!entityId) return;

    // Guard against stale HA state overwriting this value before the write lands
    this._pendingWrites.add(settingKey);
    try {
      await persistHelper(this._hass, entityId, value);
    } catch (e) {
      console.error(`[work-actions-card] Failed to persist ${settingKey}:`, e);
    } finally {
      this._pendingWrites.delete(settingKey);
    }
  }

  /* ── FAB menu + drawer lifecycle ──────────────────────────────────────── */

  _attachSettingsHandlers() {
    const menuBtn = this.shadowRoot.getElementById("wac-menu-btn");
    const menu = this.shadowRoot.getElementById("wac-menu");
    const close = this.shadowRoot.querySelector(".ui-drawer__close");
    const backdrop = this.shadowRoot.querySelector(".ui-drawer-backdrop");

    // Menu button toggles dropdown
    if (menuBtn) menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this._menuOpen = !this._menuOpen;
      menu?.classList.toggle("ui-menu--open", this._menuOpen);
    });

    // Click-outside to close menu
    if (this._menuOutsideClick) {
      document.removeEventListener("click", this._menuOutsideClick);
    }
    this._menuOutsideClick = (e) => {
      const path = e.composedPath();
      const inMenu = path.some(el => el.classList?.contains("wac-menu-container"));
      if (!inMenu && this._menuOpen) {
        this._menuOpen = false;
        menu?.classList.remove("ui-menu--open");
      }
    };
    document.addEventListener("click", this._menuOutsideClick);

    // Sort — cycles through modes
    const sortBtn = this.shadowRoot.getElementById("wac-menu-sort");
    if (sortBtn) sortBtn.addEventListener("click", () => {
      const order = ["Newest first", "Urgency first", "Active first"];
      const idx = (order.indexOf(this._settings.sortOrder) + 1) % order.length;
      this._writeSettingToHelper("sortOrder", order[idx]);
      sortBtn.textContent = `Sort: ${order[idx]}`;
    });

    // Show/hide completed
    const compBtn = this.shadowRoot.getElementById("wac-menu-completed");
    if (compBtn) compBtn.addEventListener("click", () => {
      const next = !this._settings.showCompleted;
      this._writeSettingToHelper("showCompleted", next);
      compBtn.textContent = `${next ? "Hide" : "Show"} Done`;
    });

    // Hover tooltips toggle (inverted indicator: dot shows when OFF)
    const tooltipBtn = this.shadowRoot.getElementById("wac-menu-tooltips");
    if (tooltipBtn) tooltipBtn.addEventListener("click", () => {
      const next = !this._settings.hoverTooltips;
      this._writeSettingToHelper("hoverTooltips", next);
      // Update checkbox visual
      const cb = tooltipBtn.querySelector(".ui-checkbox__input");
      if (cb) cb.checked = next;
      // Update dot indicator (shows when tooltips are OFF)
      const dot = this.shadowRoot.querySelector(".wac-menu__dot");
      if (next && dot) dot.remove();
      if (!next && !dot) {
        const newDot = document.createElement("span");
        newDot.className = "wac-menu__dot";
        menuBtn.appendChild(newDot);
      }
    });

    // Clear all new indicators
    const clearNewBtn = this.shadowRoot.getElementById("wac-menu-clear-new");
    if (clearNewBtn) clearNewBtn.addEventListener("click", () => {
      for (const [uid] of this._items) {
        this._markSeen(uid);
      }
    });

    // Settings — opens height modal, closes menu
    const settingsBtn = this.shadowRoot.getElementById("wac-menu-settings");
    if (settingsBtn) settingsBtn.addEventListener("click", () => {
      this._menuOpen = false;
      menu?.classList.remove("ui-menu--open");
      this._openHeightModal();
    });

    // Drawer copy + close + backdrop
    const copyBtn = this.shadowRoot.querySelector(".wac-drawer-copy");
    if (copyBtn) copyBtn.addEventListener("click", async () => {
      if (!this._drawerSummaryText) return;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(this._drawerSummaryText);
        } else {
          const el = document.createElement("textarea");
          Object.assign(el, { value: this._drawerSummaryText });
          Object.assign(el.style, { position: "fixed", opacity: "0" });
          document.body.appendChild(el);
          el.select();
          document.execCommand("copy");
          document.body.removeChild(el);
        }
        copyBtn.classList.add("ui-copy-btn--copied");
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>';
        setTimeout(() => {
          copyBtn.classList.remove("ui-copy-btn--copied");
          copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a 2 2 0 0 1-2-2V4a 2 2 0 0 1 2-2h9a 2 2 0 0 1 2 2v1"></path></svg>';
        }, 2000);
      } catch (e) {
        console.error("[work-actions-card] Copy failed:", e);
      }
    });
    if (close) close.addEventListener("click", () => this._closeSummaryDrawer());
    if (backdrop) backdrop.addEventListener("click", () => this._closeSummaryDrawer());

    // Drawer toggle-all sections button
    const toggleAllBtn = this.shadowRoot.querySelector(".wac-drawer-toggle-all");
    if (toggleAllBtn) {
      this._drawerSectionsExpanded = false;
      toggleAllBtn.addEventListener("click", () => {
        this._drawerSectionsExpanded = !this._drawerSectionsExpanded;
        const drawerEl = this.shadowRoot.querySelector(".ui-drawer");
        if (drawerEl) toggleAllSections(drawerEl, this._drawerSectionsExpanded);
        this._syncDrawerToggleIcon();
      });
    }
  }

  _syncMenuLabels() {
    const sortBtn = this.shadowRoot.getElementById("wac-menu-sort");
    const compBtn = this.shadowRoot.getElementById("wac-menu-completed");
    if (sortBtn) sortBtn.textContent = `Sort: ${this._settings.sortOrder}`;
    if (compBtn) compBtn.textContent = `${this._settings.showCompleted ? "Hide" : "Show"} Done`;
  }

  _syncDrawerToggleIcon() {
    const btn = this.shadowRoot.querySelector(".wac-drawer-toggle-all svg");
    if (!btn) return;
    if (this._drawerSectionsExpanded) {
      // Minus icon = "collapse all"
      btn.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"></line>';
    } else {
      // Plus icon = "expand all"
      btn.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>';
    }
  }

  _openHeightModal() {
    const isDark = this._hass?.themes?.darkMode ?? false;
    const themeClass = isDark ? "dark-theme" : "light-theme";

    const content = document.createElement("div");
    content.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--ui-space-4,16px);">
        <span style="color:var(--ui-text,#eee);font-size:var(--ui-font-s,14px);">Card height (px)</span>
        <ui-number-input id="wac-height-input" class="${themeClass}"
          value="${this._settings.maxHeight}" min="200" max="5000" step="50"
          aria-label="Card height"></ui-number-input>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--ui-space-4,16px);">
        <span style="color:var(--ui-text,#eee);font-size:var(--ui-font-s,14px);">New indicator expiry (hours)</span>
        <ui-number-input id="wac-expiry-input" class="${themeClass}"
          value="${this._settings.newIndicatorHours}" min="1" max="168"
          aria-label="New indicator expiry"></ui-number-input>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="color:var(--ui-text,#eee);font-size:var(--ui-font-s,14px);">Completed shelf life (days)</span>
        <ui-number-input id="wac-shelf-input" class="${themeClass}"
          value="${this._settings.completedShelfDays}" min="1" max="90"
          aria-label="Completed shelf life"></ui-number-input>
      </div>`;

    showModal({
      title: "Card Settings",
      content,
      size: "s",
    });

    const heightInput = content.querySelector("#wac-height-input");
    const expiryInput = content.querySelector("#wac-expiry-input");
    const shelfInput = content.querySelector("#wac-shelf-input");

    if (heightInput) heightInput.addEventListener("ui-change", (e) => {
      this._writeSettingToHelper("maxHeight", e.detail.value);
    });
    if (expiryInput) expiryInput.addEventListener("ui-change", (e) => {
      this._writeSettingToHelper("newIndicatorHours", e.detail.value);
    });
    if (shelfInput) shelfInput.addEventListener("ui-change", (e) => {
      this._writeSettingToHelper("completedShelfDays", e.detail.value);
    });
  }

  _openSummaryDrawer(meetingTitle, summaryText, meetingDate = null) {
    this._drawerSummaryText = summaryText || "";
    this._drawerMeetingTitle = meetingTitle;
    this._drawerMeetingDate = meetingDate;
    const titleEl = this.shadowRoot.querySelector(".ui-drawer__title");
    const contentEl = this.shadowRoot.querySelector(".ui-drawer__content");
    if (titleEl) titleEl.textContent = meetingTitle;
    if (contentEl) contentEl.innerHTML = this._renderSummary(summaryText);

    // Wire speaker chip interactions
    this._attachSpeakerChipHandlers();

    // Wire collapsible sections and reset toggle-all state
    const drawerEl = this.shadowRoot.querySelector(".ui-drawer");
    if (drawerEl) initCollapsibleSections(drawerEl);
    this._drawerSectionsExpanded = false;
    this._syncDrawerToggleIcon();

    this._drawerOpen = true;
    this._settingsDirty = false;
    openDrawer(this.shadowRoot);
  }

  _closeSummaryDrawer() {
    this._drawerOpen = false;
    closeDrawer(this.shadowRoot);
    if (this._settingsDirty) {
      this._settingsDirty = false;
      this._applySettings();
    }
  }

  _renderActionItem(action, dueRaw, relative = false) {
    let dueHtml = "";
    if (dueRaw) {
      if (relative) {
        // My actions: relative text with urgency colours
        const urgency = this._getDueUrgency(dueRaw);
        const cls = `wac-item-due${urgency ? ` wac-item-due--${urgency}` : ""}`;
        dueHtml = `<div class="wac-action-card__meta"><span class="${cls}">${this._formatRelativeDue(dueRaw)}</span></div>`;
      } else {
        // Others' actions: plain muted date, no urgency colours
        const dueLabel = this._formatDrawerDue(dueRaw);
        dueHtml = `<div class="wac-action-card__meta"><span class="wac-item-due">${escapeHtml(dueLabel)}</span></div>`;
      }
    }
    return `<div class="wac-action-card"><p class="wac-action-card__text">${escapeHtml(action)}</p>${dueHtml}</div>`;
  }

  _formatRelativeDue(dueStr) {
    const due = this._parseDue(dueStr);
    if (!due) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""}`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  }

  _renderSummaryBody(body, sectionName = "") {
    const isMyActions = /my\s*actions/i.test(sectionName);
    const palette = ['teal', 'amber', 'sky', 'violet', 'green', 'red', 'lime', 'slate'];
    const colorMap = this._speakerColorMap || new Map();
    const parsed = [];
    const other = [];

    body.split("\n").forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "---") return;

      // Skip markdown table headers and separator rows
      if (/^\|?\s*-{2,}\s*\|/.test(trimmed)) return;
      if (/^\|?\s*Action\s*\|/i.test(trimmed)) return;

      // Markdown table rows: | text | person | date |
      if (trimmed.startsWith("|")) {
        const cells = trimmed.split("|").map(c => c.trim()).filter(Boolean);
        if (cells.length >= 1) {
          const action = cells[0];
          const assignee = cells[1] && cells[1] !== "None" ? cells[1] : null;
          const dueRaw = cells[2] && cells[2] !== "None" ? cells[2] : null;
          parsed.push({ action, assignee, dueRaw });
        }
        return;
      }

      // Bullet list rows: - text | date  OR  - text | person | date
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const parts = trimmed.slice(2).split("|").map(p => p.trim());
        const action = parts[0];
        let assignee = null;
        let dueRaw = null;
        if (parts.length >= 3) {
          // 3+ parts: action | person | date
          assignee = parts[1] && parts[1] !== "None" ? parts[1] : null;
          dueRaw = parts[2] && parts[2] !== "None" ? parts[2] : null;
        } else if (parts.length === 2) {
          // 2 parts: action | date (no assignee)
          const val = parts[1];
          if (val && val !== "None") {
            // If it looks like a date (YYYY-MM-DD or "None"), treat as due
            dueRaw = val;
          }
        }
        parsed.push({ action, assignee, dueRaw });
        return;
      }

      if (trimmed.startsWith("**") && trimmed.includes(":**")) {
        const match = trimmed.match(/^\*\*(.+?):\*\*\s*(.*)$/);
        if (match) {
          other.push(`<div class="wac-action-card"><p class="wac-action-card__text"><strong>${escapeHtml(match[1])}:</strong> ${escapeHtml(match[2])}</p></div>`);
          return;
        }
      }

      other.push(`<div class="wac-action-card"><p class="wac-action-card__text">${escapeHtml(trimmed)}</p></div>`);
    });

    // Check if grouping is needed (2+ distinct assignees)
    const assignees = [...new Set(parsed.filter(p => p.assignee).map(p => p.assignee))];

    if (assignees.length >= 1) {
      // Group by assignee — coloured accent line per group
      const groups = new Map();
      const unassigned = [];
      parsed.forEach(p => {
        if (p.assignee) {
          if (!groups.has(p.assignee)) groups.set(p.assignee, []);
          groups.get(p.assignee).push(p);
        } else {
          unassigned.push(p);
        }
      });

      const html = [];
      let fallbackIdx = colorMap.size;
      for (const [name, items] of groups) {
        const token = colorMap.get(name) || palette[fallbackIdx++ % palette.length];
        html.push(`<div class="wac-owner-group" style="--_group-color:var(--ui-cat-${token})">`);
        html.push(`<span class="ui-badge" style="--_badge-color:var(--ui-cat-${token});--_badge-color-faint:var(--ui-cat-${token}-faint)">${escapeHtml(name)}</span>`);
        html.push(`<div class="wac-owner-group__actions">`);
        items.forEach(p => html.push(this._renderActionItem(p.action, p.dueRaw, isMyActions)));
        html.push(`</div></div>`);
      }
      unassigned.forEach(p => html.push(this._renderActionItem(p.action, p.dueRaw, isMyActions)));
      return `<div class="wac-section-items">${[...other, ...html].join("")}</div>`;
    }

    // No grouping needed — flat list in single panel
    const items = parsed.map(p => this._renderActionItem(p.action, p.dueRaw, isMyActions));

    return `<div class="wac-section-items">${other.join("")}<div class="wac-owner-group__actions">${items.join("")}</div></div>`;
  }

  _slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  _renderMeetingMeta(body) {
    const palette = ['teal', 'amber', 'sky', 'violet', 'green', 'red', 'lime', 'slate'];
    const fields = {};
    body.split("\n").forEach(line => {
      const match = line.trim().match(/^[-*]\s*(\w[\w\s]*):\s*(.+)$/);
      if (match) fields[match[1].trim().toLowerCase()] = match[2].trim();
    });

    // Date + duration → set in header subtitle
    const date = fields.date || fields.meeting_date;
    const duration = fields.duration?.replace(/approximately\s*/i, "").trim();
    const subtitle = date && duration ? `${date} · ${duration}` : (date || duration || "");
    const subtitleEl = this.shadowRoot.querySelector(".wac-drawer-header__subtitle");
    if (subtitleEl) subtitleEl.textContent = subtitle;

    // Individual speaker badges cycling through palette + build colour map
    const speakers = fields.speakers;
    const chips = [];
    this._speakerColorMap = new Map();
    this._drawerSpeakers = [];
    if (speakers) {
      let i = 0;
      speakers.split(",").forEach(s => {
        const raw = s.trim();
        if (!raw) return;
        const token = palette[i % palette.length];
        i++;
        // Strip "Speaker N (Name)" → display "Name", tooltip "Speaker N"
        const speakerMatch = raw.match(/^(Speaker\s*\d+)\s*\((.+)\)$/i);
        const display = speakerMatch ? speakerMatch[2] : raw;
        const originalRaw = speakerMatch ? speakerMatch[1] : raw;
        const tooltip = speakerMatch ? ` title="${escapeHtml(speakerMatch[1])}"` : "";
        this._speakerColorMap.set(display, token);
        this._drawerSpeakers.push({ display, raw: originalRaw });
        chips.push(`<span class="ui-badge" data-speaker="${escapeHtml(display)}"${tooltip} style="--_badge-color:var(--ui-cat-${token});--_badge-color-faint:var(--ui-cat-${token}-faint)">${escapeHtml(display)}</span>`);
      });
    }

    if (!chips.length) return "";
    // Add interactive class only when meeting date is known (pyscript needs it)
    const interactiveClass = this._drawerMeetingDate ? " wac-meeting-meta--interactive" : "";
    return `<div class="wac-meeting-meta${interactiveClass}">${chips.join("")}</div>`;
  }

  _resolveSpeakers(text) {
    // Parse "- Speakers: Speaker 1 (me), Talia Hodgson, Speaker 3" from Meeting section
    const speakersMatch = text.match(/^-\s+Speakers?:\s*(.+)$/m);
    if (!speakersMatch) return text;

    const entries = speakersMatch[1].split(",").map(s => s.trim());
    const replacements = [];

    for (const entry of entries) {
      // Match "Speaker N (name)" or "Name (Speaker N)" patterns
      const aliasMatch = entry.match(/^(Speaker\s*\d+)\s*\((.+?)\)$/i);
      if (aliasMatch) {
        const speakerRef = aliasMatch[1]; // "Speaker 1"
        const name = aliasMatch[2];       // "me" or a real name
        const displayName = /^(me|cam|c)$/i.test(name) ? "Cam" : name;
        replacements.push({ pattern: speakerRef, name: displayName });
        continue;
      }
      // Match "Name (Speaker N)"
      const reverseMatch = entry.match(/^(.+?)\s*\(Speaker\s*\d+\)$/i);
      if (reverseMatch) {
        const name = reverseMatch[1];
        const speakerRef = entry.match(/Speaker\s*\d+/i)?.[0];
        if (speakerRef) replacements.push({ pattern: speakerRef, name });
      }
    }

    // Replace longest patterns first to avoid partial matches (Speaker 10 before Speaker 1)
    replacements.sort((a, b) => b.pattern.length - a.pattern.length);

    let result = text;
    for (const { pattern, name } of replacements) {
      // Replace "Speaker N" but not inside the Speakers metadata line itself
      // Use word boundaries and case-insensitive matching
      // Match "Speaker N" optionally followed by "'s" for possessive
      const regex = new RegExp(`\\b${pattern.replace(/\s+/g, "\\s*")}('s)?\\b(?!\\s*\\()`, "gi");
      result = result.replace(regex, (match, possessive, offset) => {
        // Don't replace inside the "- Speakers:" line
        const lineStart = result.lastIndexOf("\n", offset) + 1;
        const line = result.slice(lineStart, result.indexOf("\n", offset));
        if (line.match(/^-\s+Speakers?:/i)) return match;
        if (possessive) {
          return `${name}'s`;
        }
        return name;
      });
    }

    return result;
  }

  _renderSummary(text) {
    if (!text) return '<p class="wac-summary-empty">Summary not available.</p>';

    // Resolve anonymous speaker references to names where known
    text = this._resolveSpeakers(text);

    const sections = text.split(/^## /m).filter(Boolean);

    // No ## headings found — render as plain body without collapsible wrapper
    if (sections.length === 1 && !text.trimStart().startsWith("## ")) {
      return this._renderSummaryBody(text);
    }

    return sections.map(section => {
      const lines = section.split("\n");
      const heading = lines[0].trim();
      const body = lines.slice(1).join("\n").trim();

      // MEETING section — render as metadata chips, not a collapsible
      if (heading.toUpperCase() === "MEETING") {
        return this._renderMeetingMeta(body);
      }

      const slug = this._slugify(heading);
      const sectionId = `wac-drawer-${slug}`;
      const bodyHtml = this._renderSummaryBody(body, heading);

      return `
        <div class="ui-collapsible-section ui-collapsible-section--drawer" data-section-id="${sectionId}" data-initial-state="collapsed">
          <button class="ui-collapsible-section__header">
            <span class="ui-collapsible-section__title">${escapeHtml(heading)}</span>
            <span class="ui-collapsible-section__arrow"></span>
          </button>
          <div class="ui-collapsible-section__content">
            ${bodyHtml}
          </div>
        </div>`;
    }).join("");
  }

  async _openMeetingSummary(uid) {
    const item = this._items.get(uid);
    if (!item?.description) return;

    // Parse source meeting info from description
    const parsed = this._parseDescription(item.description);
    const meetingTitle = parsed?.title || "Meeting";

    // Extract meeting date from description for more precise matching
    let meetingDate = null;
    const dateMatch = item.description?.match(/Meeting date:\s*(\S+)/);
    if (dateMatch) meetingDate = dateMatch[1];

    // Fetch from todo.meeting_summaries
    try {
      const resp = await this._hass.connection.sendMessagePromise({
        type: "call_service",
        domain: "todo",
        service: "get_items",
        service_data: { status: ["needs_action", "completed"] },
        target: { entity_id: "todo.meeting_summaries" },
        return_response: true,
      });

      const items = resp.response?.["todo.meeting_summaries"]?.items || [];

      // Match by title + date for precision, fall back to title-only
      const titleLower = meetingTitle.toLowerCase();
      let match = null;
      if (meetingDate) {
        match = items.find(s =>
          (s.summary?.toLowerCase().includes(titleLower) ||
           s.description?.toLowerCase().includes(titleLower)) &&
          (s.due === meetingDate || s.summary?.includes(meetingDate.slice(5)))
        );
      }
      if (!match) {
        match = items.find(s =>
          s.summary?.toLowerCase().includes(titleLower) ||
          s.description?.toLowerCase().includes(titleLower)
        );
      }

      if (match?.description) {
        this._openSummaryDrawer(meetingTitle, match.description, meetingDate);
      } else {
        // Fallback: read from file for meetings older than 7-day todo window
        const fileSummary = await this._fetchSummaryFromFile(meetingDate, meetingTitle);
        this._openSummaryDrawer(meetingTitle, fileSummary, meetingDate);
      }
    } catch (e) {
      console.warn("[work-actions-card] Failed to fetch meeting summary:", e);
      this._openSummaryDrawer(meetingTitle, null, meetingDate);
    }
  }

  /* ── Edit modal ──────────────────────────────────────────────────────── */

  _openEditModal(uid) {
    const item = this._items.get(uid);
    if (!item) return;

    // Dismiss tooltip
    hideRichTooltip();

    const card = this.shadowRoot.querySelector(".card");
    if (!card) return;

    // Remove any existing modal
    this._closeEditModal();

    const dueValue = item.due || "";

    const backdrop = document.createElement("div");
    backdrop.className = "wac-modal-backdrop";
    backdrop.innerHTML = `
      <div class="wac-modal" role="dialog" aria-modal="true">
        <button class="wac-modal__close" aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <h2 class="wac-modal__title">Edit Action</h2>
        <div class="ui-input">
          <div class="ui-input__pill has-value">
            <label class="ui-input__label">Title</label>
            <input type="text" class="ui-input__field" id="wac-edit-title" value="${escapeHtml(item.summary)}" />
          </div>
        </div>
        <div class="ui-input">
          <div class="ui-input__pill${dueValue ? " has-value" : ""}">
            <label class="ui-input__label">Due date</label>
            <input type="date" class="ui-input__field" id="wac-edit-due" value="${dueValue}"${dueValue ? " required" : ""} />
          </div>
        </div>
        <div class="wac-edit-buttons">
          <button class="ui-btn ui-btn--danger ui-btn--filled" id="wac-edit-delete">Delete</button>
          <span style="flex:1"></span>
          <button class="ui-btn ui-btn--outline" id="wac-edit-cancel">Cancel</button>
          <span id="wac-save-wrapper"><button class="ui-btn ui-btn--accent ui-btn--filled" id="wac-edit-save">Save</button></span>
        </div>
      </div>`;

    card.appendChild(backdrop);

    // Show with transition
    requestAnimationFrame(() => backdrop.classList.add("is-visible"));

    // Wire events
    const closeBtn = backdrop.querySelector(".wac-modal__close");
    const cancelBtn = backdrop.querySelector("#wac-edit-cancel");
    const saveBtn = backdrop.querySelector("#wac-edit-save");
    const titleInput = backdrop.querySelector("#wac-edit-title");
    const dueInput = backdrop.querySelector("#wac-edit-due");

    const saveWrapper = backdrop.querySelector("#wac-save-wrapper");
    const dueRequired = !!dueValue;

    closeBtn.addEventListener("click", () => this._closeEditModal());
    cancelBtn.addEventListener("click", () => this._closeEditModal());
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) this._closeEditModal();
    });

    // Validation: update save button disabled state
    const updateValidity = () => {
      const missing = [];
      if (!titleInput.value.trim()) missing.push("Title");
      if (dueRequired && !dueInput.value) missing.push("Due date");
      saveBtn.disabled = missing.length > 0;
      saveBtn.dataset.missingFields = missing.join(", ");
    };

    // Floating label: sync has-value on input/change + revalidate
    [titleInput, dueInput].forEach(input => {
      const pill = input.closest(".ui-input__pill");
      const sync = () => {
        pill.classList.toggle("has-value", !!input.value);
        updateValidity();
      };
      input.addEventListener("input", sync);
      input.addEventListener("change", sync);
    });

    updateValidity();

    // Click on wrapper when save is disabled → show validation tooltip
    saveWrapper.addEventListener("click", (e) => {
      if (!saveBtn.disabled || !saveBtn.dataset.missingFields) return;
      e.preventDefault();
      e.stopPropagation();

      const missingFields = saveBtn.dataset.missingFields.split(", ");
      const errorEls = [];

      if (missingFields.includes("Title")) {
        const pill = titleInput.closest(".ui-input__pill");
        if (pill) { pill.classList.add("ui-input__pill--error"); errorEls.push(pill); }
      }
      if (missingFields.includes("Due date")) {
        const pill = dueInput.closest(".ui-input__pill");
        if (pill) { pill.classList.add("ui-input__pill--error"); errorEls.push(pill); }
      }

      showRichTooltip(saveBtn, {
        title: "Required Fields Missing",
        titleColor: getComputedStyle(this).getPropertyValue("--ui-error").trim(),
        intro: "Please complete the following before saving:",
        items: missingFields.map(f => ({
          term: f,
          desc: f === "Title" ? "Give the action a name" : "Set a due date",
        })),
      }, {
        position: "top",
        persistent: true,
        delay: 0,
        zIndex: 1001,
        onDismiss: () => {
          errorEls.forEach(el => el.classList.remove("ui-input__pill--error"));
        },
      });
    });

    saveBtn.addEventListener("click", () => {
      if (!saveBtn.disabled) this._saveEdit(uid, titleInput.value, dueInput.value);
    });

    // Delete with confirmation
    const deleteBtn = backdrop.querySelector("#wac-edit-delete");
    deleteBtn.addEventListener("click", () => {
      // Replace modal content with confirmation
      const modal = backdrop.querySelector(".wac-modal");
      modal.innerHTML = `
        <h2 class="wac-modal__title">Delete Action?</h2>
        <p style="color:var(--ui-text);font-size:var(--ui-font-s);margin:0 0 var(--ui-space-3);">Are you sure you want to delete "<strong>${escapeHtml(item.summary)}</strong>"?</p>
        <p style="color:var(--ui-text-mute);font-size:var(--ui-font-xs);margin:0 0 var(--ui-space-5);">This removes the action permanently. It cannot be undone.</p>
        <div class="wac-edit-buttons">
          <button class="ui-btn ui-btn--outline" id="wac-delete-cancel">Cancel</button>
          <button class="ui-btn ui-btn--danger ui-btn--filled" id="wac-delete-confirm">Delete</button>
        </div>`;
      backdrop.querySelector("#wac-delete-cancel").addEventListener("click", () => this._closeEditModal());
      backdrop.querySelector("#wac-delete-confirm").addEventListener("click", () => this._deleteItem(uid));
    });

    // Focus the title field
    titleInput.focus();
    titleInput.select();
  }

  _saveEdit(uid, newSummary, newDue) {
    const item = this._items.get(uid);
    if (!item) return;

    const trimmedSummary = newSummary.trim();
    if (!trimmedSummary) return;

    // Preserve existing due date if user clears it
    const effectiveDue = newDue || item.due || null;

    // Optimistic update
    item.summary = trimmedSummary;
    item.due = effectiveDue;

    // Update DOM
    const row = this._rowEls.get(uid);
    if (row) {
      const label = row.querySelector(".label");
      if (label) label.textContent = trimmedSummary;

      const dueEl = row.querySelector(".due");
      if (dueEl) {
        const urgency = this._getDueUrgency(item.due);
        dueEl.className = `due${urgency ? ` due--${urgency}` : ""}${item.checked ? " checked" : ""}`;
        dueEl.textContent = this._formatDue(item.due);
      }
    }

    this._closeEditModal();

    // Persist
    const serviceData = { item: uid, rename: trimmedSummary };
    if (effectiveDue) {
      serviceData.due_date = effectiveDue;
    }

    this._hass.callService(
      "todo", "update_item", serviceData, { entity_id: this._config.entity }
    ).catch(() => {
      console.error("[work-actions-card] Failed to save edit");
    });
  }

  _deleteItem(uid) {
    // Clean up any pending animations/timers
    this._exitingRows.delete(uid);
    if (this._exitTimers.has(uid)) {
      clearTimeout(this._exitTimers.get(uid));
      this._exitTimers.delete(uid);
    }
    if (this._animTimers.has(uid)) {
      clearTimeout(this._animTimers.get(uid));
      this._animTimers.delete(uid);
    }
    // Remove from DOM immediately
    const row = this._rowEls.get(uid);
    if (row) row.remove();
    this._rowEls.delete(uid);
    this._items.delete(uid);
    this._closeEditModal();

    // Persist deletion — re-fetch on failure to restore the item
    this._hass.callService(
      "todo", "remove_item", { item: uid }, { entity_id: this._config.entity }
    ).catch(() => {
      console.error("[work-actions-card] Failed to delete item — restoring");
      this._fetchItems();
    });
  }

  _closeEditModal() {
    const backdrop = this.shadowRoot.querySelector(".wac-modal-backdrop");
    if (!backdrop) return;
    backdrop.classList.remove("is-visible");
    setTimeout(() => backdrop.remove(), 150);
  }

  /* ── Settings: application ───────────────────────────────────────────── */

  _applyMaxHeight() {
    const card = this.shadowRoot.querySelector(".card");
    if (card) card.style.setProperty("--wac-height", `${this._settings.maxHeight}px`);
  }

  _applySettings() {
    this._applyMaxHeight();
    if (this._hass && this._config) this._fetchItems();
  }

  _compareBySortOrder(a, b) {
    if (this._settings.sortOrder === "Newest first") {
      const dateA = this._getMeetingDate(a);
      const dateB = this._getMeetingDate(b);
      return dateB.localeCompare(dateA); // Newest (latest date string) first
    }
    if (this._settings.sortOrder === "Urgency first") {
      return this._urgencyTier(a) - this._urgencyTier(b);
    }
    if (this._settings.sortOrder === "Active first") {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      const dateA = this._getMeetingDate(a);
      const dateB = this._getMeetingDate(b);
      return dateB.localeCompare(dateA);
    }
    return 0;
  }

  /* ── New indicator ─────────────────────────────────────────────────── */

  _isNewItem(uid) {
    // If explicitly marked as seen by interaction, not new
    if (localStorage.getItem(`wac-seen:${uid}`)) return false;
    // Check when item was first encountered
    const firstSeen = localStorage.getItem(`wac-first:${uid}`);
    if (!firstSeen) {
      // First time seeing this item — record timestamp, it's new
      localStorage.setItem(`wac-first:${uid}`, String(Date.now()));
      return true;
    }
    // Auto-expire: if first seen longer ago than the configured hours, no longer new
    const elapsed = Date.now() - parseInt(firstSeen, 10);
    const expiryMs = this._settings.newIndicatorHours * 60 * 60 * 1000;
    return elapsed < expiryMs;
  }

  _markSeen(uid) {
    localStorage.setItem(`wac-seen:${uid}`, "1");
    const row = this._rowEls.get(uid);
    if (row) row.classList.remove("row--new");
  }

  _cleanupLocalStorage(serverUids) {
    if (this._localStorageCleaned) return;
    this._localStorageCleaned = true;

    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("wac-first:") || key?.startsWith("wac-seen:")) {
        const uid = key.slice(key.indexOf(":") + 1);
        if (!serverUids.has(uid)) keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  /* ── Speaker rename/merge ──────────────────────────────────────────── */

  _attachSpeakerChipHandlers() {
    const meta = this.shadowRoot.querySelector(".wac-meeting-meta");
    if (!meta) return;

    // No interactions if meeting date is unknown (pyscript service needs it)
    if (!this._drawerMeetingDate) return;

    const chips = meta.querySelectorAll("[data-speaker]");
    chips.forEach(chip => {
      let longPressTimer = null;
      let didLongPress = false;
      let touchHandled = false;

      const startLongPress = () => {
        didLongPress = false;
        longPressTimer = setTimeout(() => {
          didLongPress = true;
          this._openMergeModal(chip.dataset.speaker);
        }, 500);
      };

      const cancelLongPress = () => {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      };

      // Touch — preventDefault on touchend suppresses the synthetic click
      chip.addEventListener("touchstart", startLongPress, { passive: true });
      chip.addEventListener("touchend", (e) => {
        cancelLongPress();
        if (didLongPress) { e.preventDefault(); return; }
        e.preventDefault(); // suppress synthetic click
        touchHandled = true;
        this._openRenameModal(chip.dataset.speaker);
      });
      chip.addEventListener("touchmove", cancelLongPress);
      chip.addEventListener("touchcancel", cancelLongPress);

      // Mouse — click for rename (skip if touch already handled), contextmenu for merge
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        if (touchHandled) { touchHandled = false; return; }
        this._openRenameModal(chip.dataset.speaker);
      });
      chip.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._openMergeModal(chip.dataset.speaker);
      });
    });
  }

  _openRenameModal(speakerName) {
    this._closeSpeakerModal();

    const card = this.shadowRoot.querySelector(".card");
    if (!card) return;

    const backdrop = document.createElement("div");
    backdrop.className = "wac-modal-backdrop";
    backdrop.innerHTML = `
      <div class="wac-speaker-modal" role="dialog" aria-modal="true">
        <h2 class="wac-speaker-modal__title">Rename Speaker</h2>
        <div class="ui-input">
          <div class="ui-input__pill has-value">
            <label class="ui-input__label">Name</label>
            <input type="text" class="ui-input__field wac-speaker-input" value="${escapeHtml(speakerName)}">
          </div>
        </div>
        <div class="wac-speaker-modal__buttons">
          <button class="ui-btn ui-btn--ghost wac-speaker-cancel">Cancel</button>
          <button class="ui-btn ui-btn--filled wac-speaker-save">Save</button>
        </div>
      </div>`;

    card.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add("is-visible"));

    const input = backdrop.querySelector(".wac-speaker-input");
    input?.focus();
    input?.select();

    backdrop.querySelector(".wac-speaker-cancel")?.addEventListener("click", () => this._closeSpeakerModal());
    backdrop.querySelector(".wac-speaker-save")?.addEventListener("click", () => {
      const newName = input?.value?.trim();
      if (newName && newName !== speakerName) {
        // Auto-detect merge: if new name matches an existing speaker, treat as merge
        const isMerge = this._drawerSpeakers.some(s =>
          s.display.toLowerCase() === newName.toLowerCase() && s.display !== speakerName);
        this._executeSpeakerRename(speakerName, newName, isMerge);
      }
      this._closeSpeakerModal();
    });

    // Enter to save, Esc to cancel
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        backdrop.querySelector(".wac-speaker-save")?.click();
      } else if (e.key === "Escape") {
        this._closeSpeakerModal();
      }
    });

    // Click outside to close
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) this._closeSpeakerModal();
    });
  }

  _openMergeModal(speakerName) {
    const otherSpeakers = this._drawerSpeakers
      .filter(s => s.display !== speakerName)
      .map(s => s.display);

    if (!otherSpeakers.length) {
      // Only one speaker — fall back to rename
      this._openRenameModal(speakerName);
      return;
    }

    this._closeSpeakerModal();

    const card = this.shadowRoot.querySelector(".card");
    if (!card) return;

    const options = otherSpeakers.map(name =>
      `<button class="wac-merge-option" role="radio" aria-checked="false" data-merge-target="${escapeHtml(name)}">
        <span class="wac-merge-option__radio"></span>
        <span>${escapeHtml(name)}</span>
      </button>`
    ).join("");

    const backdrop = document.createElement("div");
    backdrop.className = "wac-modal-backdrop";
    backdrop.innerHTML = `
      <div class="wac-speaker-modal" role="dialog" aria-modal="true">
        <h2 class="wac-speaker-modal__title">Merge Speaker</h2>
        <p class="wac-speaker-modal__subtitle">"${escapeHtml(speakerName)}" is actually:</p>
        <div class="wac-merge-options" role="radiogroup">${options}</div>
        <p class="wac-speaker-modal__warning">${escapeHtml(speakerName)}'s lines will be attributed to the selected speaker. ${escapeHtml(speakerName)} will be removed from this meeting.</p>
        <div class="wac-speaker-modal__buttons">
          <button class="ui-btn ui-btn--ghost wac-speaker-cancel">Cancel</button>
          <button class="ui-btn ui-btn--filled wac-speaker-merge" disabled>Merge</button>
        </div>
      </div>`;

    card.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add("is-visible"));

    let selectedTarget = null;
    const mergeBtn = backdrop.querySelector(".wac-speaker-merge");
    const optionBtns = backdrop.querySelectorAll(".wac-merge-option");

    optionBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        optionBtns.forEach(b => b.setAttribute("aria-checked", "false"));
        btn.setAttribute("aria-checked", "true");
        selectedTarget = btn.dataset.mergeTarget;
        mergeBtn.disabled = false;
      });
    });

    backdrop.querySelector(".wac-speaker-cancel")?.addEventListener("click", () => this._closeSpeakerModal());
    mergeBtn?.addEventListener("click", () => {
      if (selectedTarget) {
        this._executeSpeakerRename(speakerName, selectedTarget, true);
      }
      this._closeSpeakerModal();
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) this._closeSpeakerModal();
    });
  }

  _closeSpeakerModal() {
    const backdrop = this.shadowRoot.querySelector(".wac-modal-backdrop:has(.wac-speaker-modal)");
    if (!backdrop) return;
    backdrop.classList.remove("is-visible");
    setTimeout(() => backdrop.remove(), 150);
  }

  async _executeSpeakerRename(oldName, newName, merge) {
    if (!this._hass) return;
    if (!this._drawerMeetingDate) {
      console.warn("[work-actions-card] Cannot rename: meeting date unknown — date not found in item description");
      return;
    }

    try {
      await this._hass.callService("pyscript", "speaker_rename", {
        old_name: oldName,
        new_name: newName,
        meeting_date: this._drawerMeetingDate,
        meeting_title: this._drawerMeetingTitle || "",
        merge,
      });

      // Re-fetch and re-render the summary drawer + main item list
      await this._refreshDrawerSummary();
      this._fetchItems();
    } catch (e) {
      console.error("[work-actions-card] Speaker rename failed:", e);
    }
  }

  async _refreshDrawerSummary() {
    if (!this._drawerMeetingTitle || !this._hass) return;

    try {
      const resp = await this._hass.connection.sendMessagePromise({
        type: "call_service",
        domain: "todo",
        service: "get_items",
        service_data: { status: ["needs_action", "completed"] },
        target: { entity_id: "todo.meeting_summaries" },
        return_response: true,
      });

      const items = resp.response?.["todo.meeting_summaries"]?.items || [];
      const titleLower = this._drawerMeetingTitle.toLowerCase();
      const datePrefix = this._drawerMeetingDate?.slice(5) || "";

      let match = items.find(s =>
        (s.summary?.toLowerCase().includes(titleLower) ||
         s.description?.toLowerCase().includes(titleLower)) &&
        (s.due === this._drawerMeetingDate || s.summary?.includes(datePrefix))
      );
      if (!match) {
        match = items.find(s =>
          s.summary?.toLowerCase().includes(titleLower) ||
          s.description?.toLowerCase().includes(titleLower)
        );
      }

      let summaryText = match?.description || null;

      // Fallback: read from file for older meetings
      if (!summaryText) {
        summaryText = await this._fetchSummaryFromFile(
          this._drawerMeetingDate, this._drawerMeetingTitle);
      }

      const contentEl = this.shadowRoot.querySelector(".ui-drawer__content");
      if (contentEl && summaryText) {
        contentEl.innerHTML = this._renderSummary(summaryText);
        this._attachSpeakerChipHandlers();
        const drawerEl = this.shadowRoot.querySelector(".ui-drawer");
        if (drawerEl) initCollapsibleSections(drawerEl);
      }
    } catch (e) {
      console.warn("[work-actions-card] Failed to refresh summary:", e);
    }
  }

  async _fetchSummaryFromFile(meetingDate, meetingTitle) {
    if (!meetingDate || !this._hass) return null;
    try {
      const resp = await this._hass.connection.sendMessagePromise({
        type: "call_service",
        domain: "pyscript",
        service: "get_meeting_summary",
        service_data: {
          meeting_date: meetingDate,
          meeting_title: meetingTitle || "",
        },
        return_response: true,
      });
      const result = resp.response;
      if (result?.found && result?.content) return result.content;
    } catch (e) {
      console.warn("[work-actions-card] File fallback failed:", e);
    }
    return null;
  }

  _getMeetingDate(item) {
    if (!item.description) return "";
    const match = item.description.match(/Meeting date:\s*(\S+)/);
    return match ? match[1] : "";
  }

  _urgencyTier(item) {
    if (item.checked) return 4;
    const u = this._getDueUrgency(item.due);
    if (u === "overdue") return 0;
    if (u === "soon") return 1;
    if (u === "future") return 2;
    return 3;
  }
}

customElements.define("work-actions-card", WorkActionsCard);
