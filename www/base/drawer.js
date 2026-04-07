// /config/www/base/drawer.js

// ============================================================
// SETTINGS DRAWER SYSTEM
// Reusable right-side slide-out panel for card settings
// ============================================================
//
// EXPORTS:
// - uiDrawer: CSSStyleSheet (adopt in shadowRoot)
// - openDrawer(shadowRoot): Show panel + backdrop
// - closeDrawer(shadowRoot): Hide panel + backdrop
//
// USAGE:
//
// 1. Adopt the stylesheet:
//    this.shadowRoot.adoptedStyleSheets = [
//      window.uiFoundation, uiComponents, uiDrawer, styles
//    ];
//
// 2. Add HTML structure inside your card container:
//    <button class="ui-fab ui-fab--regular ui-drawer-toggle">
//      <svg>...</svg>
//    </button>
//    <div class="ui-drawer-backdrop"></div>
//    <div class="ui-drawer">
//      <div class="ui-drawer__header">
//        <h3 class="ui-drawer__title">Settings</h3>
//        <button class="ui-drawer__close">×</button>
//      </div>
//      <div class="ui-drawer__content">
//        <!-- Card-specific settings controls -->
//      </div>
//    </div>
//
// 3. Wire events and call openDrawer/closeDrawer:
//    fab.addEventListener('click', () => openDrawer(this.shadowRoot));
//    close.addEventListener('click', () => closeDrawer(this.shadowRoot));
//    backdrop.addEventListener('click', () => closeDrawer(this.shadowRoot));
//
// CUSTOMISATION:
//   Set --ui-drawer-radius on the card container to match its
//   own border-radius. Defaults to var(--ui-radius-l).
//
// OPTIONAL TABS:
//   Add .ui-drawer__tabs bar with .ui-drawer__tab buttons and
//   .ui-drawer__section[data-section] divs inside __content.
//   Tab switching is card-managed (toggle .is-active classes).
//
// TIMING EXCEPTION:
//   The drawer open animation uses 450ms cubic-bezier(0.22, 1, 0.36, 1)
//   — an elastic settle curve not from the foundation motion token scale.
//   This is intentional: the overshoot settle gives the drawer a physical
//   feel that standard ease-in-out doesn't achieve. The 450ms duration
//   also exceeds --ui-motion-slow (360ms) for the same reason.
//
// ============================================================

export const uiDrawer = new CSSStyleSheet();

uiDrawer.replaceSync(`

  /* ============================================================
   * DRAWER PANEL
   * Right-side slide-out with elastic settle animation.
   * Width: 288px = --ui-space-10 (48px) × 6
   * ============================================================ */

  .ui-drawer {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: calc(var(--ui-space-10) * 6);
    max-width: 85%;
    background: var(--ui-elevated-2);
    border-left: var(--ui-border-width-s) solid var(--ui-border-color-light);
    border-radius: var(--ui-drawer-radius, var(--ui-radius-l)) 0 0 var(--ui-drawer-radius, var(--ui-radius-l));
    display: flex;
    flex-direction: column;
    z-index: 10;
    transform: translateX(100%);
    opacity: 0;
    transition: transform var(--ui-motion-med), opacity var(--ui-motion-med);
    pointer-events: none;
    transform-origin: right center;
  }

  .ui-drawer.is-open {
    opacity: 1;
    pointer-events: auto;
    animation: ui-drawer-open 450ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes ui-drawer-open {
    0%   { transform: translateX(100%); }
    60%  { transform: translateX(-2%); }
    80%  { transform: translateX(0.5%); }
    100% { transform: translateX(0); }
  }


  /* ============================================================
   * BACKDROP
   * ============================================================ */

  .ui-drawer-backdrop {
    position: absolute;
    inset: 0;
    background: var(--ui-overlay-scrim);
    border-radius: var(--ui-drawer-radius, var(--ui-radius-l));
    z-index: 9;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--ui-motion-med);
  }

  .ui-drawer-backdrop.is-visible {
    opacity: 1;
    pointer-events: auto;
  }


  /* ============================================================
   * FAB TOGGLE
   * Spring entrance on card hover, always visible on touch.
   * Cards parent the FAB inside their container so the hover
   * selector works via the container:hover rule in card CSS.
   * ============================================================ */

  .ui-drawer-toggle {
    position: absolute;
    right: var(--ui-space-4);
    top: var(--ui-space-2);
    z-index: 1;
    opacity: 0;
    transform: scale(var(--ui-tooltip-origin-scale, 0.88));
    transition:
      opacity 180ms ease-in,
      transform 180ms ease-in;
  }

  .ui-drawer-toggle__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ui-text-on-accent);
  }

  .ui-drawer-toggle__icon svg {
    width: 100%;
    height: 100%;
  }

  @media (hover: none) {
    .ui-drawer-toggle {
      opacity: 0.7;
      transform: scale(1);
    }
  }


  /* ============================================================
   * HEADER
   * ============================================================ */

  .ui-drawer__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--ui-space-3) var(--ui-space-4);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
    flex-shrink: 0;
  }

  .ui-drawer__title {
    font-size: var(--ui-font-m);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text-strong);
    margin: 0;
  }

  .ui-drawer__close {
    width: var(--ui-space-10);
    height: var(--ui-space-10);
    background: transparent;
    border: none;
    color: var(--ui-text-mute);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    margin: calc(-1 * var(--ui-space-2));
    transition: background var(--ui-motion-fast), color var(--ui-motion-fast);
  }

  .ui-drawer__close:hover {
    background: var(--ui-state-hover);
    color: var(--ui-text);
  }


  /* ============================================================
   * TABS (optional)
   * ============================================================ */

  .ui-drawer__tabs {
    display: flex;
    gap: var(--ui-space-1);
    padding: var(--ui-space-1) var(--ui-space-2);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
    flex-shrink: 0;
  }

  .ui-drawer__tab {
    flex: 1;
    min-height: var(--ui-space-10);
    padding: var(--ui-space-2);
    background: transparent;
    border: none;
    border-radius: var(--ui-radius-m);
    color: var(--ui-text-mute);
    font-size: var(--ui-font-s);
    cursor: pointer;
    transition: background var(--ui-motion-fast), color var(--ui-motion-fast);
  }

  .ui-drawer__tab:hover {
    background: var(--ui-state-hover);
    color: var(--ui-text);
  }

  .ui-drawer__tab.is-active {
    background: var(--ui-accent-faint);
    color: var(--ui-accent);
  }


  /* ============================================================
   * CONTENT
   * ============================================================ */

  .ui-drawer__content {
    flex: 1;
    overflow-y: auto;
    padding: var(--ui-space-4);
    scrollbar-width: none;
    -ms-overflow-style: none;
    scroll-behavior: smooth;
  }

  .ui-drawer__content::-webkit-scrollbar {
    display: none;
  }

  .ui-drawer__section {
    display: none;
  }

  .ui-drawer__section.is-active {
    display: block;
  }

  .ui-drawer__section h4 {
    font-size: var(--ui-font-s);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text-mute);
    text-transform: uppercase;
    letter-spacing: var(--ui-font-letter-spacing-m);
    margin: 0 0 var(--ui-space-3) 0;
  }

  .ui-drawer__section p {
    font-size: var(--ui-font-s);
    color: var(--ui-text-mute);
    margin: 0;
  }


  /* ============================================================
   * SETTINGS GROUPS & ROWS
   * ============================================================ */

  .ui-drawer__group {
    margin-bottom: var(--ui-space-5);
  }

  .ui-drawer__group:last-child {
    margin-bottom: 0;
  }

  .ui-drawer__group--bordered {
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
    padding-bottom: var(--ui-space-5);
  }

  .ui-drawer__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--ui-space-10);
    gap: var(--ui-space-3);
  }

  .ui-drawer__row + .ui-drawer__row {
    margin-top: var(--ui-space-2);
  }

  .ui-drawer__label {
    font-size: var(--ui-font-s);
    color: var(--ui-text);
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--ui-space-1);
  }

  .ui-drawer__value {
    font-size: var(--ui-font-s);
    color: var(--ui-text-mute);
    min-width: var(--ui-space-8);
    text-align: right;
  }


  /* ============================================================
   * INLINE INPUT (compact number input for settings rows)
   * ============================================================ */

  .ui-input--inline {
    width: calc(var(--ui-space-10) * 1.5);
    height: var(--ui-space-9);
    flex-shrink: 0;
  }

  .ui-input--inline .ui-input__pill {
    height: 100%;
    border-radius: var(--ui-radius-pill);
  }

  .ui-input--inline .ui-input__field {
    text-align: center;
    padding: 0 var(--ui-space-3);
    -moz-appearance: textfield;
  }

  .ui-input--inline .ui-input__field::-webkit-outer-spin-button,
  .ui-input--inline .ui-input__field::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }


  /* ============================================================
   * REDUCED MOTION
   * ============================================================ */

  @media (prefers-reduced-motion: reduce) {
    .ui-drawer.is-open {
      animation: none;
      transform: translateX(0);
    }
    .ui-drawer-toggle {
      animation: none !important;
      transition-duration: 0.01ms !important;
    }
  }
`);


// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Opens the drawer panel and shows the backdrop.
 * Cards should call _updateSettingsPanelUI() before this
 * to sync control values with current settings.
 */
export function openDrawer(shadowRoot) {
  const panel = shadowRoot.querySelector('.ui-drawer');
  const backdrop = shadowRoot.querySelector('.ui-drawer-backdrop');
  if (panel) panel.classList.add('is-open');
  if (backdrop) backdrop.classList.add('is-visible');
}

/**
 * Closes the drawer panel and hides the backdrop.
 */
export function closeDrawer(shadowRoot) {
  const panel = shadowRoot.querySelector('.ui-drawer');
  const backdrop = shadowRoot.querySelector('.ui-drawer-backdrop');
  if (panel) panel.classList.remove('is-open');
  if (backdrop) backdrop.classList.remove('is-visible');
}
