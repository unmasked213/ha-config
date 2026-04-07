// /config/www/base/screen-border.js

// ============================================================
// SCREEN BORDER FLASH EFFECT
// Animated border around the viewport for attention-grabbing alerts
// ============================================================
//
// SEVERITY HIERARCHY
// ──────────────────
// This component is reserved for CRITICAL / DESTRUCTIVE alerts only:
//   - WebSocket disconnection or reconnection failure
//   - Data-integrity errors (failed saves, corrupt state)
//   - Unrecoverable runtime exceptions
//
// Do NOT use for routine confirmations (CRUD success, copy-to-clipboard,
// setting changes). Those belong in the toast system (toast.js).
//
// NOTE: This is a Home Assistant-specific feature that creates
// an SVG border around the screen, respecting the sidebar width.
//
// USAGE:
//
// import { flashScreenBorder } from '/local/base/screen-border.js';
//
// // Basic usage (uses --ui-pink from foundation.js)
// flashScreenBorder();
//
// // With options
// flashScreenBorder({
//   duration: 6000,
//   color: 'rgb(255, 46, 146)',
//   stroke: 14,
//   cornerRadius: 32,
//   inset: 64
// });
//
// ============================================================

const OVERLAY_ID = 'ui-screen-border-overlay';
const STYLE_ID = 'ui-screen-border-styles';
const TOAST_CONTAINER_ID = 'ui-toast-container';
const SVG_NS = 'http://www.w3.org/2000/svg';

let overlay = null;
let fadeTimer = null;
let monitorsInstalled = false;
let cutoutMonitored = false;
let rafScheduled = false;
let lastSidebarW = -1;

/**
 * Resolves a CSS custom property to its computed rgb/hex value.
 * Falls back to the provided default if the property is unset.
 */
function resolveToken(property, fallback) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(property).trim();
  return value || fallback;
}

// Default configuration
const DEFAULTS = {
  duration: 6000,
  // Resolved lazily via resolveToken() in flashScreenBorder() so the
  // SVG stroke gets a concrete rgb value from the --ui-pink token.
  color: null,
  stroke: 14,
  cornerRadius: 32,
  inset: 64,
  zIndex: 99998,
  cutout: {
    enabled: true,
    padding: 18
  }
};

/**
 * Injects required CSS for the screen border
 */
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes ui-border-enter {
      0% { transform: scale(1.012); opacity: 0; }
      30% { opacity: 1; }
      50% { transform: scale(0.995); }
      75% { transform: scale(1.003); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes ui-border-pulse-a {
      0% { transform: scale(1); }
      30% { transform: scale(1.007); }
      60% { transform: scale(0.997); }
      85% { transform: scale(1.002); }
      100% { transform: scale(1); }
    }
    @keyframes ui-border-pulse-b {
      0% { transform: scale(1); }
      30% { transform: scale(1.007); }
      60% { transform: scale(0.997); }
      85% { transform: scale(1.002); }
      100% { transform: scale(1); }
    }
    #${OVERLAY_ID} {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      opacity: 0;
      will-change: opacity, left, width;
      transition: left 0.2s, width 0.2s;
      z-index: var(--ui-screen-border-z, 99998);
    }
    #${OVERLAY_ID}.is-visible {
      opacity: 1;
    }
    #${OVERLAY_ID}.is-fading {
      opacity: 0;
      transition: left 0.2s, width 0.2s, opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    #${OVERLAY_ID} svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      transform-origin: center center;
    }
    @media (prefers-reduced-motion: reduce) {
      #${OVERLAY_ID} svg {
        animation: none !important;
      }
      #${OVERLAY_ID} {
        transition: opacity 0.2s !important;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Creates or retrieves the overlay element
 */
function ensureOverlay() {
  let el = document.getElementById(OVERLAY_ID);

  if (el?._svg) return el;

  if (!el) {
    el = document.createElement('div');
    el.id = OVERLAY_ID;
    document.body.appendChild(el);
  } else {
    el.textContent = '';
  }

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('preserveAspectRatio', 'none');
  el.appendChild(svg);
  el._svg = svg;

  return el;
}

/**
 * Gets the current sidebar width in Home Assistant
 */
function getSidebarWidth() {
  try {
    const ha = document.querySelector('home-assistant');
    const main = ha?.shadowRoot?.querySelector('home-assistant-main');
    const drawer = main?.shadowRoot?.querySelector('ha-drawer');

    if (!drawer) return 0;

    // Try to get sidebar element directly
    const sidebar = drawer.querySelector('ha-sidebar');
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      if (rect.width > 0 && rect.left >= 0) return Math.round(rect.right);
    }

    // Fallback: check drawer shadow DOM
    if (drawer.shadowRoot) {
      const aside = drawer.shadowRoot.querySelector('aside.mdc-drawer');
      if (aside) {
        const rect = aside.getBoundingClientRect();
        if (rect.width > 0 && rect.right > 0) return Math.round(rect.right);
      }

      const content = drawer.shadowRoot.querySelector('.mdc-drawer-app-content');
      if (content) {
        const left = content.getBoundingClientRect().left;
        if (left > 0) return Math.round(left);
      }
    }

    // Final fallback based on drawer state
    return (drawer.hasAttribute('expanded') || drawer.hasAttribute('narrow')) ? 0 : 56;
  } catch (e) {
    return 0;
  }
}

/**
 * Gets the bounding box of all visible toasts for cutout calculation
 */
function getCutoutBounds(padding) {
  const container = document.getElementById(TOAST_CONTAINER_ID);
  const toasts = container?.querySelectorAll('.ui-toast');
  if (!toasts?.length) return null;

  let minX = Infinity, minY = Infinity, maxY = -Infinity;

  for (const toast of toasts) {
    if (!toast.isConnected) continue;
    const rect = toast.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;

    minX = Math.min(minX, rect.left);
    minY = Math.min(minY, rect.top);
    maxY = Math.max(maxY, rect.bottom);

    // Account for protruding icon
    const icon = toast.querySelector('.ui-toast__icon');
    if (icon) {
      const iconRect = icon.getBoundingClientRect();
      minX = Math.min(minX, iconRect.left);
      minY = Math.min(minY, iconRect.top);
      maxY = Math.max(maxY, iconRect.bottom);
    }

    // Account for close button
    const closeBtn = toast.querySelector('.ui-toast__close');
    if (closeBtn) {
      const closeRect = closeBtn.getBoundingClientRect();
      minY = Math.min(minY, closeRect.top);
      maxY = Math.max(maxY, closeRect.bottom);
    }
  }

  if (!Number.isFinite(minY)) return null;

  return {
    left: minX - padding,
    top: minY - padding,
    bottom: maxY + padding
  };
}

/**
 * Builds SVG path data for the border with optional cutout
 */
function buildBorderPaths(W, H, radius, inset, cutout) {
  const r = radius;
  const i = inset;

  const paths = [
    // Top edge
    `M ${i + r} ${i} H ${W - i - r}`,
    // Top-right corner
    `M ${W - i - r} ${i} A ${r} ${r} 0 0 1 ${W - i} ${i + r}`
  ];

  if (cutout) {
    // Right edge stops at cutout top
    paths.push(`M ${W - i} ${i + r} V ${cutout.top}`);
    // Bottom edge starts at cutout left
    paths.push(`M ${i + r} ${H - i} H ${cutout.left}`);
  } else {
    // Full right edge
    paths.push(`M ${W - i} ${i + r} V ${H - i - r}`);
    // Bottom-right corner
    paths.push(`M ${W - i} ${H - i - r} A ${r} ${r} 0 0 1 ${W - i - r} ${H - i}`);
    // Full bottom edge
    paths.push(`M ${W - i - r} ${H - i} H ${i + r}`);
  }

  // Bottom-left corner
  paths.push(`M ${i + r} ${H - i} A ${r} ${r} 0 0 1 ${i} ${H - i - r}`);
  // Left edge
  paths.push(`M ${i} ${H - i - r} V ${i + r}`);
  // Top-left corner
  paths.push(`M ${i} ${i + r} A ${r} ${r} 0 0 1 ${i + r} ${i}`);

  return paths;
}

/**
 * Renders the border SVG
 * @param {boolean} [forceCutout] - If false, renders full border without cutout
 */
function renderBorder(forceCutout) {
  const el = document.getElementById(OVERLAY_ID);
  if (!el?._svg) return;

  // Update position based on sidebar
  const sidebarW = getSidebarWidth();
  if (sidebarW !== lastSidebarW) {
    lastSidebarW = sidebarW;
    el.style.left = `${sidebarW}px`;
    el.style.width = `calc(100vw - ${sidebarW}px)`;
  }

  const dpr = devicePixelRatio || 1;
  const W = Math.round((el.clientWidth || 1) * dpr) / dpr;
  const H = Math.round((el.clientHeight || 1) * dpr) / dpr;

  el._svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const r = el._cornerRadius || DEFAULTS.cornerRadius;
  const stroke = el._stroke || DEFAULTS.stroke;
  const rawInset = el._inset || DEFAULTS.inset;
  const color = el._color || DEFAULTS.color;

  // Calculate inset accounting for stroke width
  const i = (Math.round((rawInset + stroke / 2) * dpr) / dpr) - stroke / 2;

  // Calculate cutout if enabled
  let cutout = null;
  const cutoutCfg = el._cutout;
  if (forceCutout !== false && cutoutCfg?.enabled) {
    const rawBounds = getCutoutBounds(cutoutCfg.padding || DEFAULTS.cutout.padding);
    if (rawBounds) {
      // Adjust for sidebar offset (bounds are in viewport coords, SVG is offset by sidebar)
      cutout = {
        left: Math.round(rawBounds.left - sidebarW),
        top: Math.round(rawBounds.top),
        bottom: Math.round(rawBounds.bottom)
      };
    }
  }

  const svg = el._svg;
  svg.textContent = '';

  const style = `fill:none;stroke:${color};stroke-width:${stroke};stroke-linecap:round;stroke-linejoin:round`;

  for (const d of buildBorderPaths(W, H, r, i, cutout)) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('style', style);
    path.setAttribute('shape-rendering', 'geometricPrecision');
    svg.appendChild(path);
  }
}

/**
 * Schedules a border update on next animation frame
 */
function scheduleBorderUpdate() {
  if (rafScheduled) return;
  rafScheduled = true;

  requestAnimationFrame(() => {
    rafScheduled = false;
    const el = document.getElementById(OVERLAY_ID);
    if (!el?._svg) return;
    if (el.classList.contains('is-fading')) return;
    renderBorder();
  });
}

/**
 * Installs monitors for sidebar/window changes
 */
function installMonitors() {
  if (monitorsInstalled) return;
  monitorsInstalled = true;

  const update = () => scheduleBorderUpdate();

  window.addEventListener('resize', update, { passive: true });

  try {
    const ha = document.querySelector('home-assistant');
    const main = ha?.shadowRoot?.querySelector('home-assistant-main');
    const drawer = main?.shadowRoot?.querySelector('ha-drawer');
    const sidebar = drawer?.querySelector('ha-sidebar');
    const aside = drawer?.shadowRoot?.querySelector('aside.mdc-drawer');

    const observe = (el) => {
      if (!el) return;
      new ResizeObserver(update).observe(el);
      new MutationObserver(update).observe(el, {
        attributes: true,
        attributeFilter: ['style', 'class', 'opened', 'expanded', 'hidden', 'narrow']
      });
      el.addEventListener('transitionend', update, { passive: true });
    };

    [drawer, sidebar, aside, document.body].forEach(observe);

    // Delayed updates to catch late layout changes
    setTimeout(update, 50);
    setTimeout(update, 200);
    setTimeout(update, 500);
  } catch (e) {
    // Non-HA environment, just update on resize
  }
}

/**
 * Installs monitor for toast container changes (for cutout updates)
 */
function installCutoutMonitor() {
  if (cutoutMonitored) return;

  const container = document.getElementById(TOAST_CONTAINER_ID);
  if (!container) return;

  cutoutMonitored = true;

  const update = () => scheduleBorderUpdate();

  new MutationObserver(update).observe(container, {
    childList: true,
    subtree: true
  });
  new ResizeObserver(update).observe(container);
}

/**
 * Flashes the screen border effect
 *
 * @param {Object} [options] - Configuration options
 * @param {number} [options.duration=6000] - How long the border stays visible (ms)
 * @param {string} [options.color] - Border color (defaults to --ui-pink token)
 * @param {number} [options.stroke=14] - Border stroke width (px)
 * @param {number} [options.cornerRadius=32] - Corner radius (px)
 * @param {number} [options.inset=64] - Distance from viewport edge (px)
 * @param {number} [options.zIndex=99998] - Z-index of the overlay
 * @param {Object} [options.cutout] - Cutout configuration for toast area
 * @param {boolean} [options.cutout.enabled=true] - Whether to cut out around toasts
 * @param {number} [options.cutout.padding=18] - Padding around toast bounds
 * @returns {Object} Controller with hide() method
 */
export function flashScreenBorder(options = {}) {
  const config = {
    ...DEFAULTS,
    ...options,
    // Resolve --ui-pink at call time so the SVG gets a concrete rgb value.
    // Callers can still override with options.color to skip resolution.
    color: options.color || resolveToken('--ui-pink', 'rgb(255, 46, 146)'),
    cutout: { ...DEFAULTS.cutout, ...options.cutout }
  };

  ensureStyles();
  const el = ensureOverlay();

  // Store configuration
  el._stroke = config.stroke;
  el._cornerRadius = config.cornerRadius;
  el._inset = config.inset;
  el._color = config.color;
  el._cutout = config.cutout;
  el.style.setProperty('--ui-screen-border-z', String(config.zIndex));

  installMonitors();
  installCutoutMonitor();
  scheduleBorderUpdate();

  // Clear any existing fade timer
  if (fadeTimer) {
    clearTimeout(fadeTimer);
    fadeTimer = null;
  }

  const wasVisible = el.classList.contains('is-visible') && !el.classList.contains('is-fading');

  el.classList.remove('is-fading');

  // Animate the SVG
  if (el._svg) {
    el._svg.style.animation = 'none';
    void el._svg.offsetWidth; // Force reflow

    if (wasVisible) {
      // Pulse if already visible
      el._pulseAlt = !el._pulseAlt;
      const anim = el._pulseAlt ? 'ui-border-pulse-a' : 'ui-border-pulse-b';
      el._svg.style.animation = `${anim} 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    } else {
      // Entry animation
      el._svg.style.animation = 'ui-border-enter 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
    }
  }

  if (!wasVisible) {
    el.classList.add('is-visible');
  }

  // Schedule fade out
  fadeTimer = setTimeout(() => {
    // Render full border (no cutout) before fading - toast still covers the area visually
    renderBorder(false);

    // Now start fading - subsequent renders blocked by is-fading check
    el.classList.remove('is-visible');
    el.classList.add('is-fading');
  }, Math.max(0, config.duration));

  return {
    hide: () => {
      if (fadeTimer) {
        clearTimeout(fadeTimer);
        fadeTimer = null;
      }
      // Render full border before fading
      renderBorder(false);
      el.classList.remove('is-visible');
      el.classList.add('is-fading');
    }
  };
}

/**
 * Hides the screen border immediately
 */
export function hideScreenBorder() {
  if (fadeTimer) {
    clearTimeout(fadeTimer);
    fadeTimer = null;
  }

  const el = document.getElementById(OVERLAY_ID);
  if (el) {
    el.classList.remove('is-visible');
    el.classList.add('is-fading');
  }
}

/**
 * Checks if the screen border is currently visible
 */
export function isScreenBorderVisible() {
  const el = document.getElementById(OVERLAY_ID);
  return el?.classList.contains('is-visible') && !el?.classList.contains('is-fading');
}
