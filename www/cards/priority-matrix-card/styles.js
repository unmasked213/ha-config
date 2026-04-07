// /config/www/cards/priority-matrix-card/styles.js
// Shadow DOM stylesheet — card-specific layout only.
// Buttons, inputs, sliders use shared UI classes from uiComponents / web components.

export const cardStyles = new CSSStyleSheet();
cardStyles.replaceSync(`

  /* ── Card shell ──────────────────────────────────────────────────────── */

  :host {
    display: block;
    margin: var(--ui-space-3);
  }

  .pm-card {
    background: var(--ui-surface);
    border-radius: var(--ui-radius-l);
    box-shadow: var(--ui-shadow-2);
    padding: var(--ui-layout-card-padding);
    display: flex;
    flex-direction: column;
    gap: var(--ui-layout-section-gap);
    height: calc(100dvh - var(--header-height, 56px) - 10 * var(--ui-space-3));
    box-sizing: border-box;
    overflow: hidden;
  }


  /* ── Card header (spec §6.18) ────────────────────────────────────────── */

  .ui-card-header {
    display: flex;
    align-items: center;
    gap: var(--ui-space-3);
    padding-bottom: var(--ui-space-5);
    margin-bottom: var(--ui-space-4);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-med);
  }

  .ui-card-header__accent {
    width: var(--ui-border-width-l);
    height: 36px;
    background: var(--ui-accent);
    border-radius: var(--ui-radius-pill);
    flex-shrink: 0;
  }

  .ui-card-header__title {
    font-size: var(--ui-font-xl);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text);
    margin: 0;
    flex: none;
  }

  .ui-card-header ui-info-icon {
    margin-top: 2px;
  }


  /* ── Drawer radius ─────────────────────────────────────────────────── */

  .pm-card {
    --ui-drawer-radius: var(--ui-radius-l);
  }

  .pm-card .ui-drawer {
    border-radius: var(--ui-radius-l);
  }

  .pm-card .ui-drawer-toggle {
    top: var(--ui-space-6);
    right: var(--ui-space-6);
  }

  /* FAB visibility on card hover */
  .pm-card:hover .ui-drawer-toggle,
  .pm-card:focus-within .ui-drawer-toggle {
    opacity: 1;
    transform: scale(1);
    transition:
      opacity 300ms var(--ui-ease-spring),
      transform 300ms var(--ui-ease-spring);
  }

  .ui-drawer-toggle svg {
    width: var(--ui-icon-m);
    height: var(--ui-icon-m);
    pointer-events: none;
  }


  /* ── Shared row layout ───────────────────────────────────────────────── */
  /* Both header and task rows use the same flex structure so columns     */
  /* align naturally. The sliders group has a fixed intrinsic width.      */

  .pm-row-layout {
    display: flex;
    align-items: center;
    gap: var(--ui-space-4);
    padding: 0 var(--ui-space-1);
  }

  .pm-row-layout__name {
    flex: 1;
    min-width: 0;
  }

  .pm-row-layout__sliders {
    display: flex;
    gap: var(--ui-space-4);
    flex-shrink: 0;
  }

  .pm-row-layout__score {
    width: 64px;
    flex-shrink: 0;
    text-align: right;
    border-left: var(--ui-border-width-s) solid var(--ui-border-color-light);
    padding-left: var(--ui-space-4);
    margin-left: var(--ui-space-1);
    margin-top: var(--ui-space-2);
    margin-bottom: var(--ui-space-2);
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .pm-row-layout__delete {
    width: var(--ui-space-8);
    flex-shrink: 0;
    text-align: center;
  }


  /* ── Column headers ──────────────────────────────────────────────────── */

  .pm-col-header {
    font-size: var(--ui-font-xs);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text-mute);
    text-transform: uppercase;
    letter-spacing: var(--ui-font-letter-spacing-s);
    cursor: pointer;
    user-select: none;
    text-align: center;
    padding: var(--ui-space-1) 0;
    white-space: nowrap;
    transition: color var(--ui-motion-fast);
    -webkit-tap-highlight-color: transparent;
  }

  .pm-col-header:hover {
    color: var(--ui-text);
  }

  .pm-col-header.is-sorted {
    color: var(--ui-accent);
  }

  .pm-col-header__arrow {
    font-size: var(--ui-font-xs);
    margin-left: var(--ui-space-1);
  }

  /* Slider column headers match circle slider size (64px) */
  .pm-row-layout__sliders .pm-col-header {
    width: 64px;
    flex-shrink: 0;
  }

  /* Task header aligns left */
  .pm-col-headers .pm-row-layout__name {
    text-align: left;
  }


  /* ── Task list ───────────────────────────────────────────────────────── */

  .pm-tasks {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: none;
  }

  .pm-tasks::-webkit-scrollbar {
    display: none;
  }

  .pm-tasks:empty::after {
    content: "No tasks yet. Add one above.";
    color: var(--ui-text-mute);
    font-size: var(--ui-font-s);
    text-align: center;
    padding: var(--ui-space-6) 0;
  }


  /* ── Task row ────────────────────────────────────────────────────────── */

  .pm-row {
    padding-top: var(--ui-space-3);
    padding-bottom: var(--ui-space-3);
    border-bottom: var(--ui-border-width-s) solid var(--ui-border-color-light);
  }

  .pm-row:last-child {
    border-bottom: none;
  }

  .pm-row .ui-input {
    min-width: 0;
  }


  /* ── Add task row ──────────────────────────────────────────────────── */

  .pm-add-row {
    padding: var(--ui-space-2) var(--ui-space-1);
  }


  /* ── New task pulse (shared ui-attention-pulse) ───────────────────────── */

  .pm-row {
    border: var(--ui-border-width-m) solid transparent;
    border-radius: var(--ui-radius-m);
  }

  .pm-row--new {
    --ui-pulse-color-from: var(--ui-pink);
    --ui-pulse-color-to: transparent;
    animation: ui-attention-pulse 1s ease-in-out 5;
  }

  .pm-row--new-fade {
    border-color: transparent;
    transition: border-color var(--ui-motion-slow);
  }


  /* Circle slider size set via size="64" attribute in render.js */


  /* ── Score badge ─────────────────────────────────────────────────────── */

  .pm-score {
    font-size: var(--ui-font-xl);
    font-weight: var(--ui-font-weight-l);
    font-variant-numeric: tabular-nums;
    color: var(--ui-text-strong);
    text-align: right;
    line-height: 1;
  }


  /* ── Delete button override ──────────────────────────────────────────── */

  .pm-row .ui-btn--icon {
    color: var(--ui-error-soft);
  }

  @media (hover: hover) and (pointer: fine) {
    .pm-row .ui-btn--icon:hover:not(:disabled) {
      color: var(--ui-error);
    }
  }

  .pm-row .ui-btn--icon svg {
    width: var(--ui-icon-s);
    height: var(--ui-icon-s);
    pointer-events: none;
  }


  /* ── Footer ──────────────────────────────────────────────────────────── */

  .pm-footer {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
    padding-top: var(--ui-space-2);
  }


  /* ── Mobile layout ───────────────────────────────────────────────────── */

  @media (max-width: 600px) {
    .pm-col-headers {
      display: none;
    }

    .pm-row-layout {
      flex-wrap: wrap;
    }

    .pm-row-layout__name {
      flex-basis: 100%;
    }

    .pm-row-layout__sliders {
      flex-wrap: wrap;
      justify-content: center;
    }

    .pm-weights__grid {
      grid-template-columns: 1fr 1fr;
    }
  }
`);
