// ══════════════════════════════════════════════════════════════════════════════
//  CATALOGUE SHELL STYLES
//  Layout, navigation, demo areas, and catalogue-specific visual treatment.
//  All component styles come from the adopted shared UI stylesheets.
// ══════════════════════════════════════════════════════════════════════════════

const catalogueStyles = new CSSStyleSheet();
catalogueStyles.replaceSync(/* css */`

  /* ── Host & Reset ──────────────────────────────────────────────────────── */

  :host {
    display: block;
    margin: var(--ui-space-3);
    --cat-sidebar-width: 220px;
    --cat-tabs-height: 48px;
  }


  /* ── App Shell ─────────────────────────────────────────────────────────── */

  .cat-app {
    display: flex;
    flex-direction: column;
    height: calc(100dvh - var(--header-height, 56px) - 10 * var(--ui-space-3));
    min-height: 500px;
    background: var(--ui-surface);
    border-radius: var(--ui-radius-l);
    overflow: hidden;
    box-sizing: border-box;
  }


  /* ── Header ────────────────────────────────────────────────────────────── */

  .cat-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--ui-space-3);
    padding: var(--ui-space-3) var(--ui-space-5);
    margin-bottom: var(--ui-space-3);
  }

  .cat-header .ui-card-header {
    margin-bottom: 0;
    flex: 1;
    min-width: 200px;
    padding-left: 0;
  }

  .ui-card-header .ui-card-header__title {
    flex: none;
  }

  .ui-card-header ui-info-icon {
    align-self: center;
    margin-top: 2px;
  }



  .cat-header-actions {
    display: flex;
    align-items: center;
    gap: var(--ui-space-3);
    margin-right: 5px;
    flex-shrink: 0;
  }

  .cat-search-container {
    position: relative;
    width: 210px;
    flex-shrink: 0;
  }

  .cat-search-container .ui-input__pill {
    padding-right: var(--ui-space-10);
  }

  .cat-clear-button {
    position: absolute;
    right: var(--ui-space-3);
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--ui-text-mute);
    border-radius: 50%;
    width: var(--ui-space-7);
    height: var(--ui-space-7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--ui-font-s);
    cursor: pointer;
    z-index: 2;
    display: none;
    transition: all var(--ui-motion-med);
  }

  .cat-clear-button:hover {
    color: var(--ui-text);
    background: var(--ui-state-hover);
  }

  /* ── Header Overflow Menu ───────────────────────────────────────────── */

  .dropdown-container {
    position: relative;
  }

  .ui-menu--down {
    bottom: auto;
    top: calc(100% + var(--ui-menu-offset));
  }

  .cat-header-menu .ui-btn--icon > * {
    pointer-events: none;
  }

  .cat-header-menu__toggle {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    pointer-events: none;
  }

  .cat-header-menu__toggle .ui-checkbox__input {
    pointer-events: none;
  }

  .cat-header__sidebar-btn {
    display: none;
    width: 36px;
    height: 36px;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: var(--ui-radius-m);
    color: var(--ui-text);
    cursor: pointer;
    transition: background var(--ui-motion-fast);
  }

  .cat-header__sidebar-btn:hover {
    background: var(--ui-state-hover);
  }

  .cat-header__sidebar-btn svg {
    width: 20px;
    height: 20px;
  }


  /* ── Category Tabs ─────────────────────────────────────────────────────── */

  .cat-tabs {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 var(--ui-space-5);
    padding-bottom: var(--ui-space-3);
    margin-bottom: var(--ui-space-3);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-med);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .cat-tabs::-webkit-scrollbar {
    display: none;
  }


  /* ── Body (Sidebar + Demo) ─────────────────────────────────────────────── */

  .cat-body {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
  }


  /* ── Sidebar ───────────────────────────────────────────────────────────── */

  .cat-sidebar {
    flex-shrink: 0;
    width: var(--cat-sidebar-width);
    border-right: var(--ui-border-width-s) solid var(--ui-border-color-light);
    overflow-y: auto;
    padding: var(--ui-space-3);
    scrollbar-width: thin;
    scrollbar-color: var(--ui-scrollbar-thumb) transparent;
  }

  .cat-sidebar::-webkit-scrollbar {
    width: 4px;
  }

  .cat-sidebar::-webkit-scrollbar-thumb {
    background: var(--ui-scrollbar-thumb);
    border-radius: 2px;
  }

  .cat-sidebar__item {
    display: flex;
    align-items: center;
    gap: var(--ui-space-2);
    padding: var(--ui-space-2) var(--ui-space-3);
    margin-bottom: 2px;
    border-radius: var(--ui-radius-m);
    font-size: var(--ui-font-s);
    color: var(--ui-text);
    cursor: pointer;
    transition: background var(--ui-motion-fast);
    user-select: none;
  }

  .cat-sidebar__item:hover {
    background: var(--ui-state-hover);
  }

  .cat-sidebar__item.is-active {
    background: var(--ui-accent-faint);
    color: var(--ui-accent);
    font-weight: var(--ui-font-weight-l);
  }

  .cat-sidebar__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .cat-sidebar__dot--stable {
    background: var(--ui-success);
  }

  .cat-sidebar__dot--beta {
    background: var(--ui-warning);
  }

  .cat-sidebar__dot--deprecated {
    background: var(--ui-error);
  }

  .cat-sidebar__dot--experimental {
    background: var(--ui-info);
  }

  .cat-sidebar__group-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--ui-text-mute);
    padding: var(--ui-space-3) var(--ui-space-3) var(--ui-space-1);
    opacity: 0.7;
  }

  .cat-sidebar__group-label:first-child {
    padding-top: var(--ui-space-1);
  }

  .cat-sidebar__item:focus-visible {
    outline: 2px solid var(--ui-accent);
    outline-offset: -2px;
  }


  /* ── Demo Area ─────────────────────────────────────────────────────────── */

  .cat-demo {
    flex: 1;
    overflow-y: auto;
    padding: var(--ui-space-6);
    min-width: 0;
    scrollbar-width: thin;
    scrollbar-color: var(--ui-scrollbar-thumb) transparent;
  }

  .cat-demo::-webkit-scrollbar {
    width: 6px;
  }

  .cat-demo::-webkit-scrollbar-thumb {
    background: var(--ui-scrollbar-thumb);
    border-radius: 3px;
  }


  /* ── Component Header ──────────────────────────────────────────────────── */

  .cat-comp-header {
    margin-bottom: var(--ui-space-6);
  }

  .cat-comp-header__top {
    display: flex;
    align-items: center;
    gap: var(--ui-space-3);
    margin-bottom: var(--ui-space-1);
  }

  .cat-comp-header__title {
    font-size: var(--ui-font-xl);
    font-weight: 600;
    color: var(--ui-text-strong);
  }

  .cat-comp-header__desc {
    font-size: var(--ui-font-s);
    color: var(--ui-text-mute);
    line-height: var(--ui-font-line-height-l);
    margin-bottom: var(--ui-space-3);
  }

  .cat-comp-header__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ui-space-2);
  }

  .cat-comp-header__source {
    font-size: var(--ui-font-xs);
    font-family: monospace;
    color: var(--ui-accent);
  }

  .cat-comp-header__sep {
    color: var(--ui-border-color-med);
    font-size: var(--ui-font-xs);
  }

  .cat-comp-header__tag {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
  }

  /* ── Usage Section ───────────────────────────────────────────────────── */

  .cat-usage {
    margin-bottom: var(--ui-space-6);
  }

  .cat-usage__block {
    position: relative;
    background: var(--ui-elevated-2);
    border: 1px solid var(--ui-border-color-light);
    border-radius: var(--ui-radius-m);
    margin-bottom: var(--ui-space-3);
  }

  .cat-usage__label {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--ui-text-mute);
    padding: var(--ui-space-2) var(--ui-space-3) 0;
  }

  .cat-usage__code {
    display: block;
    padding: var(--ui-space-2) var(--ui-space-3) var(--ui-space-3);
    font-family: monospace;
    font-size: var(--ui-font-xs);
    line-height: 1.6;
    color: var(--ui-text);
    white-space: pre;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--ui-scrollbar-thumb) transparent;
  }

  .cat-usage__copy {
    position: absolute;
    top: var(--ui-space-2);
    right: var(--ui-space-2);
    background: var(--ui-elevated-3);
    border: 1px solid var(--ui-border-color-light);
    border-radius: var(--ui-radius-s);
    color: var(--ui-text-mute);
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--ui-motion-fast);
  }

  .cat-usage__copy:hover {
    color: var(--ui-text);
    background: var(--ui-state-hover);
  }

  .cat-usage__copy.is-copied {
    color: var(--ui-success);
    border-color: var(--ui-success);
  }

  .cat-usage__api {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ui-space-2);
    align-items: center;
  }

  .cat-usage__pill {
    display: inline-flex;
    align-items: center;
    gap: var(--ui-space-1);
    padding: var(--ui-space-1) var(--ui-space-3);
    font-size: var(--ui-font-xs);
    font-family: monospace;
    color: var(--ui-text-mute);
    background: var(--ui-elevated-1);
    border: 1px solid var(--ui-border-color-light);
    border-radius: var(--ui-radius-pill);
  }

  .cat-usage__pill--css {
    color: var(--ui-success);
    border-color: var(--ui-success-faint);
  }

  .cat-usage__pill--js {
    color: var(--ui-warning);
    border-color: var(--ui-warning-faint);
  }

  .cat-usage__pill--event {
    color: var(--ui-info);
    border-color: var(--ui-info-faint);
  }

  .cat-usage__note {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
    line-height: var(--ui-font-line-height-l);
    margin-top: var(--ui-space-2);
  }


  /* ── Playground ────────────────────────────────────────────────────────── */

  .cat-playground {
    background: var(--ui-elevated-0);
    border: 1px solid var(--ui-border-color-light);
    border-radius: var(--ui-radius-l);
    margin-bottom: var(--ui-space-6);

    /* Playground is the primary showcase area — its interactive content
       (menus, dropdowns, tooltips) must render above the states grid
       sections below it, which may contain their own positioned elements. */
    position: relative;
    z-index: 2;
  }

  .cat-playground__canvas {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    padding: var(--ui-space-6);
    gap: var(--ui-space-4);
    flex-wrap: wrap;
  }

  .cat-playground__canvas--left {
    justify-content: flex-start;
  }

  .cat-playground__canvas--col {
    flex-direction: column;
  }

  .cat-playground__controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ui-space-2);
    padding: var(--ui-space-3) var(--ui-space-4);
    background: var(--ui-elevated-2);
    border-top: 1px solid var(--ui-border-color-light);
    border-radius: 0 0 calc(var(--ui-radius-l) - 1px) calc(var(--ui-radius-l) - 1px);
  }

  .cat-chip {
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 var(--ui-space-3);
    font-size: var(--ui-font-xs);
    font-weight: var(--ui-font-weight-m);
    color: var(--ui-text-mute);
    background: var(--ui-elevated-3);
    border: 1px solid transparent;
    border-radius: var(--ui-radius-pill);
    cursor: pointer;
    transition: all var(--ui-motion-fast);
    user-select: none;
  }

  .cat-chip:hover {
    color: var(--ui-text);
    background: var(--ui-state-hover);
  }

  .cat-chip.is-active {
    color: var(--ui-accent);
    background: var(--ui-accent-faint);
    border-color: var(--ui-accent);
  }


  /* ── States Grid ───────────────────────────────────────────────────────── */

  .cat-section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--ui-text-mute);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: var(--ui-space-3);
    padding-bottom: var(--ui-space-2);
    border-bottom: 1px solid var(--ui-border-color-light);
  }

  .cat-states {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--ui-space-4);
    margin-bottom: var(--ui-space-6);
  }

  .cat-states--wide {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  .cat-states--narrow {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .cat-state-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--ui-space-2);
  }

  .cat-state-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 56px;
    padding: var(--ui-space-3);
    background: var(--ui-elevated-1);
    border: 1px solid var(--ui-border-color-light);
    border-radius: var(--ui-radius-m);
  }

  .cat-state-preview--tall {
    min-height: 100px;
  }

  .cat-state-preview--auto {
    align-items: stretch;
    padding: var(--ui-space-6) var(--ui-space-4);
  }

  .cat-state-label {
    font-size: 11px;
    color: var(--ui-text-mute);
    text-align: center;
    white-space: nowrap;
  }


  /* ── Demo Sections ─────────────────────────────────────────────────────── */

  .cat-demo-section {
    margin-bottom: var(--ui-space-8);
  }

  .cat-demo-section:last-child {
    margin-bottom: 0;
  }


  /* ── Foundation Swatches ────────────────────────────────────────────────── */

  .cat-swatch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--ui-space-3);
    margin-bottom: var(--ui-space-5);
  }

  .cat-section-label--with-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .cat-colour-format .ui-radio-group--horizontal {
    gap: var(--ui-space-4);
  }

  .cat-colour-format .ui-radio__label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .cat-swatch {
    display: flex;
    flex-direction: column;
    border-radius: var(--ui-radius-m);
    overflow: hidden;
    border: var(--ui-border-width-l) solid var(--ui-border-color-light);
    cursor: pointer;
    position: relative;
    transition: border-color var(--ui-motion-med), background var(--ui-motion-med);
  }

  .cat-swatch:hover .cat-swatch__label {
    background: var(--ui-elevated-2);
  }

  .cat-swatch__color {
    height: 48px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Hover value overlay — resolved colour value appears on the swatch */
  .cat-swatch__value {
    font-size: var(--ui-font-xs);
    font-weight: 600;
    letter-spacing: 0.3px;
    opacity: 0;
    transition: opacity var(--ui-motion-med);
    pointer-events: none;
    text-align: center;
    padding: 0 var(--ui-space-2);
    /* Colour set dynamically via JS for contrast */
  }

  .cat-swatch:hover .cat-swatch__value {
    opacity: 1;
  }

  .cat-swatch__label {
    padding: var(--ui-space-2);
    font-size: 11px;
    color: var(--ui-text-mute);
    background: var(--ui-elevated-1);
    font-family: monospace;
    word-break: break-all;
    transition: background var(--ui-motion-med), color var(--ui-motion-med);
  }

  /* Copied feedback — success border + label swap, mirrors prompt-card pattern */
  .cat-swatch--copied {
    border-color: var(--ui-success);
  }

  .cat-swatch--copied .cat-swatch__label {
    color: var(--ui-success);
    background: var(--ui-elevated-2);
    text-align: center;
  }


  /* ── Component Colours Collapsible ─────────────────────────────────────── */

  .cat-component-colours {
    margin-top: var(--ui-space-4);
  }

  .cat-component-colours__count {
    font-size: 11px;
    color: var(--ui-text-mute);
    font-weight: var(--ui-font-weight-m);
    margin-left: var(--ui-space-2);
  }

  .cat-component-colours__desc {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
    margin-bottom: var(--ui-space-5);
    line-height: var(--ui-font-line-height-m);
  }

  .cat-component-colours__grid {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-5);
  }

  .cat-component-colours__group {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-2);
  }

  .cat-component-colours__group-label {
    font-size: 11px;
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text-mute);
    text-transform: uppercase;
    letter-spacing: var(--ui-font-letter-spacing-s);
  }

  .cat-component-colours__swatches {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: var(--ui-space-2);
  }

  .cat-component-colours__swatches .cat-swatch__color {
    height: 36px;
  }

  .cat-component-colours__swatches .cat-swatch__label {
    font-size: 10px;
    padding: var(--ui-space-1) var(--ui-space-2);
  }


  /* ── Foundation Scale Bars ─────────────────────────────────────────────── */

  .cat-scale-row {
    display: flex;
    align-items: center;
    gap: var(--ui-space-3);
    margin-bottom: var(--ui-space-2);
  }

  .cat-scale-label {
    width: 100px;
    font-size: 11px;
    font-family: monospace;
    color: var(--ui-text-mute);
    text-align: right;
    flex-shrink: 0;
  }

  .cat-scale-bar {
    height: 24px;
    background: var(--ui-accent);
    border-radius: var(--ui-radius-s);
    opacity: 0.6;
    transition: opacity var(--ui-motion-fast);
  }

  .cat-scale-bar:hover {
    opacity: 1;
  }

  .cat-scale-value {
    font-size: 11px;
    font-family: monospace;
    color: var(--ui-text-mute);
    white-space: nowrap;
    flex-shrink: 0;
  }


  /* ── Typography Samples ────────────────────────────────────────────────── */

  .cat-type-sample {
    margin-bottom: var(--ui-space-3);
    padding: var(--ui-space-3);
    background: var(--ui-elevated-1);
    border-radius: var(--ui-radius-m);
    border: 1px solid var(--ui-border-color-light);
  }

  .cat-type-sample__text {
    color: var(--ui-text);
    margin-bottom: var(--ui-space-1);
  }

  .cat-type-sample__meta {
    font-size: 11px;
    font-family: monospace;
    color: var(--ui-text-mute);
  }


  /* ── Radii Preview ─────────────────────────────────────────────────────── */

  .cat-radius-box {
    width: 80px;
    height: 80px;
    background: var(--ui-accent-faint);
    border: 2px solid var(--ui-accent);
  }


  /* ── Empty State ───────────────────────────────────────────────────────── */

  .cat-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--ui-text-mute);
    gap: var(--ui-space-3);
    padding: var(--ui-space-8);
  }

  .cat-empty__icon svg {
    width: 48px;
    height: 48px;
    opacity: 0.3;
  }

  .cat-empty__text {
    font-size: var(--ui-font-m);
  }


  /* ── Motion Demo ───────────────────────────────────────────────────────── */

  .cat-motion-bar {
    height: 32px;
    width: 32px;
    background: var(--ui-accent);
    border-radius: var(--ui-radius-s);
    cursor: pointer;
  }

  .cat-motion-bar.is-animating {
    width: 100%;
  }


  /* ── Animation Demo ─────────────────────────────────────────────────────── */

  .cat-anim-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--ui-space-3);
  }

  .cat-anim-card {
    background: var(--ui-elevated-1);
    border-radius: var(--ui-radius-m);
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow var(--ui-motion-fast);
  }

  .cat-anim-card:hover {
    box-shadow: var(--ui-shadow-2);
  }

  .cat-anim-card__preview {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--ui-space-3);
    background: var(--ui-elevated-2);
  }

  .cat-anim-card__target {
    width: 36px;
    height: 36px;
    background: var(--ui-accent);
    border-radius: var(--ui-radius-s);
  }

  .cat-anim-card__meta {
    padding: var(--ui-space-2) var(--ui-space-3);
  }

  .cat-anim-card__name {
    font-size: var(--ui-font-s);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text);
    display: flex;
    align-items: center;
    gap: var(--ui-space-2);
  }

  .cat-anim-card__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .cat-anim-card__token {
    font-size: var(--ui-font-xs);
    font-family: monospace;
    color: var(--ui-text-mute);
    margin-top: var(--ui-space-1);
  }

  .cat-anim-easing-row {
    cursor: pointer;
  }

  .cat-anim-easing-row__header {
    display: flex;
    align-items: baseline;
    gap: var(--ui-space-2);
    margin-bottom: var(--ui-space-1);
  }

  .cat-anim-easing-row__label {
    font-size: var(--ui-font-s);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text);
  }

  .cat-anim-easing-row__note {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
  }

  .cat-anim-easing-track {
    height: 32px;
    background: var(--ui-elevated-2);
    border-radius: var(--ui-radius-s);
    position: relative;
  }

  .cat-anim-easing-track__end {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 75%;
    width: 1px;
    background: var(--ui-border-color-med);
  }

  .cat-anim-easing-track__dot {
    position: absolute;
    top: 50%;
    left: 0%;
    width: 16px;
    height: 16px;
    background: var(--ui-accent);
    border-radius: 50%;
    transform: translateY(-50%);
  }

  .cat-anim-easing-row__value {
    font-size: var(--ui-font-xs);
    font-family: monospace;
    color: var(--ui-text-mute);
    margin-top: var(--ui-space-1);
  }

  .cat-anim-text-reveal {
    background: var(--ui-elevated-2);
    border-radius: var(--ui-radius-m);
    padding: var(--ui-space-6) var(--ui-space-5);
    cursor: pointer;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--ui-space-2);
  }

  .cat-anim-text-reveal__line {
    font-size: var(--ui-font-xl);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text-strong);
    line-height: 1.2;
  }

  .cat-anim-text-reveal__line--sub {
    font-size: var(--ui-font-s);
    font-weight: var(--ui-font-weight-m);
    color: var(--ui-text-mute);
  }


  .cat-anim-text-stream {
    background: var(--ui-elevated-2);
    border-radius: var(--ui-radius-m);
    padding: var(--ui-space-5);
    cursor: pointer;
    height: 160px;
    position: relative;
    overflow: hidden;
    font-size: var(--ui-font-m);
    line-height: var(--ui-font-line-height-l);
    color: var(--ui-text);
  }


  /* Simulated focus state for input demo */
  .cat-force-focus {
    border-color: var(--ui-accent) !important;
  }
  .cat-force-focus .ui-input__label {
    transform: translateY(calc(-1 * var(--ui-input-label-offset, 37px))) scale(0.75) !important;
    color: var(--ui-text) !important;
  }


  /* ── Responsive ────────────────────────────────────────────────────────── */

  /* ── Sidebar Backdrop (mobile) ─────────────────────────────────────────── */

  .cat-sidebar-backdrop {
    display: none;
  }

  @media (max-width: 768px) {
    .cat-header__sidebar-btn {
      display: flex;
    }

    .cat-sidebar {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: var(--ui-z-menu);
      background: var(--ui-elevated-2);
      transform: translateX(-100%);
      transition: transform var(--ui-motion-med);
      box-shadow: var(--ui-shadow-3);
    }

    .cat-sidebar.is-open {
      transform: translateX(0);
    }

    .cat-sidebar-backdrop {
      display: block;
      position: absolute;
      inset: 0;
      z-index: calc(var(--ui-z-menu) - 1);
      background: var(--ui-overlay-scrim);
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--ui-motion-med);
    }

    .cat-sidebar-backdrop.is-visible {
      opacity: 1;
      pointer-events: auto;
    }

    .cat-body {
      position: relative;
    }

    .cat-search-container {
      width: 140px;
    }

    .cat-demo {
      padding: var(--ui-space-4);
    }

    .cat-states {
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    }
  }

`);

export { catalogueStyles };
