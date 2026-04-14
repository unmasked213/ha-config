// | START: styles.js
// |  PATH: www/cards/prompt-manager/modules/styles.js
// InputsInferred: []
// Card-scoped CSS adopted via shadow DOM. All rules are inside a single
// template literal passed to CSSStyleSheet.replaceSync(). Uses --ui-* tokens
// from foundation.js except where documented (syntax highlighting, sub-token
// spacing). See CLAUDE.md "UI Token Exceptions" for rationale.
// Depends on: /local/base/foundation.js (--ui-* CSS custom properties at runtime)
//
// Component-specific styles (migrating to UI tokens)
const pmStyles = new CSSStyleSheet();
pmStyles.replaceSync(`
  /* ── HOST ─────────────────────────────────────────────────────────────── */
  :host {
    display: block;
    margin: var(--ui-space-3);
  }

  /* ── CONTAINER ─────────────────────────────────────────────────────────── */
  .container {
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

  .content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    scrollbar-width: none;
  }

  .content::-webkit-scrollbar {
    display: none;
  }

  /* ── HEADER ────────────────────────────────────────────────────────────── */
  .header {
    margin-bottom: var(--ui-space-4);
  }

  .header-top {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--ui-space-3);
    margin-bottom: var(--ui-space-9);
  }

  .header-top .ui-card-header {
    margin-bottom: 0;
    flex: 1;
    min-width: 200px;
  }

  .header-top .ui-card-header__title {
    flex: none;
  }

  .header-top .ui-card-header ui-info-icon {
    align-self: center;
    margin-top: 2px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--ui-space-3);
    margin-right: 5px;
    flex-shrink: 0;
  }

  /* ── FOCUS RINGS (card-specific elements) ────────────────────────────── */
  .action-btn:focus-visible,
  .form-select:focus-visible {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: 2px;
  }

  /* ── SEARCH ────────────────────────────────────────────────────────────── */
  .search-container {
    position: relative;
    width: 210px;
  }

  .form-input:focus,
  .form-textarea:focus,
  .form-select:focus {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: 0;
  }

  /* ── CATEGORIES ────────────────────────────────────────────────────────── */
  .categories {
    padding-bottom: var(--ui-space-3);
    margin-bottom: var(--ui-space-4);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-med);
  }

  /* Category badge (static, non-interactive — used in view modals etc.) */
  .pm-tag {
    background: var(--_tab-color-faint, var(--ui-elevated-1));
    border: none;
    border-radius: var(--ui-radius-m);
    padding: var(--ui-space-2) var(--ui-space-3);
    font-size: var(--ui-font-xs);
    color: var(--_tab-color, var(--ui-text));
    display: inline-flex;
    align-items: center;
    gap: var(--ui-space-1);
    line-height: var(--ui-font-line-height-s);
  }

  /* ── PROMPTS GRID ──────────────────────────────────────────────────────── */
  .prompts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--ui-space-4);
  }

  /* Hide cards until the intro animation takes over */
  .prompts-grid.pm-intro-pending .prompt-card {
    opacity: 0;
  }

  .prompt-card {
    background: var(--ui-elevated-1);
    border: var(--ui-border-width-l) solid var(--ui-elevated-1);
    border-radius: var(--ui-radius-l);
    padding: var(--ui-space-3);
    transition: all var(--ui-motion-med);
    position: relative;
  }

  .prompt-card.has-movement {
    border: var(--ui-border-width-l) solid var(--ui-spinner-color);
    animation: borderPulse 2s ease-in-out infinite;
  }

  .prompt-card:hover {
    border: var(--ui-border-width-l) solid var(--ui-accent);
    background: var(--ui-elevated-2);
  }

  .prompt-card.has-movement:hover {
    border-color: var(--ui-spinner-color);
    background: var(--ui-elevated-2);
  }

  @keyframes borderPulse {
    0%, 100% { border-color: var(--ui-spinner-color); }
    50% { border-color: var(--ui-pink-soft); }
  }

  .prompt-card.just-scored {
    animation: scoredBorderPulse 1s ease-in-out 2;
  }

  @keyframes scoredBorderPulse {
    0%, 100% { border-color: var(--ui-elevated-1); }
    50% { border-color: var(--ui-spinner-color); }
  }

  /* ── CARD CONTENT ──────────────────────────────────────────────────────── */
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--ui-space-2);
  }

  .card-title {
    margin: 0;
    font-size: var(--ui-font-m);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text);
    flex: 1;
    margin-right: var(--ui-space-3);
  }

  .card-score {
    font-size: calc(var(--ui-font-m) * 1.1);
    font-weight: var(--ui-font-weight-l);
    margin-top: var(--ui-space-1);
    line-height: 1;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
  }

  .card-score.score-pulse {
    animation: scorePulse 1s ease-in-out 2;
  }

  @keyframes scorePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .pm-score-icon {
    width: 1.2em;
    height: 1.2em;
    vertical-align: -2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .pm-score-scoring {
    color: var(--ui-spinner-color);
  }

  .movement-arrow {
    display: inline-block;
    margin-right: var(--ui-space-2);
    animation: arrowPulse 2s ease-in-out infinite;
  }

  @keyframes arrowPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* ── CARD ACTIONS ──────────────────────────────────────────────────────── */
  .card-actions {
    display: flex;
    gap: var(--ui-space-2);
  }

  .action-btn {
    background: none;
    border: none;
    width: var(--ui-space-10);
    height: var(--ui-space-10);
    border-radius: 50%;
    padding: 0;
    cursor: pointer;
    color: var(--ui-text);
    transition: color var(--ui-motion-med), background var(--ui-motion-slow), transform var(--ui-motion-slow), box-shadow var(--ui-motion-slow);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn:hover {
    color: var(--ui-text);
  }

  .action-btn svg {
    pointer-events: none;
  }

  .action-btn {
    border-radius: var(--ui-radius-s);
    transition: transform var(--ui-motion-fast), background-color var(--ui-motion-fast);
  }

  .action-btn:hover {
    background-color: var(--ui-state-hover);
  }

  .action-btn:active {
    transform: translateY(1px);
    background-color: var(--ui-state-pressed);
  }

  /* ── DROPDOWN MENU (uses shared .ui-menu with downward modifier) ───────── */
  .dropdown-container {
    position: relative;
  }

  .ui-menu--down {
    bottom: auto;
    top: calc(100% + var(--ui-menu-offset));
  }

  /* ── HEADER OVERFLOW MENU ───────────────────────────────────────────────── */
  .header-menu .ui-btn--icon {
    overflow: visible;
  }

  .header-menu .ui-btn--icon > * {
    pointer-events: none;
  }

  .header-menu__dot {
    position: absolute;
    top: var(--ui-space-1);
    right: var(--ui-space-1);
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ui-error);
  }

  .header-menu__toggle {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    pointer-events: none;
  }

  .header-menu__toggle .ui-checkbox__input {
    pointer-events: none;
  }

  /* ── MODALS (card-specific overrides on shared ui-modal) ──────────────── */
  .ui-modal-backdrop {
    background: var(--ui-overlay-scrim-strong);
    overflow: auto;
    /* align-items: flex-start so the modal anchors to the top of the backdrop's
       scroll container. Without this, the base flex centering (align-items: center)
       splits overflow equally above and below the viewport, making overflow: auto
       unable to scroll the modal when it's taller than the viewport at high zoom.
       The modal uses margin: auto to self-center when there is spare space. */
    align-items: flex-start;
  }

  .ui-modal {
    background: var(--ui-elevated-2);
    padding: var(--ui-space-6);
    width: 100%;
    max-width: clamp(300px, 90%, var(--ui-modal-max-width-m));
    margin: auto;
    max-height: none;
    overflow: visible;
  }

  .ui-modal::-webkit-scrollbar {
    display: none;
  }

  .ui-modal__close {
    position: absolute;
    top: var(--ui-space-4);
    right: var(--ui-space-4);
    z-index: 10;
  }

  .ui-modal__title {
    font-size: var(--ui-font-xl);
    color: var(--ui-text);
    margin: 0 0 var(--ui-space-4);
    display: flex;
    align-items: center;
    gap: var(--ui-space-2);
  }

  /* ── FORM HEADER ───────────────────────────────────────────────────────── */
  /* Sits outside the scrollable body. overflow: visible lets the category
     dropdown menu escape downward freely without clipping. */
  .form-header {
    overflow: visible;
    margin-bottom: var(--ui-space-3);
  }

  /* Title input + category dropdown side by side */
  .form-header__row {
    display: flex;
    align-items: flex-start;
    gap: var(--ui-space-3);
  }

  /* Title takes remaining space; category is fixed-width */
  .form-header__title {
    flex: 1;
    min-width: 0;
  }

  /* Category dropdown is compact — just wide enough for the trigger pill.
     margin-top matches the title input's floating-label clearance space. */
  .form-header .category-dropdown {
    flex: 0 0 auto;
    width: 130px;
    margin-top: var(--ui-space-5);
  }

  /* ── SCROLLABLE BODY ───────────────────────────────────────────────────── */
  .ui-modal__body--tall {
    padding: 0;
    overflow-y: auto;
    overflow-x: hidden;
    max-height: min(60dvh, 650px);
    scrollbar-width: none;
  }

  .ui-modal__body--tall::-webkit-scrollbar {
    display: none;
  }

  /* ── FORM INPUTS ───────────────────────────────────────────────────────── */

  /* Shared UI input in modal forms - needs space for floating label */
  .ui-modal .ui-input:not(.ui-input--textarea) {
    height: var(--ui-space-9);
  }

  .ui-modal .ui-input {
    margin-top: var(--ui-space-5);
    margin-bottom: var(--ui-space-3);
  }

  .ui-modal .ui-input:not(.ui-input--textarea) .ui-input__pill {
    height: var(--ui-space-9);
    border-radius: var(--ui-radius-pill);
    transition: border-color var(--ui-motion-med);
  }

  .ui-modal .ui-input__pill--error {
    border-color: var(--ui-error);
  }

  .ui-modal .ui-input:not(.ui-input--textarea) .ui-input__pill.has-value .ui-input__label,
  .ui-modal .ui-input:not(.ui-input--textarea) .ui-input__pill:focus-within .ui-input__label {
    transform: translateY(-40px) scale(0.75);
  }

  /* Muted label when field has value but not focused */
  .ui-modal .ui-input__pill.has-value:not(:focus-within) .ui-input__label {
    color: var(--ui-text-mute);
    transition: transform var(--ui-motion-med), color var(--ui-motion-med);
  }

  .ui-modal .ui-input__pill:focus-within .ui-input__label {
    color: var(--ui-text);
    transition: transform var(--ui-motion-med), color var(--ui-motion-med);
  }

  .ui-modal .ui-input:not(.ui-input--textarea) .ui-input__field {
    padding: var(--ui-space-2) var(--ui-space-4);
    font-size: var(--ui-font-s);
  }

  /* Textarea variants now in shared components.js (ui-input--textarea, ui-input--textarea-lg) */

  .form-input,
  .form-textarea {
    width: 100%;
    background: var(--ui-input-bg);
    border: none;
    border-radius: var(--ui-radius-m);
    padding: var(--ui-space-3);
    color: var(--ui-text);
    font-size: var(--ui-font-s);
    margin-bottom: var(--ui-space-3);
    outline: none;
  }

  .form-textarea {
    min-height: 150px;
    font-family: 'Roboto', monospace;
    line-height: var(--ui-font-line-height-m);
    resize: vertical;
    scrollbar-width: none;
  }

  .form-textarea::-webkit-scrollbar {
    display: none;
  }

  .form-textarea::-webkit-resizer {
    background: transparent;
  }

  /* ── FORM ROW ─────────────────────────────────────────────────────────── */
  .form-row {
    display: flex;
    gap: var(--ui-space-3);
    margin-top: var(--ui-space-5);
    margin-bottom: var(--ui-space-3);
  }

  .form-row .form-input {
    flex: 1;
    margin-bottom: 0;
    height: var(--ui-space-9);
    padding: 0 var(--ui-space-4);
    border-radius: var(--ui-radius-pill);
  }

  .form-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right var(--ui-space-3) center;
    padding-right: var(--ui-space-8);
    cursor: pointer;
  }

  /* ── CATEGORY DROPDOWN ──────────────────────────────────────────────────── */
  .category-dropdown {
    position: relative;
    flex: 1;
  }

  .category-dropdown__trigger {
    width: 100%;
    height: var(--ui-space-9);
    background: var(--ui-input-bg);
    border: var(--ui-border-width-l) solid transparent;
    border-radius: var(--ui-radius-pill);
    padding: 0 var(--ui-space-4);
    color: var(--ui-text);
    font-size: var(--ui-font-s);
    text-align: right;
    cursor: pointer;
    transition: border-color var(--ui-motion-med);
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .category-dropdown--error .category-dropdown__trigger {
    border-color: var(--ui-error);
  }

  .category-dropdown--open .category-dropdown__trigger {
    border-color: var(--ui-accent);
  }

  .category-dropdown__trigger:focus-visible {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: 2px;
  }

  .category-dropdown__label {
    position: absolute;
    left: var(--ui-space-4);
    top: calc(var(--ui-space-9) / 2);
    transform: translateY(-50%);
    color: var(--ui-text-mute);
    font-size: var(--ui-font-m);
    pointer-events: none;
    transition: transform var(--ui-motion-med), color var(--ui-motion-med);
    transform-origin: left center;
  }

  .category-dropdown--open .category-dropdown__label {
    transform: translateY(-40px) scale(0.75);
    color: var(--ui-text);
  }

  /* Chips container — sits between the trigger button and the menu */
  .category-dropdown__chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ui-space-2);
    padding: var(--ui-space-2) var(--ui-space-3) 0;
  }

  /* When chips are promoted to .form-header level (outside the 130px
     dropdown column), they should span the full modal width with no
     horizontal padding — the modal's own padding provides the margin.
     min-height reserves the row's space even when empty so the modal
     doesn't shift height when the first chip is added or the last removed. */
  .form-header > .category-dropdown__chips {
    padding: var(--ui-space-2) 0 0;
    min-height: calc(var(--ui-space-2) + 1.6em);
  }

  /* Spring pop-in for newly added category chips.
     cubic-bezier(0.34, 1.56, 0.64, 1) is the same overshoot curve used by
     --ui-switch-motion in foundation.js, giving the elastic/wobble feel.
     The category-chip--new class is added only to freshly inserted chips in
     _updateCategoryChips() — chips already on screen do not get this class
     and therefore do not re-animate on subsequent renders. */
  @keyframes chip-pop-in {
    0%   { transform: scale(0.5); opacity: 0; }
    60%  { transform: scale(1.12); opacity: 1; }
    80%  { transform: scale(0.95); }
    100% { transform: scale(1); }
  }

  .category-dropdown__chips .ui-badge {
    cursor: pointer;
    transition: opacity var(--ui-motion-fast);
  }

  .category-dropdown__chips .ui-badge:hover {
    opacity: 0.7;
  }

  .category-dropdown__chips .ui-badge.category-chip--new {
    animation: chip-pop-in var(--ui-switch-motion) both;
  }

  /* Pulse-out for chips being replaced by Reference.
     Flash background to error, hold so the user notices, then shrink and fade.
     Duration (0.7s) is coupled to the setTimeout in _toggleCategory (events.js)
     which defers the DOM rebuild until the animation completes. If changed here,
     update the timeout there to match. */
  @keyframes chip-pulse-out {
    0%   { background: var(--_badge-color-faint); transform: scale(1); opacity: 1; }
    14%  { background: var(--ui-error-faint, rgba(255,113,100,0.15)); transform: scale(1.05); opacity: 1; }
    71%  { background: var(--ui-error-faint, rgba(255,113,100,0.15)); transform: scale(1.05); opacity: 1; }
    100% { transform: scale(0.5); opacity: 0; }
  }

  .category-dropdown__chips .ui-badge.category-chip--pulse-out {
    animation: chip-pulse-out 0.7s ease-out forwards;
    pointer-events: none;
  }

  .category-dropdown__dot {
    width: var(--ui-space-2);
    height: var(--ui-space-2);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .category-dropdown__chevron {
    color: var(--ui-text-mute);
    transition: transform var(--ui-motion-fast);
    flex-shrink: 0;
  }

  .category-dropdown__trigger[aria-expanded="true"] .category-dropdown__chevron {
    transform: rotate(180deg);
  }

  .category-dropdown .ui-menu {
    left: 0;
    right: 0;
    min-width: 160px;
    max-height: calc(var(--ui-menu-item-height) * 5);
    overflow-y: auto;
  }

  .category-dropdown .ui-menu__item {
    display: flex;
    align-items: center;
    gap: var(--ui-space-2);
  }

  .category-dropdown .ui-menu__item .category-dropdown__dot {
    width: var(--ui-space-3);
    height: var(--ui-space-3);
  }

  /* ── VIEW META ───────────────────────────────────────────────────────────── */
  .view-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ui-space-2);
    align-items: center;
    margin: var(--ui-space-2) 0 var(--ui-space-3);
  }

  /* Metadata strip: sits between category tags and prompt content.
     Badge on the left, stat chips pushed right. */
  .view-strip {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--ui-space-2);
    padding: var(--ui-space-2) 0;
    margin-bottom: var(--ui-space-4);
  }

  .view-strip__spacer {
    flex: 1 1 0;
    min-width: var(--ui-space-2);
  }

  /* ── Score / status badge ────────────────────────────────────────────── */
  .view-strip__badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: var(--ui-radius-pill);
    font-size: var(--ui-font-xs);
    font-weight: var(--ui-font-weight-l);
    line-height: 1.4;
    /* Tier-coloured tint background via faint token, text via solid token */
    background: var(--_badge-bg, var(--ui-state-hover));
    color: var(--_badge-color);
  }

  .view-strip__badge-score {
    font-feature-settings: 'tnum' 1;
    font-weight: var(--ui-font-weight-l);
  }

  .view-strip__badge-tier {
    opacity: 0.72;
    font-weight: var(--ui-font-weight-m);
  }

  /* Muted state — reference / not-rated */
  .view-strip__badge--muted {
    --_badge-color: var(--ui-text-mute);
    background: var(--ui-state-hover);
    color: var(--ui-text-mute);
    font-weight: var(--ui-font-weight-m);
    font-style: italic;
  }

  /* ── Stat chips ──────────────────────────────────────────────────────── */
  .view-strip__chips {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  .view-strip__chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: var(--ui-radius-pill);
    font-size: var(--ui-font-xs);
    line-height: 1.4;
    letter-spacing: 0.2px;
    color: var(--ui-text-mute);
    background: var(--ui-state-hover);
  }

  .prompt-id {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
    font-family: monospace;
  }

  /* ── VARIABLES SECTION ─────────────────────────────────────────────────── */
  .variables-section {
    margin-top: var(--ui-space-6);
  }

  .variables-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--ui-space-3);
  }

  .variables-title {
    margin: 0;
    font-size: var(--ui-font-xl);
    color: var(--ui-text);
    display: flex;
    align-items: center;
    gap: var(--ui-space-2);
  }

  /* ui-fab handles colour, shadow, size, and interaction styles. */
  .variables-generate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .variables-generate-btn ha-icon {
    --mdc-icon-size: 20px;
  }

  .variables-list {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-3);
  }


  /* ── FORM BUTTONS ──────────────────────────────────────────────────────── */
  .form-buttons {
    display: flex;
    gap: var(--ui-space-3);
    justify-content: flex-end;
    margin-top: var(--ui-space-5);
    align-items: center;
  }

  /* Submit button wrapper for click handling on disabled state */
  .submit-btn-wrapper {
    display: inline-block;
    cursor: pointer;
  }

  .form-buttons .ui-btn:disabled {
    pointer-events: none;
  }



  /* ── FILL-IN MODAL ──────────────────────────────────────────────────────── */
  .fill-modal {
    max-width: clamp(300px, 90%, var(--ui-modal-max-width-m));
  }

  .fill-modal h2 {
    margin-bottom: var(--ui-space-2);
  }

  .fill-modal-subtitle {
    color: var(--ui-text-mute);
    font-size: var(--ui-font-s);
    margin-bottom: var(--ui-space-5);
  }

  .fill-variables-list {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-4);
    max-height: 50vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: var(--ui-space-2);
    margin-bottom: var(--ui-space-4);
    scrollbar-width: none;
  }

  .fill-variables-list::-webkit-scrollbar {
    display: none;
  }

  .fill-variables-list .ui-input__pill {
    min-height: var(--ui-space-9);
    height: auto;
  }

  .fill-variables-list .ui-input__field {
    padding-top: var(--ui-space-5);
    min-height: var(--ui-space-8);
    resize: vertical;
  }

  .required-marker {
    color: var(--ui-error);
    margin-left: var(--ui-space-1);
    font-weight: var(--ui-font-weight-l);
  }

  /* ── FILL MODAL INJECT BUTTON ──────────────────────────────────────────── */
  .fill-field-wrapper {
    position: relative;
  }

  /* ui-fab handles colour, shadow, size, and interaction styles. */
  .fill-inject-btn {
    position: absolute;
    bottom: var(--ui-space-3);
    right: var(--ui-space-3);
  }

  .fill-inject-btn ha-icon {
    --mdc-icon-size: 20px;
  }


  /* ── AI SPARKLE BUTTON ─────────────────────────────────────────────────── */
  /* Positioned absolutely inside the textarea wrapper — ui-fab handles all
     colour, shadow, size, and interaction styles. */
  .ai-sparkle-btn {
    position: absolute;
    bottom: var(--ui-space-3);
    right: var(--ui-space-3);
  }

  .ai-sparkle-btn ha-icon {
    --mdc-icon-size: 20px;
  }

  /* ── FAB ENTRANCE / EXIT ANIMATION ────────────────────────────────────── */
  /* Mirrors the rich tooltip animation: opacity fade + spring scale.
     Applied to ai-sparkle-btn and variables-generate-btn via the
     showFab() / hideFab() helpers in events.js.
     Uses shared motion tokens from foundation.js + tooltip spring curve. */
  .ai-sparkle-btn,
  .variables-generate-btn {
    opacity: 0;
    transform: scale(var(--ui-tooltip-origin-scale, 0.88));
    transition:
      opacity var(--ui-tooltip-motion-opacity),
      transform var(--ui-tooltip-motion-transform);
  }

  .ai-sparkle-btn.ai-fab--visible,
  .variables-generate-btn.ai-fab--visible {
    opacity: 1;
    transform: scale(1);
  }

  @media (prefers-reduced-motion: reduce) {
    .ai-sparkle-btn,
    .variables-generate-btn {
      transition: none;
    }

    .prompt-card.has-movement {
      animation: none;
    }

    .prompt-card.just-scored {
      animation: none;
    }

    .card-score.score-pulse {
      animation: none;
    }

    .movement-arrow {
      animation: none;
    }

    .category-dropdown__chips .ui-badge.category-chip--new {
      animation: none;
    }

    .category-dropdown__chips .ui-badge.category-chip--pulse-out {
      animation: none;
    }

    .inputs-toggle__chevron,
    .inputs-collapsible__body {
      transition: none;
    }

    .view-content pre.pm-hl--pending,
    .inputs-collapsible__body pre.pm-hl--pending {
      animation: none;
    }
  }

  /* ── TEXTAREA WRAPPER ──────────────────────────────────────────────────── */
  .textarea-wrapper {
    position: relative;
  }

  .textarea-wrapper .form-textarea {
    min-height: 80px;
  }

  .textarea-wrapper--content .form-textarea {
    min-height: 150px;
  }

  /* ── USAGE INSIGHT INLINE ──────────────────────────────────────────────── */
  .usage-insight-wrapper {
    margin-bottom: var(--ui-space-3);
  }

  /* ── EMPTY STATE ───────────────────────────────────────────────────────── */
  .empty-state {
    text-align: center;
    padding: var(--ui-space-10) var(--ui-space-6);
    color: var(--ui-text-mute);
  }

  /* ── DELETE CONFIRMATION ───────────────────────────────────────────────── */
  .delete-confirmation-modal {
    max-width: var(--ui-modal-max-width-s);
    text-align: center;
  }

  .confirmation-message {
    margin: var(--ui-space-4) 0;
    font-size: var(--ui-font-m);
    color: var(--ui-text);
  }

  .confirmation-warning {
    margin: var(--ui-space-3) 0 var(--ui-space-5);
    font-size: var(--ui-font-s);
    color: var(--ui-error);
    font-weight: var(--ui-font-weight-l);
  }

  .confirmation-hint {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
    margin-bottom: var(--ui-space-5);
  }

  .confirmation-input {
    text-align: center;
    margin: var(--ui-space-4) 0;
  }

  /* ── VIEW MODAL ────────────────────────────────────────────────────────── */
  .view-modal {
    max-width: clamp(300px, 90%, var(--ui-modal-max-width-l));
    /* Cap the modal to the viewport so long prompts don't push it off-screen.
       The modal uses flex-direction: column (inherited from base .ui-modal) so
       .view-content can take flex: 1 and scroll internally. */
    max-height: min(90dvh, 900px);
    display: flex;
    flex-direction: column;
  }

  .view-description {
    background: var(--ui-elevated-3);
    border-radius: var(--ui-radius-m);
    padding: var(--ui-space-4);
    margin-bottom: var(--ui-space-5);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-med);
  }

  .view-description pre,
  .view-content pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: inherit;
    font-size: var(--ui-font-s);
    line-height: var(--ui-font-line-height-m);
  }

  .view-description pre {
    color: var(--ui-text-mute);
  }

  .view-content {
    background: var(--ui-elevated-3);
    border-radius: var(--ui-radius-m);
    padding: var(--ui-space-4);
    margin-bottom: var(--ui-space-5);
    flex: 1;
    min-height: 100px;
    /* min-height: 0 lets flex shrink work — without it, the flex item refuses
       to shrink below its content height regardless of the parent max-height. */
    min-height: 0;
    overflow: auto;
    scrollbar-width: none;
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-med);
  }

  .view-content::-webkit-scrollbar {
    display: none;
  }

  .view-content pre {
    color: var(--ui-text);
    font-family: 'Roboto', monospace;
    line-height: var(--ui-font-line-height-l);
  }

  /* ── INPUTS COLLAPSIBLE ─────────────────────────────────────────────── */
  /* Collapsible <inputs> block in view modal. Collapsed by default. */
  .inputs-collapsible {
    margin-bottom: var(--ui-space-3);
  }

  .inputs-toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--ui-space-2);
    padding: var(--ui-space-1) var(--ui-space-3);
    border-radius: var(--ui-radius-pill);
    background: var(--ui-elevated-2);
    border: none;
    color: var(--ui-text-mute);
    font-size: var(--ui-font-xs);
    font-weight: var(--ui-font-weight-l);
    cursor: pointer;
    transition: background var(--ui-motion-fast), color var(--ui-motion-fast);
    line-height: 1.4;
  }

  .inputs-toggle:hover {
    background: var(--ui-state-hover);
    color: var(--ui-text);
  }

  .inputs-toggle__chevron {
    transition: transform var(--ui-motion-med);
    flex-shrink: 0;
  }

  .inputs-toggle__chevron--open {
    transform: rotate(180deg);
  }

  /* max-height transition pattern: actual content is shorter than the ceiling
     value but CSS transitions require a concrete max-height, not auto. 500px is
     generous for typical <inputs> blocks. Content exceeding this clips at the
     collapsible body's own overflow:hidden boundary. */
  .inputs-collapsible__body {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height var(--ui-motion-med) ease-out, opacity var(--ui-motion-med);
  }

  .inputs-collapsible__body--open {
    max-height: 500px;
    opacity: 1;
    transition: max-height var(--ui-motion-med) ease-in, opacity var(--ui-motion-med);
  }

  .inputs-collapsible__body pre {
    margin-top: var(--ui-space-2);
  }

  /* ── Highlighted prompt (line numbers + Prism tokens) ──────────────── */
  /* UI TOKEN EXCEPTION: All .pm-highlighted rules are exempt from --ui-*
     token constraints. The highlighting layer serves different goals than
     the UI component layer:
     1. Syntax colour palette — Dracula-derived, desaturated to harmonise
        with the UI token palette. Scoped as --hl-* vars.
     2. Rendered markdown — visual fidelity (bold 700, heading sizing)
        requires values the token scale doesn't provide.
     See CLAUDE.md "UI Token Exceptions" for governance. */

  .view-content:has(.pm-highlighted) {
    --hl-bg:      var(--ui-surface);
    --hl-fg:      #f8f8f2;
    --hl-comment: #6272a4;
    --hl-cyan:    #79c8d8;
    --hl-green:   #6dc28f;
    --hl-orange:  #d9a36e;
    --hl-pink:    #cf8db1;
    --hl-purple:  #b18fd8;
    --hl-red:     #d97272;
    --hl-yellow:  #d9c27a;
    background: var(--hl-bg);
  }

  :host(.light-theme) .view-content:has(.pm-highlighted) {
    --hl-fg:      #1e1e2e;
    --hl-comment: #6c7086;
    --hl-cyan:    #04838f;
    --hl-green:   #1a7f37;
    --hl-orange:  #b35c00;
    --hl-pink:    #cf2272;
    --hl-purple:  #7928a1;
    --hl-red:     #c93131;
    --hl-yellow:  #7a6400;
  }

  /* Content reveal: 60ms delay hides the pre while async highlighting
     runs in requestAnimationFrame, then fades in over 120ms. */
  @keyframes pm-content-reveal {
    0%   { opacity: 0; }
    100% { opacity: 1; }
  }

  .view-content pre.pm-highlighted {
    font-family: inherit;
    line-height: 1.65;
    padding: var(--ui-space-2) 0;
    color: var(--hl-fg);
    background: transparent;
    border-radius: var(--ui-radius-m);
    user-select: text;
    -webkit-user-select: text;
    cursor: text;
  }

  /* Content reveal only on initial modal open — the --pending class is
     removed by the RAF after highlighting is applied, preventing the
     animation from replaying on subsequent re-renders (scope toggle, etc.) */
  .view-content pre.pm-hl--pending,
  .inputs-collapsible__body pre.pm-hl--pending {
    animation: pm-content-reveal 120ms ease-out 60ms both;
  }

  .pm-line {
    display: flex;
    align-items: flex-start;
  }

  /* ── Table: flex container (gutter + data) with horizontal scroll ──
     All elements are <span> (phrasing content valid inside <pre>).
     CSS display:table/table-row/table-cell provides table layout. ────── */
  .pm-table-block {
    display: flex;
    max-width: 100%;
    overflow-x: auto;
    margin: var(--ui-space-2) 0;
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }
  .pm-table-block:hover {
    scrollbar-color: var(--ui-scrollbar-thumb) transparent;
  }
  .pm-table-block::-webkit-scrollbar {
    height: 6px;
  }
  .pm-table-block::-webkit-scrollbar-track {
    background: transparent;
  }
  .pm-table-block::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 3px;
  }
  .pm-table-block:hover::-webkit-scrollbar-thumb {
    background: var(--ui-scrollbar-thumb);
  }

  /* Gutter: sticky flex column — locks in place on horizontal scroll */
  .pm-table-gutter {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--hl-bg, var(--ui-elevated-3));
    font-size: 0.92em;
  }

  .pm-table-num {
    color: var(--hl-comment, var(--ui-text-mute));
    text-align: right;
    padding: var(--ui-space-1) var(--ui-space-3);
    user-select: none;
    -webkit-user-select: none;
    background: var(--hl-bg, var(--ui-elevated-3));
    font-variant-numeric: tabular-nums;
    white-space: pre;
    border-bottom: 1px solid transparent;
  }

  .pm-table-num--head {
    border-bottom-width: 2px;
  }

  .pm-table-num--last {
    border-bottom: none;
  }

  /* Wrapper clips the data table to rounded corners */
  .pm-table-wrap {
    display: block;
    border-radius: var(--ui-radius-s);
    overflow: hidden;
    min-width: max-content;
  }

  /* Data table — CSS table display on <span> elements */
  .pm-table  { display: table; border-collapse: separate; border-spacing: 0; font-size: 0.92em; }
  .pm-thead  { display: table-header-group; }
  .pm-tbody  { display: table-row-group; }
  .pm-tr     { display: table-row; }

  .pm-th,
  .pm-td {
    display: table-cell;
    padding: var(--ui-space-1) var(--ui-space-3);
    border-bottom: 1px solid var(--ui-border-color-med);
    white-space: nowrap;
    background: var(--ui-state-hover);
  }

  .pm-th {
    font-weight: var(--ui-font-weight-l);
    border-bottom-width: 2px;
    color: var(--hl-orange);
  }

  .pm-tr--last > .pm-td {
    border-bottom: none;
  }

  .pm-line--fence {
    display: none;
  }

  .pm-code-block {
    display: block;
    overflow-x: auto;
    background: var(--ui-elevated-2);
    border-radius: var(--ui-radius-s);
    padding: var(--ui-space-2) 0;
    /* Firefox: always-present thin scrollbar, thumb invisible until hover */
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }
  .pm-code-block:hover {
    scrollbar-color: var(--ui-scrollbar-thumb) transparent;
  }
  /* Chromium/Brave: slim overlay-style scrollbar */
  .pm-code-block::-webkit-scrollbar {
    height: 6px;
  }
  .pm-code-block::-webkit-scrollbar-track {
    background: transparent;
  }
  .pm-code-block::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 3px;
  }
  .pm-code-block:hover::-webkit-scrollbar-thumb {
    background: var(--ui-scrollbar-thumb);
  }

  /* ── Collapsible code blocks (>5 lines) ────────────────────────────── */
  .pm-code-collapse {
    display: block;
    background: var(--ui-elevated-2);
    border-radius: var(--ui-radius-s);
  }

  .pm-code-collapse .pm-code-block {
    max-height: calc(1.65em * 5 + var(--ui-space-4));
    overflow-y: hidden;
    position: relative;
    border-radius: var(--ui-radius-s) var(--ui-radius-s) 0 0;
  }

  /* Gradient fade at truncation edge */
  .pm-code-collapse .pm-code-block::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3em;
    background: linear-gradient(to bottom, transparent, var(--ui-elevated-2));
    pointer-events: none;
    z-index: 2;
  }

  .pm-code-expand {
    display: block;
    text-align: left;
    padding: var(--ui-space-1) 0 var(--ui-space-2) var(--ui-space-3);
    cursor: pointer;
    color: var(--ui-accent);
    font-size: var(--ui-font-xs);
    user-select: none;
    -webkit-user-select: none;
    border-top: var(--ui-border-width-s) solid var(--ui-border-color-light);
  }

  .pm-code-expand::after {
    content: 'Show more';
  }

  .pm-code-expand:hover {
    color: var(--hl-cyan);
  }

  /* Expanded state — toggled via inline onclick */
  .pm-code-collapse--open .pm-code-block {
    max-height: none;
    border-radius: var(--ui-radius-s);
  }

  .pm-code-collapse--open .pm-code-block::after {
    display: none;
  }

  .pm-code-collapse--open .pm-code-expand::after {
    content: 'Show less';
  }

  .pm-line--code {
    padding-left: var(--ui-space-3);
    min-width: max-content;
  }

  .pm-code-block .pm-line-num {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--ui-elevated-2);
    padding-left: var(--ui-space-2);
  }

  .pm-line--code .pm-line-content {
    font-family: 'Consolas', 'SF Mono', 'Fira Code', monospace;
    color: var(--hl-cyan);
    white-space: pre;
    word-break: normal;
  }

  .pm-line-num {
    flex-shrink: 0;
    color: var(--hl-comment, var(--ui-text-mute));
    opacity: 0.55;
    user-select: none;
    -webkit-user-select: none;
    padding-right: 1.5ch;
    pointer-events: none;
  }

  .pm-code-block .pm-line-num,
  .pm-table-num {
    opacity: 1;
    color: var(--hl-comment, var(--ui-text-mute));
  }

  .pm-line-content {
    flex: 1;
    min-width: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .pm-line--code-first {
  }

  .pm-line--code-last {
  }

  .pm-line--code-first.pm-line--code-last {
  }

  /* ── Prism token colours — Dracula mapping ─────────────────────────── */
  /* pink → tags, green → attr-names/italic, yellow → strings/values,
     orange → variables/input-refs, red → numbers, cyan → bold/urls/code,
     purple → headings, accent → blockquote border,
     comment → bullets/list-numbers/structural. */

  .pm-highlighted .token.comment,
  .pm-highlighted .token.cdata {
    color: var(--hl-comment);
    font-style: italic;
  }

  .pm-highlighted .token.variable {
    color: var(--hl-orange);
    font-weight: var(--ui-font-weight-l);
  }

  /* Single-brace input references: {skillName} when skillName is a declared
     input. Same treatment as {{variable}} — the inputs block is collapsed
     behind a toggle so there's no visual ambiguity. */
  .pm-highlighted .token.input-ref {
    color: var(--hl-orange);
    font-weight: var(--ui-font-weight-l);
  }

  .pm-highlighted .token.tag {
    color: var(--hl-pink);
  }

  .pm-highlighted .token.tag .token.punctuation {
    color: var(--hl-pink);
    opacity: 0.6;
  }

  .pm-highlighted .token.tag .token.attr-name {
    color: var(--hl-green);
  }

  .pm-highlighted .token.tag .token.attr-value {
    color: var(--hl-yellow);
  }

  .pm-highlighted .token.string {
    color: var(--hl-yellow);
  }

  .pm-highlighted .token.number {
    color: var(--hl-red);
  }

  .pm-highlighted .token.url {
    color: var(--hl-cyan);
    text-decoration: underline;
  }

  .pm-highlighted .token.keyword {
    color: var(--hl-purple);
    font-weight: 700;
    font-size: 1.15em;
  }

  .pm-highlighted .token.keyword .token.md-heading-marker {
    font-size: 0;
  }

  .pm-highlighted .token.bold {
    color: var(--hl-cyan);
    font-weight: 700;
  }

  .pm-highlighted .token.bold .token.punctuation {
    font-size: 0;
  }

  .pm-highlighted .token.italic {
    color: var(--hl-green);
    font-style: italic;
  }

  .pm-highlighted .token.italic .token.punctuation {
    font-size: 0;
  }

  .pm-highlighted .token.blockquote {
    display: inline-block;
    border-left: 3px solid var(--ui-accent);
    padding-left: 1ch;
    width: 100%;
  }

  /* Horizontal rules: rendered as a visual line, dashes hidden */
  .pm-highlighted .token.hr {
    font-size: 0;
    display: block;
    border-bottom: 1px solid var(--hl-comment);
    margin: 0.25em 0;
  }

  .pm-highlighted .token.list-bullet {
    font-size: 0;
  }

  .pm-highlighted .token.list-bullet::before {
    content: '•\\00a0\\00a0';
    font-size: var(--ui-font-s);
    color: var(--hl-comment);
  }

  .pm-highlighted .token.list-number {
    color: var(--hl-comment);
  }

  .pm-highlighted .token.paren {
    color: var(--ui-text-mute);
  }

  .pm-highlighted .token.punctuation {
    color: var(--hl-fg);
    opacity: 0.5;
  }

  /* Inline code: backtick-wrapped content */
  .pm-highlighted .token.code {
    font-family: 'Consolas', 'SF Mono', 'Fira Code', monospace;
    color: var(--hl-cyan);
    background: var(--ui-elevated-2);
    border-radius: 4px;
    padding: 0.1em 0.35em;
  }

  .pm-highlighted .token.code .token.code-punctuation {
    font-size: 0;
  }

  /* Mid-word apostrophes — render as normal text */
  .pm-highlighted .token.apostrophe {
    color: var(--hl-fg);
  }

  /* Table formatting */
  .pm-highlighted .token.table-separator {
    color: var(--hl-comment);
    opacity: 0.5;
  }

  .pm-highlighted .token.table-pipe {
    color: var(--hl-comment);
  }

  .usage-insight {
    background: var(--ui-elevated-1);
    border: var(--ui-border-width-s) solid var(--ui-border-color-med);
    border-radius: var(--ui-radius-pill);
    padding: var(--ui-space-2) var(--ui-space-3);
    font-size: var(--ui-font-xs);
    color: var(--ui-text);
    font-weight: var(--ui-font-weight-l);
    line-height: var(--ui-font-line-height-s);
  }

  /* ── VERSION HISTORY MODAL ─────────────────────────────────────────────── */
  .version-history-modal {
    max-width: clamp(300px, 90%, var(--ui-modal-max-width-m));
  }

  .version-history-list {
    display: flex;
    flex-direction: column;
  }

  .version-item {
    padding: var(--ui-space-3) 0;
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
  }

  .version-item:last-child {
    border-bottom: none;
  }

  .version-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--ui-space-2);
  }

  .version-date {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
  }

  .version-restore {
    font-size: var(--ui-font-xs);
    padding: var(--ui-space-1) var(--ui-space-3);
    height: auto;
    min-height: 0;
  }

  .version-preview {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
    font-family: inherit;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 60px;
    overflow: hidden;
    line-height: var(--ui-font-line-height-m);
  }

  /* ── OPTIMIZE MODAL ────────────────────────────────────────────────────── */
  .optimize-modal {
    max-width: clamp(300px, 95%, var(--ui-modal-max-width-l));
    max-height: min(85vh, 700px);
  }

  .optimize-modal--loading {
    max-width: clamp(280px, 80%, var(--ui-modal-max-width-s));
    max-height: none;
  }

  /* ── OPTIMIZE STATS BAR ───────────────────────────────────────────────── */
  .optimize-stats-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--ui-space-2) var(--ui-space-4);
    margin-bottom: var(--ui-space-4);
    padding: var(--ui-space-3) var(--ui-space-4);
    background: var(--ui-elevated-1);
    border-radius: var(--ui-radius-m);
  }

  .optimize-scores-row {
    display: flex;
    align-items: center;
    gap: var(--ui-space-3);
  }

  .optimize-score-pill {
    font-size: var(--ui-font-m);
    font-weight: var(--ui-font-weight-l);
    font-feature-settings: 'tnum' 1;
  }

  .optimize-delta {
    font-size: var(--ui-font-s);
    font-weight: var(--ui-font-weight-l);
    font-feature-settings: 'tnum' 1;
    padding: 2px 8px;
    border-radius: var(--ui-radius-pill);
  }

  .optimize-delta--up {
    background: var(--ui-success-faint);
    color: var(--ui-success);
  }

  .optimize-delta--down {
    background: var(--ui-error-faint);
    color: var(--ui-error);
  }

  .optimize-delta--same {
    background: var(--ui-state-hover);
    color: var(--ui-text-mute);
  }

  .optimize-meta-row {
    display: flex;
    align-items: center;
    gap: var(--ui-space-3);
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
  }

  .optimize-meta-chip {
    font-feature-settings: 'tnum' 1;
  }

  .optimize-stat-delta {
    font-feature-settings: 'tnum' 1;
    opacity: 0.7;
  }

  .optimize-comparison {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--ui-space-4);
    margin-bottom: var(--ui-space-4);
    min-height: 0;
    flex: 1;
    overflow: hidden;
  }

  .optimize-column {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .optimize-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--ui-space-2);
    padding-bottom: var(--ui-space-2);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-med);
    flex-shrink: 0;
  }

  .optimize-header h3 {
    margin: 0;
    font-size: var(--ui-font-s);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text);
  }

  .optimize-header .ui-copy-btn {
    width: var(--ui-space-8);
    height: var(--ui-space-8);
  }

  .optimize-content {
    background: var(--ui-elevated-3);
    border-radius: var(--ui-radius-m);
    padding: var(--ui-space-3);
    flex: 1;
    overflow: auto;
    min-height: 0;
    scrollbar-width: none;
  }

  .optimize-content::-webkit-scrollbar {
    display: none;
  }

  .optimize-content pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: 'Roboto', monospace;
    font-size: var(--ui-font-xs);
    line-height: var(--ui-font-line-height-m);
    color: var(--ui-text);
  }

  /* Syntax highlighting in optimize panels — reuse view-content Dracula vars */
  .optimize-content:has(.pm-highlighted) {
    --hl-bg:      var(--ui-elevated-3);
    --hl-fg:      #f8f8f2;
    --hl-comment: #6272a4;
    --hl-cyan:    #79c8d8;
    --hl-green:   #6dc28f;
    --hl-orange:  #d9a36e;
    --hl-pink:    #cf8db1;
    --hl-purple:  #b18fd8;
    --hl-red:     #d97272;
    --hl-yellow:  #d9c27a;
    background: var(--hl-bg);
  }

  :host(.light-theme) .optimize-content:has(.pm-highlighted) {
    --hl-fg:      #1e1e2e;
    --hl-comment: #6c7086;
    --hl-cyan:    #04838f;
    --hl-green:   #1a7f37;
    --hl-orange:  #b35c00;
    --hl-pink:    #cf2272;
    --hl-purple:  #7928a1;
    --hl-red:     #c93131;
    --hl-yellow:  #7a6400;
  }

  .optimize-content pre.pm-highlighted {
    font-family: inherit;
    line-height: 1.65;
    padding: var(--ui-space-2) 0;
    color: var(--hl-fg);
    background: transparent;
    border-radius: var(--ui-radius-m);
  }

  .optimize-improvements {
    margin-bottom: var(--ui-space-4);
    flex-shrink: 0;
  }

  .optimize-improvements-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ui-space-2);
  }

  .optimize-improvement-chip {
    display: inline-flex;
    align-items: center;
    padding: var(--ui-space-2) var(--ui-space-3);
    border-radius: var(--ui-radius-pill);
    font-size: var(--ui-font-xs);
    line-height: var(--ui-font-line-height-s);
    color: var(--ui-text);
    background: var(--ui-elevated-1);
    border: var(--ui-border-width-s) solid var(--ui-border-color-light);
  }

  /* ── LOADING INDICATOR ─────────────────────────────────────────────────── */
  .loading-indicator {
    text-align: center;
    padding: var(--ui-space-9) var(--ui-space-5);
  }

  .loading-spinner-icon {
    --mdc-icon-size: var(--ui-space-10);
    color: var(--ui-spinner-color);
  }

  .loading-indicator p {
    color: var(--ui-text-mute);
    font-size: var(--ui-font-s);
  }

  /* ── SYNC BANNER ───────────────────────────────────────────────────────── */
  .sync-banner {
    background: var(--ui-error);
    color: var(--ui-text-on-danger);
    padding: var(--ui-space-1) var(--ui-space-2);
    margin-bottom: var(--ui-space-2);
    border-radius: var(--ui-radius-s);
    font-size: var(--ui-font-xs);
    text-align: center;
  }

  /* ── TABLE MODAL ───────────────────────────────────────────────────────── */
  .table-modal {
    max-width: clamp(400px, 95%, 1200px);
    /* Fill available height so the scroll container can flex-grow */
    height: min(calc(100vh - 48px), calc(100dvh - 48px));
  }

  /* Suppress the intro animation on sort / column-toggle re-renders */
  .table-modal--no-anim {
    animation: none !important;
    opacity: 1 !important;
  }

  .table-modal-header {
    flex-shrink: 0;
    padding-bottom: var(--ui-space-4);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-med);
  }

  .table-column-toggles {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ui-space-4);
    margin: var(--ui-space-3) 0;
  }

  .table-header-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--ui-space-3);
  }

  .table-scroll-container {
    flex: 1 1 0;
    min-height: 0;          /* allow flex child to shrink below content */
    overflow: auto;
    margin-top: var(--ui-space-4);
    scrollbar-width: none;
  }

  .table-scroll-container::-webkit-scrollbar {
    display: none;
  }

  .prompts-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    min-width: 500px;
  }

  .prompts-table th,
  .prompts-table td {
    padding: var(--ui-space-3) var(--ui-space-3);
    text-align: left;
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-med);
  }

  .prompts-table th {
    background: var(--ui-elevated-1);
    position: sticky;
    top: 0;
    font-weight: 600;
    font-size: var(--ui-font-s);
    z-index: 1;
    cursor: pointer;
    transition: background var(--ui-motion-med);
    user-select: none;
  }

  /* Curved top corners on first and last visible header cells */
  .prompts-table th:first-child {
    border-top-left-radius: var(--ui-radius-m);
  }
  .prompts-table th.col-last-visible {
    border-top-right-radius: var(--ui-radius-m);
  }

  .prompts-table th:hover {
    background: var(--ui-elevated-2);
  }

  .prompts-table th .sort-indicator {
    margin-left: var(--ui-space-1);
    opacity: 0.5;
  }

  .prompts-table th.sorted .sort-indicator {
    opacity: 1;
  }

  .prompts-table td {
    font-size: var(--ui-font-s);
    color: var(--ui-text);
    user-select: text;
  }

  .prompts-table tbody tr:hover {
    background: var(--ui-elevated-1);
  }

  .prompts-table .col-description {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .prompts-table .col-title {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: var(--ui-font-weight-l);
  }

  .prompts-table .col-category {
    white-space: nowrap;
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .prompts-table .col-score,
  .prompts-table .col-version,
  .prompts-table .col-uses,
  .prompts-table .col-tokens {
    white-space: nowrap;
    text-align: right;
  }

  /* ── SPINNER ICONS ─────────────────────────────────────────────────────── */
  [id$="-generate-desc"] ha-icon[icon="svg-spinners:3-dots-move"],
  [id$="-refine"] ha-icon[icon="svg-spinners:3-dots-move"],
  [id$="-variables-generate"] ha-icon[icon="svg-spinners:3-dots-move"] {
    color: var(--ui-spinner-color);
  }
`);

export { pmStyles };
// |   END: styles.js
