# Component Authoring Guide

## 1. Objective

This guide defines the mandatory patterns, flows, and constraints for building components in the Shared UI Design System. Every component must behave like a predictable state machine: explicit inputs, explicit states, explicit geometry, explicit outputs. Nothing implicit. Nothing ad-hoc. Components must function identically inside and outside Home Assistant.

---

## 2. Component Skeleton

```javascript
// /config/www/base/my-component.js
import '/local/base/foundation.js';
import { applyThemeClass } from '/local/base/helpers.js';

// Construct component-specific stylesheet
const componentStyles = new CSSStyleSheet();
componentStyles.replaceSync(`
  .ui-component {
    position: relative;
    padding: var(--ui-space-2) var(--ui-space-5);
    border-radius: var(--ui-radius-pill);
    background: var(--ui-surface);
    color: var(--ui-text);
    transition: background var(--ui-motion-fast);
  }

  /* State overlay */
  .ui-component::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--ui-text);
    opacity: 0;
    transition: opacity var(--ui-motion-fast);
    pointer-events: none;
  }

  .ui-component:hover::before {
    opacity: 0.06; /* Matches --ui-state-hover alpha (light theme) */
  }

  .ui-component:active::before {
    opacity: 0.12; /* Matches --ui-state-pressed alpha (light theme) */
  }

  .ui-component:focus-visible {
    outline: 2px solid var(--ui-state-focus-ring);
    outline-offset: 2px;
  }

  .ui-component.is-disabled {
    opacity: var(--ui-state-disabled-opacity);
    pointer-events: none;
  }

  .ui-component--primary {
    background: var(--ui-accent);
    color: var(--ui-text-on-accent);
  }

  .ui-component--primary::before {
    background: var(--ui-text-on-accent);
  }
`);

class UIComponentName extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Internal state
    this._variant = 'default';
    this._disabled = false;

    // Handler storage for cleanup
    this._handlers = new Map();
  }

  static get observedAttributes() {
    return ['variant', 'disabled'];
  }

  connectedCallback() {
    this.shadowRoot.adoptedStyleSheets = [window.uiFoundation, componentStyles];
    this.render();
    this.attachEvents();
  }

  disconnectedCallback() {
    this.detachEvents();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'variant':
        this._variant = newValue || 'default';
        break;
      case 'disabled':
        this._disabled = newValue !== null;
        break;
    }

    if (this.isConnected) {
      this.updateVisuals();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div class="ui-component" tabindex="0" role="button">
        <span class="ui-component-content">
          <slot></slot>
        </span>
      </div>
    `;
    this.updateVisuals();
  }

  attachEvents() {
    const root = this.shadowRoot.querySelector('.ui-component');

    const clickHandler = (e) => this._handleClick(e);
    const keydownHandler = (e) => this._handleKeydown(e);

    root.addEventListener('click', clickHandler);
    root.addEventListener('keydown', keydownHandler);

    this._handlers.set('click', { element: root, handler: clickHandler });
    this._handlers.set('keydown', { element: root, handler: keydownHandler });
  }

  detachEvents() {
    this._handlers.forEach(({ element, handler }, eventType) => {
      element.removeEventListener(eventType, handler);
    });
    this._handlers.clear();
  }

  _handleClick(e) {
    if (this._disabled) return;

    this.dispatchEvent(new CustomEvent('ui-action', {
      bubbles: true,
      composed: true,
      detail: { variant: this._variant }
    }));
  }

  _handleKeydown(e) {
    if (this._disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._handleClick(e);
    }
  }

  updateVisuals() {
    const root = this.shadowRoot.querySelector('.ui-component');
    if (!root) return;

    root.className = 'ui-component';
    root.classList.add(`ui-component--${this._variant}`);
    root.classList.toggle('is-disabled', this._disabled);
    root.setAttribute('aria-disabled', String(this._disabled));
  }
}

customElements.define('ui-component-name', UIComponentName);
```

### Home Assistant Card Integration

For cards that integrate with Home Assistant, add the `hass` setter to apply theme classes:

```javascript
class MyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = null;
  }

  setConfig(config) {
    this._config = config;
    if (this._hass) this.render();
  }

  set hass(hass) {
    this._hass = hass;
    applyThemeClass(this, hass);  // REQUIRED: Syncs theme with HA
    if (this._config) this.render();
  }

  connectedCallback() {
    this.shadowRoot.adoptedStyleSheets = [window.uiFoundation, componentStyles];
  }

  // ...
}
```

The `applyThemeClass()` helper reads `hass.themes.darkMode` and applies `.dark-theme` or `.light-theme` class to the card element. This triggers the corresponding `:host(.dark-theme)` or `:host(.light-theme)` selectors in foundation.js.

---

## 3. Attribute-State-DOM Flow

**Rule:** Attributes are the external API. Internal state variables store normalized values. `updateVisuals()` applies state to DOM classes and properties.

**Flow:**

1. Attribute set via HTML or JavaScript (`<ui-button variant="primary">`)
2. `attributeChangedCallback` fires, updates internal `_variant` state
3. `updateVisuals()` called, applies `ui-button--primary` class to root element
4. No direct DOM mutation outside `render()` or `updateVisuals()`

**Example:**

```javascript
// Attribute → State
attributeChangedCallback(name, oldValue, newValue) {
  if (name === 'variant') {
    this._variant = newValue || 'default';
    if (this.isConnected) this.updateVisuals();
  }
}

// State → DOM
updateVisuals() {
  const button = this.shadowRoot.querySelector('.ui-button');
  button.className = 'ui-button';
  button.classList.add(`ui-button--${this._variant}`);
}
```

**Invariants:**

- Never mutate DOM directly in `attributeChangedCallback`
- Never read attributes inside `updateVisuals`—read internal state only
- `updateVisuals()` must be idempotent—calling it multiple times produces identical results

---

## 4. Events

**Naming pattern:** `ui-{action}` where action describes user intent, not implementation.

**Payload structure:** `detail` object containing only state relevant to the event. No DOM references, no internal flags.

**Required properties:**

```javascript
{
  bubbles: true,    // Always
  composed: true,   // Always—required to cross shadow boundaries
  detail: { ... }   // Event-specific payload
}
```

**Examples:**

```javascript
// Menu selection
this.dispatchEvent(new CustomEvent('ui-select', {
  bubbles: true,
  composed: true,
  detail: { value: itemValue, label: itemLabel }
}));

// Slider value change (committed)
this.dispatchEvent(new CustomEvent('ui-change', {
  bubbles: true,
  composed: true,
  detail: { value: this._value, percentage: this._percentage }
}));

// Slider live value during drag (uncommitted)
this.dispatchEvent(new CustomEvent('ui-input', {
  bubbles: true,
  composed: true,
  detail: { value: this._value, dragging: true }
}));

// Quick tap intent (e.g. toggle)
this.dispatchEvent(new CustomEvent('ui-tap', {
  bubbles: true,
  composed: true,
  detail: { action: 'toggle' }
}));

// Toggle state change
this.dispatchEvent(new CustomEvent('ui-toggle', {
  bubbles: true,
  composed: true,
  detail: { checked: this._checked }
}));
```

**Prohibited event names:** `ui-click`, `ui-pressed`, `ui-thumb-drag`, `ui-internal-update`—these expose implementation, not intent.

---

## 5. Token Usage

### Stylesheet Construction

```javascript
const componentStyles = new CSSStyleSheet();
componentStyles.replaceSync(`
  /* Component styles using tokens only */
`);
```

### Spacing

```css
.ui-button {
  padding: var(--ui-space-2) var(--ui-space-5);
  gap: var(--ui-space-2);
}

.ui-card {
  padding: var(--ui-layout-card-padding);
}
```

### Color

```css
.ui-button--primary {
  background: var(--ui-accent);
  color: var(--ui-text-on-accent);
}

.ui-surface {
  background: var(--ui-surface);
  color: var(--ui-text);
}
```

### State Overlays

The unified state model requires pseudo-element overlays, not direct background changes:

```css
.ui-button {
  position: relative;
}

.ui-button::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--ui-text);
  opacity: 0;
  transition: opacity var(--ui-motion-fast);
  pointer-events: none;
}

/* State layer opacities match --ui-state-* token alpha values (light theme shown) */
/* Dark theme uses higher values: hover 8%, pressed 16%, active 20% */
.ui-button:hover::before {
  opacity: 0.06;
}

.ui-button:active::before {
  opacity: 0.12;
}

.ui-button.is-active::before {
  opacity: 0.16;
}

/* For accent backgrounds, overlay uses contrasting color */
.ui-button--primary::before {
  background: var(--ui-text-on-accent);
}
```

### Focus Ring

```css
.ui-button:focus-visible {
  outline: 2px solid var(--ui-state-focus-ring);
  outline-offset: 2px;
}
```

### Motion

```css
.ui-menu {
  transition: opacity var(--ui-motion-fast),
              transform var(--ui-motion-fast);
}

.ui-modal {
  animation: ui-modal-in var(--ui-modal-motion-in) both;  /* 200ms decelerate */
}
.ui-modal-backdrop.is-exiting .ui-modal {
  transition: transform var(--ui-modal-motion-out),        /* 120ms ease-in */
              opacity var(--ui-modal-motion-out);
}
```

### Radius

```css
.ui-button {
  border-radius: var(--ui-radius-pill);
}

.ui-card {
  border-radius: var(--ui-radius-m);
}

.ui-menu {
  border-radius: var(--ui-menu-radius);
}
```

### Elevation

```css
.ui-menu {
  background: var(--ui-elevated-2);
  box-shadow: var(--ui-shadow-2);
}

.ui-modal {
  background: var(--ui-elevated-3);
  box-shadow: var(--ui-shadow-4);
}
```

### JavaScript Access

```javascript
const spacing = getComputedStyle(this).getPropertyValue('--ui-space-4').trim();
const accentColor = getComputedStyle(this).getPropertyValue('--ui-accent').trim();
```

**Zero hardcoded values.** If a token doesn't exist, select nearest defined token and document the gap—never invent custom values.

---

## 6. DOM Structure

**Root container:** Single top-level element with component-specific class.

**Class naming:**

| Type | Pattern | Example |
|------|---------|---------|
| Component root | `.ui-{component}` | `.ui-btn` |
| Sub-elements | `.ui-{component}__{element}` | `.ui-btn__icon` |
| Variants | `.ui-{component}--{variant}` | `.ui-btn--accent` |
| States | `.is-{state}` | `.is-active`, `.is-disabled` |

**Example:**

```html
<div class="ui-split ui-split--open is-disabled">
  <button class="ui-split__main">
    <span class="ui-split__label">Action</span>
  </button>
  <button class="ui-split__arrow">
    <svg class="ui-split__icon">...</svg>
  </button>
</div>
```

**Prohibitions:**

- No loose `<div>` elements without semantic class names
- No generic utility classes (`flex`, `gap-2`, `text-primary`)
- No inline styles
- No `style` attributes
- No improvised state indicators (`data-active="true"` when `.is-active` exists)

**Rule:** Root element receives variant and state classes. Child elements have static structural classes only.

---

## 7. Home Assistant Integration

### Import Paths

```javascript
import '/local/base/foundation.js';
import { uiComponents, initCollapsibleSections, toggleAllSections, copyToClipboard, handleCopyButton } from '/local/base/components.js';
import { uiToggles } from '/local/base/toggles.js';
import { uiCheckboxes } from '/local/base/checkboxes.js';
import { uiRadios } from '/local/base/radios.js';
import { uiSkeletons } from '/local/base/skeletons.js';
import { uiDrawer, openDrawer, closeDrawer } from '/local/base/drawer.js';
import { showModal, closeModal } from '/local/base/modals.js';
import { showToast, clearAllToasts, getToastCount } from '/local/base/toasts.js';
import { uiNumberInput } from '/local/base/number-input.js';
import { initInputs, initSliders, applyThemeClass, callService, sleep, getHelperNumber, getHelperBoolean, getHelperSelect, persistHelper } from '/local/base/helpers.js';
import { escapeHtml } from '/local/base/utilities.js';
```

All imports use `/local/base/` prefix. Home Assistant maps this to the `www/` directory.

**Common stylesheet adoption pattern:**
```javascript
this.shadowRoot.adoptedStyleSheets = [
  window.uiFoundation,  // Tokens and reset (always first)
  uiComponents,         // Shared component styles
  uiToggles,            // If using toggle switches
  uiDrawer,             // If using settings drawer
  cardStyles            // Card-specific styles (always last)
];
```

### adoptedStyleSheets

```javascript
connectedCallback() {
  this.shadowRoot.adoptedStyleSheets = [window.uiFoundation, componentStyles];
  this.render();
}
```

`window.uiFoundation` provides tokens and reset. Component-specific `componentStyles` is a `CSSStyleSheet` constructed via `replaceSync()`.

### Shared JS APIs

`components.js` exports runtime JavaScript alongside stylesheets:

```javascript
// Collapsible sections — call after render to wire up expand/collapse
import { initCollapsibleSections, toggleAllSections } from '/local/base/components.js';

// In connectedCallback or after render:
initCollapsibleSections(this.shadowRoot);  // Wires headers, localStorage persistence, keyboard

// Batch expand/collapse all sections:
toggleAllSections(this.shadowRoot, true);   // expand all
toggleAllSections(this.shadowRoot, false);  // collapse all
```

```javascript
// Clipboard — copy text with visual feedback
import { copyToClipboard, handleCopyButton } from '/local/base/components.js';

// Programmatic copy (returns Promise<boolean>):
await copyToClipboard('text to copy');

// Wire a copy button with automatic visual feedback:
handleCopyButton(buttonElement, 'text to copy');
// Button shows success state (checkmark, elevated) for 3s then resets
```

### Modals

`modals.js` exports functions for displaying modal dialogs. Modals render in light DOM (`document.body`).

```javascript
import { showModal, closeModal } from '/local/base/modals.js';

// Show a modal with title, body, and optional footer buttons:
showModal({
  title: 'Confirm Action',
  body: '<p>Are you sure?</p>',
  buttons: [
    { label: 'Cancel', variant: 'outline', action: () => closeModal() },
    { label: 'Confirm', variant: 'accent', action: () => { /* ... */ closeModal(); } }
  ]
});

// Programmatically close the active modal:
closeModal();
```

### Toasts

`toasts.js` exports functions for toast notifications. Toasts stack from bottom-right.

```javascript
import { showToast, clearAllToasts, getToastCount } from '/local/base/toasts.js';

// Show a toast notification:
showToast({ message: 'Settings saved', duration: 4000 });

// Clear all visible toasts:
clearAllToasts();

// Get the current number of visible toasts:
const count = getToastCount();
```

### Exposing State to Card Configs

```javascript
setConfig(config) {
  this._config = config;
  this._variant = config.variant || 'default';
  this._label = config.label || '';
  if (this.isConnected) this.updateVisuals();
}
```

Card configuration flows through `setConfig()`. Attributes and config both update internal state. `updateVisuals()` handles all sources uniformly.

### Update Triggers via hass

```javascript
set hass(hass) {
  this._hass = hass;
  const entityId = this._config.entity;
  const state = hass.states[entityId];

  if (state && this._lastState !== state.state) {
    this._lastState = state.state;
    this.updateVisuals();
  }
}
```

HA calls `set hass()` on state changes. Compare previous state, update internal properties, call `updateVisuals()`. **Never trigger full `render()` on hass updates.**

### Card Size

```javascript
getCardSize() {
  return 2; // Height units for Lovelace layout
}
```

---

## 8. Traps

- **Split rendering:** Never partially update DOM in multiple methods. `render()` creates structure once, `updateVisuals()` applies state. No mutations elsewhere.

- **Stray DOM references:** Never store `querySelector` results in class properties. Query on-demand in methods or cache during `render()` with cleanup in `disconnectedCallback`.

- **Inline magic numbers:** `padding: 8px` is forbidden. `padding: var(--ui-space-2)` is required. Every numeric value must trace to a token.

- **Timing assumptions:** Transitions and animations must account for `prefers-reduced-motion`. Layout-dependent measurements require `requestAnimationFrame` or `ResizeObserver`, not hardcoded delays.

- **Invented event names:** `ui-click`, `ui-pressed`, `ui-activated` are all wrong for the same user action. Follow existing patterns: buttons use `ui-action`, menus use `ui-select`, sliders use `ui-change` (committed) / `ui-input` (live during drag) / `ui-tap` (quick tap intent).

- **Duplicated cross-component logic:** Ripple effects, focus management, disabled state handling—if two components need it, extract to `helpers.js` or `utilities.js`. Never copy-paste behavior.

- **Direct theme checks:** Never check `document.body.classList.contains('dark-theme')`. Use theme-adaptive tokens. The token system handles theme switching.

- **Missing focus handling:** Every interactive element must have `:focus-visible` styling using `--ui-state-focus-ring`. Keyboard users must see focus state.

---

## 9. Required Patterns

- **Stylesheet adoption:** `adoptedStyleSheets = [window.uiFoundation, componentStyles]` in `connectedCallback()`. Never inject `<style>` tags.

- **Handler binding and cleanup:** Store bound handlers in `_handlers` Map. Attach in `attachEvents()`, remove in `detachEvents()`, clear Map in `disconnectedCallback()`.

- **updateVisuals for declarative updates:** State changes call `updateVisuals()`. This method idempotently applies current state to DOM. No incremental mutations.

- **Attribute reflection:** All public configuration exposed as attributes. `observedAttributes` lists them, `attributeChangedCallback` normalizes to internal state.

- **Token-only geometry:** Component dimensions derive from tokens. Buttons use `--ui-space-2` and `--ui-space-5` for padding. Inputs use `--ui-input-height`. Switches use `--ui-switch-track-width`. No custom sizing.

- **State model consistency:** Hover, pressed, active, focus, disabled use `::before` pseudo-element overlays with opacity matching `--ui-state-*` token alpha values. No custom opacity or overlay values.

- **Focus ring via token:** `:focus-visible` styling uses `outline: 2px solid var(--ui-state-focus-ring)` with `outline-offset: 2px`.

- **Keyboard accessibility:** Interactive elements handle `Enter` and `Space` keys. Use appropriate ARIA attributes (`role`, `aria-disabled`, `aria-expanded`).

---

## 10. Verification Checklist

Before considering a component complete:

| Check | Requirement |
|-------|-------------|
| ☐ Zero hardcoded values | Every color, spacing, radius, timing, and dimension traces to a token in `foundation.js` or component tokens |
| ☐ Event handlers cleaned up | All listeners added in `attachEvents()` removed in `disconnectedCallback()` |
| ☐ Both themes tested | Component renders correctly in both light and dark contexts |
| ☐ Touch targets ≥48px | All interactive elements meet minimum touch target size (measure rendered elements) |
| ☐ updateVisuals is pure | Method reads internal state, applies to DOM, triggers no side effects, can be called multiple times safely |
| ☐ Focus ring implemented | `:focus-visible` styling present using `--ui-state-focus-ring` token |
| ☐ Keyboard accessible | `Enter`/`Space` handling for button-like elements, appropriate ARIA attributes |
| ☐ No toolkit patterns | Zero traces of Bootstrap, Material UI, Tailwind, or other framework patterns |
