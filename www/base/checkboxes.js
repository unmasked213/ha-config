// /config/www/base/checkboxes.js

// ============================================================
// CHECKBOX SYSTEM
// Material Design 3 Expressive-inspired checkboxes
// ============================================================
//
// USAGE PATTERNS:
//
// 1. Standard Checkbox:
//    <label class="ui-checkbox">
//      <input type="checkbox" class="ui-checkbox__input" />
//      <span class="ui-checkbox__box">
//        <svg class="ui-checkbox__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
//          <path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round" stroke-linejoin="round"/>
//        </svg>
//      </span>
//      <span class="ui-checkbox__label">Enable Feature</span>
//    </label>
//
// 2. Disabled Checkbox:
//    <label class="ui-checkbox ui-checkbox--disabled">
//      <input type="checkbox" class="ui-checkbox__input" disabled />
//      <span class="ui-checkbox__box">
//        <svg class="ui-checkbox__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
//          <path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round" stroke-linejoin="round"/>
//        </svg>
//      </span>
//      <span class="ui-checkbox__label">Unavailable</span>
//    </label>
//
// ============================================================

export const uiCheckboxes = new CSSStyleSheet();

uiCheckboxes.replaceSync(`

  /* ============================================================
   * CHECKBOX CONTAINER (LABEL WRAPPER)
   * ============================================================ */

  .ui-checkbox {
    /* Layout */
    display: inline-flex;
    align-items: center;
    gap: var(--ui-space-2);
    position: relative;
    cursor: pointer;
    user-select: none;

    /* Ensure minimum touch target */
    min-height: var(--ui-space-10);
    padding: calc((var(--ui-space-10) - var(--ui-control-size)) / 2) 0;

    /* Typography */
    font-size: var(--ui-font-m);
    color: var(--ui-text);
    -webkit-font-smoothing: antialiased;
  }

  .ui-checkbox--disabled {
    cursor: not-allowed;
    opacity: var(--ui-state-disabled-opacity);
  }


  /* ============================================================
   * NATIVE CHECKBOX INPUT (VISUALLY HIDDEN)
   * ============================================================ */

  .ui-checkbox__input {
    /* Position absolutely for accessibility (not display: none) */
    position: absolute;
    opacity: 0;
    width: var(--ui-control-size);
    height: var(--ui-control-size);
    cursor: pointer;
    margin: 0;
    z-index: 1;
  }

  .ui-checkbox--disabled .ui-checkbox__input {
    cursor: not-allowed;
    pointer-events: none;
  }

  .ui-checkbox__input:disabled {
    cursor: not-allowed;
  }


  /* ============================================================
   * CHECKBOX BOX (VISUAL CONTAINER)
   * ============================================================ */

  .ui-checkbox__box {
    /* Dimensions */
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--ui-control-size);
    height: var(--ui-control-size);
    border-radius: var(--ui-control-border-radius);
    flex-shrink: 0;

    /* Default state (unchecked) */
    background: var(--ui-control-bg);
    border: var(--ui-control-border-width) solid var(--ui-border-color-med);

    /* Transitions */
    transition:
      background-color var(--ui-motion-fast),
      border-color var(--ui-motion-fast);

    /* Prevent touch delay on mobile */
    -webkit-tap-highlight-color: transparent;
  }

  /* Checked state */
  .ui-checkbox__input:checked + .ui-checkbox__box {
    background: var(--ui-control-checked-bg);
    border-color: transparent;
  }

  /* Hover state (desktop only) */
  @media (hover: hover) and (pointer: fine) {
    .ui-checkbox:not(.ui-checkbox--disabled):hover .ui-checkbox__box {
      border-color: var(--ui-border-color-strong);
      box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
    }

    .ui-checkbox:not(.ui-checkbox--disabled):hover .ui-checkbox__input:checked + .ui-checkbox__box {
      border-color: transparent;
      box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
    }
  }

  /* Active/pressed state */
  .ui-checkbox:active:not(.ui-checkbox--disabled) .ui-checkbox__box {
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }

  /* Focus state */
  .ui-checkbox__input:focus-visible + .ui-checkbox__box {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }


  /* ============================================================
   * CHECKMARK ICON
   * ============================================================ */

  .ui-checkbox__icon {
    /* Dimensions */
    width: var(--ui-control-checked-icon-size);
    height: var(--ui-control-checked-icon-size);

    /* Color */
    color: var(--ui-text-on-accent);
    stroke: currentColor;

    /* Hidden by default (unchecked state) */
    opacity: 0;
    transform: scale(0);

    /* Animation - wobble/bounce on check */
    transition:
      opacity var(--ui-checkbox-motion),
      transform var(--ui-checkbox-motion);

    /* Prevent pointer events */
    pointer-events: none;
  }

  /* Show checkmark when checked */
  .ui-checkbox__input:checked + .ui-checkbox__box .ui-checkbox__icon {
    opacity: 1;
    transform: scale(1);
  }


  /* ============================================================
   * LABEL TEXT
   * ============================================================ */

  .ui-checkbox__label {
    /* Typography */
    font-size: var(--ui-font-m);
    color: var(--ui-text);
    line-height: var(--ui-font-line-height-m);

    /* Allow wrapping */
    word-break: break-word;
  }

  .ui-checkbox--disabled .ui-checkbox__label {
    color: var(--ui-text-mute);
  }


  /* ============================================================
   * CATALOGUE / STATIC STATE CLASSES
   * For displaying non-interactive state previews
   * ============================================================ */

  /* Simulate hover state for catalogue display */
  .ui-checkbox.is-hovered .ui-checkbox__box {
    border-color: var(--ui-border-color-strong);
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
  }

  .ui-checkbox.is-hovered .ui-checkbox__input:checked + .ui-checkbox__box {
    border-color: transparent;
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
  }

  /* Simulate pressed state for catalogue display */
  .ui-checkbox.is-pressed .ui-checkbox__box {
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }

  /* Simulate focus state for catalogue display */
  .ui-checkbox.is-focused .ui-checkbox__box {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }


  /* ============================================================
   * REDUCED MOTION
   * ============================================================ */

  @media (prefers-reduced-motion: reduce) {
    .ui-checkbox__box {
      transition: none;
    }

    .ui-checkbox__icon {
      transition: none;
    }
  }

`);
