// ══════════════════════════════════════════════════════════════════════════════
//  CATALOGUE CONSTANTS
//  Tooltip content and category metadata for the UI Catalogue card.
// ══════════════════════════════════════════════════════════════════════════════

const TOOLTIP_CONTENT = {
  cardHeader: {
    title: 'UI Catalogue',
    intro: 'Interactive reference for the shared UI design system. Every component renders in its real Shadow DOM environment with adopted stylesheets.',
    items: [
      { term: 'Categories', desc: 'Components are grouped by role: Controls, Forms, Feedback, Layout, Overlays, and Foundation tokens.' },
      { term: 'Sidebar', desc: 'Lists all components in the active category. The coloured dot shows stability: green = stable, amber = beta, red = deprecated.' },
      { term: 'Playground', desc: 'Each component renders live with variant chips to switch between states.' },
      { term: 'Search', desc: 'Searches across component names, descriptions, and tags.' }
    ]
  }
};

const CATEGORY_TOOLTIPS = {
  Controls: {
    title: 'Controls',
    intro: 'Interactive elements that trigger actions or toggle state.',
    items: [
      { term: 'Buttons', desc: 'Standard, toggle, split, copy, and FAB variants with Material 3 state overlays.' },
      { term: 'Chips', desc: 'Compact selection elements used in filter groups and tab bars.' }
    ]
  },
  Forms: {
    title: 'Forms',
    intro: 'Input elements for capturing user data and selections.',
    items: [
      { term: 'Text inputs', desc: 'Floating-label inputs, textareas, and inline variants.' },
      { term: 'Selection', desc: 'Checkboxes, radios, toggle switches, and sliders.' }
    ]
  },
  Feedback: {
    title: 'Feedback',
    intro: 'Components that communicate status, progress, or results to the user.',
    items: [
      { term: 'Notifications', desc: 'Toast messages, modals, screen border flashes, and spinners.' },
      { term: 'Loading', desc: 'Skeleton placeholders and progress bars for async states.' }
    ]
  },
  Layout: {
    title: 'Layout',
    intro: 'Structural components for organising card content and navigation.',
    items: [
      { term: 'Navigation', desc: 'Tab bars, card headers, and section headers.' },
      { term: 'Structure', desc: 'Collapsible sections, data rows, scrollable containers, and surface/elevation tiers.' }
    ]
  },
  Overlays: {
    title: 'Overlays',
    intro: 'Floating elements that appear above the normal document flow.',
    items: [
      { term: 'Tooltips', desc: 'Plain and rich tooltips with positioning, caret, and persistent modes.' },
      { term: 'Menus', desc: 'Floating dropdown menus with selection state and click-outside dismiss.' }
    ]
  },
  Foundation: {
    title: 'Foundation',
    intro: 'Design tokens that define the visual language shared across all components.',
    items: [
      { term: 'Colours', desc: 'Semantic colour roles, state layers, and category accents for both themes.' },
      { term: 'Scale', desc: 'Spacing, typography, radii, elevation, icon sizes, and motion timing tokens.' }
    ]
  }
};

export { TOOLTIP_CONTENT, CATEGORY_TOOLTIPS };
