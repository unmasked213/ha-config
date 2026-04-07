// /config/www/base/radios.js

// ============================================================
// RADIO BUTTON SYSTEM
// Material Design 3 Expressive-inspired radio buttons
// ============================================================
//
// USAGE PATTERNS:
//
// 1. Radio Group:
//    <div class="ui-radio-group" role="radiogroup" aria-label="Choose option">
//      <label class="ui-radio">
//        <input type="radio" class="ui-radio__input" name="options" value="a" />
//        <span class="ui-radio__circle">
//          <svg class="ui-radio__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
//            <path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round" stroke-linejoin="round"/>
//          </svg>
//        </span>
//        <span class="ui-radio__label">Option A</span>
//      </label>
//      <label class="ui-radio">
//        <input type="radio" class="ui-radio__input" name="options" value="b" />
//        <span class="ui-radio__circle">
//          <svg class="ui-radio__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
//            <path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round" stroke-linejoin="round"/>
//          </svg>
//        </span>
//        <span class="ui-radio__label">Option B</span>
//      </label>
//    </div>
//
// 2. Disabled Radio:
//    <label class="ui-radio ui-radio--disabled">
//      <input type="radio" class="ui-radio__input" name="options" disabled />
//      <span class="ui-radio__circle">
//        <svg class="ui-radio__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
//          <path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round" stroke-linejoin="round"/>
//        </svg>
//      </span>
//      <span class="ui-radio__label">Unavailable</span>
//    </label>
//
// ============================================================

export const uiRadios = new CSSStyleSheet();

uiRadios.replaceSync(`

  /* ============================================================
   * RADIO GROUP CONTAINER
   * ============================================================ */

  .ui-radio-group {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-1);
  }

  .ui-radio-group--horizontal {
    flex-direction: row;
    gap: var(--ui-space-6);
  }


  /* ============================================================
   * RADIO CONTAINER (LABEL WRAPPER)
   * ============================================================ */

  .ui-radio {
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

  .ui-radio--disabled {
    cursor: not-allowed;
    opacity: var(--ui-state-disabled-opacity);
  }


  /* ============================================================
   * NATIVE RADIO INPUT (VISUALLY HIDDEN)
   * ============================================================ */

  .ui-radio__input {
    /* Position absolutely for accessibility (not display: none) */
    position: absolute;
    opacity: 0;
    width: var(--ui-control-size);
    height: var(--ui-control-size);
    cursor: pointer;
    margin: 0;
    z-index: 1;
  }

  .ui-radio--disabled .ui-radio__input {
    cursor: not-allowed;
    pointer-events: none;
  }

  .ui-radio__input:disabled {
    cursor: not-allowed;
  }


  /* ============================================================
   * RADIO CIRCLE (VISUAL CONTAINER)
   * ============================================================ */

  .ui-radio__circle {
    /* Dimensions */
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--ui-control-size);
    height: var(--ui-control-size);
    border-radius: 50%;
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
  .ui-radio__input:checked + .ui-radio__circle {
    background: var(--ui-control-checked-bg);
    border-color: transparent;
  }

  /* Hover state (desktop only) */
  @media (hover: hover) and (pointer: fine) {
    .ui-radio:not(.ui-radio--disabled):hover .ui-radio__circle {
      border-color: var(--ui-border-color-strong);
      box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
    }

    .ui-radio:not(.ui-radio--disabled):hover .ui-radio__input:checked + .ui-radio__circle {
      border-color: transparent;
      box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
    }
  }

  /* Active/pressed state */
  .ui-radio:active:not(.ui-radio--disabled) .ui-radio__circle {
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }

  /* Focus state */
  .ui-radio__input:focus-visible + .ui-radio__circle {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }


  /* ============================================================
   * RADIO ICON (CHECKMARK - MATCHES CHECKBOX)
   * ============================================================ */

  .ui-radio__icon {
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
  .ui-radio__input:checked + .ui-radio__circle .ui-radio__icon {
    opacity: 1;
    transform: scale(1);
  }


  /* ============================================================
   * LABEL TEXT
   * ============================================================ */

  .ui-radio__label {
    /* Typography */
    font-size: var(--ui-font-m);
    color: var(--ui-text);
    line-height: var(--ui-font-line-height-m);

    /* Allow wrapping */
    word-break: break-word;
  }

  .ui-radio--disabled .ui-radio__label {
    color: var(--ui-text-mute);
  }


  /* ============================================================
   * CATALOGUE / STATIC STATE CLASSES
   * For displaying non-interactive state previews
   * ============================================================ */

  /* Simulate hover state for catalogue display */
  .ui-radio.is-hovered .ui-radio__circle {
    border-color: var(--ui-border-color-strong);
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
  }

  .ui-radio.is-hovered .ui-radio__input:checked + .ui-radio__circle {
    border-color: transparent;
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-hover);
  }

  /* Simulate pressed state for catalogue display */
  .ui-radio.is-pressed .ui-radio__circle {
    box-shadow: 0 0 0 var(--ui-state-ring-spread) var(--ui-state-pressed);
  }

  /* Simulate focus state for catalogue display */
  .ui-radio.is-focused .ui-radio__circle {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }


  /* ============================================================
   * REDUCED MOTION
   * ============================================================ */

  @media (prefers-reduced-motion: reduce) {
    .ui-radio__circle {
      transition: none;
    }

    .ui-radio__icon {
      transition: none;
    }
  }

`);
