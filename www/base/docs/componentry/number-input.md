# Number Input Component Specification

---

## 1. Overview

A compact numeric stepper that rests as a static pill indistinguishable from the existing settings pill controls (`--ui-elevated-2` background, `--ui-radius-xl` corners). On activation, the pill expands symmetrically from its centre to reveal chevron buttons at each edge. Supports single-tap stepping, momentum hold acceleration, scroll wheel adjustment, and inline text entry. Collapses back to its resting state on outside tap.

The component occupies a reserved outer width at all times so that expansion never shifts surrounding layout. This makes it a drop-in replacement for the current static number pills in settings panels and drawers.

---

## 2. Geometry

### 2.1 Resting state

| Property | Token | Value |
|----------|-------|-------|
| Width | - | 100px (matches existing settings pills) |
| Height | `--ui-space-10` | 48px |
| Background | `--ui-input-bg` | Theme-adaptive |
| Border radius | `--ui-radius-xl` | 32px |
| Border | - | 3px transparent (reserves space for focus border) |
| Font size | `--ui-font-m` | 16px |
| Font weight | `--ui-font-weight-m` | 400 |
| Text colour | `--ui-text` | Theme-adaptive |

### 2.2 Active state

| Property | Token | Value |
|----------|-------|-------|
| Width | - | 136px |
| Chevron zone width | `--ui-space-8` | 32px each side |
| Border | `--ui-border-width-l` + `--ui-accent` | 3px solid accent |

The centre value area fills the remaining flex space between the two chevron zones. No dividers are rendered.

### 2.3 Outer wrapper

The outer wrapper is a non-visual container fixed at 136px (the active width). It centres the pill horizontally so growth is symmetric. The wrapper itself has no background, border, or shadow.

### 2.4 Range indicator bar

Appears at the base of the centre value area when active and not in text-editing mode.

| Property | Token | Value |
|----------|-------|-------|
| Height | - | 2px |
| Inset (left/right) | `--ui-space-3` | 12px from each edge of centre area |
| Bottom offset | `--ui-space-1` | 4px from bottom of centre area |
| Track colour | `--ui-border-color-light` | Theme-adaptive |
| Fill colour | `--ui-accent` | Theme-adaptive |
| Track radius | `--ui-radius-pill` | 999px |
| Fill radius | `--ui-radius-pill` | 999px |

The fill width represents `(value - min) / (max - min)` as a percentage.

---

## 3. States

### 3.1 Rest

The default presentation. Pill at 100px, 3px transparent border, no chevrons visible, no range indicator. Cursor: `pointer`. Visually identical to the existing static number pills. A single number is centred in the pill.

### 3.2 Active

Entered on tap/click of the resting pill, or on scroll wheel over the resting pill. Pill expands to 136px from centre. Chevron zones fade in at each edge (no dividers). Border transitions from transparent to 3px accent (`--ui-border-width-l` + `--ui-accent`). Cursor: `default` on the pill body, `pointer` on chevron zones. The range indicator remains hidden until the value is changed (see `.has-interacted` state class).

**Single active instance:** Only one `<ui-number-input>` may be active at a time. Activating any instance deactivates the previously active one. This prevents multiple expanded fields on the same page.

**Inactivity auto-collapse:** When activated implicitly (via scroll without a direct click/tap), a 4-second inactivity timer starts. If the user does not interact further and the timer expires, the component deactivates automatically. Any direct interaction (click, tap, zone press) cancels the timer permanently for that activation. Each scroll tick resets the timer.

Exited by tapping/clicking outside the component, by another instance activating, or by inactivity timeout.

### 3.3 Holding

Entered when a pointer is held down on either chevron zone while active. The chevron zone receives `--ui-state-pressed` background. The chevron icon colour transitions from `--ui-text-mute` to `--ui-pink`. The chevron icon scales up to 1.25×. The range indicator fill tracks the value in real time at 90ms intervals.

Exited on pointer up, pointer leave, or pointer cancel. Background, icon colour, and scale revert with a smooth fade-out (`--ui-motion-fast`).

### 3.4 Editing

Entered by tapping/clicking the centre value area while active. The numeric display is replaced by a native text input with `inputMode="numeric"`. Text colour remains `--ui-text`. Caret colour inherits from text colour. The range indicator hides during editing.

Exited on Enter (commits), Escape (cancels, reverts to pre-edit value), or blur (commits, deferred by one frame to allow zone pointer events to complete). Invalid input (non-numeric, out of range) is clamped to `[min, max]` on commit. Tapping a chevron zone while editing commits the typed value, steps from it, and remains in editing mode (keyboard stays visible on iOS/iPadOS).

### 3.5 Disabled

The entire component receives `--ui-state-disabled-opacity` (0.4) and `pointer-events: none`. No interaction is possible. The pill renders at rest width with the current value displayed.

### 3.6 At limits

When the value equals `min`, the down chevron zone receives `--ui-state-disabled-opacity` (0.4) and its cursor becomes `default`. Likewise for `max` and the up chevron. The momentum hold system will not fire ticks beyond the limits. Scroll events are ignored at limits for the respective direction.

---

## 4. Interaction

### 4.1 Tap to activate

A single tap on the resting pill transitions to active state. The tap itself does not change the value.

### 4.2 Single-step

A single tap on an active chevron zone increments or decrements the value by the `step` attribute (default 1). If the current value is not aligned to the step grid (e.g. value 9.4, step 0.5), the first tap snaps to the nearest step boundary in the tap direction (9.4 → 9.5 up, 9.4 → 9.0 down). Subsequent taps step normally. Each tap fires a single `ui-change` event.

### 4.3 Momentum hold

Holding a pointer down on an active chevron zone starts a repeating interval at 90ms per tick. The step size accelerates based on tick count:

| Tick range | Step size |
|------------|-----------|
| 1 - 5 | 1 |
| 6 - 17 | 2 |
| 18 - 34 | 5 |
| 35+ | 10 |

Each tick fires a `ui-input` event (live feedback). On pointer release, a single `ui-change` event fires with the final committed value.

The interval is cleared on `pointerup`, `pointerleave`, and `pointercancel`. Tick count resets to zero.

### 4.4 Scroll wheel

Scroll events over the component adjust the value by the `step` attribute per wheel tick (with the same snap-to-step behaviour as single taps). `deltaY < 0` increments (scroll up = value up). `deltaY > 0` decrements. Each scroll tick fires a `ui-change` event.

If the component is at rest, scrolling activates it implicitly (starts inactivity auto-collapse timer). Each scroll tick resets the timer. This matches the circle slider behaviour.

`preventDefault()` is called on handled wheel events to suppress page scroll.

Scroll has no effect when the component is disabled or in editing mode.

### 4.5 Inline text entry

Tapping the centre value area while active enters editing mode. The caret is placed at the end of the value (no selection). On commit, the raw string is parsed as a float and clamped to `[min, max]`. If parsing fails (empty string, non-numeric), the value reverts to the pre-edit value.

The input accepts digits, decimal point, and minus sign only. Other characters are stripped on each keystroke. The `inputmode` is `decimal` for mobile keyboards with a decimal point key.

Focus is set synchronously within the user gesture so that iOS/iPadOS opens the software keyboard on the first tap.

### 4.6 Outside tap

A `pointerdown` event on any element outside the component's root boundary exits the active state. If editing, the edit is committed before collapsing. The pill transitions back to rest width with transparent border.

---

## 5. Motion

### 5.1 Expansion/collapse

| Property | Duration | Easing | Token |
|----------|----------|--------|-------|
| Width | 240ms | Spring | `--ui-ease-spring` |
| Chevron zone width | 240ms | Spring | `--ui-ease-spring` |
| Chevron opacity | 240ms | Spring | `--ui-ease-spring` |

The 240ms duration matches `--ui-motion-med`. The spring easing provides overshoot on expand and a snappy settle on collapse.

### 5.2 Chevron pop-in

Chevrons start at `scale(0)` when at rest and play a 3-step wobble animation on activate:

| Step | Transform |
|------|-----------|
| 0% | `scale(0)` |
| 50% | `scale(1.1)` |
| 75% | `scale(0.95)` |
| 100% | `scale(1)` |

| Property | Value | Token |
|----------|-------|-------|
| Duration | 400ms | — (timing exception, see §12) |
| Easing | `--ui-ease-spring-heavy` | Token-sourced |
| Delay | 160ms | — (timing exception, see §12) |
| Fill mode | `backwards` | Holds `scale(0)` during delay |

The delay ensures chevrons pop in after the pill has visibly expanded. Uses `backwards` fill (not `forwards`) so CSS `transform` can be overridden by pink flash state after animation completes.

### 5.3 Chevron pink flash

On tap, scroll, or hold, the active chevron flashes `--ui-pink` and scales to 1.25×:

| Property | On (entering flash) | Off (leaving flash) |
|----------|---------------------|---------------------|
| Colour | 0ms (instant) | `--ui-motion-fast` (120ms fade) |
| Scale | 0ms (instant) | `--ui-motion-fast` (120ms shrink) |
| Linger | 600ms before removal | — |

The flash class (`.is-tapped-*`, `.is-scrolling-*`) is applied for 600ms, then removed. The CSS transition on the base state provides the smooth fade-out.

### 5.4 Border

| Property | Duration | Easing | Token |
|----------|----------|--------|-------|
| Border colour | 120ms | Standard | `--ui-motion-fast` |

Transitions from transparent to `--ui-accent` on activate, reverses on deactivate.

### 5.5 Chevron zone press feedback

| Property | Duration | Easing | Token |
|----------|----------|--------|-------|
| Background colour | 120ms | Standard | `--ui-motion-fast` |

Background transitions from transparent to `--ui-state-pressed` on hold, reverts on release.

### 5.6 Range indicator fill

| Property | Duration | Easing | Condition |
|----------|----------|--------|-----------|
| Width | 90ms | Linear | During momentum hold |
| Width | 240ms | Standard | On discrete step or scroll (`--ui-motion-med`) |

During momentum hold, the fill tracks at interval speed (90ms linear) for fluid feedback. On single steps, it uses the standard transition.

### 5.7 Range indicator visibility

The range indicator is hidden until the value has been changed (`.has-interacted` class). Once shown, it hides during editing and resets on deactivate.

### 5.8 Reduced motion

All transitions and animations honour `prefers-reduced-motion: reduce`. Under reduced motion, width changes are instant, border colour changes are instant, and the range indicator snaps without transition.

---

## 6. Accessibility

### 6.1 ARIA

| Attribute | Value |
|-----------|-------|
| `role` | `spinbutton` |
| `aria-valuenow` | Current value |
| `aria-valuemin` | Minimum value |
| `aria-valuemax` | Maximum value |
| `aria-label` | Provided by consuming context (e.g. "Active rows") |
| `aria-disabled` | `"true"` when disabled, omitted otherwise |

### 6.2 Keyboard

| Key | Action | Context |
|-----|--------|---------|
| Enter | Activate (if rest), commit edit (if editing) | Any |
| Escape | Cancel edit (if editing), deactivate (if active) | Active/editing |
| Arrow Up | Increment by `step` | Active |
| Arrow Down | Decrement by `step` | Active |
| Page Up | Increment by `step × 10` | Active |
| Page Down | Decrement by `step × 10` | Active |
| Home | Set to min | Active |
| End | Set to max | Active |
| Tab | Move focus to next element (deactivates) | Any |

### 6.3 Focus

The component is focusable via keyboard (`tabindex="0"` on the root). Focus-visible styling applies the same 3px accent border as the active state: `--ui-border-width-l` solid `--ui-accent`. Receiving keyboard focus also activates the component (reveals chevrons).

### 6.4 Touch targets

Both chevron zones are 32px wide and 48px tall (full pill height), meeting the 48px minimum touch target in the vertical axis. The 32px horizontal dimension is below 48px, but the zones are flush with the pill edges, providing an effective target that extends to the pill's rounded corners.

The centre value area touch target spans the remaining width and full height.

### 6.5 Screen readers

Value changes during momentum hold are debounced for screen reader announcements. A live region with `aria-live="polite"` announces the value on commit (pointer release or single step), not on every tick.

---

## 7. Events

| Event | Fires when | Detail |
|-------|------------|--------|
| `ui-change` | Value committed (single tap, scroll, edit commit, hold release) | `{ value: number }` |
| `ui-input` | Value changes during momentum hold (each tick) | `{ value: number }` |

Events bubble and are composed (cross shadow DOM boundaries).

---

## 8. API

### 8.1 Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | number | `0` | Current value (supports decimals) |
| `min` | number | `0` | Minimum allowed value |
| `max` | number | `100` | Maximum allowed value |
| `step` | number | `1` | Step size for tap, scroll, and keyboard. Determines display precision (step=0.5 shows one decimal). Minimum 0.01. |
| `disabled` | boolean | `false` | Disables all interaction |

### 8.2 Properties

All attributes are reflected as properties with the same names and types.

### 8.3 CSS custom properties (component-specific)

These are proposed additions to `foundation.js`. Actual addition requires approval.

| Token | Value | Rationale |
|-------|-------|-----------|
| `--ui-number-input-rest-width` | 100px | Matches existing settings pill width |
| `--ui-number-input-active-width` | 136px | Rest width + 2 chevron zones (32px) + 4px tolerance |
| `--ui-number-input-zone-width` | `var(--ui-space-8)` | 32px chevron zone, derived from spacing scale |

If these are rejected, the values are hardcoded as documented constants within the component file with a comment referencing this spec.

---

## 9. DOM Structure

```html
<!-- Outer wrapper: reserves active width, centres pill -->
<div class="ui-number-input" role="spinbutton"
     aria-valuenow="5" aria-valuemin="1" aria-valuemax="20"
     tabindex="0">

  <!-- Inner pill: transitions between rest and active width -->
  <div class="ui-number-input__pill">

    <!-- Left chevron zone (hidden at rest) -->
    <button class="ui-number-input__zone ui-number-input__zone--down"
            aria-label="Decrease" tabindex="-1">
      <svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5.797 7a1 1 0 0 0-.778 1.628l3.814 4.723a1.5 1.5 0 0 0 2.334 0l3.815-4.723A1 1 0 0 0 14.204 7z"/>
      </svg>
    </button>

    <!-- Centre value area -->
    <div class="ui-number-input__value">
      <!-- Static display (rest + active non-editing) -->
      <span class="ui-number-input__display">5</span>

      <!-- Text input (editing mode only) -->
      <input class="ui-number-input__input" type="text" inputmode="numeric"
             tabindex="-1" aria-hidden="true" />

      <!-- Range indicator bar -->
      <div class="ui-number-input__range" aria-hidden="true">
        <div class="ui-number-input__range-fill"></div>
      </div>
    </div>

    <!-- Right chevron zone (hidden at rest) -->
    <button class="ui-number-input__zone ui-number-input__zone--up"
            aria-label="Increase" tabindex="-1">
      <svg class="ui-number-input__chevron" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5.797 13.908a1 1 0 0 1-.778-1.628l3.814-4.723a1.5 1.5 0 0 1 2.334 0l3.815 4.723a1 1 0 0 1-.778 1.628z"/>
      </svg>
    </button>
  </div>
</div>
```

### 9.1 Class naming

| Class | Role |
|-------|------|
| `.ui-number-input` | Component root (outer wrapper) |
| `.ui-number-input__pill` | Inner pill container |
| `.ui-number-input__zone` | Chevron button zone |
| `.ui-number-input__zone--up` | Increment zone |
| `.ui-number-input__zone--down` | Decrement zone |
| `.ui-number-input__chevron` | SVG chevron icon |
| `.ui-number-input__value` | Centre value container |
| `.ui-number-input__display` | Static numeric display |
| `.ui-number-input__input` | Hidden text input for editing |
| `.ui-number-input__range` | Range indicator track |
| `.ui-number-input__range-fill` | Range indicator fill |

### 9.2 State classes

Applied to the component root (`.ui-number-input`):

| Class | Meaning |
|-------|---------|
| `.is-active` | Component expanded, chevrons visible |
| `.is-editing` | Inline text input visible |
| `.is-holding` | Momentum hold in progress |
| `.is-holding-up` | Holding the up chevron |
| `.is-holding-down` | Holding the down chevron |
| `.is-disabled` | All interaction disabled |
| `.is-at-min` | Value equals min |
| `.is-at-max` | Value equals max |
| `.has-interacted` | Value has been changed since activation (shows range indicator) |
| `.is-tapped-up` | Pink flash on up chevron after single tap (600ms) |
| `.is-tapped-down` | Pink flash on down chevron after single tap (600ms) |
| `.is-scrolling-up` | Pink flash on up chevron during scroll (600ms) |
| `.is-scrolling-down` | Pink flash on down chevron during scroll (600ms) |

State transitions are CSS-driven. No re-rendering.

---

## 10. Integration

### 10.1 Home Assistant

The component is a custom element (`<ui-number-input>`) that integrates with HA cards via the standard `set hass()` pattern. Cards pass `hass` for theme application and optionally bind the value to an `input_number` helper entity via `persistHelper()` from `helpers.js`.

### 10.2 Theme inheritance

The component's own shadow root adopts `uiFoundation`, which defines tokens under `:host(.light-theme)` / `:host(.dark-theme)`. Since the `<ui-number-input>` element lives inside a parent card's shadow DOM, it inherits the theme class from the parent card's host element via a MutationObserver on the host's `class` attribute. This is handled internally — consuming cards do not need to pass theme state.

```javascript
import '/local/base/foundation.js';
import { applyThemeClass, persistHelper, getHelperNumber } from '/local/base/helpers.js';
```

### 10.3 Stylesheet adoption

```javascript
this.shadowRoot.adoptedStyleSheets = [
  window.uiFoundation,
  uiNumberInput,    // Component stylesheet
  cardStyles         // Card-specific styles
];
```

### 10.4 Settings panel usage

The component is designed to sit right-aligned in label-value rows within settings panels and drawers. The outer wrapper's fixed width prevents row layout shift during expansion.

```html
<div class="ui-data-row">
  <span class="ui-data-row__label">Active rows</span>
  <ui-number-input value="5" min="1" max="20"></ui-number-input>
</div>
```

---

## 11. Edge Cases

- **min equals max:** Component renders as disabled. No interaction possible.
- **value outside range on init:** Clamped to `[min, max]` silently.
- **Rapid tap during collapse animation:** If the user taps the pill during its collapse transition, the component re-activates immediately. The width animation reverses from its current interpolated position.
- **Scroll while editing:** Ignored. Scroll only affects value when active and not editing.
- **Negative values:** Supported. The display and input handle negative numbers. The minus sign is permitted in the input filter.
- **Large values (1000+):** The centre area uses `tabular-nums` and does not grow. Values beyond the visual width are permitted but may overflow. Consuming contexts should set appropriate `min`/`max` ranges. The recommended maximum display width accommodates 4 digits comfortably, 5 digits tightly.
- **Touch and mouse simultaneously:** Pointer events API handles both uniformly. No special casing required.

---

## 12. Timing Exceptions

| Constant | Value | Rationale |
|----------|-------|-----------|
| Momentum hold interval | 90ms | Functional input repeat rate, analogous to OS key repeat. Not a visual transition. |
| Acceleration thresholds | tick 6, 18, 35 | Functional usability tuning, not visual properties. |
| Hold-start delay | 200ms | Delay before hold interval begins, so quick taps fire as single steps via `pointerup`. Shorter causes false holds; longer feels sluggish. |
| Chevron pop-in duration | 400ms | Longer than `--ui-motion-slow` (360ms) to allow the 3-step wobble to resolve. Matches clearable-input pop-in. |
| Chevron pop-in delay | 160ms | Offset from expansion start so chevrons pop after the pill has visibly widened. |
| Pink flash linger | 600ms | Hold time before the pink/scale flash class is removed. Shorter is imperceptible; longer feels stuck. |
| Inactivity auto-collapse | 4000ms | Timeout before a scroll-activated (implicit) instance collapses. Direct interaction cancels the timer. Scroll ticks reset it. |

All are documented here as the authoritative source.

---

## 13. Dependencies

| Dependency | Import | Purpose |
|------------|--------|---------|
| `foundation.js` | `window.uiFoundation` | Tokens and reset |
| `helpers.js` | `applyThemeClass`, `persistHelper`, `getHelperNumber` | Theme sync, HA entity binding |

No dependency on `components.js` unless the consuming card already adopts it. The component's stylesheet is self-contained.

---

*Spec version: 1.2*
