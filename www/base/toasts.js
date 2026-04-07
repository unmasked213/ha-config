// /config/www/base/toasts.js

// ============================================================
// TOAST NOTIFICATION SYSTEM
// Stacking notifications with optional protruding icons
// ============================================================
//
// NOTE: Toasts are appended to document.body (not shadow DOM)
// and use CSS classes from components.js with design system tokens.
//
// USAGE:
//
// 1. From cards/components:
//    import { showToast } from '/local/base/toasts.js';
//    showToast({ message: 'Hello world!' });
//
// 2. With icon:
//    showToast({ message: 'Saved!', icon: 'mdi:check' });
//
// 3. Full options:
//    showToast({
//      message: 'File uploaded successfully',
//      icon: 'mdi:cloud-upload',
//      duration: 5000,
//      onClose: () => console.log('Toast closed')
//    });
//
// ============================================================

// ============================================================
// TOAST MANAGER (Singleton)
// ============================================================

const CONTAINER_ID = 'ui-toast-container';
const ANIMATION_MS = 300;
const DEFAULT_DURATION = 6000;
const MAX_TOASTS = 10;

let container = null;
const removing = new WeakSet();

/**
 * Check for reduced motion preference
 */
function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Ensures the toast container exists in the DOM
 */
function ensureContainer() {
  if (container && container.isConnected) return container;

  container = document.getElementById(CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.className = 'ui-toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Injects required styles if not using components.js stylesheet
 * This is a fallback for contexts where adoptedStyleSheets aren't available
 */
function ensureStyles() {
  const styleId = 'ui-toast-styles';
  if (document.getElementById(styleId)) return;

  // Only inject if .ui-toast-container styles aren't already present
  const testEl = document.createElement('div');
  testEl.className = 'ui-toast-container';
  testEl.style.cssText = 'position: absolute; visibility: hidden;';
  document.body.appendChild(testEl);
  const styles = getComputedStyle(testEl);
  const hasStyles = styles.position === 'fixed';
  document.body.removeChild(testEl);

  if (hasStyles) return;

  // Inject minimal fallback styles using CSS custom properties
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .ui-toast-container {
      position: fixed;
      bottom: var(--ui-toast-position-bottom, 100px);
      right: var(--ui-toast-position-right, 18px);
      z-index: var(--ui-toast-z-index, 99999);
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--ui-toast-stack-gap, 16px);
      pointer-events: none;
    }
    .ui-toast {
      position: relative;
      background: var(--ui-toast-bg, var(--ui-overlay-bg, rgb(40, 43, 54)));
      color: var(--ui-toast-text, var(--ui-text, rgb(228, 228, 242)));
      padding: var(--ui-toast-padding-y, 12px) var(--ui-toast-padding-x, 16px);
      border-radius: var(--ui-toast-radius, 12px);
      border: var(--ui-toast-border-width, 3px) solid var(--ui-toast-border-color, rgb(255, 46, 146));
      max-width: var(--ui-toast-max-width, 400px);
      box-shadow: var(--ui-shadow-3, 0 4px 12px rgba(0, 0, 0, 0.78));
      font-size: var(--ui-font-m, 1rem);
      line-height: 1.5;
      pointer-events: auto;
      animation: ui-toast-in var(--ui-toast-motion-in, 600ms cubic-bezier(0.34, 1.56, 0.64, 1)) forwards;
    }
    .ui-toast--with-icon {
      padding-left: calc(var(--ui-toast-padding-x, 16px) + var(--ui-toast-icon-protrusion, 19px) + 8px);
    }
    .ui-toast__icon {
      position: absolute;
      left: calc(-1 * var(--ui-toast-icon-protrusion, 19px));
      top: calc(-1 * var(--ui-toast-icon-protrusion, 19px));
      width: var(--ui-toast-icon-size, 38px);
      height: var(--ui-toast-icon-size, 38px);
      background: var(--ui-toast-icon-bg, rgb(255, 46, 146));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--ui-shadow-2, 0 2px 8px rgba(0, 0, 0, 0.25));
    }
    .ui-toast__icon ha-icon {
      color: var(--ui-toast-icon-color, rgb(255, 255, 255));
      --mdc-icon-size: calc(var(--ui-toast-icon-size, 38px) * 0.55);
    }
    .ui-toast__close {
      position: absolute;
      top: var(--ui-toast-close-offset, -10px);
      right: var(--ui-toast-close-offset, -10px);
      width: var(--ui-toast-close-size, 22px);
      height: var(--ui-toast-close-size, 22px);
      border-radius: 50%;
      background: var(--ui-toast-close-bg, rgba(0, 0, 0, 0.7));
      color: var(--ui-toast-close-color, rgb(255, 255, 255));
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--ui-font-s, 0.86rem);
      font-weight: 700;
      cursor: pointer;
      opacity: 0;
      transition: opacity var(--ui-modal-backdrop-in, 120ms ease-out), background var(--ui-modal-backdrop-in, 120ms ease-out);
      box-shadow: var(--ui-shadow-2, 0 2px 8px rgba(0, 0, 0, 0.25));
    }
    .ui-toast:hover .ui-toast__close { opacity: 1; }
    .ui-toast__close:hover { background: var(--ui-toast-close-bg-hover, rgba(0, 0, 0, 0.9)); }
    .ui-toast--exiting {
      animation: ui-toast-out var(--ui-toast-motion-out, 150ms cubic-bezier(0.5, 0, 1, 1)) forwards;
    }
    @keyframes ui-toast-in {
      0% { transform: translateY(10px) scaleX(0.6); opacity: 0; }
      100% { transform: translateY(0) scaleX(1); opacity: 1; }
    }
    @keyframes ui-toast-out {
      0% { opacity: 1; transform: translateX(0); }
      100% { opacity: 0; transform: translateX(10px); }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Removes a toast with exit animation
 */
function removeToast(toastEl, onClose) {
  if (!toastEl || removing.has(toastEl)) return Promise.resolve();
  removing.add(toastEl);

  // Clear any existing timer
  if (toastEl._timer) {
    clearTimeout(toastEl._timer);
    toastEl._timer = null;
  }

  toastEl.classList.add('ui-toast--exiting');

  return new Promise(resolve => {
    setTimeout(() => {
      toastEl.remove();
      if (typeof onClose === 'function') onClose();
      resolve();
    }, ANIMATION_MS);
  });
}

/**
 * Enforces maximum toast limit by removing oldest
 */
async function enforceMaxToasts(containerEl, max = MAX_TOASTS) {
  while (containerEl.children.length >= max) {
    const oldest = containerEl.firstElementChild;
    if (oldest) {
      await removeToast(oldest, oldest._onClose);
    }
  }
}

/**
 * Sets up hover-to-pause behaviour on a toast
 */
function setupHoverPause(toastEl, duration, onClose) {
  let startTime = Date.now();
  let remaining = duration;
  let paused = false;

  const scheduleRemoval = () => {
    toastEl._timer = setTimeout(() => removeToast(toastEl, onClose), remaining);
  };

  toastEl.addEventListener('mouseenter', () => {
    if (!paused) {
      clearTimeout(toastEl._timer);
      remaining -= Date.now() - startTime;
      paused = true;
    }
  });

  toastEl.addEventListener('mouseleave', () => {
    if (paused) {
      startTime = Date.now();
      paused = false;
      scheduleRemoval();
    }
  });

  return scheduleRemoval;
}

/**
 * Creates a toast DOM element
 */
function createToastElement(options) {
  const {
    message,
    icon,
    color,
    onClose
  } = options;

  const hasIcon = Boolean(icon?.trim());

  const toast = document.createElement('div');
  toast.className = 'ui-toast' + (hasIcon ? ' ui-toast--with-icon' : '');
  toast._onClose = onClose;

  // Apply custom color to border and icon if provided
  if (color) {
    toast.style.borderColor = color;
  }

  // Message text
  const textNode = document.createTextNode(message);
  toast.appendChild(textNode);

  // Protruding icon (if provided)
  if (hasIcon) {
    const iconWrap = document.createElement('div');
    iconWrap.className = 'ui-toast__icon';

    // Apply custom color to icon background if provided
    if (color) {
      iconWrap.style.background = color;
    }

    const haIcon = document.createElement('ha-icon');
    haIcon.setAttribute('icon', icon);
    iconWrap.appendChild(haIcon);

    toast.appendChild(iconWrap);
  }

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'ui-toast__close';
  closeBtn.innerHTML = '×';
  closeBtn.setAttribute('aria-label', 'Close notification');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeToast(toast, onClose);
  });
  toast.appendChild(closeBtn);

  return toast;
}

/**
 * Shows a toast notification
 *
 * @param {Object} options - Toast configuration
 * @param {string} options.message - The message to display (required)
 * @param {string} [options.icon] - MDI icon name (e.g., 'mdi:check')
 * @param {string} [options.color] - CSS color for border and icon background
 * @param {number} [options.duration=6000] - Time in ms before auto-dismiss
 * @param {Function} [options.onClose] - Callback when toast is closed
 * @returns {Object} Toast controller with dismiss() method
 */
export function showToast(options) {
  if (!options?.message) {
    console.warn('[ui-toast] No message provided');
    return null;
  }

  const {
    message,
    icon = '',
    color = '',
    duration = DEFAULT_DURATION,
    onClose
  } = options;

  ensureStyles();
  const containerEl = ensureContainer();

  // Enforce max toasts (async but we don't wait)
  enforceMaxToasts(containerEl, MAX_TOASTS);

  // Create and append toast
  const toast = createToastElement({ message, icon, color, onClose });
  containerEl.appendChild(toast);

  // Set up auto-dismiss with hover pause
  const scheduleRemoval = setupHoverPause(toast, duration, onClose);
  scheduleRemoval();

  // Return controller for programmatic dismissal
  return {
    dismiss: () => removeToast(toast, onClose),
    element: toast
  };
}

/**
 * Removes all current toasts
 */
export function clearAllToasts() {
  const containerEl = document.getElementById(CONTAINER_ID);
  if (!containerEl) return;

  const toasts = Array.from(containerEl.children);
  toasts.forEach(toast => removeToast(toast, toast._onClose));
}

/**
 * Gets the current toast count
 */
export function getToastCount() {
  const containerEl = document.getElementById(CONTAINER_ID);
  return containerEl ? containerEl.children.length : 0;
}
