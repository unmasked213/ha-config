// ══════════════════════════════════════════════════════════════════════════════
//  COMPONENT REGISTRY
//  Single source of truth for all catalogue entries.
//  Adding a new component = adding one object here + one demo function in demos.js
//
//  Tag taxonomy (max 3 per entry):
//    1. Key dimension or geometry
//    2. Most distinctive behaviour or feature
//    3. Key constraint or technical note
//    Foundation entries: scale/count info + key characteristic
// ══════════════════════════════════════════════════════════════════════════════

export const COMPONENT_REGISTRY = [

  // ── Controls ──────────────────────────────────────────────────────────────

  {
    id: 'button',
    name: 'Button',
    category: 'Controls',
    source: 'components.js',
    description: 'Standard action button with state overlay layer. Accent, danger, outline, muted, and filled styles across three sizes.',
    status: 'stable',
    tags: ['40px height', 'pill radius', 'state overlay'],
    variants: ['default', 'accent', 'accent-filled', 'outline', 'danger', 'danger-filled', 'muted', 'small', 'large', 'icon', 'disabled'],
    demoFn: 'renderButtonDemo'
  },
  {
    id: 'toggle-button',
    name: 'Toggle Button',
    category: 'Controls',
    source: 'components.js',
    description: 'Button that maintains selected/unselected state via .is-selected class.',
    status: 'stable',
    tags: ['40px height', 'is-selected toggle'],
    variants: ['icon-only', 'text-only', 'icon-text'],
    demoFn: 'renderToggleButtonDemo'
  },
  {
    id: 'split-button',
    name: 'Split Button',
    category: 'Controls',
    source: 'components.js',
    description: 'Two-segment button with a primary action and a dropdown arrow for secondary options.',
    status: 'stable',
    tags: ['40px height', 'dropdown menu'],
    variants: ['default', 'toggle', 'open'],
    demoFn: 'renderSplitButtonDemo'
  },
  {
    id: 'copy-button',
    name: 'Copy Button',
    category: 'Controls',
    source: 'components.js',
    description: 'Circular button that copies text to clipboard with success pulse animation.',
    status: 'stable',
    tags: ['48px touch target', 'clipboard API'],
    variants: ['default', 'copied'],
    demoFn: 'renderCopyButtonDemo'
  },
  {
    id: 'fab',
    name: 'FAB',
    category: 'Controls',
    source: 'components.js',
    description: 'Floating Action Button in small, regular, and extended variants. Supports FAB menu.',
    status: 'stable',
    tags: ['56px default', 'elevated', 'optional menu'],
    variants: ['small', 'regular', 'extended', 'menu'],
    demoFn: 'renderFabDemo'
  },
  {
    id: 'chip',
    name: 'Chip',
    category: 'Controls',
    source: 'components.js',
    description: 'Compact selection element used in tab bars and filter groups.',
    status: 'stable',
    tags: ['32px height', 'pill radius'],
    variants: ['default', 'selected'],
    demoFn: 'renderChipDemo'
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'Controls',
    source: 'components.js',
    description: 'Inline label for status, category, or metadata. Tonal fill with semantic colour variants and optional dot.',
    status: 'stable',
    tags: ['22px height', 'semantic colours', 'optional dot'],
    variants: ['semantic', 'custom-colour', 'pill', 'with-dot'],
    demoFn: 'renderBadgeDemo'
  },


  // ── Forms ─────────────────────────────────────────────────────────────────

  {
    id: 'text-input',
    name: 'Text Input',
    category: 'Forms',
    source: 'components.js',
    description: 'Text input with animated floating label. Supports clearable, textarea, and inline variants.',
    status: 'stable',
    tags: ['40px height', 'floating label', 'clearable variant'],
    variants: ['default', 'textarea'],
    demoFn: 'renderTextInputDemo'
  },
  {
    id: 'slider',
    name: 'Slider',
    category: 'Forms',
    source: 'components.js',
    description: 'Range slider with value bubble, drag performance optimisation, and vertical variant.',
    status: 'stable',
    tags: ['24px track', 'value bubble', 'rollback animation'],
    variants: ['horizontal', 'vertical'],
    demoFn: 'renderSliderDemo'
  },
  {
    id: 'circle-slider',
    name: 'Circle Slider',
    category: 'Forms',
    source: 'base/circle-slider.js',
    description: 'Circular slider custom element with number (drag-only) and interactive (tap + drag) modes.',
    status: 'stable',
    tags: ['custom element', 'radial input', 'interactive tap mode'],
    variants: ['number', 'interactive', 'disabled'],
    demoFn: 'renderCircleSliderDemo'
  },
  {
    id: 'number-input',
    name: 'Number Input',
    category: 'Forms',
    source: 'number-input.js',
    description: 'Compact numeric stepper with expanding pill, momentum hold, scroll, and inline edit.',
    status: 'stable',
    tags: ['48px touch target', 'momentum hold', 'inline edit'],
    variants: ['default', 'disabled', 'small-range', 'large-range'],
    demoFn: 'renderNumberInputDemo'
  },
  {
    id: 'switch',
    name: 'Toggle Switch',
    category: 'Forms',
    source: 'toggles.js',
    description: 'Toggle switch with animated thumb scaling. Standard and icon variants.',
    status: 'stable',
    tags: ['48\u00d732px track', 'wobble animation', 'CSS-only'],
    variants: ['standard-off', 'standard-on', 'icon-off', 'icon-on', 'disabled-off', 'disabled-on'],
    demoFn: 'renderSwitchDemo'
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'Forms',
    source: 'checkboxes.js',
    description: 'Labelled checkbox with animated checkmark stroke and accent fill. Supports disabled state. CSS-only, no JS init.',
    status: 'stable',
    tags: ['26px box', 'animated stroke', 'CSS-only'],
    variants: ['unchecked', 'checked', 'disabled-off', 'disabled-on'],
    demoFn: 'renderCheckboxDemo'
  },
  {
    id: 'radio',
    name: 'Radio',
    category: 'Forms',
    source: 'radios.js',
    description: 'Radio button group with vertical and horizontal layout variants.',
    status: 'stable',
    tags: ['26px circle', 'group container', 'CSS-only'],
    variants: ['vertical', 'horizontal', 'disabled'],
    demoFn: 'renderRadioDemo'
  },
  {
    id: 'progress',
    name: 'Progress Bar',
    category: 'Forms',
    source: 'components.js',
    description: 'Determinate and indeterminate progress bars with size and colour variants.',
    status: 'stable',
    tags: ['14px default', 'indeterminate mode', '3 sizes'],
    variants: ['default', 'thin', 'thick', 'indeterminate', 'success', 'warning', 'error'],
    demoFn: 'renderProgressDemo'
  },


  // ── Feedback ──────────────────────────────────────────────────────────────

  {
    id: 'toast',
    name: 'Toast',
    category: 'Feedback',
    source: 'toasts.js',
    description: 'Notification toast that stacks from bottom-right with auto-dismiss and hover-pause.',
    status: 'stable',
    tags: ['auto-dismiss 6s', 'stacks to 10', 'hover-pause'],
    variants: ['basic', 'with-icon'],
    demoFn: 'renderToastDemo'
  },
  {
    id: 'modal',
    name: 'Modal',
    category: 'Feedback',
    source: 'modals.js',
    description: 'Centered dialog with backdrop blur, focus trap, and size variants.',
    status: 'stable',
    tags: ['3 sizes', 'focus trap', 'backdrop blur'],
    variants: ['basic', 'with-buttons', 'small', 'medium', 'large'],
    demoFn: 'renderModalDemo'
  },
  {
    id: 'spinner',
    name: 'Spinner',
    category: 'Feedback',
    source: 'components.js',
    description: 'Animated loading indicator. Use standalone or swap into a button during async operations. CSS-only.',
    status: 'stable',
    tags: ['CSS-only', 'inline or standalone'],
    variants: ['default', 'in-button'],
    demoFn: 'renderSpinnerDemo'
  },
  {
    id: 'screen-border',
    name: 'Screen Border',
    category: 'Feedback',
    source: 'screen-border.js',
    description: 'Full-screen animated border flash for attention-grabbing feedback.',
    status: 'stable',
    tags: ['SVG overlay', 'sidebar-aware'],
    variants: [],
    demoFn: 'renderScreenBorderDemo'
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'Feedback',
    source: 'skeletons.js',
    description: 'Placeholder loading elements with shimmer animation. Text, circle, rectangle, and square shapes in five sizes.',
    status: 'stable',
    tags: ['shimmer animation', '5 sizes', 'reduced-motion aware'],
    variants: ['text', 'circle', 'rect', 'square', 'sizes', 'group', 'row'],
    demoFn: 'renderSkeletonDemo'
  },


  // ── Layout ────────────────────────────────────────────────────────────────

  {
    id: 'card',
    name: 'Card',
    category: 'Layout',
    source: 'components.js',
    description: 'Top-level card container with padding, elevated background, and rounded corners. The shell that wraps all card content.',
    status: 'stable',
    tags: ['xl radius', 'surface background'],
    variants: [],
    demoFn: 'renderCardDemo'
  },
  {
    id: 'tab-bar',
    name: 'Tab Bar',
    category: 'Layout',
    source: 'components.js',
    description: 'Horizontal tab strip with standard, pill, and coloured variants.',
    status: 'stable',
    tags: ['pill variant', 'coloured variant'],
    variants: ['standard', 'pill', 'colored'],
    demoFn: 'renderTabBarDemo'
  },
  {
    id: 'card-header',
    name: 'Card Header',
    category: 'Layout',
    source: 'components.js',
    description: 'Card title bar with coloured accent stripe and title. Slots for inline actions and info icons.',
    status: 'stable',
    tags: ['3px accent stripe', 'actions slot'],
    variants: [],
    demoFn: 'renderCardHeaderDemo'
  },
  {
    id: 'section-header',
    name: 'Section Header',
    category: 'Layout',
    source: 'components.js',
    description: 'Section divider with optional border and actions slot.',
    status: 'stable',
    tags: ['uppercase label', 'actions slot', 'bordered variant'],
    variants: ['default', 'bordered', 'compact', 'with-actions'],
    demoFn: 'renderSectionHeaderDemo'
  },
  {
    id: 'data-row',
    name: 'Data Row',
    category: 'Layout',
    source: 'components.js',
    description: 'Label-value pair layout with multiple density and styling variants.',
    status: 'stable',
    tags: ['label-value pair', '7 density variants'],
    variants: ['default', 'compact', 'stacked', 'emphasized', 'mono', 'bordered', 'relaxed'],
    demoFn: 'renderDataRowDemo'
  },
  {
    id: 'collapsible',
    name: 'Collapsible Section',
    category: 'Layout',
    source: 'components.js',
    description: 'Expandable/collapsible content section with localStorage persistence and staggered animation.',
    status: 'stable',
    tags: ['localStorage persist', 'staggered animation', 'keyboard accessible'],
    variants: ['expanded', 'collapsed', 'toggle-all'],
    demoFn: 'renderCollapsibleDemo'
  },
  {
    id: 'scrollable',
    name: 'Scrollable Container',
    category: 'Layout',
    source: 'components.js',
    description: 'Themed scrollbar container with vertical, horizontal, compact, and hidden variants.',
    status: 'stable',
    tags: ['themed scrollbar', '4 variants'],
    variants: ['vertical', 'horizontal', 'compact', 'hidden'],
    demoFn: 'renderScrollableDemo'
  },
  {
    id: 'surface',
    name: 'Surface & Elevation',
    category: 'Layout',
    source: 'components.js',
    description: 'Five background elevation tiers and five shadow depth levels. Tokens for layered UI composition.',
    status: 'stable',
    tags: ['5 elevation tiers', '5 shadow levels'],
    variants: ['surfaces', 'shadows'],
    demoFn: 'renderSurfaceDemo'
  },


  {
    id: 'drawer',
    name: 'Drawer',
    category: 'Layout',
    source: 'drawer.js',
    description: 'Right-side slide-out panel with backdrop, FAB trigger, header, scrollable content, and optional tabs.',
    status: 'stable',
    tags: ['288px width', 'elastic animation', 'optional tabs'],
    variants: ['closed', 'open', 'with-tabs'],
    demoFn: 'renderDrawerDemo'
  },


  // ── Overlays ──────────────────────────────────────────────────────────────

  {
    id: 'tooltip',
    name: 'Tooltip',
    category: 'Overlays',
    source: 'tooltips.js',
    description: 'Plain tooltip with position, caret, and delay options. Supports keyboard and data-attribute patterns.',
    status: 'stable',
    tags: ['400ms delay', 'auto-reposition', 'caret option'],
    variants: ['top', 'bottom', 'left', 'right', 'caret', 'custom-delay'],
    demoFn: 'renderTooltipDemo'
  },
  {
    id: 'rich-tooltip',
    name: 'Rich Tooltip',
    category: 'Overlays',
    source: 'tooltips.js',
    description: 'Rich tooltip with title, body, persistent mode, and action button support.',
    status: 'stable',
    tags: ['click-persistent', 'title + body', 'action button'],
    variants: ['hover', 'persistent', 'with-action'],
    demoFn: 'renderRichTooltipDemo'
  },
  {
    id: 'menu',
    name: 'Menu',
    category: 'Overlays',
    source: 'components.js',
    description: 'Floating menu with scrollable items, selection state, and click-outside dismiss.',
    status: 'stable',
    tags: ['32px radius', 'click-outside dismiss', 'selection state'],
    variants: ['default', 'with-selected'],
    demoFn: 'renderMenuDemo'
  },


  // ── Foundation ────────────────────────────────────────────────────────────

  {
    id: 'colours',
    name: 'Colour Palette',
    category: 'Foundation',
    source: 'foundation.js',
    description: 'Complete colour token palette across both themes. Foundational tokens shown first, component-specific tokens in a collapsible section.',
    status: 'stable',
    tags: ['light + dark', 'semantic roles', 'soft/faint variants'],
    variants: [],
    demoFn: 'renderColoursDemo'
  },
  {
    id: 'spacing',
    name: 'Spacing',
    category: 'Foundation',
    source: 'foundation.js',
    description: '4px-grid spacing scale from space-1 (4px) to space-10 (48px).',
    status: 'stable',
    tags: ['4px grid', '10 steps'],
    variants: [],
    demoFn: 'renderSpacingDemo'
  },
  {
    id: 'typography',
    name: 'Typography',
    category: 'Foundation',
    source: 'foundation.js',
    description: 'Font sizes, weights, line heights, and letter spacing tokens.',
    status: 'stable',
    tags: ['5 sizes', '3 weights', '3 line heights'],
    variants: [],
    demoFn: 'renderTypographyDemo'
  },
  {
    id: 'radii',
    name: 'Radii',
    category: 'Foundation',
    source: 'foundation.js',
    description: 'Border radius scale from 8px to pill (999px).',
    status: 'stable',
    tags: ['5 values', '8px to 999px'],
    variants: [],
    demoFn: 'renderRadiiDemo'
  },
  {
    id: 'motion',
    name: 'Motion',
    category: 'Foundation',
    source: 'foundation.js',
    description: 'Timing tokens for fast (120ms), medium (240ms), and slow (360ms) transitions.',
    status: 'stable',
    tags: ['3 speed tiers', '12 component-specific'],
    variants: [],
    demoFn: 'renderMotionDemo'
  },
  {
    id: 'animation',
    name: 'Animation',
    category: 'Foundation',
    source: 'components.js',
    description: 'Shared keyframes for entrance, interaction, and ambient animations with parameterised custom properties.',
    status: 'stable',
    tags: ['10 keyframes', 'reduced-motion aware', 'parameterised'],
    variants: [],
    demoFn: 'renderAnimationDemo'
  },
  {
    id: 'elevation',
    name: 'Elevation & Shadows',
    category: 'Foundation',
    source: 'foundation.js',
    description: 'Five elevation background tiers and five shadow depth levels.',
    status: 'stable',
    tags: ['0\u20134 scale', 'backgrounds + shadows'],
    variants: [],
    demoFn: 'renderElevationDemo'
  },
  {
    id: 'icons',
    name: 'Icons',
    category: 'Foundation',
    source: 'foundation.js',
    description: 'Icon size scale from xs (14px) to l (24px).',
    status: 'stable',
    tags: ['4 sizes', '14px to 24px'],
    variants: [],
    demoFn: 'renderIconsDemo'
  },
  {
    id: 'utilities',
    name: 'Utility Classes',
    category: 'Foundation',
    source: 'foundation.js',
    description: 'Text colour overrides and surface background utilities. Apply directly to elements for semantic colour without custom CSS.',
    status: 'stable',
    tags: ['5 text colours', '5 surface tiers'],
    variants: [],
    demoFn: 'renderUtilitiesDemo'
  }
];


// ── Derived helpers ─────────────────────────────────────────────────────────

export const CATEGORY_ORDER = ['Controls', 'Forms', 'Feedback', 'Layout', 'Overlays', 'Foundation'];

export function getCategories() {
  return CATEGORY_ORDER.filter(c =>
    COMPONENT_REGISTRY.some(comp => comp.category === c)
  );
}

export function getComponentsByCategory(category) {
  return COMPONENT_REGISTRY.filter(c => c.category === category);
}

export function getComponentById(id) {
  return COMPONENT_REGISTRY.find(c => c.id === id);
}

export function searchComponents(term) {
  const lower = term.toLowerCase();
  return COMPONENT_REGISTRY.filter(c =>
    c.name.toLowerCase().includes(lower) ||
    c.description.toLowerCase().includes(lower) ||
    c.tags.some(t => t.toLowerCase().includes(lower)) ||
    c.id.toLowerCase().includes(lower)
  );
}
