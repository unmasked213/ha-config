/**
 * Presence Activity Card v2
 * 
 * Two-section layout:
 * - Active (top): currently on sensors, oldest?newest (newest at bottom)
 * - Recent (bottom): recently off sensors, newest?oldest (newest at top)
 * 
 * Center focal point design - most current info at the convergence.
 */

import { FloorResolver } from './floor-resolver.js';
import { ActivityColorCalculator, getSecondsElapsed, formatElapsedTime } from './color-fade.js';
import { applyThemeClass, getHelperNumber, getHelperBoolean, persistHelper, initButtons } from '/local/base/helpers.js';
import { uiToggles } from '/local/base/toggles.js';
import { uiComponents } from '/local/base/components.js';
import { uiSkeletons } from '/local/base/skeletons.js';
import '/local/base/tooltips.js'; // registers <ui-info-icon>
import { flashScreenBorder } from '/local/base/screen-border.js';
import { showToast } from '/local/base/toasts.js';
import { uiNumberInput } from '/local/base/number-input.js';

/**
 * Toast notification constants (not exposed in UI)
 */
const TOAST_DURATION = 6000;
const TOAST_RATE_LIMIT_WINDOW = 5000;
const TOAST_RATE_LIMIT_MAX = 3;

/**
 * Default configuration values
 */
const DEFAULTS = {
  activeRows: 5,        // visible rows before scrolling
  recentRows: 5,        // visible rows before scrolling
  activeMaxItems: 10,   // max items in active list
  recentMaxItems: 10,   // max items in recent list
  activeThreshold: 60,
  recentFadeDuration: 300,  // seconds for recent items to fade from fresh to dim
  fadeCurve: 0.7
};

/**
 * HA Helper entity IDs for persistent settings
 * These are created in packages/occupancy/presence_activity_card.yaml
 */
const HELPERS = {
  // Layout
  activeRows: 'input_number.pac_active_rows',
  recentRows: 'input_number.pac_recent_rows',
  activeMaxItems: 'input_number.pac_active_max_items',
  recentMaxItems: 'input_number.pac_recent_max_items',
  recentFadeDuration: 'input_number.pac_recent_fade_duration',
  activeThreshold: 'input_number.pac_active_threshold',

  // Area filters
  filterAreaBedroom: 'input_boolean.pac_filter_area_bedroom',
  filterAreaOffice: 'input_boolean.pac_filter_area_office',
  filterArea2ndFloor: 'input_boolean.pac_filter_area_2nd_floor',
  filterArea1stFloor: 'input_boolean.pac_filter_area_1st_floor',
  filterAreaGroundFloor: 'input_boolean.pac_filter_area_ground_floor',

  // Door filters
  filterDoorOffice: 'input_boolean.pac_filter_door_office',
  filterDoorBedroom: 'input_boolean.pac_filter_door_bedroom',
  filterDoorHouse: 'input_boolean.pac_filter_door_house',

  // Camera filter
  filterCameras: 'input_boolean.pac_filter_cameras',

  // Toast notifications
  toastNotifications: 'input_boolean.pac_toast_notifications',
  toastScreenBorder: 'input_boolean.pac_toast_screen_border',

  // Test mode (per-area virtual presence toggles)
  testPresenceBedroom: 'input_boolean.pac_test_presence_bedroom',
  testPresenceOffice: 'input_boolean.pac_test_presence_office',
  testPresence2ndFloor: 'input_boolean.pac_test_presence_2nd_floor',
  testPresence1stFloor: 'input_boolean.pac_test_presence_1st_floor',
  testPresenceGroundFloor: 'input_boolean.pac_test_presence_ground_floor'
};

/**
 * Maps area_id values to their corresponding filter setting keys
 */
const AREA_FILTER_MAP = {
  'bedroom_2': 'filterAreaBedroom',
  'office': 'filterAreaOffice',
  '2nd_floor': 'filterArea2ndFloor',
  '1st_floor': 'filterArea1stFloor',
  'ground_floor': 'filterAreaGroundFloor'
};

/**
 * Maps specific door entity IDs to their filter setting keys
 */
const DOOR_FILTER_MAP = {
  'binary_sensor.door_office': 'filterDoorOffice',
  'binary_sensor.door_bedroom': 'filterDoorBedroom',
  'binary_sensor.door_house': 'filterDoorHouse'
};

/**
 * Regex pattern for camera entities (matches binary_sensor.c##_*)
 */
const CAMERA_ENTITY_PATTERN = /^binary_sensor\.c\d+_/;

/**
 * Layout constants
 */
const LAYOUT = {
  itemHeight: 24,     // visual line height in px (48px min-height - 2×12px negative margin)
  itemGap: 12,        // var(--ui-space-3) = 12px; net gap = 12 - 2×12 = -12px (items overlap via negative margins)
  negativeMargin: 12, // var(--ui-space-3) = 12px per side; expands touch target without affecting visual spacing
  sectionPadding: 16  // vertical padding per section (var(--ui-space-2) top + bottom = 8+8)
};

/**
 * Tooltip content for settings info icons (one per section header)
 * Uses structured format: intro + items (term/desc pairs)
 */
const TOOLTIP_CONTENT = {
  rowDisplay: {
    title: 'Row Display',
    intro: 'Controls how many items you can see at once without scrolling.',
    items: [
      { term: 'Active rows', desc: 'The top section shows sensors that are detecting someone right now. More rows means you can see more active sensors at once.' },
      { term: 'Recent rows', desc: 'The bottom section shows sensors that recently stopped detecting. This helps you see where someone was moments ago.' }
    ]
  },
  listLimits: {
    title: 'List Limits',
    intro: 'Control the maximum number of items in each list.',
    items: [
      { term: 'Active max', desc: 'Maximum sensors shown in the active list. Higher values show more simultaneous activity.' },
      { term: 'Recent max', desc: 'Maximum sensors shown in the recently-off list. Higher values preserve more history.' }
    ]
  },
  timing: {
    title: 'Timing',
    intro: 'Controls how the text colour changes over time to show how fresh the activity is.',
    items: [
      { term: 'Threshold', desc: 'How long a sensor stays brightly coloured after it first detects someone. After this time, it starts to dim even while still active.' },
      { term: 'Fade', desc: 'How long it takes for items in the "recent" section to gradually fade from bright to dim. Longer times keep old activity visible longer.' }
    ]
  },
  areas: {
    title: 'Area Filters',
    intro: 'Control which areas appear in the card.',
    items: [
      { term: 'Area toggles', desc: 'Each toggle shows or hides all sensors from that area. Turn off areas you want to exclude.' }
    ]
  },
  doors: {
    title: 'Door Filters',
    intro: 'Control visibility of specific door sensors.',
    items: [
      { term: 'Door toggles', desc: 'Each toggle controls a specific door sensor. Turn off doors you don\'t need to see.' }
    ]
  },
  cameras: {
    title: 'Camera Filters',
    intro: 'Control camera motion and detection sensors.',
    items: [
      { term: 'Camera toggle', desc: 'Shows or hides all camera sensors (motion, person, vehicle detection). Off by default to reduce clutter.' }
    ]
  },
  notifications: {
    title: 'Notifications',
    intro: 'Visual alerts when activity happens.',
    items: [
      { term: 'Browser toasts', desc: 'Show a toast notification when a sensor detects someone.' },
      { term: 'Screen border', desc: 'Flash a coloured border around the screen for attention.' }
    ]
  },
  testMode: {
    title: 'Test Mode',
    intro: 'Simulate presence in areas using virtual sensors.',
    items: [
      { term: 'Area toggles', desc: 'Toggle an area ON to inject a virtual motion sensor into its presence calculation. The area will show as occupied until you toggle it OFF.' }
    ]
  }
};

/**
 * Card-specific styles
 */
const cardStyles = new CSSStyleSheet();
cardStyles.replaceSync(`
  :host {
    display: block;
    --pac-anim-item-enter: 320ms;
    --pac-anim-item-exit: 250ms;
    --pac-anim-drawer-open: 450ms;
  }

  .pac-container {
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--ui-surface);
    border-radius: var(--ui-radius-xl);
    overflow: hidden;
    min-height: 200px;
    padding-bottom: var(--ui-space-3);
  }

  /* Active section (top) - height set by JS based on active_rows */
  .pac-section--active {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .pac-section--active::-webkit-scrollbar {
    display: none;
  }

  .pac-section--active .pac-list {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex: 1;
    gap: var(--ui-space-3);
    padding: var(--ui-space-2) var(--ui-space-3);
  }

  /* Recent section (bottom) - height set by JS based on recent_rows */
  .pac-section--recent {
    position: relative;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .pac-section--recent::-webkit-scrollbar {
    display: none;
  }

  .pac-section--recent .pac-list {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-3);
    padding: var(--ui-space-2) var(--ui-space-3);
  }

  /* Section divider between active and recent */
  .pac-divider {
    height: 1px;
    background: var(--ui-border-color-light);
    margin: 0 var(--ui-space-3);
    flex-shrink: 0;
  }

  /* Scroll indicator - shows when recent section is scrolled */
  .pac-scroll-indicator {
    position: relative;
    height: 24px;
    margin-bottom: -24px;
    margin-left: var(--ui-space-3);
    margin-right: var(--ui-space-3);
    background: radial-gradient(ellipse 100% 100% at 50% 0%, var(--ui-surface, rgb(11, 14, 23)) 0%, transparent 70%);
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--ui-motion-fast);
    z-index: 2;
  }

  .pac-scroll-indicator.is-visible {
    opacity: 1;
  }

  .pac-item {
    display: flex;
    align-items: baseline;
    gap: var(--ui-space-2);
    font-size: var(--ui-font-m);
    line-height: var(--ui-font-line-height-s);
    flex-shrink: 0;
    cursor: pointer;
    /* Touch target: 48px min height via padding, visual content stays compact */
    min-height: var(--ui-space-10);
    padding: var(--ui-space-3) 0;
    margin: calc(-1 * var(--ui-space-3)) 0;
    border-radius: var(--ui-radius-s);

    transition:
      color var(--ui-motion-fast),
      opacity var(--ui-motion-fast),
      background var(--ui-motion-fast);
  }

  .pac-item:hover {
    opacity: 1 !important;
    background: var(--ui-state-hover);
  }

  .pac-item:active {
    opacity: 0.7 !important;
    background: var(--ui-state-active, var(--ui-state-hover));
    transition-duration: 50ms;
  }

  .pac-item:focus-visible {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: 2px;
    opacity: 1 !important;
  }

  /* Entry animation */
  .pac-item--entering {
    animation: pac-item-enter var(--pac-anim-item-enter) cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  @keyframes pac-item-enter {
    0% {
      opacity: 0;
      transform: translateX(-16px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Exit animation */
  .pac-item--exiting {
    animation: pac-item-exit var(--pac-anim-item-exit) cubic-bezier(0.4, 0, 1, 1) forwards;
    pointer-events: none;
  }

  @keyframes pac-item-exit {
    0% {
      opacity: 1;
      transform: translateX(0);
    }
    100% {
      opacity: 0;
      transform: translateX(24px);
    }
  }

  .pac-item__floor-indicator {
    width: 2px;
    height: 0.7em;
    border-radius: 1px;
    flex-shrink: 0;
    align-self: center;
    transition: background var(--ui-motion-fast), opacity var(--ui-motion-fast);
  }

  .pac-item__name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pac-item__time {
    flex-shrink: 0;
    width: 3ch;
    text-align: right;
    font-size: var(--ui-font-xs);
    letter-spacing: var(--ui-font-letter-spacing-s);
    margin-right: var(--ui-space-2);
    padding-left: var(--ui-space-1);
    transition: color var(--ui-motion-fast);
  }

  .pac-empty {
    color: var(--ui-activity-recent-faded, rgb(105, 105, 105));
    font-size: var(--ui-font-s);
    padding: var(--ui-space-4);
    text-align: center;
    opacity: 0.5;
  }

  /* Loading skeleton rows */
  .pac-skeleton-row {
    display: flex;
    align-items: center;
    gap: var(--ui-space-2);
    min-height: var(--ui-space-10);
    padding: var(--ui-space-3) 0;
    margin: calc(-1 * var(--ui-space-3)) 0;
  }

  .pac-skeleton-row .ui-skeleton--indicator {
    width: 2px;
    height: 0.7em;  /* Matches .pac-item__floor-indicator */
    border-radius: 1px;
  }

  .pac-skeleton-row .ui-skeleton--name {
    flex: 1;
    height: var(--ui-space-4);  /* 16px */
  }

  .pac-skeleton-row .ui-skeleton--time {
    width: 3ch;
    height: var(--ui-space-3);  /* 12px */
  }

  /* Settings panel - slides in from right with subtle elastic settle */
  /* Width: 288px = --ui-space-10 (48px) × 6, nearest token-derived value */
  .pac-settings-panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: calc(var(--ui-space-10) * 6);
    max-width: 85%;
    max-height: 90vh;
    background: var(--ui-elevated-2);
    border-left: var(--ui-border-width-s) solid var(--ui-border-color-light);
    border-radius: var(--ui-radius-xl) 0 0 var(--ui-radius-xl);
    display: flex;
    flex-direction: column;
    z-index: 10;
    transform: translateX(100%);
    opacity: 0;
    transition: transform var(--ui-motion-med), opacity var(--ui-motion-med);
    pointer-events: none;
    transform-origin: right center;
  }

  .pac-settings-panel.is-open {
    opacity: 1;
    pointer-events: auto;
    animation: pac-drawer-open var(--pac-anim-drawer-open) cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes pac-drawer-open {
    0% {
      transform: translateX(100%);
    }
    60% {
      transform: translateX(-2%);
    }
    80% {
      transform: translateX(0.5%);
    }
    100% {
      transform: translateX(0);
    }
  }

  .pac-settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--ui-space-3) var(--ui-space-4);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
    flex-shrink: 0;
  }

  .pac-settings-title {
    font-size: var(--ui-font-m);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text-strong);
    margin: 0;
  }

  .pac-settings-close {
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

  .pac-settings-close:hover {
    background: var(--ui-state-hover);
    color: var(--ui-text);
  }

  .pac-settings-tabs {
    display: flex;
    gap: var(--ui-space-1);
    padding: var(--ui-space-1) var(--ui-space-2);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
    flex-shrink: 0;
  }

  .pac-settings-tab {
    flex: 1;
    min-height: var(--ui-space-10);
    padding: var(--ui-space-2) var(--ui-space-2);
    background: transparent;
    border: none;
    border-radius: var(--ui-radius-m);
    color: var(--ui-text-mute);
    font-size: var(--ui-font-s);
    cursor: pointer;
    transition: background var(--ui-motion-fast), color var(--ui-motion-fast);
  }

  .pac-settings-tab:hover {
    background: var(--ui-state-hover);
    color: var(--ui-text);
  }

  .pac-settings-tab.is-active {
    background: var(--ui-accent-faint);
    color: var(--ui-accent);
  }

  .pac-settings-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--ui-space-4);
    scrollbar-width: none;
    -ms-overflow-style: none;
    scroll-behavior: smooth;
  }

  .pac-settings-content::-webkit-scrollbar {
    display: none;
  }

  .pac-settings-section {
    display: none;
  }

  .pac-settings-section.is-active {
    display: block;
  }

  .pac-settings-section h4 {
    font-size: var(--ui-font-s);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text-mute);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 var(--ui-space-3) 0;
  }

  .pac-settings-section p {
    font-size: var(--ui-font-s);
    color: var(--ui-text-mute);
    margin: 0;
  }

  /* Settings control groups */
  .pac-settings-group {
    margin-bottom: var(--ui-space-5);
  }

  .pac-settings-group:last-child {
    margin-bottom: 0;
  }

  /* Section divider between filter groups */
  .pac-settings-group--bordered {
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
    padding-bottom: var(--ui-space-5);
  }

  /* Filter toggle button container */
  .pac-filter-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ui-space-2);
    margin-top: var(--ui-space-2);
  }

  /* Inline input variant for compact settings rows */
  .ui-input--inline {
    width: 72px;
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

  .pac-settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--ui-space-10);
    gap: var(--ui-space-3);
  }

  .pac-settings-row + .pac-settings-row {
    margin-top: var(--ui-space-2);
  }

  .pac-settings-label {
    font-size: var(--ui-font-s);
    color: var(--ui-text);
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--ui-space-1);
  }

  .pac-settings-value {
    font-size: var(--ui-font-s);
    color: var(--ui-text-mute);
    min-width: var(--ui-space-8);
    text-align: right;
  }

  /* Slider wrapper for settings - constrains width */
  .pac-settings-slider-wrap {
    width: calc(var(--ui-space-10) * 2.5);
    flex-shrink: 0;
  }

  /* Touch fix: Ensure visual slider elements don't capture touch events */
  .pac-settings-slider-wrap .ui-slider__container,
  .pac-settings-slider-wrap .ui-slider__track-active,
  .pac-settings-slider-wrap .ui-slider__track-inactive {
    pointer-events: none;
  }

  /* Backdrop overlay when panel is open */
  .pac-settings-backdrop {
    position: absolute;
    inset: 0;
    background: var(--ui-overlay-scrim);
    border-radius: var(--ui-radius-xl);
    z-index: 9;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--ui-motion-med);
  }

  .pac-settings-backdrop.is-visible {
    opacity: 1;
    pointer-events: auto;
  }

  /* Settings FAB - top right corner
     Spring entrance mirrors the ai-sparkle-btn pattern in prompt-manager.
     ui-fab handles colour, shadow, size, and interaction styles.
     Outro is faster with ease-in for a snappy dismiss. */
  .pac-settings-toggle {
    position: absolute;
    right: var(--ui-space-4);
    top: var(--ui-space-2);
    z-index: 1;
    opacity: 0;
    transform: scale(var(--ui-tooltip-origin-scale, 0.88));
    /* Outro: quick fade + shrink */
    transition:
      opacity 180ms ease-in,
      transform 180ms ease-in;
  }

  .pac-container:hover .pac-settings-toggle {
    opacity: 1;
    transform: scale(1);
    /* Intro: original token-based tooltip timing */
    transition:
      opacity var(--ui-tooltip-motion-opacity),
      transform var(--ui-tooltip-motion-transform);
  }

  .pac-settings-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--ui-icon-l);
    height: var(--ui-icon-l);
    color: var(--ui-text-on-accent);
  }

  .pac-settings-icon svg {
    width: 100%;
    height: 100%;
  }

  /* Touch devices: always show settings FAB (no hover available) */
  @media (hover: none) {
    .pac-settings-toggle {
      opacity: 0.7;
      transform: scale(1);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .pac-item,
    .pac-item--entering,
    .pac-item--exiting,
    .pac-settings-toggle {
      animation: none !important;
      transition-duration: 0.01ms !important;
    }
  }
`);


class PresenceActivityCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this._config = {};
    this._hass = null;
    
    this._floorResolver = null;
    this._colorCalculator = null;
    
    this._activeList = [];
    this._recentList = [];
    
    // Track previous entity IDs for animations per section
    this._previousActiveIds = new Set();
    this._previousRecentIds = new Set();
    this._exitingItems = new Map();

    this._updateInterval = null;
    this._initialized = false;
    this._initializePromise = null;  // Race guard for concurrent init calls

    // Auto-scroll reset tracking
    this._lastScrollTime = 0;
    this._scrollResetDelay = 60000; // 1 minute in ms

    // Warning tracking (log once per session)
    this._warnedMissingSensors = new Set();

    // Skeleton cleanup tracking (run once)
    this._skeletonsCleared = false;

    // Settings loaded from HA helpers (runtime state)
    this._settings = {
      // Layout
      activeRows: DEFAULTS.activeRows,
      recentRows: DEFAULTS.recentRows,
      activeMaxItems: DEFAULTS.activeMaxItems,
      recentMaxItems: DEFAULTS.recentMaxItems,
      recentFadeDuration: DEFAULTS.recentFadeDuration,
      activeThreshold: DEFAULTS.activeThreshold,

      // Area filters (default: all ON)
      filterAreaBedroom: true,
      filterAreaOffice: true,
      filterArea2ndFloor: true,
      filterArea1stFloor: true,
      filterAreaGroundFloor: true,

      // Door filters (default: all ON)
      filterDoorOffice: true,
      filterDoorBedroom: true,
      filterDoorHouse: true,

      // Camera filter (default: OFF)
      filterCameras: false,

      // Toast notifications
      toastNotifications: false,
      toastScreenBorder: false,

      // Test mode (per-area virtual presence)
      testPresenceBedroom: false,
      testPresenceOffice: false,
      testPresence2ndFloor: false,
      testPresence1stFloor: false,
      testPresenceGroundFloor: false
    };

    // Track if helpers exist (checked on first load)
    this._helpersAvailable = null;

    // Toast rate limiting state
    this._toastTimestamps = [];
    this._toastBatchQueue = [];
    this._toastBatchTimer = null;
    this._isFilterChange = false;
  }

  /**
   * Define config defaults
   */
  static getStubConfig() {
    return {
      area_sensors: [],
      active_rows: DEFAULTS.activeRows,
      recent_rows: DEFAULTS.recentRows,
      active_threshold: DEFAULTS.activeThreshold,
      fade_curve: DEFAULTS.fadeCurve
    };
  }

  /**
   * Card configuration
   */
  setConfig(config) {
    if (!config.area_sensors || !Array.isArray(config.area_sensors)) {
      throw new Error('Please define area_sensors as an array');
    }

    this._config = {
      area_sensors: config.area_sensors,
      active_rows: config.active_rows ?? DEFAULTS.activeRows,
      recent_rows: config.recent_rows ?? DEFAULTS.recentRows,
      active_threshold: config.active_threshold ?? DEFAULTS.activeThreshold,
      recent_fade_duration: config.recent_fade_duration ?? DEFAULTS.recentFadeDuration,
      fade_curve: config.fade_curve ?? DEFAULTS.fadeCurve,
      floor_colors: config.floor_colors ?? {}
    };

    this._colorCalculator = new ActivityColorCalculator({
      activeThresholdSeconds: this._config.active_threshold,
      recentFadeDurationSeconds: this._config.recent_fade_duration,
      fadeCurve: this._config.fade_curve
    });

    if (this._hass) {
      this._initialize();
    }
  }

  /**
   * Home Assistant connection
   */
  set hass(hass) {
    const hadHass = !!this._hass;
    this._hass = hass;
    applyThemeClass(this, hass);

    if (!hadHass && this._config.area_sensors) {
      this._initialize();
    } else if (this._initialized) {
      // Reload colors in case theme changed
      this._colorCalculator?.loadColorsFromElement(this);

      // Sync settings from HA helpers (picks up external changes)
      this._loadSettingsFromHelpers();

      this._updateLists();
    }
  }

  get hass() {
    return this._hass;
  }

  /**
   * Card height hint for Lovelace layout
   */
  getCardSize() {
    // Approximate: 1 card unit � 50px
    const activeRows = this._config?.active_rows ?? DEFAULTS.activeRows;
    const recentRows = this._config?.recent_rows ?? DEFAULTS.recentRows;
    const totalRows = activeRows + recentRows;
    const netGap = Math.max(0, LAYOUT.itemGap - 2 * LAYOUT.negativeMargin);
    const totalHeight = (totalRows * LAYOUT.itemHeight) +
                        ((totalRows - 1) * netGap) +
                        (LAYOUT.sectionPadding * 2);
    return Math.ceil(totalHeight / 50);
  }

  /**
   * Static config element for visual editor (stub)
   */
  static getConfigElement() {
    // TODO: Implement visual editor
    return document.createElement('div');
  }

  /**
   * Connected to DOM
   */
  connectedCallback() {
    if (window.uiFoundation) {
      this.shadowRoot.adoptedStyleSheets = [window.uiFoundation, uiComponents, uiToggles, uiSkeletons, uiNumberInput, cardStyles];
    } else {
      this.shadowRoot.adoptedStyleSheets = [uiComponents, uiToggles, uiSkeletons, uiNumberInput, cardStyles];
      console.warn('[PresenceActivityCard] uiFoundation not found, using fallback styles');
    }
    initButtons(this.shadowRoot);

    this._render();
    this._startUpdateTimer();

    if (this._hass && this._config.area_sensors) {
      this._initialize();
    }
  }

  /**
   * Disconnected from DOM
   */
  disconnectedCallback() {
    this._stopUpdateTimer();
    this._detachScrollListener();

    for (const timeout of this._exitingItems.values()) {
      clearTimeout(timeout);
    }
    this._exitingItems.clear();

    // Clear toast batch timer
    if (this._toastBatchTimer) {
      clearTimeout(this._toastBatchTimer);
      this._toastBatchTimer = null;
    }

    // Reset so reconnect (e.g. exiting edit mode) cleans up fresh skeletons
    this._skeletonsCleared = false;
  }

  /**
   * Attach scroll listener to recent section
   */
  _attachScrollListener() {
    const recentSection = this.shadowRoot.querySelector('.pac-section--recent');
    const scrollIndicator = this.shadowRoot.querySelector('.pac-scroll-indicator');
    if (!recentSection) return;

    this._scrollHandler = () => {
      this._lastScrollTime = Date.now();
      // Toggle scroll indicator
      if (scrollIndicator) {
        scrollIndicator.classList.toggle('is-visible', recentSection.scrollTop > 0);
      }
    };
    recentSection.addEventListener('scroll', this._scrollHandler);
  }

  /**
   * Detach scroll listener
   */
  _detachScrollListener() {
    const recentSection = this.shadowRoot.querySelector('.pac-section--recent');
    if (recentSection && this._scrollHandler) {
      recentSection.removeEventListener('scroll', this._scrollHandler);
    }
    this._scrollHandler = null;
  }

  /**
   * Check and reset scroll position if idle
   */
  _checkScrollReset() {
    const recentSection = this.shadowRoot.querySelector('.pac-section--recent');
    if (!recentSection) return;

    const now = Date.now();
    const timeSinceScroll = now - this._lastScrollTime;

    // If scrolled down and idle for 1 minute, reset to top
    if (recentSection.scrollTop > 0 && timeSinceScroll >= this._scrollResetDelay) {
      // Respect reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      recentSection.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'instant' : 'smooth'
      });
      const scrollIndicator = this.shadowRoot.querySelector('.pac-scroll-indicator');
      if (scrollIndicator) {
        scrollIndicator.classList.remove('is-visible');
      }
    }
  }

  /**
   * Initialize data layer
   */
  async _initialize() {
    // Already initialized
    if (this._initialized) return;

    // Initialization in progress - wait for it
    if (this._initializePromise) {
      return this._initializePromise;
    }

    // Start initialization with race guard
    this._initializePromise = (async () => {
      try {
        // Load settings from HA helpers (or use defaults)
        this._loadSettingsFromHelpers();

        this._floorResolver = new FloorResolver(this._hass);
        await this._floorResolver.initialize();

        for (const [floorId, color] of Object.entries(this._config.floor_colors)) {
          this._floorResolver.setFloorColor(floorId, color);
        }

        // Load activity colors from CSS tokens (theme-aware)
        this._colorCalculator?.loadColorsFromElement(this);

        this._initialized = true;
        this._updateLists();

      } catch (error) {
        console.error('[PresenceActivityCard] Initialization failed:', error);
      } finally {
        this._initializePromise = null;
      }
    })();

    return this._initializePromise;
  }

  /**
   * Start update timer
   */
  _startUpdateTimer() {
    this._stopUpdateTimer();
    this._updateInterval = setInterval(() => {
      if (this._initialized) {
        this._updateVisuals();
        this._checkScrollReset();
      }
    }, 1000);
  }

  /**
   * Stop update timer
   */
  _stopUpdateTimer() {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
  }

  /**
   * Initial render
   */
  _render() {
    // Create varied-width skeleton rows for loading state
    const activeSkeletons = Array(3).fill(0).map((_, i) => `
      <div class="pac-skeleton-row">
        <div class="ui-skeleton ui-skeleton--indicator"></div>
        <div class="ui-skeleton ui-skeleton--name" style="width: ${55 + i * 15}%"></div>
        <div class="ui-skeleton ui-skeleton--time"></div>
      </div>`).join('');

    const recentSkeletons = Array(3).fill(0).map((_, i) => `
      <div class="pac-skeleton-row">
        <div class="ui-skeleton ui-skeleton--indicator"></div>
        <div class="ui-skeleton ui-skeleton--name" style="width: ${70 - i * 10}%"></div>
        <div class="ui-skeleton ui-skeleton--time"></div>
      </div>`).join('');

    this.shadowRoot.innerHTML = `
      <div class="pac-container">
        <div class="pac-section pac-section--active">
          <div class="pac-list" data-section="active">${activeSkeletons}</div>
        </div>
        <div class="pac-divider"></div>
        <div class="pac-scroll-indicator"></div>
        <div class="pac-section pac-section--recent">
          <div class="pac-list" data-section="recent">${recentSkeletons}</div>
        </div>

        <button class="ui-fab ui-fab--regular pac-settings-toggle" aria-label="Settings">
          <span class="pac-settings-icon"></span>
        </button>

        <!-- Settings backdrop -->
        <div class="pac-settings-backdrop"></div>

        <!-- Settings slide-out panel -->
        <div class="pac-settings-panel">
          <div class="pac-settings-header">
            <h3 class="pac-settings-title">Settings</h3>
            <button class="pac-settings-close" aria-label="Close settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="pac-settings-tabs">
            <button class="pac-settings-tab is-active" data-tab="layout">Layout</button>
            <button class="pac-settings-tab" data-tab="filters">Filters</button>
            <button class="pac-settings-tab" data-tab="alerts">Alerts</button>
          </div>

          <div class="pac-settings-content">
            <!-- Layout Tab -->
            <div class="pac-settings-section is-active" data-section="layout">
              <div class="pac-settings-group pac-settings-group--bordered">
                <h4>
                  Row Display
                  <ui-info-icon data-tooltip-key="rowDisplay" position="left"></ui-info-icon>
                </h4>
                <div class="pac-settings-row">
                  <span class="pac-settings-label">Active rows</span>
                  <ui-number-input data-setting="activeRows" value="5" min="1" max="20" aria-label="Active rows"></ui-number-input>
                </div>
                <div class="pac-settings-row">
                  <span class="pac-settings-label">Recent rows</span>
                  <ui-number-input data-setting="recentRows" value="5" min="1" max="20" aria-label="Recent rows"></ui-number-input>
                </div>
              </div>

              <div class="pac-settings-group pac-settings-group--bordered">
                <h4>
                  List Limits
                  <ui-info-icon data-tooltip-key="listLimits" position="left"></ui-info-icon>
                </h4>
                <div class="pac-settings-row">
                  <span class="pac-settings-label">Active max items</span>
                  <ui-number-input data-setting="activeMaxItems" value="10" min="1" max="50" aria-label="Active max items"></ui-number-input>
                </div>
                <div class="pac-settings-row">
                  <span class="pac-settings-label">Recent max items</span>
                  <ui-number-input data-setting="recentMaxItems" value="10" min="1" max="50" aria-label="Recent max items"></ui-number-input>
                </div>
              </div>

              <div class="pac-settings-group">
                <h4>
                  Timing
                  <ui-info-icon data-tooltip-key="timing" position="left"></ui-info-icon>
                </h4>
                <div class="pac-settings-row">
                  <span class="pac-settings-label">Active threshold</span>
                  <span class="pac-settings-value" data-value="activeThreshold">60s</span>
                  <div class="pac-settings-slider-wrap">
                    <div class="ui-slider" data-setting="activeThreshold">
                      <div class="ui-slider__container">
                        <div class="ui-slider__track-active"></div>
                        <div class="ui-slider__track-inactive"></div>
                        <div class="ui-slider__thumb"></div>
                      </div>
                      <input type="range" class="ui-slider__input" min="30" max="300" step="15" value="60">
                    </div>
                  </div>
                </div>
                <div class="pac-settings-row">
                  <span class="pac-settings-label">Fade duration</span>
                  <span class="pac-settings-value" data-value="recentFadeDuration">5m</span>
                  <div class="pac-settings-slider-wrap">
                    <div class="ui-slider" data-setting="recentFadeDuration">
                      <div class="ui-slider__container">
                        <div class="ui-slider__track-active"></div>
                        <div class="ui-slider__track-inactive"></div>
                        <div class="ui-slider__thumb"></div>
                      </div>
                      <input type="range" class="ui-slider__input" min="60" max="600" step="30" value="300">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Filters Tab -->
            <div class="pac-settings-section" data-section="filters">

              <!-- Areas Group -->
              <div class="pac-settings-group pac-settings-group--bordered">
                <h4>
                  Areas
                  <ui-info-icon data-tooltip-key="areas" position="left"></ui-info-icon>
                </h4>
                <div class="pac-filter-buttons">
                  <button class="ui-btn ui-btn--toggle is-selected" data-setting="filterAreaBedroom">Bedroom</button>
                  <button class="ui-btn ui-btn--toggle is-selected" data-setting="filterAreaOffice">Office</button>
                  <button class="ui-btn ui-btn--toggle is-selected" data-setting="filterArea2ndFloor">2nd Floor</button>
                  <button class="ui-btn ui-btn--toggle is-selected" data-setting="filterArea1stFloor">1st Floor</button>
                  <button class="ui-btn ui-btn--toggle is-selected" data-setting="filterAreaGroundFloor">Ground Floor</button>
                </div>
              </div>

              <!-- Doors Group -->
              <div class="pac-settings-group pac-settings-group--bordered">
                <h4>
                  Doors
                  <ui-info-icon data-tooltip-key="doors" position="left"></ui-info-icon>
                </h4>
                <div class="pac-filter-buttons">
                  <button class="ui-btn ui-btn--toggle is-selected" data-setting="filterDoorOffice">Office</button>
                  <button class="ui-btn ui-btn--toggle is-selected" data-setting="filterDoorBedroom">Bedroom</button>
                  <button class="ui-btn ui-btn--toggle is-selected" data-setting="filterDoorHouse">House</button>
                </div>
              </div>

              <!-- Cameras Group -->
              <div class="pac-settings-group">
                <h4>
                  Cameras
                  <ui-info-icon data-tooltip-key="cameras" position="left"></ui-info-icon>
                </h4>
                <div class="pac-filter-buttons">
                  <button class="ui-btn ui-btn--toggle" data-setting="filterCameras">Show Cameras</button>
                </div>
              </div>

            </div>

            <!-- Alerts Tab -->
            <div class="pac-settings-section" data-section="alerts">
              <div class="pac-settings-group">
                <h4>
                  Notifications
                  <ui-info-icon data-tooltip-key="notifications" position="left"></ui-info-icon>
                </h4>
                <div class="pac-settings-row">
                  <span class="pac-settings-label">Browser toasts</span>
                  <label class="ui-icon-switch ui-icon-switch--no-label">
                    <input type="checkbox" class="ui-switch__input" data-setting="toastNotifications">
                    <span class="ui-switch__track">
                      <span class="ui-switch__thumb">
                        <svg class="ui-switch__icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                      </span>
                    </span>
                  </label>
                </div>
                <div class="pac-settings-row">
                  <span class="pac-settings-label">Screen border flash</span>
                  <label class="ui-icon-switch ui-icon-switch--no-label">
                    <input type="checkbox" class="ui-switch__input" data-setting="toastScreenBorder">
                    <span class="ui-switch__track">
                      <span class="ui-switch__thumb">
                        <svg class="ui-switch__icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <!-- Test Mode -->
              <div class="pac-settings-group pac-settings-group--bordered" style="margin-top: var(--ui-space-5); padding-top: var(--ui-space-5); border-top: var(--ui-border-width-s) solid var(--ui-border-color-light);">
                <h4>
                  Test Mode
                  <ui-info-icon data-tooltip-key="testMode" position="left"></ui-info-icon>
                </h4>
                <div class="pac-filter-buttons">
                  <button class="ui-btn ui-btn--toggle" data-setting="testPresenceBedroom">Bedroom</button>
                  <button class="ui-btn ui-btn--toggle" data-setting="testPresenceOffice">Office</button>
                  <button class="ui-btn ui-btn--toggle" data-setting="testPresence2ndFloor">2nd Floor</button>
                  <button class="ui-btn ui-btn--toggle" data-setting="testPresence1stFloor">1st Floor</button>
                  <button class="ui-btn ui-btn--toggle" data-setting="testPresenceGroundFloor">Ground Floor</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach scroll listener after render
    this._attachScrollListener();

    // Attach settings panel handlers
    this._attachSettingsHandlers();

    // Initialize animated settings icon
    this._initSettingsIcon();
  }

  /**
   * Attach settings panel event handlers
   */
  _attachSettingsHandlers() {
    const settingsBtn = this.shadowRoot.querySelector('.pac-settings-toggle');
    const closeBtn = this.shadowRoot.querySelector('.pac-settings-close');
    const backdrop = this.shadowRoot.querySelector('.pac-settings-backdrop');
    const tabs = this.shadowRoot.querySelectorAll('.pac-settings-tab');
    const sliders = this.shadowRoot.querySelectorAll('.ui-slider');
    const toggleInputs = this.shadowRoot.querySelectorAll('.ui-switch__input');
    // Open panel
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this._openSettingsPanel());
    }

    // Close panel
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this._closeSettingsPanel());
    }

    // Close on backdrop click
    if (backdrop) {
      backdrop.addEventListener('click', () => this._closeSettingsPanel());
    }

    // Tab switching
    tabs.forEach(tab => {
      tab.addEventListener('click', () => this._switchSettingsTab(tab.dataset.tab));
    });

    // Slider handlers (ui-slider component)
    sliders.forEach(sliderEl => {
      const input = sliderEl.querySelector('.ui-slider__input');
      const container = sliderEl.querySelector('.ui-slider__container');
      const settingKey = sliderEl.dataset.setting;
      if (!input || !settingKey || !container) return;

      // Create rollback indicator element
      const rollback = document.createElement('div');
      rollback.className = 'ui-slider__rollback';
      container.appendChild(rollback);

      let dragStartPercent = null;
      let isDragging = false;

      // Initialize slider visual state
      this._updateSliderVisuals(sliderEl, input);

      // Handle input changes
      input.addEventListener('input', () => {
        const value = parseFloat(input.value);
        this._updateSliderVisuals(sliderEl, input);
        this._updateSliderValueDisplay(settingKey, value);
        this._writeSettingToHelper(settingKey, value);

        // Capture drag start on first input event after press
        const min = parseFloat(input.min) || 0;
        const max = parseFloat(input.max) || 100;
        const currentPercent = ((value - min) / (max - min)) * 100;

        if (isDragging && dragStartPercent === null) {
          dragStartPercent = currentPercent;
        }

        // Update rollback indicator
        if (dragStartPercent !== null && currentPercent < dragStartPercent) {
          const gap = 5; // thumbAreaHalf
          rollback.style.left = `calc(${currentPercent}% + ${gap}px)`;
          rollback.style.width = `calc(${dragStartPercent - currentPercent}% - ${gap}px)`;
          sliderEl.classList.add('ui-slider--rolling-back');
        } else {
          sliderEl.classList.remove('ui-slider--rolling-back');
        }
      });

      // Handle pressed state for thumb animation
      const onStart = () => {
        sliderEl.classList.add('ui-slider--pressed');
        isDragging = true;
        dragStartPercent = null;
      };
      const onEnd = () => {
        sliderEl.classList.remove('ui-slider--pressed');
        sliderEl.classList.remove('ui-slider--rolling-back');
        isDragging = false;
        dragStartPercent = null;
      };
      input.addEventListener('mousedown', onStart);
      input.addEventListener('touchstart', onStart, { passive: true });
      input.addEventListener('mouseup', onEnd);
      input.addEventListener('mouseleave', onEnd);
      input.addEventListener('touchend', onEnd);
    });

    // Toggle switch handlers (ui-switch component with native checkbox)
    toggleInputs.forEach(input => {
      const settingKey = input.dataset.setting;
      if (!settingKey) return;

      input.addEventListener('change', () => {
        this._writeSettingToHelper(settingKey, input.checked);
      });
    });

    // Toggle button handlers (ui-btn--toggle for filter buttons)
    const toggleButtons = this.shadowRoot.querySelectorAll('.ui-btn--toggle[data-setting]');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('is-selected');
        const settingKey = btn.dataset.setting;
        const value = btn.classList.contains('is-selected');
        this._writeSettingToHelper(settingKey, value);
      });
    });

    // Number input handlers (ui-number-input components)
    const numberInputs = this.shadowRoot.querySelectorAll('ui-number-input[data-setting]');
    numberInputs.forEach(input => {
      input.addEventListener('ui-change', (e) => {
        this._writeSettingToHelper(input.dataset.setting, e.detail.value);
      });
    });

    // Info icon tooltip content assignment (click handling is internal to <ui-info-icon>)
    this.shadowRoot.querySelectorAll('ui-info-icon[data-tooltip-key]').forEach(icon => {
      const key = icon.dataset.tooltipKey;
      if (key && TOOLTIP_CONTENT[key]) {
        icon.tooltipContent = TOOLTIP_CONTENT[key];
      }
    });

  }

  /**
   * Update slider visual elements (track widths and thumb position)
   * Creates the "carved out" geometry where thumb sits in a gap between tracks
   *
   * Token values:
   *   --ui-slider-thumb-width-rest: 6px
   *   --ui-slider-track-radius: 12px (outer ends)
   *   Inner radius (near thumb): 4px
   *   Gap between track end and thumb: 4px
   */
  _updateSliderVisuals(sliderEl, input) {
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || 100;
    const value = parseFloat(input.value) || 0;
    const percent = ((value - min) / (max - min)) * 100;

    const trackActive = sliderEl.querySelector('.ui-slider__track-active');
    const trackInactive = sliderEl.querySelector('.ui-slider__track-inactive');
    const thumb = sliderEl.querySelector('.ui-slider__thumb');

    // Thumb width: 6px, gap each side: 2px
    // Total space for thumb area: 6px + 2px + 2px = 10px (5px each side of center)
    const thumbAreaHalf = 5; // px from thumb center to track end
    const innerRadius = 'var(--ui-slider-thumb-radius)'; // small radius for track ends near thumb

    if (trackActive) {
      trackActive.style.width = `calc(${percent}% - ${thumbAreaHalf}px)`;
      // Outer end (left) gets full pill radius, inner end (right, near thumb) gets small radius
      trackActive.style.borderTopRightRadius = innerRadius;
      trackActive.style.borderBottomRightRadius = innerRadius;
    }
    if (trackInactive) {
      trackInactive.style.width = `calc(${100 - percent}% - ${thumbAreaHalf}px)`;
      // Inner end (left, near thumb) gets small radius, outer end (right) gets full pill radius
      trackInactive.style.borderTopLeftRadius = innerRadius;
      trackInactive.style.borderBottomLeftRadius = innerRadius;
    }
    if (thumb) {
      thumb.style.left = `${percent}%`;
    }
  }

  /**
   * Open settings panel
   */
  _openSettingsPanel() {
    const panel = this.shadowRoot.querySelector('.pac-settings-panel');
    const backdrop = this.shadowRoot.querySelector('.pac-settings-backdrop');

    // Sync UI with current settings before showing
    this._updateSettingsPanelUI();

    // Block scrolling on card sections behind the panel
    const container = this.shadowRoot.querySelector('.pac-container');
    if (container) container.style.overflow = 'hidden';

    if (panel) panel.classList.add('is-open');
    if (backdrop) backdrop.classList.add('is-visible');
  }

  /**
   * Close settings panel
   */
  _closeSettingsPanel() {
    const panel = this.shadowRoot.querySelector('.pac-settings-panel');
    const backdrop = this.shadowRoot.querySelector('.pac-settings-backdrop');

    // Restore scrolling on card sections
    const container = this.shadowRoot.querySelector('.pac-container');
    if (container) container.style.overflow = '';

    if (panel) panel.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-visible');
  }

  /**
   * Initialize the animated settings icon and hover handler
   */
  _initSettingsIcon() {
    const iconContainer = this.shadowRoot.querySelector('.pac-settings-icon');
    if (!iconContainer) return;

    // Initial render
    const svg = this._createAnimatedCogSVG();
    iconContainer.appendChild(svg);

    // Restart animation on each container hover (when icon becomes visible)
    const container = this.shadowRoot.querySelector('.pac-container');
    container?.addEventListener('mouseenter', () => {
      const oldSvg = iconContainer.querySelector('svg');
      if (oldSvg) {
        const newSvg = this._createAnimatedCogSVG();
        oldSvg.replaceWith(newSvg);
      }
    });
  }

  /**
   * Create the animated cog SVG element
   * Animation: inner circle draws, outer circle draws then fades, gear teeth morph outward with slow rotation
   */
  _createAnimatedCogSVG() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');

    svg.innerHTML = `
      <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
        <path stroke-dasharray="22" d="M12 9c1.66 0 3 1.34 3 3c0 1.66 -1.34 3 -3 3c-1.66 0 -3 -1.34 -3 -3c0 -1.66 1.34 -3 3 -3Z">
          <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="22;0" />
        </path>
        <path stroke-dasharray="44" stroke-dashoffset="44" d="M12 5.5c3.59 0 6.5 2.91 6.5 6.5c0 3.59 -2.91 6.5 -6.5 6.5c-3.59 0 -6.5 -2.91 -6.5 -6.5c0 -3.59 2.91 -6.5 6.5 -6.5Z">
          <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.3s" dur="0.5s" to="0" />
          <set fill="freeze" attributeName="opacity" begin="0.8s" to="0" />
        </path>
        <path d="M15.24 6.37c0.41 0.23 0.8 0.51 1.14 0.83c0 0 2.62 -1.08 2.63 -1.06c0 0 1.56 2.7 1.56 2.7c0.01 0.03 -2.22 1.75 -2.22 1.75c0.1 0.45 0.15 0.93 0.15 1.41" opacity="0">
          <animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
          <set fill="freeze" attributeName="opacity" begin="0.8s" to="1" />
          <animate fill="freeze" attributeName="d" begin="0.8s" dur="0.2s" values="M15.24 6.37c0.41 0.23 0.8 0.51 1.14 0.83c0.22 0.2 0.42 0.41 0.61 0.63c0.47 0.57 0.86 1.22 1.12 1.94c0.09 0.26 0.17 0.54 0.24 0.82c0.1 0.45 0.15 0.93 0.15 1.41;M15.24 6.37c0.41 0.23 0.8 0.51 1.14 0.83c0 0 2.62 -1.08 2.63 -1.06c0 0 1.56 2.7 1.56 2.7c0.01 0.03 -2.22 1.75 -2.22 1.75c0.1 0.45 0.15 0.93 0.15 1.41" />
        </path>
        <path d="M18.5 11.99c0.01 0.47 -0.04 0.95 -0.15 1.4c0 0 2.25 1.73 2.23 1.75c0 0 -1.56 2.7 -1.56 2.7c-0.02 0.02 -2.63 -1.05 -2.63 -1.05c-0.34 0.31 -0.73 0.59 -1.15 0.83" opacity="0">
          <animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
          <set fill="freeze" attributeName="opacity" begin="0.8s" to="1" />
          <animate fill="freeze" attributeName="d" begin="0.8s" dur="0.2s" values="M18.5 11.99c0.01 0.47 -0.04 0.95 -0.15 1.4c-0.06 0.29 -0.15 0.57 -0.24 0.84c-0.26 0.69 -0.63 1.35 -1.12 1.94c-0.18 0.21 -0.38 0.42 -0.59 0.62c-0.34 0.31 -0.73 0.59 -1.15 0.83;M18.5 11.99c0.01 0.47 -0.04 0.95 -0.15 1.4c0 0 2.25 1.73 2.23 1.75c0 0 -1.56 2.7 -1.56 2.7c-0.02 0.02 -2.63 -1.05 -2.63 -1.05c-0.34 0.31 -0.73 0.59 -1.15 0.83" />
        </path>
        <path d="M15.26 17.62c-0.4 0.24 -0.84 0.44 -1.29 0.57c0 0 -0.37 2.81 -0.4 2.81c0 0 -3.12 0 -3.12 0c-0.03 -0.01 -0.41 -2.8 -0.41 -2.8c-0.44 -0.14 -0.88 -0.34 -1.3 -0.58" opacity="0">
          <animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
          <set fill="freeze" attributeName="opacity" begin="0.8s" to="1" />
          <animate fill="freeze" attributeName="d" begin="0.8s" dur="0.2s" values="M15.26 17.62c-0.4 0.24 -0.84 0.44 -1.29 0.57c-0.28 0.09 -0.57 0.16 -0.85 0.21c-0.73 0.12 -1.49 0.13 -2.24 0c-0.27 -0.05 -0.55 -0.12 -0.83 -0.2c-0.44 -0.14 -0.88 -0.34 -1.3 -0.58;M15.26 17.62c-0.4 0.24 -0.84 0.44 -1.29 0.57c0 0 -0.37 2.81 -0.4 2.81c0 0 -3.12 0 -3.12 0c-0.03 -0.01 -0.41 -2.8 -0.41 -2.8c-0.44 -0.14 -0.88 -0.34 -1.3 -0.58" />
        </path>
        <path d="M8.76 17.63c-0.41 -0.23 -0.8 -0.51 -1.14 -0.83c0 0 -2.62 1.08 -2.63 1.06c0 0 -1.56 -2.7 -1.56 -2.7c-0.01 -0.03 2.22 -1.75 2.22 -1.75c-0.1 -0.45 -0.15 -0.93 -0.15 -1.41" opacity="0">
          <animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
          <set fill="freeze" attributeName="opacity" begin="0.8s" to="1" />
          <animate fill="freeze" attributeName="d" begin="0.8s" dur="0.2s" values="M8.76 17.63c-0.41 -0.23 -0.8 -0.51 -1.14 -0.83c-0.22 -0.2 -0.42 -0.41 -0.61 -0.63c-0.47 -0.57 -0.86 -1.22 -1.12 -1.94c-0.09 -0.26 -0.17 -0.54 -0.24 -0.82c-0.1 -0.45 -0.15 -0.93 -0.15 -1.41;M8.76 17.63c-0.41 -0.23 -0.8 -0.51 -1.14 -0.83c0 0 -2.62 1.08 -2.63 1.06c0 0 -1.56 -2.7 -1.56 -2.7c-0.01 -0.03 2.22 -1.75 2.22 -1.75c-0.1 -0.45 -0.15 -0.93 -0.15 -1.41" />
        </path>
        <path d="M5.5 12.01c-0.01 -0.47 0.04 -0.95 0.15 -1.4c0 0 -2.25 -1.73 -2.23 -1.75c0 0 1.56 -2.7 1.56 -2.7c0.02 -0.02 2.63 1.05 2.63 1.05c0.34 -0.31 0.73 -0.59 1.15 -0.83" opacity="0">
          <animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
          <set fill="freeze" attributeName="opacity" begin="0.8s" to="1" />
          <animate fill="freeze" attributeName="d" begin="0.8s" dur="0.2s" values="M5.5 12.01c-0.01 -0.47 0.04 -0.95 0.15 -1.4c0.06 -0.29 0.15 -0.57 0.24 -0.84c0.26 -0.69 0.63 -1.35 1.12 -1.94c0.18 -0.21 0.38 -0.42 0.59 -0.62c0.34 -0.31 0.73 -0.59 1.15 -0.83;M5.5 12.01c-0.01 -0.47 0.04 -0.95 0.15 -1.4c0 0 -2.25 -1.73 -2.23 -1.75c0 0 1.56 -2.7 1.56 -2.7c0.02 -0.02 2.63 1.05 2.63 1.05c0.34 -0.31 0.73 -0.59 1.15 -0.83" />
        </path>
        <path d="M8.74 6.38c0.4 -0.24 0.84 -0.44 1.29 -0.57c0 0 0.37 -2.81 0.4 -2.81c0 0 3.12 0 3.12 0c0.03 0.01 0.41 2.8 0.41 2.8c0.44 0.14 0.88 0.34 1.3 0.58" opacity="0">
          <animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
          <set fill="freeze" attributeName="opacity" begin="0.8s" to="1" />
          <animate fill="freeze" attributeName="d" begin="0.8s" dur="0.2s" values="M8.74 6.38c0.4 -0.24 0.84 -0.44 1.29 -0.57c0.28 -0.09 0.57 -0.16 0.85 -0.21c0.73 -0.12 1.49 -0.13 2.24 0c0.27 0.05 0.55 0.12 0.83 0.2c0.44 0.14 0.88 0.34 1.3 0.58;M8.74 6.38c0.4 -0.24 0.84 -0.44 1.29 -0.57c0 0 0.37 -2.81 0.4 -2.81c0 0 3.12 0 3.12 0c0.03 0.01 0.41 2.8 0.41 2.8c0.44 0.14 0.88 0.34 1.3 0.58" />
        </path>
      </g>
    `;

    return svg;
  }

  /**
   * Switch between settings tabs
   */
  _switchSettingsTab(tabName) {
    const tabs = this.shadowRoot.querySelectorAll('.pac-settings-tab');
    const sections = this.shadowRoot.querySelectorAll('.pac-settings-section');

    // Update tab buttons
    tabs.forEach(tab => {
      tab.classList.toggle('is-active', tab.dataset.tab === tabName);
    });

    // Update content sections
    sections.forEach(section => {
      section.classList.toggle('is-active', section.dataset.section === tabName);
    });

    // Reset scroll to top of new tab content
    const content = this.shadowRoot.querySelector('.pac-settings-content');
    if (content) content.scrollTop = 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SETTINGS HELPERS INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Load settings from HA helpers into _settings
   * Falls back to DEFAULTS if helpers don't exist
   */
  _loadSettingsFromHelpers() {
    if (!this._hass) return;

    // Check if helpers exist by looking for the first one
    const testHelper = this._hass.states[HELPERS.activeRows];
    this._helpersAvailable = !!testHelper;

    if (!this._helpersAvailable) {
      // Log available helper-like entities for debugging
      const pacEntities = Object.keys(this._hass.states).filter(e => e.includes('pac_'));
      if (pacEntities.length > 0) {
        console.info('[PresenceActivityCard] Found PAC entities but not expected helpers:', pacEntities);
      } else {
        console.info('[PresenceActivityCard] Helpers not found. Expected:', HELPERS.activeRows);
        console.info('[PresenceActivityCard] Create helpers via packages/occupancy/presence_activity_card.yaml, then restart Home Assistant');
      }
      return;
    }

    console.info('[PresenceActivityCard] Loading settings from HA helpers');

    // Layout helpers (input_number → number)
    this._settings.activeRows = getHelperNumber(this._hass, HELPERS.activeRows, DEFAULTS.activeRows);
    this._settings.recentRows = getHelperNumber(this._hass, HELPERS.recentRows, DEFAULTS.recentRows);
    this._settings.activeMaxItems = getHelperNumber(this._hass, HELPERS.activeMaxItems, DEFAULTS.activeMaxItems);
    this._settings.recentMaxItems = getHelperNumber(this._hass, HELPERS.recentMaxItems, DEFAULTS.recentMaxItems);
    this._settings.recentFadeDuration = getHelperNumber(this._hass, HELPERS.recentFadeDuration, DEFAULTS.recentFadeDuration);
    this._settings.activeThreshold = getHelperNumber(this._hass, HELPERS.activeThreshold, DEFAULTS.activeThreshold);

    // Area filter helpers (input_boolean → boolean)
    this._settings.filterAreaBedroom = getHelperBoolean(this._hass, HELPERS.filterAreaBedroom, true);
    this._settings.filterAreaOffice = getHelperBoolean(this._hass, HELPERS.filterAreaOffice, true);
    this._settings.filterArea2ndFloor = getHelperBoolean(this._hass, HELPERS.filterArea2ndFloor, true);
    this._settings.filterArea1stFloor = getHelperBoolean(this._hass, HELPERS.filterArea1stFloor, true);
    this._settings.filterAreaGroundFloor = getHelperBoolean(this._hass, HELPERS.filterAreaGroundFloor, true);

    // Door filter helpers (input_boolean → boolean)
    this._settings.filterDoorOffice = getHelperBoolean(this._hass, HELPERS.filterDoorOffice, true);
    this._settings.filterDoorBedroom = getHelperBoolean(this._hass, HELPERS.filterDoorBedroom, true);
    this._settings.filterDoorHouse = getHelperBoolean(this._hass, HELPERS.filterDoorHouse, true);

    // Camera filter helper (input_boolean → boolean)
    this._settings.filterCameras = getHelperBoolean(this._hass, HELPERS.filterCameras, false);

    // Toast notification helpers (input_boolean → boolean)
    this._settings.toastNotifications = getHelperBoolean(this._hass, HELPERS.toastNotifications, false);
    this._settings.toastScreenBorder = getHelperBoolean(this._hass, HELPERS.toastScreenBorder, false);

    // Test mode helpers (per-area virtual presence)
    this._settings.testPresenceBedroom = getHelperBoolean(this._hass, HELPERS.testPresenceBedroom, false);
    this._settings.testPresenceOffice = getHelperBoolean(this._hass, HELPERS.testPresenceOffice, false);
    this._settings.testPresence2ndFloor = getHelperBoolean(this._hass, HELPERS.testPresence2ndFloor, false);
    this._settings.testPresence1stFloor = getHelperBoolean(this._hass, HELPERS.testPresence1stFloor, false);
    this._settings.testPresenceGroundFloor = getHelperBoolean(this._hass, HELPERS.testPresenceGroundFloor, false);

    // Apply loaded settings to color calculator
    this._colorCalculator?.configure({
      activeThresholdSeconds: this._settings.activeThreshold,
      recentFadeDurationSeconds: this._settings.recentFadeDuration
    });
  }

  /**
   * Write a setting value to its HA helper
   * @param {string} settingKey - Key in this._settings
   * @param {number|boolean} value - Value to write
   */
  async _writeSettingToHelper(settingKey, value) {
    // Always update local state immediately for responsive UI
    this._settings[settingKey] = value;

    // If layout setting changed, update visuals immediately
    if (['activeRows', 'recentRows'].includes(settingKey)) {
      this._updateVisuals();
    }

    // If timing setting changed, update color calculator
    if (['activeThreshold', 'recentFadeDuration'].includes(settingKey)) {
      this._colorCalculator?.configure({
        activeThresholdSeconds: this._settings.activeThreshold,
        recentFadeDurationSeconds: this._settings.recentFadeDuration
      });
    }

    // If filter setting changed, refresh lists (but skip toast notifications)
    if (settingKey.startsWith('filter')) {
      this._isFilterChange = true;
      this._updateLists();
      this._isFilterChange = false;
    }

    // Skip HA persistence if helpers not available
    if (!this._hass || !this._helpersAvailable) {
      console.warn(`[PresenceActivityCard] Setting ${settingKey} updated locally only (helpers not available)`);
      return;
    }

    const entityId = HELPERS[settingKey];
    if (!entityId) {
      console.warn(`[PresenceActivityCard] No helper defined for setting: ${settingKey}`);
      return;
    }

    try {
      await persistHelper(this._hass, entityId, value);
    } catch (error) {
      console.error(`[PresenceActivityCard] Failed to persist setting ${settingKey} to ${entityId}:`, error);
    }
  }

  /**
   * Update settings panel UI to reflect current _settings values
   */
  _updateSettingsPanelUI() {
    // Update sliders (ui-slider component)
    const sliders = this.shadowRoot.querySelectorAll('.ui-slider');
    sliders.forEach(sliderEl => {
      const settingKey = sliderEl.dataset.setting;
      const input = sliderEl.querySelector('.ui-slider__input');
      if (!input || this._settings[settingKey] === undefined) return;

      input.value = this._settings[settingKey];
      this._updateSliderVisuals(sliderEl, input);
      this._updateSliderValueDisplay(settingKey, this._settings[settingKey]);
    });

    // Update toggles (ui-switch component with native checkbox)
    const toggleInputs = this.shadowRoot.querySelectorAll('.ui-switch__input');
    toggleInputs.forEach(input => {
      const settingKey = input.dataset.setting;
      if (this._settings[settingKey] !== undefined) {
        input.checked = this._settings[settingKey];
      }
    });

    // Update toggle buttons (ui-btn--toggle for filter buttons)
    const toggleButtons = this.shadowRoot.querySelectorAll('.ui-btn--toggle[data-setting]');
    toggleButtons.forEach(btn => {
      const settingKey = btn.dataset.setting;
      if (this._settings[settingKey] !== undefined) {
        btn.classList.toggle('is-selected', this._settings[settingKey]);
      }
    });

    // Sync number input components
    const numberInputs = this.shadowRoot.querySelectorAll('ui-number-input[data-setting]');
    numberInputs.forEach(input => {
      const settingKey = input.dataset.setting;
      if (this._settings[settingKey] !== undefined) {
        input.value = this._settings[settingKey];
      }
    });

  }

  /**
   * Update the displayed value label for a slider
   */
  _updateSliderValueDisplay(settingKey, value) {
    const valueEl = this.shadowRoot.querySelector(`[data-value="${settingKey}"]`);
    if (!valueEl) return;

    // Format value based on setting type
    let displayValue;
    switch (settingKey) {
      case 'activeRows':
      case 'recentRows':
        displayValue = value;
        break;
      case 'activeThreshold':
        // Convert seconds to minutes for display when >= 60s
        displayValue = value >= 60 ? `${Math.round(value / 60)}m` : `${value}s`;
        break;
      case 'recentFadeDuration':
        // Convert seconds to minutes for display
        displayValue = value >= 60 ? `${Math.round(value / 60)}m` : `${value}s`;
        break;
      default:
        displayValue = value;
    }

    valueEl.textContent = displayValue;
  }


  /**
   * Update both lists from sensor attributes
   */
  _updateLists() {
    const activeItems = [];
    const recentItems = [];
    const seenActive = new Set();
    const seenRecent = new Set();

    for (const sensorId of this._config.area_sensors) {
      const sensor = this._hass.states[sensorId];
      if (!sensor) {
        // Warn once per session for missing sensors
        if (!this._warnedMissingSensors.has(sensorId)) {
          console.warn(`[PresenceActivityCard] Configured sensor not found: ${sensorId}`);
          this._warnedMissingSensors.add(sensorId);
        }
        continue;
      }

      const attrs = sensor.attributes;
      const areaId = attrs.area_id;
      const floorInfo = this._floorResolver?.getFloorForArea(areaId);

      // Active sensors
      const activeSensors = this._parseJsonAttribute(attrs.active_sensors);
      for (const entityId of activeSensors) {
        if (seenActive.has(entityId)) continue;

        const entityState = this._hass.states[entityId];
        if (!entityState) continue;

        // Apply area/door/camera filters
        if (!this._passesFilters(entityId, areaId)) continue;

        seenActive.add(entityId);
        activeItems.push({
          entityId,
          name: entityState.attributes.friendly_name || entityId,
          lastChanged: this._getEntityTimestamp(entityState),
          areaId,
          areaName: attrs.area_name,
          floor: floorInfo
        });
      }

      // Recently off sensors
      const recentlyOff = this._parseJsonAttribute(attrs.recently_off_sensors);
      for (const entityId of recentlyOff) {
        if (seenRecent.has(entityId)) continue;

        const entityState = this._hass.states[entityId];
        if (!entityState) continue;

        // Apply area/door/camera filters
        if (!this._passesFilters(entityId, areaId)) continue;

        seenRecent.add(entityId);
        recentItems.push({
          entityId,
          name: entityState.attributes.friendly_name || entityId,
          lastChanged: this._getEntityTimestamp(entityState),
          areaId,
          areaName: attrs.area_name,
          floor: floorInfo
        });
      }
    }

    // Add camera entities directly if camera filter is enabled
    // (Cameras are not included in area presence sensors by design)
    if (this._settings.filterCameras) {
      const cameraEntities = Object.keys(this._hass.states)
        .filter(entityId => CAMERA_ENTITY_PATTERN.test(entityId));

      const recentWindowMs = this._settings.recentFadeDuration * 1000;
      const now = Date.now();

      for (const entityId of cameraEntities) {
        const entityState = this._hass.states[entityId];
        if (!entityState) continue;

        const lastChangedMs = new Date(entityState.last_changed).getTime();
        const ageMs = now - lastChangedMs;

        // Look up area and floor from entity/device registry
        const areaId = this._floorResolver?.getAreaIdForEntity(entityId) || null;
        const area = areaId ? this._floorResolver?.getArea(areaId) : null;
        const floorInfo = areaId ? this._floorResolver?.getFloorForArea(areaId) : null;

        if (entityState.state === 'on') {
          // Active camera - add to active list
          if (seenActive.has(entityId)) continue;
          seenActive.add(entityId);
          activeItems.push({
            entityId,
            name: entityState.attributes.friendly_name || entityId,
            lastChanged: this._getEntityTimestamp(entityState),
            areaId: areaId,
            areaName: area?.name || 'Cameras',
            floor: floorInfo
          });
        } else if (ageMs <= recentWindowMs) {
          // Recently off camera - add to recent list
          if (seenRecent.has(entityId)) continue;
          seenRecent.add(entityId);
          recentItems.push({
            entityId,
            name: entityState.attributes.friendly_name || entityId,
            lastChanged: this._getEntityTimestamp(entityState),
            areaId: areaId,
            areaName: area?.name || 'Cameras',
            floor: floorInfo
          });
        }
      }
    }

    // Active: sort oldest→newest (newest at bottom, near center)
    activeItems.sort((a, b) => new Date(a.lastChanged) - new Date(b.lastChanged));

    // Recent: sort newest→oldest (newest at top, near center)
    recentItems.sort((a, b) => new Date(b.lastChanged) - new Date(a.lastChanged));

    // Apply limits from settings
    this._activeList = activeItems.slice(-this._settings.activeMaxItems);
    this._recentList = recentItems.slice(0, this._settings.recentMaxItems);

    // Detect changes and trigger toast notifications (before updating previous IDs)
    this._detectListChanges();

    this._updateVisuals();
  }

  /**
   * Check if entity passes all filter criteria (area, door, camera)
   * @param {string} entityId - The entity ID
   * @param {string} areaId - The area_id from the source presence sensor
   * @returns {boolean} True if entity should be shown
   */
  _passesFilters(entityId, areaId) {
    // 1. Area filter - check if entity's area is enabled
    const areaSettingKey = AREA_FILTER_MAP[areaId];
    if (areaSettingKey && !this._settings[areaSettingKey]) {
      return false;
    }

    // 2. Door filter - check specific door entities
    const doorSettingKey = DOOR_FILTER_MAP[entityId];
    if (doorSettingKey && !this._settings[doorSettingKey]) {
      return false;
    }

    // 3. Camera filter - check if entity matches camera pattern
    if (CAMERA_ENTITY_PATTERN.test(entityId) && !this._settings.filterCameras) {
      return false;
    }

    return true;
  }

  /**
   * Parse JSON attribute safely
   */
  _parseJsonAttribute(attr) {
    if (!attr) return [];
    if (Array.isArray(attr)) return attr;
    if (typeof attr === 'string') {
      try {
        const parsed = JSON.parse(attr);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // Log warning for malformed JSON (helps debug sensor template issues)
        console.warn('[PresenceActivityCard] Failed to parse JSON attribute:', attr.substring(0, 50));
        return [];
      }
    }
    return [];
  }

  /**
   * Get the best timestamp for an entity.
   * Prefers persisted last_state_change attribute (survives reloads) over last_changed.
   * @param {Object} entityState - The HA entity state object
   * @returns {string} ISO timestamp string
   */
  _getEntityTimestamp(entityState) {
    const attrs = entityState.attributes || {};

    // Prefer persisted timestamp from last_state_change attribute (e.g., door sensors)
    const persisted = (attrs.last_state_change || '').toString().trim();
    if (persisted && persisted !== 'unknown' && persisted !== 'unavailable') {
      // Handle space-separated datetime format from input_datetime helpers
      const iso = persisted.includes(' ') ? persisted.replace(' ', 'T') : persisted;
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime()) && d.getFullYear() > 2020) {
        return d.toISOString();
      }
    }

    // Fall back to HA's last_changed
    return entityState.last_changed;
  }

  // ╭────────────────────────────────────────────────────────────╮
  // │   TOAST NOTIFICATIONS                                      │
  // ╰────────────────────────────────────────────────────────────╯

  /**
   * Detect items entering the active list and trigger toast notifications.
   * Called before _updateVisuals() to compare against previous state.
   */
  _detectListChanges() {
    // Skip if toasts not enabled
    if (!this._settings.toastNotifications) return;

    // Skip on initial load (no previous state to compare)
    if (!this._initialized) return;

    // Skip if this update was triggered by filter change
    if (this._isFilterChange) return;

    // Detect new active items
    for (const item of this._activeList) {
      if (!this._previousActiveIds.has(item.entityId)) {
        // Skip camera false positives caused by lights turning off
        if (this._isLightOffFalsePositive(item.entityId)) continue;
        this._queueToast({ type: 'active', item });
      }
    }
  }

  /**
   * Check if camera motion was likely caused by a light turning off.
   * When a light turns off, cameras detect the sudden darkness as motion.
   * This is a false positive that should be suppressed.
   *
   * @param {string} entityId - The camera motion sensor entity
   * @returns {boolean} True if this is likely a false positive
   */
  _isLightOffFalsePositive(entityId) {
    // Only applies to camera sensors (c##_motion, c##_person, etc.)
    if (!CAMERA_ENTITY_PATTERN.test(entityId)) return false;

    // Get camera's area
    const areaId = this._floorResolver?.getAreaIdForEntity(entityId);
    if (!areaId) return false;

    // Find lights in the same area that turned off recently
    const now = Date.now();
    const suppressionWindow = 2000; // 2 seconds
    const areaLights = this._floorResolver.getEntityIdsInArea(areaId, 'light.');

    for (const lightId of areaLights) {
      const lightState = this._hass.states[lightId];
      if (!lightState) continue;

      // Check if light is off AND turned off recently
      if (lightState.state === 'off') {
        const lastChanged = new Date(lightState.last_changed).getTime();
        if (now - lastChanged < suppressionWindow) {
          return true; // Light just turned off - suppress camera notification
        }
      }
    }

    return false;
  }

  /**
   * Queue a toast notification with rate limiting.
   * @param {Object} notification - { type: 'active'|'inactive', item: {...} }
   */
  _queueToast(notification) {
    const now = Date.now();

    // Clean old timestamps outside the rate limit window
    this._toastTimestamps = this._toastTimestamps.filter(
      ts => now - ts < TOAST_RATE_LIMIT_WINDOW
    );

    // Reserve slot first to prevent same-tick races, then check limit
    this._toastTimestamps.push(now);
    if (this._toastTimestamps.length <= TOAST_RATE_LIMIT_MAX) {
      // Show immediately
      this._showToast(notification);
    } else {
      // Over limit — remove the slot we just reserved and batch instead
      this._toastTimestamps.pop();
      // Add to batch queue for later
      this._toastBatchQueue.push(notification);
      this._scheduleBatchToast();
    }
  }

  /**
   * Schedule a batched toast for queued notifications.
   */
  _scheduleBatchToast() {
    if (this._toastBatchTimer) return;

    this._toastBatchTimer = setTimeout(() => {
      this._toastBatchTimer = null;

      if (this._toastBatchQueue.length === 0) return;

      // Count by type
      const activeCount = this._toastBatchQueue.filter(n => n.type === 'active').length;
      const inactiveCount = this._toastBatchQueue.filter(n => n.type === 'inactive').length;

      // Build summary message
      let message = '';
      if (activeCount > 0 && inactiveCount > 0) {
        message = `${activeCount} sensor${activeCount > 1 ? 's' : ''} active, ${inactiveCount} inactive`;
      } else if (activeCount > 0) {
        message = `${activeCount} sensor${activeCount > 1 ? 's' : ''} now active`;
      } else {
        message = `${inactiveCount} sensor${inactiveCount > 1 ? 's' : ''} now inactive`;
      }

      this._showToastDirect({
        message,
        icon: 'mdi:motion-sensor',
        isBatch: true
      });

      // Clear queue and record timestamp
      this._toastBatchQueue = [];
      this._toastTimestamps.push(Date.now());

    }, TOAST_RATE_LIMIT_WINDOW);
  }

  /**
   * Show a toast notification for a single item.
   * @param {Object} notification - { type, item }
   */
  _showToast(notification) {
    const { type, item } = notification;

    const icon = type === 'active' ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off';
    const verb = type === 'active' ? 'detected' : 'cleared';
    const message = `${item.name} ${verb}`;
    const color = item.floor?.color || '';

    this._showToastDirect({ message, icon, color });
  }

  /**
   * Show a toast with optional screen border flash.
   * @param {Object} options - { message, icon, color, isBatch }
   */
  _showToastDirect(options) {
    const { message, icon, color = '', isBatch = false } = options;

    // Show toast directly using the shared toast system
    showToast({
      message,
      icon,
      color: color || undefined,
      duration: TOAST_DURATION
    });

    // Optional screen border flash
    if (this._settings.toastScreenBorder) {
      flashScreenBorder({
        duration: TOAST_DURATION,
        // Use floor color, or amber for batch notifications
        color: isBatch ? 'rgb(255, 180, 46)' : (color || undefined)
      });
    }
  }

  /**
   * Calculate section height in pixels from row count
   */
  _rowsToHeight(rows) {
    // Each item: 24px visual height. Gap between items: 12px flex gap,
    // but negative margins (-12px each side) cause overlap.
    // Net per-slot = itemHeight + max(0, gap - 2*negativeMargin)
    const netGap = Math.max(0, LAYOUT.itemGap - 2 * LAYOUT.negativeMargin);
    return (rows * LAYOUT.itemHeight) +
           ((rows - 1) * netGap) +
           LAYOUT.sectionPadding;
  }

  /**
   * Update visual elements
   */
  _updateVisuals() {
    this._updateSection('active', this._activeList, this._previousActiveIds);
    this._updateSection('recent', this._recentList, this._previousRecentIds);

    // Update previous IDs
    this._previousActiveIds = new Set(this._activeList.map(i => i.entityId));
    this._previousRecentIds = new Set(this._recentList.map(i => i.entityId));

    // Set fixed section heights based on settings (only when changed)
    const activeSection = this.shadowRoot.querySelector('.pac-section--active');
    const recentSection = this.shadowRoot.querySelector('.pac-section--recent');
    const activeHeight = `${this._rowsToHeight(this._settings.activeRows)}px`;
    const recentHeight = `${this._rowsToHeight(this._settings.recentRows)}px`;

    if (activeSection && activeSection.style.height !== activeHeight) {
      activeSection.style.height = activeHeight;
    }

    if (recentSection && recentSection.style.height !== recentHeight) {
      recentSection.style.height = recentHeight;
    }
  }

  /**
   * Update a single section
   */
  _updateSection(sectionName, items, previousIds) {
    const listEl = this.shadowRoot.querySelector(`[data-section="${sectionName}"]`);
    if (!listEl) return;

    const currentIds = new Set(items.map(i => i.entityId));
    const isActive = sectionName === 'active';

    // Clear loading skeletons on first data load — fade out before removing
    if (!this._skeletonsCleared) {
      const skeletons = listEl.querySelectorAll('.pac-skeleton-row');
      if (skeletons.length > 0) {
        skeletons.forEach((el, i) => {
          el.style.willChange = 'opacity';
          el.style.transition = 'opacity 150ms ease-out';
          el.style.transitionDelay = `${i * 40}ms`;
          el.style.opacity = '0';
          setTimeout(() => {
            el.style.willChange = 'auto';
            el.remove();
          }, 150 + i * 40);
        });
      }
      // Mark cleared after both sections have been processed
      if (sectionName === 'recent') {
        this._skeletonsCleared = true;
      }
    }

    // Animate out removed items
    for (const prevId of previousIds) {
      if (!currentIds.has(prevId) && !this._exitingItems.has(prevId)) {
        this._animateOut(listEl, prevId);
      }
    }

    // Remove empty message if items exist
    const emptyEl = listEl.querySelector('.pac-empty');
    if (emptyEl && items.length > 0) {
      emptyEl.remove();
    }

    // Update or create items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const elapsed = getSecondsElapsed(item.lastChanged);
      const timeStr = formatElapsedTime(elapsed);

      // Calculate colors based on elapsed time using ActivityColorCalculator
      const colorType = isActive ? 'active' : 'recent';
      const colors = this._colorCalculator.getColors(colorType, elapsed);
      const floorColor = item.floor?.color || 'var(--ui-text-mute)';

      // Apply floor indicator fade
      const floorOpacity = colors.opacity;

      let itemEl = listEl.querySelector(`[data-entity="${item.entityId}"]`);
      const isNew = !itemEl && !previousIds.has(item.entityId);

      if (!itemEl) {
        itemEl = this._createItemElement(item, colors, timeStr, floorColor, floorOpacity, isNew);
        listEl.appendChild(itemEl);
      } else {
        this._updateItemElement(itemEl, colors, timeStr, floorColor, floorOpacity);
      }
    }

    // Reorder items only when DOM order doesn't match data order
    const domItems = listEl.querySelectorAll('.pac-item:not(.pac-item--exiting)');
    const domOrder = Array.from(domItems).map(el => el.dataset.entity);
    const dataOrder = items.map(i => i.entityId);
    const needsReorder = domOrder.length !== dataOrder.length ||
      domOrder.some((id, idx) => id !== dataOrder[idx]);
    if (needsReorder) {
      for (const item of items) {
        const itemEl = listEl.querySelector(`[data-entity="${item.entityId}"]:not(.pac-item--exiting)`);
        if (itemEl) {
          listEl.appendChild(itemEl);
        }
      }
    }

    // Show empty state if needed
    if (items.length === 0 && !listEl.querySelector('.pac-empty')) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'pac-empty';
      emptyMsg.setAttribute('role', 'status');
      emptyMsg.setAttribute('aria-live', 'polite');
      emptyMsg.textContent = sectionName === 'active' ? 'No active presence' : 'No recent activity';
      listEl.appendChild(emptyMsg);
    }
  }

  /**
   * Create new item element
   * Uses programmatic DOM construction (no innerHTML) to prevent XSS
   */
  _createItemElement(item, colors, timeStr, floorColor, floorOpacity, animate) {
    const itemEl = document.createElement('div');
    itemEl.className = 'pac-item' + (animate ? ' pac-item--entering' : '');
    itemEl.dataset.entity = item.entityId;

    // Accessibility: make item focusable and announce as button
    itemEl.setAttribute('tabindex', '0');
    itemEl.setAttribute('role', 'button');
    itemEl.setAttribute('aria-label', `${item.name}, ${timeStr}`);

    itemEl.style.color = colors.text;
    itemEl.style.opacity = colors.opacity;
    itemEl.style.fontSize = colors.fontSize;

    // Floor indicator
    const floorIndicator = document.createElement('div');
    floorIndicator.className = 'pac-item__floor-indicator';
    floorIndicator.style.background = floorColor;
    floorIndicator.style.opacity = floorOpacity;

    // Name (uses textContent for XSS safety)
    const nameEl = document.createElement('span');
    nameEl.className = 'pac-item__name';
    nameEl.textContent = item.name;

    // Time
    const timeEl = document.createElement('span');
    timeEl.className = 'pac-item__time';
    timeEl.textContent = timeStr;

    // Assemble
    itemEl.appendChild(floorIndicator);
    itemEl.appendChild(nameEl);
    itemEl.appendChild(timeEl);

    // Handler for opening more-info dialog
    const openMoreInfo = () => {
      this.dispatchEvent(new CustomEvent('hass-more-info', {
        bubbles: true,
        composed: true,
        detail: { entityId: item.entityId }
      }));
    };

    // Click handler
    itemEl.addEventListener('click', openMoreInfo);

    // Keyboard handler (Enter/Space)
    itemEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMoreInfo();
      }
    });

    if (animate) {
      setTimeout(() => {
        itemEl.classList.remove('pac-item--entering');
      }, 320);
    }

    return itemEl;
  }

  /**
   * Update existing item element (only touches DOM when values actually changed)
   */
  _updateItemElement(itemEl, colors, timeStr, floorColor, floorOpacity) {
    if (itemEl.style.color !== colors.text) itemEl.style.color = colors.text;
    if (itemEl.style.opacity !== String(colors.opacity)) itemEl.style.opacity = colors.opacity;
    if (itemEl.style.fontSize !== colors.fontSize) itemEl.style.fontSize = colors.fontSize;

    const floorIndicator = itemEl.querySelector('.pac-item__floor-indicator');
    if (floorIndicator) {
      if (floorIndicator.style.background !== floorColor) floorIndicator.style.background = floorColor;
      if (floorIndicator.style.opacity !== String(floorOpacity)) floorIndicator.style.opacity = floorOpacity;
    }

    const timeEl = itemEl.querySelector('.pac-item__time');
    if (timeEl && timeEl.textContent !== timeStr) {
      timeEl.textContent = timeStr;
    }
  }

  /**
   * Animate out and remove item
   */
  _animateOut(listEl, entityId) {
    const itemEl = listEl.querySelector(`[data-entity="${entityId}"]`);
    if (!itemEl || itemEl.classList.contains('pac-item--exiting')) return;

    itemEl.classList.add('pac-item--exiting');
    this._exitingItems.set(entityId, setTimeout(() => {
      itemEl.remove();
      this._exitingItems.delete(entityId);
    }, 250));
  }
}

customElements.define('presence-activity-card', PresenceActivityCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'presence-activity-card',
  name: 'Presence Activity Card',
  description: 'Two-section activity display with center focal point'
});