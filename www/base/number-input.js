// /config/www/base/number-input.js
// Compact numeric stepper with expanding pill, momentum hold, scroll, and inline edit.
// Spec: www/base/docs/componentry/number-input.md

import '/local/base/foundation.js';

// ── Component Stylesheet ──────────────────────────────────────────────────────

export const uiNumberInput = new CSSStyleSheet();
uiNumberInput.replaceSync(`

  /* ── Outer wrapper: reserves active width, centres pill ─────────────────── */

  .ui-number-input {
    /* Spec §8.3: component-specific constants (not in foundation.js) */
    --_rest-width: 100px;
    --_active-width: 136px;
    --_zone-width: var(--ui-space-8);  /* 32px */

    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: var(--_active-width);
    height: var(--ui-space-10);
    vertical-align: middle;
    -webkit-user-select: none;
    user-select: none;
  }

  /* ── Inner pill ─────────────────────────────────────────────────────────── */

  .ui-number-input__pill {
    position: relative;
    display: flex;
    align-items: center;
    width: var(--_rest-width);
    height: var(--ui-space-10);
    background: var(--ui-input-bg);
    border-radius: var(--ui-radius-xl);
    border: var(--ui-border-width-l) solid transparent;
    cursor: pointer;
    overflow: hidden;
    -webkit-user-select: none;
    user-select: none;
    touch-action: manipulation;
    transition: width 240ms var(--ui-ease-spring),
                border-color var(--ui-motion-fast);
  }

  .is-active > .ui-number-input__pill {
    width: var(--_active-width);
    border-color: var(--ui-accent);
    cursor: default;
  }

  /* ── Chevron zones ──────────────────────────────────────────────────────── */

  .ui-number-input__zone {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0;
    min-width: 0;
    height: 100%;
    flex-shrink: 0;
    border: none;
    background: transparent;
    color: var(--ui-text-mute);
    padding: 0;
    margin: 0;
    cursor: pointer;
    opacity: 0;
    overflow: hidden;
    transition: width 240ms var(--ui-ease-spring),
                opacity 240ms var(--ui-ease-spring),
                background-color var(--ui-motion-fast),
                color var(--ui-motion-fast);
  }

  .is-active > .ui-number-input__pill > .ui-number-input__zone {
    width: var(--_zone-width);
    opacity: 1;
  }

  .ui-number-input__zone:hover {
    color: var(--ui-text);
  }

  /* Pink flash: instant on, smooth fade out */
  .is-holding-down > .ui-number-input__pill > .ui-number-input__zone--down,
  .is-holding-up > .ui-number-input__pill > .ui-number-input__zone--up,
  .is-scrolling-down > .ui-number-input__pill > .ui-number-input__zone--down,
  .is-scrolling-up > .ui-number-input__pill > .ui-number-input__zone--up,
  .is-tapped-down > .ui-number-input__pill > .ui-number-input__zone--down,
  .is-tapped-up > .ui-number-input__pill > .ui-number-input__zone--up {
    color: var(--ui-pink);
    transition: width 240ms var(--ui-ease-spring),
                opacity 240ms var(--ui-ease-spring),
                background-color var(--ui-motion-fast),
                color 0ms;
  }

  /* Chevron scale-up when pink */
  .is-holding-down > .ui-number-input__pill > .ui-number-input__zone--down > .ui-number-input__chevron,
  .is-holding-up > .ui-number-input__pill > .ui-number-input__zone--up > .ui-number-input__chevron,
  .is-scrolling-down > .ui-number-input__pill > .ui-number-input__zone--down > .ui-number-input__chevron,
  .is-scrolling-up > .ui-number-input__pill > .ui-number-input__zone--up > .ui-number-input__chevron,
  .is-tapped-down > .ui-number-input__pill > .ui-number-input__zone--down > .ui-number-input__chevron,
  .is-tapped-up > .ui-number-input__pill > .ui-number-input__zone--up > .ui-number-input__chevron {
    transform: scale(1.25);
    transition: transform 0ms;
  }

  /* Holding also gets pressed bg */
  .is-holding-down > .ui-number-input__pill > .ui-number-input__zone--down,
  .is-holding-up > .ui-number-input__pill > .ui-number-input__zone--up {
    background: var(--ui-state-pressed);
  }

  /* At-limit: disable the respective zone */
  .is-at-min > .ui-number-input__pill > .ui-number-input__zone--down,
  .is-at-max > .ui-number-input__pill > .ui-number-input__zone--up {
    opacity: var(--ui-state-disabled-opacity);
    cursor: default;
    pointer-events: none;
  }

  /* ── Chevron SVG icon ───────────────────────────────────────────────────── */

  .ui-number-input__chevron {
    width: var(--ui-icon-s);
    height: var(--ui-icon-s);
    flex-shrink: 0;
    pointer-events: none;
    transform: scale(0);
    transition: transform var(--ui-motion-fast);
  }

  /* Active state: base scale(1) so pink flash scale(1.25) can override */
  .is-active > .ui-number-input__pill > .ui-number-input__zone > .ui-number-input__chevron {
    transform: scale(1);
    animation: ui-chevron-pop 400ms var(--ui-ease-spring-heavy) 160ms backwards;
  }

  @keyframes ui-chevron-pop {
    0%   { transform: scale(0); }
    50%  { transform: scale(1.1); }
    75%  { transform: scale(0.95); }
    100% { transform: scale(1); }
  }

  /* ── Dividers (removed by design — see spec §2.2) ────────────────────── */

  .ui-number-input__divider {
    display: none;
  }

  /* ── Centre value area ──────────────────────────────────────────────────── */

  .ui-number-input__value {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-width: 0;
    height: 100%;
    overflow: hidden;
  }

  .is-active .ui-number-input__value {
    cursor: text;
  }

  /* ── Static display ─────────────────────────────────────────────────────── */

  .ui-number-input__display {
    font-size: var(--ui-font-m);
    font-weight: var(--ui-font-weight-m);
    color: var(--ui-text);
    font-variant-numeric: tabular-nums;
    line-height: 1;
    pointer-events: none;
  }

  .is-editing .ui-number-input__display {
    display: none;
  }

  /* ── Text input (editing mode) ──────────────────────────────────────────── */

  .ui-number-input__input {
    display: none;
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    font-family: inherit;
    font-size: var(--ui-font-m);
    font-weight: var(--ui-font-weight-m);
    font-variant-numeric: tabular-nums;
    color: var(--ui-text);
    text-align: center;
    outline: none;
    padding: 0;
    margin: 0;
    -moz-appearance: textfield;
  }

  .ui-number-input__input::-webkit-outer-spin-button,
  .ui-number-input__input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .is-editing .ui-number-input__input {
    display: block;
  }

  /* ── Range indicator bar ────────────────────────────────────────────────── */

  .ui-number-input__range {
    position: absolute;
    bottom: var(--ui-space-1);
    left: var(--ui-space-3);
    right: var(--ui-space-3);
    height: 2px;
    background: var(--ui-border-color-light);
    border-radius: var(--ui-radius-pill);
    opacity: 0;
    transition: opacity 240ms cubic-bezier(0.2, 0, 0.2, 1);
    pointer-events: none;
  }

  .is-active.has-interacted:not(.is-editing) .ui-number-input__range {
    opacity: 1;
  }

  .ui-number-input__range-fill {
    height: 100%;
    background: var(--ui-accent);
    border-radius: var(--ui-radius-pill);
    transition: width 240ms cubic-bezier(0.2, 0, 0.2, 1);
  }

  .is-holding .ui-number-input__range-fill {
    transition: width 90ms linear;
  }

  /* ── Disabled state ─────────────────────────────────────────────────────── */

  .is-disabled {
    opacity: var(--ui-state-disabled-opacity);
    pointer-events: none;
  }

  /* ── Focus visible ──────────────────────────────────────────────────────── */

  .ui-number-input:focus-visible > .ui-number-input__pill {
    border-color: var(--ui-accent);
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }

  /* ── Live region (screen reader) ────────────────────────────────────────── */

  .ui-number-input__live {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ── Reduced motion ─────────────────────────────────────────────────────── */

  @media (prefers-reduced-motion: reduce) {
    .ui-number-input__pill,
    .ui-number-input__zone,
    .ui-number-input__divider,
    .ui-number-input__range-fill,
    .ui-number-input__range,
    .ui-number-input__chevron {
      transition: none !important;
      animation: none !important;
    }

    .is-active > .ui-number-input__pill > .ui-number-input__zone > .ui-number-input__chevron {
      transform: scale(1);
    }
  }

`);


// ── Custom Element ────────────────────────────────────────────────────────────

class UINumberInput extends HTMLElement {

  /** Only one instance may be active at a time. */
  static _activeInstance = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Internal state
    this._value = 0;
    this._min = 0;
    this._max = 100;
    this._stepSize = 1;
    this._disabled = false;
    this._active = false;
    this._editing = false;
    this._holding = false;
    this._holdDirection = null;
    this._preEditValue = 0;
    this._interacted = false;

    // Momentum hold state
    this._holdStartTimer = null;
    this._holdTimer = null;
    this._tickCount = 0;

    // Flash state timers
    this._scrollFlashTimer = null;
    this._tapFlashTimer = null;

    // Editing-mode step guard
    this._steppedInEditing = false;

    // Inactivity auto-collapse timer (for scroll-activated instances)
    this._inactivityTimer = null;

    // Handler storage for cleanup
    this._handlers = new Map();
    this._outsideHandler = null;
  }

  static get observedAttributes() {
    return ['value', 'min', 'max', 'step', 'disabled', 'aria-label'];
  }

  connectedCallback() {
    this.shadowRoot.adoptedStyleSheets = [window.uiFoundation, uiNumberInput];
    this._inheritTheme();
    this._observeTheme();
    this.render();
    this.attachEvents();
  }

  disconnectedCallback() {
    this.detachEvents();
    this._clearHold();
    this._clearInactivityTimer();
    if (this._themeObserver) {
      this._themeObserver.disconnect();
      this._themeObserver = null;
    }
  }

  /** Copy theme class from the nearest card host (the element that applyThemeClass targets). */
  _inheritTheme() {
    const host = this.getRootNode()?.host;
    if (!host) return;
    const isDark = host.classList.contains('dark-theme');
    this.classList.toggle('dark-theme', isDark);
    this.classList.toggle('light-theme', !isDark);
  }

  /** Watch the parent card host for theme class changes. */
  _observeTheme() {
    const host = this.getRootNode()?.host;
    if (!host) return;
    this._themeObserver = new MutationObserver(() => this._inheritTheme());
    this._themeObserver.observe(host, { attributes: true, attributeFilter: ['class'] });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'value':
        this._value = this._clamp(parseFloat(newValue) || 0);
        break;
      case 'min':
        this._min = parseFloat(newValue) || 0;
        this._value = this._clamp(this._value);
        break;
      case 'max':
        this._max = parseFloat(newValue) || 100;
        this._value = this._clamp(this._value);
        break;
      case 'step':
        this._stepSize = Math.max(0.01, parseFloat(newValue) || 1);
        return; // No updateVisuals needed
      case 'disabled':
        this._disabled = newValue !== null;
        if (this._disabled) {
          this._deactivate();
        }
        break;
      case 'aria-label': {
        const root = this.shadowRoot?.querySelector('.ui-number-input');
        if (root) {
          if (newValue) root.setAttribute('aria-label', newValue);
          else root.removeAttribute('aria-label');
        }
        return; // No updateVisuals needed
      }
    }

    if (this.isConnected) {
      this.updateVisuals();
    }
  }

  // ── Properties (reflect attributes) ─────────────────────────────────────

  get value() { return this._value; }
  set value(v) {
    const n = this._clamp(parseFloat(v) || 0);
    if (n !== this._value) {
      this._value = n;
      this.setAttribute('value', String(n));
    }
  }

  get min() { return this._min; }
  set min(v) { this.setAttribute('min', String(v)); }

  get max() { return this._max; }
  set max(v) { this.setAttribute('max', String(v)); }

  get step() { return this._stepSize; }
  set step(v) { this.setAttribute('step', String(v)); }

  get disabled() { return this._disabled; }
  set disabled(v) {
    if (v) this.setAttribute('disabled', '');
    else this.removeAttribute('disabled');
  }

  // ── Render ──────────────────────────────────────────────────────────────

  render() {
    this.shadowRoot.innerHTML = `
      <div class="ui-number-input" role="spinbutton"
           aria-valuenow="${this._value}"
           aria-valuemin="${this._min}"
           aria-valuemax="${this._max}"
           ${this.getAttribute('aria-label') ? `aria-label="${this.getAttribute('aria-label')}"` : ''}
           tabindex="0">

        <div class="ui-number-input__pill">

          <button class="ui-number-input__zone ui-number-input__zone--down"
                  aria-label="Decrease" tabindex="-1">
            <svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.797 7a1 1 0 0 0-.778 1.628l3.814 4.723a1.5 1.5 0 0 0 2.334 0l3.815-4.723A1 1 0 0 0 14.204 7z"/>
            </svg>
          </button>

          <div class="ui-number-input__divider" aria-hidden="true"></div>

          <div class="ui-number-input__value">
            <span class="ui-number-input__display">${this._formatDisplay(this._value)}</span>
            <input class="ui-number-input__input" type="text" inputmode="decimal"
                   tabindex="-1" aria-hidden="true" />
            <div class="ui-number-input__range" aria-hidden="true">
              <div class="ui-number-input__range-fill"></div>
            </div>
          </div>

          <div class="ui-number-input__divider" aria-hidden="true"></div>

          <button class="ui-number-input__zone ui-number-input__zone--up"
                  aria-label="Increase" tabindex="-1">
            <svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.797 13.908a1 1 0 0 1-.778-1.628l3.814-4.723a1.5 1.5 0 0 1 2.334 0l3.815 4.723a1 1 0 0 1-.778 1.628z"/>
            </svg>
          </button>

        </div>

        <div class="ui-number-input__live" aria-live="polite"></div>
      </div>
    `;
    this.updateVisuals();
  }

  // ── Events ──────────────────────────────────────────────────────────────

  attachEvents() {
    const root = this.shadowRoot.querySelector('.ui-number-input');
    const pill = this.shadowRoot.querySelector('.ui-number-input__pill');
    const downZone = this.shadowRoot.querySelector('.ui-number-input__zone--down');
    const upZone = this.shadowRoot.querySelector('.ui-number-input__zone--up');
    const valueArea = this.shadowRoot.querySelector('.ui-number-input__value');
    const input = this.shadowRoot.querySelector('.ui-number-input__input');

    // Tap on resting pill → activate
    const pillPointerUp = (e) => {
      if (this._disabled) return;
      if (this._active) {
        // Direct tap on an implicitly-activated component — cancel inactivity timer
        this._clearInactivityTimer();
        return;
      }
      e.stopPropagation();
      this._activate();
    };
    pill.addEventListener('pointerup', pillPointerUp);
    this._handlers.set('pill-pointerup', { element: pill, type: 'pointerup', handler: pillPointerUp });

    // Down zone: pointer down starts hold, pointer up does single step or stops hold
    const downPointerDown = (e) => this._onZonePointerDown(e, -1);
    const downPointerUp = (e) => this._onZonePointerUp(e, -1);
    downZone.addEventListener('pointerdown', downPointerDown);
    downZone.addEventListener('pointerup', downPointerUp);
    this._handlers.set('down-pointerdown', { element: downZone, type: 'pointerdown', handler: downPointerDown });
    this._handlers.set('down-pointerup', { element: downZone, type: 'pointerup', handler: downPointerUp });

    // Up zone: pointer down starts hold, pointer up does single step or stops hold
    const upPointerDown = (e) => this._onZonePointerDown(e, 1);
    const upPointerUp = (e) => this._onZonePointerUp(e, 1);
    upZone.addEventListener('pointerdown', upPointerDown);
    upZone.addEventListener('pointerup', upPointerUp);
    this._handlers.set('up-pointerdown', { element: upZone, type: 'pointerdown', handler: upPointerDown });
    this._handlers.set('up-pointerup', { element: upZone, type: 'pointerup', handler: upPointerUp });

    // Zone pointer leave/cancel → stop hold (no step)
    const stopHold = () => this._stopHold();
    for (const evt of ['pointerleave', 'pointercancel']) {
      downZone.addEventListener(evt, stopHold);
      upZone.addEventListener(evt, stopHold);
      this._handlers.set(`down-${evt}`, { element: downZone, type: evt, handler: stopHold });
      this._handlers.set(`up-${evt}`, { element: upZone, type: evt, handler: stopHold });
    }

    // Value area click → editing
    const valueClick = (e) => {
      if (!this._active || this._editing) return;
      e.stopPropagation();
      this._startEditing();
    };
    valueArea.addEventListener('click', valueClick);
    this._handlers.set('value-click', { element: valueArea, type: 'click', handler: valueClick });

    // Input: filter, commit, cancel
    const inputInput = (e) => {
      e.target.value = e.target.value.replace(/[^0-9.\-]/g, '');
    };
    const inputKeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this._cancelEdit();
      }
    };
    const inputBlur = () => {
      // Defer so zone pointerup can fire before the layout shifts
      requestAnimationFrame(() => {
        if (this._editing) this._commitEdit();
      });
    };
    input.addEventListener('input', inputInput);
    input.addEventListener('keydown', inputKeydown);
    input.addEventListener('blur', inputBlur);
    this._handlers.set('input-input', { element: input, type: 'input', handler: inputInput });
    this._handlers.set('input-keydown', { element: input, type: 'keydown', handler: inputKeydown });
    this._handlers.set('input-blur', { element: input, type: 'blur', handler: inputBlur });

    // Keyboard on root
    const rootKeydown = (e) => this._onKeydown(e);
    root.addEventListener('keydown', rootKeydown);
    this._handlers.set('root-keydown', { element: root, type: 'keydown', handler: rootKeydown });

    // Scroll wheel
    const rootWheel = (e) => this._onWheel(e);
    root.addEventListener('wheel', rootWheel, { passive: false });
    this._handlers.set('root-wheel', { element: root, type: 'wheel', handler: rootWheel });

    // Focus → activate
    const rootFocus = () => {
      if (!this._disabled && !this._active) this._activate();
    };
    root.addEventListener('focus', rootFocus);
    this._handlers.set('root-focus', { element: root, type: 'focus', handler: rootFocus });

    // Outside tap → deactivate (check host element, not shadow internals)
    const self = this;
    this._outsideHandler = (e) => {
      if (!self._active) return;
      const path = e.composedPath ? e.composedPath() : [];
      if (!path.includes(self)) {
        if (self._editing) self._commitEdit();
        self._deactivate();
      }
    };
    document.addEventListener('pointerdown', this._outsideHandler, true);

    // Global pointerup — safety net for when the zone's own pointerup
    // doesn't fire (e.g. pointer drifts off). Skips if zone already handled it.
    this._globalPointerUp = () => {
      if (this._zoneHandledPointerUp) {
        this._zoneHandledPointerUp = false;
        return;
      }
      if (this._holdStartTimer !== null || this._holdTimer !== null) {
        this._stopHold();
      }
    };
    document.addEventListener('pointerup', this._globalPointerUp, true);
  }

  detachEvents() {
    this._handlers.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this._handlers.clear();

    if (this._outsideHandler) {
      document.removeEventListener('pointerdown', this._outsideHandler, true);
      this._outsideHandler = null;
    }
    if (this._globalPointerUp) {
      document.removeEventListener('pointerup', this._globalPointerUp, true);
      this._globalPointerUp = null;
    }
  }

  // ── State transitions ──────────────────────────────────────────────────

  _activate({ implicit = false } = {}) {
    // Deactivate any other active instance first
    if (UINumberInput._activeInstance && UINumberInput._activeInstance !== this) {
      UINumberInput._activeInstance._deactivate();
    }
    UINumberInput._activeInstance = this;
    this._active = true;
    this.updateVisuals();

    // Implicit activation (scroll without click) starts an inactivity timer.
    // Direct interaction (click, tap, focus) cancels it.
    this._clearInactivityTimer();
    if (implicit) this._startInactivityTimer();
  }

  _deactivate() {
    if (UINumberInput._activeInstance === this) {
      UINumberInput._activeInstance = null;
    }
    this._clearInactivityTimer();
    this._active = false;
    this._editing = false;
    this._interacted = false;
    this._steppedInEditing = false;
    this._clearHold();
    this.updateVisuals();
  }

  /** Reset the inactivity timer — called on any direct interaction. */
  _resetInactivityTimer() {
    if (this._inactivityTimer !== null) {
      this._clearInactivityTimer();
      this._startInactivityTimer();
    }
  }

  _startInactivityTimer() {
    this._inactivityTimer = setTimeout(() => {
      this._inactivityTimer = null;
      if (this._active && !this._editing && !this._holding) {
        this._deactivate();
      }
    }, 4000);
  }

  _clearInactivityTimer() {
    if (this._inactivityTimer !== null) {
      clearTimeout(this._inactivityTimer);
      this._inactivityTimer = null;
    }
  }

  _startEditing() {
    this._editing = true;
    this._preEditValue = this._value;
    this.updateVisuals();

    const input = this.shadowRoot.querySelector('.ui-number-input__input');
    input.value = String(this._value);
    // Focus synchronously — iOS/iPadOS requires focus within the user gesture
    // to open the keyboard. Deferring via rAF breaks the gesture chain.
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }

  _commitEdit() {
    const input = this.shadowRoot.querySelector('.ui-number-input__input');
    const raw = input.value.trim();
    const parsed = parseFloat(raw);
    const prev = this._value;

    if (raw === '' || isNaN(parsed)) {
      this._value = this._preEditValue;
    } else {
      this._value = this._clamp(parsed);
    }

    this._editing = false;
    this._steppedInEditing = false;
    if (this._value !== prev) this._interacted = true;
    this.updateVisuals();

    if (this._value !== prev) {
      this._fireChange();
      this._announce();
    }
  }

  _cancelEdit() {
    this._value = this._preEditValue;
    this._editing = false;
    this._steppedInEditing = false;
    this.updateVisuals();
  }

  // ── Stepping ───────────────────────────────────────────────────────────

  /** Returns true if the value changed. */
  _step(delta) {
    const prev = this._value;
    const s = this._stepSize;
    const direction = delta > 0 ? 1 : -1;

    // Check if value is aligned to step grid (relative to min)
    const offset = this._round(this._value - this._min);
    const remainder = this._round(((offset % s) + s) % s);
    const isAligned = remainder === 0;

    let newValue;
    if (isAligned) {
      // Already on a step boundary — step by full delta
      newValue = this._value + delta;
    } else {
      // Snap to nearest step boundary in the direction
      if (direction > 0) {
        newValue = this._min + Math.ceil(offset / s) * s;
      } else {
        newValue = this._min + Math.floor(offset / s) * s;
      }
    }

    this._value = this._clamp(this._round(newValue));
    if (this._value !== prev) {
      this._interacted = true;
      this.updateVisuals();
      return true;
    }
    return false;
  }

  _onZonePointerUp(e, direction) {
    if (!this._active || this._disabled) return;
    e.stopPropagation();
    this._zoneHandledPointerUp = true; // Prevent global handler from racing

    // Already stepped in pointerdown (editing-mode path)
    if (this._steppedInEditing) {
      this._steppedInEditing = false;
      this._stopHold();
      return;
    }

    const wasHolding = this._holding;
    this._stopHold();

    // If we weren't holding, this was a single tap — step once
    if (!wasHolding) {
      if (this._step(direction * this._stepSize)) {
        this._fireChange();
        this._announce();
      }
      this._tapFlash(direction);
    }
  }

  _tapFlash(direction) {
    const root = this.shadowRoot.querySelector('.ui-number-input');
    if (!root) return;

    clearTimeout(this._tapFlashTimer);
    root.classList.remove('is-tapped-up', 'is-tapped-down');

    root.classList.add(direction > 0 ? 'is-tapped-up' : 'is-tapped-down');

    this._tapFlashTimer = setTimeout(() => {
      root.classList.remove('is-tapped-up', 'is-tapped-down');
    }, 600);
  }

  // ── Momentum hold ──────────────────────────────────────────────────────

  _onZonePointerDown(e, direction) {
    if (!this._active || this._disabled) return;
    this._clearInactivityTimer(); // Direct interaction — promote to explicit

    // If editing, commit the typed value first, then step from it.
    // Stay in editing mode so the keyboard remains visible on iPad.
    // Set flag so pointerup doesn't double-step on quick taps.
    if (this._editing) {
      this._steppedInEditing = true;
      const input = this.shadowRoot.querySelector('.ui-number-input__input');
      const parsed = parseFloat(input.value);
      if (!isNaN(parsed)) this._value = this._clamp(parsed);

      if (this._step(direction * this._stepSize)) {
        this._fireChange();
        this._announce();
      }
      input.value = String(this._value);
      const len = input.value.length;
      input.setSelectionRange(len, len);
      this._tapFlash(direction);
      // Fall through to hold timer setup so hold-to-repeat works
    }

    this._holdDirection = direction;
    this._tickCount = 0;
    this._holding = false;

    // Delay before starting hold so quick taps fire click normally
    this._holdStartTimer = setTimeout(() => {
      this._holdTimer = setInterval(() => {
        this._tickCount++;

        if (!this._holding) {
          this._holding = true;
          this.updateVisuals();
        }

        const step = this._getAcceleratedStep(this._tickCount) * this._stepSize;
        this._step(direction * step);
        this._fireInput();
      }, 90);
    }, 200);
  }

  _stopHold() {
    clearTimeout(this._holdStartTimer);
    this._holdStartTimer = null;

    if (this._holdTimer !== null) {
      clearInterval(this._holdTimer);
      this._holdTimer = null;
    }

    if (this._holding) {
      this._holding = false;
      this._fireChange();
      this._announce();
    }

    this._holdDirection = null;
    this._tickCount = 0;
    this.updateVisuals();
  }

  _clearHold() {
    clearTimeout(this._holdStartTimer);
    this._holdStartTimer = null;

    if (this._holdTimer !== null) {
      clearInterval(this._holdTimer);
      this._holdTimer = null;
    }
    this._holding = false;
    this._holdDirection = null;
    this._tickCount = 0;
  }

  /** Spec §4.3: acceleration thresholds */
  _getAcceleratedStep(tick) {
    if (tick >= 35) return 10;
    if (tick >= 18) return 5;
    if (tick >= 6) return 2;
    return 1;
  }

  // ── Scroll wheel ───────────────────────────────────────────────────────

  _onWheel(e) {
    if (this._disabled || this._editing) return;
    e.preventDefault();

    // Activate on scroll if at rest (implicit — starts inactivity timer)
    if (!this._active) this._activate({ implicit: true });

    const direction = e.deltaY < 0 ? 1 : -1;

    if (this._step(direction * this._stepSize)) {
      this._fireChange();
      this._announce();
    }

    // Reset inactivity timer on each scroll tick
    this._resetInactivityTimer();

    // Flash the relevant chevron pink
    this._scrollFlash(direction);
  }

  _scrollFlash(direction) {
    const root = this.shadowRoot.querySelector('.ui-number-input');
    if (!root) return;

    // Clear any existing flash
    clearTimeout(this._scrollFlashTimer);
    root.classList.remove('is-scrolling-up', 'is-scrolling-down');

    // Apply flash class
    root.classList.add(direction > 0 ? 'is-scrolling-up' : 'is-scrolling-down');

    // Remove after transition settles
    this._scrollFlashTimer = setTimeout(() => {
      root.classList.remove('is-scrolling-up', 'is-scrolling-down');
    }, 600);
  }

  // ── Keyboard ───────────────────────────────────────────────────────────

  _onKeydown(e) {
    if (this._disabled) return;

    // If editing, let the input handle its own keys
    if (this._editing) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (!this._active) {
          this._activate();
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (this._active) {
          this._deactivate();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (this._active && this._step(this._stepSize)) {
          this._fireChange();
          this._announce();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (this._active && this._step(-this._stepSize)) {
          this._fireChange();
          this._announce();
        }
        break;
      case 'PageUp':
        e.preventDefault();
        if (this._active && this._step(this._stepSize * 10)) {
          this._fireChange();
          this._announce();
        }
        break;
      case 'PageDown':
        e.preventDefault();
        if (this._active && this._step(-this._stepSize * 10)) {
          this._fireChange();
          this._announce();
        }
        break;
      case 'Home':
        e.preventDefault();
        if (this._active && this._value !== this._min) {
          this._value = this._min;
          this.updateVisuals();
          this._fireChange();
          this._announce();
        }
        break;
      case 'End':
        e.preventDefault();
        if (this._active && this._value !== this._max) {
          this._value = this._max;
          this.updateVisuals();
          this._fireChange();
          this._announce();
        }
        break;
      case 'Tab':
        // Deactivate on tab
        if (this._active) {
          this._deactivate();
        }
        break;
    }
  }

  // ── Events ─────────────────────────────────────────────────────────────

  _fireChange() {
    this.dispatchEvent(new CustomEvent('ui-change', {
      bubbles: true,
      composed: true,
      detail: { value: this._value }
    }));
  }

  _fireInput() {
    this.dispatchEvent(new CustomEvent('ui-input', {
      bubbles: true,
      composed: true,
      detail: { value: this._value }
    }));
  }

  _announce() {
    const live = this.shadowRoot.querySelector('.ui-number-input__live');
    if (live) live.textContent = String(this._value);
  }

  // ── Visual update ──────────────────────────────────────────────────────

  updateVisuals() {
    const root = this.shadowRoot.querySelector('.ui-number-input');
    if (!root) return;

    // Edge case: min === max → force disabled
    const effectiveDisabled = this._disabled || this._min === this._max;

    // State classes on root
    root.classList.toggle('is-active', this._active && !effectiveDisabled);
    root.classList.toggle('is-editing', this._editing);
    root.classList.toggle('is-holding', this._holding);
    root.classList.toggle('is-holding-up', this._holding && this._holdDirection === 1);
    root.classList.toggle('is-holding-down', this._holding && this._holdDirection === -1);
    root.classList.toggle('is-disabled', effectiveDisabled);
    root.classList.toggle('is-at-min', this._value <= this._min);
    root.classList.toggle('is-at-max', this._value >= this._max);
    root.classList.toggle('has-interacted', this._interacted);

    // ARIA
    root.setAttribute('aria-valuenow', String(this._value));
    root.setAttribute('aria-valuemin', String(this._min));
    root.setAttribute('aria-valuemax', String(this._max));
    if (effectiveDisabled) {
      root.setAttribute('aria-disabled', 'true');
    } else {
      root.removeAttribute('aria-disabled');
    }

    // Display text
    const display = this.shadowRoot.querySelector('.ui-number-input__display');
    if (display) display.textContent = this._formatDisplay(this._value);

    // Range fill
    const fill = this.shadowRoot.querySelector('.ui-number-input__range-fill');
    if (fill) {
      const range = this._max - this._min;
      const pct = range > 0 ? ((this._value - this._min) / range) * 100 : 0;
      fill.style.width = `${pct}%`;
    }

    // Sync attribute
    if (this.getAttribute('value') !== String(this._value)) {
      this.setAttribute('value', String(this._value));
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  _clamp(v) {
    return Math.min(this._max, Math.max(this._min, v));
  }

  /** Round to step precision to avoid floating-point drift. */
  _round(v) {
    const decimals = (String(this._stepSize).split('.')[1] || '').length;
    return decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v);
  }

  /** Format value for display — show decimals matching step precision. */
  _formatDisplay(v) {
    const decimals = (String(this._stepSize).split('.')[1] || '').length;
    return decimals > 0 ? v.toFixed(decimals) : String(v);
  }
}

customElements.define('ui-number-input', UINumberInput);
