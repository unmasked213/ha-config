// ══════════════════════════════════════════════════════════════════════════════
//  COMPONENT USAGE DATA
//  Markup examples, JS init requirements, and events for each component.
//  Keyed by registry ID. Foundation entries omitted (token references, not components).
// ══════════════════════════════════════════════════════════════════════════════

export const COMPONENT_USAGE = {

  // ── Controls ──────────────────────────────────────────────────────────────

  'button': {
    markup:
`<button class="ui-btn ui-btn--accent ui-btn--filled">
  Label
</button>`,
    cssOnly: true,
  },

  'toggle-button': {
    markup:
`<button class="ui-btn ui-btn--toggle">Off</button>
<button class="ui-btn ui-btn--toggle is-selected">On</button>`,
    cssOnly: true,
    notes: 'Toggle .is-selected on click.',
  },

  'split-button': {
    markup:
`<div class="ui-split">
  <button class="ui-split__main ui-btn">Action</button>
  <button class="ui-split__arrow">▾</button>
  <div class="ui-menu">
    <button class="ui-menu__item">Option</button>
  </div>
</div>`,
    cssOnly: true,
    notes: 'Toggle .ui-split--open and .ui-menu--open on arrow click.',
  },

  'copy-button': {
    markup:
`<button class="ui-copy-btn" aria-label="Copy">
  <!-- icon SVG -->
</button>`,
    jsImport: `import { handleCopyButton } from '/local/base/components.js';`,
    jsInit: `handleCopyButton(btn, textToCopy, { onSuccess, onError })`,
  },

  'fab': {
    markup:
`<button class="ui-fab ui-fab--regular" aria-label="Action">
  <!-- icon SVG -->
</button>`,
    cssOnly: true,
    notes: 'Sizes: ui-fab--small (40px), ui-fab--regular (56px), ui-fab--extended.',
  },

  'chip': {
    markup: `<span class="ui-chip">Label</span>`,
    cssOnly: true,
    notes: 'Add .ui-chip--selected for active state.',
  },

  'badge': {
    markup:
`<span class="ui-badge ui-badge--success">Label</span>
<span class="ui-badge ui-badge--accent">
  <span class="ui-badge__dot"></span>Online
</span>`,
    cssOnly: true,
  },


  // ── Forms ─────────────────────────────────────────────────────────────────

  'text-input': {
    markup:
`<div class="ui-input">
  <div class="ui-input__pill">
    <input type="text" class="ui-input__field" placeholder=" " />
    <label class="ui-input__label">Label</label>
  </div>
</div>`,
    jsImport: `import { initInputs } from '/local/base/helpers.js';`,
    jsInit: `initInputs(container)`,
    notes: 'placeholder=" " is required for the floating label CSS to work.',
  },

  'slider': {
    markup:
`<div class="ui-slider" data-slider="mySlider">
  <div class="ui-slider__container">
    <div class="ui-slider__track-active"></div>
    <div class="ui-slider__track-inactive"></div>
    <div class="ui-slider__thumb">
      <div class="ui-slider__value"></div>
    </div>
    <input type="range" class="ui-slider__input" min="0" max="100" value="50" />
  </div>
</div>`,
    jsImport: `import { initSliders } from '/local/base/helpers.js';`,
    jsInit: `initSliders(container)`,
  },

  'circle-slider': {
    markup: `<ui-circle-slider value="50" min="0" max="100" label="Label"></ui-circle-slider>`,
    jsInit: 'Self-initialising custom element.',
    events: ['ui-input', 'ui-change', 'ui-tap'],
    notes: 'type="interactive" for tap mode (wobble + ui-tap event). Default unit is empty; set unit="%" explicitly if needed.',
  },

  'number-input': {
    markup: `<ui-number-input value="5" min="1" max="20"></ui-number-input>`,
    jsInit: 'Self-initialising custom element.',
    events: ['ui-input', 'ui-change'],
    notes: 'Add disabled attribute to disable. Supports scroll and momentum hold.',
  },

  'switch': {
    markup:
`<label class="ui-switch">
  <input type="checkbox" class="ui-switch__input" />
  <span class="ui-switch__track">
    <span class="ui-switch__thumb"></span>
  </span>
  <span class="ui-switch__label">Label</span>
</label>`,
    cssOnly: true,
    notes: 'Use .ui-icon-switch for icon variant with checkmark in thumb.',
  },

  'checkbox': {
    markup:
`<label class="ui-checkbox">
  <input type="checkbox" class="ui-checkbox__input" />
  <span class="ui-checkbox__box">
    <svg class="ui-checkbox__icon" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="3">
      <path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round"
        stroke-linejoin="round"/>
    </svg>
  </span>
  <span class="ui-checkbox__label">Label</span>
</label>`,
    cssOnly: true,
  },

  'radio': {
    markup:
`<div class="ui-radio-group" role="radiogroup">
  <label class="ui-radio">
    <input type="radio" class="ui-radio__input" name="group" value="a" />
    <span class="ui-radio__circle"><!-- check SVG --></span>
    <span class="ui-radio__label">Option A</span>
  </label>
</div>`,
    cssOnly: true,
    notes: 'Add .ui-radio-group--horizontal for inline layout.',
  },

  'progress': {
    markup:
`<div class="ui-progress" role="progressbar"
  aria-valuenow="65" aria-valuemin="0" aria-valuemax="100">
  <div class="ui-progress__bar" style="width: 65%;"></div>
</div>`,
    cssOnly: true,
    notes: 'Modifiers: --thin, --thick, --indeterminate, --success, --warning, --error.',
  },


  // ── Feedback ──────────────────────────────────────────────────────────────

  'toast': {
    jsImport: `import { showToast } from '/local/base/toasts.js';`,
    jsInit: `showToast({ message: 'Saved', icon: 'mdi:check' })`,
    notes: 'Auto-dismisses after 6s. Hover pauses timer. Max 10 stacked.',
  },

  'modal': {
    jsImport: `import { showModal } from '/local/base/modals.js';`,
    jsInit:
`showModal({
  title: 'Confirm',
  content: '<p>Are you sure?</p>',
  size: 'm',
  buttons: [
    { label: 'Cancel', variant: 'secondary', action: m => m.close() },
    { label: 'OK', variant: 'accent', action: m => m.close() },
  ]
})`,
  },

  'spinner': {
    markup: `<span class="ui-spinner ui-icon-loading"></span>`,
    cssOnly: true,
  },

  'screen-border': {
    jsImport: `import { flashScreenBorder } from '/local/base/screen-border.js';`,
    jsInit: `flashScreenBorder()`,
  },

  'skeleton': {
    markup:
`<div class="ui-skeleton ui-skeleton--text" style="width: 60%;"></div>
<div class="ui-skeleton ui-skeleton--circle ui-skeleton--lg"></div>
<div class="ui-skeleton ui-skeleton--rect"></div>`,
    cssOnly: true,
    notes: 'Sizes: --xs, --sm, --md, --lg, --xl. Shapes: --text, --circle, --rect, --square.',
  },


  // ── Layout ────────────────────────────────────────────────────────────────

  'card': {
    markup: `<div class="ui-card">\n  <!-- card content -->\n</div>`,
    cssOnly: true,
  },

  'tab-bar': {
    markup:
`<div class="ui-tab-bar ui-tab-bar--pill">
  <button class="ui-tab-bar__tab ui-tab-bar__tab--active">Tab 1</button>
  <button class="ui-tab-bar__tab">Tab 2</button>
</div>`,
    cssOnly: true,
    notes: 'Toggle .ui-tab-bar__tab--active on click. Add .ui-tab-bar--colored for custom tab colours.',
  },

  'card-header': {
    markup:
`<div class="ui-card-header">
  <div class="ui-card-header__accent"></div>
  <h2 class="ui-card-header__title">Title</h2>
</div>`,
    cssOnly: true,
    notes: 'Override accent colour with inline style on __accent. Add action buttons after __title.',
  },

  'section-header': {
    markup:
`<div class="ui-section-header ui-section-header--bordered">
  <span>Section Title</span>
  <div class="ui-section-header__actions">
    <button class="ui-btn ui-btn--small">Action</button>
  </div>
</div>`,
    cssOnly: true,
  },

  'data-row': {
    markup:
`<div class="ui-data-row">
  <span class="ui-data-row__label">Label</span>
  <span class="ui-data-row__value">Value</span>
</div>`,
    cssOnly: true,
    notes: 'Modifiers: --compact, --stacked, --emphasized, --mono, --bordered, --relaxed.',
  },

  'collapsible': {
    markup:
`<div class="ui-collapsible-section" id="mySection">
  <button class="ui-collapsible-section__header" aria-expanded="true">
    <span class="ui-collapsible-section__title">Title</span>
    <span class="ui-collapsible-section__arrow"></span>
  </button>
  <div class="ui-collapsible-section__content">
    <!-- content -->
  </div>
</div>`,
    jsImport: `import { initCollapsibleSections } from '/local/base/components.js';`,
    jsInit: `initCollapsibleSections(container)`,
    notes: 'Add data-initial-state="collapsed" for default-closed. State persists via localStorage.',
  },

  'scrollable': {
    markup:
`<div class="ui-scrollable ui-scrollable--vertical" style="max-height: 300px;">
  <!-- scrollable content -->
</div>`,
    cssOnly: true,
    notes: 'Variants: --vertical, --horizontal, --compact (thin scrollbar), --hidden.',
  },

  'surface': {
    markup:
`<!-- Use elevation tokens directly -->
<div style="background: var(--ui-elevated-2); box-shadow: var(--ui-shadow-2);">
  Elevated content
</div>`,
    cssOnly: true,
  },

  'drawer': {
    markup:
`<button class="ui-fab ui-fab--regular ui-drawer-toggle">
  <span class="ui-drawer-toggle__icon"><!-- gear SVG --></span>
</button>
<div class="ui-drawer-backdrop"></div>
<div class="ui-drawer">
  <div class="ui-drawer__header">
    <h3 class="ui-drawer__title">Title</h3>
    <button class="ui-drawer__close"><!-- close SVG --></button>
  </div>
  <div class="ui-drawer__content">
    <div class="ui-drawer__group">
      <div class="ui-drawer__row">
        <span class="ui-drawer__label">Setting</span>
        <!-- control -->
      </div>
    </div>
  </div>
</div>`,
    notes: 'Wire FAB → .is-open on drawer, .is-visible on backdrop. Close on backdrop click, close button, Escape.',
  },


  // ── Overlays ──────────────────────────────────────────────────────────────

  'tooltip': {
    jsImport: `import { showTooltip, hideTooltip } from '/local/base/tooltips.js';`,
    jsInit:
`el.addEventListener('mouseenter', () =>
  showTooltip(el, 'Tooltip text', { position: 'top', caret: true })
);
el.addEventListener('mouseleave', () => hideTooltip());`,
    notes: 'Also supports data-tooltip attribute with initTooltips(container).',
  },

  'rich-tooltip': {
    jsImport: `import { showRichTooltip } from '/local/base/tooltips.js';`,
    jsInit:
`showRichTooltip(el, { title: 'Title', body: 'Body text' }, {
  persistent: true,
  delay: 0,
  action: { label: 'Action', onClick: () => {} }
})`,
  },

  'menu': {
    markup:
`<div class="ui-menu">
  <button class="ui-menu__item">Item One</button>
  <button class="ui-menu__item ui-menu__item--selected">Item Two</button>
</div>`,
    cssOnly: true,
    notes: 'Toggle .ui-menu--open to show. Add .ui-menu__item--selected for active item.',
  },
};
