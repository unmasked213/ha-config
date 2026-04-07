// /config/www/base/components.js

// Shared UI Components Library v1.0
// Builds on top of foundation.js (tokens + primitives).
// Migrated to v1 token system with fixed state layers.

export const uiComponents = new CSSStyleSheet();

uiComponents.replaceSync(`

  /* ============================================================
   * COPY BUTTON
   * Extracted from prompt-manager.js with values converted to tokens
   * ============================================================ */

  .ui-copy-btn {
    background: none;
    border: none;
    width: var(--ui-space-10);
    height: var(--ui-space-10);
    border-radius: 50%;
    padding: 0;
    cursor: pointer;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ui-copy-btn-color);

    /* Stacking context isolation */
    isolation: isolate;

    /* Touch optimization */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;

    transition: color var(--ui-motion-med), background var(--ui-motion-slow), transform var(--ui-motion-slow), box-shadow var(--ui-motion-slow);
  }

  .ui-copy-btn::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--ui-accent-faint);
    opacity: 0;
    transition: opacity var(--ui-motion-fast), background var(--ui-motion-fast);
    pointer-events: none;
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-copy-btn:hover::before {
      opacity: 1;
    }
  }

  .ui-copy-btn:focus-visible {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }

  .ui-copy-btn svg {
    position: relative;
    z-index: 1;
    width: var(--ui-icon-s);
    height: var(--ui-icon-s);
    pointer-events: none;
  }

  .ui-copy-btn--copied {
    background: var(--ui-surface);
    color: var(--ui-success);
    transform: translateY(-1px);
    box-shadow: var(--ui-shadow-3), inset 0 0 0 2px currentColor;
    transition:
      color var(--ui-motion-slow),
      background var(--ui-motion-slow),
      transform var(--ui-motion-slow),
      box-shadow var(--ui-motion-slow);
  }

  /* Copy feedback pulse - uses extended duration for satisfying visual feedback */
  .ui-copy-btn--copied::after {
    --_copy-pulse-duration: 600ms; /* Intentionally longer than motion scale for emphasis */
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: var(--ui-space-3);
    height: var(--ui-space-3);
    background: radial-gradient(circle, rgba(var(--ui-success-rgb), .35) 0%, rgba(var(--ui-success-rgb), 0) 70%);
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(1);
    animation: ui-copy-pulse var(--_copy-pulse-duration) ease-out forwards;
    pointer-events: none;
  }

  @keyframes ui-copy-pulse {
    0% {
      opacity: .9;
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(14);
    }
  }


  /* ============================================================
   * ACTION BUTTONS - BASE (Material 3 Expressive)
   * Layer-based, borderless button system with state layers
   * ============================================================ */

  .ui-btn {
    --_ui-btn-height: var(--ui-space-9);
    --_ui-btn-radius: var(--ui-radius-pill);
    --_ui-btn-padding-x: var(--ui-space-5);

    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ui-space-2);

    height: var(--_ui-btn-height);
    padding: 0 var(--_ui-btn-padding-x);
    border-radius: var(--_ui-btn-radius);

    font-size: var(--ui-font-m);
    font-weight: 500;

    border: none;
    background: transparent;
    color: var(--ui-text);

    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    box-shadow: var(--ui-shadow-0);

    /* Text overflow protection */
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;

    /* Stacking context isolation */
    isolation: isolate;

    /* Touch optimization */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;

    transition:
      background var(--ui-motion-med),
      box-shadow var(--ui-motion-fast),
      color var(--ui-motion-med);
  }

  .ui-btn::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--ui-state-hover);
    opacity: 0;
    transition: opacity var(--ui-motion-fast), background var(--ui-motion-fast);
    pointer-events: none;
  }

  /* Desktop hover → hover layer + ring */
  @media (hover: hover) and (pointer: fine) {
    .ui-btn:hover:not(.ui-btn--disabled):not(:disabled)::before {
      opacity: 1;
    }

    .ui-btn:hover:not(.ui-btn--disabled):not(:disabled) {
      box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
    }
  }

  /* Active/pressed state → pressed layer + ring */
  .ui-btn:active:not(.ui-btn--disabled):not(:disabled)::before,
  .ui-btn.active:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  .ui-btn:active:not(.ui-btn--disabled):not(:disabled),
  .ui-btn.active:not(.ui-btn--disabled):not(:disabled) {
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }

  .ui-btn:focus-visible {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }

  /* Icon container */
  .ui-btn__icon {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }


  /* Default variant (no modifier): suppress ring — fill and ring are
     the same color, so the ring just makes the button look bloated. */
  @media (hover: hover) and (pointer: fine) {
    .ui-btn:not([class*="ui-btn--"]):hover:not(:disabled) {
      box-shadow: var(--ui-shadow-0);
    }
  }

  .ui-btn:not([class*="ui-btn--"]):active:not(:disabled),
  .ui-btn:not([class*="ui-btn--"]).active:not(:disabled) {
    box-shadow: var(--ui-shadow-0);
  }


  /* ============================================================
   * ACTION BUTTONS - ACCENT VARIANT
   * Borderless with accent color and state layers
   * ============================================================ */

  .ui-btn--accent::before {
    background: var(--ui-accent-faint);
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-btn--accent:hover:not(.ui-btn--disabled):not(:disabled)::before {
      opacity: 1;
    }
  }

  .ui-btn--accent:active:not(.ui-btn--disabled):not(:disabled)::before,
  .ui-btn--accent.active:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-accent-soft);
    opacity: 1;
  }

  /* Filled accent button */
  .ui-btn--accent.ui-btn--filled {
    background: var(--ui-accent);
    color: var(--ui-text-on-accent);
  }

  .ui-btn--accent.ui-btn--filled::before {
    background: var(--ui-state-hover);
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-btn--accent.ui-btn--filled:hover:not(.ui-btn--disabled):not(:disabled)::before {
      opacity: 1;
    }
  }

  .ui-btn--accent.ui-btn--filled:active:not(.ui-btn--disabled):not(:disabled)::before,
  .ui-btn--accent.ui-btn--filled.active:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }


  /* ============================================================
   * ACTION BUTTONS - DANGER VARIANT
   * Text-only and filled variants for destructive actions
   * ============================================================ */

  .ui-btn--danger {
    color: var(--ui-error);
  }

  .ui-btn--danger::before {
    background: var(--ui-error-faint);
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-btn--danger:hover:not(.ui-btn--disabled):not(:disabled)::before {
      opacity: 1;
    }
  }

  .ui-btn--danger:active:not(.ui-btn--disabled):not(:disabled)::before,
  .ui-btn--danger.active:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-error-soft);
    opacity: 1;
  }

  /* Filled danger button */
  .ui-btn--danger.ui-btn--filled {
    background: var(--ui-error);
    color: var(--ui-text-on-danger);
  }

  .ui-btn--danger.ui-btn--filled::before {
    background: var(--ui-state-hover);
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-btn--danger.ui-btn--filled:hover:not(.ui-btn--disabled):not(:disabled)::before {
      opacity: 1;
    }
  }

  .ui-btn--danger.ui-btn--filled:active:not(.ui-btn--disabled):not(:disabled)::before,
  .ui-btn--danger.ui-btn--filled.active:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }


  /* ============================================================
   * ACTION BUTTONS - MUTED VARIANT
   * Secondary actions with subtle elevated background
   * ============================================================ */

  .ui-btn--muted {
    background: var(--ui-elevated-2);
    color: var(--ui-text-mute);
  }

  .ui-btn--muted::before {
    background: var(--ui-state-hover);
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-btn--muted:hover:not(.ui-btn--disabled):not(:disabled)::before {
      opacity: 1;
    }

    .ui-btn--muted:hover:not(.ui-btn--disabled):not(:disabled) {
      color: var(--ui-text);
    }
  }

  .ui-btn--muted:active:not(.ui-btn--disabled):not(:disabled)::before,
  .ui-btn--muted.active:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  .ui-btn--muted:active:not(.ui-btn--disabled):not(:disabled),
  .ui-btn--muted.active:not(.ui-btn--disabled):not(:disabled) {
    color: var(--ui-text);
  }


  /* ============================================================
   * ACTION BUTTONS - OUTLINE VARIANT
   * Border-only style for secondary actions needing visual presence
   * Similar idle appearance to toggle buttons, but no selected state
   * ============================================================ */

  .ui-btn--outline {
    border: var(--ui-border-width-m) solid var(--ui-border-color-med);
    background: transparent;
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-btn--outline:hover:not(.ui-btn--disabled):not(:disabled)::before {
      opacity: 1;
    }

    .ui-btn--outline:hover:not(.ui-btn--disabled):not(:disabled) {
      border-color: var(--ui-border-color-strong);
    }
  }

  .ui-btn--outline:active:not(.ui-btn--disabled):not(:disabled)::before,
  .ui-btn--outline.active:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }


  /* ============================================================
   * ACTION BUTTONS - SIZE VARIANTS
   * ============================================================ */

  /* 32px height - intentionally below 48px touch target for desktop-only compact UI contexts */
  .ui-btn--small {
    --_ui-btn-height: var(--ui-space-8);
    --_ui-btn-padding-x: var(--ui-space-3);
    font-size: var(--ui-font-s);
  }

  .ui-btn--large {
    --_ui-btn-height: var(--ui-space-10);
    --_ui-btn-padding-x: var(--ui-space-6);
    font-size: var(--ui-font-l);
  }


  /* ============================================================
   * ACTION BUTTONS - ICON-ONLY VARIANT
   * Circular 40×40px button
   * ============================================================ */

  .ui-btn--icon {
    --_ui-btn-height: var(--ui-space-9);
    --_ui-btn-radius: 50%;
    width: var(--ui-space-9);
    padding: 0;
  }

  .ui-btn--icon.ui-btn--small {
    --_ui-btn-height: var(--ui-space-8);
    width: var(--ui-space-8);
  }

  .ui-btn--icon.ui-btn--large {
    --_ui-btn-height: var(--ui-space-10);
    width: var(--ui-space-10);
  }


  /* ============================================================
   * ACTION BUTTONS - DISABLED STATE
   * ============================================================ */

  .ui-btn--disabled,
  .ui-btn:disabled {
    cursor: not-allowed;
    pointer-events: none;
    opacity: var(--ui-state-disabled-opacity);
    box-shadow: none;
  }


  /* ============================================================
   * TOGGLE BUTTONS
   * Supports icon-only, text-only, and icon+text variants
   * Unselected state has subtle border, selected state has filled background
   * Similar visual logic to toggle switches
   * ============================================================ */

  .ui-btn--toggle {
    border: var(--ui-border-width-m) solid var(--ui-border-color-med);
    background: transparent;
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-btn--toggle:hover:not(.ui-btn--disabled):not(:disabled):not(.is-selected)::before {
      opacity: 1;
    }

    .ui-btn--toggle:hover:not(.ui-btn--disabled):not(:disabled):not(.is-selected) {
      border-color: var(--ui-border-color-strong);
    }
  }

  .ui-btn--toggle:active:not(.ui-btn--disabled):not(:disabled):not(.is-selected)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  /* Selected state - filled like switch track */
  .ui-btn--toggle.is-selected {
    background: var(--ui-accent);
    color: var(--ui-text-on-accent);
    border-color: transparent;
  }

  .ui-btn--toggle.is-selected::before {
    background: var(--ui-state-hover);
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-btn--toggle.is-selected:hover:not(.ui-btn--disabled):not(:disabled)::before {
      opacity: 1;
    }
  }

  .ui-btn--toggle.is-selected:active:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }


  /* ============================================================
   * SPLIT BUTTON (Material 3 Expressive)
   * Borderless with M3 curvature (outer 20px, seam 6px)
   *
   * Arrow icon: Use 16x16 filled caret, NOT stroked chevron:
   * <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
   *   <path d="M7 10l5 5 5-5z"/>
   * </svg>
   * ============================================================ */

  .ui-split {
    position: relative;
    display: inline-flex;
    align-items: stretch;
    gap: var(--ui-split-gap);
    height: var(--ui-split-height);
    border-radius: var(--ui-split-radius-outer);
    background: transparent;
    cursor: pointer;
    isolation: isolate;
  }

  .ui-split::after {
    content: "";
    position: absolute;
    inset: -8px;
    border-radius: calc(var(--ui-split-radius-outer) + 8px);
    background: transparent;
    pointer-events: none;
    z-index: -1;
  }

  .ui-split__main,
  .ui-split__arrow {
    position: relative;
    border: none;
    background: var(--ui-accent);
    color: var(--ui-text-on-accent);
    font-size: var(--ui-font-m);
    font-weight: 500;
    padding: 0 var(--ui-space-4);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ui-space-2);
    cursor: pointer;

    /* Touch optimization */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;

    transition:
      background var(--ui-motion-med);
  }

  /* Left segment - outer left radius 20px, inner right radius 3px */
  .ui-split__main {
    padding-left: var(--ui-space-5);
    padding-right: var(--ui-space-3);
    border-top-left-radius: var(--ui-split-radius-outer);
    border-bottom-left-radius: var(--ui-split-radius-outer);
    border-top-right-radius: var(--ui-split-radius-inner);
    border-bottom-right-radius: var(--ui-split-radius-inner);
  }

  /* Right segment - outer right radius 20px, inner left radius 3px */
  .ui-split__arrow {
    padding-left: var(--ui-space-3);
    padding-right: var(--ui-space-4);
    border-top-right-radius: var(--ui-split-radius-outer);
    border-bottom-right-radius: var(--ui-split-radius-outer);
    border-top-left-radius: var(--ui-split-radius-inner);
    border-bottom-left-radius: var(--ui-split-radius-inner);
  }

  .ui-split__arrow svg {
    position: relative;
    z-index: 1;
    pointer-events: none;
  }

  /* State layers using ::before pseudo-elements */
  .ui-split__main::before,
  .ui-split__arrow::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--ui-state-hover);
    opacity: 0;
    transition: opacity var(--ui-motion-fast), background var(--ui-motion-fast);
    pointer-events: none;
  }

  /* Hover state layers */
  @media (hover: hover) and (pointer: fine) {
    .ui-split__main:hover:not(:disabled)::before,
    .ui-split__arrow:hover:not(:disabled)::before {
      opacity: 1;
    }

    .ui-split:hover::after {
      background: var(--ui-state-hover);
    }
  }

  /* Pressed state layers */
  .ui-split__main:active:not(:disabled)::before,
  .ui-split__arrow:active:not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  .ui-split:active::after {
    background: var(--ui-state-pressed);
  }

  /* Open state */
  .ui-split--open .ui-split__arrow::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  /* Toggle variant - shows selected state like toggle buttons
     Each segment has its own complete border following its border-radius,
     gap exposes background between them */
  .ui-split--toggle .ui-split__main,
  .ui-split--toggle .ui-split__arrow {
    background: transparent;
    color: var(--ui-text);
    border: var(--ui-border-width-m) solid var(--ui-border-color-med);
  }

  .ui-split--toggle.is-selected .ui-split__main,
  .ui-split--toggle.is-selected .ui-split__arrow {
    background: var(--ui-accent);
    color: var(--ui-text-on-accent);
    border-color: transparent;
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-split--toggle:not(.is-selected) .ui-split__main:hover:not(:disabled),
    .ui-split--toggle:not(.is-selected) .ui-split__arrow:hover:not(:disabled) {
      border-color: var(--ui-border-color-strong);
    }
  }


  /* ============================================================
   * DROPDOWN MENU
   * Elevated menu with rounded items, used with split buttons
   * ============================================================ */

  .ui-menu {
    position: absolute;
    bottom: calc(100% + var(--ui-menu-offset));
    right: 0;
    min-width: var(--ui-menu-min-width);
    max-width: var(--ui-menu-max-width);
    max-height: var(--ui-menu-max-height);
    background: var(--ui-overlay-bg);
    border-radius: var(--ui-menu-radius);
    box-shadow: var(--ui-shadow-3);
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--ui-menu-padding-y) var(--ui-menu-padding-x);
    margin: 0;
    opacity: 0;
    pointer-events: none;

    /* Subtle scale + offset: menu feels like it materialises from the trigger */
    transform: translateY(4px) scale(0.95);
    transform-origin: var(--ui-menu-origin, top center);

    /* Exit transition — fast, no spring (users don't wait for things to disappear) */
    transition:
      opacity var(--ui-motion-fast) ease-in,
      transform var(--ui-motion-fast) ease-in;
    will-change: transform, opacity;
    z-index: var(--ui-z-menu);

    /* Stacking context isolation */
    isolation: isolate;

    /* Hide scrollbar but keep functionality */
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .ui-menu::-webkit-scrollbar {
    display: none;
  }

  .ui-menu--open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);

    /* Enter transition — opacity snaps in fast, transform uses spring for elastic settle */
    transition:
      opacity var(--ui-motion-fast),
      transform 280ms var(--ui-ease-spring);
  }

  .ui-menu__item {
    position: relative;
    width: 100%;
    height: var(--ui-menu-item-height);
    padding: 0 var(--ui-menu-item-padding-x);
    margin: 0;
    background: transparent;
    color: var(--ui-menu-item-color);
    border: none;
    display: flex;
    align-items: center;
    gap: var(--ui-space-2);
    text-align: left;
    font-size: var(--ui-menu-item-font-size);
    cursor: pointer;
    border-radius: var(--ui-menu-item-radius);
    -webkit-font-smoothing: antialiased;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    /* Touch optimization */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;

    transition:
      background-color var(--ui-motion-fast),
      color var(--ui-motion-fast);
  }

  .ui-menu__item::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--ui-menu-item-hover-bg);
    opacity: 0;
    transition: opacity var(--ui-motion-fast), background var(--ui-motion-fast);
    pointer-events: none;
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-menu__item:hover::before {
      opacity: 1;
    }
  }

  .ui-menu__item--selected {
    background: var(--ui-menu-item-selected-bg);
    color: var(--ui-menu-item-selected-color);
  }

  .ui-menu__item--selected::before {
    background: var(--ui-state-hover);
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-menu__item--selected:hover::before {
      opacity: 1;
    }
  }

  .ui-menu__item:focus-visible {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: -2px;
  }


  /* ============================================================
   * FAB (Floating Action Buttons)
   * Small (40px), Regular (56px), Extended (pill with icon+text)
   * Persistent elevation with M3 expressive behavior
   * ============================================================ */

  .ui-fab {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ui-space-2);

    border: none;
    background: var(--ui-accent);
    color: var(--ui-text-on-accent);

    cursor: pointer;
    user-select: none;
    white-space: nowrap;

    font-size: var(--ui-font-m);
    font-weight: 500;

    /* Stacking context isolation */
    isolation: isolate;

    /* Touch optimization */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;

    /* Transform optimization */
    will-change: transform, box-shadow;
    backface-visibility: hidden;

    transition:
      background var(--ui-motion-med),
      box-shadow var(--ui-motion-fast),
      transform var(--ui-motion-fast);
  }

  .ui-fab::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--ui-state-hover);
    opacity: 0;
    transition: opacity var(--ui-motion-fast), background var(--ui-motion-fast);
    pointer-events: none;
  }

  /* Small FAB - 40px circular */
  .ui-fab--small {
    width: var(--ui-space-9);
    height: var(--ui-space-9);
    border-radius: 50%;
    box-shadow: var(--ui-shadow-3);
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-fab--small:hover:not(:disabled)::before {
      opacity: 1;
    }

    .ui-fab--small:hover:not(:disabled) {
      box-shadow: var(--ui-shadow-4), 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
    }
  }

  .ui-fab--small:active:not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  .ui-fab--small:active:not(:disabled) {
    box-shadow: var(--ui-shadow-2), 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }

  /* Regular FAB - 56px circular (MD3 standard) */
  .ui-fab--regular {
    width: var(--ui-fab-size-regular);
    height: var(--ui-fab-size-regular);
    border-radius: 50%;
    box-shadow: var(--ui-shadow-3);
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-fab--regular:hover:not(:disabled)::before {
      opacity: 1;
    }

    .ui-fab--regular:hover:not(:disabled) {
      box-shadow: var(--ui-shadow-4), 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
    }
  }

  .ui-fab--regular:active:not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  .ui-fab--regular:active:not(:disabled) {
    box-shadow: var(--ui-shadow-2), 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }

  /* Extended FAB - 56px tall pill shape with icon + text */
  .ui-fab--extended {
    height: var(--ui-fab-size-regular);
    padding: 0 var(--ui-space-6);
    border-radius: var(--ui-space-7);
    box-shadow: var(--ui-shadow-3);
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-fab--extended:hover:not(:disabled)::before {
      opacity: 1;
    }

    .ui-fab--extended:hover:not(:disabled) {
      box-shadow: var(--ui-shadow-4), 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
    }
  }

  .ui-fab--extended:active:not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  .ui-fab--extended:active:not(:disabled) {
    box-shadow: var(--ui-shadow-2), 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }

  .ui-fab:disabled {
    cursor: not-allowed;
    pointer-events: none;
    opacity: var(--ui-state-disabled-opacity);
  }

  .ui-fab:focus-visible {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }


  /* ============================================================
   * FAB MENU
   * Expandable action menu triggered by FAB
   * Supports upward (--up) and downward (--down) expansion
   * ============================================================ */

  .ui-fab-menu {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-2);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--ui-motion-fast), transform var(--ui-motion-fast);
  }

  .ui-fab-menu .ui-btn {
    background: var(--ui-elevated-2);
    box-shadow: var(--ui-shadow-2);
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-fab-menu .ui-btn:hover:not(:disabled) {
      background: var(--ui-elevated-3);
      box-shadow: var(--ui-shadow-2), 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
    }
  }

  .ui-fab-menu .ui-btn:active:not(:disabled) {
    box-shadow: var(--ui-shadow-2), 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }

  .ui-fab-menu--up {
    bottom: calc(100% + var(--ui-space-3));
    left: 50%;
    transform: translateX(-50%) translateY(var(--ui-anim-translate));
  }

  .ui-fab-menu--down {
    top: calc(100% + var(--ui-space-3));
    left: 50%;
    transform: translateX(-50%) translateY(calc(-1 * var(--ui-anim-translate)));
  }

  .ui-fab-menu--open {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(-50%) translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-fab-menu {
      transition: opacity var(--ui-motion-fast);
    }
    .ui-fab-menu--up,
    .ui-fab-menu--down {
      transform: translateX(-50%) translateY(0);
    }
  }


  /* ============================================================
   * TOAST NOTIFICATIONS
   * Stacking notification toasts with optional protruding icon
   * Positioned bottom-right by default, supports hover-to-pause
   * ============================================================ */

  .ui-toast-container {
    position: fixed;
    bottom: var(--ui-toast-position-bottom);
    right: var(--ui-toast-position-right);
    z-index: var(--ui-toast-z-index);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--ui-toast-stack-gap);
    pointer-events: none;
  }

  .ui-toast {
    position: relative;
    background: var(--ui-toast-bg);
    color: var(--ui-toast-text);
    padding: var(--ui-toast-padding-y) var(--ui-toast-padding-x);
    border-radius: var(--ui-toast-radius);
    border: var(--ui-toast-border-width) solid var(--ui-toast-border-color);
    max-width: var(--ui-toast-max-width);
    box-shadow: var(--ui-shadow-3);
    font-size: var(--ui-font-m);
    line-height: 1.5;
    pointer-events: auto;
    animation: ui-toast-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .ui-toast--with-icon {
    padding-left: calc(var(--ui-toast-padding-x) + var(--ui-toast-icon-protrusion) + var(--ui-space-2));
  }

  .ui-toast__icon {
    position: absolute;
    left: calc(-1 * var(--ui-toast-icon-protrusion));
    top: calc(-1 * var(--ui-toast-icon-protrusion));
    width: var(--ui-toast-icon-size);
    height: var(--ui-toast-icon-size);
    background: var(--ui-toast-icon-bg);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--ui-shadow-2);
    pointer-events: none;
  }

  .ui-toast__icon ha-icon {
    color: var(--ui-toast-icon-color);
    --mdc-icon-size: calc(var(--ui-toast-icon-size) * 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ui-toast__close {
    position: absolute;
    top: var(--ui-toast-close-offset);
    right: var(--ui-toast-close-offset);
    width: var(--ui-toast-close-size);
    height: var(--ui-toast-close-size);
    border-radius: 50%;
    background: var(--ui-toast-close-bg);
    color: var(--ui-toast-close-color);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--ui-font-s);
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--ui-motion-fast), background var(--ui-motion-fast);
    pointer-events: auto;
    box-shadow: var(--ui-shadow-2);
  }

  .ui-toast:hover .ui-toast__close {
    opacity: 1;
  }

  .ui-toast__close:hover {
    background: var(--ui-toast-close-bg-hover);
  }

  .ui-toast__actions {
    position: absolute;
    top: var(--ui-toast-close-offset);
    right: var(--ui-toast-close-offset);
    display: flex;
    gap: var(--ui-space-1);
    opacity: 0;
    transition: opacity var(--ui-motion-fast);
    pointer-events: auto;
  }

  .ui-toast:hover .ui-toast__actions {
    opacity: 1;
  }

  .ui-toast__actions .ui-toast__close {
    position: static;
    opacity: 1;
  }

  .ui-toast--exiting {
    animation: ui-toast-out var(--ui-toast-duration-out) cubic-bezier(0.5, 0, 1, 1) forwards;
  }

  @keyframes ui-toast-in {
    0% {
      transform: translateY(10px) scaleX(0.6);
      opacity: 0;
    }
    100% {
      transform: translateY(0) scaleX(1);
      opacity: 1;
    }
  }

  @keyframes ui-toast-out {
    0% {
      opacity: 1;
      transform: translateX(0);
    }
    100% {
      opacity: 0;
      transform: translateX(10px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-toast {
      animation: ui-toast-fade-in var(--ui-toast-duration-in) ease-out forwards;
    }
    .ui-toast--exiting {
      animation: ui-toast-fade-out var(--ui-toast-duration-out) ease-out forwards;
    }
    @keyframes ui-toast-fade-in {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes ui-toast-fade-out {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
  }


  /* ============================================================
   * LOADING SPINNER
   * Pink animated 3-dot loading indicator (svg-spinners:3-dots-move)
   * ============================================================ */

  .ui-spinner {
    color: var(--ui-spinner-color);
  }


  /* ============================================================
   * INPUT FIELD
   * Pill-shaped text input with floating label (WhatsApp style)
   * ============================================================ */

  .ui-input {
    position: relative;
    width: 100%;
    height: var(--ui-input-height);
  }

  .ui-input__pill {
    position: relative;
    width: 100%;
    height: var(--ui-input-height);
    border-radius: var(--ui-input-height);
    border: var(--ui-border-width-l) solid transparent;
    background: var(--ui-input-bg);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    overflow: visible;

    /* Stacking context isolation */
    isolation: isolate;

    transition: border-color var(--ui-motion-med);
  }

  .ui-input__pill:focus-within {
    border-color: var(--ui-accent);
  }

  .ui-input__label {
    position: absolute;
    left: var(--ui-input-padding-x);
    top: 50%;
    transform: translateY(-50%);
    transform-origin: left center;
    background: transparent;
    font-size: var(--ui-font-m);
    font-weight: 400;
    line-height: 1.5;
    color: var(--ui-text-mute);
    pointer-events: none;
    white-space: nowrap;
    z-index: 1;
    transition:
      transform var(--ui-motion-med),
      color var(--ui-motion-med);
    -webkit-font-smoothing: antialiased;
  }

  /* Elevated state - label moves above input and shrinks */
  .ui-input__pill.has-value .ui-input__label,
  .ui-input__pill:focus-within .ui-input__label {
    transform: translateY(calc(-1 * var(--ui-input-label-offset, 37px))) scale(0.75);
    color: var(--ui-text);
  }

  .ui-input__field {
    position: relative;
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: var(--ui-input-padding-y) var(--ui-input-padding-x);
    font-size: var(--ui-font-m);
    font-weight: 400;
    color: var(--ui-text);
    -webkit-font-smoothing: antialiased;
    z-index: 1;
  }

  .ui-input__field::placeholder {
    color: transparent;
  }


  /* ── Clearable Variant ──────────────────────────────────────────────────── */

  .ui-input--clearable .ui-input__pill {
    padding-right: var(--ui-space-10);
  }

  .ui-input__clear {
    position: absolute;
    right: var(--ui-space-1);
    top: 50%;
    transform: translateY(-50%) scale(0);
    width: var(--ui-space-10);
    height: var(--ui-space-10);
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 50%;
    color: var(--ui-error-soft);
    cursor: pointer;
    z-index: 2;
    opacity: 0;
    pointer-events: none;
    transition: color var(--ui-motion-med), transform var(--ui-motion-med);
  }

  @keyframes ui-input-clear-pop {
    0%   { transform: translateY(-50%) scale(0); opacity: 0; }
    40%  { transform: translateY(-50%) scale(1.35); opacity: 1; }
    65%  { transform: translateY(-50%) scale(0.85); opacity: 1; }
    82%  { transform: translateY(-50%) scale(1.1); opacity: 1; }
    100% { transform: translateY(-50%) scale(1); opacity: 1; }
  }

  .ui-input__pill.has-value .ui-input__clear {
    transform: translateY(-50%) scale(1);
    opacity: 1;
    pointer-events: auto;
    animation: ui-input-clear-pop 400ms var(--ui-ease-spring-heavy);
  }

  /* Error color when field is focused or button is hovered */
  .ui-input__pill:focus-within .ui-input__clear,
  .ui-input__pill.has-value .ui-input__clear:hover {
    color: var(--ui-error);
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-input__pill.has-value .ui-input__clear:hover {
      transform: translateY(-50%) scale(1.15);
    }
  }

  /* Brief pink pulse on clear */
  .ui-input__pill.ui-input--clearing {
    border-color: var(--ui-pink) !important;
    transition: none !important;
  }

  .ui-input__pill.ui-input--clearing-fade {
    border-color: var(--ui-accent) !important;
    transition: border-color 500ms ease-out !important;
  }

  .ui-input__clear:focus-visible {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: -2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-input__pill.has-value .ui-input__clear {
      animation: none;
    }
  }


  /* ============================================================
   * INPUT FIELD - QUIET VARIANT
   * Label acts as placeholder only — visible when empty, hidden
   * when populated. No floating animation, just fade out.
   * ============================================================ */

  .ui-input--quiet .ui-input__pill.has-value .ui-input__label {
    opacity: 0;
    transform: none;
    pointer-events: none;
    transition: opacity var(--ui-motion-fast);
  }

  .ui-input--quiet .ui-input__pill:focus-within .ui-input__label {
    opacity: 0;
    transform: none;
  }


  /* ============================================================
   * INPUT FIELD - TEXTAREA VARIANT
   * Multi-line input using <textarea> inside the .ui-input structure.
   * Label starts at top-left (not vertically centred) and elevates
   * above the pill on focus / has-value, matching single-line behaviour.
   * ============================================================ */

  .ui-input--textarea {
    position: relative;
    height: auto;
    min-height: 70px;
  }

  .ui-input--textarea .ui-input__pill {
    height: auto;
    min-height: 70px;
    border-radius: var(--ui-radius-l);
    align-items: flex-start;
  }

  .ui-input--textarea .ui-input__field {
    min-height: 50px;
    padding: var(--ui-space-6) var(--ui-space-4) var(--ui-space-3);
    resize: vertical;
    font-family: inherit;
    line-height: var(--ui-font-line-height-m);
    scrollbar-width: none;
  }

  .ui-input--textarea .ui-input__field::-webkit-scrollbar {
    display: none;
  }

  .ui-input--textarea .ui-input__field::-webkit-resizer {
    background: transparent;
  }

  .ui-input--textarea .ui-input__label {
    top: var(--ui-space-3);
    transform: translateY(0);
  }

  .ui-input--textarea .ui-input__pill.has-value .ui-input__label,
  .ui-input--textarea .ui-input__pill:focus-within .ui-input__label {
    transform: translateY(-34px) scale(0.75);
  }

  .ui-input--textarea .ui-input__pill.has-value:not(:focus-within) .ui-input__label {
    color: var(--ui-text-mute);
  }

  .ui-input--textarea .ui-input__pill:focus-within .ui-input__label {
    color: var(--ui-text);
  }


  /* ============================================================
   * INPUT FIELD - TEXTAREA LARGE VARIANT
   * Taller minimum height for longer-form content.
   * Compose with --textarea: class="ui-input ui-input--textarea ui-input--textarea-lg"
   * ============================================================ */

  .ui-input--textarea-lg {
    min-height: 130px;
  }

  .ui-input--textarea-lg .ui-input__pill {
    min-height: 130px;
  }

  .ui-input--textarea-lg .ui-input__field {
    min-height: 110px;
  }


  /* ============================================================
   * HORIZONTAL SLIDER
   * Material 3 Expressive style with carved-out thumb geometry
   * ============================================================ */

  .ui-slider {
    position: relative;
    width: 100%;
    height: var(--ui-slider-container-height);
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    /* Widen thumb gap to match split button visual weight */
    --ui-slider-gap-rest: 5px;
  }

  .ui-slider__container {
    position: relative;
    width: 100%;
    height: var(--ui-slider-track-height);
    display: flex;
    align-items: center;
  }

  /* Active track (left side) */
  .ui-slider__track-active {
    position: absolute;
    left: 0;
    height: var(--ui-slider-track-height);
    background: var(--ui-accent);
    border-radius: var(--ui-slider-track-radius);
    /* Width and border-radius will be controlled by JS */
    transition:
      width var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      border-top-right-radius var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      border-bottom-right-radius var(--ui-slider-motion-duration) var(--ui-slider-motion-easing);
  }

  /* Inactive track (right side) */
  .ui-slider__track-inactive {
    position: absolute;
    right: 0;
    height: var(--ui-slider-track-height);
    background: var(--ui-surface-alt-2);
    border-radius: var(--ui-slider-track-radius);
    /* Width and border-radius will be controlled by JS */
    transition:
      width var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      border-top-left-radius var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      border-bottom-left-radius var(--ui-slider-motion-duration) var(--ui-slider-motion-easing);
  }

  /* Thumb */
  .ui-slider__thumb {
    position: absolute;
    height: var(--ui-slider-thumb-height);
    width: var(--ui-slider-thumb-width-rest);
    background: var(--ui-accent);
    border-radius: var(--ui-slider-thumb-radius);
    top: 50%;
    transform: translate(-50%, -50%);
    /* Left position will be controlled by JS */
    transition:
      width var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      left var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      background-color var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      box-shadow var(--ui-motion-fast);
    pointer-events: none;
  }

  /* Hover state - ring on thumb */
  @media (hover: hover) and (pointer: fine) {
    .ui-slider:hover .ui-slider__thumb {
      box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
    }
  }

  /* Pressed state - thumb shrinks and changes colour */
  .ui-slider--pressed .ui-slider__thumb {
    width: var(--ui-slider-thumb-width-pressed);
    background: var(--ui-slider-rollback);
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }

  /* Rollback indicator - thin line showing backwards drag distance */
  .ui-slider__rollback {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: var(--ui-border-width-l);
    background: var(--ui-slider-rollback);
    border-radius: var(--ui-border-width-l);
    pointer-events: none;
    opacity: 0;
  }

  /* Rollback dot - marks the drag start point */
  .ui-slider__rollback::after {
    content: "";
    position: absolute;
    right: 0;
    top: 50%;
    transform: translate(50%, -50%);
    width: var(--ui-space-2);
    height: var(--ui-space-2);
    background: var(--ui-slider-rollback);
    border-radius: 50%;
  }

  .ui-slider--rolling-back .ui-slider__rollback {
    opacity: 1;
  }

  /* Value bubble */
  .ui-slider__value {
    position: absolute;
    bottom: calc(100% + var(--ui-slider-value-offset-y));
    left: 50%;
    transform: translate(-50%, var(--ui-slider-value-offset-x));
    background: var(--ui-elevated-3);
    color: var(--ui-text);
    width: var(--ui-slider-value-size);
    height: var(--ui-slider-value-size);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: var(--ui-font-s);
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    box-shadow: var(--ui-shadow-1);
    transition:
      opacity var(--ui-motion-slow),
      transform var(--ui-motion-slow);
  }

  .ui-slider--pressed .ui-slider__value {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  /* Hidden native input for accessibility */
  .ui-slider__input {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 10;
    margin: 0;
  }

  .ui-slider__input::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: var(--ui-slider-container-height);
    height: var(--ui-slider-container-height);
    cursor: pointer;
  }

  .ui-slider__input::-moz-range-thumb {
    width: var(--ui-slider-container-height);
    height: var(--ui-slider-container-height);
    cursor: pointer;
    border: none;
    background: transparent;
  }


  /* Focus visible - ring on thumb when input is keyboard-focused */
  .ui-slider__container:has(.ui-slider__input:focus-visible) .ui-slider__thumb {
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-focus-ring);
  }


  /* ============================================================
   * VERTICAL SLIDER VARIANT
   * ============================================================ */

  .ui-slider--vertical {
    width: var(--ui-slider-container-height);
    height: var(--ui-slider-vertical-height);
    flex-direction: column;
  }

  .ui-slider--vertical .ui-slider__container {
    width: var(--ui-slider-track-height);
    height: 100%;
  }

  /* Vertical active track (bottom side) */
  .ui-slider--vertical .ui-slider__track-active {
    left: auto;
    bottom: 0;
    width: var(--ui-slider-track-height);
    height: auto;
    /* Height and border-radius will be controlled by JS */
    transition:
      height var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      border-top-left-radius var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      border-top-right-radius var(--ui-slider-motion-duration) var(--ui-slider-motion-easing);
  }

  /* Vertical inactive track (top side) */
  .ui-slider--vertical .ui-slider__track-inactive {
    right: auto;
    top: 0;
    width: var(--ui-slider-track-height);
    height: auto;
    /* Height and border-radius will be controlled by JS */
    transition:
      height var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      border-bottom-left-radius var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      border-bottom-right-radius var(--ui-slider-motion-duration) var(--ui-slider-motion-easing);
  }

  /* Vertical thumb - HORIZONTAL orientation (rotated 90 degrees from regular) */
  .ui-slider--vertical .ui-slider__thumb {
    left: 50%;
    top: auto;
    width: var(--ui-slider-thumb-height);
    height: var(--ui-slider-thumb-width-rest);
    transform: translate(-50%, 50%);
    /* Bottom position will be controlled by JS */
    transition:
      height var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      bottom var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      background-color var(--ui-slider-motion-duration) var(--ui-slider-motion-easing),
      box-shadow var(--ui-motion-fast);
  }

  /* Vertical pressed state - thumb shrinks in height instead of width */
  .ui-slider--vertical.ui-slider--pressed .ui-slider__thumb {
    height: var(--ui-slider-thumb-width-pressed);
    background: var(--ui-slider-rollback);
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }

  /* Vertical value bubble */
  .ui-slider--vertical .ui-slider__value {
    bottom: auto;
    left: calc(100% + var(--ui-slider-value-offset-y));
    top: 50%;
    transform: translate(var(--ui-slider-value-offset-x), -50%);
  }

  .ui-slider--vertical.ui-slider--pressed .ui-slider__value {
    transform: translate(0, -50%);
  }


  /* ============================================================
   * SLIDER STATE VARIANTS (LEGACY COMPATIBILITY)
   * ============================================================ */

  /* Legacy used state - for backwards compatibility with old code */
  .ui-slider--used .ui-slider__track-active {
    background: var(--ui-accent);
  }


  /* ============================================================
   * CIRCULAR SLIDER
   * Radial slider with SVG progress ring
   * ============================================================ */

  .ui-circle-slider {
    position: relative;
    width: var(--ui-circle-size, 90px);
    height: var(--ui-circle-size, 90px);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: grab;
    user-select: none;
    touch-action: none; /* Prevent scroll interference during drag */
    isolation: isolate; /* Explicit stacking context for iOS Safari */
  }

  /* State overlay — uses pre-composed state tokens for theme adaptation */
  .ui-circle-slider::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: transparent;
    transition: background var(--ui-motion-fast);
    pointer-events: none;
    z-index: 2;
  }

  .ui-circle-slider:hover::before {
    background: var(--ui-state-hover);
  }

  .ui-circle-slider:active::before,
  .ui-circle-slider--dragging::before {
    background: var(--ui-state-pressed);
  }

  .ui-circle-slider:focus-visible {
    outline: 2px solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }

  .ui-circle-slider--dragging {
    cursor: grabbing;
  }

  .ui-circle-slider--disabled {
    cursor: not-allowed;
    opacity: var(--ui-state-disabled-opacity);
    pointer-events: none;
  }

  .ui-circle-slider__svg {
    position: absolute;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
    overflow: visible;
  }

  .ui-circle-slider__track {
    fill: none;
    stroke: transparent;
    stroke-width: var(--ui-circle-stroke-width, 3px);
    stroke-linecap: round;
  }

  .ui-circle-slider__background {
    fill: var(--ui-surface-alt-2);
  }

  .ui-circle-slider__fill {
    fill: none;
    stroke: var(--ui-circle-fill, var(--ui-accent));
    stroke-width: var(--ui-circle-stroke-width, 3px);
    stroke-linecap: round;
    transition:
      stroke-dashoffset var(--ui-motion-fast),
      stroke-width var(--ui-circle-slider-bounce),
      stroke var(--ui-motion-fast);
  }

  /* Wider stroke while dragging for visual feedback */
  .ui-circle-slider--dragging .ui-circle-slider__fill {
    stroke-width: calc(var(--ui-circle-stroke-width, 3px) + var(--ui-border-width-s));
  }

  .ui-circle-slider__rollback {
    fill: none;
    stroke: var(--ui-slider-rollback);
    stroke-width: calc(var(--ui-circle-stroke-width, 3px) - var(--ui-border-width-s));
    stroke-linecap: round;
    opacity: 0;
    transition: opacity var(--ui-motion-fast);
  }

  .ui-circle-slider__rollback.visible {
    opacity: 1;
  }

  .ui-circle-slider__value {
    position: relative;
    display: flex;
    align-items: baseline;
    font-size: var(--ui-font-l);
    font-weight: var(--ui-font-weight-m);
    color: var(--ui-text);
    pointer-events: none;
    z-index: 1;
    -webkit-transform: translateZ(0); /* Force compositing layer on iOS Safari */
    letter-spacing: var(--ui-font-letter-spacing-l);
  }

  .ui-circle-slider__value-number {
    font-size: var(--ui-font-l);
  }

  .ui-circle-slider__unit {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
    font-weight: var(--ui-font-weight-m);
    margin-left: var(--ui-space-1);
  }

  /* ----------------------------------------------------------------
   * HIDDEN INPUT FOR ACCESSIBILITY
   *
   * The native range input is hidden and receives no pointer events.
   * All interaction is handled via custom pointer events on the
   * container. The input exists only for accessibility (screen readers,
   * form submission).
   * ---------------------------------------------------------------- */

  .ui-circle-slider__input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  .ui-circle-slider.active {
    transform: scale(1.05);
    transition: transform var(--ui-motion-fast);
  }

  /* Wobble animation on tap (light mode only) */
  @keyframes ui-circle-slider-wobble {
    0% { transform: scale(1); }
    35% { transform: scale(1.05); }
    65% { transform: scale(0.98); }
    100% { transform: scale(1); }
  }

  .ui-circle-slider--wobble {
    animation: ui-circle-slider-wobble var(--ui-circle-slider-bounce);
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-circle-slider__fill {
      transition: none;
    }
    .ui-circle-slider__rollback {
      transition: none;
    }
    .ui-circle-slider::before {
      transition: none;
    }
    .ui-circle-slider--wobble {
      animation: none;
    }
    .ui-circle-slider.active {
      transition: none;
    }
  }


  /* ============================================================
   * LOADING ICON
   * svg-spinners:3-dots-move animated loading indicator
   * Respects currentColor for automatic theming
   * ============================================================ */

  .ui-icon-loading {
    display: inline-block;
    width: var(--ui-icon-l);
    height: var(--ui-icon-l);
    --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='4' cy='12' r='0' fill='%23000'%3E%3Canimate fill='freeze' attributeName='r' begin='0;SVGUppsBdVN.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='0;3'/%3E%3Canimate fill='freeze' attributeName='cx' begin='SVGqCgsydxJ.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='4;12'/%3E%3Canimate fill='freeze' attributeName='cx' begin='SVG3PwDNd6F.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='12;20'/%3E%3Canimate id='SVG3V8yEdYE' fill='freeze' attributeName='r' begin='SVG6wCQhd9Q.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='3;0'/%3E%3Canimate id='SVGUppsBdVN' fill='freeze' attributeName='cx' begin='SVG3V8yEdYE.end' dur='0.001s' values='20;4'/%3E%3C/circle%3E%3Ccircle cx='4' cy='12' r='3' fill='%23000'%3E%3Canimate fill='freeze' attributeName='cx' begin='0;SVGUppsBdVN.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='4;12'/%3E%3Canimate fill='freeze' attributeName='cx' begin='SVGqCgsydxJ.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='12;20'/%3E%3Canimate id='SVG4PgJdbds' fill='freeze' attributeName='r' begin='SVG3PwDNd6F.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='3;0'/%3E%3Canimate id='SVG6wCQhd9Q' fill='freeze' attributeName='cx' begin='SVG4PgJdbds.end' dur='0.001s' values='20;4'/%3E%3Canimate fill='freeze' attributeName='r' begin='SVG6wCQhd9Q.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='0;3'/%3E%3C/circle%3E%3Ccircle cx='12' cy='12' r='3' fill='%23000'%3E%3Canimate fill='freeze' attributeName='cx' begin='0;SVGUppsBdVN.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='12;20'/%3E%3Canimate id='SVG38aCdcdI' fill='freeze' attributeName='r' begin='SVGqCgsydxJ.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='3;0'/%3E%3Canimate id='SVG3PwDNd6F' fill='freeze' attributeName='cx' begin='SVG38aCdcdI.end' dur='0.001s' values='20;4'/%3E%3Canimate fill='freeze' attributeName='r' begin='SVG3PwDNd6F.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='0;3'/%3E%3Canimate fill='freeze' attributeName='cx' begin='SVG6wCQhd9Q.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='4;12'/%3E%3C/circle%3E%3Ccircle cx='20' cy='12' r='3' fill='%23000'%3E%3Canimate id='SVGwaWzveSq' fill='freeze' attributeName='r' begin='0;SVGUppsBdVN.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='3;0'/%3E%3Canimate id='SVGqCgsydxJ' fill='freeze' attributeName='cx' begin='SVGwaWzveSq.end' dur='0.001s' values='20;4'/%3E%3Canimate fill='freeze' attributeName='r' begin='SVGqCgsydxJ.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='0;3'/%3E%3Canimate fill='freeze' attributeName='cx' begin='SVG3PwDNd6F.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='4;12'/%3E%3Canimate fill='freeze' attributeName='cx' begin='SVG6wCQhd9Q.end' calcMode='spline' dur='0.5s' keySplines='.36,.6,.31,1' values='12;20'/%3E%3C/circle%3E%3C/svg%3E");
    background-color: currentColor;
    -webkit-mask-image: var(--svg);
    mask-image: var(--svg);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
  }


  /* ============================================================
   * COLLAPSIBLE SECTION COMPONENT
   * Clickable header that toggles visibility of content
   * ============================================================ */

  .ui-collapsible-section {
    margin-bottom: var(--ui-space-6);
  }

  /* Header (Button) */
  .ui-collapsible-section__header {
    /* Reset button styles */
    width: 100%;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;

    /* Layout */
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--ui-space-2) 0;

    /* Touch target */
    min-height: var(--ui-space-10);

    /* Typography */
    font-weight: var(--ui-font-weight-l);
    font-size: var(--ui-font-s);
    text-transform: uppercase;
    letter-spacing: var(--ui-font-letter-spacing-m);
    text-align: left;

    /* Interaction */
    user-select: none;
    transition: background-color var(--ui-motion-med);
    border-radius: var(--ui-radius-s);

    /* Touch optimization */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-collapsible-section__header:hover {
      background-color: var(--ui-state-hover);
    }
  }

  .ui-collapsible-section__header:focus-visible {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }

  /* Title */
  .ui-collapsible-section__title {
    padding-left: var(--ui-space-6);
    flex: 1;
  }

  /* Arrow Indicator (CSS-only) */
  .ui-collapsible-section__arrow {
    width: var(--ui-space-2);
    height: var(--ui-space-2);
    margin-right: var(--ui-space-4);
    border-right: var(--ui-border-width-s) solid var(--ui-border-color-strong);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-strong);
    transform: rotate(45deg);
    transform-origin: center;
    transition: transform var(--ui-motion-med);
    opacity: 0.9;
  }

  .ui-collapsible-section--collapsed .ui-collapsible-section__arrow {
    transform: rotate(-45deg);
  }

  /* Content Wrapper */
  .ui-collapsible-section__content {
    overflow: hidden;
    transition: 
      height var(--ui-motion-med),
      padding var(--ui-motion-med),
      margin var(--ui-motion-med);
    background: var(--ui-elevated-0);
    border-radius: var(--ui-radius-s);
    padding: var(--ui-space-2) var(--ui-space-3);
    margin-top: var(--ui-space-2);
  }

  .ui-collapsible-section--collapsed .ui-collapsible-section__content {
    height: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
  }

  /* Drawer variant — darker content wells for use inside drawers */
  .ui-collapsible-section--drawer .ui-collapsible-section__content {
    background: var(--ui-input-bg);
  }


  /* ============================================================
   * SCROLLABLE CONTAINER PATTERN
   * Standardized scrollbar styling for overflow containers
   * ============================================================ */

  .ui-scrollable {
    overflow: auto;
    scrollbar-width: thin; /* Firefox */
    scrollbar-color: var(--ui-scrollbar-thumb) transparent;
    scroll-behavior: smooth;
  }

  /* Webkit scrollbar styling (Chrome, Safari, Edge) */
  .ui-scrollable::-webkit-scrollbar {
    width: var(--ui-space-2);
    height: var(--ui-space-2);
  }

  .ui-scrollable::-webkit-scrollbar-track {
    background: transparent;
    border-radius: var(--ui-radius-s);
    margin-top: var(--ui-space-2);
    margin-bottom: var(--ui-space-2);
  }

  .ui-scrollable::-webkit-scrollbar-thumb {
    background: var(--ui-scrollbar-thumb);
    border-radius: var(--ui-radius-s);
    border: var(--ui-border-width-m) solid transparent;
    background-clip: content-box;
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-scrollable::-webkit-scrollbar-thumb:hover {
      background: var(--ui-scrollbar-thumb-hover);
    }
  }

  .ui-scrollable::-webkit-scrollbar-button {
    display: none;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .ui-scrollable {
      scroll-behavior: auto;
    }
  }

  /* Variant: Vertical only */
  .ui-scrollable--vertical {
    overflow-x: hidden;
    overflow-y: auto;
  }

  /* Variant: Horizontal only */
  .ui-scrollable--horizontal {
    overflow-x: auto;
    overflow-y: hidden;
  }

  /* Variant: Hidden scrollbar (still functional) */
  .ui-scrollable--hidden {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }

  .ui-scrollable--hidden::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  /* Variant: Compact scrollbar (thinner) */
  .ui-scrollable--compact::-webkit-scrollbar {
    width: var(--ui-space-1);
    height: var(--ui-space-1);
  }

  .ui-scrollable--compact::-webkit-scrollbar-thumb {
    background: var(--ui-scrollbar-thumb);
    border-radius: var(--ui-radius-s);
    border: var(--ui-border-width-s) solid transparent;
    background-clip: content-box;
  }

  /* Scrollbar corner */
  .ui-scrollable::-webkit-scrollbar-corner {
    background: transparent;
  }


  /* ============================================================
   * TAB BAR COMPONENT
   * Horizontal tab navigation with contained pill style
   * ============================================================ */

  .ui-tab-bar {
    display: flex;
    gap: var(--ui-space-1);
    padding: var(--ui-space-1);
    background: var(--ui-elevated-0);
    border-radius: var(--ui-radius-m);
  }

  .ui-tab-bar__tab {
    /* Reset button styles */
    background: transparent;
    border: none;
    cursor: pointer;

    /* Layout */
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--ui-space-2) var(--ui-space-3);
    border-radius: var(--ui-radius-s);

    /* Typography */
    font-size: var(--ui-font-s);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text-mute);

    /* Interaction */
    transition:
      background var(--ui-motion-fast),
      color var(--ui-motion-fast);

    /* Touch optimization */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    min-height: var(--ui-space-10);
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-tab-bar__tab:hover:not(.ui-tab-bar__tab--active):not(:disabled) {
      background: var(--ui-state-hover);
      color: var(--ui-text);
    }
  }

  .ui-tab-bar__tab:focus-visible {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: -2px;
  }

  .ui-tab-bar__tab--active {
    background: var(--ui-elevated-2);
    color: var(--ui-text);
  }

  .ui-tab-bar__tab:disabled {
    cursor: not-allowed;
    opacity: var(--ui-state-disabled-opacity);
  }


  /* ── Tab Bar Variant: Pill ─────────────────────────────────────────────── */
  /* No container chrome, content-sized tabs, wrapping layout               */

  .ui-tab-bar--pill {
    background: transparent;
    padding: 0;
    border-radius: 0;
    flex-wrap: wrap;
    row-gap: var(--ui-space-1);
  }

  .ui-tab-bar--pill .ui-tab-bar__tab {
    flex: none;
    min-height: var(--ui-space-10);
    border-radius: var(--ui-radius-m);
    font-weight: var(--ui-font-weight-m);
  }


  /* ── Tab Bar Variant: Colored ──────────────────────────────────────────── */
  /* Per-tab colour via --_tab-color / --_tab-color-faint inline properties */

  .ui-tab-bar--colored .ui-tab-bar__tab--active {
    background: var(--_tab-color-faint, var(--ui-accent-faint));
    color: var(--_tab-color, var(--ui-accent));
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-tab-bar--colored .ui-tab-bar__tab:hover:not(.ui-tab-bar__tab--active):not(:disabled) {
      background: var(--ui-state-hover);
      color: var(--ui-text);
    }
  }


  /* ============================================================
   * SECTION HEADER COMPONENT
   * Plain uppercase label for grouping content
   * ============================================================ */

  .ui-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--ui-space-3) 0;
    margin-bottom: var(--ui-space-2);
  }

  .ui-section-header__title {
    font-size: var(--ui-section-header-title-size);
    font-weight: var(--ui-font-weight-l);
    text-transform: uppercase;
    letter-spacing: var(--ui-font-letter-spacing-m);
    color: var(--ui-text-mute);
    margin: 0;
  }

  .ui-section-header__actions {
    display: flex;
    gap: var(--ui-space-2);
    align-items: center;
  }

  /* Variant: With bottom border */
  .ui-section-header--bordered {
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
    padding-bottom: var(--ui-space-3);
  }

  /* Variant: Compact (less vertical space) */
  .ui-section-header--compact {
    padding: var(--ui-space-2) 0;
    margin-bottom: var(--ui-space-1);
  }


  /* ============================================================
   * DATA ROW COMPONENT
   * Label-value pairs for specs displays and configuration panels
   * ============================================================ */

  .ui-data-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--ui-space-4);
    padding: var(--ui-space-2) 0;
    font-size: var(--ui-font-s);
    line-height: 1.5;
  }

  .ui-data-row__label {
    color: var(--ui-text-mute);
    flex-shrink: 0;
    min-width: 120px; /* Intentional: layout constraint for label alignment, not from spacing scale */
    font-weight: 500;
  }

  .ui-data-row__value {
    color: var(--ui-text);
    text-align: right;
    word-break: break-word;
    flex: 1;
  }

  /* Variant: Compact (smaller spacing) */
  .ui-data-row--compact {
    padding: var(--ui-space-1) 0;
    gap: var(--ui-space-1);
  }

  .ui-data-row--compact .ui-data-row__label {
    min-width: 100px; /* Intentional: tighter layout constraint for compact variant */
  }

  /* Variant: Stacked (vertical layout) */
  .ui-data-row--stacked {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--ui-space-1);
  }

  .ui-data-row--stacked .ui-data-row__label {
    min-width: auto;
  }

  .ui-data-row--stacked .ui-data-row__value {
    text-align: left;
  }

  /* Variant: Emphasized value */
  .ui-data-row--emphasized .ui-data-row__value {
    font-weight: 600;
    color: var(--ui-text-strong);
  }

  /* Variant: Monospace value */
  .ui-data-row--mono .ui-data-row__value {
    font-family: 'SF Mono', 'Roboto Mono', 'Consolas', 'Monaco', monospace;
    font-size: calc(var(--ui-font-s) * 0.95);
    letter-spacing: -0.01em;
  }

  /* Variant: Bordered rows */
  .ui-data-row--bordered {
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
    padding-bottom: var(--ui-space-3);
    margin-bottom: var(--ui-space-3);
  }

  .ui-data-row--bordered:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  /* Variant: Relaxed (cleaner spacing, better for longer values) */
  .ui-data-row--relaxed {
    padding: var(--ui-space-1) 0;
    gap: var(--ui-space-4);
  }

  .ui-data-row--relaxed .ui-data-row__label {
    min-width: 0;
    flex-shrink: 0;
  }

  .ui-data-row--relaxed .ui-data-row__value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Mobile responsive behavior */
  @media (max-width: 480px) {
    .ui-data-row {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--ui-space-1);
    }

    .ui-data-row__label {
      min-width: auto;
    }

    .ui-data-row__value {
      text-align: left;
    }
  }

  /* ============================================================
   * CARD BASE COMPONENT
   * Standard container for custom Home Assistant cards
   * ============================================================ */

  .ui-card {
    padding: var(--ui-layout-card-padding);
    background: var(--ui-surface);
    border-radius: var(--ui-radius-xl);
    position: relative;
  }

  /* Card Header with Accent Sidebar */
  .ui-card-header {
    display: flex;
    align-items: center;
    gap: var(--ui-space-3);
    margin-bottom: var(--ui-space-5);
    padding-left: var(--ui-space-2);
  }

  .ui-card-header__accent {
    width: var(--ui-border-width-l);
    height: 36px; /* Intentional: visual proportion outside 4px grid */
    background: var(--ui-accent);
    border-radius: var(--ui-radius-s);
    flex-shrink: 0;
  }

  .ui-card-header__title {
    font-size: var(--ui-font-xl);
    font-weight: 500;
    margin: 0;
    color: var(--ui-text);
    flex: 1;
  }

  /* Card Action Buttons (Top Right) */
  .ui-card-actions {
    display: flex;
    gap: var(--ui-space-2);
    position: absolute;
    top: var(--ui-space-6);
    right: var(--ui-space-6);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     TOOLTIPS
     ═══════════════════════════════════════════════════════════════════════════ */

  .ui-tooltip {
    position: fixed;
    z-index: var(--ui-z-tooltip);
    background: var(--ui-tooltip-bg);
    color: var(--ui-tooltip-text);
    border-radius: var(--ui-radius-s);
    padding: var(--ui-space-1) var(--ui-space-2);
    font-size: var(--ui-font-s);
    font-weight: var(--ui-font-weight-m);
    line-height: var(--ui-font-line-height-s);
    pointer-events: none;
    white-space: nowrap;
    max-width: var(--ui-tooltip-max-width);
    box-shadow: var(--ui-shadow-2);
    font-family: var(--ha-font-family, system-ui, sans-serif);
    -webkit-font-smoothing: antialiased;
    opacity: 0;

    /*
     * Initial offset: 4px Y + 0.96 scale creates subtle "emerging" feel
     * without being distracting. Values are sub-token because the effect
     * is perceptual tuning, not systematic spacing.
     */
    transform: translateY(4px) scale(0.96);

    /* GPU promotion for smooth animation */
    will-change: transform, opacity;

    /*
     * Exit: 80ms is below perceptual threshold (~100ms) so tooltips
     * vanish near-instantly. Intentionally faster than --ui-motion-fast
     * because lingering tooltips feel sluggish.
     */
    transition:
      opacity 80ms ease-in,
      transform 80ms ease-in;
  }

  .ui-tooltip--visible {
    opacity: 1;
    transform: translateY(0) scale(1);

    /* Enter transition - gentle fade in */
    transition:
      opacity var(--ui-motion-fast) ease-out,
      transform var(--ui-motion-fast) ease-out;
  }

  .ui-tooltip--rich {
    background: var(--ui-rich-tooltip-bg);
    color: var(--ui-rich-tooltip-text);
    border-radius: var(--ui-radius-l);
    padding: var(--ui-space-3) var(--ui-space-4);
    white-space: normal;
    max-width: var(--ui-rich-tooltip-max-width);
    pointer-events: auto;
    cursor: auto;
    box-shadow: var(--ui-shadow-3);
  }

  .ui-tooltip__title {
    font-size: var(--ui-font-m);
    font-weight: var(--ui-font-weight-l);
    margin-bottom: var(--ui-space-2);
    color: var(--ui-rich-tooltip-text);
  }

  .ui-tooltip__body {
    font-size: var(--ui-font-s);
    line-height: var(--ui-font-line-height-m);
    color: var(--ui-text-mute);
    word-wrap: break-word;
  }

  .ui-tooltip__actions {
    margin-top: var(--ui-space-3);
    padding-top: var(--ui-space-3);
    border-top: var(--ui-border-width-s) solid var(--ui-border-color-light);
  }

  .ui-tooltip__link {
    background: none;
    border: none;
    font-size: var(--ui-font-s);
    font-weight: var(--ui-font-weight-l);
    cursor: pointer;
    padding: var(--ui-space-1) 0;
  }

  /* Tooltip Carets */
  .ui-tooltip__caret {
    position: absolute;
    width: 0;
    height: 0;
    border: var(--ui-space-1) solid transparent;
  }

  .ui-tooltip__caret--top {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-color: var(--ui-tooltip-bg);
  }

  .ui-tooltip__caret--bottom {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-top-color: var(--ui-tooltip-bg);
  }

  .ui-tooltip__caret--left {
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-right-color: var(--ui-tooltip-bg);
  }

  .ui-tooltip__caret--right {
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-left-color: var(--ui-tooltip-bg);
  }

  /* Rich tooltip caret colors */
  .ui-tooltip--rich .ui-tooltip__caret--top {
    border-bottom-color: var(--ui-rich-tooltip-bg);
  }

  .ui-tooltip--rich .ui-tooltip__caret--bottom {
    border-top-color: var(--ui-rich-tooltip-bg);
  }

  .ui-tooltip--rich .ui-tooltip__caret--left {
    border-right-color: var(--ui-rich-tooltip-bg);
  }

  .ui-tooltip--rich .ui-tooltip__caret--right {
    border-left-color: var(--ui-rich-tooltip-bg);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PROGRESS BAR
     Horizontal progress indicator with determinate and indeterminate states.
     Bold, rounded, material-like design matching dashboard aesthetic.
     ═══════════════════════════════════════════════════════════════════════════ */

  .ui-progress {
    position: relative;
    width: 100%;
    height: var(--ui-progress-height);
    background: var(--ui-progress-track);
    border-radius: var(--ui-progress-radius);
    overflow: hidden;

    /* Subtle inset depth */
    box-shadow: var(--ui-progress-depth-shadow);
  }

  .ui-progress__bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: var(--ui-progress-fill);
    border-radius: var(--ui-progress-radius);

    /* Bounce/wobble transition matching toggle switches */
    transition: width var(--ui-progress-motion);

    /* Subtle highlight on top edge for depth */
    box-shadow: var(--ui-progress-highlight-shadow);
  }

  /* Indeterminate state - bouncy flowing animation */
  .ui-progress--indeterminate .ui-progress__bar {
    width: 35%;
    animation: ui-progress-indeterminate 2s ease-in-out infinite;
  }

  @keyframes ui-progress-indeterminate {
    0% {
      left: -35%;
      width: 35%;
      transform: scaleX(1);
    }
    25% {
      width: 45%;
      transform: scaleX(1.05);
    }
    50% {
      left: 35%;
      width: 30%;
      transform: scaleX(0.95);
    }
    75% {
      width: 40%;
      transform: scaleX(1.02);
    }
    100% {
      left: 100%;
      width: 35%;
      transform: scaleX(1);
    }
  }

  /* Size variants */
  .ui-progress--thick {
    height: var(--ui-progress-height-thick);
  }

  .ui-progress--thin {
    height: var(--ui-progress-height-thin);
    box-shadow: none;
  }

  .ui-progress--thin .ui-progress__bar {
    box-shadow: none;
  }

  /* Color variants */
  .ui-progress--success .ui-progress__bar {
    background: var(--ui-success);
  }

  .ui-progress--warning .ui-progress__bar {
    background: var(--ui-warning);
  }

  .ui-progress--error .ui-progress__bar {
    background: var(--ui-error);
  }


  /* ============================================================
   * INFO ICON — Click-to-show-tooltip trigger
   * Shared pattern used by <ui-info-icon> (tooltips.js).
   * Renders a circle-i SVG; click opens a rich tooltip.
   * ============================================================ */

  .ui-info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--ui-icon-s);
    height: var(--ui-icon-s);
    color: var(--ui-text-mute);
    cursor: pointer;
    opacity: 0.5;
    border-radius: 50%;
    vertical-align: middle;
    -webkit-tap-highlight-color: transparent;
    transition: opacity var(--ui-motion-fast), color var(--ui-motion-fast);
  }

  .ui-info-icon svg {
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  @media (hover: hover) and (pointer: fine) {
    .ui-info-icon:hover {
      opacity: 1;
      color: var(--ui-accent);
    }
  }

  .ui-info-icon:focus-visible {
    opacity: 1;
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }


  /* ═══════════════════════════════════════════════════════════════════════════
     ANIMATION KEYFRAMES
     ═══════════════════════════════════════════════════════════════════════════ */

  /* -- Pop entrance (parameterised via custom properties) ------------------- */
  @keyframes ui-pop-in {
    0% {
      transform: translateY(var(--ui-pop-from-y, 0px)) scale(var(--ui-pop-from-scale, 0));
      opacity: 0;
    }
    60% {
      transform: translateY(0) scale(var(--ui-pop-overshoot, 1.05));
      opacity: 1;
    }
    80% {
      transform: scale(calc(1 - (var(--ui-pop-overshoot, 1.05) - 1) * 0.4));
    }
    100% {
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-pop-in {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
  }

  /* -- Directional slide entrance (no blur) -------------------------------- */
  @keyframes ui-slide-in {
    0% {
      transform: translate(var(--ui-anim-from-x, 0px), var(--ui-anim-from-y, 0px));
      opacity: 0;
    }
    100% {
      transform: translate(0, 0);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-slide-in {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
  }

  /* -- Directional blur reveal (whole-element and per-character) ------------ */
  @keyframes ui-reveal-in {
    0% {
      transform: translateX(var(--ui-anim-from-x, 60px)) scaleX(0.85);
      filter: blur(12px);
      opacity: 0;
    }
    100% {
      transform: translateX(0) scaleX(1);
      filter: blur(0);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-reveal-in {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
  }

  /* -- Directional blur exit (mirrors ui-reveal-in) ------------------------ */
  @keyframes ui-reveal-out {
    0% {
      transform: translateX(0) scaleX(1);
      filter: blur(0);
      opacity: 1;
    }
    100% {
      transform: translateX(var(--ui-anim-from-x, 60px)) scaleX(0.85);
      filter: blur(12px);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-reveal-out {
      0%   { opacity: 1; }
      100% { opacity: 0; }
    }
  }

  /* -- Subtle materialisation (extension) ---------------------------------- */
  @keyframes ui-settle-in {
    0% {
      transform: scale(var(--ui-anim-scale, 0.96));
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-settle-in {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
  }

  /* -- Tap feedback (7-stop bounce) ---------------------------------------- */
  @keyframes ui-tap-bounce {
    0%    { transform: scale(1); }
    15%   { transform: scale(0.85); }
    35%   { transform: scale(1.05); }
    55%   { transform: scale(0.95); }
    70%   { transform: scale(1.02); }
    85%   { transform: scale(0.98); }
    100%  { transform: scale(1); }
  }

  @keyframes ui-tap-press {
    0%   { transform: scale(1); }
    40%  { transform: scale(0.97); }
    100% { transform: scale(1); }
  }

  .is-tap-bouncing {
    animation: ui-tap-press var(--ui-motion-med);
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-tap-bounce {
      0%    { opacity: 0.7; transform: scale(1); }
      100%  { opacity: 1; transform: scale(1); }
    }
  }

  /* -- Bar grow from bottom (extension) ------------------------------------ */
  @keyframes ui-bar-grow {
    0% {
      transform: scaleY(0);
      opacity: 0;
    }
    40% {
      opacity: 1;
    }
    65% {
      transform: scaleY(1.06);
    }
    78% {
      transform: scaleY(0.98);
    }
    88% {
      transform: scaleY(1.02);
    }
    100% {
      transform: scaleY(1);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-bar-grow {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
  }

  /* -- Ambient attention pulse --------------------------------------------- */
  @keyframes ui-attention-pulse {
    0%, 100% { border-color: var(--ui-pulse-color-from, var(--ui-accent)); }
    50%       { border-color: var(--ui-pulse-color-to, var(--ui-accent-faint)); }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-attention-pulse {
      0%, 100% { border-color: var(--ui-pulse-color-from, var(--ui-accent)); }
    }
  }

  /* -- Modal entrance -------------------------------------------------------- */
  /* Large surfaces need a different approach to small elements — no          */
  /* significant position or scale change or it looks janky. Instead:        */
  /* opacity does the heavy lifting, with a barely-there scale (0.97→1)      */
  /* that registers subliminally as "arriving" without drawing attention      */
  /* to itself. Fast duration + steep deceleration reads as native/instant.  */
  @keyframes ui-modal-in {
    0% {
      transform: scale(0.97);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-modal-in {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
  }


  /* -- Fade out (simple opacity exit) --------------------------------------- */
  @keyframes ui-fade-out {
    0%   { opacity: 1; }
    100% { opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-fade-out {
      0%   { opacity: 1; }
      100% { opacity: 0; }
    }
  }

  /* -- Firework burst (radial box-shadow particle explosion) --------------- */
  /* Parameterised: --ui-firework-color (default: --ui-accent)               */
  /* --ui-firework-spread controls particle distance (default: 15px)         */
  @keyframes ui-firework {
    0% {
      opacity: 1;
      box-shadow:
        0 0 0 -2px var(--ui-firework-color, var(--ui-accent)),
        0 0 0 -2px var(--ui-firework-color, var(--ui-accent)),
        0 0 0 -2px var(--ui-firework-color, var(--ui-accent)),
        0 0 0 -2px var(--ui-firework-color, var(--ui-accent)),
        0 0 0 -2px var(--ui-firework-color, var(--ui-accent)),
        0 0 0 -2px var(--ui-firework-color, var(--ui-accent));
    }
    30% { opacity: 1; }
    100% {
      opacity: 0;
      box-shadow:
        0 calc(-1 * var(--ui-firework-spread, 15px)) 0 0 var(--ui-firework-color, var(--ui-accent)),
        calc(var(--ui-firework-spread, 15px) * 0.93) calc(-1 * var(--ui-firework-spread, 15px) * 0.53) 0 0 var(--ui-firework-color, var(--ui-accent)),
        calc(var(--ui-firework-spread, 15px) * 0.93) calc(var(--ui-firework-spread, 15px) * 0.53) 0 0 var(--ui-firework-color, var(--ui-accent)),
        0 var(--ui-firework-spread, 15px) 0 0 var(--ui-firework-color, var(--ui-accent)),
        calc(-1 * var(--ui-firework-spread, 15px) * 0.93) calc(var(--ui-firework-spread, 15px) * 0.53) 0 0 var(--ui-firework-color, var(--ui-accent)),
        calc(-1 * var(--ui-firework-spread, 15px) * 0.93) calc(-1 * var(--ui-firework-spread, 15px) * 0.53) 0 0 var(--ui-firework-color, var(--ui-accent));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-firework {
      0%   { opacity: 1; }
      100% { opacity: 0; }
    }
  }

  /* -- Check stroke (two-part animated checkmark) ------------------------- */
  /* Used as a pair: ui-check-stroke-1 (left leg) + ui-check-stroke-2 (right leg) */
  /* Apply to pseudo-elements or spans within a container. Geometry is tightly   */
  /* coupled — both keyframes must play together for the tick to read correctly.  */
  @keyframes ui-check-stroke-1 {
    0%   { width: 4px; top: auto; transform: rotate(0); }
    50%  { width: 0px; top: auto; transform: rotate(0); }
    51%  { width: 0px; top: 8px;  transform: rotate(45deg); }
    100% { width: 5px; top: 8px;  transform: rotate(45deg); }
  }

  @keyframes ui-check-stroke-2 {
    0%   { width: 4px; top: auto; transform: rotate(0); }
    50%  { width: 0px; top: auto; transform: rotate(0); }
    51%  { width: 0px; top: 8px;  transform: rotate(-45deg); }
    100% { width: 10px; top: 8px; transform: rotate(-45deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-check-stroke-1 {
      0%   { width: 5px; top: 8px; transform: rotate(45deg); }
      100% { width: 5px; top: 8px; transform: rotate(45deg); }
    }
    @keyframes ui-check-stroke-2 {
      0%   { width: 10px; top: 8px; transform: rotate(-45deg); }
      100% { width: 10px; top: 8px; transform: rotate(-45deg); }
    }
  }


  /* ═══════════════════════════════════════════════════════════════════════════
     REDUCED MOTION ACCESSIBILITY
     ═══════════════════════════════════════════════════════════════════════════ */

  @media (prefers-reduced-motion: reduce) {
    .ui-btn,
    .ui-fab,
    .ui-menu,
    .ui-menu__item,
    .ui-slider__thumb,
    .ui-slider__track,
    .ui-slider__track-active,
    .ui-slider__track-inactive,
    .ui-tooltip,
    .ui-collapsible-section__content,
    .ui-copy-btn,
    .ui-spinner,
    .ui-tab-bar__tab,
    .ui-progress__bar,
    .ui-progress--indeterminate .ui-progress__bar {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }


  /* ═══════════════════════════════════════════════════════════════════════════
     HIGH CONTRAST MODE (Windows)
     ═══════════════════════════════════════════════════════════════════════════
     
     Ensures components remain visible and usable in Windows High Contrast Mode.
     State layer overlays (::before) don't render in forced-colors, so we disable
     them and rely on system colors for state indication.
     
     Coverage:
       ✓ Buttons (all variants), FAB, split button, copy button
       ✓ Inputs
       ✓ Switches (track only)
       ✓ Menus
       ✓ Tooltips
       
     Not covered (intentionally):
       - Sliders (require complex track/thumb handling)
       - Spinners (decorative, not interactive)
       - Collapsible sections (header inherits button treatment)
       - Tab bar (uses button-like semantics)
     
     ═══════════════════════════════════════════════════════════════════════════ */

  @media (forced-colors: active) {
    /* Ensure buttons have visible borders */
    .ui-btn,
    .ui-fab,
    .ui-split__main,
    .ui-split__arrow,
    .ui-copy-btn {
      border: 2px solid ButtonText;
    }

    .ui-btn--filled,
    .ui-fab {
      background: ButtonText;
      color: ButtonFace;
    }

    .ui-btn--disabled,
    .ui-btn:disabled,
    .ui-fab:disabled {
      border-color: GrayText;
      color: GrayText;
    }

    /* Ensure focus is visible */
    .ui-btn:focus-visible,
    .ui-fab:focus-visible,
    .ui-copy-btn:focus-visible,
    .ui-menu__item:focus-visible,
    .ui-collapsible-section__header:focus-visible {
      outline: 3px solid Highlight;
      outline-offset: var(--ui-focus-outline-offset);
    }

    /* Ensure inputs have visible borders */
    .ui-input__pill {
      border: 2px solid ButtonText;
    }

    .ui-input__pill:focus-within {
      border-color: Highlight;
    }

    /* Ensure switches have visible outlines */
    .ui-switch__track {
      border: 2px solid ButtonText;
    }

    .ui-switch__input:checked + .ui-switch__track {
      background: Highlight;
    }

    /* Ensure menus are visible */
    .ui-menu {
      border: 2px solid ButtonText;
      background: Canvas;
    }

    .ui-menu__item--selected {
      background: Highlight;
      color: HighlightText;
    }

    /* Ensure tooltips are visible */
    .ui-tooltip {
      border: 1px solid ButtonText;
      background: Canvas;
      color: CanvasText;
    }

    /* Disable state layer overlays - they don't work in forced colors */
    .ui-btn::before,
    .ui-fab::before,
    .ui-split__main::before,
    .ui-split__arrow::before,
    .ui-menu__item::before,
    .ui-copy-btn::before {
      display: none;
    }
  }


  /* ============================================================
   * EXPLICIT STATE CLASSES
   * ============================================================
   *
   * These classes mirror pseudo-class states (:hover, :active, :focus)
   * for use in catalogues, test cards, and scripted state display where
   * actual user interaction cannot trigger the pseudo-classes.
   *
   * Contract:
   *   .is-hovered  → mirrors :hover
   *   .is-pressed  → mirrors :active
   *   .is-focused  → mirrors :focus-visible
   *
   * Visual output should be identical to the pseudo-class equivalent.
   * If you modify a :hover rule, update .is-hovered to match.
   *
   * Coverage: buttons (all variants), toggle buttons, split button,
   * menu items, FAB, copy button, inputs, collapsible sections.
   * ============================================================ */


  /* ── BUTTONS - BASE ─────────────────────────────────────────── */

  .ui-btn.is-hovered:not(.ui-btn--disabled):not(:disabled)::before {
    opacity: 1;
  }

  .ui-btn.is-hovered:not(.ui-btn--disabled):not(:disabled) {
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
  }

  .ui-btn.is-pressed:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  .ui-btn.is-pressed:not(.ui-btn--disabled):not(:disabled) {
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }

  .ui-btn.is-focused {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }


  /* ── BUTTONS - ACCENT VARIANT ───────────────────────────────── */

  .ui-btn--accent.is-hovered:not(.ui-btn--disabled):not(:disabled)::before {
    opacity: 1;
  }

  .ui-btn--accent.is-pressed:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-accent-soft);
    opacity: 1;
  }

  .ui-btn--accent.ui-btn--filled.is-hovered:not(.ui-btn--disabled):not(:disabled)::before {
    opacity: 1;
  }

  .ui-btn--accent.ui-btn--filled.is-pressed:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }


  /* ── BUTTONS - DANGER VARIANT ───────────────────────────────── */

  .ui-btn--danger.is-hovered:not(.ui-btn--disabled):not(:disabled)::before {
    opacity: 1;
  }

  .ui-btn--danger.is-pressed:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-error-soft);
    opacity: 1;
  }

  .ui-btn--danger.ui-btn--filled.is-hovered:not(.ui-btn--disabled):not(:disabled)::before {
    opacity: 1;
  }

  .ui-btn--danger.ui-btn--filled.is-pressed:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }


  /* ── BUTTONS - MUTED VARIANT ────────────────────────────────── */

  .ui-btn--muted.is-hovered:not(.ui-btn--disabled):not(:disabled)::before {
    opacity: 1;
  }

  .ui-btn--muted.is-hovered:not(.ui-btn--disabled):not(:disabled) {
    color: var(--ui-text);
  }

  .ui-btn--muted.is-pressed:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  .ui-btn--muted.is-pressed:not(.ui-btn--disabled):not(:disabled) {
    color: var(--ui-text);
  }


  /* ── BUTTONS - OUTLINE VARIANT ───────────────────────────────── */

  .ui-btn--outline.is-hovered:not(.ui-btn--disabled):not(:disabled)::before {
    opacity: 1;
  }

  .ui-btn--outline.is-hovered:not(.ui-btn--disabled):not(:disabled) {
    border-color: var(--ui-border-color-strong);
  }

  .ui-btn--outline.is-pressed:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }


  /* ── TOGGLE BUTTONS ─────────────────────────────────────────── */

  .ui-btn--toggle.is-hovered:not(.ui-btn--disabled):not(:disabled):not(.is-selected)::before {
    opacity: 1;
  }

  .ui-btn--toggle.is-hovered:not(.ui-btn--disabled):not(:disabled):not(.is-selected) {
    border-color: var(--ui-border-color-strong);
  }

  .ui-btn--toggle.is-pressed:not(.ui-btn--disabled):not(:disabled):not(.is-selected)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  .ui-btn--toggle.is-selected.is-hovered:not(.ui-btn--disabled):not(:disabled)::before {
    opacity: 1;
  }

  .ui-btn--toggle.is-selected.is-pressed:not(.ui-btn--disabled):not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }


  /* ── SPLIT BUTTON ───────────────────────────────────────────── */

  .ui-split__main.is-hovered:not(:disabled)::before,
  .ui-split__arrow.is-hovered:not(:disabled)::before {
    opacity: 1;
  }

  .ui-split.is-hovered::after {
    background: var(--ui-state-hover);
  }

  .ui-split__main.is-pressed:not(:disabled)::before,
  .ui-split__arrow.is-pressed:not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  .ui-split.is-pressed::after {
    background: var(--ui-state-pressed);
  }

  /* Toggle variant states */
  .ui-split--toggle.is-hovered:not(.is-selected) .ui-split__main,
  .ui-split--toggle.is-hovered:not(.is-selected) .ui-split__arrow {
    border-color: var(--ui-border-color-strong);
  }


  /* ── MENU ITEMS ─────────────────────────────────────────────── */

  .ui-menu__item.is-hovered::before {
    opacity: 1;
  }

  .ui-menu__item.is-pressed::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }


  /* ── FAB ────────────────────────────────────────────────────── */
  /*
   * NOTE: .is-pressed includes scale(0.96) which the actual :active state
   * does not have. This is intentional for catalogue display but creates
   * divergence from runtime behavior. See "press feedback parity" discussion.
   */

  .ui-fab.is-hovered:not(:disabled)::before {
    opacity: 1;
  }

  .ui-fab.is-hovered:not(:disabled) {
    box-shadow: var(--ui-shadow-4), 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
  }

  .ui-fab.is-pressed:not(:disabled)::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  .ui-fab.is-pressed:not(:disabled) {
    transform: scale(0.96);
    box-shadow: var(--ui-shadow-2), 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }

  .ui-fab.is-focused {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }


  /* ── COPY BUTTON ────────────────────────────────────────────── */

  .ui-copy-btn.is-hovered::before {
    opacity: 1;
  }

  .ui-copy-btn.is-pressed::before {
    background: var(--ui-state-pressed);
    opacity: 1;
  }

  .ui-copy-btn.is-focused {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }


  /* ── SLIDERS ──────────────────────────────────────────────────── */

  .ui-slider.is-hovered .ui-slider__thumb {
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
  }

  .ui-slider.is-pressed .ui-slider__thumb {
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }


  /* ── INPUT FIELDS ───────────────────────────────────────────── */

  .ui-input__pill.is-focused,
  .ui-input__pill.is-focus-within {
    border-color: var(--ui-accent);
  }

  .ui-input__pill.is-focused .ui-input__label,
  .ui-input__pill.is-focus-within .ui-input__label {
    color: var(--ui-accent);
    top: var(--ui-space-2);
    font-size: var(--ui-font-xs);
  }


  /* ── COLLAPSIBLE SECTIONS ───────────────────────────────────── */

  .ui-collapsible-section__header.is-hovered {
    background-color: var(--ui-state-hover);
  }

  .ui-collapsible-section__header.is-focused {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }

  .ui-collapsible-section__header.is-pressed {
    background-color: var(--ui-state-pressed);
  }


  /* ============================================================
   * MODAL DIALOGS
   * Centered overlay dialogs with backdrop and focus trap
   * Single active modal at a time (new modal closes existing)
   * Three sizes: small (480px), medium (720px), large (960px)
   * ============================================================ */

  .ui-modal-backdrop {
    position: fixed;
    inset: 0;
    background: var(--ui-overlay-scrim-strong);
    z-index: var(--ui-z-dialog);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: var(--ui-space-4);
    overflow: auto;
    opacity: 0;
    transition: opacity var(--ui-motion-fast) ease-out;
  }

  .ui-modal-backdrop.is-visible {
    opacity: 1;
  }

  .ui-modal-backdrop.is-exiting {
    opacity: 0;
    transition: opacity var(--ui-motion-fast) ease-in;
  }

  .ui-modal {
    position: relative;
    background: var(--ui-elevated-2);
    border-radius: var(--ui-modal-radius);
    box-shadow: var(--ui-shadow-4);
    width: 100%;
    max-width: var(--ui-modal-max-width-m);
    margin: auto;
    padding: var(--ui-space-6);
    display: flex;
    flex-direction: column;
    overflow: visible;
    opacity: 0;
  }

  .ui-modal-backdrop.is-visible .ui-modal {
    animation: ui-modal-in 200ms cubic-bezier(0, 0, 0.2, 1) both;
    opacity: 1;
  }

  .ui-modal-backdrop.is-exiting .ui-modal {
    transform: translateY(8px) scale(0.96);
    opacity: 0;
    transition: transform var(--ui-motion-fast) ease-in,
                opacity var(--ui-motion-fast) ease-in;
  }

  /* Size variants */
  .ui-modal--s {
    max-width: var(--ui-modal-max-width-s);
  }

  .ui-modal--l {
    max-width: var(--ui-modal-max-width-l);
  }

  /* Header */
  .ui-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ui-modal-header-gap);
    flex-shrink: 0;
  }

  .ui-modal__title {
    font-size: var(--ui-font-l);
    font-weight: 600;
    color: var(--ui-text-strong);
    margin: 0;
    flex: 1;
  }

  /* Close button */
  .ui-modal__close {
    width: var(--ui-space-9);
    height: var(--ui-space-9);
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--ui-text-mute);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background var(--ui-motion-fast), color var(--ui-motion-fast);
  }

  .ui-modal__close:hover {
    background: var(--ui-state-hover);
    color: var(--ui-text);
  }

  .ui-modal__close:focus-visible {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }

  .ui-modal__close:active {
    background: var(--ui-state-pressed);
  }

  /* Body */
  .ui-modal__body {
    overflow-y: auto;
    flex: 1;
    color: var(--ui-text);
    font-size: var(--ui-font-m);
    line-height: 1.5;
  }

  .ui-modal__body::-webkit-scrollbar {
    width: var(--ui-scrollbar-width);
  }

  .ui-modal__body::-webkit-scrollbar-track {
    background: var(--ui-scrollbar-track);
    border-radius: var(--ui-scrollbar-width);
  }

  .ui-modal__body::-webkit-scrollbar-thumb {
    background: var(--ui-scrollbar-thumb);
    border-radius: var(--ui-scrollbar-width);
  }

  .ui-modal__body::-webkit-scrollbar-thumb:hover {
    background: var(--ui-scrollbar-thumb-hover);
  }

  /* Footer */
  .ui-modal__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--ui-modal-footer-gap);
    padding-top: var(--ui-space-3);
    flex-shrink: 0;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .ui-modal-backdrop {
      transition: opacity 0.01ms !important;
    }
    .ui-modal {
      animation: none !important;
      transform: none !important;
      transition: opacity 0.01ms !important;
    }
    .ui-modal-backdrop.is-visible .ui-modal {
      animation: none !important;
      transform: none !important;
    }
    .ui-modal-backdrop.is-exiting .ui-modal {
      transform: none;
    }
  }

  /* Forced colors mode (Windows High Contrast) */
  @media (forced-colors: active) {
    .ui-modal {
      border: 2px solid ButtonText;
    }
    .ui-modal__close {
      border: 1px solid ButtonText;
    }
    .ui-modal-backdrop {
      background: Canvas;
      opacity: 0.9;
    }
  }


  /* ============================================================
   * BADGE
   * Soft tonal label for status, category, or metadata display.
   * Pill-shaped capsule with generous padding; height is
   * driven by padding + line-height (no fixed height).
   * Variants:  --success, --warning, --error, --info, --accent, --muted
   * Dot:       Add .ui-badge__dot span for a leading colour dot
   * Custom:    Set --_badge-color and --_badge-color-faint via inline style
   * ============================================================ */

  .ui-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--ui-space-2);
    padding: var(--ui-space-2) var(--ui-space-3);
    font-size: var(--ui-font-xs);
    font-weight: 500;
    line-height: var(--ui-font-line-height-s);
    white-space: nowrap;
    border-radius: var(--ui-radius-pill);
    background: var(--_badge-color-faint, var(--ui-elevated-2));
    color: var(--_badge-color, var(--ui-text-mute));
    user-select: none;
  }

  /* ── Semantic variants ──────────────────────────────────── */
  .ui-badge--success {
    --_badge-color: var(--ui-success);
    --_badge-color-faint: var(--ui-success-faint);
  }

  .ui-badge--warning {
    --_badge-color: var(--ui-warning);
    --_badge-color-faint: var(--ui-warning-faint);
  }

  .ui-badge--error {
    --_badge-color: var(--ui-error);
    --_badge-color-faint: var(--ui-error-faint);
  }

  .ui-badge--info {
    --_badge-color: var(--ui-info);
    --_badge-color-faint: var(--ui-info-faint);
  }

  .ui-badge--accent {
    --_badge-color: var(--ui-accent);
    --_badge-color-faint: var(--ui-accent-faint);
  }

  .ui-badge--muted {
    --_badge-color: var(--ui-text-mute);
    --_badge-color-faint: var(--ui-elevated-2);
  }

  /* ── Pill shape modifier ────────────────────────────────── */
  .ui-badge--pill {
    border-radius: var(--ui-radius-pill);
  }

  /* ── Leading colour dot ─────────────────────────────────── */
  .ui-badge__dot {
    width: var(--ui-space-2);
    height: var(--ui-space-2);
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--_badge-color, currentColor);
  }


`);


// ============================================================
// COLLAPSIBLE SECTION COMPONENT - JAVASCRIPT
// ============================================================

/**
 * Initialize collapsible sections within a given root element
 * @param {Document|ShadowRoot} root - Root element to search for sections (defaults to document)
 */
export function initCollapsibleSections(root = document) {
  const sections = root.querySelectorAll('.ui-collapsible-section');

  sections.forEach(section => {
    const sectionId = section.dataset.sectionId;
    const header = section.querySelector('.ui-collapsible-section__header');
    const content = section.querySelector('.ui-collapsible-section__content');

    if (!sectionId || !header || !content) return;

    // Check localStorage for saved state
    const savedState = localStorage.getItem(`ui-section-${sectionId}`);
    const initialState = savedState || section.dataset.initialState || 'expanded';

    // Set initial state
    if (initialState === 'collapsed') {
      section.classList.add('ui-collapsible-section--collapsed');
      content.style.height = '0px';
      header.setAttribute('aria-expanded', 'false');
    } else {
      content.style.height = 'auto';
      header.setAttribute('aria-expanded', 'true');
    }

    // Toggle handler
    header.addEventListener('click', () => {
      toggleSection(section, sectionId, header, content);
    });

    // Keyboard handler
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSection(section, sectionId, header, content);
      }
    });
  });
}

/**
 * Toggle a single section between expanded and collapsed states
 * @param {HTMLElement} section - The section container
 * @param {string} sectionId - The section ID for localStorage
 * @param {HTMLElement} header - The header button element
 * @param {HTMLElement} content - The content wrapper element
 */
function toggleSection(section, sectionId, header, content) {
  const isCollapsed = section.classList.contains('ui-collapsible-section--collapsed');

  if (isCollapsed) {
    // Expand
    section.classList.remove('ui-collapsible-section--collapsed');
    content.style.height = content.scrollHeight + 'px';
    header.setAttribute('aria-expanded', 'true');
    localStorage.setItem(`ui-section-${sectionId}`, 'expanded');

    // Reset to auto after animation completes
    setTimeout(() => {
      if (!section.classList.contains('ui-collapsible-section--collapsed')) {
        content.style.height = 'auto';
      }
    }, 240); // Match --ui-motion-med duration
  } else {
    // Collapse
    const currentHeight = content.scrollHeight;
    content.style.height = currentHeight + 'px';

    // Force reflow
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        section.classList.add('ui-collapsible-section--collapsed');
        content.style.height = '0px';
        header.setAttribute('aria-expanded', 'false');
        localStorage.setItem(`ui-section-${sectionId}`, 'collapsed');
      });
    });
  }
}

/**
 * Toggle all sections to expanded or collapsed state with staggered animation
 * @param {Document|ShadowRoot} root - Root element to search for sections
 * @param {boolean} expand - True to expand all, false to collapse all
 */
export function toggleAllSections(root, expand = true) {
  const sections = root.querySelectorAll('.ui-collapsible-section');

  sections.forEach((section, index) => {
    const sectionId = section.dataset.sectionId;
    const header = section.querySelector('.ui-collapsible-section__header');
    const content = section.querySelector('.ui-collapsible-section__content');

    if (!sectionId || !header || !content) return;

    // Stagger animations by 50ms per section
    setTimeout(() => {
      const isCollapsed = section.classList.contains('ui-collapsible-section--collapsed');

      if (expand && isCollapsed) {
        section.classList.remove('ui-collapsible-section--collapsed');
        content.style.height = content.scrollHeight + 'px';
        header.setAttribute('aria-expanded', 'true');
        localStorage.setItem(`ui-section-${sectionId}`, 'expanded');

        setTimeout(() => {
          if (!section.classList.contains('ui-collapsible-section--collapsed')) {
            content.style.height = 'auto';
          }
        }, 240);
      } else if (!expand && !isCollapsed) {
        const currentHeight = content.scrollHeight;
        content.style.height = currentHeight + 'px';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            section.classList.add('ui-collapsible-section--collapsed');
            content.style.height = '0px';
            header.setAttribute('aria-expanded', 'false');
            localStorage.setItem(`ui-section-${sectionId}`, 'collapsed');
          });
        });
      }
    }, index * 50);
  });
}


// ============================================================
// COPY BUTTON COMPONENT - JAVASCRIPT
// Extracted from prompt-manager.js copyPrompt() method
// ============================================================

/**
 * Copies text to clipboard with fallback for older browsers
 * Extracted from prompt-manager.js lines 532-545
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement("textarea");
      Object.assign(el, { value: text });
      Object.assign(el.style, {
        position: "fixed",
        opacity: "0",
      });
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    return true;
  } catch (err) {
    console.error("Copy failed:", err);
    return false;
  }
}

/**
 * Handles copy button click with visual feedback
 * Extracted from prompt-manager.js lines 552-577
 * @param {HTMLButtonElement} button - The copy button element
 * @param {string} text - Text to copy
 * @param {Object} options - Configuration options
 * @param {number} options.resetDelay - Milliseconds before resetting (default: 3000)
 * @param {Function} options.onSuccess - Callback on successful copy
 * @param {Function} options.onError - Callback on failed copy
 */
export async function handleCopyButton(button, text, options = {}) {
  const {
    resetDelay = 3000,
    onSuccess = () => {},
    onError = () => {},
  } = options;

  const success = await copyToClipboard(text);

  if (success) {
    const orig = button.getAttribute("aria-label") || "Copy";
    button.classList.add("ui-copy-btn--copied");
    button.setAttribute("aria-label", "Done");
    button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>';

    onSuccess();

    setTimeout(() => {
      button.classList.remove("ui-copy-btn--copied");
      button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a 2 2 0 0 1-2-2V4a 2 2 0 0 1 2-2h9a 2 2 0 0 1 2 2v1"></path></svg>';
      button.setAttribute("aria-label", orig);
    }, resetDelay);
  } else {
    onError();
  }
}