// /config/www/base/circle-slider.js
//
// CIRCULAR SLIDER COMPONENT
// =========================
// Custom pointer-based drag handling for vertical control:
//   - Drag UP = increase value
//   - Drag DOWN = decrease value
//
// Uses custom pointer events instead of native range input behavior
// to provide a "drag from anywhere" UX. The native input is hidden
// and exists only for accessibility.
//
// VARIANTS:
//   type="number" (default): For number entities. Shows rollback indicator
//                            on decrease. Tap does nothing.
//   type="light": For light entities. No rollback indicator.
//                 Quick tap (<200ms, <5 delta) triggers toggle.

import "/local/base/foundation.js";
import { uiComponents } from "/local/base/components.js";

class UICircleSlider extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Internal state
    this._value = 50;
    this._min = 0;
    this._max = 100;
    this._step = 1;
    this._size = 90;
    this._strokeWidth = 3;
    this._showRollback = true;
    this._label = "Circular Slider";
    this._disabled = false;
    this._unit = "";
    this._type = "number"; // "number" or "interactive" (legacy: "light")

    // Interaction tracking
    this._startTime = 0;
    this._startValue = 0;
    this._startY = 0;
    this._isDragging = false;

    // Drag sensitivity: pixels of vertical drag per 1% value change
    // Lower = more sensitive. 200px drag covers full 0-100 range.
    this._dragSensitivity = 2;

    // Fixed radius matching button-card reference (41% of viewBox)
    this._radius = 20.5;

    // Bound handlers for cleanup
    this._boundHandlers = null;
  }

  static get observedAttributes() {
    return [
      "value", "min", "max", "step", "size", "stroke-width",
      "show-rollback", "label", "disabled", "unit", "type"
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "value":
        this._value = parseFloat(newValue) || 0;
        break;
      case "min":
        this._min = parseFloat(newValue) || 0;
        break;
      case "max":
        this._max = parseFloat(newValue) || 100;
        break;
      case "step":
        this._step = parseFloat(newValue) || 1;
        break;
      case "size":
        this._size = parseFloat(newValue) || 90;
        break;
      case "stroke-width":
        this._strokeWidth = parseFloat(newValue) || 3;
        break;
      case "show-rollback":
        this._showRollback = newValue !== "false";
        break;
      case "label":
        this._label = newValue || "Circular Slider";
        break;
      case "disabled":
        this._disabled = newValue !== null;
        break;
      case "unit":
        this._unit = newValue ?? "";
        break;
      case "type":
        this._type = (newValue === "interactive" || newValue === "light") ? "interactive" : "number";
        break;
    }

    this.updateVisuals();
  }

  connectedCallback() {
    this.shadowRoot.adoptedStyleSheets = [window.uiFoundation, uiComponents];
    this._inheritTheme();
    this._observeTheme();
    this.render();
    this.attachEvents();
  }

  disconnectedCallback() {
    this.detachEvents();
    if (this._themeObserver) {
      this._themeObserver.disconnect();
      this._themeObserver = null;
    }
  }

  /** Inherit theme class from parent card host (fallback when hass is not passed). */
  _inheritTheme() {
    const host = this.getRootNode()?.host;
    if (!host) return;
    const isDark = host.classList.contains('dark-theme');
    this.classList.toggle('dark-theme', isDark);
    this.classList.toggle('light-theme', !isDark);
    // SVG fill is set programmatically — must re-sync when theme changes
    this._syncSvgFill();
  }

  /** Watch parent card host for theme class changes. */
  _observeTheme() {
    const host = this.getRootNode()?.host;
    if (!host) return;
    this._themeObserver = new MutationObserver(() => this._inheritTheme());
    this._themeObserver.observe(host, { attributes: true, attributeFilter: ['class'] });
  }

  render() {
    const disabledClass = this._disabled ? " ui-circle-slider--disabled" : "";
    const circumference = 2 * Math.PI * this._radius;

    this.style.setProperty("--ui-circle-size", `${this._size}px`);
    this.style.setProperty("--ui-circle-stroke-width", `${this._strokeWidth}px`);

    this.shadowRoot.innerHTML = `
      <div
        class="ui-circle-slider${disabledClass}"
        role="slider"
        aria-label="${this._label}"
        aria-valuemin="${this._min}"
        aria-valuemax="${this._max}"
        aria-valuenow="${this._value}"
        tabindex="${this._disabled ? -1 : 0}"
      >
        <svg class="ui-circle-slider__svg" viewBox="0 0 50 50">
          <!-- Filled background circle -->
          <circle
            class="ui-circle-slider__background"
            cx="25"
            cy="25"
            r="${this._radius}"
          />
          <circle
            class="ui-circle-slider__track"
            cx="25"
            cy="25"
            r="${this._radius}"
          />
          <!-- Rollback renders BELOW fill so active track is always on top -->
          <circle
            class="ui-circle-slider__rollback"
            cx="25"
            cy="25"
            r="${this._radius}"
            stroke-dasharray="0 ${circumference}"
            stroke-dashoffset="0"
          />
          <circle
            class="ui-circle-slider__fill"
            cx="25"
            cy="25"
            r="${this._radius}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${circumference}"
          />
        </svg>

        <div class="ui-circle-slider__value">
          <span class="ui-circle-slider__value-number">${this._formatValue(this._value)}</span><span class="ui-circle-slider__unit">${this._unit}</span>
        </div>

        <!-- Hidden input for accessibility only -->
        <input
          type="range"
          class="ui-circle-slider__input"
          min="${this._min}"
          max="${this._max}"
          step="${this._step}"
          value="${this._value}"
          ${this._disabled ? "disabled" : ""}
          aria-hidden="true"
          tabindex="-1"
        />
      </div>
    `;

    this.updateVisuals();
    this._syncSvgFill();
  }

  // Resolve --ui-surface-alt-2 from computed styles and apply directly
  // to the SVG background circle. Called on render and theme change only
  // (not during drag) to avoid forced recalc on every frame.
  // Workaround: iOS Safari doesn't reliably inherit CSS custom properties
  // into SVG fill attributes inside shadow DOM.
  _syncSvgFill() {
    const container = this.shadowRoot?.querySelector(".ui-circle-slider");
    const bgCircle = this.shadowRoot?.querySelector(".ui-circle-slider__background");
    if (!container || !bgCircle) return;

    const bg = getComputedStyle(container).getPropertyValue("--ui-surface-alt-2").trim();
    if (bg) bgCircle.style.fill = bg;
  }

  detachEvents() {
    if (!this._boundHandlers) return;

    const container = this.shadowRoot?.querySelector(".ui-circle-slider");

    if (container) {
      container.removeEventListener("pointerdown", this._boundHandlers.onStart);
      container.removeEventListener("pointermove", this._boundHandlers.onMove);
      container.removeEventListener("pointerup", this._boundHandlers.onEnd);
      container.removeEventListener("pointercancel", this._boundHandlers.onEnd);
      container.removeEventListener("keydown", this._boundHandlers.onKeydown);
      container.removeEventListener("wheel", this._boundHandlers.onWheel);
    }

    this._boundHandlers = null;
  }

  attachEvents() {
    this.detachEvents();

    const container = this.shadowRoot.querySelector(".ui-circle-slider");
    const input = this.shadowRoot.querySelector(".ui-circle-slider__input");

    if (!container || !input) return;

    const onStart = (e) => {
      if (this._disabled) return;
      e.preventDefault();

      this._isDragging = true;
      this._startY = e.clientY;
      this._startValue = this._value;
      this._startTime = Date.now();

      container.classList.add("ui-circle-slider--dragging");
      container.setPointerCapture(e.pointerId);

      this.dispatchEvent(new CustomEvent("ui-input", {
        detail: { value: this._value, dragging: true },
        bubbles: true,
        composed: true
      }));
    };

    const onMove = (e) => {
      if (!this._isDragging) return;

      // Calculate value change from vertical movement
      // Moving UP (decreasing Y) = increasing value
      const deltaY = this._startY - e.clientY;
      const deltaPercent = deltaY / this._dragSensitivity;
      const range = this._max - this._min;
      const rawValue = this._startValue + (deltaPercent / 100) * range;
      // Step-aware rounding: snap to nearest step
      const steppedValue = Math.round(rawValue / this._step) * this._step;
      const newValue = Math.max(this._min, Math.min(this._max, steppedValue));

      if (newValue !== this._value) {
        this._value = newValue;
        input.value = newValue; // Sync for accessibility
        this.updateVisuals();

        this.dispatchEvent(new CustomEvent("ui-input", {
          detail: { value: this._value, dragging: true },
          bubbles: true,
          composed: true
        }));
      }
    };

    const onEnd = (e) => {
      if (!this._isDragging) return;

      this._isDragging = false;
      container.classList.remove("ui-circle-slider--dragging");

      if (e.pointerId !== undefined) {
        container.releasePointerCapture(e.pointerId);
      }

      const duration = Date.now() - this._startTime;
      const valueDelta = Math.abs(this._value - this._startValue);

      // Tap detection: quick interaction (<200ms) with minimal value change (<5)
      if (duration < 200 && valueDelta < 5) {
        if (this._type === "interactive") {
          // Trigger wobble animation
          container.classList.remove("ui-circle-slider--wobble");
          void container.offsetWidth;
          container.classList.add("ui-circle-slider--wobble");

          // Interactive mode: tap triggers action
          this.dispatchEvent(new CustomEvent("ui-tap", {
            detail: { action: "toggle" },
            bubbles: true,
            composed: true
          }));
        } else {
          // Number mode: tap does nothing significant
          this.dispatchEvent(new CustomEvent("ui-tap", {
            detail: {},
            bubbles: true,
            composed: true
          }));
        }
      } else {
        // Normal drag completion - emit value change
        this.dispatchEvent(new CustomEvent("ui-change", {
          detail: { value: this._value },
          bubbles: true,
          composed: true
        }));
      }

      this.updateVisuals();
    };

    const onKeydown = (e) => {
      if (this._disabled) return;

      let newValue = this._value;
      const step = this._step;

      switch (e.key) {
        case "ArrowUp":
        case "ArrowRight":
          newValue = Math.min(this._max, this._value + step);
          e.preventDefault();
          break;
        case "ArrowDown":
        case "ArrowLeft":
          newValue = Math.max(this._min, this._value - step);
          e.preventDefault();
          break;
        case "Home":
          newValue = this._min;
          e.preventDefault();
          break;
        case "End":
          newValue = this._max;
          e.preventDefault();
          break;
        default:
          return;
      }

      this._value = newValue;
      input.value = newValue;
      this.updateVisuals();

      this.dispatchEvent(new CustomEvent("ui-change", {
        detail: { value: newValue },
        bubbles: true,
        composed: true
      }));
    };

    const onWheel = (e) => {
      if (this._disabled) return;
      e.preventDefault();

      // Scroll up (negative deltaY) = increase, scroll down = decrease
      const direction = e.deltaY < 0 ? 1 : -1;
      const newValue = Math.max(
        this._min,
        Math.min(this._max, this._value + direction * this._step)
      );

      if (newValue !== this._value) {
        this._value = newValue;
        input.value = newValue;
        this.updateVisuals();

        this.dispatchEvent(new CustomEvent("ui-change", {
          detail: { value: newValue },
          bubbles: true,
          composed: true
        }));
      }
    };

    this._boundHandlers = { onStart, onMove, onEnd, onKeydown, onWheel };

    container.addEventListener("pointerdown", onStart);
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerup", onEnd);
    container.addEventListener("pointercancel", onEnd);
    container.addEventListener("keydown", onKeydown);
    container.addEventListener("wheel", onWheel, { passive: false });
  }

  updateVisuals() {
    const container = this.shadowRoot?.querySelector(".ui-circle-slider");
    const fillCircle = this.shadowRoot?.querySelector(".ui-circle-slider__fill");
    const rollbackCircle = this.shadowRoot?.querySelector(".ui-circle-slider__rollback");
    const valueDisplay = this.shadowRoot?.querySelector(".ui-circle-slider__value-number");
    const input = this.shadowRoot?.querySelector(".ui-circle-slider__input");

    if (!container || !fillCircle || !rollbackCircle) return;

    const percentage = ((this._value - this._min) / (this._max - this._min)) * 100;
    const circumference = 2 * Math.PI * this._radius;
    const offset = circumference * (1 - percentage / 100);

    fillCircle.style.strokeDashoffset = offset;

    // ASYMMETRIC ROLLBACK INDICATOR
    // Shows the "gap" between current value and start value when decreasing.
    // Rollback stays fixed at start position; active fill moves on top of it.
    const showRollback =
      this._isDragging &&
      this._showRollback &&
      this._value < this._startValue;

    if (showRollback) {
      // Rollback shows from 0 to startValue (stays fixed)
      const startPct = ((this._startValue - this._min) / (this._max - this._min)) * 100;
      const startOffset = circumference * (1 - startPct / 100);
      rollbackCircle.style.strokeDashoffset = startOffset;
      rollbackCircle.style.strokeDasharray = circumference;  // Full circle dasharray
      rollbackCircle.classList.add("visible");
    } else {
      rollbackCircle.style.strokeDasharray = `0 ${circumference}`;
      rollbackCircle.classList.remove("visible");
    }

    if (valueDisplay) {
      valueDisplay.textContent = this._formatValue(this._value);
    }

    if (input) {
      input.value = this._value;
    }

    container?.setAttribute("aria-valuenow", this._value);
  }

  _formatValue(value) {
    const decimals = this._step < 1 ? Math.abs(Math.floor(Math.log10(this._step))) : 0;
    return value.toFixed(decimals);
  }

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = Math.max(this._min, Math.min(this._max, parseFloat(val) || 0));
    this.updateVisuals();
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(val) {
    this._disabled = Boolean(val);
    this.render();
    this.attachEvents();
  }

  get type() {
    return this._type;
  }

  set type(val) {
    this._type = (val === "interactive" || val === "light") ? "interactive" : "number";
    this.updateVisuals();
  }
}

customElements.define("ui-circle-slider", UICircleSlider);
