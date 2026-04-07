# CLAUDE - UI Catalogue Card

> **Scope:** Interactive development catalogue of all shared UI system components
> **Last reviewed:** 2026-03
> **Read root CLAUDE.md and www/base/docs/CLAUDE.md first for session protocol and UI governance rules**

---

## Summary

A development-time card that renders every component from the shared UI design system in its actual Shadow DOM environment with real `adoptedStyleSheets`. This means demos exactly match how production cards experience the components — not approximations. Used to verify tokens, states, variants, and dark/light mode behaviour.

---

## Structure

| File | Purpose |
|------|---------|
| `ui-catalogue-card.js` | Entry point and card class. Imports all shared UI base modules. Mixes in render/event/demo methods. Owns state. |
| `registry.js` | `COMPONENT_REGISTRY` — single source of truth for all catalogue entries. Exports `getCategories()`, `getComponentsByCategory()`, `getComponentById()`, `searchComponents()`. |
| `render.js` | All rendering methods — catalogue shell, component header, sidebar, variant picker (playground), states grid, usage section with code blocks |
| `events.js` | Event handlers — category/component/variant selection, sidebar toggle, header menu, search, demo-specific interactive wiring (`setupDemoListeners`) |
| `demos.js` | Demo rendering functions — one function per registry entry. Each returns HTML string with interactive playground + states grid. |
| `usage.js` | `COMPONENT_USAGE` — markup examples, JS init, events, and notes per component. Keyed by registry ID. |
| `styles.js` | Card-specific CSS for the catalogue chrome (sidebar, header, playground, states grid, usage code blocks) |
| `constants.js` | `TOOLTIP_CONTENT`, `CATEGORY_TOOLTIPS`, tooltip content for info icons |

---

## Key Components

### Entry Point

`ui-catalogue-card.js` is the card class. It imports all shared UI base modules, mixes in render/event/demo methods via `Object.assign` on the prototype, and owns state.

### Component Registry

`registry.js` holds the `COMPONENT_REGISTRY` — the single source of truth for all catalogue entries. Categories are derived from the registry itself, so new unique category values auto-appear. Each entry has:

```js
{
  id: 'text-input',
  name: 'Text Input',
  category: 'Forms',
  source: 'components.js',
  description: '...',
  status: 'stable',           // 'stable' | 'beta' | 'experimental'
  tags: ['40px height', ...],  // max 3
  variants: ['default', 'textarea'],
  demoFn: 'renderTextInputDemo'
}
```

### Demo Functions

Each demo function in `demos.js` receives the component registry entry and returns an HTML string containing:
1. **Playground** — interactive demo with variant switching chips (via `this.renderPlayground()`)
2. **States grids** — static reference of all states/variants (via `this.renderStatesGrid()`)

Demo functions that switch playground content based on variant use a `playgroundMap` keyed by variant name (see `renderButtonDemo`, `renderTextInputDemo`, `renderCircleSliderDemo`).

### Interactive Demo Wiring

`setupDemoListeners()` in `events.js` is called after every render. It uses a `switch` on `comp.id` to wire up demo-specific interactivity:
- `text-input` — calls `initInputs()` to wire floating labels and clearable buttons
- `slider` — calls `initSliders()` to wire slider dragging
- `switch`, `toggle-button`, `split-button`, `fab` — wire toggle/click handlers
- `collapsible` — wires expand/collapse sections

### All Shared UI Base Modules Must Be Adopted

The card imports and adopts ALL base modules so demos render identically to production:
- `foundation.js` — tokens (side-effect import)
- `components.js` → `uiComponents`
- `toggles.js` → `uiToggles`
- `checkboxes.js` → `uiCheckboxes`
- `radios.js` → `uiRadios`
- `skeletons.js` → `uiSkeletons`
- `drawer.js` → `uiDrawer`
- `number-input.js` → `uiNumberInput`
- `helpers.js` → `applyThemeClass`

If a new base module is added to the UI system, it must also be imported and adopted here.

### Usage Section

`render.js` renders a "Usage" section label above the code/usage block for each component. `usage.js` provides:
- `markup` — HTML code example
- `jsImport` / `jsInit` — JS setup code
- `events` — emitted event names (shown as pills)
- `notes` — freeform usage notes
- `cssOnly` — flag for CSS-only components (no JS pill shown)

### States Grid

`renderStatesGrid()` renders a CSS grid of state preview boxes. Options:
- `{ wide: true }` — wider columns (`minmax(220px, 1fr)`)
- `{ narrow: true }` — narrower columns (`minmax(120px, 1fr)`)
- Per-item: `{ tall: true }` — taller preview, `{ auto: true }` — auto-height with generous padding

---

## Development Workflows

### How to Add a New Component Demo

1. Add an entry to `COMPONENT_REGISTRY` in `registry.js`
2. Add the demo function to `demos.js` with the exact name from `demoFn`
3. Add a usage entry to `COMPONENT_USAGE` in `usage.js`
4. If the demo needs interactivity, add a `case` to `setupDemoListeners()` in `events.js`

**Registry entry without a matching demo function = broken entry.** They must stay in sync.

### How to Add a Variant to an Existing Demo

1. Add the variant string to the `variants` array in the registry entry
2. In the demo function, add a key to the `playgroundMap` for the new variant
3. Add static states to the states grid if appropriate

### Adding a New Base Module

When a new base module is added to the UI system:
1. Import it in `ui-catalogue-card.js`
2. Add it to the `adoptedStyleSheets` array
3. Add relevant registry entries and demo functions for its components

### Testing Changes

1. Verify demos render correctly in both dark and light mode
2. Confirm `adoptedStyleSheets` adoption works after any base module changes
3. Check that new registry entries have matching demo functions (and vice versa)
4. Test variant switching in playground — each variant chip should show different content
5. Test interactive demos — floating labels, sliders, toggles should respond to interaction

---

## Conventions for AI Assistants

### Anti-Patterns

- Don't add a registry entry without a corresponding demo function (or vice versa)
- Don't hardcode colors in demo functions — use token classes from the base system
- Don't add production logic to this card — it is catalogue-only
- Don't remove the `adoptedStyleSheets` adoption step — demos will break silently
- Don't add inline styles to demo HTML where token classes exist
- Don't forget to wire `initInputs()` or `initSliders()` in `setupDemoListeners()` when adding interactive input/slider demos

### Coupling Warnings

**Depends on:**
- ALL `www/base/*.js` files — if any base module changes its export name or API, update the import here
- `www/base/docs/spec.md` — the spec is the authority; demos should reflect what the spec defines
- `www/cards/ui-circle-slider.js` — circle slider web component (imported for side-effects)

**Not consumed by production:**
- This card is development/debug tooling. It should not be referenced from production automations or configurations.

### Cross-References

- Root: `/CLAUDE.md`
- UI governance: `/www/base/docs/CLAUDE.md` (binding constraints for all token usage)
- UI spec: `/www/base/docs/spec.md` (authoritative component definitions)
- Authoring guide: `/www/base/docs/authoring.md`

---

## TODOs & Gaps

- **Drawer registry entry name** — says "Settings Drawer" but drawer is now also used for content viewing (e.g. meeting summary in work-actions-card). Consider renaming to just "Drawer".
- **Demo interactive wiring fragility** — `setupDemoListeners()` uses `switch` on `comp.id` and is called on every render. New interactive demos must remember to add a case or the demo won't respond to user input.

---

## Changelog

| Date | Commit | Change |
|------|--------|--------|
| 2026-03-28 | — | Added textarea/textarea-lg demos and quiet input states to text input demo. Circle slider demo now variant-switches between number/interactive/disabled. Usage section gets "USAGE" label header. Auto-height preview padding increased. Updated registry variants for text-input and circle-slider. |
| 2026-03-23 | — | Added `number-input.js` → `uiNumberInput` to adopted modules list |
| 2026-03-15 | — | Added `drawer.js` to adopted modules list, updated TODOs |
| 2026-02-24 | b350903 | Restructured to 8-section format |

*Last Updated: 2026-03-28*
