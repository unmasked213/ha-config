/* ===========================================================================
 *  SHARED UI SYSTEM — FOUNDATION.JS
 * ===========================================================================
 *
 *  Token-driven foundation for Home Assistant custom cards.
 *  Documentation:  www/base/docs/
 *
 *  Structure:
 *    1. Global reset (shadow DOM scope)
 *    2. Host reset & root tokens (theme-independent)
 *    3. Theme-identical colors (shared across light/dark)
 *    4. Light theme colors (default)
 *    5. Dark theme colors (.dark-theme class)
 *    6. Dark theme media-query fallback (standalone usage)
 *    7. Utility classes
 *
 *  Theme cascade:
 *    :host                      → root tokens + light defaults
 *    :host(.dark-theme)         → dark overrides (higher specificity)
 *    @media(dark) :host(:not…)  → dark fallback (must mirror .dark-theme)
 *
 * =========================================================================== */

const sheet = new CSSStyleSheet();
sheet.replaceSync(`

  /* ═══════════════════════════════════════════════════════════════════════════
     1. GLOBAL RESET
     ═══════════════════════════════════════════════════════════════════════════ */

  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  :focus-visible {
    outline-offset: var(--ui-focus-outline-offset);
  }

  :focus:not(:focus-visible) {
    outline: none;
  }

  svg {
    shape-rendering: geometricPrecision;
  }


  /* ═══════════════════════════════════════════════════════════════════════════
     2. HOST RESET & ROOT TOKENS
     Theme-independent values: scales, geometry, layout, motion.
     ═══════════════════════════════════════════════════════════════════════════ */

  :host {
    all: initial;
    display: block;
    font-family: var(--ui-font-family, var(--ha-font-family, system-ui, sans-serif));
    line-height: 1.45;
    color: var(--ui-text);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    font-kerning: normal;


    /* ── Spacing Scale ─────────────────────────────────────────────────── */
    --ui-space-1: 4px;
    --ui-space-2: 8px;
    --ui-space-3: 12px;
    --ui-space-4: 16px;
    --ui-space-5: 20px;
    --ui-space-6: 24px;
    --ui-space-7: 28px;
    --ui-space-8: 32px;
    --ui-space-9: 40px;
    --ui-space-10: 48px;

    /* ── Radii ─────────────────────────────────────────────────────────── */
    --ui-radius-s: 8px;
    --ui-radius-m: 12px;
    --ui-radius-l: 18px;
    --ui-radius-xl: 32px;
    --ui-radius-pill: 999px;

    /* ── Border Widths ─────────────────────────────────────────────────── */
    --ui-border-width-s: 1px;
    --ui-border-width-m: 2px;
    --ui-border-width-l: 3px;
    --ui-border-style: solid;

    /* ── Typography ────────────────────────────────────────────────────── */
    --ui-font-xs: 0.75rem;      /*  12px       */
    --ui-font-s: 0.86rem;       /*  ~14px      */
    --ui-font-m: 1rem;          /*  16px base  */
    --ui-font-l: 1.15rem;       /*  ~18px      */
    --ui-font-xl: 1.32rem;      /*  ~21px      */

    --ui-font-weight-s: 300;
    --ui-font-weight-m: 400;
    --ui-font-weight-l: 500;

    --ui-font-line-height-s: 1.2;
    --ui-font-line-height-m: 1.4;
    --ui-font-line-height-l: 1.6;

    --ui-font-letter-spacing-s: 0.8px;
    --ui-font-letter-spacing-m: 0.5px;
    --ui-font-letter-spacing-l: 0.2px;

    /* ── Motion ────────────────────────────────────────────────────────── */
    --ui-motion-fast: 120ms cubic-bezier(0.2, 0, 0.2, 1);
    --ui-motion-med: 240ms cubic-bezier(0.2, 0, 0.2, 1);
    --ui-motion-slow: 360ms cubic-bezier(0.2, 0, 0.2, 1);
    --ui-switch-motion: 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
    --ui-switch-secondary-motion: 250ms ease-out;

    /* ── Animation Primitives ──────────────────────────────────────────── */
    --ui-anim-translate: 6px;
    --ui-anim-scale: 0.96;
    --ui-anim-scale-subtle: 0.98;
    --ui-switch-icon-scale: 0.67;

    /* ── Animation Easing Curves ───────────────────────────────────────── */
    --ui-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    --ui-ease-spring-heavy: cubic-bezier(0.35, 1.7, 0.45, 0.9);
    --ui-ease-bounce: cubic-bezier(0.12, 0.5, 0.86, 1);

    /* ── Animation Parameters ──────────────────────────────────────────── */
    --ui-pop-from-scale: 0;
    --ui-pop-overshoot: 1.05;
    --ui-pop-from-y: 0px;
    --ui-anim-from-x: 0px;
    --ui-anim-from-y: 0px;
    --ui-anim-delay: 0s;
    --ui-anim-duration: 1s;

    /* ── Z-Index Scale ─────────────────────────────────────────────────── */
    --ui-z-base: 0;
    --ui-z-tooltip: 10;
    --ui-z-menu: 20;
    --ui-z-dialog: 30;
    --ui-z-toast: 40;
    --ui-z-max: 50;

    /* ── State Layers (geometry) ────────────────────────────────────────── */
    --ui-state-ring-spread: 6px;
    --ui-state-disabled-opacity: 0.4;
    --ui-focus-outline-offset: 2px;

    /* ── Layout ────────────────────────────────────────────────────────── */
    --ui-layout-card-padding: var(--ui-space-6);
    --ui-layout-section-gap: var(--ui-space-4);
    --ui-layout-row-gap: var(--ui-space-3);
    --ui-layout-col-gap: var(--ui-space-3);
    --ui-layout-header-padding: var(--ui-space-3);
    --ui-layout-footer-padding: var(--ui-space-3);

    /* ── Inputs ─────────────────────────────────────────────────────────── */
    --ui-input-height: 40px;
    --ui-input-padding-x: var(--ui-space-4);
    --ui-input-padding-y: var(--ui-space-2);
    --ui-input-label-offset: 37px;

    /* ── Switches / Toggles ────────────────────────────────────────────── */
    --ui-switch-track-width: 48px;
    --ui-switch-track-height: 32px;
    --ui-switch-track-radius: 16px;
    --ui-switch-outline-width: 2px;
    --ui-switch-thumb-size-off: 16px;
    --ui-switch-thumb-size-on: 24px;
    --ui-switch-thumb-radius: 50%;
    --ui-switch-gap: var(--ui-space-2);
    --ui-switch-touch-target: 48px;

    /* ── Sliders ────────────────────────────────────────────────────────── */
    --ui-slider-track-height: 24px;
    --ui-slider-track-radius: 12px;
    --ui-slider-thumb-height: 44px;
    --ui-slider-thumb-width-rest: 6px;
    --ui-slider-thumb-width-pressed: 4px;
    --ui-slider-thumb-radius: 4px;
    --ui-slider-gap-rest: 4px;
    --ui-slider-gap-pressed: 3px;
    --ui-slider-motion-duration: 200ms;
    --ui-slider-motion-easing: cubic-bezier(0.4, 0, 0.2, 1);
    --ui-slider-container-height: 48px;
    --ui-slider-vertical-height: 300px;
    --ui-slider-value-size: 36px;
    --ui-slider-value-offset-y: 12px;
    --ui-slider-value-offset-x: 8px;

    /* ── Circle Slider ─────────────────────────────────────────────────── */
    --ui-circle-slider-bounce: 350ms cubic-bezier(0.22, 2.8, 0.64, 1);

    /* ── Chips / Tags ──────────────────────────────────────────────────── */
    --ui-chip-height: 32px;
    --ui-chip-radius: var(--ui-radius-pill);
    --ui-chip-padding-x: var(--ui-space-3);
    --ui-chip-padding-y: 0;
    --ui-chip-gap: var(--ui-space-2);
    --ui-chip-font-size: var(--ui-font-s);

    /* ── Toasts ─────────────────────────────────────────────────────────── */
    --ui-toast-radius: var(--ui-radius-m);
    --ui-toast-padding-x: var(--ui-space-4);
    --ui-toast-padding-y: var(--ui-space-3);
    --ui-toast-gap: var(--ui-space-2);
    --ui-toast-motion-in: 600ms var(--ui-ease-spring);
    --ui-toast-motion-out: 150ms cubic-bezier(0.5, 0, 1, 1);
    --ui-toast-max-width: 400px;
    --ui-toast-position-bottom: 100px;
    --ui-toast-position-right: 18px;
    --ui-toast-stack-gap: var(--ui-space-4);
    --ui-toast-border-width: var(--ui-border-width-l);
    --ui-toast-icon-size: 38px;
    --ui-toast-icon-protrusion: 19px;
    --ui-toast-close-size: 22px;
    --ui-toast-close-offset: -10px;
    --ui-toast-z-index: 99999;

    /* ── Modals ─────────────────────────────────────────────────────────── */
    --ui-modal-radius: var(--ui-radius-l);
    --ui-modal-max-width-s: 480px;
    --ui-modal-max-width-m: 720px;
    --ui-modal-max-width-l: 960px;
    --ui-modal-header-gap: var(--ui-space-3);
    --ui-modal-footer-gap: var(--ui-space-3);
    --ui-modal-motion-in: 200ms cubic-bezier(0, 0, 0.2, 1);
    --ui-modal-motion-out: 120ms ease-in;
    --ui-modal-backdrop-in: 120ms ease-out;
    --ui-modal-backdrop-out: 120ms ease-in;

    /* ── FAB Buttons ───────────────────────────────────────────────────── */
    --ui-fab-size-regular: 56px;
    --ui-fab-radius: 50%;

    /* ── Split Buttons ─────────────────────────────────────────────────── */
    --ui-split-height: 40px;
    --ui-split-gap: 2px;
    --ui-split-radius-outer: 20px;
    --ui-split-radius-inner: 6px;

    /* ── Badges ─────────────────────────────────────────────────────────── */
    --ui-badge-size: 20px;
    --ui-badge-font-size: 11px;
    --ui-badge-offset-x: -6px;
    --ui-badge-offset-y: -6px;

    /* ── Progress Bars ─────────────────────────────────────────────────── */
    --ui-progress-height: 14px;
    --ui-progress-radius: 999px;
    --ui-progress-height-thin: 6px;
    --ui-progress-height-thick: 24px;
    --ui-progress-motion: 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
    --ui-progress-depth-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
    --ui-progress-highlight-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);

    /* ── Checkboxes / Radios ───────────────────────────────────────────── */
    --ui-control-size: 26px;
    --ui-control-border-width: 2px;
    --ui-control-border-radius: 8px;
    --ui-control-checked-icon-size: 16px;
    --ui-checkbox-motion: 320ms cubic-bezier(0.22, 2.2, 0.64, 1);

    /* ── Scrollbars ────────────────────────────────────────────────────── */
    --ui-scrollbar-width: 6px;

    /* ── Icon Sizes ────────────────────────────────────────────────────── */
    --ui-icon-xs: 14px;
    --ui-icon-s: 18px;
    --ui-icon-m: 20px;
    --ui-icon-l: 24px;

    /* ── Menus ──────────────────────────────────────────────────────────── */
    --ui-menu-radius: var(--ui-radius-xl);
    --ui-menu-padding-x: var(--ui-space-3);
    --ui-menu-padding-y: var(--ui-space-2);
    --ui-menu-min-width: 200px;
    --ui-menu-max-width: 320px;
    --ui-menu-max-height: 320px;
    --ui-menu-item-height: 50px;
    --ui-menu-item-radius: var(--ui-radius-xl);
    --ui-menu-item-padding-x: var(--ui-space-4);
    --ui-menu-item-font-size: var(--ui-font-m);
    --ui-menu-offset: 4px;

    /* ── Tooltips ───────────────────────────────────────────────────────── */
    --ui-tooltip-radius: var(--ui-radius-s);
    --ui-tooltip-padding-x: var(--ui-space-2);
    --ui-tooltip-padding-y: var(--ui-space-1);
    --ui-tooltip-max-width: 200px;
    --ui-tooltip-gap: var(--ui-space-2);
    --ui-tooltip-delay-show: 400ms;
    --ui-tooltip-delay-hide: 100ms;
    --ui-tooltip-duration: 1500ms;
    --ui-tooltip-motion-opacity: var(--ui-motion-fast);
    --ui-tooltip-motion-transform: 320ms cubic-bezier(0.34, 1.8, 0.64, 1);
    --ui-tooltip-origin-y: 8px;
    --ui-tooltip-origin-scale: 0.88;
    --ui-rich-tooltip-radius: var(--ui-radius-l);
    --ui-rich-tooltip-padding-x: var(--ui-space-4);
    --ui-rich-tooltip-padding-y: var(--ui-space-3);
    --ui-rich-tooltip-max-width: 320px;
    --ui-rich-tooltip-title-size: var(--ui-font-m);
    --ui-rich-tooltip-body-size: var(--ui-font-s);

    /* ── Section Headers ───────────────────────────────────────────────── */
    --ui-section-header-padding-y: var(--ui-space-3);
    --ui-section-header-gap: var(--ui-space-1);
    --ui-section-header-title-size: var(--ui-font-xs);
    --ui-section-header-subtitle-size: var(--ui-font-s);

    /* ── Skeletons ─────────────────────────────────────────────────────── */
    --ui-skeleton-radius: var(--ui-radius-s);
    --ui-skeleton-height: 16px;
    --ui-skeleton-animation-duration: 1.5s;

    /* ── Overlay / Scrim ───────────────────────────────────────────────── */
    --ui-overlay-blur: 12px;

    /* ── Accent Pink (spinner, rollback indicator) ─────────────────────── */
    --ui-pink: rgb(255, 46, 146);
    --ui-pink-soft: rgba(255, 46, 146, 0.4);
    --ui-spinner-color: var(--ui-pink);
    --ui-slider-rollback: var(--ui-pink);
  }


  /* ═══════════════════════════════════════════════════════════════════════════
     3. THEME-IDENTICAL COLORS
     Tokens with the same value in both light and dark themes.
     var() references resolve to the active theme's value at runtime.
     ═══════════════════════════════════════════════════════════════════════════ */

  :host {

    /* ── Semantic Colors (identical across themes) ─────────────────────── */
    --ui-success: var(--success-color, rgb(0, 162, 103));
    --ui-success-soft: rgba(0, 162, 103, 0.32);
    --ui-success-faint: rgba(0, 162, 103, 0.16);
    --ui-success-rgb: 0, 162, 103;

    --ui-warning: var(--warning-color, rgb(232, 177, 0));
    --ui-warning-soft: rgba(232, 177, 0, 0.32);
    --ui-warning-faint: rgba(232, 177, 0, 0.16);

    --ui-info: var(--info-color, rgb(0, 158, 211));
    --ui-info-soft: rgba(0, 158, 211, 0.32);
    --ui-info-faint: rgba(0, 158, 211, 0.16);

    --ui-shadow-0: none;
    --ui-overlay-transparent: rgba(0, 0, 0, 0.0);

    /* ── Component Color Bindings (resolve per-theme via var()) ─────────── */
    --ui-switch-track-on: var(--ui-accent);
    --ui-switch-outline-on: var(--ui-accent);
    --ui-switch-outline: var(--ui-switch-outline-off);
    --ui-switch-icon-on: var(--ui-accent);
    --ui-chip-bg: var(--ui-elevated-1);
    --ui-chip-selected-bg: var(--ui-accent-soft);
    --ui-copy-btn-color: var(--ui-text-mute);
    --ui-menu-item-color: var(--ui-text);
    --ui-menu-item-selected-bg: var(--ui-accent);
    --ui-menu-item-selected-color: var(--ui-text-on-accent);
    --ui-fab-bg: var(--ui-accent);
    --ui-fab-shadow: var(--ui-shadow-3);
    --ui-progress-fill: var(--ui-accent);
    --ui-control-bg: var(--ui-surface);
    --ui-control-checked-bg: var(--ui-accent);
    --ui-toast-border-color: var(--ui-spinner-color);
    --ui-toast-icon-bg: var(--ui-spinner-color);
    --ui-toast-icon-color: rgb(255, 255, 255);
    --ui-toast-close-bg: rgba(0, 0, 0, 0.7);
    --ui-toast-close-bg-hover: rgba(0, 0, 0, 0.9);
    --ui-toast-close-color: rgb(255, 255, 255);

    /* ── Tier / Grade Colors (same in both themes) ─────────────────────── */
    --ui-tier-a:       rgb(233, 191, 79);
    --ui-tier-a-faint: rgba(233, 191, 79, 0.16);
    --ui-tier-b:       rgb(161, 67, 159);
    --ui-tier-b-faint: rgba(161, 67, 159, 0.16);
    --ui-tier-c:       rgb(74, 144, 226);
    --ui-tier-c-faint: rgba(74, 144, 226, 0.16);
    --ui-tier-d:       rgb(76, 196, 122);
    --ui-tier-d-faint: rgba(76, 196, 122, 0.16);
  }


  /* ═══════════════════════════════════════════════════════════════════════════
     4. LIGHT THEME (DEFAULT)
     Bare :host — applies when no theme class is set.
     Only tokens that differ between light and dark live here.
     ═══════════════════════════════════════════════════════════════════════════ */

  :host {

    /* ── Surfaces ──────────────────────────────────────────────────────── */
    --ui-surface: var(--ha-card-background, var(--card-background-color, rgb(243, 243, 255)));
    --ui-surface-alt: rgb(236, 236, 248);
    --ui-surface-alt-2: rgb(226, 226, 238);

    /* ── Text ──────────────────────────────────────────────────────────── */
    --ui-text: rgb(48, 50, 60);
    --ui-text-mute: rgb(92, 94, 106);
    --ui-text-strong: rgb(28, 30, 40);

    /* ── Accent ────────────────────────────────────────────────────────── */
    --ui-accent: var(--primary-color, rgb(0, 104, 128));
    --ui-accent-soft: rgba(0, 104, 128, 0.32);
    --ui-accent-faint: rgba(0, 104, 128, 0.16);

    /* ── Error ─────────────────────────────────────────────────────────── */
    --ui-error: var(--error-color, rgb(187, 27, 27));
    --ui-error-soft: rgba(187, 27, 27, 0.32);
    --ui-error-faint: rgba(187, 27, 27, 0.16);

    /* ── Text-on Colors ────────────────────────────────────────────────── */
    --ui-text-on-accent: rgb(241, 250, 255);
    --ui-text-on-danger: rgb(255, 247, 246);

    /* ── Elevation Tiers ───────────────────────────────────────────────── */
    --ui-elevated-0: rgb(243, 243, 255);
    --ui-elevated-1: rgb(236, 236, 248);
    --ui-elevated-2: rgb(226, 226, 238);
    --ui-elevated-3: rgb(214, 214, 225);
    --ui-elevated-4: rgb(196, 196, 208);

    /* ── Shadows ───────────────────────────────────────────────────────── */
    --ui-shadow-1: 0 1px 3px rgba(0, 0, 0, 0.10);
    --ui-shadow-2: 0 2px 8px rgba(0, 0, 0, 0.14);
    --ui-shadow-3: 0 4px 12px rgba(0, 0, 0, 0.18);
    --ui-shadow-4: 0 6px 18px rgba(0, 0, 0, 0.22);

    /* ── State Layers ──────────────────────────────────────────────────── */
    --ui-state-hover: rgba(48, 50, 60, 0.06);
    --ui-state-pressed: rgba(48, 50, 60, 0.12);
    --ui-state-active: rgba(48, 50, 60, 0.16);
    --ui-state-focus-ring: rgba(0, 104, 128, 0.50);

    /* ── Border Colors ─────────────────────────────────────────────────── */
    --ui-border-color-light: rgba(48, 50, 60, 0.06);
    --ui-border-color-med: rgba(48, 50, 60, 0.16);
    --ui-border-color-strong: rgba(48, 50, 60, 0.28);

    /* ── Overlay / Scrim ───────────────────────────────────────────────── */
    --ui-overlay-scrim: rgba(0, 0, 0, 0.40);
    --ui-overlay-scrim-strong: rgba(0, 0, 0, 0.60);

    /* ── Component Colors ──────────────────────────────────────────────── */
    --ui-input-bg: rgb(238, 238, 251);
    --ui-switch-track-off: rgb(236, 236, 248);
    --ui-switch-outline-off: rgba(48, 50, 60, 0.22);
    --ui-switch-thumb-off: rgb(92, 94, 106);
    --ui-switch-thumb-on: rgb(243, 243, 255);
    --ui-switch-icon-off: rgb(236, 236, 248);
    --ui-chip-selected-text: var(--ui-text-strong);
    --ui-menu-item-hover-bg: rgba(48, 50, 60, 0.06);
    --ui-tooltip-bg: rgb(40, 43, 54);
    --ui-tooltip-text: rgb(245, 245, 255);
    --ui-rich-tooltip-bg: rgb(50, 53, 64);
    --ui-rich-tooltip-text: rgb(245, 245, 255);
    --ui-overlay-bg: rgb(255, 255, 255);
    --ui-toast-bg: rgb(40, 43, 54);
    --ui-toast-text: rgb(245, 245, 255);
    --ui-fab-hover-bg: rgb(102, 122, 240);
    --ui-fab-active-bg: rgb(92, 112, 230);
    --ui-badge-bg: rgb(244, 67, 54);
    --ui-badge-text: rgb(255, 255, 255);
    --ui-progress-track: rgba(48, 50, 60, 0.14);
    --ui-scrollbar-track: rgba(48, 50, 60, 0.06);
    --ui-scrollbar-thumb: rgba(48, 50, 60, 0.26);
    --ui-scrollbar-thumb-hover: rgba(48, 50, 60, 0.40);
    --ui-skeleton-base: rgba(48, 50, 60, 0.08);
    --ui-skeleton-shine: rgba(48, 50, 60, 0.04);

    /* ── Activity Colors (Presence Card) ───────────────────────────────── */
    --ui-activity-active-fresh: rgb(243, 137, 26);
    --ui-activity-active-fresh-secondary: rgb(247, 191, 0);
    --ui-activity-active-stale: rgb(250, 170, 130);
    --ui-activity-active-stale-opacity: 0.2;
    --ui-activity-recent-fresh: rgb(255, 255, 255);
    --ui-activity-recent-fresh-secondary: rgb(0, 200, 100);
    --ui-activity-recent-faded: rgb(105, 105, 105);
    --ui-activity-recent-faded-secondary: rgb(120, 80, 20);

    /* ── Category Colors ───────────────────────────────────────────────── */
    --ui-cat-teal:         rgb(59, 193, 181);
    --ui-cat-teal-faint:   rgba(59, 193, 181, 0.16);
    --ui-cat-amber:        rgb(241, 162, 38);
    --ui-cat-amber-faint:  rgba(241, 162, 38, 0.16);
    --ui-cat-sky:          rgb(0, 155, 219);
    --ui-cat-sky-faint:    rgba(0, 155, 219, 0.16);
    --ui-cat-violet:       rgb(186, 104, 200);
    --ui-cat-violet-faint: rgba(186, 104, 200, 0.16);
    --ui-cat-green:        rgb(99, 200, 106);
    --ui-cat-green-faint:  rgba(99, 200, 106, 0.16);
    --ui-cat-red:          rgb(245, 59, 104);
    --ui-cat-red-faint:    rgba(245, 59, 104, 0.16);
    --ui-cat-lime:         rgb(221, 244, 88);
    --ui-cat-lime-faint:   rgba(221, 244, 88, 0.16);
    --ui-cat-slate:        rgb(127, 130, 152);
    --ui-cat-slate-faint:  rgba(127, 130, 152, 0.16);
  }


  /* ═══════════════════════════════════════════════════════════════════════════
     5. DARK THEME (.dark-theme class)
     Applied by applyThemeClass() when hass.themes.darkMode is true.
     Only tokens that differ from the light defaults above.
     ═══════════════════════════════════════════════════════════════════════════ */

  :host(.dark-theme) {

    /* ── Surfaces ──────────────────────────────────────────────────────── */
    --ui-surface: var(--ha-card-background, var(--card-background-color, rgb(11, 14, 23)));
    --ui-surface-alt: rgb(24, 28, 38);
    --ui-surface-alt-2: rgb(32, 36, 48);

    /* ── Text ──────────────────────────────────────────────────────────── */
    --ui-text: rgb(228, 228, 242);
    --ui-text-mute: rgb(145, 147, 159);
    --ui-text-strong: rgb(240, 240, 252);

    /* ── Accent ────────────────────────────────────────────────────────── */
    --ui-accent: var(--primary-color, rgb(30, 171, 208));
    --ui-accent-soft: rgba(30, 171, 208, 0.32);
    --ui-accent-faint: rgba(30, 171, 208, 0.16);

    /* ── Error ─────────────────────────────────────────────────────────── */
    --ui-error: var(--error-color, rgb(255, 113, 100));
    --ui-error-soft: rgba(255, 113, 100, 0.32);
    --ui-error-faint: rgba(255, 113, 100, 0.16);

    /* ── Text-on Colors ────────────────────────────────────────────────── */
    --ui-text-on-accent: rgb(0, 36, 46);
    --ui-text-on-danger: rgb(74, 0, 2);

    /* ── Elevation Tiers ───────────────────────────────────────────────── */
    --ui-elevated-0: rgb(11, 14, 23);
    --ui-elevated-1: rgb(17, 19, 28);
    --ui-elevated-2: rgb(40, 43, 54);
    --ui-elevated-3: rgb(56, 60, 72);
    --ui-elevated-4: rgb(74, 78, 92);

    /* ── Shadows ───────────────────────────────────────────────────────── */
    --ui-shadow-1: 0 1px 3px rgba(0, 0, 0, 0.30);
    --ui-shadow-2: 0 2px 8px rgba(0, 0, 0, 0.35);
    --ui-shadow-3: 0 4px 12px rgba(0, 0, 0, 0.40);
    --ui-shadow-4: 0 6px 18px rgba(0, 0, 0, 0.50);

    /* ── State Layers ──────────────────────────────────────────────────── */
    --ui-state-hover: rgba(228, 228, 242, 0.08);
    --ui-state-pressed: rgba(228, 228, 242, 0.16);
    --ui-state-active: rgba(228, 228, 242, 0.20);
    --ui-state-focus-ring: rgb(80, 210, 240);

    /* ── Border Colors ─────────────────────────────────────────────────── */
    --ui-border-color-light: rgba(228, 228, 242, 0.10);
    --ui-border-color-med: rgba(228, 228, 242, 0.22);
    --ui-border-color-strong: rgba(228, 228, 242, 0.34);

    /* ── Overlay / Scrim ───────────────────────────────────────────────── */
    --ui-overlay-scrim: rgba(0, 0, 0, 0.55);
    --ui-overlay-scrim-strong: rgba(0, 0, 0, 0.78);

    /* ── Component Colors ──────────────────────────────────────────────── */
    --ui-input-bg: rgb(28, 31, 41);
    --ui-switch-track-off: rgb(35, 37, 47);
    --ui-switch-outline-off: rgb(115, 117, 129);
    --ui-switch-thumb-off: rgb(115, 117, 129);
    --ui-switch-thumb-on: rgb(0, 36, 46);
    --ui-switch-icon-off: rgb(35, 37, 47);
    --ui-chip-selected-text: var(--ui-text);
    --ui-menu-item-hover-bg: rgba(228, 228, 242, 0.06);
    --ui-tooltip-bg: rgb(10, 10, 16);
    --ui-tooltip-text: rgb(228, 228, 242);
    --ui-rich-tooltip-bg: var(--ui-elevated-3);
    --ui-rich-tooltip-text: var(--ui-text);
    --ui-overlay-bg: rgb(30, 33, 42);
    --ui-toast-bg: var(--ui-overlay-bg);
    --ui-toast-text: var(--ui-text);
    --ui-fab-hover-bg: rgb(120, 140, 250);
    --ui-fab-active-bg: rgb(112, 132, 240);
    --ui-badge-bg: rgb(239, 83, 80);
    --ui-badge-text: rgb(10, 10, 16);
    --ui-progress-track: rgba(228, 228, 242, 0.18);
    --ui-scrollbar-track: rgba(228, 228, 242, 0.08);
    --ui-scrollbar-thumb: rgba(228, 228, 242, 0.30);
    --ui-scrollbar-thumb-hover: rgba(228, 228, 242, 0.45);
    --ui-skeleton-base: rgba(228, 228, 242, 0.10);
    --ui-skeleton-shine: rgba(228, 228, 242, 0.05);

    /* ── Activity Colors (Presence Card) ───────────────────────────────── */
    --ui-activity-active-fresh: rgb(255, 160, 60);
    --ui-activity-active-fresh-secondary: rgb(255, 210, 80);
    --ui-activity-active-stale: rgb(200, 140, 100);
    --ui-activity-active-stale-opacity: 0.3;
    --ui-activity-recent-fresh: rgb(240, 240, 250);
    --ui-activity-recent-fresh-secondary: rgb(80, 220, 140);
    --ui-activity-recent-faded: rgb(120, 120, 130);
    --ui-activity-recent-faded-secondary: rgb(140, 100, 50);

    /* ── Category Colors (brighter for dark backgrounds) ───────────────── */
    --ui-cat-teal:         rgb(90, 214, 204);
    --ui-cat-teal-faint:   rgba(90, 214, 204, 0.16);
    --ui-cat-amber:        rgb(255, 183, 77);
    --ui-cat-amber-faint:  rgba(255, 183, 77, 0.16);
    --ui-cat-sky:          rgb(60, 185, 240);
    --ui-cat-sky-faint:    rgba(60, 185, 240, 0.16);
    --ui-cat-violet:       rgb(206, 147, 216);
    --ui-cat-violet-faint: rgba(206, 147, 216, 0.16);
    --ui-cat-green:        rgb(130, 220, 136);
    --ui-cat-green-faint:  rgba(130, 220, 136, 0.16);
    --ui-cat-red:          rgb(255, 105, 140);
    --ui-cat-red-faint:    rgba(255, 105, 140, 0.16);
    --ui-cat-lime:         rgb(232, 250, 130);
    --ui-cat-lime-faint:   rgba(232, 250, 130, 0.16);
    --ui-cat-slate:        rgb(160, 163, 182);
    --ui-cat-slate-faint:  rgba(160, 163, 182, 0.16);
  }


  /* ═══════════════════════════════════════════════════════════════════════════
     6. DARK THEME — MEDIA QUERY FALLBACK
     For standalone usage outside Home Assistant.
     ⚠ MUST mirror section 5 (.dark-theme) exactly — keep in sync.
     ═══════════════════════════════════════════════════════════════════════════ */

  @media (prefers-color-scheme: dark) {
    :host(:not(.light-theme):not(.dark-theme)) {

    /* ── Surfaces ──────────────────────────────────────────────────────── */
    --ui-surface: var(--ha-card-background, var(--card-background-color, rgb(11, 14, 23)));
    --ui-surface-alt: rgb(24, 28, 38);
    --ui-surface-alt-2: rgb(32, 36, 48);

    /* ── Text ──────────────────────────────────────────────────────────── */
    --ui-text: rgb(228, 228, 242);
    --ui-text-mute: rgb(145, 147, 159);
    --ui-text-strong: rgb(240, 240, 252);

    /* ── Accent ────────────────────────────────────────────────────────── */
    --ui-accent: var(--primary-color, rgb(30, 171, 208));
    --ui-accent-soft: rgba(30, 171, 208, 0.32);
    --ui-accent-faint: rgba(30, 171, 208, 0.16);

    /* ── Error ─────────────────────────────────────────────────────────── */
    --ui-error: var(--error-color, rgb(255, 113, 100));
    --ui-error-soft: rgba(255, 113, 100, 0.32);
    --ui-error-faint: rgba(255, 113, 100, 0.16);

    /* ── Text-on Colors ────────────────────────────────────────────────── */
    --ui-text-on-accent: rgb(0, 36, 46);
    --ui-text-on-danger: rgb(74, 0, 2);

    /* ── Elevation Tiers ───────────────────────────────────────────────── */
    --ui-elevated-0: rgb(11, 14, 23);
    --ui-elevated-1: rgb(17, 19, 28);
    --ui-elevated-2: rgb(40, 43, 54);
    --ui-elevated-3: rgb(56, 60, 72);
    --ui-elevated-4: rgb(74, 78, 92);

    /* ── Shadows ───────────────────────────────────────────────────────── */
    --ui-shadow-1: 0 1px 3px rgba(0, 0, 0, 0.30);
    --ui-shadow-2: 0 2px 8px rgba(0, 0, 0, 0.35);
    --ui-shadow-3: 0 4px 12px rgba(0, 0, 0, 0.40);
    --ui-shadow-4: 0 6px 18px rgba(0, 0, 0, 0.50);

    /* ── State Layers ──────────────────────────────────────────────────── */
    --ui-state-hover: rgba(228, 228, 242, 0.08);
    --ui-state-pressed: rgba(228, 228, 242, 0.16);
    --ui-state-active: rgba(228, 228, 242, 0.20);
    --ui-state-focus-ring: rgb(80, 210, 240);

    /* ── Border Colors ─────────────────────────────────────────────────── */
    --ui-border-color-light: rgba(228, 228, 242, 0.10);
    --ui-border-color-med: rgba(228, 228, 242, 0.22);
    --ui-border-color-strong: rgba(228, 228, 242, 0.34);

    /* ── Overlay / Scrim ───────────────────────────────────────────────── */
    --ui-overlay-scrim: rgba(0, 0, 0, 0.55);
    --ui-overlay-scrim-strong: rgba(0, 0, 0, 0.78);

    /* ── Component Colors ──────────────────────────────────────────────── */
    --ui-input-bg: rgb(28, 31, 41);
    --ui-switch-track-off: rgb(35, 37, 47);
    --ui-switch-outline-off: rgb(115, 117, 129);
    --ui-switch-thumb-off: rgb(115, 117, 129);
    --ui-switch-thumb-on: rgb(0, 36, 46);
    --ui-switch-icon-off: rgb(35, 37, 47);
    --ui-chip-selected-text: var(--ui-text);
    --ui-menu-item-hover-bg: rgba(228, 228, 242, 0.06);
    --ui-tooltip-bg: rgb(10, 10, 16);
    --ui-tooltip-text: rgb(228, 228, 242);
    --ui-rich-tooltip-bg: var(--ui-elevated-3);
    --ui-rich-tooltip-text: var(--ui-text);
    --ui-overlay-bg: rgb(30, 33, 42);
    --ui-toast-bg: var(--ui-overlay-bg);
    --ui-toast-text: var(--ui-text);
    --ui-fab-hover-bg: rgb(120, 140, 250);
    --ui-fab-active-bg: rgb(112, 132, 240);
    --ui-badge-bg: rgb(239, 83, 80);
    --ui-badge-text: rgb(10, 10, 16);
    --ui-progress-track: rgba(228, 228, 242, 0.18);
    --ui-scrollbar-track: rgba(228, 228, 242, 0.08);
    --ui-scrollbar-thumb: rgba(228, 228, 242, 0.30);
    --ui-scrollbar-thumb-hover: rgba(228, 228, 242, 0.45);
    --ui-skeleton-base: rgba(228, 228, 242, 0.10);
    --ui-skeleton-shine: rgba(228, 228, 242, 0.05);

    /* ── Activity Colors (Presence Card) ───────────────────────────────── */
    --ui-activity-active-fresh: rgb(255, 160, 60);
    --ui-activity-active-fresh-secondary: rgb(255, 210, 80);
    --ui-activity-active-stale: rgb(200, 140, 100);
    --ui-activity-active-stale-opacity: 0.3;
    --ui-activity-recent-fresh: rgb(240, 240, 250);
    --ui-activity-recent-fresh-secondary: rgb(80, 220, 140);
    --ui-activity-recent-faded: rgb(120, 120, 130);
    --ui-activity-recent-faded-secondary: rgb(140, 100, 50);

    /* ── Category Colors (brighter for dark backgrounds) ───────────────── */
    --ui-cat-teal:         rgb(90, 214, 204);
    --ui-cat-teal-faint:   rgba(90, 214, 204, 0.16);
    --ui-cat-amber:        rgb(255, 183, 77);
    --ui-cat-amber-faint:  rgba(255, 183, 77, 0.16);
    --ui-cat-sky:          rgb(60, 185, 240);
    --ui-cat-sky-faint:    rgba(60, 185, 240, 0.16);
    --ui-cat-violet:       rgb(206, 147, 216);
    --ui-cat-violet-faint: rgba(206, 147, 216, 0.16);
    --ui-cat-green:        rgb(130, 220, 136);
    --ui-cat-green-faint:  rgba(130, 220, 136, 0.16);
    --ui-cat-red:          rgb(255, 105, 140);
    --ui-cat-red-faint:    rgba(255, 105, 140, 0.16);
    --ui-cat-lime:         rgb(232, 250, 130);
    --ui-cat-lime-faint:   rgba(232, 250, 130, 0.16);
    --ui-cat-slate:        rgb(160, 163, 182);
    --ui-cat-slate-faint:  rgba(160, 163, 182, 0.16);
    }
  }


  /* ═══════════════════════════════════════════════════════════════════════════
     7. UTILITY CLASSES
     ═══════════════════════════════════════════════════════════════════════════ */

  .ui-surface {
    background: var(--ui-surface);
    color: var(--ui-text);
    border-radius: var(--ui-radius-m);
  }

  .ui-surface-1 { background: var(--ui-elevated-1); }
  .ui-surface-2 { background: var(--ui-elevated-2); }
  .ui-surface-3 { background: var(--ui-elevated-3); }
  .ui-surface-4 { background: var(--ui-elevated-4); }

  .ui-text--success { color: var(--ui-success) !important; }
  .ui-text--warning { color: var(--ui-warning) !important; }
  .ui-text--error { color: var(--ui-error) !important; }
  .ui-text--info { color: var(--ui-info) !important; }
  .ui-text--muted { color: var(--ui-text-mute) !important; }
`);

// Export as global for backwards compatibility
window.uiFoundation = sheet;

export { sheet as sharedStyles };
