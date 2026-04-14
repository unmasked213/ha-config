// ══════════════════════════════════════════════════════════════════════════════
//  DEMOS MODULE
//  One render function per registry entry. Each returns an HTML string
//  containing the interactive playground and all-states reference grid.
// ══════════════════════════════════════════════════════════════════════════════


// ── Shared SVG fragments ─────────────────────────────────────────────────────

const ICON_PLUS = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>`;
const ICON_CHECK = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>`;
const ICON_EDIT = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>`;
const ICON_SHARE = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19C20.92,17.39 19.61,16.08 18,16.08Z"/></svg>`;
const ICON_DELETE = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>`;
const ICON_COPY = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
const ICON_CHEVRON = `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/></svg>`;
const ICON_ARROW = `<svg viewBox="0 0 24 24" width="14" height="14" style="flex-shrink:0;"><path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/></svg>`;

const CHECKMARK_SVG = `<svg class="ui-checkbox__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const RADIO_CHECK_SVG = `<svg class="ui-radio__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SWITCH_CHECK_SVG = `<svg class="ui-switch__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;


// ═════════════════════════════════════════════════════════════════════════════
//  CONTROLS
// ═════════════════════════════════════════════════════════════════════════════

export function renderButtonDemo(comp) {
  const v = this.state.activeVariant || "default";

  const playgroundMap = {
    "default":        `<button class="ui-btn">Default</button>`,
    "accent":         `<button class="ui-btn ui-btn--accent">Accent</button>`,
    "accent-filled":  `<button class="ui-btn ui-btn--accent ui-btn--filled">Accent Filled</button>`,
    "outline":        `<button class="ui-btn ui-btn--outline">Outline</button>`,
    "danger":         `<button class="ui-btn ui-btn--danger">Danger</button>`,
    "danger-filled":  `<button class="ui-btn ui-btn--danger ui-btn--filled">Danger Filled</button>`,
    "muted":          `<button class="ui-btn ui-btn--muted">Muted</button>`,
    "small":          `<button class="ui-btn ui-btn--accent ui-btn--small">Small</button>`,
    "large":          `<button class="ui-btn ui-btn--accent ui-btn--large">Large</button>`,
    "icon":           `<button class="ui-btn ui-btn--icon" aria-label="Add">${ICON_PLUS}</button>`,
    "disabled":       `<button class="ui-btn ui-btn--accent ui-btn--filled" disabled>Disabled</button>`,
  };

  return `
    ${this.renderPlayground(playgroundMap[v] || playgroundMap["default"], comp.variants, v)}
    ${this.renderStatesGrid("All Variants", [
      { html: `<button class="ui-btn">Default</button>`, label: "Default" },
      { html: `<button class="ui-btn ui-btn--accent">Accent</button>`, label: "Accent" },
      { html: `<button class="ui-btn ui-btn--accent ui-btn--filled">Filled</button>`, label: "Accent Filled" },
      { html: `<button class="ui-btn ui-btn--outline">Outline</button>`, label: "Outline" },
      { html: `<button class="ui-btn ui-btn--danger">Danger</button>`, label: "Danger" },
      { html: `<button class="ui-btn ui-btn--danger ui-btn--filled">Danger</button>`, label: "Danger Filled" },
      { html: `<button class="ui-btn ui-btn--muted">Muted</button>`, label: "Muted" },
    ])}
    ${this.renderStatesGrid("Sizes", [
      { html: `<button class="ui-btn ui-btn--accent ui-btn--small">Small</button>`, label: "Small (32px)" },
      { html: `<button class="ui-btn ui-btn--accent">Default</button>`, label: "Default (40px)" },
      { html: `<button class="ui-btn ui-btn--accent ui-btn--large">Large</button>`, label: "Large (48px)" },
      { html: `<button class="ui-btn ui-btn--icon" aria-label="Add">${ICON_PLUS}</button>`, label: "Icon Only (40px)" },
    ])}
    ${this.renderStatesGrid("States", [
      { html: `<button class="ui-btn ui-btn--accent ui-btn--filled">Rest</button>`, label: "Rest" },
      { html: `<button class="ui-btn ui-btn--accent ui-btn--filled" disabled>Disabled</button>`, label: "Disabled" },
    ])}
  `;
}


export function renderToggleButtonDemo(comp) {
  const v = this.state.activeVariant || "icon-only";
  const playgroundMap = {
    "icon-only":  `<div class="demo-toggle-interactive" style="display:flex;gap:var(--ui-space-3);"><button class="ui-btn ui-btn--toggle" aria-label="Edit">${ICON_EDIT}</button><button class="ui-btn ui-btn--toggle is-selected" aria-label="Share">${ICON_SHARE}</button></div>`,
    "text-only":  `<div class="demo-toggle-interactive" style="display:flex;gap:var(--ui-space-3);"><button class="ui-btn ui-btn--toggle">Off</button><button class="ui-btn ui-btn--toggle is-selected">On</button></div>`,
    "icon-text":  `<div class="demo-toggle-interactive" style="display:flex;gap:var(--ui-space-3);"><button class="ui-btn ui-btn--toggle"><span class="ui-btn__icon">${ICON_EDIT}</span>Edit</button><button class="ui-btn ui-btn--toggle is-selected"><span class="ui-btn__icon">${ICON_CHECK}</span>Selected</button></div>`,
  };

  return `
    ${this.renderPlayground(playgroundMap[v] || playgroundMap["icon-only"], comp.variants, v)}
    ${this.renderStatesGrid("All States", [
      { html: `<button class="ui-btn ui-btn--toggle">Unselected</button>`, label: "Unselected" },
      { html: `<button class="ui-btn ui-btn--toggle is-selected">Selected</button>`, label: "Selected" },
      { html: `<button class="ui-btn ui-btn--toggle" disabled>Disabled</button>`, label: "Disabled" },
    ])}
  `;
}


export function renderSplitButtonDemo(comp) {
  return `
    ${this.renderPlayground(`
      <div class="demo-split-interactive" style="position:relative;">
        <div class="ui-split">
          <button class="ui-split__main ui-btn">Primary Action</button>
          <button class="ui-split__arrow">${ICON_ARROW}</button>
          <div class="ui-menu" style="top:calc(100% + 4px);bottom:auto;">
            <button class="ui-menu__item ui-menu__item--selected">Option One</button>
            <button class="ui-menu__item">Option Two</button>
            <button class="ui-menu__item">Option Three</button>
          </div>
        </div>
      </div>
    `, comp.variants, this.state.activeVariant)}
    ${this.renderStatesGrid("States", [
      { html: `<div class="ui-split"><button class="ui-split__main ui-btn">Action</button><button class="ui-split__arrow">${ICON_ARROW}</button></div>`, label: "Closed" },
      { html: `<div class="ui-split ui-split--open"><button class="ui-split__main ui-btn">Action</button><button class="ui-split__arrow">${ICON_ARROW}</button></div>`, label: "Open" },
    ])}
  `;
}


export function renderCopyButtonDemo(comp) {
  return `
    ${this.renderPlayground(`
      <div class="demo-copy-interactive" style="display:flex;gap:var(--ui-space-4);">
        <button class="ui-copy-btn" aria-label="Copy">${ICON_COPY}</button>
      </div>
    `, comp.variants, this.state.activeVariant)}
    ${this.renderStatesGrid("States", [
      { html: `<button class="ui-copy-btn" aria-label="Copy">${ICON_COPY}</button>`, label: "Default" },
      { html: `<button class="ui-copy-btn ui-copy-btn--copied" aria-label="Copied">${ICON_CHECK}</button>`, label: "Copied" },
    ])}
  `;
}


export function renderFabDemo(comp) {
  const v = this.state.activeVariant || "regular";
  const playgroundMap = {
    "small":    `<button class="ui-fab ui-fab--small" aria-label="Add">${ICON_PLUS}</button>`,
    "regular":  `<button class="ui-fab ui-fab--regular" aria-label="Add">${ICON_PLUS}</button>`,
    "extended": `<button class="ui-fab ui-fab--extended">${ICON_PLUS}<span>Create</span></button>`,
    "menu":     `<div style="height:200px;display:flex;align-items:flex-end;justify-content:center;"><div class="demo-fab-interactive" style="position:relative;"><button class="ui-fab ui-fab--regular" aria-label="Menu">${ICON_PLUS}</button><div class="ui-fab-menu ui-fab-menu--up"><button class="ui-btn ui-btn--small">Edit</button><button class="ui-btn ui-btn--small">Share</button><button class="ui-btn ui-btn--small">Delete</button></div></div></div>`,
  };

  return `
    ${this.renderPlayground(playgroundMap[v] || playgroundMap["regular"], comp.variants, v)}
    ${this.renderStatesGrid("Sizes", [
      { html: `<button class="ui-fab ui-fab--small" aria-label="Add">${ICON_PLUS}</button>`, label: "Small (40px)" },
      { html: `<button class="ui-fab ui-fab--regular" aria-label="Add">${ICON_PLUS}</button>`, label: "Regular (56px)" },
      { html: `<button class="ui-fab ui-fab--extended">${ICON_PLUS}<span>Create</span></button>`, label: "Extended" },
    ])}
  `;
}


export function renderChipDemo(comp) {
  return `
    ${this.renderPlayground(`
      <div style="display:flex;gap:var(--ui-space-2);flex-wrap:wrap;">
        <span class="ui-chip">Default</span>
        <span class="ui-chip ui-chip--selected">Selected</span>
        <span class="ui-chip">Another</span>
      </div>
    `, comp.variants, this.state.activeVariant)}
    ${this.renderStatesGrid("States", [
      { html: `<span class="ui-chip">Default</span>`, label: "Default" },
      { html: `<span class="ui-chip ui-chip--selected">Selected</span>`, label: "Selected" },
    ], { narrow: true })}
  `;
}


export function renderBadgeDemo(comp) {
  return `
    ${this.renderPlayground(`
      <div style="display:flex;gap:var(--ui-space-2);flex-wrap:wrap;align-items:center;">
        <span class="ui-badge">Default</span>
        <span class="ui-badge ui-badge--success">Success</span>
        <span class="ui-badge ui-badge--warning">Warning</span>
        <span class="ui-badge ui-badge--error">Error</span>
        <span class="ui-badge ui-badge--info">Info</span>
        <span class="ui-badge ui-badge--accent">Accent</span>
        <span class="ui-badge ui-badge--muted">Muted</span>
      </div>
      <div style="display:flex;gap:var(--ui-space-2);flex-wrap:wrap;align-items:center;margin-top:var(--ui-space-4);">
        <span class="ui-badge ui-badge--pill ui-badge--accent">Pill</span>
        <span class="ui-badge ui-badge--success"><span class="ui-badge__dot"></span>Online</span>
        <span class="ui-badge" style="--_badge-color:var(--ui-cat-teal);--_badge-color-faint:var(--ui-cat-teal-faint);">Custom</span>
      </div>
    `, comp.variants, this.state.activeVariant)}
    ${this.renderStatesGrid("Semantic Variants", [
      { html: `<span class="ui-badge">Default</span>`, label: "Default" },
      { html: `<span class="ui-badge ui-badge--success">Success</span>`, label: "Success" },
      { html: `<span class="ui-badge ui-badge--warning">Warning</span>`, label: "Warning" },
      { html: `<span class="ui-badge ui-badge--error">Error</span>`, label: "Error" },
      { html: `<span class="ui-badge ui-badge--info">Info</span>`, label: "Info" },
      { html: `<span class="ui-badge ui-badge--accent">Accent</span>`, label: "Accent" },
      { html: `<span class="ui-badge ui-badge--muted">Muted</span>`, label: "Muted" },
    ], { narrow: true })}
    ${this.renderStatesGrid("Custom Colours", [
      { html: `<span class="ui-badge" style="--_badge-color:var(--ui-cat-teal);--_badge-color-faint:var(--ui-cat-teal-faint);">Teal</span>`, label: "Teal" },
      { html: `<span class="ui-badge" style="--_badge-color:var(--ui-cat-amber);--_badge-color-faint:var(--ui-cat-amber-faint);">Amber</span>`, label: "Amber" },
      { html: `<span class="ui-badge" style="--_badge-color:var(--ui-cat-sky);--_badge-color-faint:var(--ui-cat-sky-faint);">Sky</span>`, label: "Sky" },
      { html: `<span class="ui-badge" style="--_badge-color:var(--ui-cat-red);--_badge-color-faint:var(--ui-cat-red-faint);">Red</span>`, label: "Red" },
      { html: `<span class="ui-badge" style="--_badge-color:var(--ui-cat-violet);--_badge-color-faint:var(--ui-cat-violet-faint);">Violet</span>`, label: "Violet" },
    ], { narrow: true })}
    ${this.renderStatesGrid("Modifiers", [
      { html: `<span class="ui-badge ui-badge--pill ui-badge--accent">Pill Shape</span>`, label: "Pill" },
      { html: `<span class="ui-badge ui-badge--success"><span class="ui-badge__dot"></span>Online</span>`, label: "With Dot" },
      { html: `<span class="ui-badge ui-badge--error"><span class="ui-badge__dot"></span>Offline</span>`, label: "Dot + Error" },
      { html: `<span class="ui-badge ui-badge--pill ui-badge--info"><span class="ui-badge__dot"></span>Active</span>`, label: "Pill + Dot" },
    ], { narrow: true })}
  `;
}


// ═════════════════════════════════════════════════════════════════════════════
//  FORMS
// ═════════════════════════════════════════════════════════════════════════════

export function renderTextInputDemo(comp) {
  const v = this.state.activeVariant || "default";
  const clearSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

  const playgroundMap = {
    "default": `
      <div class="demo-input-interactive" style="display:flex;flex-direction:column;gap:var(--ui-space-4);width:100%;max-width:400px;">
        <div class="ui-input ui-input--clearable">
          <div class="ui-input__pill">
            <input type="text" class="ui-input__field" id="demoInput1" placeholder=" " />
            <label class="ui-input__label" for="demoInput1">Type to see clear button</label>
            <button type="button" class="ui-input__clear" aria-label="Clear">${clearSvg}</button>
          </div>
        </div>
      </div>`,
    "textarea": `
      <div class="demo-input-interactive" style="display:flex;flex-direction:column;gap:var(--ui-space-4);width:100%;max-width:400px;">
        <div class="ui-input ui-input--textarea">
          <div class="ui-input__pill">
            <label class="ui-input__label">Type multi-line content</label>
            <textarea class="ui-input__field" id="demoTextarea1" placeholder=" "></textarea>
          </div>
        </div>
      </div>`,
  };

  return `
    ${this.renderPlayground(playgroundMap[v] || playgroundMap["default"], comp.variants, v, { col: true })}
    ${this.renderStatesGrid("Single-line", [
      { html: `<div class="ui-input" style="width:100%;"><div class="ui-input__pill"><input type="text" class="ui-input__field" placeholder=" " disabled /><label class="ui-input__label">Empty</label></div></div>`, label: "Empty", auto: true },
      { html: `<div class="ui-input" style="width:100%;"><div class="ui-input__pill cat-force-focus"><input type="text" class="ui-input__field" placeholder=" " disabled /><label class="ui-input__label">Focused</label></div></div>`, label: "Focused", auto: true },
      { html: `<div class="ui-input" style="width:100%;"><div class="ui-input__pill has-value"><input type="text" class="ui-input__field" value="Content" placeholder=" " disabled /><label class="ui-input__label">Filled</label></div></div>`, label: "Filled", auto: true },
      { html: `<div class="ui-input ui-input--clearable" style="width:100%;"><div class="ui-input__pill has-value"><input type="text" class="ui-input__field" value="Clearable" placeholder=" " disabled /><label class="ui-input__label">Search</label><button type="button" class="ui-input__clear" aria-label="Clear">${clearSvg}</button></div></div>`, label: "Clearable", auto: true },
      { html: `<div class="ui-input ui-input--quiet" style="width:100%;"><div class="ui-input__pill"><input type="text" class="ui-input__field" placeholder=" " disabled /><label class="ui-input__label">Task name</label></div></div>`, label: "Quiet (empty)", auto: true },
      { html: `<div class="ui-input ui-input--quiet" style="width:100%;"><div class="ui-input__pill has-value"><input type="text" class="ui-input__field" value="Build priority matrix" placeholder=" " disabled /><label class="ui-input__label">Task name</label></div></div>`, label: "Quiet (filled)", auto: true },
    ], { wide: true })}
    ${this.renderStatesGrid("Multi-line", [
      { html: `<div class="ui-input ui-input--textarea" style="width:100%;"><div class="ui-input__pill"><label class="ui-input__label">Description</label><textarea class="ui-input__field" placeholder=" " disabled></textarea></div></div>`, label: "Empty", auto: true },
      { html: `<div class="ui-input ui-input--textarea" style="width:100%;"><div class="ui-input__pill has-value"><label class="ui-input__label">Description</label><textarea class="ui-input__field" disabled>Short multi-line content.</textarea></div></div>`, label: "Textarea", auto: true },
      { html: `<div class="ui-input ui-input--textarea ui-input--textarea-lg" style="width:100%;"><div class="ui-input__pill has-value"><label class="ui-input__label">Content</label><textarea class="ui-input__field" disabled>Longer form content with more vertical space for multi-paragraph input.</textarea></div></div>`, label: "Textarea (large)", auto: true },
    ], { wide: true })}
  `;
}


export function renderSliderDemo(comp) {
  // Helper: static slider preview at a given percentage with optional classes
  const staticSlider = (pct, extraCls = "", opts = {}) => {
    const { rollbackPct, valueLabel } = opts;
    // Mirror helpers.js updateSlider: subtract gap from track widths
    // and apply carved inner border-radius (tight 4px in middle, full 12px at edges)
    const gap = 'var(--ui-slider-gap-rest, 5px)';
    const fullR = 'var(--ui-slider-track-radius, 12px)';
    const tightR = 'var(--ui-slider-thumb-radius, 4px)';
    const atEdge = pct <= 0 || pct >= 100;
    const innerR = atEdge ? fullR : tightR;

    const activeW = pct === 0 ? '0px' : `calc(${pct}% - ${gap})`;
    const inactiveW = pct === 100 ? '0px' : `calc(${100 - pct}% - ${gap})`;
    const activeRadius = `${fullR} ${innerR} ${innerR} ${fullR}`;
    const inactiveRadius = `${innerR} ${fullR} ${fullR} ${innerR}`;

    const rollbackHtml = rollbackPct != null
      ? `<div class="ui-slider__rollback" style="left:${pct}%;width:${rollbackPct - pct}%;"></div>`
      : "";
    const valueBubble = valueLabel != null
      ? `<div class="ui-slider__value">${valueLabel}</div>`
      : `<div class="ui-slider__value"></div>`;
    return `<div class="ui-slider ${extraCls}" style="width:100%;pointer-events:none;">
      <div class="ui-slider__container">
        <div class="ui-slider__track-active" style="width:${activeW};border-radius:${activeRadius};"></div>
        <div class="ui-slider__track-inactive" style="width:${inactiveW};border-radius:${inactiveRadius};"></div>
        <div class="ui-slider__thumb" style="left:${pct}%;">${valueBubble}</div>
        ${rollbackHtml}
      </div>
    </div>`;
  };

  return `
    ${this.renderPlayground(`
      <div class="demo-slider-interactive" style="width:100%;max-width:400px;">
        <div class="ui-slider" data-slider="catSlider">
          <div class="ui-slider__container">
            <div class="ui-slider__track-active" style="width:50%;"></div>
            <div class="ui-slider__track-inactive" style="width:50%;"></div>
            <div class="ui-slider__thumb" style="left:50%;">
              <div class="ui-slider__value">150</div>
            </div>
            <input type="range" class="ui-slider__input" min="0" max="300" value="150" />
          </div>
        </div>
      </div>
    `, comp.variants, this.state.activeVariant)}
    ${this.renderStatesGrid("States", [
      { html: staticSlider(0), label: "Zero", auto: true },
      { html: staticSlider(50), label: "Rest", auto: true },
      { html: staticSlider(100), label: "Full", auto: true },
      { html: staticSlider(50, "is-hovered"), label: "Hover", auto: true },
      { html: staticSlider(50, "ui-slider--pressed", { valueLabel: "150" }), label: "Pressed", auto: true },
      { html: staticSlider(30, "ui-slider--pressed ui-slider--rolling-back", { rollbackPct: 65, valueLabel: "90" }), label: "Rollback", auto: true },
    ], { wide: true })}
  `;
}


export function renderCircleSliderDemo(comp) {
  const v = this.state.activeVariant || "number";

  const playgroundMap = {
    "number": `
      <div class="demo-circle-slider-interactive" style="display:flex;gap:var(--ui-space-6);flex-wrap:wrap;align-items:flex-start;">
        <ui-circle-slider value="65" label="Drag only"></ui-circle-slider>
      </div>`,
    "interactive": `
      <div class="demo-circle-slider-interactive" style="display:flex;gap:var(--ui-space-6);flex-wrap:wrap;align-items:flex-start;">
        <ui-circle-slider type="interactive" value="50" label="Tap or drag" data-circle-tap></ui-circle-slider>
      </div>`,
    "disabled": `
      <div class="demo-circle-slider-interactive" style="display:flex;gap:var(--ui-space-6);flex-wrap:wrap;align-items:flex-start;">
        <ui-circle-slider disabled value="30" label="Disabled"></ui-circle-slider>
      </div>`,
  };

  return `
    ${this.renderPlayground(playgroundMap[v] || playgroundMap["number"], comp.variants, v)}
    ${this.renderStatesGrid("States", [
      { html: `<ui-circle-slider value="0" label="Zero"></ui-circle-slider>`, label: "Zero", tall: true },
      { html: `<ui-circle-slider value="50" label="Half"></ui-circle-slider>`, label: "Half", tall: true },
      { html: `<ui-circle-slider value="100" label="Full"></ui-circle-slider>`, label: "Full", tall: true },
      { html: `<ui-circle-slider value="40" label="Rollback" data-demo-rollback></ui-circle-slider>`, label: "Rollback", tall: true },
      { html: `<ui-circle-slider disabled value="50" label="Disabled"></ui-circle-slider>`, label: "Disabled", tall: true },
    ])}
  `;
}


export function renderNumberInputDemo(comp) {
  const v = this.state.activeVariant || "default";

  const dataRow = (label, min, max, value, extra = '') =>
    `<div class="ui-data-row">
      <span class="ui-data-row__label">${label}</span>
      <ui-number-input value="${value}" min="${min}" max="${max}" ${extra}></ui-number-input>
    </div>`;

  const playgroundMap = {
    "default": `
      <div style="display:flex;flex-direction:column;width:100%;max-width:400px;">
        ${dataRow("Active rows", 1, 20, 5)}
        ${dataRow("Recent rows", 1, 20, 8)}
        ${dataRow("Max items", 1, 100, 30)}
      </div>`,
    "disabled": `
      <div style="display:flex;flex-direction:column;width:100%;max-width:400px;">
        ${dataRow("Active rows", 1, 20, 5, 'disabled')}
        ${dataRow("Recent rows", 1, 20, 8, 'disabled')}
        ${dataRow("Max items", 1, 100, 30, 'disabled')}
      </div>`,
    "small-range": `
      <div style="display:flex;flex-direction:column;width:100%;max-width:400px;">
        ${dataRow("Rating", 1, 5, 3)}
        ${dataRow("Priority", 1, 5, 1)}
      </div>`,
    "large-range": `
      <div style="display:flex;flex-direction:column;width:100%;max-width:400px;">
        ${dataRow("Timeout (ms)", 0, 999, 250)}
        ${dataRow("Buffer size", 0, 999, 64)}
      </div>`,
  };

  return `
    ${this.renderPlayground(playgroundMap[v] || playgroundMap["default"], comp.variants, v, { col: true })}
    ${this.renderStatesGrid("States", [
      { html: `<div class="ui-number-input" style="pointer-events:none;"><div class="ui-number-input__pill"><div class="ui-number-input__value"><span class="ui-number-input__display">5</span><div class="ui-number-input__range" aria-hidden="true"><div class="ui-number-input__range-fill"></div></div></div></div></div>`, label: "Rest" },
      { html: `<div class="ui-number-input is-active" style="pointer-events:none;"><div class="ui-number-input__pill"><button class="ui-number-input__zone ui-number-input__zone--down" tabindex="-1"><svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor"><path d="M5.797 7a1 1 0 0 0-.778 1.628l3.814 4.723a1.5 1.5 0 0 0 2.334 0l3.815-4.723A1 1 0 0 0 14.204 7z"/></svg></button><div class="ui-number-input__divider"></div><div class="ui-number-input__value"><span class="ui-number-input__display">5</span><div class="ui-number-input__range" aria-hidden="true"><div class="ui-number-input__range-fill" style="width:25%;"></div></div></div><div class="ui-number-input__divider"></div><button class="ui-number-input__zone ui-number-input__zone--up" tabindex="-1"><svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor"><path d="M5.797 13.908a1 1 0 0 1-.778-1.628l3.814-4.723a1.5 1.5 0 0 1 2.334 0l3.815 4.723a1 1 0 0 1-.778 1.628z"/></svg></button></div></div>`, label: "Active" },
      { html: `<div class="ui-number-input is-active is-editing" style="pointer-events:none;"><div class="ui-number-input__pill"><button class="ui-number-input__zone ui-number-input__zone--down" tabindex="-1"><svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor"><path d="M5.797 7a1 1 0 0 0-.778 1.628l3.814 4.723a1.5 1.5 0 0 0 2.334 0l3.815-4.723A1 1 0 0 0 14.204 7z"/></svg></button><div class="ui-number-input__divider"></div><div class="ui-number-input__value"><input class="ui-number-input__input" type="text" value="5" style="display:block;" tabindex="-1" /><div class="ui-number-input__range" aria-hidden="true"><div class="ui-number-input__range-fill" style="width:25%;"></div></div></div><div class="ui-number-input__divider"></div><button class="ui-number-input__zone ui-number-input__zone--up" tabindex="-1"><svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor"><path d="M5.797 13.908a1 1 0 0 1-.778-1.628l3.814-4.723a1.5 1.5 0 0 1 2.334 0l3.815 4.723a1 1 0 0 1-.778 1.628z"/></svg></button></div></div>`, label: "Editing" },
      { html: `<div class="ui-number-input is-active is-holding is-holding-up" style="pointer-events:none;"><div class="ui-number-input__pill"><button class="ui-number-input__zone ui-number-input__zone--down" tabindex="-1"><svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor"><path d="M5.797 7a1 1 0 0 0-.778 1.628l3.814 4.723a1.5 1.5 0 0 0 2.334 0l3.815-4.723A1 1 0 0 0 14.204 7z"/></svg></button><div class="ui-number-input__divider"></div><div class="ui-number-input__value"><span class="ui-number-input__display">12</span><div class="ui-number-input__range" aria-hidden="true"><div class="ui-number-input__range-fill" style="width:60%;"></div></div></div><div class="ui-number-input__divider"></div><button class="ui-number-input__zone ui-number-input__zone--up" tabindex="-1"><svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor"><path d="M5.797 13.908a1 1 0 0 1-.778-1.628l3.814-4.723a1.5 1.5 0 0 1 2.334 0l3.815 4.723a1 1 0 0 1-.778 1.628z"/></svg></button></div></div>`, label: "Holding" },
      { html: `<div class="ui-number-input is-active is-at-min" style="pointer-events:none;"><div class="ui-number-input__pill"><button class="ui-number-input__zone ui-number-input__zone--down" tabindex="-1"><svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor"><path d="M5.797 7a1 1 0 0 0-.778 1.628l3.814 4.723a1.5 1.5 0 0 0 2.334 0l3.815-4.723A1 1 0 0 0 14.204 7z"/></svg></button><div class="ui-number-input__divider"></div><div class="ui-number-input__value"><span class="ui-number-input__display">1</span><div class="ui-number-input__range" aria-hidden="true"><div class="ui-number-input__range-fill" style="width:0%;"></div></div></div><div class="ui-number-input__divider"></div><button class="ui-number-input__zone ui-number-input__zone--up" tabindex="-1"><svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor"><path d="M5.797 13.908a1 1 0 0 1-.778-1.628l3.814-4.723a1.5 1.5 0 0 1 2.334 0l3.815 4.723a1 1 0 0 1-.778 1.628z"/></svg></button></div></div>`, label: "At Min" },
      { html: `<div class="ui-number-input is-active is-at-max" style="pointer-events:none;"><div class="ui-number-input__pill"><button class="ui-number-input__zone ui-number-input__zone--down" tabindex="-1"><svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor"><path d="M5.797 7a1 1 0 0 0-.778 1.628l3.814 4.723a1.5 1.5 0 0 0 2.334 0l3.815-4.723A1 1 0 0 0 14.204 7z"/></svg></button><div class="ui-number-input__divider"></div><div class="ui-number-input__value"><span class="ui-number-input__display">20</span><div class="ui-number-input__range" aria-hidden="true"><div class="ui-number-input__range-fill" style="width:100%;"></div></div></div><div class="ui-number-input__divider"></div><button class="ui-number-input__zone ui-number-input__zone--up" tabindex="-1"><svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor"><path d="M5.797 13.908a1 1 0 0 1-.778-1.628l3.814-4.723a1.5 1.5 0 0 1 2.334 0l3.815 4.723a1 1 0 0 1-.778 1.628z"/></svg></button></div></div>`, label: "At Max" },
    ])}
  `;
}


export function renderSwitchDemo(comp) {
  const switchUnit = (id, label, checked, disabled, icon) => {
    const cls = icon ? "ui-icon-switch" : "ui-switch";
    const disabledCls = disabled ? " ui-switch--disabled" : "";
    return `
      <label class="${cls}${disabledCls}">
        <input type="checkbox" class="ui-switch__input" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
        <span class="ui-switch__track">
          <span class="ui-switch__thumb">${icon ? SWITCH_CHECK_SVG : ""}</span>
        </span>
        <span class="ui-switch__label">${label}</span>
      </label>
    `;
  };

  return `
    ${this.renderPlayground(`
      <div class="demo-switch-interactive" style="display:flex;gap:var(--ui-space-6);flex-wrap:wrap;">
        ${switchUnit("s1", "Standard", false, false, false)}
        ${switchUnit("s2", "Icon", true, false, true)}
      </div>
    `, comp.variants, this.state.activeVariant)}
    ${this.renderStatesGrid("All States", [
      { html: switchUnit("", "OFF", false, false, false), label: "Standard OFF" },
      { html: switchUnit("", "ON", true, false, false), label: "Standard ON" },
      { html: switchUnit("", "ON", true, false, true), label: "Icon ON" },
      { html: switchUnit("", "OFF", false, true, false), label: "Disabled OFF" },
      { html: switchUnit("", "ON", true, true, false), label: "Disabled ON" },
    ], { wide: true })}
  `;
}


export function renderCheckboxDemo(comp) {
  const cb = (label, checked, disabled) => `
    <label class="ui-checkbox${disabled ? " ui-checkbox--disabled" : ""}">
      <input type="checkbox" class="ui-checkbox__input" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
      <span class="ui-checkbox__box">${CHECKMARK_SVG}</span>
      <span class="ui-checkbox__label">${label}</span>
    </label>
  `;

  return `
    ${this.renderPlayground(`
      <div class="demo-checkbox-interactive" style="display:flex;gap:var(--ui-space-4);flex-wrap:wrap;align-items:center;">
        ${cb("Unchecked", false, false)}
        ${cb("Checked", true, false)}
        ${cb("Interactive", false, false)}
      </div>
    `, comp.variants, this.state.activeVariant)}
    ${this.renderStatesGrid("All States", [
      { html: cb("Unchecked", false, false), label: "Unchecked" },
      { html: cb("Checked", true, false), label: "Checked" },
      { html: cb("Disabled OFF", false, true), label: "Disabled OFF" },
      { html: cb("Disabled ON", true, true), label: "Disabled ON" },
    ])}
  `;
}


export function renderRadioDemo(comp) {
  const radio = (name, value, label, checked, disabled) => `
    <label class="ui-radio${disabled ? " ui-radio--disabled" : ""}">
      <input type="radio" class="ui-radio__input" name="${name}" value="${value}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
      <span class="ui-radio__circle">${RADIO_CHECK_SVG}</span>
      <span class="ui-radio__label">${label}</span>
    </label>
  `;

  return `
    ${this.renderPlayground(`
      <div class="demo-radio-interactive" style="display:flex;gap:var(--ui-space-6);flex-wrap:wrap;align-items:flex-start;">
        <div class="ui-radio-group" role="radiogroup" aria-label="Demo options">
          ${radio("cat-demo", "a", "Option A", true, false)}
          ${radio("cat-demo", "b", "Option B", false, false)}
          ${radio("cat-demo", "c", "Option C", false, false)}
        </div>
        <div class="ui-radio-group ui-radio-group--horizontal" role="radiogroup" aria-label="Horizontal demo">
          ${radio("cat-demo-h", "x", "X", true, false)}
          ${radio("cat-demo-h", "y", "Y", false, false)}
        </div>
      </div>
    `, comp.variants, this.state.activeVariant)}
    ${this.renderStatesGrid("States", [
      { html: radio("s1", "a", "Unselected", false, false), label: "Unselected" },
      { html: radio("s2", "a", "Selected", true, false), label: "Selected" },
      { html: radio("s3", "a", "Disabled OFF", false, true), label: "Disabled OFF" },
      { html: radio("s4", "a", "Disabled ON", true, true), label: "Disabled ON" },
    ])}
  `;
}


export function renderProgressDemo(comp) {
  const v = this.state.activeVariant || "default";
  const progressBar = (pct, cls) => `
    <div class="ui-progress ${cls}" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
      <div class="ui-progress__bar" style="width:${pct}%;"></div>
    </div>
  `;

  const playgroundMap = {
    "default":       `<div style="width:100%;max-width:400px;">${progressBar(65, "")}<input type="range" id="demoProgressSlider" min="0" max="100" value="65" style="width:100%;margin-top:var(--ui-space-3);" /></div>`,
    "thin":          `<div style="width:100%;max-width:400px;">${progressBar(45, "ui-progress--thin")}</div>`,
    "thick":         `<div style="width:100%;max-width:400px;">${progressBar(75, "ui-progress--thick")}</div>`,
    "indeterminate": `<div style="width:100%;max-width:400px;"><div class="ui-progress ui-progress--indeterminate" role="progressbar"><div class="ui-progress__bar"></div></div></div>`,
    "success":       `<div style="width:100%;max-width:400px;">${progressBar(100, "ui-progress--success")}</div>`,
    "warning":       `<div style="width:100%;max-width:400px;">${progressBar(60, "ui-progress--warning")}</div>`,
    "error":         `<div style="width:100%;max-width:400px;">${progressBar(30, "ui-progress--error")}</div>`,
  };

  // Fix the fill ID for interactive slider
  const canvasHTML = v === "default"
    ? playgroundMap["default"].replace('class="ui-progress__bar"', 'class="ui-progress__bar" id="demoProgressFill"')
    : playgroundMap[v] || playgroundMap["default"];

  return `
    ${this.renderPlayground(canvasHTML, comp.variants, v, { col: true })}
    ${this.renderStatesGrid("Sizes", [
      { html: progressBar(60, "ui-progress--thin"), label: "Thin (6px)", auto: true },
      { html: progressBar(60, ""), label: "Default (14px)", auto: true },
      { html: progressBar(60, "ui-progress--thick"), label: "Thick (24px)", auto: true },
    ], { wide: true })}
    ${this.renderStatesGrid("Colours", [
      { html: progressBar(80, ""), label: "Default (accent)", auto: true },
      { html: progressBar(100, "ui-progress--success"), label: "Success", auto: true },
      { html: progressBar(60, "ui-progress--warning"), label: "Warning", auto: true },
      { html: progressBar(30, "ui-progress--error"), label: "Error", auto: true },
    ], { wide: true })}
    ${this.renderStatesGrid("Edge Cases", [
      { html: progressBar(0, ""), label: "0%", auto: true },
      { html: progressBar(100, ""), label: "100%", auto: true },
      { html: `<div class="ui-progress ui-progress--indeterminate" role="progressbar"><div class="ui-progress__bar"></div></div>`, label: "Indeterminate", auto: true },
    ], { wide: true })}
  `;
}


// ═════════════════════════════════════════════════════════════════════════════
//  FEEDBACK
// ═════════════════════════════════════════════════════════════════════════════

export function renderToastDemo(comp) {
  return `
    ${this.renderPlayground(`
      <div style="display:flex;gap:var(--ui-space-3);flex-wrap:wrap;">
        <button class="ui-btn ui-btn--accent" id="demoToastBasic">Basic Toast</button>
        <button class="ui-btn ui-btn--accent ui-btn--filled" id="demoToastIcon">Toast with Icon</button>
        <button class="ui-btn ui-btn--outline" id="demoToastBorder">Icon + Screen Border</button>
      </div>
    `, comp.variants, this.state.activeVariant)}
    ${this.renderStatesGrid("Appearance", [
      { html: `<div class="ui-toast" style="position:relative;animation:none;">This is a basic toast notification</div>`, label: "Basic", auto: true },
      { html: `<div class="ui-toast ui-toast--with-icon" style="position:relative;animation:none;">Toast with a custom icon<div class="ui-toast__icon"><ha-icon icon="mdi:check-circle"></ha-icon></div></div>`, label: "With Icon", auto: true },
    ], { wide: true })}
  `;
}


export function renderScreenBorderDemo(comp) {
  return `
    ${this.renderPlayground(`
      <button class="ui-btn ui-btn--accent ui-btn--filled" id="demoScreenBorder">Flash Screen Border</button>
    `, comp.variants, this.state.activeVariant)}
    <div class="cat-demo-section">
      <div class="cat-section-label">Notes</div>
      <div style="font-size:var(--ui-font-s);color:var(--ui-text-mute);line-height:var(--ui-font-line-height-l);">
        Creates a full-screen SVG border overlay with pulse animation. Sidebar-aware positioning adjusts for the HA sidebar width.
      </div>
    </div>
  `;
}


export function renderModalDemo(comp) {
  return `
    ${this.renderPlayground(`
      <div style="display:flex;gap:var(--ui-space-3);flex-wrap:wrap;">
        <button class="ui-btn ui-btn--accent" id="demoModalBasic">Basic Modal</button>
        <button class="ui-btn ui-btn--accent ui-btn--filled" id="demoModalButtons">With Buttons</button>
        <button class="ui-btn ui-btn--outline" id="demoModalSmall">Small</button>
        <button class="ui-btn ui-btn--outline" id="demoModalMedium">Medium</button>
        <button class="ui-btn ui-btn--outline" id="demoModalLarge">Large</button>
      </div>
    `, comp.variants, this.state.activeVariant)}
    <div class="cat-demo-section">
      <div class="cat-section-label">Size Reference</div>
      <div style="display:flex;gap:var(--ui-space-3);flex-wrap:wrap;font-size:var(--ui-font-s);color:var(--ui-text-mute);">
        <span>Small: 480px</span>
        <span>Medium: 720px</span>
        <span>Large: 960px</span>
      </div>
    </div>
  `;
}


export function renderSpinnerDemo(comp) {
  return `
    ${this.renderPlayground(`
      <div style="display:flex;gap:var(--ui-space-6);align-items:center;">
        <span class="ui-spinner ui-icon-loading"></span>
        <button class="ui-btn ui-btn--accent ui-btn--filled" id="demoSpinnerBtn">
          Click to Load
        </button>
      </div>
    `, comp.variants, this.state.activeVariant)}
  `;
}




export function renderSkeletonDemo(comp) {
  return `
    ${this.renderPlayground(`
      <div style="display:flex;flex-direction:column;gap:var(--ui-space-4);width:100%;max-width:400px;">
        <div class="ui-skeleton-row">
          <div class="ui-skeleton ui-skeleton--circle ui-skeleton--lg"></div>
          <div class="ui-skeleton-group" style="flex:1;">
            <div class="ui-skeleton ui-skeleton--text" style="width:60%;"></div>
            <div class="ui-skeleton ui-skeleton--text" style="width:40%;"></div>
          </div>
        </div>
        <div class="ui-skeleton ui-skeleton--rect"></div>
        <div class="ui-skeleton-group">
          <div class="ui-skeleton ui-skeleton--text" style="width:90%;"></div>
          <div class="ui-skeleton ui-skeleton--text" style="width:75%;"></div>
          <div class="ui-skeleton ui-skeleton--text" style="width:85%;"></div>
        </div>
      </div>
    `, comp.variants, this.state.activeVariant, { col: true })}

    <div class="cat-demo-section">
      <div class="cat-section-label">Reveal Transition (Click to Replay)</div>
      <div id="demoSkeletonReveal" style="display:flex;flex-direction:column;gap:var(--ui-space-3);width:100%;max-width:400px;cursor:pointer;">
        <div class="ui-skeleton ui-skeleton--text" style="width:55%;"></div>
        <div class="ui-skeleton ui-skeleton--text ui-skeleton--sm" style="width:35%;"></div>
        <div class="ui-skeleton ui-skeleton--text ui-skeleton--sm" style="width:40%;"></div>
        <div class="ui-skeleton ui-skeleton--text ui-skeleton--sm" style="width:30%;"></div>
      </div>
    </div>
    ${this.renderStatesGrid("Shapes", [
      { html: `<div class="ui-skeleton ui-skeleton--text" style="width:80%;"></div>`, label: "Text", auto: true },
      { html: `<div class="ui-skeleton ui-skeleton--circle ui-skeleton--lg"></div>`, label: "Circle" },
      { html: `<div class="ui-skeleton ui-skeleton--rect" style="width:100%;"></div>`, label: "Rectangle", auto: true, tall: true },
      { html: `<div class="ui-skeleton ui-skeleton--square ui-skeleton--xl"></div>`, label: "Square" },
    ])}
    ${this.renderStatesGrid("Sizes", [
      { html: `<div class="ui-skeleton ui-skeleton--text ui-skeleton--xs" style="width:60%;"></div>`, label: "XS (8px)", auto: true },
      { html: `<div class="ui-skeleton ui-skeleton--text ui-skeleton--sm" style="width:60%;"></div>`, label: "SM (12px)", auto: true },
      { html: `<div class="ui-skeleton ui-skeleton--text ui-skeleton--md" style="width:60%;"></div>`, label: "MD (16px)", auto: true },
      { html: `<div class="ui-skeleton ui-skeleton--text ui-skeleton--lg" style="width:60%;"></div>`, label: "LG (24px)", auto: true },
      { html: `<div class="ui-skeleton ui-skeleton--text ui-skeleton--xl" style="width:60%;"></div>`, label: "XL (32px)", auto: true },
    ], { wide: true })}
  `;
}


// ═════════════════════════════════════════════════════════════════════════════
//  LAYOUT
// ═════════════════════════════════════════════════════════════════════════════

export function renderTabBarDemo(comp) {
  const v = this.state.activeVariant || "standard";

  const tabItems = (prefix, active) => ["Tab One", "Tab Two", "Tab Three"].map((t, i) =>
    `<button class="ui-tab-bar__tab${i === active ? " ui-tab-bar__tab--active" : ""}" data-tab="${prefix}-${i}">${t}</button>`
  ).join("");

  const playgroundMap = {
    "standard": `<div class="demo-tabbar-interactive"><div class="ui-tab-bar">${tabItems("std", 0)}</div></div>`,
    "pill":     `<div class="demo-tabbar-interactive"><div class="ui-tab-bar ui-tab-bar--pill">${tabItems("pill", 0)}</div></div>`,
    "colored":  `<div class="demo-tabbar-interactive"><div class="ui-tab-bar ui-tab-bar--pill ui-tab-bar--colored">
      <button class="ui-tab-bar__tab ui-tab-bar__tab--active" style="--_tab-color:var(--ui-cat-teal);--_tab-color-faint:var(--ui-cat-teal-faint);">Teal</button>
      <button class="ui-tab-bar__tab" style="--_tab-color:var(--ui-cat-amber);--_tab-color-faint:var(--ui-cat-amber-faint);">Amber</button>
      <button class="ui-tab-bar__tab" style="--_tab-color:var(--ui-cat-violet);--_tab-color-faint:var(--ui-cat-violet-faint);">Violet</button>
    </div></div>`,
  };

  return `
    ${this.renderPlayground(playgroundMap[v] || playgroundMap["standard"], comp.variants, v)}
    ${this.renderStatesGrid("Variants", [
      { html: `<div class="ui-tab-bar" style="width:100%;"><button class="ui-tab-bar__tab ui-tab-bar__tab--active">Active</button><button class="ui-tab-bar__tab">Tab</button></div>`, label: "Standard", auto: true },
      { html: `<div class="ui-tab-bar ui-tab-bar--pill" style="width:100%;"><button class="ui-tab-bar__tab ui-tab-bar__tab--active">Active</button><button class="ui-tab-bar__tab">Tab</button></div>`, label: "Pill", auto: true },
    ], { wide: true })}
  `;
}


export function renderCardHeaderDemo(comp) {
  const infoIcon = `<ui-info-icon position="bottom"></ui-info-icon>`;

  return `
    ${this.renderPlayground(`
      <div style="width:100%;max-width:500px;display:flex;flex-direction:column;gap:var(--ui-space-6);">
        <div class="ui-card-header">
          <div class="ui-card-header__accent"></div>
          <h2 class="ui-card-header__title">Default Accent</h2>
          ${infoIcon}
        </div>
        <div class="ui-card-header">
          <div class="ui-card-header__accent" style="background:var(--ui-success);"></div>
          <h2 class="ui-card-header__title">Custom Colour</h2>
        </div>
        <div class="ui-card-header">
          <div class="ui-card-header__accent" style="background:var(--ui-warning);animation:ui-attention-pulse 2s ease-in-out infinite;"></div>
          <h2 class="ui-card-header__title">Animated State</h2>
        </div>
      </div>
    `, [], null, { col: true })}
    ${this.renderStatesGrid("Accent Colours", [
      { html: `<div class="ui-card-header" style="width:100%;margin:0;"><div class="ui-card-header__accent"></div><h2 class="ui-card-header__title" style="font-size:var(--ui-font-m);">Default</h2></div>`, label: "Accent (default)", auto: true },
      { html: `<div class="ui-card-header" style="width:100%;margin:0;"><div class="ui-card-header__accent" style="background:var(--ui-success);"></div><h2 class="ui-card-header__title" style="font-size:var(--ui-font-m);">Success</h2></div>`, label: "Success", auto: true },
      { html: `<div class="ui-card-header" style="width:100%;margin:0;"><div class="ui-card-header__accent" style="background:var(--ui-warning);"></div><h2 class="ui-card-header__title" style="font-size:var(--ui-font-m);">Warning</h2></div>`, label: "Warning", auto: true },
      { html: `<div class="ui-card-header" style="width:100%;margin:0;"><div class="ui-card-header__accent" style="background:var(--ui-error);"></div><h2 class="ui-card-header__title" style="font-size:var(--ui-font-m);">Error</h2></div>`, label: "Error", auto: true },
    ], { wide: true })}
    ${this.renderStatesGrid("With Slots", [
      { html: `<div class="ui-card-header" style="width:100%;margin:0;"><div class="ui-card-header__accent"></div><h2 class="ui-card-header__title" style="font-size:var(--ui-font-m);">Title + Info</h2>${infoIcon}</div>`, label: "Info icon", auto: true },
      { html: `<div class="ui-card-header" style="width:100%;margin:0;"><div class="ui-card-header__accent"></div><h2 class="ui-card-header__title" style="font-size:var(--ui-font-m);">Title</h2><button class="ui-btn ui-btn--small ui-btn--icon" aria-label="Add">${ICON_PLUS}</button></div>`, label: "Action button", auto: true },
    ], { wide: true })}
  `;
}


export function renderSectionHeaderDemo(comp) {
  return `
    ${this.renderPlayground(`
      <div style="width:100%;display:flex;flex-direction:column;gap:var(--ui-space-4);">
        <div class="ui-section-header">
          <span>Default Section</span>
        </div>
        <div class="ui-section-header ui-section-header--bordered">
          <span>Bordered Section</span>
        </div>
        <div class="ui-section-header ui-section-header--compact">
          <span>Compact Section</span>
        </div>
        <div class="ui-section-header ui-section-header--bordered">
          <span>With Actions</span>
          <div class="ui-section-header__actions">
            <button class="ui-btn ui-btn--small ui-btn--accent">Action</button>
          </div>
        </div>
      </div>
    `, comp.variants, this.state.activeVariant, { col: true })}
    ${this.renderStatesGrid("All Variants", [
      { html: `<div class="ui-section-header" style="width:100%;"><span>Default</span></div>`, label: "Default", auto: true },
      { html: `<div class="ui-section-header ui-section-header--bordered" style="width:100%;"><span>Bordered</span></div>`, label: "Bordered", auto: true },
      { html: `<div class="ui-section-header ui-section-header--compact" style="width:100%;"><span>Compact</span></div>`, label: "Compact", auto: true },
      { html: `<div class="ui-section-header ui-section-header--bordered" style="width:100%;"><span>With Actions</span><div class="ui-section-header__actions"><button class="ui-btn ui-btn--small ui-btn--accent">Action</button></div></div>`, label: "With Actions", auto: true },
    ], { wide: true })}
  `;
}


export function renderDataRowDemo(comp) {
  const row = (cls, label, value) => `
    <div class="ui-data-row ${cls}">
      <span class="ui-data-row__label">${label}</span>
      <span class="ui-data-row__value">${value}</span>
    </div>
  `;

  return `
    ${this.renderPlayground(`
      <div style="width:100%;max-width:500px;display:flex;flex-direction:column;">
        ${row("", "Default", "Standard row")}
        ${row("ui-data-row--compact", "Compact", "Less spacing")}
        ${row("ui-data-row--emphasized", "Emphasized", "Stronger text")}
        ${row("ui-data-row--mono", "Mono", "monospace font")}
        ${row("ui-data-row--bordered", "Bordered", "With separator")}
      </div>
    `, comp.variants, this.state.activeVariant, { col: true })}
    ${this.renderStatesGrid("All Variants", [
      { html: row("", "Label", "Value"), label: "Default", auto: true },
      { html: row("ui-data-row--compact", "Label", "Value"), label: "Compact", auto: true },
      { html: row("ui-data-row--stacked", "Label", "Value"), label: "Stacked", auto: true },
      { html: row("ui-data-row--emphasized", "Label", "Value"), label: "Emphasized", auto: true },
      { html: row("ui-data-row--mono", "Label", "123.456"), label: "Mono", auto: true },
      { html: row("ui-data-row--bordered", "Label", "Value"), label: "Bordered", auto: true },
      { html: row("ui-data-row--relaxed", "Label", "Value"), label: "Relaxed", auto: true },
    ], { wide: true })}
  `;
}


export function renderCollapsibleDemo(comp) {
  return `
    ${this.renderPlayground(`
      <div class="demo-collapsible-interactive" style="width:100%;max-width:500px;">
        <div style="display:flex;gap:var(--ui-space-2);margin-bottom:var(--ui-space-3);">
          <button class="ui-btn ui-btn--small ui-btn--outline" id="demoExpandAll">Expand All</button>
          <button class="ui-btn ui-btn--small ui-btn--outline" id="demoCollapseAll">Collapse All</button>
        </div>
        <div class="ui-collapsible-section" data-section-id="cat-demo-expanded">
          <button class="ui-collapsible-section__header" aria-expanded="true">
            <span class="ui-collapsible-section__title">Expanded Section</span>
            <span class="ui-collapsible-section__arrow"></span>
          </button>
          <div class="ui-collapsible-section__content">
            <p style="color:var(--ui-text-mute);font-size:var(--ui-font-s);">This content is visible by default. Click the header to collapse.</p>
          </div>
        </div>
        <div class="ui-collapsible-section" data-section-id="cat-demo-collapsed" data-initial-state="collapsed">
          <button class="ui-collapsible-section__header" aria-expanded="false">
            <span class="ui-collapsible-section__title">Collapsed Section</span>
            <span class="ui-collapsible-section__arrow"></span>
          </button>
          <div class="ui-collapsible-section__content">
            <p style="color:var(--ui-text-mute);font-size:var(--ui-font-s);">This content was hidden by default.</p>
          </div>
        </div>
      </div>
    `, comp.variants, this.state.activeVariant, { col: true })}
  `;
}


export function renderScrollableDemo(comp) {
  const loremItems = Array.from({ length: 12 }, (_, i) => `<div style="padding:var(--ui-space-2);border-bottom:1px solid var(--ui-border-color-light);font-size:var(--ui-font-s);color:var(--ui-text-mute);white-space:nowrap;">Scrollable item ${i + 1} — additional content to demonstrate overflow behaviour</div>`).join("");

  const horizItems = Array.from({ length: 8 }, (_, i) => `<div style="flex-shrink:0;width:140px;padding:var(--ui-space-3);background:var(--ui-elevated-2);border-radius:var(--ui-radius-m);font-size:var(--ui-font-s);color:var(--ui-text-mute);text-align:center;">Item ${i + 1}</div>`).join("");

  return `
    ${this.renderPlayground(`
      <div style="display:flex;gap:var(--ui-space-4);flex-wrap:wrap;width:100%;">
        <div style="flex:1;min-width:200px;">
          <div style="font-size:11px;color:var(--ui-text-mute);margin-bottom:var(--ui-space-2);text-transform:uppercase;">Vertical</div>
          <div class="ui-scrollable ui-scrollable--vertical" style="max-height:150px;border:1px solid var(--ui-border-color-light);border-radius:var(--ui-radius-m);">
            ${loremItems}
          </div>
        </div>
        <div style="flex:1;min-width:200px;">
          <div style="font-size:11px;color:var(--ui-text-mute);margin-bottom:var(--ui-space-2);text-transform:uppercase;">Compact</div>
          <div class="ui-scrollable ui-scrollable--vertical ui-scrollable--compact" style="max-height:150px;border:1px solid var(--ui-border-color-light);border-radius:var(--ui-radius-m);">
            ${loremItems}
          </div>
        </div>
      </div>
    `, comp.variants, this.state.activeVariant, { col: true })}
    ${this.renderStatesGrid("All Variants", [
      { html: `<div class="ui-scrollable ui-scrollable--vertical" style="max-height:100px;width:100%;border:1px solid var(--ui-border-color-light);border-radius:var(--ui-radius-m);">${loremItems}</div>`, label: "Vertical", auto: true, tall: true },
      { html: `<div class="ui-scrollable ui-scrollable--vertical ui-scrollable--compact" style="max-height:100px;width:100%;border:1px solid var(--ui-border-color-light);border-radius:var(--ui-radius-m);">${loremItems}</div>`, label: "Compact", auto: true, tall: true },
      { html: `<div class="ui-scrollable ui-scrollable--horizontal" style="width:100%;border:1px solid var(--ui-border-color-light);border-radius:var(--ui-radius-m);"><div style="display:flex;gap:var(--ui-space-2);padding:var(--ui-space-2);">${horizItems}</div></div>`, label: "Horizontal", auto: true, tall: true },
      { html: `<div class="ui-scrollable ui-scrollable--vertical ui-scrollable--hidden" style="max-height:100px;width:100%;border:1px solid var(--ui-border-color-light);border-radius:var(--ui-radius-m);">${loremItems}</div>`, label: "Hidden scrollbar", auto: true, tall: true },
    ], { wide: true })}
  `;
}


export function renderSurfaceDemo(comp) {
  const elevBox = (level) => `
    <div style="background:var(--ui-elevated-${level});padding:var(--ui-space-4);border-radius:var(--ui-radius-m);text-align:center;border:1px solid var(--ui-border-color-light);">
      <div style="font-size:var(--ui-font-s);font-weight:500;color:var(--ui-text);">elevated-${level}</div>
      <div style="font-size:11px;color:var(--ui-text-mute);font-family:monospace;">--ui-elevated-${level}</div>
    </div>
  `;

  const shadowBox = (level) => `
    <div style="background:var(--ui-elevated-1);padding:var(--ui-space-4);border-radius:var(--ui-radius-m);text-align:center;box-shadow:var(--ui-shadow-${level});">
      <div style="font-size:var(--ui-font-s);font-weight:500;color:var(--ui-text);">shadow-${level}</div>
      <div style="font-size:11px;color:var(--ui-text-mute);font-family:monospace;">--ui-shadow-${level}</div>
    </div>
  `;

  return `
    <div class="cat-demo-section">
      <div class="cat-section-label">Elevation Backgrounds</div>
      <div class="cat-states cat-states--wide">
        ${[0, 1, 2, 3, 4].map(i => `<div class="cat-state-box"><div class="cat-state-preview cat-state-preview--auto">${elevBox(i)}</div></div>`).join("")}
      </div>
    </div>
    <div class="cat-demo-section">
      <div class="cat-section-label">Shadow Levels</div>
      <div class="cat-states cat-states--wide">
        ${[0, 1, 2, 3, 4].map(i => `<div class="cat-state-box"><div class="cat-state-preview cat-state-preview--auto">${shadowBox(i)}</div></div>`).join("")}
      </div>
    </div>
  `;
}


// ═════════════════════════════════════════════════════════════════════════════
//  OVERLAYS
// ═════════════════════════════════════════════════════════════════════════════

export function renderTooltipDemo(comp) {
  const btn = (text, pos, caret, delay) => {
    let attrs = `data-demo-tooltip="${text}" data-demo-tooltip-pos="${pos}"`;
    if (caret) attrs += ` data-demo-tooltip-caret="true"`;
    if (delay !== undefined) attrs += ` data-demo-tooltip-delay="${delay}"`;
    return `<button class="ui-btn ui-btn--outline" ${attrs}>${pos}${caret ? " + caret" : ""}${delay !== undefined ? ` (${delay}ms)` : ""}</button>`;
  };

  return `
    ${this.renderPlayground(`
      <div style="display:flex;gap:var(--ui-space-3);flex-wrap:wrap;">
        ${btn("Tooltip on top", "top", false)}
        ${btn("Tooltip below", "bottom", false)}
        ${btn("Tooltip left", "left", false)}
        ${btn("Tooltip right", "right", false)}
      </div>
    `, comp.variants, this.state.activeVariant)}
    ${this.renderStatesGrid("With Caret", [
      { html: btn("Top caret", "top", true), label: "Top" },
      { html: btn("Bottom caret", "bottom", true), label: "Bottom" },
      { html: btn("Left caret", "left", true), label: "Left" },
      { html: btn("Right caret", "right", true), label: "Right" },
    ])}
    ${this.renderStatesGrid("Custom Delays", [
      { html: btn("Immediate", "top", false, 0), label: "0ms" },
      { html: btn("Default delay", "top", false, 400), label: "400ms" },
      { html: btn("Slow reveal", "top", false, 1000), label: "1000ms" },
    ])}
  `;
}


export function renderRichTooltipDemo(comp) {
  return `
    ${this.renderPlayground(`
      <div style="display:flex;gap:var(--ui-space-3);flex-wrap:wrap;">
        <button class="ui-btn ui-btn--outline" data-demo-rich-tooltip data-demo-rich-title="Rich Tooltip" data-demo-rich-body="This tooltip has both a title and body text.">Hover (Rich)</button>
        <button class="ui-btn ui-btn--accent" data-demo-rich-persistent data-demo-rich-title="Persistent" data-demo-rich-body="Click outside or press Escape to dismiss.">Click (Persistent)</button>
        <button class="ui-btn ui-btn--accent ui-btn--filled" data-demo-rich-action>With Action</button>
      </div>
    `, comp.variants, this.state.activeVariant)}
    ${this.renderStatesGrid("Modes", [
      { html: `<button class="ui-btn ui-btn--outline" data-demo-rich-tooltip data-demo-rich-title="Hover Mode" data-demo-rich-body="Appears on mouseenter, hides on mouseleave.">Hover to see</button>`, label: "Hover (transient)" },
      { html: `<button class="ui-btn ui-btn--accent" data-demo-rich-persistent data-demo-rich-title="Persistent" data-demo-rich-body="Stays until click-outside or Escape.">Click to pin</button>`, label: "Click (persistent)" },
      { html: `<button class="ui-btn ui-btn--accent ui-btn--filled" data-demo-rich-action>Click for action</button>`, label: "With action button" },
    ])}
  `;
}


export function renderMenuDemo(comp) {
  const menuItems = `
    <button class="ui-menu__item">Menu Item One</button>
    <button class="ui-menu__item">Menu Item Two</button>
    <button class="ui-menu__item">Menu Item Three</button>
    <button class="ui-menu__item">Menu Item Four</button>
  `;

  return `
    ${this.renderPlayground(`
      <div style="min-height:260px;display:flex;align-items:flex-start;justify-content:center;padding-top:var(--ui-space-4);">
        <div class="demo-menu-interactive" style="position:relative;display:inline-block;">
          <button class="ui-btn ui-btn--accent" id="demoMenuTrigger">Open Menu</button>
          <div class="ui-menu" style="position:absolute;top:calc(100% + 4px);left:50%;translate:-50% 0;bottom:auto;right:auto;">
            ${menuItems}
          </div>
        </div>
      </div>
    `, comp.variants, this.state.activeVariant)}
    ${this.renderStatesGrid("States", [
      { html: `<div class="ui-menu ui-menu--open" style="position:relative;bottom:auto;right:auto;">${menuItems}</div>`, label: "Default", auto: true },
      { html: `<div class="ui-menu ui-menu--open" style="position:relative;bottom:auto;right:auto;"><button class="ui-menu__item">Item One</button><button class="ui-menu__item is-hovered">Item Two</button><button class="ui-menu__item">Item Three</button></div>`, label: "Hover", auto: true },
      { html: `<div class="ui-menu ui-menu--open" style="position:relative;bottom:auto;right:auto;"><button class="ui-menu__item">Item One</button><button class="ui-menu__item ui-menu__item--selected">Item Two</button><button class="ui-menu__item">Item Three</button></div>`, label: "Selected", auto: true },
    ], { wide: true })}
  `;
}


// ═════════════════════════════════════════════════════════════════════════════
//  FOUNDATION
// ═════════════════════════════════════════════════════════════════════════════

export function renderColoursDemo(comp) {
  const swatch = (token, label) => `
    <div class="cat-swatch" data-swatch-token="${token}">
      <div class="cat-swatch__color" style="background:var(${token});">
        <span class="cat-swatch__value"></span>
      </div>
      <div class="cat-swatch__label">${label || token}</div>
    </div>
  `;

  // ── Foundation sections (always visible) ──────────────────────────────
  const foundationSections = [
    { label: "Semantic Roles", tokens: [
      ["--ui-accent", "accent"], ["--ui-success", "success"], ["--ui-warning", "warning"],
      ["--ui-error", "error"], ["--ui-info", "info"],
    ]},
    { label: "Soft & Faint Variants", tokens: [
      ["--ui-accent-soft", "accent-soft"], ["--ui-accent-faint", "accent-faint"],
      ["--ui-success-soft", "success-soft"], ["--ui-success-faint", "success-faint"],
      ["--ui-warning-soft", "warning-soft"], ["--ui-warning-faint", "warning-faint"],
      ["--ui-error-soft", "error-soft"], ["--ui-error-faint", "error-faint"],
      ["--ui-info-soft", "info-soft"], ["--ui-info-faint", "info-faint"],
    ]},
    { label: "Surfaces", tokens: [
      ["--ui-surface", "surface"], ["--ui-surface-alt", "surface-alt"], ["--ui-surface-alt-2", "surface-alt-2"],
    ]},
    { label: "Elevation Tiers", tokens: [
      ["--ui-elevated-0", "elevated-0"], ["--ui-elevated-1", "elevated-1"], ["--ui-elevated-2", "elevated-2"],
      ["--ui-elevated-3", "elevated-3"], ["--ui-elevated-4", "elevated-4"],
    ]},
    { label: "Shadows", shadow: true, tokens: [
      ["--ui-shadow-1", "shadow-1"], ["--ui-shadow-2", "shadow-2"],
      ["--ui-shadow-3", "shadow-3"], ["--ui-shadow-4", "shadow-4"],
    ]},
    { label: "Overlays", tokens: [
      ["--ui-overlay-bg", "overlay-bg"], ["--ui-overlay-scrim", "overlay-scrim"],
      ["--ui-overlay-scrim-strong", "overlay-scrim-strong"],
    ]},
    { label: "Text Colours", tokens: [
      ["--ui-text", "text"], ["--ui-text-mute", "text-mute"], ["--ui-text-strong", "text-strong"],
      ["--ui-text-on-accent", "text-on-accent"], ["--ui-text-on-danger", "text-on-danger"],
    ]},
    { label: "Borders", tokens: [
      ["--ui-border-color-light", "border-light"], ["--ui-border-color-med", "border-med"],
      ["--ui-border-color-strong", "border-strong"],
    ]},
    { label: "State Layers", tokens: [
      ["--ui-state-hover", "state-hover"], ["--ui-state-pressed", "state-pressed"],
      ["--ui-state-active", "state-active"], ["--ui-state-focus-ring", "state-focus-ring"],
    ]},
    { label: "Pink (Accent Variant)", tokens: [
      ["--ui-pink", "pink"], ["--ui-pink-soft", "pink-soft"],
    ]},
    { label: "Tier Colours", tokens: [
      ["--ui-tier-a", "tier-a (gold)"], ["--ui-tier-a-faint", "tier-a-faint"],
      ["--ui-tier-b", "tier-b (purple)"], ["--ui-tier-b-faint", "tier-b-faint"],
      ["--ui-tier-c", "tier-c (blue)"], ["--ui-tier-c-faint", "tier-c-faint"],
      ["--ui-tier-d", "tier-d (green)"], ["--ui-tier-d-faint", "tier-d-faint"],
    ]},
    { label: "Category Colours", tokens: [
      ["--ui-cat-teal", "cat-teal"], ["--ui-cat-teal-faint", "cat-teal-faint"],
      ["--ui-cat-amber", "cat-amber"], ["--ui-cat-amber-faint", "cat-amber-faint"],
      ["--ui-cat-sky", "cat-sky"], ["--ui-cat-sky-faint", "cat-sky-faint"],
      ["--ui-cat-violet", "cat-violet"], ["--ui-cat-violet-faint", "cat-violet-faint"],
      ["--ui-cat-green", "cat-green"], ["--ui-cat-green-faint", "cat-green-faint"],
      ["--ui-cat-red", "cat-red"], ["--ui-cat-red-faint", "cat-red-faint"],
      ["--ui-cat-lime", "cat-lime"], ["--ui-cat-lime-faint", "cat-lime-faint"],
      ["--ui-cat-slate", "cat-slate"], ["--ui-cat-slate-faint", "cat-slate-faint"],
    ]},
    { label: "Activity Colours (Presence)", tokens: [
      ["--ui-activity-active-fresh", "active-fresh"], ["--ui-activity-active-fresh-secondary", "active-fresh-secondary"],
      ["--ui-activity-active-stale", "active-stale"],
      ["--ui-activity-recent-fresh", "recent-fresh"], ["--ui-activity-recent-fresh-secondary", "recent-fresh-secondary"],
      ["--ui-activity-recent-faded", "recent-faded"], ["--ui-activity-recent-faded-secondary", "recent-faded-secondary"],
    ]},
  ];

  // ── Component sections (collapsed) ────────────────────────────────────
  const componentGroups = [
    { label: "Input",     tokens: [["--ui-input-bg", "input-bg"]] },
    { label: "Switch",    tokens: [["--ui-switch-track-off", "track-off"], ["--ui-switch-thumb-on", "thumb-on"], ["--ui-switch-icon-off", "icon-off"], ["--ui-switch-outline-off", "outline-off"]] },
    { label: "Badge",     tokens: [["--ui-badge-bg", "badge-bg"], ["--ui-badge-text", "badge-text"]] },
    { label: "FAB",       tokens: [["--ui-fab-hover-bg", "hover-bg"], ["--ui-fab-active-bg", "active-bg"]] },
    { label: "Progress",  tokens: [["--ui-progress-track", "track"]] },
    { label: "Toast",     tokens: [["--ui-toast-bg", "bg"], ["--ui-toast-text", "text"], ["--ui-toast-icon-color", "icon"], ["--ui-toast-close-bg", "close-bg"], ["--ui-toast-close-bg-hover", "close-hover"], ["--ui-toast-close-color", "close-color"]] },
    { label: "Tooltip",   tokens: [["--ui-tooltip-bg", "bg"], ["--ui-tooltip-text", "text"], ["--ui-rich-tooltip-bg", "rich-bg"], ["--ui-rich-tooltip-text", "rich-text"]] },
    { label: "Menu",      tokens: [["--ui-menu-item-hover-bg", "hover-bg"]] },
    { label: "Scrollbar", tokens: [["--ui-scrollbar-track", "track"], ["--ui-scrollbar-thumb", "thumb"], ["--ui-scrollbar-thumb-hover", "thumb-hover"]] },
    { label: "Skeleton",  tokens: [["--ui-skeleton-base", "base"], ["--ui-skeleton-shine", "shine"]] },
  ];

  // ── Counts ────────────────────────────────────────────────────────────
  const componentCount = componentGroups.reduce((n, g) => n + g.tokens.length, 0);

  const formatRadio = `
    <div class="cat-colour-format" data-colour-format>
      <div class="ui-radio-group ui-radio-group--horizontal">
        <label class="ui-radio">
          <input type="radio" class="ui-radio__input" name="colourFormat" value="hex" checked />
          <span class="ui-radio__circle">
            <svg class="ui-radio__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="ui-radio__label">Hex</span>
        </label>
        <label class="ui-radio">
          <input type="radio" class="ui-radio__input" name="colourFormat" value="rgb" />
          <span class="ui-radio__circle">
            <svg class="ui-radio__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="ui-radio__label">RGB</span>
        </label>
      </div>
    </div>
  `;

  // ── Render shadow swatches differently (show box-shadow not flat fill) ─
  const renderShadowSwatch = ([token, label]) => `
    <div class="cat-swatch" data-swatch-token="${token}">
      <div class="cat-swatch__color" style="background:var(--ui-surface);box-shadow:var(${token});">
        <span class="cat-swatch__value"></span>
      </div>
      <div class="cat-swatch__label">${label}</div>
    </div>
  `;

  // ── Build foundation HTML ─────────────────────────────────────────────
  const foundationHTML = foundationSections.map((section, i) => {
    const isFirst = i === 0;
    const swatchesHTML = section.shadow
      ? section.tokens.map(renderShadowSwatch).join("")
      : section.tokens.map(([t, l]) => swatch(t, l)).join("");

    return `
      <div class="cat-demo-section">
        <div class="cat-section-label${isFirst ? " cat-section-label--with-action" : ""}">
          ${isFirst ? `<span>${section.label}</span>${formatRadio}` : section.label}
        </div>
        <div class="cat-swatch-grid">
          ${swatchesHTML}
        </div>
      </div>
    `;
  }).join("");

  // ── Build component HTML ──────────────────────────────────────────────
  const componentHTML = componentGroups.map(group => `
    <div class="cat-component-colours__group">
      <div class="cat-component-colours__group-label">${group.label}</div>
      <div class="cat-component-colours__swatches">
        ${group.tokens.map(([token, label]) => swatch(token, label)).join("")}
      </div>
    </div>
  `).join("");

  return `
    ${foundationHTML}

    <div class="cat-component-colours" id="catComponentColours">
      <div class="ui-collapsible-section" data-section-id="component-colours" data-initial-state="collapsed">
        <button class="ui-collapsible-section__header" aria-expanded="false">
          <span class="ui-collapsible-section__title">Component Colours</span>
          <span class="cat-component-colours__count">${componentCount} tokens</span>
          <span class="ui-collapsible-section__arrow"></span>
        </button>
        <div class="ui-collapsible-section__content">
          <div class="cat-component-colours__desc">Tokens consumed internally by specific components. Override to restyle without touching the foundational palette.</div>
          <div class="cat-component-colours__grid">
            ${componentHTML}
          </div>
        </div>
      </div>
    </div>
  `;
}


export function renderSpacingDemo(comp) {
  const steps = [
    { token: "--ui-space-1", px: "4px" },
    { token: "--ui-space-2", px: "8px" },
    { token: "--ui-space-3", px: "12px" },
    { token: "--ui-space-4", px: "16px" },
    { token: "--ui-space-5", px: "20px" },
    { token: "--ui-space-6", px: "24px" },
    { token: "--ui-space-7", px: "28px" },
    { token: "--ui-space-8", px: "32px" },
    { token: "--ui-space-9", px: "40px" },
    { token: "--ui-space-10", px: "48px" },
  ];

  const layoutTokens = [
    { token: "--ui-layout-card-padding", label: "card-padding", ref: "space-6 (24px)" },
    { token: "--ui-layout-section-gap", label: "section-gap", ref: "space-4 (16px)" },
    { token: "--ui-layout-row-gap", label: "row-gap", ref: "space-3 (12px)" },
  ];

  const zIndex = [
    { token: "--ui-z-base", label: "base", value: "0" },
    { token: "--ui-z-tooltip", label: "tooltip", value: "10" },
    { token: "--ui-z-menu", label: "menu", value: "20" },
    { token: "--ui-z-dialog", label: "dialog", value: "30" },
    { token: "--ui-z-toast", label: "toast", value: "40" },
    { token: "--ui-z-max", label: "max", value: "50" },
  ];

  return `
    <div class="cat-demo-section">
      <div class="cat-section-label">Spacing Scale (4px Grid)</div>
      ${steps.map(s => `
        <div class="cat-scale-row">
          <div class="cat-scale-label">${s.token.replace("--ui-", "")}</div>
          <div class="cat-scale-bar" style="width:var(${s.token});"></div>
          <div class="cat-scale-value">${s.px}</div>
        </div>
      `).join("")}
    </div>
    <div class="cat-demo-section">
      <div class="cat-section-label">Layout Tokens</div>
      ${layoutTokens.map(lt => `
        <div class="cat-scale-row">
          <div class="cat-scale-label">${lt.label}</div>
          <div class="cat-scale-bar" style="width:var(${lt.token});"></div>
          <div class="cat-scale-value">${lt.ref}</div>
        </div>
      `).join("")}
    </div>
    <div class="cat-demo-section">
      <div class="cat-section-label">Z-Index Scale</div>
      ${zIndex.map(z => `
        <div class="cat-scale-row">
          <div class="cat-scale-label">${z.label}</div>
          <div class="cat-scale-bar" style="width:${z.value === "0" ? "4px" : (parseInt(z.value) * 4) + "px"};"></div>
          <div class="cat-scale-value">${z.value}</div>
        </div>
      `).join("")}
    </div>
  `;
}


export function renderTypographyDemo(comp) {
  const sizes = [
    { token: "--ui-font-xs", label: "xs", px: "12px" },
    { token: "--ui-font-s", label: "s", px: "14px" },
    { token: "--ui-font-m", label: "m", px: "16px" },
    { token: "--ui-font-l", label: "l", px: "18px" },
    { token: "--ui-font-xl", label: "xl", px: "21px" },
  ];

  const weights = [
    { token: "--ui-font-weight-s", label: "Light", value: "300" },
    { token: "--ui-font-weight-m", label: "Regular", value: "400" },
    { token: "--ui-font-weight-l", label: "Medium", value: "500" },
  ];

  const lineHeights = [
    { token: "--ui-font-line-height-s", label: "s (tight)", value: "1.2" },
    { token: "--ui-font-line-height-m", label: "m (normal)", value: "1.4" },
    { token: "--ui-font-line-height-l", label: "l (relaxed)", value: "1.6" },
  ];

  const letterSpacings = [
    { token: "--ui-font-letter-spacing-s", label: "s (wide)", value: "0.8px" },
    { token: "--ui-font-letter-spacing-m", label: "m (medium)", value: "0.5px" },
    { token: "--ui-font-letter-spacing-l", label: "l (tight)", value: "0.2px" },
  ];

  return `
    <div class="cat-demo-section">
      <div class="cat-section-label">Font Sizes</div>
      ${sizes.map(s => `
        <div class="cat-type-sample">
          <div class="cat-type-sample__text" style="font-size:var(${s.token});">The quick brown fox jumps over the lazy dog</div>
          <div class="cat-type-sample__meta">${s.label} — ${s.px} — var(${s.token})</div>
        </div>
      `).join("")}
    </div>
    <div class="cat-demo-section">
      <div class="cat-section-label">Font Weights</div>
      ${weights.map(w => `
        <div class="cat-type-sample">
          <div class="cat-type-sample__text" style="font-weight:var(${w.token});font-size:var(--ui-font-l);">${w.label} weight text sample</div>
          <div class="cat-type-sample__meta">${w.value} — var(${w.token})</div>
        </div>
      `).join("")}
    </div>
    <div class="cat-demo-section">
      <div class="cat-section-label">Line Heights</div>
      ${lineHeights.map(lh => `
        <div class="cat-type-sample">
          <div class="cat-type-sample__text" style="line-height:var(${lh.token});font-size:var(--ui-font-m);">The quick brown fox jumps over the lazy dog. This second sentence shows how line height affects multi-line readability.</div>
          <div class="cat-type-sample__meta">${lh.value} — var(${lh.token})</div>
        </div>
      `).join("")}
    </div>
    <div class="cat-demo-section">
      <div class="cat-section-label">Letter Spacing</div>
      ${letterSpacings.map(ls => `
        <div class="cat-type-sample">
          <div class="cat-type-sample__text" style="letter-spacing:var(${ls.token});font-size:var(--ui-font-m);text-transform:uppercase;">SECTION HEADER LABEL</div>
          <div class="cat-type-sample__meta">${ls.value} — var(${ls.token})</div>
        </div>
      `).join("")}
    </div>
  `;
}


export function renderRadiiDemo(comp) {
  const radii = [
    { token: "--ui-radius-s", label: "s", px: "8px" },
    { token: "--ui-radius-m", label: "m", px: "12px" },
    { token: "--ui-radius-l", label: "l", px: "18px" },
    { token: "--ui-radius-xl", label: "xl", px: "32px" },
    { token: "--ui-radius-pill", label: "pill", px: "999px" },
  ];

  const borderWidths = [
    { token: "--ui-border-width-s", label: "s", px: "1px" },
    { token: "--ui-border-width-m", label: "m", px: "2px" },
    { token: "--ui-border-width-l", label: "l", px: "3px" },
  ];

  return `
    ${this.renderStatesGrid("Border Radii", radii.map(r => ({
      html: `<div class="cat-radius-box" style="border-radius:var(${r.token});"></div>`,
      label: `${r.label} (${r.px})`,
    })))}
    ${this.renderStatesGrid("Border Widths", borderWidths.map(bw => ({
      html: `<div style="width:80px;height:80px;background:var(--ui-elevated-2);border:var(${bw.token}) solid var(--ui-accent);border-radius:var(--ui-radius-m);"></div>`,
      label: `${bw.label} (${bw.px})`,
    })), { narrow: true })}
  `;
}


export function renderMotionDemo(comp) {
  const timings = [
    { token: "--ui-motion-fast", label: "fast", ms: "120ms" },
    { token: "--ui-motion-med", label: "med", ms: "240ms" },
    { token: "--ui-motion-slow", label: "slow", ms: "360ms" },
  ];

  return `
    <div class="cat-demo-section">
      <div class="cat-section-label">Timing Tokens (Click to Animate)</div>
      ${timings.map(t => `
        <div class="cat-scale-row" style="margin-bottom:var(--ui-space-3);">
          <div class="cat-scale-label">${t.label} (${t.ms})</div>
          <div class="cat-motion-bar" data-timing="var(${t.token})" title="Click to toggle"></div>
        </div>
      `).join("")}
    </div>
    <div class="cat-demo-section">
      <div class="cat-section-label">Component-Specific Timings (Click to Animate)</div>
      ${[
        { label: "switch", ms: "350ms" },
        { label: "checkbox", ms: "320ms" },
        { label: "progress", ms: "350ms" },
        { label: "circle-slider-bounce", ms: "350ms" },
        { label: "toast-in", ms: "600ms" },
        { label: "toast-out", ms: "150ms" },
        { label: "modal-in", ms: "200ms" },
        { label: "modal-out", ms: "120ms" },
        { label: "tooltip-opacity", ms: "120ms" },
        { label: "tooltip-transform", ms: "320ms" },
      ].map(t => `
        <div class="cat-scale-row" style="margin-bottom:var(--ui-space-3);">
          <div class="cat-scale-label">${t.label}</div>
          <div class="cat-motion-bar" data-timing="${t.ms}" title="Click to toggle (${t.ms})"></div>
          <div class="cat-scale-value">${t.ms}</div>
        </div>
      `).join("")}
    </div>
  `;
}


export function renderAnimationDemo(comp) {
  const keyframes = [
    {
      name: "ui-pop-in",
      label: "Pop In",
      desc: "Spring overshoot entrance. Parameterised via --ui-pop-from-scale, --ui-pop-overshoot, --ui-pop-from-y.",
      animation: "ui-pop-in 500ms var(--ui-ease-spring) both",
      role: "enter",
    },
    {
      name: "ui-slide-in",
      label: "Slide In",
      desc: "Directional reveal (no blur). Set --ui-anim-from-x or --ui-anim-from-y.",
      animation: "ui-slide-in 400ms ease-out both",
      props: { "--ui-anim-from-y": "20px" },
      role: "enter",
    },
    {
      name: "ui-reveal-in",
      label: "Reveal In",
      desc: "Directional blur reveal. Used whole-element or per-character with staggered delay.",
      animation: "ui-reveal-in 600ms ease-out both",
      props: { "--ui-anim-from-x": "40px" },
      role: "enter",
    },
    {
      name: "ui-settle-in",
      label: "Settle In",
      desc: "Subtle materialisation. No overshoot — reads as the element fading into place.",
      animation: "ui-settle-in 400ms ease-out both",
      role: "enter",
    },
    {
      name: "ui-tap-bounce",
      label: "Tap Bounce",
      desc: "7-stop scale bounce for tap/click feedback. Trigger via class toggle.",
      animation: "ui-tap-bounce 650ms var(--ui-ease-bounce) both",
      role: "respond",
    },
    {
      name: "ui-bar-grow",
      label: "Bar Grow",
      desc: "Single-axis scaleY from bottom. Requires transform-origin: bottom center on element.",
      animation: "ui-bar-grow 500ms ease-out both",
      role: "enter",
    },
    {
      name: "ui-attention-pulse",
      label: "Attention Pulse",
      desc: "Ambient border-color oscillation. Loops infinitely — composable with enter animations.",
      animation: "ui-attention-pulse 2s ease-in-out infinite",
      role: "ambient",
      autoplay: true,
    },
    {
      name: "ui-fade-out",
      label: "Fade Out",
      desc: "Simple opacity exit. Use for batch removal of list items or dismissed elements.",
      animation: "ui-fade-out 250ms ease-in-out both",
      role: "exit",
    },
    {
      name: "ui-firework",
      label: "Firework",
      desc: "Radial 6-particle burst via box-shadow. Parameterised: --ui-firework-color, --ui-firework-spread.",
      animation: "ui-firework 500ms ease forwards",
      role: "respond",
    },
    {
      name: "ui-check-stroke-1",
      label: "Check Stroke",
      desc: "Two-part animated checkmark. Apply ui-check-stroke-1 (left leg) AND ui-check-stroke-2 (right leg) together — coupled geometry, both required.",
      animation: "ui-check-stroke-1 400ms ease forwards",
      role: "respond",
    },
  ];

  const easings = [
    { token: "--ui-ease-spring", label: "spring", note: "overshoot + settle", value: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
    { token: "--ui-ease-spring-heavy", label: "spring-heavy", note: "heavy overshoot", value: "cubic-bezier(0.35, 1.7, 0.45, 0.9)" },
    { token: "--ui-ease-bounce", label: "bounce", note: "sharp decelerate", value: "cubic-bezier(0.12, 0.5, 0.86, 1)" },
  ];

  const params = [
    { token: "--ui-pop-from-scale", default: "0" },
    { token: "--ui-pop-overshoot", default: "1.05" },
    { token: "--ui-pop-from-y", default: "0px" },
    { token: "--ui-anim-from-x", default: "0px" },
    { token: "--ui-anim-from-y", default: "0px" },
    { token: "--ui-anim-delay", default: "0s" },
    { token: "--ui-anim-duration", default: "1s" },
    { token: "--ui-firework-color", default: "var(--ui-accent)" },
    { token: "--ui-firework-spread", default: "15px" },
  ];

  const roleColors = {
    enter: "var(--ui-accent)",
    exit: "var(--ui-error)",
    respond: "var(--ui-warning)",
    ambient: "var(--ui-info)",
  };

  return `
    <div class="cat-demo-section">
      <div class="cat-section-label">Keyframes (Click to Replay)</div>
      <div class="cat-anim-grid">
        ${keyframes.map(kf => {
          let targetStyle = "";
          if (kf.name === "ui-bar-grow") {
            targetStyle = "transform-origin:bottom center;height:48px;width:24px;";
          } else if (kf.name === "ui-attention-pulse") {
            targetStyle = "background:transparent;border:var(--ui-border-width-l) solid var(--ui-accent);animation:" + kf.animation + ";";
          } else if (kf.name === "ui-firework") {
            targetStyle = "width:4px;height:4px;border-radius:50%;";
          } else if (kf.name === "ui-check-stroke-1") {
            targetStyle = "width:4px;height:2px;background:var(--ui-accent);border-radius:0;position:relative;";
          }
          return `
          <div class="cat-anim-card" data-anim-name="${kf.name}" data-anim-value="${kf.animation}"
            ${kf.props ? `data-anim-props='${JSON.stringify(kf.props)}'` : ""}>
            <div class="cat-anim-card__preview">
              <div class="cat-anim-card__target"
                ${targetStyle ? `style="${targetStyle}"` : ""}>
              </div>
            </div>
            <div class="cat-anim-card__meta">
              <div class="cat-anim-card__name">
                <span class="cat-anim-card__dot" style="background:${roleColors[kf.role]};"></span>
                ${kf.label}
              </div>
              <div class="cat-anim-card__token">${kf.name}</div>
            </div>
          </div>
        `;}).join("")}
      </div>
    </div>

    <div class="cat-demo-section">
      <div class="cat-section-label">Easing Curves (Click to Animate)</div>
      <div style="display:flex;flex-direction:column;gap:var(--ui-space-4);">
        ${easings.map(e => `
          <div class="cat-anim-easing-row" data-easing="var(${e.token})">
            <div class="cat-anim-easing-row__header">
              <span class="cat-anim-easing-row__label">${e.label}</span>
              <span class="cat-anim-easing-row__note">${e.note}</span>
            </div>
            <div class="cat-anim-easing-track">
              <div class="cat-anim-easing-track__end"></div>
              <div class="cat-anim-easing-track__dot"></div>
            </div>
            <div class="cat-anim-easing-row__value">${e.value}</div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="cat-demo-section">
      <div class="cat-section-label">Per-Character Text Reveal (Click to Replay)</div>
      <div class="cat-anim-text-reveal" data-anim-text-reveal>
        <div class="cat-anim-text-reveal__line" data-reveal-text="Animation System" data-reveal-from="60px"></div>
        <div class="cat-anim-text-reveal__line cat-anim-text-reveal__line--sub" data-reveal-text="per-character staggered blur" data-reveal-from="40px" data-reveal-base="0.5"></div>
      </div>
    </div>

    <div class="cat-demo-section">
      <div class="cat-section-label">Multi-Line Text Reveal (Click to Replay)</div>
      <div class="cat-anim-text-reveal" data-anim-text-reveal>
        <div class="cat-anim-text-reveal__line" data-reveal-text="Good morning" data-reveal-from="50px"></div>
        <div class="cat-anim-text-reveal__line" data-reveal-text="the time is 08:42" data-reveal-from="50px" data-reveal-base="0.4"></div>
        <div class="cat-anim-text-reveal__line cat-anim-text-reveal__line--sub" data-reveal-text="3 lights on \u00b7 front door locked \u00b7 21\u00b0C inside" data-reveal-from="30px" data-reveal-base="0.9"></div>
      </div>
    </div>

    <div class="cat-demo-section">
      <div class="cat-section-label">Cycling Text Crossfade (Auto-cycles, Click to Skip)</div>
      <div class="cat-anim-text-stream" data-anim-text-cycle
        data-cycle-messages='["Good morning! The living room is 22\u00b0C with 3 lights on and the curtains open.","Front door has been locked for 2 hours. No motion has been detected in the hallway since 14:23.","It\u2019s partly cloudy outside and 14\u00b0C. A light jacket should be more than enough for today.","The next train to London Bridge departs in 12 minutes from platform 2. There are currently minor delays on the line."]'
        data-cycle-display="5000"
        data-cycle-char-delay="0.03"
        data-cycle-fade-duration="0.9">
      </div>
    </div>

    <div class="cat-demo-section">
      <div class="cat-section-label">Parameter Tokens</div>
      <div style="display:flex;flex-direction:column;gap:var(--ui-space-2);font-size:var(--ui-font-s);color:var(--ui-text-mute);font-family:monospace;">
        ${params.map(p => `<div>${p.token}: ${p.default}</div>`).join("")}
      </div>
    </div>
  `;
}


export function renderElevationDemo(comp) {
  // Delegates to surface demo since they're closely related
  return this.renderSurfaceDemo(comp);
}


export function renderIconsDemo(comp) {
  const iconSVG = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.63L12,2L9.19,8.63L2,9.24L7.46,13.97L5.82,21L12,17.27Z"/></svg>`;
  const sizes = [
    { token: "--ui-icon-xs", label: "xs", px: "14px" },
    { token: "--ui-icon-s", label: "s", px: "18px" },
    { token: "--ui-icon-m", label: "m", px: "20px" },
    { token: "--ui-icon-l", label: "l", px: "24px" },
  ];

  return `
    ${this.renderStatesGrid("Icon Sizes", sizes.map(s => ({
      html: `<div style="width:var(${s.token});height:var(${s.token});color:var(--ui-accent);">${iconSVG}</div>`,
      label: `${s.label} (${s.px})`,
    })), { narrow: true })}
  `;
}


export function renderDrawerDemo(comp) {
  const gearSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
  const closeSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  const checkSVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;

  return `
    ${this.renderPlayground(`
      <div style="position:relative;overflow:hidden;border-radius:var(--ui-radius-xl);background:var(--ui-elevated-1);height:320px;--ui-drawer-radius:var(--ui-radius-xl);">
        <div style="padding:var(--ui-space-4);color:var(--ui-text-mute);font-size:var(--ui-font-s);">
          Card content behind the drawer. Click the FAB or use the button below to open.
        </div>
        <button class="ui-fab ui-fab--regular ui-drawer-toggle" style="opacity:1;transform:scale(1);" aria-label="Settings">
          <span class="ui-drawer-toggle__icon">${gearSVG}</span>
        </button>
        <div class="ui-drawer-backdrop"></div>
        <div class="ui-drawer">
          <div class="ui-drawer__header">
            <h3 class="ui-drawer__title">Settings</h3>
            <button class="ui-drawer__close" aria-label="Close">${closeSVG}</button>
          </div>
          <div class="ui-drawer__content">
            <div class="ui-drawer__group">
              <div class="ui-drawer__row">
                <span class="ui-drawer__label">Max height</span>
                <div class="ui-input ui-input--inline">
                  <div class="ui-input__pill">
                    <input type="number" class="ui-input__field" value="600" min="200" max="800" step="50" />
                  </div>
                </div>
              </div>
            </div>
            <div class="ui-drawer__group">
              <div class="ui-drawer__row">
                <span class="ui-drawer__label">Show completed</span>
                <label class="ui-icon-switch">
                  <input type="checkbox" class="ui-switch__input" checked />
                  <span class="ui-switch__track">
                    <span class="ui-switch__thumb">
                      <span class="ui-switch__icon-on">${checkSVG}</span>
                    </span>
                  </span>
                </label>
              </div>
            </div>
            <div class="ui-drawer__group">
              <div class="ui-drawer__row">
                <span class="ui-drawer__label">Sort order</span>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:var(--ui-space-2);margin-top:var(--ui-space-2);">
                <button class="ui-btn ui-btn--outline ui-btn--small ui-btn--toggle is-selected">Default</button>
                <button class="ui-btn ui-btn--outline ui-btn--small ui-btn--toggle">Urgency</button>
                <button class="ui-btn ui-btn--outline ui-btn--small ui-btn--toggle">Active</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `, comp.variants, this.state.activeVariant, { col: true })}
    ${this.renderStatesGrid("Anatomy", [
      { html: `<div style="display:flex;flex-direction:column;gap:var(--ui-space-1);width:100%;font-size:var(--ui-font-xs);font-family:monospace;color:var(--ui-text-mute);">
        <div style="padding:var(--ui-space-2);background:var(--ui-elevated-2);border-radius:var(--ui-radius-s);border:1px solid var(--ui-border-color-light);">ui-drawer-toggle (FAB)</div>
        <div style="padding:var(--ui-space-2);background:var(--ui-elevated-2);border-radius:var(--ui-radius-s);border:1px solid var(--ui-border-color-light);opacity:0.5;">ui-drawer-backdrop</div>
        <div style="padding:var(--ui-space-2);background:var(--ui-elevated-3);border-radius:var(--ui-radius-s);border:1px solid var(--ui-border-color-med);">ui-drawer</div>
        <div style="padding:var(--ui-space-2);background:var(--ui-elevated-2);border-radius:var(--ui-radius-s);border:1px solid var(--ui-border-color-light);margin-left:var(--ui-space-3);">__header + __close</div>
        <div style="padding:var(--ui-space-2);background:var(--ui-elevated-2);border-radius:var(--ui-radius-s);border:1px solid var(--ui-border-color-light);margin-left:var(--ui-space-3);">__content</div>
        <div style="padding:var(--ui-space-2);background:var(--ui-elevated-2);border-radius:var(--ui-radius-s);border:1px solid var(--ui-border-color-light);margin-left:var(--ui-space-6);">__group > __row</div>
      </div>`, label: "Structure", auto: true, tall: true },
      { html: `<div style="display:flex;flex-direction:column;gap:var(--ui-space-1);width:100%;font-size:var(--ui-font-xs);font-family:monospace;color:var(--ui-text-mute);">
        <div style="padding:var(--ui-space-2);background:var(--ui-elevated-2);border-radius:var(--ui-radius-s);border:1px solid var(--ui-border-color-light);margin-left:var(--ui-space-3);">__tabs (optional)</div>
        <div style="padding:var(--ui-space-2);background:var(--ui-elevated-2);border-radius:var(--ui-radius-s);border:1px solid var(--ui-border-color-light);margin-left:var(--ui-space-3);">__section (grouping)</div>
        <div style="padding:var(--ui-space-2);background:var(--ui-elevated-2);border-radius:var(--ui-radius-s);border:1px solid var(--ui-border-color-light);margin-left:var(--ui-space-3);">__group--bordered</div>
        <div style="padding:var(--ui-space-2);background:var(--ui-elevated-2);border-radius:var(--ui-radius-s);border:1px solid var(--ui-border-color-light);margin-left:var(--ui-space-6);">__label + __value</div>
      </div>`, label: "Optional sub-components", auto: true, tall: true },
    ], { wide: true })}
    <div class="cat-demo-section">
      <div class="cat-section-label">Behaviour</div>
      <div style="display:flex;flex-direction:column;gap:var(--ui-space-2);font-size:var(--ui-font-s);color:var(--ui-text-mute);">
        <div><strong style="color:var(--ui-text);">Open:</strong> FAB click → backdrop fades in, drawer slides from right with elastic easing</div>
        <div><strong style="color:var(--ui-text);">Close:</strong> Close button, backdrop click, or Escape → reverse animation, FAB reappears</div>
        <div><strong style="color:var(--ui-text);">Tabs:</strong> Optional tab bar below header for multi-section drawers</div>
        <div><strong style="color:var(--ui-text);">Persistence:</strong> Drawer settings persist via HA helper entities when configured</div>
      </div>
    </div>
  `;
}


// ═════════════════════════════════════════════════════════════════════════════
//  ADDITIONAL LAYOUT
// ═════════════════════════════════════════════════════════════════════════════

export function renderCardDemo(comp) {
  return `
    ${this.renderPlayground(`
      <div style="display:flex;gap:var(--ui-space-4);flex-wrap:wrap;width:100%;">
        <div class="ui-card" style="flex:1;min-width:200px;">
          <div class="ui-card-header" style="margin-bottom:var(--ui-space-3);">
            <div class="ui-card-header__accent"></div>
            <h2 class="ui-card-header__title" style="font-size:var(--ui-font-m);">Card Title</h2>
          </div>
          <div style="font-size:var(--ui-font-s);color:var(--ui-text-mute);">
            Card content goes here. The <code>.ui-card</code> class provides padding, elevated background, and rounded corners.
          </div>
        </div>
        <div class="ui-card" style="flex:1;min-width:200px;">
          <div style="font-size:var(--ui-font-s);font-weight:500;color:var(--ui-text);margin-bottom:var(--ui-space-2);">Minimal Card</div>
          <div style="font-size:var(--ui-font-s);color:var(--ui-text-mute);">
            No header — just a container with consistent spacing and elevation.
          </div>
        </div>
      </div>
    `, [], null, { col: true })}
    ${this.renderStatesGrid("Tokens Applied", [
      { html: `<div style="display:flex;flex-direction:column;gap:var(--ui-space-1);font-size:var(--ui-font-xs);font-family:monospace;color:var(--ui-text-mute);width:100%;">
        <div>padding: --ui-layout-card-padding (24px)</div>
        <div>background: --ui-surface</div>
        <div>border-radius: --ui-radius-xl (32px)</div>
        <div>position: relative</div>
      </div>`, label: "CSS properties", auto: true },
      { html: `<div style="display:flex;flex-direction:column;gap:var(--ui-space-1);font-size:var(--ui-font-xs);font-family:monospace;color:var(--ui-text-mute);width:100%;">
        <div>.ui-card</div>
        <div>.ui-card-header (optional)</div>
        <div>.ui-card-actions (optional, absolute top-right)</div>
      </div>`, label: "Class names", auto: true },
    ], { wide: true })}
  `;
}


// ═════════════════════════════════════════════════════════════════════════════
//  ADDITIONAL FOUNDATION
// ═════════════════════════════════════════════════════════════════════════════

export function renderUtilitiesDemo(comp) {
  return `
    <div class="cat-demo-section">
      <div class="cat-section-label">Text Colour Utilities</div>
      <div style="display:flex;flex-direction:column;gap:var(--ui-space-3);padding:var(--ui-space-4);background:var(--ui-elevated-1);border-radius:var(--ui-radius-m);border:1px solid var(--ui-border-color-light);">
        <div><span class="ui-text--success" style="font-weight:500;">ui-text--success</span> <span style="font-size:var(--ui-font-xs);color:var(--ui-text-mute);">— confirmation messages, positive states</span></div>
        <div><span class="ui-text--warning" style="font-weight:500;">ui-text--warning</span> <span style="font-size:var(--ui-font-xs);color:var(--ui-text-mute);">— caution, pending states</span></div>
        <div><span class="ui-text--error" style="font-weight:500;">ui-text--error</span> <span style="font-size:var(--ui-font-xs);color:var(--ui-text-mute);">— errors, destructive states</span></div>
        <div><span class="ui-text--info" style="font-weight:500;">ui-text--info</span> <span style="font-size:var(--ui-font-xs);color:var(--ui-text-mute);">— informational highlights</span></div>
        <div><span class="ui-text--muted" style="font-weight:500;">ui-text--muted</span> <span style="font-size:var(--ui-font-xs);color:var(--ui-text-mute);">— de-emphasised, secondary text</span></div>
      </div>
    </div>
    <div class="cat-demo-section">
      <div class="cat-section-label">Surface Background Utilities</div>
      <div style="display:flex;flex-direction:column;gap:var(--ui-space-2);">
        ${[0, 1, 2, 3, 4].map(i => `
          <div class="ui-surface-${i}" style="padding:var(--ui-space-3);border-radius:var(--ui-radius-m);border:1px solid var(--ui-border-color-light);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:var(--ui-font-s);font-weight:500;color:var(--ui-text);">ui-surface-${i}</span>
            <span style="font-size:var(--ui-font-xs);font-family:monospace;color:var(--ui-text-mute);">--ui-elevated-${i}</span>
          </div>
        `).join("")}
      </div>
    </div>
    <div class="cat-demo-section">
      <div class="cat-section-label">Usage Notes</div>
      <div style="font-size:var(--ui-font-s);color:var(--ui-text-mute);line-height:var(--ui-font-line-height-l);">
        Text utilities use <code>!important</code> to override component-specific colours. Surface utilities apply background only — combine with border and radius tokens as needed.
      </div>
    </div>
  `;
}
