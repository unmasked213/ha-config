# CLAUDE - Shared UI Design System

> **AI Briefing** — This file contains binding rules for AI assistants working on this system.
> Read this first, then consult referenced files for detail.

## Summary

This is the design system governing all custom Lovelace cards and UI components in `www/base/`. It defines a strict token-based architecture where every visual value (color, spacing, radius, elevation, motion) derives from `foundation.js` tokens, ensuring theme-adaptive consistency across light and dark modes.

---

## Structure

### `www/base/` — Core runtime files

| File | Description |
|------|-------------|
| `foundation.js` | READ-ONLY token source of truth (colors, spacing, radius, elevation, motion) |
| `components.js` | Shared UI components — check for existing patterns before creating new ones |
| `helpers.js` | Component init (inputs, sliders), `applyThemeClass()`, `callService()`, `sleep()`, HA helper readers (`getHelperNumber`, `getHelperBoolean`, `getHelperSelect`, `persistHelper`) |
| `modals.js` | Modal/dialog components |
| `templates.js` | Template rendering system |
| `templates.test.js` | Tests for the template system |
| `tooltips.js` | Tooltip components (has documented timing exceptions) |
| `toasts.js` | Toast notification components |
| `toggles.js` | Toggle/switch components |
| `checkboxes.js` | Checkbox components |
| `radios.js` | Radio button components |
| `skeletons.js` | Skeleton loading-state components |
| `drawer.js` | Drawer panel — right-side slide-out with backdrop, header, tabs, groups/rows. Used for settings and contextual content viewers. |
| `number-input.js` | Number input — compact numeric stepper pill with expanding chevrons, momentum hold, scroll, inline edit. Custom element `<ui-number-input>`. |
| `screen-border.js` | Screen border effect component |
| `utilities.js` | Pure functions: formatting, validation, string/colour manipulation, `escapeHtml` |
| `README.md` | UI system index and project map |

### `www/base/docs/` — Documentation

| File | Description |
|------|-------------|
| `CLAUDE.md` | This file — binding rules for AI assistants |
| `spec.md` | Full system definition: constraints, tokens, component specs |
| `authoring.md` | Component creation patterns and guidelines |
| `componentry/tooltips.md` | Tooltip exception documentation and architectural traps |
| `componentry/screen-border.md` | Screen border timing/scale exception documentation |
| `componentry/clearable-input.md` | Clearable input timing exception documentation |
| `componentry/number-input.md` | Number input component specification and timing exceptions |

---

## Key Components

| File | Authority | Purpose |
|------|-----------|---------|
| `foundation.js` | READ-ONLY | Single source of truth for tokens |
| `docs/spec.md` | Reference | System definition — constraints, tokens, components |
| `docs/authoring.md` | Reference | Component creation patterns |
| `docs/componentry/tooltips.md` | Reference | Tooltip exception documentation |
| `docs/componentry/screen-border.md` | Reference | Screen border timing/scale exception documentation |
| `docs/componentry/clearable-input.md` | Reference | Clearable input timing exception documentation |
| `docs/componentry/number-input.md` | Reference | Number input spec and timing exceptions |
| `components.js` | Precedent | Check for existing patterns |

### Document Authority Chain

When sources conflict, higher rank overrides lower unconditionally.

1. `www/base/foundation.js` - CANONICAL (token values)
2. `www/base/docs/CLAUDE.md` - BINDING (AI rules, decision trees)
3. `www/base/docs/spec.md` - DEFINITIVE (system specification)
4. `www/base/docs/authoring.md` - PRESCRIPTIVE (authoring patterns)
5. `www/base/docs/componentry/*.md` - EXCEPTION (component-specific overrides)
6. `www/base/components.js` - PRECEDENT (existing implementation patterns)

### Critical Geometry

These dimensions are immutable:

| Component | Property | Value |
|-----------|----------|-------|
| Button | Height | 40px (`--ui-space-9`) |
| Button | Padding X | 20px (`--ui-space-5`) |
| Input | Height | 40px (`--ui-input-height`) |
| Switch | Track | 48x32px |
| Menu item | Height | 50px (`--ui-menu-item-height`) |
| Touch target | Minimum | 48px (no exceptions) |

### State Model

All interactive components use identical states:

| State | Implementation |
|-------|----------------|
| Hover | `--ui-state-hover` overlay |
| Pressed | `--ui-state-pressed` overlay |
| Active | `--ui-state-active` overlay |
| Focus | `--ui-state-focus-ring` (2px ring) |
| Disabled | `--ui-state-disabled-opacity` (40%) |

### Gotchas

**Accent pink.** `--ui-pink` (rgb(255, 46, 146)) is shared across spinners, slider rollback, toast borders, and toast icons. Not a semantic role - it's the system's accent-pink utility colour.

**Compositional vs dedicated tokens.** Most components derive geometry from base spacing/radius tokens. Only inputs, switches, sliders, menus, modals, tooltips, toasts, badges, progress bars, chips, controls (checkbox/radio), skeletons, split buttons, and FABs have dedicated component tokens. If a component isn't on that list, compose from base tokens.

---

## Development Workflows

### Validation Checklist

Before submitting code:

- [ ] All colors traced to theme-adaptive tokens
- [ ] All spacing uses `--ui-space-*` scale
- [ ] All radii use `--ui-radius-*` scale
- [ ] All timing uses `--ui-motion-*` tokens (or documented exceptions)
- [ ] Component geometry uses fixed dimensions
- [ ] State model uses `--ui-state-*` tokens
- [ ] Both themes tested and verified
- [ ] Cards call `applyThemeClass(this, hass)` in `set hass()`
- [ ] Touch targets meet 48px minimum
- [ ] 0% arbitrary values

### Decision Trees

#### Spacing

```
1. Component-specific token exists? -> Use it (e.g., --ui-btn-gap)
2. Layout token applies? -> Use it (e.g., --ui-layout-row-gap)
3. Icon and text? -> --ui-space-2 (8px)
4. Tightly related elements? -> --ui-space-2 (8px)
5. Separate controls in same group? -> --ui-space-4 (16px)
6. Separate sections? -> --ui-space-6 (24px)
7. Otherwise -> --ui-space-4 (16px)
```

#### Radius

```
1. Component-specific token exists? -> Use it (--ui-menu-radius, --ui-chip-radius)
2. Button or badge? -> --ui-radius-pill (999px)
3. Card? -> --ui-radius-m (12px)
4. Menu? -> --ui-radius-xl (32px)
5. Chip/pill? -> --ui-radius-pill (999px)
6. Otherwise -> --ui-radius-m (12px)
```

#### Color

```
Interactive element:
  Primary action -> --ui-accent
  Destructive -> --ui-error
  Confirmation -> --ui-success
  Caution -> --ui-warning
  Info -> --ui-info

Text:
  Main -> --ui-text
  Supporting -> --ui-text-mute
  Emphasized -> --ui-text-strong

Surface:
  Base -> --ui-surface or --ui-elevated-0
  Slight lift -> --ui-elevated-1
  Card -> --ui-surface or --ui-elevated-1
  Elevated panel -> --ui-elevated-3
  Floating -> --ui-elevated-4

Border:
  Subtle -> --ui-border-color-light
  Standard -> --ui-border-color-med
  Emphasized -> --ui-border-color-strong
```

#### Elevation

```
Higher elevation = higher surface tier + stronger shadow

Standard card -> --ui-surface + no shadow
Elevated card -> --ui-elevated-2 or -3 + --ui-shadow-3
Floating menu -> --ui-elevated-4 + --ui-shadow-4
Tooltip -> --ui-tooltip-bg + --ui-shadow-4
```

### Query Protocols

#### When to Query

Query when:
- Multiple valid token choices exist with no clear hierarchy
- User instruction conflicts with immutable constraint
- Context genuinely ambiguous after decision trees
- Edge case has no defined fallback

Do not query for:
- Choices fully defined in spec
- Choices covered by decision trees
- Situations with defined defaults

#### How to Query

1. State what you're implementing
2. Identify the ambiguity
3. Present 2-3 token-based options
4. Explain trade-offs
5. Recommend option with rationale
6. Ask user to choose

**Example:**
"I'm implementing card spacing. The spec provides:
- Option A: --ui-space-3 (12px, compact)
- Option B: --ui-space-4 (16px, standard, recommended)

I recommend Option B as it uses --ui-layout-card-padding which is the system default. Does this work?"

### Conflict Resolution

#### Touch Target vs Visual Design

**Conflict:** Visual design calls for smaller element, but 48px minimum required.

**Resolution:**
1. Maintain 48px touch target (immutable)
2. Use transparent padding to extend hit area
3. Visual appearance can be smaller if hit area remains valid

#### User Instruction Conflicts

**Conflict:** User requests behavior that violates constraints.

**Resolution:**
1. Identify specific constraint being violated
2. Explain why constraint exists and cite token
3. Offer compliant alternative
4. Never silently implement non-compliant solution

**Example:**
- User: "Make buttons stretch to full width"
- Violation: Component geometry invariance
- Response: "Buttons use fixed dimensions per the token system. I can arrange buttons in a flex container or adjust padding within token constraints, but buttons cannot stretch elastically."

#### Spacing Conflicts

**Conflict:** Multiple spacing rules could apply.

**Resolution priority:**
1. Component-specific tokens
2. Layout tokens
3. Base spacing tokens
4. Default to --ui-space-4 (16px)

#### Color Contrast Conflicts

**Conflict:** Color fails contrast requirements.

**Resolution:**
1. Verify correct surface token is being used
2. Check if alternative text role exists (--ui-text-strong vs --ui-text)
3. Verify theme is correctly applied
4. Document issue but implement as specified
5. Never invent custom colors to "fix" contrast

---

## Conventions for AI Assistants

### Priority Hierarchy

When implementation decisions conflict, apply this order:

1. **Safety and accessibility** — Touch targets >=48px, WCAG contrast, focus visibility, keyboard navigation
2. **Immutable geometry** — Component dimensions fixed, token-only values
3. **Token system adherence** — All values from `foundation.js` only
4. **State model consistency** — Identical behavior across all components
5. **Theme equality** — Light and dark themes receive equal quality
6. **User instruction** — Only after constraints 1-5 satisfied

User instructions that violate priorities 1-5 must be rejected or modified to comply.

### Token-Only Rule

ALL values must derive from defined tokens in `foundation.js`.

**Forbidden:**
- Arbitrary pixel values (7px, 15px, 23px)
- Unlisted colors or custom hex values
- Custom timing values (unless documented as component exceptions — see `tooltips.md`)
- Interpolated spacing between tokens
- Color-mix or computed blends
- Patterns from Tailwind, MUI, Bootstrap

**Required:**
- Use exact token values only
- If no token fits, select nearest defined token
- Document gap but do not create custom values

### Token Governance

`foundation.js` is **READ-ONLY**.

- Never regenerate, reformat, or rewrite without explicit instruction
- Reference tokens by name only, never reproduce token blocks from memory
- Propose changes in prose first, wait for approval
- Never guess token values — verify against the file

### Anti-Patterns

Never do:

- Default to Bootstrap, Material UI, or Tailwind patterns
- Interpolate between token values
- Create variants not in spec (check spec.md for defined variants before adding new ones)
- Use similar but not identical values (16px not 15px)
- Design only for one theme
- Use color-mix for elevation or state layers
- Re-render entire component to update state (breaks CSS animations)
- Invent new semantic color roles
- Use custom easing curves outside motion scale

### Decision Heuristics

**Spacing:** When ambiguous, default to `--ui-space-4` (16px). Icon-to-text gap is always `--ui-space-2` (8px).

**Radius:** Buttons use `--ui-radius-pill`. Badges use `--ui-radius-pill`. Cards use `--ui-radius-m`. Menus use `--ui-radius-xl`. Use component-specific token when available.

**Color:** Choose by semantic role, not aesthetics. Primary actions use `--ui-accent`. Destructive uses `--ui-error`. Confirmation uses `--ui-success`. Tier/grade ratings use `--ui-tier-a` through `--ui-tier-d`. Category/classification systems use `--ui-cat-teal` through `--ui-cat-slate` (with `-faint` variants for backgrounds).

**Elevation:** Higher elevation = higher surface tier + stronger shadow. Cards use `--ui-surface`. Menus use `--ui-elevated-4` + `--ui-shadow-4`.

**Conflicts:** If user instruction violates constraints 1-5, explain the constraint, cite the token, offer compliant alternative. Never silently implement non-compliant solution.

### Fallback Logic

#### Missing Token

1. Check if adjacent token can be used
2. Round to nearest valid token
3. Use contextual default (spacing -> --ui-space-4, radius -> --ui-radius-m)
4. Document gap
5. Never invent custom value

#### Ambiguous Component Choice

1. Default to standard variant
2. Prefer simpler over complex
3. Query user if genuinely ambiguous

#### Missing Color Role

1. Check if existing semantic color applies
2. Use transparency variant (-soft or -faint)
3. Use nearest surface tier
4. Never invent new colors

### Communication

- Direct communication, no apologies or thanks
- Precision over approximation
- When user says "artifact" -> immediately invoke, no discussion
- No social pleasantries

### For Detail

**Full constraint documentation:** `docs/spec.md` sections 3-4

**Component specifications:** `docs/spec.md` section 6

**Building new components:** `docs/authoring.md`

**Tooltip architectural traps:** `docs/componentry/tooltips.md`

**Screen border timing exceptions:** `docs/componentry/screen-border.md`

**Clearable input timing exceptions:** `docs/componentry/clearable-input.md`

**Number input component spec:** `docs/componentry/number-input.md`

---

## TODOs & Gaps

None currently identified.

---

## Changelog

| Date | Commit | Change |
|------|--------|--------|
| 2026-04-10 | — | Added Document Authority Chain (6-tier hierarchy), Gotchas section (accent pink, compositional vs dedicated tokens) |
| 2026-03-25 | — | Full sweep: added number-input.md to "For Detail" section, added `callService`/`sleep` to helpers.js description |
| 2026-03-23 | — | Added `number-input.js` to Structure and Key Components tables, added `componentry/number-input.md` to docs table |
| 2026-02-24 | b350903 | Restructured to 8-section format |

---

*Last Updated: 2026-04-10*
