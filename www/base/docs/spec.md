# Shared UI Design System Specification

This specification is the canonical reference for the shared UI design system. It defines the system architecture, design philosophy, foundational tokens, component specifications, interaction patterns, layout system, theme adaptation, accessibility guidelines, and governance rules. All values derive from the token file (`www/base/foundation.js`).

---

## 1. System Architecture

**Token-driven design.** Every spatial, typographic, colour, motion, or elevation value comes from a token. No ad-hoc measurements, colors, or timing. The token file is the single source of truth.

**Fixed elevation model.** Five discrete surface tiers per theme (light and dark). No color-mix, no computed blends. Each tier is an explicit token with hex/RGB values.

**Compositional components.** Most components derive geometry from base tokens (spacing, radii, fonts) rather than having dedicated component tokens. Buttons use `--ui-space-*` and `--ui-radius-pill`. Only components with fixed, non-compositional geometry get dedicated tokens (inputs, switches, sliders, menus).

**Theme equality.** Light and dark themes receive equal implementation quality. All colors theme-adaptive via semantic roles.

**Theme mechanism.** Runtime switching via `@media (prefers-color-scheme: dark)` in foundation.js. Manual override available via `.light-theme` / `.dark-theme` classes.

---

## 2. Design Philosophy

The shared UI system provides a cohesive and predictable interface across all Home Assistant dashboards. It draws inspiration from Material 3 but adapts the palette, elevations, and geometry to suit Home Assistant's domestic environment. The guiding principles are:

1. **Token vocabulary exhaustion:** If a value is reusable, it's a token.
2. **Fixed elevation tiers:** Elevation uses explicit tokens per theme. No color-mix.
3. **Geometric lattice:** All geometry snaps to spacing, radius, and size tokens.
4. **Semantic color roles:** Colors chosen by role, not aesthetics.
5. **Unified state model:** All interactive components share one state model.
6. **Motion as grammar:** Durations and easings from motion scale only.
7. **Global layering model:** One z-index stack for tooltips, menus, dialogs, toasts.
8. **Typographic scale constraint:** Text picks from defined scale only.
9. **Explicit exceptions only:** Deviations must be documented.
10. **HA container authority:** HA controls layout, but doesn't rewrite design tokens.

---

## 3. Immutable Constraints

These rules cannot be violated under any circumstances.

### 3.1 Component Geometry Invariants

Component dimensions are fixed and never scale, stretch, or adapt based on viewport width.

| Component | Dimension | Token | Value |
|-----------|-----------|-------|-------|
| Button height | Height | `--ui-space-9` | 40px |
| Button padding | Horizontal | `--ui-space-5` | 20px |
| Input height | Height | `--ui-input-height` | 40px |
| Switch track | Width × Height | `--ui-switch-track-width/height` | 48×32px |
| Menu item | Height | `--ui-menu-item-height` | 50px |
| Touch targets | Minimum | — | 48px |

**Forbidden:** Buttons that stretch to fill container width. Inputs that deviate from 40px height. Components that scale based on viewport.

**Touch target rule:** Interactive elements must provide a 48px minimum hit area. The visual element may be smaller (e.g. buttons at 40px height) if the clickable/tappable region extends to 48px via padding, transparent borders, or parent container sizing. The 48px requirement applies to the interaction area, not the visual footprint.

### 3.2 State Model Invariance

All interactive components use identical state model with exact overlay percentages and timing.

| State | Light theme | Dark theme |
|-------|-------------|------------|
| Hover | `--ui-state-hover` (6%) | 8% |
| Pressed | `--ui-state-pressed` (12%) | 16% |
| Active | `--ui-state-active` (16%) | 20% |
| Focus | `--ui-state-focus-ring` (50% accent, 2px ring) | Solid brightened color (`rgb(80, 210, 240)`) for visibility on dark surfaces |
| Disabled | `--ui-state-disabled-opacity` (40%) | Same |

**Ring spread:** All hover/pressed state rings use `--ui-state-ring-spread` (6px) for the `box-shadow` spread radius. Defined once in foundation.js, consumed across buttons, FABs, sliders, toggles, checkboxes, and radios.

**Focus outline offset:** All focus-visible outlines use `--ui-focus-outline-offset` (2px). Some components use `-2px` (inset) for elements where an outward ring would clip or look wrong — these reference the token negated, not a separate value.

**Timing:**
- Hover/fast interactions: `--ui-motion-fast` (120ms)
- Standard transitions: `--ui-motion-med` (240ms)
- Complex animations: `--ui-motion-slow` (360ms)
- Toggle switches: `--ui-switch-motion` (350ms, expressive wobble)
- Standard easing: `cubic-bezier(0.2, 0, 0.2, 1)`
- Expressive easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` (toggle switches only)

### 3.3 Spacing Grid Invariance

All spacing uses 4px base grid.

**Valid spacing tokens:** `--ui-space-1` through `--ui-space-10` (4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px, 40px, 48px)

**Forbidden:** 10px, 14px, 18px, 22px, 26px, 30px (not multiples of 4)

**Documented exceptions:** `--ui-scrollbar-width: 6px` (sub-grid value for visual proportion — 8px scrollbars look heavy on thin content areas). `--ui-slider-gap-rest` overridden to 5px in components.js (matches split button visual weight).

### 3.4 Color Role Adherence

All colors must use defined semantic roles or theme-specific tokens. Never hard-code or invent colors.

**Required roles:**
- Semantic: `--ui-accent`, `--ui-success`, `--ui-error`, `--ui-warning`, `--ui-info`
- Transparency variants: `--ui-accent-soft`, `--ui-accent-faint` (and equivalents)
- Surface tiers: `--ui-elevated-0` through `--ui-elevated-4`
- Text roles: `--ui-text`, `--ui-text-mute`, `--ui-text-strong`

**Validation:** Every color must trace to a defined token. If you cannot cite the token name, the color is invalid.

---

## 4. Token Governance

The token file (`foundation.js`) is **READ-ONLY**.

All AI assistants must:
1. Never regenerate, reformat, or rewrite without explicit instruction
2. Reference tokens by name only, never reproduce token blocks from memory
3. Propose changes in prose first, wait for approval
4. Justify why a token needs to change
5. User edits the file or provides exact replacement text

**Violation of this protocol undermines the entire foundation.**

---

## 5. Foundation Tokens

All geometry, colour, and timing values derive from CSS custom properties defined in `www/base/foundation.js`. Theme-dependent values live under `.light-theme` and `.dark-theme`. This section summarises the tokens; the token file is the single source of truth.

### 5.1 Spacing

The system uses a 4px base grid.

| Token | Value | Typical usage |
|-------|-------|---------------|
| `--ui-space-1` | 4px | Minimal gaps, icon–label spacing |
| `--ui-space-2` | 8px | Tight spacing, chip gaps, input padding Y |
| `--ui-space-3` | 12px | Standard grid row gap, card internal gaps |
| `--ui-space-4` | 16px | Default padding for layouts, section gaps |
| `--ui-space-5` | 20px | Large button padding, modal padding |
| `--ui-space-6` | 24px | Card padding, section separation |
| `--ui-space-7` | 28px | Large section gaps |
| `--ui-space-8` | 32px | Major vertical spacing |
| `--ui-space-9` | 40px | Large hero spacing |
| `--ui-space-10` | 48px | Maximum white space |

### 5.2 Radii

| Token | Value | Usage |
|-------|-------|-------|
| `--ui-radius-s` | 8px | Small controls, inner shapes, tooltips, skeletons |
| `--ui-radius-m` | 12px | Tab bar containers, toast radius, `.ui-surface` utility |
| `--ui-radius-l` | 18px | Modals, textareas, drawers |
| `--ui-radius-xl` | 32px | Cards, inputs, menus |
| `--ui-radius-pill` | 999px | Buttons, badges, chips, progress bars |

### 5.3 Border widths

| Token | Value | Typical usage |
|-------|-------|---------------|
| `--ui-border-width-s` | 1px | Subtle separators, card outlines |
| `--ui-border-width-m` | 2px | Standard component borders, focus outlines |
| `--ui-border-width-l` | 3px | Emphasised outlines |

**Border style:** `--ui-border-style` (`solid`) - default style for all borders.

Border colours: `--ui-border-color-light`, `--ui-border-color-med`, `--ui-border-color-strong`

### 5.4 Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--ui-font-xs` | 0.75rem (~12px) | Helper text, labels |
| `--ui-font-s` | 0.86rem (~14px) | Secondary text |
| `--ui-font-m` | 1rem (16px) | Body text, input content |
| `--ui-font-l` | 1.15rem (~18px) | Section headings |
| `--ui-font-xl` | 1.32rem (~21px) | Page headings |

**Font family:** `--ui-font-family` resolves via cascade: `var(--ui-font-family, var(--ha-font-family, system-ui, sans-serif))`. Set by `fonts.js` to `'Inter', system-ui, sans-serif` when Inter is loaded.

**Weights:** `--ui-font-weight-s` (300), `--ui-font-weight-m` (400), `--ui-font-weight-l` (500)

**Line heights:** `--ui-font-line-height-s` (1.2), `--ui-font-line-height-m` (1.4), `--ui-font-line-height-l` (1.6)

**Letter spacing:** `--ui-font-letter-spacing-s` (0.8px), `--ui-font-letter-spacing-m` (0.5px), `--ui-font-letter-spacing-l` (0.2px)

### 5.5 Motion and Animation

| Token | Value | Usage |
|-------|-------|-------|
| `--ui-motion-fast` | 120ms cubic-bezier(0.2,0,0.2,1) | Quick interactions |
| `--ui-motion-med` | 240ms cubic-bezier(0.2,0,0.2,1) | Standard transitions |
| `--ui-motion-slow` | 360ms cubic-bezier(0.2,0,0.2,1) | Emphasised transitions |
| `--ui-switch-motion` | 350ms cubic-bezier(0.34,1.56,0.64,1) | Toggle switch wobble |
| `--ui-switch-secondary-motion` | 250ms ease-out | Toggle switch secondary |
| `--ui-checkbox-motion` | 320ms cubic-bezier(0.22,2.2,0.64,1) | Checkbox/radio check animation |
| `--ui-progress-motion` | 350ms cubic-bezier(0.34,1.56,0.64,1) | Progress bar fill wobble |
| `--ui-circle-slider-bounce` | 350ms cubic-bezier(0.22,2.8,0.64,1) | Circle slider stroke bounce |

**Easing curves:**

| Token | Value | Usage |
|-------|-------|-------|
| `--ui-ease-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) | Standard spring overshoot (number-input expansion, pop-ins) |
| `--ui-ease-spring-heavy` | cubic-bezier(0.35, 1.7, 0.45, 0.9) | Heavy spring (clearable input pop-in, number-input chevrons) |
| `--ui-ease-bounce` | cubic-bezier(0.12, 0.5, 0.86, 1) | Gentle bounce settle |

**Animation primitives:**

| Token | Value | Usage |
|-------|-------|-------|
| `--ui-anim-translate` | 6px | Hover lift distance |
| `--ui-anim-scale` | 0.96 | Standard press compression |
| `--ui-anim-scale-subtle` | 0.98 | Gentle press feedback (toggles) |
| `--ui-switch-icon-scale` | 0.67 | Icon sizing within switch thumb |

**Animation parameters** (used by `@keyframes ui-pop-in` in `components.js`):

| Token | Value | Usage |
|-------|-------|-------|
| `--ui-pop-from-scale` | 0 | Starting scale for pop-in entrance |
| `--ui-pop-overshoot` | 1.05 | Scale overshoot peak |
| `--ui-pop-from-y` | 0px | Starting Y offset |
| `--ui-anim-from-x` | 0px | Starting X offset |
| `--ui-anim-from-y` | 0px | Starting Y offset (generic) |
| `--ui-anim-delay` | 0s | Animation delay |
| `--ui-anim-duration` | 1s | Animation duration |

All animations must support `prefers-reduced-motion` by reducing durations to 0ms and removing transforms.

### 5.6 Layout tokens

| Token | Purpose | Default |
|-------|---------|---------|
| `--ui-layout-card-padding` | Internal padding for cards | `--ui-space-6` |
| `--ui-layout-section-gap` | Space between section blocks | `--ui-space-4` |
| `--ui-layout-row-gap` | Vertical gap between rows | `--ui-space-3` |
| `--ui-layout-col-gap` | Horizontal gap between columns | `--ui-space-3` |
| `--ui-layout-header-padding` | Header area padding | `--ui-space-3` |
| `--ui-layout-footer-padding` | Footer area padding | `--ui-space-3` |

### 5.7 Semantic colour roles

#### Light theme

**Surfaces:** `--ui-surface` rgb(243,243,255), `--ui-surface-alt` rgb(236,236,248), `--ui-surface-alt-2` rgb(226,226,238)

**Text:** `--ui-text` rgb(48,50,60), `--ui-text-mute` rgb(92,94,106), `--ui-text-strong` rgb(28,30,40)

**Accent:** `--ui-accent` var(--primary-color, rgb(0,104,128)), `--ui-accent-soft` rgba(0,104,128,0.32), `--ui-accent-faint` rgba(0,104,128,0.16)

**Semantic:** `--ui-success` rgb(0,162,103), `--ui-warning` rgb(232,177,0), `--ui-error`, `--ui-info`

#### Dark theme

**Surfaces:** `--ui-surface` rgb(11,14,23), `--ui-surface-alt` rgb(24,28,38), `--ui-surface-alt-2` rgb(32,36,48)

**Text:** `--ui-text` rgb(228,228,242), `--ui-text-mute` rgb(145,147,159), `--ui-text-strong` rgb(240,240,252)

**Accent:** `--ui-accent` var(--primary-color, rgb(30,171,208)), `--ui-accent-soft` rgba(30,171,208,0.32), `--ui-accent-faint` rgba(30,171,208,0.16)

#### Elevation and surface tiers

| Tier | Light theme | Dark theme |
|------|-------------|------------|
| Elevated 0 | rgb(243,243,255) | rgb(11,14,23) |
| Elevated 1 | rgb(236,236,248) | rgb(17,19,28) |
| Elevated 2 | rgb(226,226,238) | rgb(40,43,54) |
| Elevated 3 | rgb(214,214,225) | rgb(56,60,72) |
| Elevated 4 | rgb(196,196,208) | rgb(74,78,92) |

| Level | Light shadow | Dark shadow |
|-------|--------------|-------------|
| Shadow 0 | none | none |
| Shadow 1 | 0 1px 3px rgba(0,0,0,0.10) | 0 1px 3px rgba(0,0,0,0.30) |
| Shadow 2 | 0 2px 8px rgba(0,0,0,0.14) | 0 2px 8px rgba(0,0,0,0.35) |
| Shadow 3 | 0 4px 12px rgba(0,0,0,0.18) | 0 4px 12px rgba(0,0,0,0.40) |
| Shadow 4 | 0 6px 18px rgba(0,0,0,0.22) | 0 6px 18px rgba(0,0,0,0.50) |

#### State layers

| State | Light theme | Dark theme |
|-------|-------------|------------|
| Hover | rgba(48,50,60,0.06) | rgba(228,228,242,0.08) |
| Pressed | rgba(48,50,60,0.12) | rgba(228,228,242,0.16) |
| Active | rgba(48,50,60,0.16) | rgba(228,228,242,0.20) |
| Disabled | 0.4 opacity | 0.4 opacity |

Focus rings use `--ui-state-focus-ring`: light theme uses 50% alpha of accent (`rgba(0, 104, 128, 0.50)`); dark theme uses a solid brightened color (`rgb(80, 210, 240)`) for visibility on dark surfaces.

#### Overlay / Scrim

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--ui-overlay-scrim` | rgba(0,0,0,0.40) | rgba(0,0,0,0.55) | Drawer backdrop |
| `--ui-overlay-scrim-strong` | rgba(0,0,0,0.60) | rgba(0,0,0,0.78) | Modal backdrop |
| `--ui-overlay-bg` | rgb(255,255,255) | rgb(30,33,42) | Overlay surface (toasts) |
| `--ui-overlay-blur` | 12px | 12px | Backdrop blur radius |

#### Tier / Grade colors

Distinct colors for rating or categorization systems. Theme-independent (same values work in light and dark).

| Token | Value | Usage |
|-------|-------|-------|
| `--ui-tier-a` | rgb(233, 191, 79) | Gold - highest tier |
| `--ui-tier-b` | rgb(161, 67, 159) | Purple - second tier |
| `--ui-tier-c` | rgb(74, 144, 226) | Blue - third tier |
| `--ui-tier-d` | rgb(76, 196, 122) | Green - fourth tier |

#### Category / Classification Colors

Eight distinct hues for classification or categorisation systems. Theme-adaptive: brighter in dark mode for contrast on dark surfaces. Each has a `-faint` variant (16% opacity) for subtle backgrounds.

| Token | Light | Dark | Hue |
|-------|-------|------|-----|
| `--ui-cat-teal` | rgb(59, 193, 181) | rgb(90, 214, 204) | Teal |
| `--ui-cat-amber` | rgb(241, 162, 38) | rgb(255, 183, 77) | Amber |
| `--ui-cat-sky` | rgb(0, 155, 219) | rgb(60, 185, 240) | Sky blue |
| `--ui-cat-violet` | rgb(186, 104, 200) | rgb(206, 147, 216) | Violet |
| `--ui-cat-green` | rgb(99, 200, 106) | rgb(130, 220, 136) | Green |
| `--ui-cat-red` | rgb(245, 59, 104) | rgb(255, 105, 140) | Red |
| `--ui-cat-lime` | rgb(221, 244, 88) | rgb(232, 250, 130) | Lime |
| `--ui-cat-slate` | rgb(127, 130, 152) | rgb(160, 163, 182) | Slate |

Faint variants follow the pattern `--ui-cat-{name}-faint` (e.g. `--ui-cat-teal-faint`).

#### Accent pink

Shared accent color used by spinners, slider rollback indicators, screen border, and input clear pulse.

| Token | Value | Usage |
|-------|-------|-------|
| `--ui-pink` | rgb(255, 46, 146) | Accent pink — spinners, rollback, screen border |
| `--ui-pink-soft` | rgba(255, 46, 146, 0.4) | Reduced-opacity variant |
| `--ui-spinner-color` | var(--ui-pink) | Spinner stroke color |
| `--ui-slider-rollback` | var(--ui-pink) | Circle slider decrease indicator |

#### Activity colors (Presence Card)

Theme-adaptive colors for presence detection activity indicators.

| Token | Light | Dark |
|-------|-------|------|
| `--ui-activity-active-fresh` | rgb(243, 137, 26) | rgb(255, 160, 60) |
| `--ui-activity-active-fresh-secondary` | rgb(247, 191, 0) | rgb(255, 210, 80) |
| `--ui-activity-active-stale` | rgb(250, 170, 130) | rgb(200, 140, 100) |
| `--ui-activity-active-stale-opacity` | 0.2 | 0.3 |
| `--ui-activity-recent-fresh` | rgb(255, 255, 255) | rgb(240, 240, 250) |
| `--ui-activity-recent-fresh-secondary` | rgb(0, 200, 100) | rgb(80, 220, 140) |
| `--ui-activity-recent-faded` | rgb(105, 105, 105) | rgb(120, 120, 130) |
| `--ui-activity-recent-faded-secondary` | rgb(120, 80, 20) | rgb(140, 100, 50) |

### 5.8 Z-index scale

Global layering model. One stack for all overlapping content.

| Token | Value | Usage |
|-------|-------|-------|
| `--ui-z-base` | 0 | Default layer |
| `--ui-z-tooltip` | 10 | Tooltip overlays |
| `--ui-z-menu` | 20 | Dropdown menus |
| `--ui-z-dialog` | 30 | Modal dialogs |
| `--ui-z-toast` | 40 | Toast notifications (within shadow DOM) |
| `--ui-z-max` | 50 | Maximum z-index |

**Note:** `--ui-toast-z-index` (99999) is separate — used by the toast container in light DOM to ensure toasts appear above HA's own UI.

### 5.9 Icon sizes

| Token | Value | Usage |
|-------|-------|-------|
| `--ui-icon-xs` | 14px | Tiny icons, decorative indicators |
| `--ui-icon-s` | 18px | Small icons, icon buttons |
| `--ui-icon-m` | 20px | Standard icons |
| `--ui-icon-l` | 24px | Large icons, primary actions |

---

## 6. Component Specifications

Each component uses only tokens for spacing, geometry, colour, state and motion. No ad-hoc values are permitted.

### 6.1 Buttons

Buttons come in several variants (default, accent, outline, tonal, danger, icon). Compositional components deriving dimensions from base tokens.

| Property | Token | Value |
|----------|-------|-------|
| Height | `--ui-space-9` | 40px |
| Padding X | `--ui-space-5` | 20px |
| Icon-label gap | `--ui-space-2` | 8px |
| Radius | `--ui-radius-pill` | 999px |
| Font size | `--ui-font-m` | 16px |
| Font weight | — | 500 |
| Touch target | — | 48px minimum |

**States:** Default (variant-specific background), Hover (overlay + -1px translateY), Pressed (overlay, translation reset, 4% compress for accent), Focus (2px ring), Disabled (40% opacity).

**Variants:**
- **Default** (`.ui-btn`): Transparent background, text color, state overlay on interaction
- **Accent** (`.ui-btn--accent`): Accent-tinted state layers; add `.ui-btn--filled` for solid accent background
- **Outline** (`.ui-btn--outline`): 2px border (`--ui-border-color-med`), transparent background. Border strengthens on hover. For secondary actions needing visual presence without fill
- **Danger** (`.ui-btn--danger`): Error color text and tinted state layers; add `.ui-btn--filled` for solid error background
- **Muted** (`.ui-btn--muted`): Elevated background (`--ui-elevated-2`), muted text. For tertiary/subtle actions
- **Toggle** (`.ui-btn--toggle`): Outline when unselected, accent fill when `.is-selected`. For stateful on/off buttons
- **Icon** (`.ui-btn--icon`): Circular 40×40px, no padding. Combine with other variants

**Size modifiers:**
- **Small** (`.ui-btn--small`): Height 32px, padding X 12px, font size `--ui-font-s`. Icon variant: 32×32px
- **Large** (`.ui-btn--large`): Height 48px, padding X 24px. Icon variant: 48×48px

**Programmatic state classes:** For touch devices where CSS `:hover` and `:active` don't behave correctly, apply `.is-hovered` and `.is-pressed` classes via JavaScript. These mirror the pseudo-class styles exactly.

Icon buttons use `--ui-icon-s` (18px) or `--ui-icon-m` (20px).

### 6.2 Input fields

Floating label pattern with text fields, text areas, and dropdown selects.

| Property | Token | Value |
|----------|-------|-------|
| Height | `--ui-input-height` | 40px |
| Padding X | `--ui-input-padding-x` | 16px |
| Padding Y | `--ui-input-padding-y` | 8px |
| Radius | `--ui-radius-xl` | 32px |
| Border width | `--ui-border-width-m` | 2px |

**Floating label:** Starts at vertical center, elevates on focus/value via `translateY(calc(-1 * var(--ui-input-label-offset, 37px))) scale(0.75)`. Animation uses `--ui-motion-med` (240ms). Transform-based for 60fps.

**States:** Default (light border, muted label), Hover (overlay), Focus (accent border, ring, label elevates), Has value (label stays elevated), Error (error border), Disabled (opacity).

**Variants:**
- **Default** (`.ui-input`): Standard floating-label input.
- **Quiet** (`.ui-input--quiet`): Label acts as placeholder only — visible when empty, fades out when populated or focused. No floating animation. For inline-edit contexts where the label is noise once content exists.
- **Clearable** (`.ui-input--clearable`): Adds `.ui-input__clear` button inside `.ui-input__pill`. Button uses `<button>` element with 16px SVG × icon. Behaviour wired automatically by `initInputs()`.

**Clearable variant detail:**

| Property | Token / Value | Notes |
|----------|---------------|-------|
| Touch target | `--ui-space-10` (48px) | Width and height |
| Icon size | 16px SVG | `stroke="currentColor"` for token color |
| Default color | `--ui-error-soft` | Muted destructive hint |
| Focused/hovered color | `--ui-error` | Full error color when pill has `:focus-within` or button is hovered |
| Hover scale | `scale(1.15)` | Smooth via `--ui-motion-med` transition |
| Pop-in animation | `ui-input-clear-pop` 400ms `--ui-ease-spring-heavy` | 4-step wobble: 0→1.35→0.85→1.1→1. See `docs/componentry/clearable-input.md` |
| Visibility | CSS-driven via `.has-value` | `opacity: 0; scale(0)` hidden → animated reveal |
| Reduced motion | Animation suppressed | Falls back to instant show/hide |

**Clearing pulse:** On click, `initInputs()` clears the value, refocuses the input, and triggers a pink border pulse: border snaps to `--ui-pink` (350ms hold), then fades to `--ui-accent` over 500ms. Timing documented in `docs/componentry/clearable-input.md`.

**Textarea variant detail** (`.ui-input--textarea`):

Multi-line input using `<textarea>` inside the standard `.ui-input` structure. Label starts at top-left instead of vertically centred.

| Property | Token / Value | Notes |
|----------|---------------|-------|
| Min height (container) | 70px | `height: auto` — grows with content |
| Min height (field) | 50px | Inner textarea minimum |
| Radius | `--ui-radius-l` (18px) | Rounded rectangle, not pill |
| Padding | `--ui-space-6` top, `--ui-space-4` sides, `--ui-space-3` bottom | Asymmetric for label clearance |
| Label position | `top: var(--ui-space-3)` | Anchored at top, not centred |
| Label elevation | `translateY(-34px) scale(0.75)` | Moves above pill on focus/has-value |
| Resize | `vertical` | User-resizable, hidden webkit resizer |
| Scrollbar | Hidden | `scrollbar-width: none` + webkit override |
| Line height | `--ui-font-line-height-m` (1.4) | Readable multi-line text |

**Textarea large variant** (`.ui-input--textarea-lg`): Composes with `--textarea`. Increases min heights — container 130px, pill 130px, field 110px. Use for longer-form content.

### 6.3 Switches / Toggles

Binary on/off states with expressive animation.

| Property | Token | Value |
|----------|-------|-------|
| Track width | `--ui-switch-track-width` | 48px |
| Track height | `--ui-switch-track-height` | 32px |
| Track radius | `--ui-switch-track-radius` | 16px |
| Thumb size (off) | `--ui-switch-thumb-size-off` | 16px |
| Thumb size (on) | `--ui-switch-thumb-size-on` | 24px |
| Thumb radius | `--ui-switch-thumb-radius` | 50% |
| Outline width | `--ui-switch-outline-width` | 2px |
| Gap | `--ui-switch-gap` | 8px |
| Touch target | `--ui-switch-touch-target` | 48px |
| Animation | `--ui-switch-motion` | 350ms wobble easing |

**Animation:** Thumb uses `--ui-switch-motion` for wobble effect (MD3 Expressive). Combines translation and scale. Press feedback uses `--ui-anim-scale-subtle` (0.98) for gentle compression. Icon switch variant: icon fades/scales in (250ms ease-out) using `--ui-switch-icon-scale` (0.67) for proportional sizing within thumb.

**Colors:** Track off `--ui-switch-track-off`, Track on `--ui-switch-track-on` (accent), Thumb off `--ui-switch-thumb-off`, Thumb on `--ui-switch-thumb-on`, Icon `--ui-switch-icon-on`.

### 6.4 Checkboxes

Binary selection controls with expressive animation.

| Property | Token | Value |
|----------|-------|-------|
| Box size | `--ui-control-size` | 26px |
| Border width | `--ui-control-border-width` | 2px |
| Border radius | `--ui-control-border-radius` | 8px |
| Icon size | `--ui-control-checked-icon-size` | 16px |
| Gap (box to label) | `--ui-space-2` | 8px |
| Touch target | `--ui-space-10` | 48px minimum |
| Animation | `--ui-checkbox-motion` | 320ms expressive easing |

**States:** Default (border only, no fill), Hover (stronger border), Checked (accent fill, white checkmark with scale animation), Focus (2px ring), Disabled (40% opacity).

**Animation:** Checkmark uses scale transform with expressive easing for satisfying feedback. Supports `prefers-reduced-motion`.

**Colors:** Unchecked uses `--ui-control-bg` (transparent) with `--ui-border-color-med`. Checked uses `--ui-control-checked-bg` (accent) with `--ui-text-on-accent` icon.

### 6.5 Radios

Binary selection controls for mutually exclusive options within a group.

| Property | Token | Value |
|----------|-------|-------|
| Circle size | `--ui-control-size` | 26px |
| Border width | `--ui-control-border-width` | 2px |
| Border radius | — | 50% (circle) |
| Dot size | — | control-size - 6px (20px) |
| Ring width | — | 3px |
| Gap (circle to label) | `--ui-space-2` | 8px |
| Touch target | `--ui-space-10` | 48px minimum |
| Animation | `--ui-checkbox-motion` | 320ms expressive easing |

**States:** Default (border only), Hover (stronger border), Checked (accent fill with thin ring, white dot with scale animation), Focus (2px ring), Disabled (40% opacity).

**Animation:** Dot uses scale transform with expressive easing. Supports `prefers-reduced-motion`.

**Colors:** Same as checkboxes - unchecked uses `--ui-control-bg` with `--ui-border-color-med`, checked uses `--ui-control-checked-bg` with `--ui-text-on-accent` dot.

### 6.6 Progress

Horizontal progress indicator with determinate and indeterminate states. Bold, rounded design matching dashboard aesthetic.

| Property | Token | Value |
|----------|-------|-------|
| Height | `--ui-progress-height` | 14px |
| Height thin | `--ui-progress-height-thin` | 6px |
| Height thick | `--ui-progress-height-thick` | 24px |
| Border radius | `--ui-progress-radius` | 999px (pill) |
| Track background | `--ui-progress-track` | Semi-transparent |
| Fill color | `--ui-progress-fill` | `--ui-accent` |
| Animation | `--ui-progress-motion` | 350ms wobble easing |

**Variants:** Default (14px), Thin (6px), Thick (24px). Color variants: success, warning, error.

**States:** Determinate (width-based progress with bounce), Indeterminate (flowing animation with wobble/scale, fast at edges).

**Visual:** Subtle inset shadow on track for depth. Highlight on fill bar top edge. Fully rounded pill shape.

**Animation:** Fill width uses wobble easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) matching toggle switches. Indeterminate uses 1.6s animation with scaleX wobble, faster at edges. Supports `prefers-reduced-motion`.

### 6.7 Sliders

Continuous numeric input with horizontal and vertical orientations.

| Property | Token | Value |
|----------|-------|-------|
| Track height | `--ui-slider-track-height` | 24px |
| Track radius | `--ui-slider-track-radius` | 12px |
| Thumb height | `--ui-slider-thumb-height` | 44px |
| Thumb width (rest) | `--ui-slider-thumb-width-rest` | 6px |
| Thumb width (pressed) | `--ui-slider-thumb-width-pressed` | 4px |
| Thumb radius | `--ui-slider-thumb-radius` | 4px |
| Gap (rest) | `--ui-slider-gap-rest` | 5px (overridden from 4px token for visual weight — documented exception) |
| Gap (pressed) | `--ui-slider-gap-pressed` | 3px |
| Motion duration | `--ui-slider-motion-duration` | 200ms |
| Motion easing | `--ui-slider-motion-easing` | cubic-bezier(0.4, 0, 0.2, 1) |
| Container height | `--ui-slider-container-height` | 48px |
| Vertical height | `--ui-slider-vertical-height` | 300px |
| Value bubble | `--ui-slider-value-size` | 36px |
| Value offset Y | `--ui-slider-value-offset-y` | 12px |
| Value offset X | `--ui-slider-value-offset-x` | 8px |

**Behaviour:** Track split into active/inactive segments with gaps around thumb. Gap and thumb shrink on press. Thumb compresses for tactile feedback.

**Vertical variant:** Rotate the slider 90° via `.ui-slider--vertical`. Active segment fills from bottom. Value bubble appears to the side. Same tokens and interaction model as horizontal.

**Performance:** CSS transitions disabled during drag (<16ms response). Implementation in `helpers.js`. Transitions re-enabled on drag end.

### 6.8 Split Buttons

Primary action with secondary menu.

| Property | Token | Value |
|----------|-------|-------|
| Height | `--ui-split-height` | 40px |
| Segment gap | `--ui-split-gap` | 2px |
| Outer radius | `--ui-split-radius-outer` | 20px |
| Inner radius | `--ui-split-radius-inner` | 6px |
| Icon-label gap | `--ui-space-2` | 8px |
| Arrow icon size | — | 16×16px |

**Arrow icon:** Use filled caret, not stroked chevron. Standard SVG:
```html
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <path d="M7 10l5 5 5-5z"/>
</svg>
```

### 6.9 Chips / Tags

| Property | Token | Value |
|----------|-------|-------|
| Height | `--ui-chip-height` | 32px |
| Radius | `--ui-chip-radius` | pill |
| Padding X | `--ui-chip-padding-x` | 12px |
| Gap | `--ui-chip-gap` | 8px |
| Font size | `--ui-chip-font-size` | `--ui-font-s` |

**Colors:** Background `--ui-chip-bg` (elevated-1), Selected `--ui-chip-selected-bg` (accent soft).

### 6.10 Menus

| Property | Token | Value |
|----------|-------|-------|
| Radius | `--ui-menu-radius` | 32px |
| Padding X | `--ui-menu-padding-x` | 12px |
| Padding Y | `--ui-menu-padding-y` | 8px |
| Min width | `--ui-menu-min-width` | 200px |
| Max width | `--ui-menu-max-width` | 320px |
| Max height | `--ui-menu-max-height` | 320px |
| Item height | `--ui-menu-item-height` | 50px |
| Item radius | `--ui-menu-item-radius` | 32px |
| Item padding X | `--ui-menu-item-padding-x` | 16px |
| Offset | `--ui-menu-offset` | 4px |

**Item states:** Default (text role), Hover (`--ui-menu-item-hover-bg`), Selected (accent background, `--ui-text-on-accent`).

### 6.11 Tooltips

| Type | Radius | Padding X | Padding Y | Max width | Delay |
|------|--------|-----------|-----------|-----------|-------|
| Base | 8px | 8px | 4px | 200px | 400/100ms |
| Rich | 18px | 16px | 12px | 320px | 400/100ms |

**Colors:** Base uses `--ui-tooltip-bg`, `--ui-tooltip-text`. Rich uses `--ui-rich-tooltip-bg`, `--ui-rich-tooltip-text`.

### 6.12 Modals

Provided by `modals.js`. Exports `showModal(options)` and `closeModal()`. Renders in light DOM (`document.body`).

| Property | Token | Value |
|----------|-------|-------|
| Radius | `--ui-modal-radius` | 18px (`--ui-radius-l`) |
| Padding | `--ui-space-6` | 24px (on `.ui-modal` directly) |
| Header gap | `--ui-modal-header-gap` | 12px (`--ui-space-3`) |
| Footer gap | `--ui-modal-footer-gap` | 12px (`--ui-space-3`) |
| Max width (S) | `--ui-modal-max-width-s` | 480px |
| Max width (M) | `--ui-modal-max-width-m` | 720px (default) |
| Max width (L) | `--ui-modal-max-width-l` | 960px |
| Surface | `--ui-elevated-2` | Elevated card tier |
| Shadow | `--ui-shadow-4` | Highest elevation |
| Backdrop | `--ui-overlay-scrim-strong` | Strong scrim overlay |
| Close button | `--ui-space-9` | 40px circular |
| Z-index | `--ui-z-dialog` | 30 |

**Structure:** `.ui-modal-backdrop` (scrollable, `align-items: flex-start`) > `.ui-modal` (`margin: auto`, `overflow: visible`) > `__header` (`__title` + `__close`), `__body`, `__footer` (buttons, flex-end). Padding lives on `.ui-modal`; sub-elements have no padding. Backdrop scrolls the entire modal when content exceeds viewport.

**Motion:**

| Phase | Token | Value |
|-------|-------|-------|
| Enter | `--ui-modal-motion-in` | 200ms `cubic-bezier(0, 0, 0.2, 1)` |
| Exit | `--ui-modal-motion-out` | 120ms `ease-in` |
| Backdrop in | `--ui-modal-backdrop-in` | 120ms `ease-out` |
| Backdrop out | `--ui-modal-backdrop-out` | 120ms `ease-in` |

Enter: `scale(0.97)` → `scale(1)` with opacity. Exit: `scale(0.96) translateY(8px)` with opacity.

**Behaviour:** Single modal at a time (opening a new one auto-closes the active one). Focus trap with Tab wrapping. ESC to close. Backdrop click to close. Body scroll locked while open. Previous focus restored on close. `prefers-reduced-motion` suppresses all animation.

**ARIA:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` → title, `aria-describedby` → body.

**Note:** Modals render in light DOM, so cards using shadow DOM cannot rely on adopted stylesheets for modal content styling. Cards needing styled inputs inside modals should use shadow-DOM-internal dialogs instead (see work-actions-card edit modal pattern).

### 6.13 Toasts

| Property | Token | Value |
|----------|-------|-------|
| Max width | `--ui-toast-max-width` | 400px |
| Position | bottom/right | 100px / 18px |
| Stack gap | `--ui-toast-stack-gap` | 16px |
| Border width | `--ui-toast-border-width` | 3px |
| Radius | `--ui-toast-radius` | 12px |
| Padding | X/Y | 16px / 12px |
| Icon size | `--ui-toast-icon-size` | 38px |
| Icon protrusion | `--ui-toast-icon-protrusion` | 19px |
| Close button size | `--ui-toast-close-size` | 22px |
| Close button offset | `--ui-toast-close-offset` | -10px |
| Z-index | `--ui-toast-z-index` | 99999 (light DOM, above HA UI) |

**Behaviour:** Stacking from bottom-right. Max 10 visible. Auto-dismiss 6000ms default. Hover pauses timer. Close button on hover.

**Animation:** Enter `translateY(10px) scaleX(0.6)` → normal (600ms). Exit `translateX(10px)` with fade (150ms).

### 6.14 Screen Border Effect

Fullscreen SVG border for high-priority visual feedback.

**Tokens:** Border color `--ui-spinner-color` (pink), Animation `--ui-motion-slow` (360ms).

**Behaviour:** SVG rect with stroke, no fill. Sidebar-aware. Pulse on repeat. Auto-hide after configurable duration (default 3000ms).

### 6.15 Collapsible Sections

| Property | Token | Value |
|----------|-------|-------|
| Animation | `--ui-motion-med` | 240ms |
| Icon size | `--ui-icon-m` | 20px |
| Padding | `--ui-layout-section-gap` | 16px |
| Gap | `--ui-space-2` | 8px |

**Features:** localStorage persistence, batch toggle, staggered animation, keyboard accessible (Enter/Space).

**States:** Expanded (content visible, chevron rotated 180°), Collapsed (height: 0, chevron 0°), Disabled (reduced opacity).

### 6.16 Copy Button

| Property | Token | Value |
|----------|-------|-------|
| Size | `--ui-space-10` | 48px |
| Radius | — | 50% |
| Animation | `--ui-motion-slow` | 360ms |

**States:** Default (transparent), Hover (6% overlay), Copied (surface background, success color, elevated shadow).

### 6.17 Toggle Buttons

Buttons maintaining selected/unselected state.

**Implementation:** `.ui-btn.ui-btn--toggle`, selected state `.is-selected`.

**Behaviour:** Same 40px height as standard buttons. Selected state uses `--ui-accent` background with contrasting text.

### 6.18 Card Base Components

| Component | Property | Value |
|-----------|----------|-------|
| `.ui-card` | Padding | 24px (`--ui-space-6`) |
| `.ui-card` | Background | `--ui-surface` |
| `.ui-card` | Radius | 32px (`--ui-radius-xl`) |
| `.ui-card-header` | Gap | 12px (`--ui-space-3`) |
| `.ui-card-header` | Margin bottom | 20px (`--ui-space-5`) |
| `.ui-card-header__accent` | Width × Height | 3px × 36px |
| `.ui-card-header__accent` | Background | `--ui-accent` |
| `.ui-card-header__title` | Font size | ~21px (`--ui-font-xl`) |

**Design rationale:** 32px radius for soft, approachable feel. 24px padding for breathing room. Accent sidebar as signature visual element. Absolute action buttons for accessible controls without interfering with content flow.

### 6.19 Skeleton Loading Placeholders

Animated placeholder elements that indicate content loading. Shimmer effect provides visual feedback while maintaining layout stability.

| Property | Token | Value |
|----------|-------|-------|
| Base color | `--ui-skeleton-base` | Theme-aware (8% light / 10% dark) |
| Shine color | `--ui-skeleton-shine` | Theme-aware (4% light / 5% dark) |
| Radius | `--ui-skeleton-radius` | `--ui-radius-s` (8px) |
| Height | `--ui-skeleton-height` | 16px (default) |
| Animation | `--ui-skeleton-animation-duration` | 1.5s shimmer |

**Shape variants:**
- `--text`: Default, pill-shaped ends for text lines
- `--circle`: 50% radius for avatars/icons
- `--rect`: Rounded rectangle for cards/images (16:9 aspect ratio)
- `--square`: 1:1 aspect ratio for thumbnails

**Size modifiers:** `--xs` (8px), `--sm` (12px), `--md` (16px), `--lg` (24px), `--xl` (32px)

**Layout helpers:**
- `.ui-skeleton-group`: Vertical stack with 8px gap
- `.ui-skeleton-row`: Horizontal layout with 12px gap

**Animation:** Linear gradient from base → shine → base, sweeping left-to-right over 1.5s. Respects `prefers-reduced-motion` (shows static state).

**Accessibility:** Use `aria-hidden="true"` on skeleton containers. Add `aria-busy="true"` to loading regions.

### 6.20 Tab Bar

Horizontal tab navigation with contained and pill variants.

| Property | Token | Value |
|----------|-------|-------|
| Min height (default) | `--ui-space-10` | 48px |
| Min height (pill) | `--ui-space-10` | 48px |
| Container padding | `--ui-space-1` | 4px |
| Tab padding | `--ui-space-2` `--ui-space-3` | 8px 12px |
| Gap | `--ui-space-1` | 4px |
| Container radius | `--ui-radius-m` | 12px |
| Tab radius (default) | `--ui-radius-s` | 8px |
| Tab radius (pill) | `--ui-radius-m` | 12px |
| Font size | `--ui-font-s` | ~14px |
| Font weight (default) | `--ui-font-weight-l` | 500 |
| Font weight (pill) | `--ui-font-weight-m` | 400 |

**Variants:**
- **Default** (`.ui-tab-bar`): Contained background, equal-width tabs, rounded shape.
- **Pill** (`.ui-tab-bar--pill`): No container background, content-sized tabs, wrapping layout.
- **Colored** (`.ui-tab-bar--colored`): Per-tab colour via `--_tab-color` and `--_tab-color-faint` inline properties. Active state shows faint background + full colour text.

Variants compose: `ui-tab-bar--pill ui-tab-bar--colored` produces content-sized, wrapped, individually-coloured tabs.

**States:** Default (transparent bg, muted text) | Hover (`--ui-state-hover` bg, normal text) | Active (elevated bg or coloured) | Focus (2px ring) | Disabled (40% opacity).

**Toggle pattern:** For filter usage, tabs support toggle behaviour (click active to deselect). Use `aria-pressed` instead of tab-panel semantics.

### 6.21 Circular Sliders

Circular slider for compact numeric control. SVG-based ring with drag-up-to-increase / drag-down-to-decrease UX. Two variants: number (drag only) and interactive (drag + tap). Both variants show a rollback indicator (pink arc) when dragging to decrease.

| Property | Token | Value |
|----------|-------|-------|
| Size | `--ui-circle-size` | 90px (set via `:host`) |
| Stroke width | `--ui-circle-stroke-width` | 3px (set via `:host`) |
| Background fill | `--ui-surface-alt-2` | Theme-adaptive surface |
| Fill stroke | `--ui-circle-fill` | Defaults to `--ui-accent`. Consumer-overridable. |
| Rollback stroke | `--ui-slider-rollback` | Pink indicator on decrease |
| Value font size | `--ui-font-l` | ~18px |
| Value font weight | `--ui-font-weight-m` | 400 |
| Value letter spacing | `--ui-font-letter-spacing-l` | 0.2px |
| Unit font size | `--ui-font-xs` | ~12px |
| Unit default | — | Empty string (no unit shown). Set `unit="%"` explicitly if needed. |
| Unit spacing | `--ui-space-1` | 4px (margin-left) |
| Drag stroke boost | `--ui-border-width-s` | +1px during drag |
| Rollback stroke reduction | `--ui-border-width-s` | −1px vs fill |
| Fill transition | `--ui-motion-fast` | 120ms stroke-dashoffset + stroke colour |
| Stroke bounce | `--ui-circle-slider-bounce` | 350ms cubic-bezier(0.22, 2.8, 0.64, 1) |

**Variants:**
- **Number** (`type="number"`, default): Shows rollback indicator (pink arc) when dragging to decrease. Tap does nothing.
- **Interactive** (`type="interactive"`): Shows rollback indicator (pink arc) when dragging to decrease. Quick tap (<200ms, <5 value delta) dispatches `ui-tap` with `{ action: "toggle" }`. Wobble animation on tap. Legacy: `type="light"` is accepted and maps to `interactive`.

**States:** Default (grab cursor), Hover (6% overlay), Pressed/Dragging (12% overlay, grabbing cursor, wider fill stroke), Focus (2px `--ui-state-focus-ring`), Disabled (`--ui-state-disabled-opacity`, no pointer events).

**Animation:** Wobble on tap (interactive mode) uses `--ui-circle-slider-bounce` token. Supports `prefers-reduced-motion` — all transitions and animations disabled.

**Events:**
- `ui-input` — emitted during drag with `{ value, dragging: true }`
- `ui-change` — emitted on drag end or keyboard change with `{ value }`
- `ui-tap` — emitted on quick tap with `{ action: "toggle" }` (interactive mode) or `{}` (number mode)

**Accessibility:** `role="slider"`, `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`. Keyboard: ArrowUp/Right increase, ArrowDown/Left decrease, Home/End for min/max. Hidden native range input for screen readers.

**Custom properties:** `--ui-circle-size`, `--ui-circle-stroke-width`, and `--ui-circle-fill` are available for consumer override. Size and stroke width are set programmatically on the `:host` element from the `size` and `stroke-width` attributes. `--ui-circle-fill` is CSS-only — set it on the element or an ancestor to override the fill arc colour (defaults to `--ui-accent`).

### 6.22 FABs (Floating Action Buttons)

Primary action buttons with elevated, prominent styling. Three size variants and an expandable menu pattern.

| Property | Token | Value |
|----------|-------|-------|
| Size (small) | `--ui-space-9` | 40px |
| Size (regular) | `--ui-fab-size-regular` | 56px |
| Radius (circular) | `--ui-fab-radius` | 50% |
| Radius (extended) | `--ui-space-7` | 28px (pill) |
| Padding X (extended) | `--ui-space-6` | 24px |
| Icon-label gap | `--ui-space-2` | 8px |
| Font size | `--ui-font-m` | 16px |
| Font weight | — | 500 |
| Shadow | `--ui-shadow-3` | Elevated |

**Variants:**
- **Small** (`.ui-fab--small`): 40px circular. For compact layouts or secondary actions
- **Regular** (`.ui-fab--regular`): 56px circular. Standard MD3 FAB size
- **Extended** (`.ui-fab--extended`): 56px height, pill-shaped with icon + text label. Variable width

**States:** Default (accent background, shadow-3), Hover (`::before` overlay + shadow lift), Pressed (`::before` overlay + scale), Focus (2px ring), Disabled (40% opacity).

**FAB Menu** (`.ui-fab-menu`): Expandable action menu triggered by a FAB. Contains `.ui-btn` children styled with elevated backgrounds.

| Property | Token / Value |
|----------|---------------|
| Gap | `--ui-space-2` (8px) |
| Item background | `--ui-elevated-2` |
| Item shadow | `--ui-shadow-2` |
| Item hover background | `--ui-elevated-3` |
| Offset from FAB | `--ui-space-3` (12px) |
| Animation slide | `--ui-anim-translate` (6px) |
| Animation duration | `--ui-motion-fast` (120ms) |

**Direction:** `.ui-fab-menu--up` (expands above FAB) or `.ui-fab-menu--down` (expands below). Menu is centered horizontally on the FAB via `translateX(-50%)`.

**Toggle:** Add/remove `.ui-fab-menu--open`. Default state: `opacity: 0; pointer-events: none`. Open state: `opacity: 1; pointer-events: auto; translateY(0)`.

**HTML structure:**
```html
<div style="position: relative;">
  <button class="ui-fab ui-fab--small">trigger</button>
  <div class="ui-fab-menu ui-fab-menu--down">
    <button class="ui-btn ui-btn--small">Action 1</button>
    <button class="ui-btn ui-btn--small">Action 2</button>
  </div>
</div>
```

**Close patterns:** Cards are responsible for close logic (click-outside, hover-leave timer, Esc key).

**Colors:** Background `--ui-accent`, text `--ui-text-on-accent`. Theme-specific hover/active colors defined per theme block.

### 6.23 Section Headers

Lightweight horizontal dividers with title and optional actions.

| Property | Token | Value |
|----------|-------|-------|
| Padding Y | `--ui-section-header-padding-y` | `--ui-space-3` (12px) |
| Gap | `--ui-section-header-gap` | `--ui-space-1` (4px) |
| Title font size | `--ui-section-header-title-size` | `--ui-font-xs` (12px) |
| Subtitle font size | `--ui-section-header-subtitle-size` | `--ui-font-s` (~14px) |
| Title font weight | `--ui-font-weight-l` | 500 |
| Title letter spacing | `--ui-font-letter-spacing-m` | 0.5px |
| Title color | `--ui-text-mute` | Muted text |
| Margin bottom | `--ui-space-2` | 8px |

**Structure:** Flex row with `justify-content: space-between`. Title left-aligned (uppercase), optional `.ui-section-header__actions` right-aligned.

**Variants:**
- **Bordered** (`.ui-section-header--bordered`): Bottom border via `--ui-border-color-light`
- **Compact** (`.ui-section-header--compact`): Reduced to 8px padding, 4px margin

### 6.24 Data Rows

Label-value pair rows for structured data display. Seven variants covering compact to relaxed layouts.

| Property | Token | Value |
|----------|-------|-------|
| Gap | `--ui-space-4` | 16px |
| Padding Y | `--ui-space-2` | 8px |
| Font size | `--ui-font-s` | ~14px |
| Label min-width | — | 120px (intentional layout constraint) |
| Label color | `--ui-text-mute` | Muted |
| Label weight | — | 500 |
| Value color | `--ui-text` | Standard text |

**Structure:** Flex row with `justify-content: space-between`, `align-items: baseline`. Label on left, value right-aligned.

**Variants:**
- **Compact** (`.ui-data-row--compact`): 4px padding, 4px gap, 100px label min-width
- **Stacked** (`.ui-data-row--stacked`): Column layout, value left-aligned below label
- **Emphasized** (`.ui-data-row--emphasized`): Value uses `--ui-text-strong` with weight 600
- **Mono** (`.ui-data-row--mono`): Value in monospace font family
- **Bordered** (`.ui-data-row--bordered`): Bottom border, removed on `:last-child`
- **Relaxed** (`.ui-data-row--relaxed`): Extra generous spacing
- **Mobile responsive**: Switches to column layout below 480px viewport

### 6.25 Scrollable Containers

Styled scrollable regions with themed scrollbar appearance.

| Property | Token | Value |
|----------|-------|-------|
| Scrollbar width | `--ui-scrollbar-width` | 6px (documented grid exception) |
| Scrollbar radius | `--ui-radius-s` | 8px |
| Scrollbar border | `--ui-border-width-m` | 2px transparent |
| Thumb color | `--ui-scrollbar-thumb` | Theme-adaptive |
| Thumb hover | `--ui-scrollbar-thumb-hover` | Theme-adaptive |
| Scroll behavior | — | `smooth` |

**Variants:**
- **Vertical** (`.ui-scrollable--vertical`): Vertical-only scrolling
- **Horizontal** (`.ui-scrollable--horizontal`): Horizontal-only scrolling
- **Hidden** (`.ui-scrollable--hidden`): Functional scrolling with invisible scrollbar
- **Compact** (`.ui-scrollable--compact`): 4px scrollbar width/height

Firefox uses `scrollbar-width: thin` with `scrollbar-color`. Webkit uses custom `::-webkit-scrollbar` styles with `background-clip: content-box` for inset appearance.

### 6.26 Badges

Inline tonal labels for status, category, or metadata display. Non-interactive. Pill-shaped capsule with padding-driven height (no fixed height).

| Property | Token | Value |
|----------|-------|-------|
| Padding Y | `--ui-space-2` | 8px |
| Padding X | `--ui-space-3` | 12px |
| Gap | `--ui-space-2` | 8px |
| Radius | `--ui-radius-pill` | 999px |
| Font size | `--ui-font-xs` | ~12px |
| Font weight | — | 500 |
| Line height | `--ui-font-line-height-s` | 1.2 |
| Background | `--_badge-color-faint` | Faint semantic color (fallback `--ui-elevated-2`) |
| Color | `--_badge-color` | Strong semantic color (fallback `--ui-text-mute`) |

**Variants:** `--success`, `--warning`, `--error`, `--info`, `--accent`, `--muted`. Each sets `--_badge-color` and `--_badge-color-faint` to the corresponding semantic colour pair.

**Sub-elements:** `.ui-badge__dot` — 8px (`--ui-space-2`) leading colour dot circle using `--_badge-color`.

**Custom colours:** Set `--_badge-color` and `--_badge-color-faint` via inline style for category colours (e.g. `--ui-cat-teal` / `--ui-cat-teal-faint`).

**Note:** The `--ui-badge-*` tokens in `foundation.js` are for notification dot badges (small red indicators), not these label badges. Label badges use compositional tokens only.

### 6.27 Settings Drawer

Right-side slide-out panel for card settings. Provided by `drawer.js` as an adoptable CSSStyleSheet (`uiDrawer`) + helper functions (`openDrawer`, `closeDrawer`).

| Property | Token / Value | Notes |
|----------|---------------|-------|
| Panel width | `calc(var(--ui-space-10) * 6)` | 288px |
| Panel max-width | 85% | Prevents overflow on narrow viewports |
| Panel radius | `var(--ui-drawer-radius, var(--ui-radius-l))` | Customisable per card; default 18px |
| Panel border | `--ui-border-width-s` solid `--ui-border-color-light` | Left edge only |
| Panel background | `--ui-elevated-2` | |
| Panel z-index | 10 | Above card content |
| Backdrop z-index | 9 | Below panel, above content |
| Backdrop | `--ui-overlay-scrim` | |
| Open animation | 450ms `cubic-bezier(0.22, 1, 0.36, 1)` | Elastic settle |
| Header padding | `--ui-space-3` `--ui-space-4` | |
| Close button | `--ui-space-10` × `--ui-space-10` | 48px touch target |
| Content padding | `--ui-space-4` | Scrollable, hidden scrollbar |
| Row min-height | `--ui-space-10` | 48px touch target |
| Row gap | `--ui-space-3` | Between label and control |
| Group margin | `--ui-space-5` | Bottom spacing between groups |
| Tab min-height | `--ui-space-10` | |
| Tab active | `--ui-accent-faint` bg, `--ui-accent` text | |
| FAB trigger | `ui-fab--regular` with spring entrance | Hover-to-show, always visible on touch |

**Sub-elements:** `.ui-drawer__header`, `__title`, `__close`, `__content`, `__tabs`, `__tab`, `__section`, `__group`, `__row`, `__label`, `__value`. Optional `.ui-drawer__group--bordered` adds bottom divider.

**Customisation:** Set `--ui-drawer-radius` on the card container to match the card's own `border-radius`.

**Settings persistence** is card-managed — the drawer provides layout only. Cards typically use HA `input_*` helpers with a `HELPERS` constant mapping and immediate-local + async-write pattern.

---

## 7. Layout System

**Grid system:** Consistent gaps via `--ui-layout-row-gap` and `--ui-layout-col-gap`. Cards minimum 260px wide, expand fluidly.

**Sections:** Major sections separated by `--ui-layout-section-gap` (16px). Nested cards use `--ui-layout-card-padding`.

**Z-indices:** `--ui-z-tooltip`, `--ui-z-menu`, `--ui-z-dialog`, `--ui-z-toast`, `--ui-z-max` for layering.

---

## 8. Interaction Patterns

Interactive elements share a consistent state model:

1. **Default** – base appearance
2. **Hover** – overlay with `--ui-state-hover`; subtle translation if floating
3. **Pressed/Active** – overlay with `--ui-state-pressed`; translation resets
4. **Focus** – 2px outline using `--ui-state-focus-ring`; always visible, not animated
5. **Disabled** – opacity reduced by `--ui-state-disabled-opacity`; interactions disabled

Motion uses `--ui-motion-fast`, `--ui-motion-med`, or `--ui-motion-slow` depending on complexity. All motion suppressible via `prefers-reduced-motion`.

---

## 9. Theme System

Light and dark themes via `.light-theme` and `.dark-theme` classes on the card element (`:host`). All colours adapt via tokens. Switching themes updates all surfaces, text, accents, semantic roles, elevation colours, shadows, state layers, overlays, and component-specific colors.

**Implementation:**
- Cards must call `applyThemeClass(this, hass)` in their `set hass()` method
- This reads `hass.themes.darkMode` and applies the appropriate class
- Foundation.js provides `:host(.dark-theme)` and `:host(.light-theme)` selectors
- Fallback: `@media (prefers-color-scheme: dark)` applies when no explicit class is set (for standalone usage outside HA)

---

## 10. Accessibility

- **Touch targets:** Minimum 48px dimension
- **Contrast:** WCAG AA for text and icons in both themes
- **Focus management:** All interactive components focusable with clear focus rings
- **Reduced motion:** Respect user settings by reducing motion to immediate transitions
- **Keyboard support:** Native inputs or ARIA roles; all components operable with keyboard alone
- **High contrast mode:** `@media (forced-colors: active)` support in `components.js`. Buttons, FABs, inputs, switches, sliders, menus, tabs, and focus rings adapt to system-enforced colors. Borders become visible where normally transparent

---

## 11. Version History

**Version 2.2 (Apr 2026):** Audit corrections. Fixed `--ui-state-ring-spread` from 8px to 6px (matching foundation.js). Fixed §5.2 radius usage column to match actual component usage (cards and inputs use `--ui-radius-xl`, buttons use `--ui-radius-pill`). Added `--ui-circle-slider-bounce` to §5.5 motion table. Added `--ui-section-header-subtitle-size` to §6.23. Added `--ui-font-family` note to §5.4. Added `--ui-border-style` to §5.3. Added overlay/scrim token table to §5.7. Fixed v1.9 changelog modal surface from `--ui-elevated-3` to `--ui-elevated-2` (matching implementation).

**Version 2.1 (Mar 2026):** Input field variants: added `.ui-input--textarea` and `.ui-input--textarea-lg` (promoted from prompt-manager card-specific CSS to shared system), added `.ui-input--quiet` (label fades on populate, for inline-edit contexts). Circular slider (§6.21): renamed `type="light"` to `type="interactive"` (legacy accepted), added `--ui-circle-fill` consumer-overridable fill colour with `--ui-accent` fallback and smooth stroke transition, changed default unit from `"%"` to `""`, documented all three custom properties.

**Version 2.0 (Mar 2026):** Full sweep. Added easing curve tokens (`--ui-ease-spring`, `--ui-ease-spring-heavy`, `--ui-ease-bounce`) and animation parameter tokens to §5.5. Added layout header/footer padding to §5.6. Added accent pink tokens (`--ui-pink`, `--ui-pink-soft`, `--ui-spinner-color`, `--ui-slider-rollback`) and activity color tokens to §5.7. Added z-index scale (§5.8) and icon size tokens (§5.9). Added missing slider tokens to §6.7 (`--ui-slider-thumb-height`, `--ui-slider-motion-duration`, `--ui-slider-motion-easing`, `--ui-slider-vertical-height`, `--ui-slider-value-offset-y/x`). Added toast close/z-index tokens to §6.13. Fixed tooltips.md cross-reference from §6.8 to §6.11.

**Version 1.9 (Mar 2026):** Expanded modal specification (§6.12) from token table to full component spec — added structure, motion tokens, behaviour, ARIA, focus trap, light-DOM note. Fixed modal surface from ambiguous "elevated-2 or elevated-3" to definitive `--ui-elevated-2` and shadow from `--ui-shadow-3` to `--ui-shadow-4` (matching implementation). Fixed drawer default radius (§6.27) from `--ui-radius-xl` to `--ui-radius-l` (18px) — practice-proven across consuming cards. Updated authoring.md modal motion example from generic `--ui-motion-med` to dedicated `--ui-modal-motion-in/out` tokens.

**Version 1.8 (Feb 2026):** Added clearable input variant (`.ui-input--clearable`) with `.ui-input__clear` button — 48px touch target, 4-step wobble pop-in animation (400ms `--ui-ease-spring-heavy`), `--ui-error-soft` default color transitioning to `--ui-error` on focus/hover with scale-up, pink border pulse on clear (`--ui-pink` snap → `--ui-accent` fade). CSS-driven visibility via `.has-value`, reduced motion support. Extended `initInputs()` with init guard and clear button wiring. Added `--ui-pink-soft` token. Prompt-manager card migrated from custom `.clear-button` to shared variant; eliminated all `color-mix()` usage. Created `docs/componentry/clearable-input.md` for timing exceptions.

**Version 1.7 (Feb 2026):** Audit-driven cleanup. Fixed `--ui-section-header-title-size` token to `--ui-font-xs` (was `--ui-font-m`); implementation now consumes the token. Fixed `--ui-layout-card-padding` to `--ui-space-6` (was `--ui-space-4`); `.ui-card` now consumes the token. Tab bar default min-height raised to `--ui-space-10` (48px) matching pill variant and 48px touch target rule. Fixed tooltip caret fallback color to match tooltip background (`rgb(40, 43, 54)`). Added `--ui-state-ring-spread` token (8px) consumed by all hover/pressed state rings across buttons, FABs, sliders, toggles, checkboxes, and radios. Removed orphaned `--ui-fab-size` token, List Row tokens (`--ui-listrow-*`), and Empty State tokens (`--ui-emptystate-*`). Section 6.27 removed. Deleted `prompt-manager.js.bak`. Added `--ui-progress-depth-shadow` and `--ui-progress-highlight-shadow` tokens replacing hard-coded rgba in progress bars. Created `docs/componentry/screen-border.md` documenting timing/scale exceptions. Added `--ui-pink-soft` token. Fixed prompt-manager hard-coded pink and color-mix violations to use tokens. Added `--ui-focus-outline-offset` token (2px) — replaced 22 hard-coded `outline-offset: 2px` instances across foundation.js, components.js, toggles.js, checkboxes.js, and radios.js. Added slider `:focus-visible` ring on thumb via `:has()` selector. Tokenized slider edge-carving threshold in helpers.js. Documented slider 5px gap-rest override as intentional exception in §6.7. Added modal motion tokens (`--ui-modal-motion-in`, `--ui-modal-motion-out`, `--ui-modal-backdrop-in`, `--ui-modal-backdrop-out`). Replaced `--ui-toast-duration-in/out` with `--ui-toast-motion-in/out` (full shorthand with easing; corrected in-duration from 180ms to 600ms to match implementation). All hard-coded timings in modals.js and toasts.js now token-referenced.

**Version 1.6 (Feb 2026):** Added badge label component (section 6.26). Pill-shaped tonal inline labels with semantic colour variants, custom colour support via `--_badge-color` / `--_badge-color-faint`, and optional leading dot. Compositional design (no dedicated tokens). Updated radii table — badges use `--ui-radius-pill`, not `--ui-radius-s`.

**Version 1.5 (Feb 2026):** Circular slider rollback indicator enabled on all variants. Light mode previously suppressed the rollback arc; now both number and light variants show the pink rollback indicator when dragging to decrease.

**Version 1.4 (Feb 2026):** Audit-driven update. Promoted FABs (6.22) and section headers (6.23) from "not yet implemented" to full spec sections with accurate values. Added data row (6.24) and scrollable container (6.25) spec sections. Fixed dark shadow values to match foundation.js (0.30/0.35/0.40/0.50). Updated checkbox/radio motion from 200ms to 320ms. Corrected checkbox/radio disabled opacity from 38% to 40%. Documented dark theme focus ring as intentionally solid. Removed progress bars from "not yet implemented" (already covered in 6.6).

**Version 1.3 (Feb 2026):** Added circular slider component specification (section 6.21). Documented `ui-input` and `ui-tap` event patterns in authoring guide.

**Version 1.2 (Feb 2026):** Added 8 category colour tokens (`--ui-cat-teal` through `--ui-cat-slate`) with `-faint` variants, theme-adaptive. Added tab bar pill and coloured variants (`.ui-tab-bar--pill`, `.ui-tab-bar--colored`). Documented tab bar component specification.

**Version 1.1 (Feb 2025):** Added tier/grade color tokens (`--ui-tier-a` through `--ui-tier-d`). Added animation scale tokens (`--ui-anim-scale-subtle`, `--ui-switch-icon-scale`). Documented button size modifiers and programmatic state classes.

**Version 1.0 (Dec 2024):** Initial complete specification. Fixed elevation tiers, expressive slider geometry, split buttons, full token taxonomy, comprehensive component specifications.
