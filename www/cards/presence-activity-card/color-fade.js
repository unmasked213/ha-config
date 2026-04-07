// /config/www/cards/presence-activity-card/color-fade.js
// Color fade calculations for activity items
// Handles both active (binary threshold) and recent (continuous fade) states

/**
 * Default behavioral parameters (card config, not tokens)
 */
const DEFAULTS = {
  activeThresholdSeconds: 60,
  recentFadeDurationSeconds: 300,
  fadeCurve: 0.7  // Power curve exponent
};

/**
 * Fallback colors when CSS tokens are unavailable
 * These match the foundation.js light theme defaults
 */
const FALLBACK_COLORS = {
  active: {
    fresh: {
      text: { r: 243, g: 137, b: 26, a: 1 },
      secondary: { r: 247, g: 191, b: 0, a: 0.7 }
    },
    stale: {
      text: { r: 250, g: 170, b: 130, a: 0.2 },
      secondary: { r: 250, g: 170, b: 130, a: 0.2 }
    }
  },
  recent: {
    fresh: {
      text: { r: 255, g: 255, b: 255, a: 1 },
      secondary: { r: 0, g: 200, b: 100, a: 1 }
    },
    faded: {
      text: { r: 105, g: 105, b: 105, a: 1 },
      secondary: { r: 120, g: 80, b: 20, a: 1 }
    }
  }
};

/**
 * Parse an rgb() or rgba() CSS value into an object
 * @param {string} cssValue - e.g., "rgb(243, 137, 26)" or "rgba(250, 170, 130, 0.2)"
 * @returns {{ r: number, g: number, b: number, a: number } | null}
 */
function parseRgb(cssValue) {
  if (!cssValue) return null;

  // Match rgb(r, g, b) or rgba(r, g, b, a)
  const match = cssValue.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!match) return null;

  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1
  };
}

/**
 * ActivityColorCalculator
 *
 * Calculates interpolated colors for activity items based on time elapsed.
 * Reads color endpoints from CSS custom properties (design system tokens).
 *
 * Usage:
 *   const calc = new ActivityColorCalculator();
 *   calc.loadColorsFromElement(hostElement);  // Load CSS tokens
 *   const colors = calc.getColors('active', 45);  // 45 seconds since change
 *   // { text: 'rgba(243, 137, 26, 1)', secondary: 'rgba(247, 191, 0, 0.7)', opacity: 1, fontSize: '0.95em' }
 */
export class ActivityColorCalculator {
  constructor(config = {}) {
    this._activeThreshold = config.activeThresholdSeconds ?? DEFAULTS.activeThresholdSeconds;
    this._recentFadeDuration = config.recentFadeDurationSeconds ?? DEFAULTS.recentFadeDurationSeconds;
    this._fadeCurve = config.fadeCurve ?? DEFAULTS.fadeCurve;

    // Start with fallback colors
    this._colors = JSON.parse(JSON.stringify(FALLBACK_COLORS));

    // Allow color endpoint overrides via config
    if (config.colors) {
      this._mergeColors(config.colors);
    }
  }

  /**
   * Load color tokens from CSS custom properties on an element
   * Call this after the element is connected to the DOM
   * @param {HTMLElement} element - Element to read computed styles from (usually the host)
   */
  loadColorsFromElement(element) {
    if (!element) return;

    const styles = getComputedStyle(element);
    let tokensLoaded = 0;

    // Active fresh
    const activeFresh = parseRgb(styles.getPropertyValue('--ui-activity-active-fresh').trim());
    if (activeFresh) {
      this._colors.active.fresh.text = activeFresh;
      tokensLoaded++;
    }

    const activeFreshSecondary = parseRgb(styles.getPropertyValue('--ui-activity-active-fresh-secondary').trim());
    if (activeFreshSecondary) {
      this._colors.active.fresh.secondary = { ...activeFreshSecondary, a: 0.7 };
      tokensLoaded++;
    }

    // Active stale
    const activeStale = parseRgb(styles.getPropertyValue('--ui-activity-active-stale').trim());
    const activeStaleOpacity = parseFloat(styles.getPropertyValue('--ui-activity-active-stale-opacity').trim());
    if (activeStale) {
      this._colors.active.stale.text = {
        ...activeStale,
        a: isNaN(activeStaleOpacity) ? 0.2 : activeStaleOpacity
      };
      this._colors.active.stale.secondary = {
        ...activeStale,
        a: isNaN(activeStaleOpacity) ? 0.2 : activeStaleOpacity
      };
      tokensLoaded++;
    }

    // Recent fresh
    const recentFresh = parseRgb(styles.getPropertyValue('--ui-activity-recent-fresh').trim());
    if (recentFresh) {
      this._colors.recent.fresh.text = recentFresh;
      tokensLoaded++;
    }

    const recentFreshSecondary = parseRgb(styles.getPropertyValue('--ui-activity-recent-fresh-secondary').trim());
    if (recentFreshSecondary) {
      this._colors.recent.fresh.secondary = recentFreshSecondary;
      tokensLoaded++;
    }

    // Recent faded
    const recentFaded = parseRgb(styles.getPropertyValue('--ui-activity-recent-faded').trim());
    if (recentFaded) {
      this._colors.recent.faded.text = recentFaded;
      tokensLoaded++;
    }

    const recentFadedSecondary = parseRgb(styles.getPropertyValue('--ui-activity-recent-faded-secondary').trim());
    if (recentFadedSecondary) {
      this._colors.recent.faded.secondary = recentFadedSecondary;
      tokensLoaded++;
    }

    // Warn if no tokens were loaded (using fallback colors)
    if (tokensLoaded === 0) {
      console.warn('[PresenceActivityCard] No color tokens loaded from CSS, using fallback colors');
    }
  }

  /**
   * Get calculated colors for an activity item
   * @param {string} type - 'active' or 'recent'
   * @param {number} secondsElapsed - Seconds since last_changed
   * @returns {Object} { text, secondary, opacity, fontSize }
   */
  getColors(type, secondsElapsed) {
    if (type === 'active') {
      return this._getActiveColors(secondsElapsed);
    } else {
      return this._getRecentColors(secondsElapsed);
    }
  }

  /**
   * Active items: Binary threshold (fresh vs stale)
   */
  _getActiveColors(secondsElapsed) {
    const isFresh = secondsElapsed < this._activeThreshold;
    const endpoints = this._colors.active;

    if (isFresh) {
      return {
        text: this._toRgba(endpoints.fresh.text),
        secondary: this._toRgba(endpoints.fresh.secondary),
        opacity: 1,
        fontSize: '1em'
      };
    } else {
      return {
        text: this._toRgba(endpoints.stale.text),
        secondary: this._toRgba(endpoints.stale.secondary),
        opacity: 1,
        fontSize: '1em'
      };
    }
  }

  /**
   * Recent items: Continuous fade with power curve
   */
  _getRecentColors(secondsElapsed) {
    // Clamp progress to 0-1 range
    const rawProgress = Math.min(secondsElapsed / this._recentFadeDuration, 1);

    // Apply power curve for non-linear fade
    const progress = Math.pow(rawProgress, this._fadeCurve);

    const endpoints = this._colors.recent;

    // Interpolate colors
    const text = this._interpolateColor(endpoints.fresh.text, endpoints.faded.text, progress);
    const secondary = this._interpolateColor(endpoints.fresh.secondary, endpoints.faded.secondary, progress);

    // Interpolate opacity (1.0 → 0.5), rounded to avoid sub-pixel style thrashing
    const opacity = Math.round(this._lerp(1.0, 0.5, progress) * 100) / 100;

    // Interpolate font size (0.95em → 0.8em)
    const fontSizeValue = this._lerp(0.95, 0.8, progress);
    const fontSize = `${fontSizeValue.toFixed(2)}em`;

    return {
      text: this._toRgba(text),
      secondary: this._toRgba(secondary),
      opacity,
      fontSize
    };
  }

  /**
   * Linear interpolation
   */
  _lerp(start, end, t) {
    return start + (end - start) * t;
  }

  /**
   * Interpolate between two RGBA color objects
   */
  _interpolateColor(from, to, t) {
    return {
      r: Math.round(this._lerp(from.r, to.r, t)),
      g: Math.round(this._lerp(from.g, to.g, t)),
      b: Math.round(this._lerp(from.b, to.b, t)),
      a: this._lerp(from.a, to.a, t)
    };
  }

  /**
   * Convert RGBA object to CSS string
   */
  _toRgba(color) {
    return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${Math.round(color.a * 100) / 100})`;
  }

  /**
   * Merge custom color overrides
   */
  _mergeColors(overrides) {
    // Deep merge color overrides
    for (const type of ['active', 'recent']) {
      if (overrides[type]) {
        for (const state of Object.keys(overrides[type])) {
          if (this._colors[type][state]) {
            Object.assign(this._colors[type][state], overrides[type][state]);
          }
        }
      }
    }
  }

  /**
   * Update configuration at runtime
   */
  configure(config) {
    if (config.activeThresholdSeconds !== undefined) {
      this._activeThreshold = config.activeThresholdSeconds;
    }
    if (config.recentFadeDurationSeconds !== undefined) {
      this._recentFadeDuration = config.recentFadeDurationSeconds;
    }
    if (config.fadeCurve !== undefined) {
      this._fadeCurve = config.fadeCurve;
    }
    if (config.colors) {
      this._mergeColors(config.colors);
    }
  }

  /**
   * Get current thresholds (for settings display)
   */
  get thresholds() {
    return {
      activeThresholdSeconds: this._activeThreshold,
      recentFadeDurationSeconds: this._recentFadeDuration,
      fadeCurve: this._fadeCurve
    };
  }
}


/**
 * Format elapsed time as human-readable string
 * @param {number} seconds - Elapsed seconds
 * @returns {string} Formatted string (e.g., '45s', '12m', '2h')
 */
export function formatElapsedTime(seconds) {
  if (seconds < 0) return '0s';

  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  } else {
    return `${Math.floor(seconds / 3600)}h`;
  }
}


/**
 * Calculate seconds elapsed since a timestamp
 * @param {string|Date} timestamp - ISO datetime string or Date object
 * @returns {number} Seconds elapsed (0 if invalid)
 */
export function getSecondsElapsed(timestamp) {
  if (!timestamp) return 0;

  const then = new Date(timestamp).getTime();
  const now = Date.now();

  if (isNaN(then)) return 0;

  return Math.max(0, (now - then) / 1000);
}
