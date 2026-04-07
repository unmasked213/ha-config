# HA-UI-System

Token-driven UI design system for my Home Assistant dashboard. All visual values (color, spacing, radius, elevation, motion) derive from `foundation.js` tokens, ensuring theme-adaptive consistency across light and dark modes.

## Project Map

| Area | File | Purpose | Dependencies |
|------|------|---------|--------------|
| Foundation | `foundation.js` | Design tokens — spacing, radii, motion, typography, colours, elevation. Single source of truth for the system. **READ-ONLY.** | None |
| Components | `components.js` | Component styles — buttons, FABs, split buttons, menus, inputs, sliders, progress bars, tab bar, section headers, data rows, badges, card base, scrollable containers, collapsible sections, copy button, loading spinners. Also exports JS for collapsible and clipboard. The main stylesheet. | foundation.js |
| Toggles | `toggles.js` | Toggle switch styles. Separate file because switches have complex state transitions that benefit from isolation. | foundation.js |
| Checkboxes | `checkboxes.js` | Checkbox styles. Separate file because checkboxes have distinct control tokens and animation patterns. | foundation.js |
| Radios | `radios.js` | Radio button styles. Separate file for consistency with checkboxes. | foundation.js |
| Skeletons | `skeletons.js` | Skeleton loading placeholder styles. Shimmer animation with shape and size variants. | foundation.js |
| Tooltips | `tooltips.js` | Tooltip positioning and lifecycle. Separate file because tooltips need runtime logic that CSS alone can't handle. Renders in light DOM — manual sync with foundation.js required. | components.js |
| Helpers | `helpers.js` | Initialises inputs and sliders — floating labels, value bubbles, drag handling. Also exports `applyThemeClass()`, HA helper entity readers (`getHelperNumber`, `getHelperBoolean`, `getHelperSelect`), and `persistHelper()`. | foundation.js |
| Utilities | `utilities.js` | Formats durations, timestamps, numbers, and bytes. Validates entity IDs. Manipulates strings, arrays, and colours. Escapes HTML (`escapeHtml`). | None |
| Templates | `templates.js` | Parses Jinja2-style template strings and resolves them against live HA entity states and attributes. | None |
| Modals | `modals.js` | Modal dialog styles and layout. Exports `showModal(options)` and `closeModal()`. Renders in light DOM. | foundation.js |
| Toasts | `toasts.js` | Toast notification styles. Exports `showToast(options)`, `clearAllToasts()`, `getToastCount()`. | foundation.js |
| Drawer | `drawer.js` | Drawer panel — right-side slide-out with backdrop, header, tabs, groups/rows. Used for settings and contextual content viewers. Exports `uiDrawer` stylesheet + `openDrawer()`/`closeDrawer()` helpers. | foundation.js |
| Number Input | `number-input.js` | Number input — compact numeric stepper pill with expanding chevrons, momentum hold, scroll, inline edit. Custom element `<ui-number-input>`. | foundation.js, helpers.js |
| Screen Border | `screen-border.js` | Screen border utility for visual indicators. | foundation.js |
| Tests | `templates.test.js` | Unit tests for template module. | templates.js |

### Cards

| Location | Contents |
|----------|----------|
| `www/cards/prompt-manager/prompt-manager.js` | Prompt Manager card — entry point (imports modules below) |
| `www/cards/prompt-manager/modules/` | Prompt Manager modules: `render.js`, `events.js`, `styles.js`, `constants.js`, `variables.js`, `scoring.js`, `data.js`, `highlight.js` |
| `www/cards/report-viewer-card/` | Report viewer card (3 files): `report-viewer-card.js` (entry), `markdown-renderer.js`, `SPEC.md`. Uses `drawer.js` for ToC panel, `escapeHtml` from `utilities.js`. |
| `www/cards/ui-catalogue-card/` | UI component catalogue card (8 files): `ui-catalogue-card.js` (entry), `registry.js`, `render.js`, `demos.js`, `events.js`, `styles.js`, `constants.js`, `usage.js` |
| `www/cards/presence-activity-card/` | Presence activity card (4 files): `presence-activity-card.js` (entry), `color-fade.js`, `floor-resolver.js`, `presence-activity-card-v2-context.md` |
| `www/cards/checklist-card/` | Checklist card (1 file): `checklist-card.js` — todo list with animated checkboxes |
| `www/cards/pico-hid-card/` | Pico HID card (1 file): `pico-hid-card.js` — USB HID typing device controller |
| `www/cards/work-actions-card/` | Work actions card (1 file): `work-actions-card.js` — work todo list with completion animations, dropdown menu settings, meeting summary drawer, edit modal, new item indicators, touch interactions |
| `www/cards/specs-card.js`, `specs-card-tabbed.js` | Production cards (migrated to v1) |
| `www/cards/phone-card/` | Phone display card (1 file): `phone-card.js` |
| `www/cards/priority-matrix-card/` | Priority matrix card (5 files): `priority-matrix-card.js` (entry), `render.js`, `events.js`, `styles.js`, `constants.js` — task prioritisation with circle sliders, scoring, FLIP animations |
| `www/cards/ui-circle-slider.js` | Circular slider web component |

## Documentation

| Document | Purpose |
|----------|---------|
| [spec.md](docs/spec.md) | System definition — tokens, components, constraints, invariants, governance |
| [authoring.md](docs/authoring.md) | Component creation — skeleton structure, event patterns, HA integration |
| [CLAUDE.md](docs/CLAUDE.md) | AI briefing — critical invariants, file authority, anti-patterns, decision trees |
| [componentry/tooltips.md](docs/componentry/tooltips.md) | Tooltip exception — light DOM constraint, sync requirements |
| [componentry/screen-border.md](docs/componentry/screen-border.md) | Screen border exception — timing/scale values, color resolution |
| [componentry/clearable-input.md](docs/componentry/clearable-input.md) | Clearable input exception — pop-in animation, clearing pulse timing |
| [componentry/number-input.md](docs/componentry/number-input.md) | Number input component specification — geometry, states, interaction, timing exceptions |

---

*Last Updated: 2026-03-28*
