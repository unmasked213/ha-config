// /config/www/base/helpers.js
// Shared UI component initialization helpers
// Version: 1
// Updated: 11-12-2024

/**
 * Apply theme class to a card element based on Home Assistant theme state.
 * Call this in set hass() and connectedCallback() to keep theme in sync.
 *
 * @param {HTMLElement} element - The card element (typically 'this')
 * @param {Object} hass - Home Assistant object
 *
 * @example
 * set hass(hass) {
 *   this._hass = hass;
 *   applyThemeClass(this, hass);
 *   // ... rest of hass setter
 * }
 */
export function applyThemeClass(element, hass) {
  if (!element || !hass?.themes) return;

  const isDark = hass.themes.darkMode;

  // Debug: uncomment to trace theme application
  // console.log('[applyThemeClass]', element.tagName, 'darkMode:', isDark);

  if (isDark) {
    element.classList.add('dark-theme');
    element.classList.remove('light-theme');
  } else {
    element.classList.add('light-theme');
    element.classList.remove('dark-theme');
  }
}

/**
 * Call a Home Assistant service
 * @param {Object} hass - Home Assistant object
 * @param {string} domain - Service domain (e.g., "script", "light")
 * @param {string} service - Service name (e.g., "turn_on", "upload_document")
 * @param {Object} serviceData - Service data/parameters
 * @returns {Promise} Promise that resolves when service call completes
 */
export async function callService(hass, domain, service, serviceData = {}) {
  return hass.callService(domain, service, serviceData);
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the specified time
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Initialize all input fields within a given root element
 * @param {ShadowRoot|HTMLElement} root - The root element to search for inputs
 */
export function initInputs(root) {
  const inputs = root.querySelectorAll(".ui-input__field");

  inputs.forEach((input) => {
    const pill = input.closest(".ui-input__pill");
    if (!pill) return;
    if (input.dataset.uiInit) return;
    input.dataset.uiInit = "1";

    // Set initial state
    if (input.value) {
      pill.classList.add("has-value");
    }

    // Handle changes
    input.addEventListener("input", () => {
      pill.classList.toggle("has-value", !!input.value);
    });

    // Wire clear button if present
    const clearBtn = pill.querySelector(".ui-input__clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        pill.classList.remove("has-value");
        // Snap to pink instantly (transition: none), then fade out
        pill.classList.add("ui-input--clearing");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              pill.classList.remove("ui-input--clearing");
              pill.classList.add("ui-input--clearing-fade");
              setTimeout(() => pill.classList.remove("ui-input--clearing-fade"), 550);
            }, 350);
          });
        });
        input.focus();
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  });
}

/**
 * Initialize tap press feedback on interactive elements within a given root.
 * Applies a smooth scale-dip animation on click/tap to buttons, info icons,
 * and split button arrows.
 * @param {ShadowRoot|HTMLElement} root - The root element to search within
 */
export function initButtons(root) {
  const TAP_TARGETS = ".ui-btn, .ui-info-icon, .ui-split__arrow";

  root.addEventListener("click", (e) => {
    const el = e.target.closest(TAP_TARGETS);
    if (!el || el.disabled || el.classList.contains("ui-btn--disabled")) return;

    el.classList.remove("is-tap-bouncing");
    requestAnimationFrame(() => {
      el.classList.add("is-tap-bouncing");
    });
  }, true);

  root.addEventListener("animationend", (e) => {
    if (e.animationName === "ui-tap-press") {
      e.target.classList.remove("is-tap-bouncing");
    }
  });
}


/**
 * Initialize all sliders within a given root element
 * @param {ShadowRoot|HTMLElement} root - The root element to search for sliders
 */
export function initSliders(root) {
  const sliders = root.querySelectorAll(".ui-slider");

  sliders.forEach((slider) => {
    const input = slider.querySelector(".ui-slider__input");
    const container = slider.querySelector(".ui-slider__container");
    const trackActive = slider.querySelector(".ui-slider__track-active");
    const trackInactive = slider.querySelector(".ui-slider__track-inactive");
    const thumb = slider.querySelector(".ui-slider__thumb");
    const valueBubble = thumb?.querySelector(".ui-slider__value");

    if (!input || !container || !trackActive || !trackInactive || !thumb || !valueBubble) return;

    // Create rollback indicator element
    const rollback = document.createElement("div");
    rollback.className = "ui-slider__rollback";
    container.appendChild(rollback);

    let dragStartValue = null;
    let isDragging = false;

    const min = parseFloat(input.min);
    const max = parseFloat(input.max);

    const updateSlider = (value) => {
      // Get fresh width each time in case of resize
      const containerWidth = container.offsetWidth;
      if (containerWidth === 0) return; // Skip if not laid out yet

      const percentage = ((value - min) / (max - min)) * 100;
      const thumbPosition = (percentage / 100) * containerWidth;

      // Thumb and gap dimensions
      const styles = getComputedStyle(slider);
      const thumbWidth = parseFloat(styles.getPropertyValue('--ui-slider-thumb-width-rest')) || 6;
      const gap = parseFloat(styles.getPropertyValue('--ui-slider-gap-rest')) || 4;

      // Calculate track widths with gaps
      const activeWidth = Math.max(0, thumbPosition - gap);
      const inactiveStart = thumbPosition + gap;
      const inactiveWidth = Math.max(0, containerWidth - inactiveStart);

      // Update tracks
      trackActive.style.width = `${activeWidth}px`;
      trackInactive.style.width = `${inactiveWidth}px`;

      // Update thumb position
      thumb.style.left = `${thumbPosition}px`;

      // Update rollback indicator (value-based comparison avoids pixel timing glitches)
      if (isDragging && dragStartValue !== null && value < dragStartValue) {
        const startPercent = ((dragStartValue - min) / (max - min)) * 100;
        const startPosition = (startPercent / 100) * containerWidth;
        const rollbackLeft = thumbPosition + gap;
        rollback.style.left = `${rollbackLeft}px`;
        rollback.style.width = `${startPosition - rollbackLeft}px`;
        slider.classList.add("ui-slider--rolling-back");
      } else {
        slider.classList.remove("ui-slider--rolling-back");
      }

      // Update value bubble
      valueBubble.textContent = Math.round(value);

      // Handle edge carving
      const edgeThreshold = parseFloat(styles.getPropertyValue('--ui-space-5')) || 20;

      if (thumbPosition < edgeThreshold) {
        // Near left edge - fully rounded right side of active track
        trackActive.style.borderTopRightRadius = 'var(--ui-slider-track-radius, 12px)';
        trackActive.style.borderBottomRightRadius = 'var(--ui-slider-track-radius, 12px)';
        trackInactive.style.borderTopLeftRadius = 'var(--ui-slider-track-radius, 12px)';
        trackInactive.style.borderBottomLeftRadius = 'var(--ui-slider-track-radius, 12px)';
      } else if (thumbPosition > containerWidth - edgeThreshold) {
        // Near right edge - fully rounded left side of inactive track
        trackActive.style.borderTopRightRadius = 'var(--ui-slider-track-radius, 12px)';
        trackActive.style.borderBottomRightRadius = 'var(--ui-slider-track-radius, 12px)';
        trackInactive.style.borderTopLeftRadius = 'var(--ui-slider-track-radius, 12px)';
        trackInactive.style.borderBottomLeftRadius = 'var(--ui-slider-track-radius, 12px)';
      } else {
        // Middle - tight carving (4px radius on inner edges)
        trackActive.style.borderTopRightRadius = 'var(--ui-slider-thumb-radius, 4px)';
        trackActive.style.borderBottomRightRadius = 'var(--ui-slider-thumb-radius, 4px)';
        trackInactive.style.borderTopLeftRadius = 'var(--ui-slider-thumb-radius, 4px)';
        trackInactive.style.borderBottomLeftRadius = 'var(--ui-slider-thumb-radius, 4px)';
      }
    };

    // Initial update after layout completes
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateSlider(parseFloat(input.value));
      });
    });

    // Handle input changes
    input.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      // Capture drag start on first input event after press
      // (input fires AFTER the browser has jumped the thumb to click position)
      if (isDragging && dragStartValue === null) {
        dragStartValue = value;
      }
      updateSlider(value);
    });

    // Handle press states
    const onStart = () => {
      slider.classList.add("ui-slider--pressed");
      isDragging = true;
      dragStartValue = null; // Will be captured on first input event
      // Disable transitions during dragging for instant responsiveness (< 16ms target)
      thumb.style.transition = 'width var(--ui-slider-motion-duration) var(--ui-slider-motion-easing), background-color var(--ui-slider-motion-duration) var(--ui-slider-motion-easing)';
      trackActive.style.transition = 'none';
      trackInactive.style.transition = 'none';
    };

    const onEnd = () => {
      slider.classList.remove("ui-slider--pressed");
      slider.classList.remove("ui-slider--rolling-back");
      isDragging = false;
      dragStartValue = null;
      // Re-enable transitions after dragging
      thumb.style.transition = '';
      trackActive.style.transition = '';
      trackInactive.style.transition = '';
    };

    input.addEventListener("mousedown", onStart);
    input.addEventListener("mouseup", onEnd);
    input.addEventListener("mouseleave", onEnd);
    input.addEventListener("touchstart", onStart, { passive: true });
    input.addEventListener("touchend", onEnd);
    input.addEventListener("touchcancel", onEnd);

    // Handle window resize
    const resizeObserver = new ResizeObserver(() => {
      updateSlider(parseFloat(input.value));
    });
    resizeObserver.observe(container);
  });
}

// -----------------------------------------------------------------------
// HA HELPER ENTITY READERS
// -----------------------------------------------------------------------

/**
 * Read a number value from an input_number helper entity.
 * @param {Object} hass - Home Assistant object
 * @param {string} entityId - Entity ID (e.g. "input_number.my_setting")
 * @param {number} defaultValue - Fallback if entity is unavailable
 * @returns {number}
 */
export function getHelperNumber(hass, entityId, defaultValue) {
  const state = hass?.states?.[entityId];
  if (!state || state.state === "unavailable" || state.state === "unknown") return defaultValue;
  const val = parseFloat(state.state);
  return isNaN(val) ? defaultValue : val;
}

/**
 * Read a boolean value from an input_boolean helper entity.
 * @param {Object} hass - Home Assistant object
 * @param {string} entityId - Entity ID (e.g. "input_boolean.my_toggle")
 * @param {boolean} defaultValue - Fallback if entity is unavailable
 * @returns {boolean}
 */
export function getHelperBoolean(hass, entityId, defaultValue) {
  const state = hass?.states?.[entityId];
  if (!state || state.state === "unavailable" || state.state === "unknown") return defaultValue;
  return state.state === "on";
}

/**
 * Read a string value from an input_select helper entity.
 * @param {Object} hass - Home Assistant object
 * @param {string} entityId - Entity ID (e.g. "input_select.my_option")
 * @param {string} defaultValue - Fallback if entity is unavailable
 * @returns {string}
 */
export function getHelperSelect(hass, entityId, defaultValue) {
  const state = hass?.states?.[entityId];
  if (!state || state.state === "unavailable" || state.state === "unknown") return defaultValue;
  return state.state;
}

/**
 * Persist a value to an HA helper entity (input_number, input_boolean, or input_select).
 * Automatically determines the correct service based on entity ID prefix.
 * @param {Object} hass - Home Assistant object
 * @param {string} entityId - Entity ID
 * @param {number|boolean|string} value - Value to persist
 */
export async function persistHelper(hass, entityId, value) {
  if (!hass || !entityId) return;

  const isBoolean = entityId.startsWith("input_boolean.");
  const isSelect = entityId.startsWith("input_select.");
  let domain, service, serviceData;

  if (isBoolean) {
    domain = "input_boolean";
    service = value ? "turn_on" : "turn_off";
    serviceData = { entity_id: entityId };
  } else if (isSelect) {
    domain = "input_select";
    service = "select_option";
    serviceData = { entity_id: entityId, option: value };
  } else {
    domain = "input_number";
    service = "set_value";
    serviceData = { entity_id: entityId, value };
  }

  await hass.callService(domain, service, serviceData);
}