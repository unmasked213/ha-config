// ==============================================================================
//  COMPONENT ANATOMY DATA
//  Spec data for the anatomy section of the catalogue card.
//  Sourced from spec.md (sections 6.1-6.27) and componentry docs.
//  Foundation entries (colours, spacing, etc.) are omitted - they ARE the reference.
//
//  Fields:
//    specs[]    - geometry/dimension tiles: { value, label, token? }
//    states[]   - interaction states the component supports
//    features[] - capability badges from fixed set:
//                 css-only, js-required, custom-element, focus-trap,
//                 reduced-motion, keyboard, localstorage, light-dom
// ==============================================================================

export const COMPONENT_ANATOMY = {

  // -- Controls ---------------------------------------------------------------

  'button': {
    specs: [
      { value: '40px', label: 'Height', token: '--ui-space-9' },
      { value: '20px', label: 'Padding X', token: '--ui-space-5' },
      { value: '8px', label: 'Icon gap', token: '--ui-space-2' },
      { value: 'pill', label: 'Radius', token: '--ui-radius-pill' },
      { value: '16px', label: 'Font', token: '--ui-font-m' },
      { value: '500', label: 'Weight' },
      { value: '48px', label: 'Touch target' },
    ],
    states: ['default', 'hover', 'pressed', 'focus', 'disabled'],
    features: ['css-only'],
  },

  'toggle-button': {
    specs: [
      { value: '40px', label: 'Height', token: '--ui-space-9' },
      { value: 'pill', label: 'Radius', token: '--ui-radius-pill' },
      { value: '48px', label: 'Touch target' },
    ],
    states: ['unselected', 'selected', 'hover', 'focus', 'disabled'],
    features: ['css-only'],
  },

  'split-button': {
    specs: [
      { value: '40px', label: 'Height', token: '--ui-split-height' },
      { value: '2px', label: 'Segment gap', token: '--ui-split-gap' },
      { value: '20px', label: 'Outer radius', token: '--ui-split-radius-outer' },
      { value: '6px', label: 'Inner radius', token: '--ui-split-radius-inner' },
      { value: '8px', label: 'Icon gap', token: '--ui-space-2' },
      { value: '16\u00d716', label: 'Arrow icon' },
    ],
    states: ['default', 'hover', 'pressed', 'focus'],
    features: ['css-only'],
  },

  'copy-button': {
    specs: [
      { value: '48px', label: 'Size', token: '--ui-space-10' },
      { value: '50%', label: 'Radius' },
      { value: '360ms', label: 'Animation', token: '--ui-motion-slow' },
    ],
    states: ['default', 'hover', 'copied'],
    features: ['js-required'],
  },

  'fab': {
    specs: [
      { value: '40px', label: 'Small', token: '--ui-space-9' },
      { value: '56px', label: 'Regular', token: '--ui-fab-size-regular' },
      { value: '50%', label: 'Radius', token: '--ui-fab-radius' },
      { value: '24px', label: 'Pad X (ext)', token: '--ui-space-6' },
      { value: '16px', label: 'Font', token: '--ui-font-m' },
      { value: 'shadow-3', label: 'Shadow', token: '--ui-shadow-3' },
    ],
    states: ['default', 'hover', 'pressed', 'focus', 'disabled'],
    features: ['css-only'],
  },

  'chip': {
    specs: [
      { value: '32px', label: 'Height', token: '--ui-chip-height' },
      { value: 'pill', label: 'Radius', token: '--ui-chip-radius' },
      { value: '12px', label: 'Padding X', token: '--ui-chip-padding-x' },
      { value: '8px', label: 'Gap', token: '--ui-chip-gap' },
      { value: '~14px', label: 'Font', token: '--ui-font-s' },
    ],
    states: ['default', 'selected'],
    features: ['css-only'],
  },

  'badge': {
    specs: [
      { value: '8px', label: 'Padding Y', token: '--ui-space-2' },
      { value: '12px', label: 'Padding X', token: '--ui-space-3' },
      { value: 'pill', label: 'Radius', token: '--ui-radius-pill' },
      { value: '~12px', label: 'Font', token: '--ui-font-xs' },
      { value: '500', label: 'Weight' },
      { value: '1.2', label: 'Line height', token: '--ui-font-line-height-s' },
    ],
    states: [],
    features: ['css-only'],
  },


  // -- Forms ------------------------------------------------------------------

  'text-input': {
    specs: [
      { value: '40px', label: 'Height', token: '--ui-input-height' },
      { value: '16px', label: 'Padding X', token: '--ui-input-padding-x' },
      { value: '8px', label: 'Padding Y', token: '--ui-input-padding-y' },
      { value: '32px', label: 'Radius', token: '--ui-radius-xl' },
      { value: '2px', label: 'Border', token: '--ui-border-width-m' },
      { value: '240ms', label: 'Label anim', token: '--ui-motion-med' },
    ],
    states: ['default', 'hover', 'focus', 'has-value', 'error', 'disabled'],
    features: ['js-required', 'reduced-motion'],
  },

  'slider': {
    specs: [
      { value: '24px', label: 'Track height', token: '--ui-slider-track-height' },
      { value: '44px', label: 'Thumb height', token: '--ui-slider-thumb-height' },
      { value: '6px', label: 'Thumb W rest', token: '--ui-slider-thumb-width-rest' },
      { value: '12px', label: 'Track radius', token: '--ui-slider-track-radius' },
      { value: '5px', label: 'Gap rest', token: '--ui-slider-gap-rest' },
      { value: '48px', label: 'Container', token: '--ui-slider-container-height' },
      { value: '36px', label: 'Value bubble', token: '--ui-slider-value-size' },
      { value: '200ms', label: 'Motion', token: '--ui-slider-motion-duration' },
    ],
    states: ['default', 'hover', 'pressed', 'focus'],
    features: ['js-required', 'reduced-motion'],
  },

  'circle-slider': {
    specs: [
      { value: '90px', label: 'Size', token: '--ui-circle-size' },
      { value: '3px', label: 'Stroke', token: '--ui-circle-stroke-width' },
      { value: '~18px', label: 'Value font', token: '--ui-font-l' },
      { value: '120ms', label: 'Fill speed', token: '--ui-motion-fast' },
      { value: '350ms', label: 'Bounce', token: '--ui-circle-slider-bounce' },
    ],
    states: ['default', 'hover', 'pressed', 'focus', 'disabled'],
    features: ['custom-element', 'reduced-motion', 'keyboard'],
  },

  'number-input': {
    specs: [
      { value: '100px', label: 'Rest width' },
      { value: '136px', label: 'Active width' },
      { value: '48px', label: 'Height', token: '--ui-space-10' },
      { value: '32px', label: 'Radius', token: '--ui-radius-xl' },
      { value: '3px', label: 'Border', token: '--ui-border-width-l' },
      { value: '32px', label: 'Chevron zone', token: '--ui-space-8' },
      { value: '240ms', label: 'Expand', token: '--ui-ease-spring' },
    ],
    states: ['default', 'active', 'editing', 'holding', 'disabled'],
    features: ['custom-element', 'reduced-motion', 'keyboard'],
  },

  'switch': {
    specs: [
      { value: '48px', label: 'Track W', token: '--ui-switch-track-width' },
      { value: '32px', label: 'Track H', token: '--ui-switch-track-height' },
      { value: '16px', label: 'Thumb off', token: '--ui-switch-thumb-size-off' },
      { value: '24px', label: 'Thumb on', token: '--ui-switch-thumb-size-on' },
      { value: '2px', label: 'Outline', token: '--ui-switch-outline-width' },
      { value: '48px', label: 'Touch target', token: '--ui-switch-touch-target' },
      { value: '350ms', label: 'Wobble', token: '--ui-switch-motion' },
    ],
    states: ['off', 'on', 'hover', 'focus', 'disabled'],
    features: ['css-only', 'reduced-motion'],
  },

  'checkbox': {
    specs: [
      { value: '26px', label: 'Box size', token: '--ui-control-size' },
      { value: '2px', label: 'Border', token: '--ui-control-border-width' },
      { value: '8px', label: 'Radius', token: '--ui-control-border-radius' },
      { value: '16px', label: 'Icon size', token: '--ui-control-checked-icon-size' },
      { value: '8px', label: 'Label gap', token: '--ui-space-2' },
      { value: '48px', label: 'Touch target', token: '--ui-space-10' },
      { value: '320ms', label: 'Check anim', token: '--ui-checkbox-motion' },
    ],
    states: ['default', 'hover', 'checked', 'focus', 'disabled'],
    features: ['css-only', 'reduced-motion'],
  },

  'radio': {
    specs: [
      { value: '26px', label: 'Circle size', token: '--ui-control-size' },
      { value: '2px', label: 'Border', token: '--ui-control-border-width' },
      { value: '20px', label: 'Dot size' },
      { value: '3px', label: 'Ring width' },
      { value: '8px', label: 'Label gap', token: '--ui-space-2' },
      { value: '48px', label: 'Touch target', token: '--ui-space-10' },
      { value: '320ms', label: 'Check anim', token: '--ui-checkbox-motion' },
    ],
    states: ['default', 'hover', 'checked', 'focus', 'disabled'],
    features: ['css-only', 'reduced-motion'],
  },

  'progress': {
    specs: [
      { value: '14px', label: 'Height', token: '--ui-progress-height' },
      { value: '6px', label: 'Thin', token: '--ui-progress-height-thin' },
      { value: '24px', label: 'Thick', token: '--ui-progress-height-thick' },
      { value: 'pill', label: 'Radius', token: '--ui-progress-radius' },
      { value: '350ms', label: 'Fill anim', token: '--ui-progress-motion' },
    ],
    states: ['determinate', 'indeterminate'],
    features: ['css-only', 'reduced-motion'],
  },


  // -- Feedback ---------------------------------------------------------------

  'toast': {
    specs: [
      { value: '400px', label: 'Max width', token: '--ui-toast-max-width' },
      { value: '12px', label: 'Radius', token: '--ui-toast-radius' },
      { value: '3px', label: 'Border', token: '--ui-toast-border-width' },
      { value: '16px', label: 'Stack gap', token: '--ui-toast-stack-gap' },
      { value: '38px', label: 'Icon size', token: '--ui-toast-icon-size' },
      { value: '6s', label: 'Auto-dismiss' },
      { value: '10', label: 'Max stacked' },
    ],
    states: ['enter', 'visible', 'hover', 'exit'],
    features: ['js-required', 'light-dom'],
  },

  'modal': {
    specs: [
      { value: '18px', label: 'Radius', token: '--ui-modal-radius' },
      { value: '24px', label: 'Padding', token: '--ui-space-6' },
      { value: '480px', label: 'Width S', token: '--ui-modal-max-width-s' },
      { value: '720px', label: 'Width M', token: '--ui-modal-max-width-m' },
      { value: '960px', label: 'Width L', token: '--ui-modal-max-width-l' },
      { value: '200ms', label: 'Enter', token: '--ui-modal-motion-in' },
      { value: '120ms', label: 'Exit', token: '--ui-modal-motion-out' },
    ],
    states: ['closed', 'enter', 'open', 'exit'],
    features: ['js-required', 'focus-trap', 'keyboard', 'light-dom', 'reduced-motion'],
  },

  'spinner': {
    specs: [
      { value: '24px', label: 'Size', token: '--ui-icon-l' },
      { value: 'pink', label: 'Colour', token: '--ui-spinner-color' },
    ],
    states: [],
    features: ['css-only', 'reduced-motion'],
  },

  'screen-border': {
    specs: [
      { value: 'pink', label: 'Colour', token: '--ui-spinner-color' },
      { value: '360ms', label: 'Animation', token: '--ui-motion-slow' },
      { value: '3s', label: 'Auto-hide' },
    ],
    states: ['hidden', 'visible', 'pulsing'],
    features: ['js-required'],
  },

  'skeleton': {
    specs: [
      { value: '16px', label: 'Height', token: '--ui-skeleton-height' },
      { value: '8px', label: 'Radius', token: '--ui-skeleton-radius' },
      { value: '1.5s', label: 'Shimmer', token: '--ui-skeleton-animation-duration' },
      { value: '8px', label: 'XS size' },
      { value: '32px', label: 'XL size' },
    ],
    states: [],
    features: ['css-only', 'reduced-motion'],
  },


  // -- Layout -----------------------------------------------------------------

  'card': {
    specs: [
      { value: '24px', label: 'Padding', token: '--ui-layout-card-padding' },
      { value: '32px', label: 'Radius', token: '--ui-radius-xl' },
    ],
    states: [],
    features: ['css-only'],
  },

  'tab-bar': {
    specs: [
      { value: '48px', label: 'Min height', token: '--ui-space-10' },
      { value: '4px', label: 'Pad', token: '--ui-space-1' },
      { value: '8px 12px', label: 'Tab pad' },
      { value: '4px', label: 'Gap', token: '--ui-space-1' },
      { value: '12px', label: 'Container R', token: '--ui-radius-m' },
      { value: '~14px', label: 'Font', token: '--ui-font-s' },
    ],
    states: ['default', 'hover', 'active', 'focus', 'disabled'],
    features: ['css-only'],
  },

  'card-header': {
    specs: [
      { value: '12px', label: 'Gap', token: '--ui-space-3' },
      { value: '20px', label: 'Margin btm', token: '--ui-space-5' },
      { value: '3\u00d736px', label: 'Accent bar' },
      { value: '~21px', label: 'Title font', token: '--ui-font-xl' },
    ],
    states: [],
    features: ['css-only'],
  },

  'section-header': {
    specs: [
      { value: '12px', label: 'Padding Y', token: '--ui-section-header-padding-y' },
      { value: '4px', label: 'Gap', token: '--ui-section-header-gap' },
      { value: '~12px', label: 'Title font', token: '--ui-section-header-title-size' },
      { value: '500', label: 'Weight', token: '--ui-font-weight-l' },
      { value: '0.5px', label: 'Spacing', token: '--ui-font-letter-spacing-m' },
      { value: '8px', label: 'Margin btm', token: '--ui-space-2' },
    ],
    states: [],
    features: ['css-only'],
  },

  'data-row': {
    specs: [
      { value: '16px', label: 'Gap', token: '--ui-space-4' },
      { value: '8px', label: 'Padding Y', token: '--ui-space-2' },
      { value: '~14px', label: 'Font', token: '--ui-font-s' },
      { value: '120px', label: 'Label min-W' },
      { value: '500', label: 'Label wt' },
    ],
    states: [],
    features: ['css-only'],
  },

  'collapsible': {
    specs: [
      { value: '240ms', label: 'Animation', token: '--ui-motion-med' },
      { value: '20px', label: 'Icon size', token: '--ui-icon-m' },
      { value: '16px', label: 'Padding', token: '--ui-layout-section-gap' },
      { value: '8px', label: 'Gap', token: '--ui-space-2' },
    ],
    states: ['expanded', 'collapsed', 'disabled'],
    features: ['js-required', 'localstorage', 'keyboard', 'reduced-motion'],
  },

  'scrollable': {
    specs: [
      { value: '6px', label: 'Scrollbar W', token: '--ui-scrollbar-width' },
      { value: '8px', label: 'Radius', token: '--ui-radius-s' },
      { value: '2px', label: 'Border', token: '--ui-border-width-m' },
    ],
    states: [],
    features: ['css-only'],
  },

  'surface': {
    specs: [
      { value: '0-4', label: 'Elevation tiers' },
      { value: '0-4', label: 'Shadow levels' },
    ],
    states: [],
    features: ['css-only'],
  },

  'drawer': {
    specs: [
      { value: '288px', label: 'Width' },
      { value: '85%', label: 'Max width' },
      { value: '18px', label: 'Radius', token: '--ui-radius-l' },
      { value: '48px', label: 'Close btn', token: '--ui-space-10' },
      { value: '48px', label: 'Row height', token: '--ui-space-10' },
      { value: '450ms', label: 'Open anim' },
    ],
    states: ['closed', 'open'],
    features: ['js-required', 'reduced-motion'],
  },


  // -- Overlays ---------------------------------------------------------------

  'tooltip': {
    specs: [
      { value: '8px', label: 'Radius', token: '--ui-radius-s' },
      { value: '8px', label: 'Padding X' },
      { value: '4px', label: 'Padding Y' },
      { value: '200px', label: 'Max width' },
      { value: '400ms', label: 'Delay' },
    ],
    states: ['hidden', 'visible'],
    features: ['js-required'],
  },

  'rich-tooltip': {
    specs: [
      { value: '18px', label: 'Radius' },
      { value: '16px', label: 'Padding X' },
      { value: '12px', label: 'Padding Y' },
      { value: '320px', label: 'Max width' },
      { value: '400ms', label: 'Delay' },
    ],
    states: ['hidden', 'hover', 'persistent'],
    features: ['js-required'],
  },

  'menu': {
    specs: [
      { value: '32px', label: 'Radius', token: '--ui-menu-radius' },
      { value: '200px', label: 'Min width', token: '--ui-menu-min-width' },
      { value: '320px', label: 'Max width', token: '--ui-menu-max-width' },
      { value: '320px', label: 'Max height', token: '--ui-menu-max-height' },
      { value: '50px', label: 'Item height', token: '--ui-menu-item-height' },
      { value: '4px', label: 'Offset', token: '--ui-menu-offset' },
    ],
    states: ['default', 'hover', 'selected', 'focus'],
    features: ['css-only'],
  },
};
