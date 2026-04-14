# Tooltip Exception Documentation

This document covers architectural constraints specific to the tooltip system that cannot be expressed in the standard spec format. For tooltip specifications (geometry, tokens, behavior), see `spec.md` section 6.11.

---

## Light DOM Constraint

Tooltips render in the light DOM (`document.body`) rather than within shadow DOM. This ensures tooltips display correctly above all other content regardless of shadow boundary nesting.

**Consequence:** Shadow DOM custom properties are not accessible from light DOM elements.

Because of this, the `TOOLTIP_STYLES` constant in `tooltips.js` includes fallback values for all CSS custom properties. These fallbacks duplicate the token definitions from `foundation.js` and must be kept in sync manually.

---

## Dark Mode Synchronisation

The `@media (prefers-color-scheme: dark)` block in `tooltips.js` (approximately lines 777–795) redefines tooltip colors for dark mode. These values **must match** the corresponding dark theme tokens in `foundation.js`.

**When updating `foundation.js` dark theme, also update:**
- `tooltips.js` → `TOOLTIP_STYLES` → `@media (prefers-color-scheme: dark)` block

**Values requiring synchronisation:**

| Token | foundation.js | tooltips.js |
|-------|---------------|-------------|
| `--ui-tooltip-bg` | Dark theme block | `@media (prefers-color-scheme: dark)` |
| `--ui-tooltip-text` | Dark theme block | `@media (prefers-color-scheme: dark)` |
| `--ui-rich-tooltip-bg` | Dark theme block (via `--ui-elevated-3`) | `@media (prefers-color-scheme: dark)` |
| `--ui-text-mute` | Dark theme block | `@media (prefers-color-scheme: dark)` |
| `--ui-border-color-light` | Dark theme block | `@media (prefers-color-scheme: dark)` |
| `--ui-accent` | Dark theme block | `@media (prefers-color-scheme: dark)` |

**Caret elements** (`.ui-tooltip__caret--*`) inherit `--ui-tooltip-bg` from their parent `.ui-tooltip` and use it for border colors. The fallback value must match the light-theme tooltip background (`rgb(40, 43, 54)`). Dark mode is handled automatically via inheritance from the parent's overridden `--ui-tooltip-bg`.

---

## Motion Timing Exceptions

Tooltips use intentional timing values that differ from the standard motion token scale. These are documented exceptions, not violations.

**JavaScript constants (lines 62-63):**
```javascript
const gap = 8;           // Mirrors --ui-space-2 (8px)
const viewportMargin = 8; // Mirrors --ui-space-2 (8px)
```
These cannot reference CSS custom properties because they're used in pure JavaScript positioning calculations, not CSS.

**Functional timing (not animation):**
- `100ms` (line 359): Debounce timing for pointer events. This is a functional threshold, not a visual transition.
- `150ms` (line 123): Remove delay after pointer leaves. Intentionally faster than `--ui-motion-fast` (120ms) for snappier tooltip dismissal.

These values are optimised for tooltip UX and should not be changed to match the standard motion scale.

---

## Maintenance Checklist

After modifying tooltip-related tokens in `foundation.js`:

1. [ ] Update fallback values in `tooltips.js` → `TOOLTIP_STYLES`
2. [ ] Update dark mode values in `tooltips.js` → `@media (prefers-color-scheme: dark)`
3. [ ] Test tooltips in both light and dark modes
4. [ ] Verify plain and rich tooltip appearances match shadow DOM components
