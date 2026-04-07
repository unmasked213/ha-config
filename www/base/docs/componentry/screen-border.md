# Screen Border Exception Documentation

This document covers architectural constraints specific to the screen border flash effect that cannot be expressed in the standard spec format. For component overview and severity hierarchy, see the header comment in `screen-border.js`.

---

## Purpose

The screen border is an SVG-based full-viewport alert effect reserved for critical/destructive events (WebSocket failures, data integrity errors, unrecoverable exceptions). It is **not** a general-purpose notification — routine feedback belongs in the toast system.

---

## Timing Exceptions

The screen border uses intentional timing values outside the standard motion token scale. These are animation-specific values tuned for a breathing/organic feel and should not be changed to match `--ui-motion-fast/med/slow`.

**Overlay transitions (CSS):**

| Location | Value | Purpose |
|----------|-------|---------|
| `line 116` | `transition: left 0.2s, width 0.2s` | Sidebar-aware position adjustment (default state) |
| `line 124` | `transition: left 0.2s, width 0.2s, opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Fade-out with deceleration curve |
| `line 138` | `transition: opacity 0.2s` | Reduced-motion fallback (instant fade) |

**SVG animation triggers (JS):**

| Location | Value | Purpose |
|----------|-------|---------|
| `line 486` | `0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Pulse animation on re-trigger while visible |
| `line 489` | `0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Entry animation on first appearance |

---

## Scale Exceptions

The enter and pulse keyframe animations use sub-pixel scale transforms for a subtle organic breathing effect. These values are intentionally non-standard and not derived from `--ui-anim-scale` tokens.

**`ui-border-enter` keyframes:**

| Keyframe | Scale | Purpose |
|----------|-------|---------|
| `0%` | `1.012` | Slight overshoot on entry |
| `50%` | `0.995` | Undershoot for elastic feel |
| `75%` | `1.003` | Micro-overshoot settle |
| `100%` | `1` | Rest position |

**`ui-border-pulse-a` / `ui-border-pulse-b` keyframes (identical):**

| Keyframe | Scale | Purpose |
|----------|-------|---------|
| `0%` | `1` | Start at rest |
| `30%` | `1.007` | Gentle expansion |
| `60%` | `0.997` | Subtle contraction |
| `85%` | `1.002` | Micro-settle |
| `100%` | `1` | Return to rest |

These values produce a barely-perceptible breathing effect. Larger scale values would make the border visually jump; the current values keep it subliminal.

---

## Color Resolution

The border color is resolved at runtime via `resolveToken('--ui-pink', 'rgb(255, 46, 146)')` rather than CSS `var()`. This is because SVG `stroke` attributes require concrete color values — CSS custom properties don't work inside SVG attribute strings. The `resolveToken()` function reads the computed value from `document.documentElement`.

---

## Reduced Motion

The `@media (prefers-reduced-motion: reduce)` block (line 133) disables all SVG animations and reduces the overlay transition to a simple 0.2s opacity fade. This is the only accommodation needed since the effect is purely visual.

---

## Maintenance Checklist

After modifying screen border behavior:

1. [ ] Verify enter animation plays smoothly at 60fps
2. [ ] Verify fade-out completes without visual artifacts
3. [ ] Verify sidebar-aware positioning adjusts when sidebar opens/closes
4. [ ] Test with `prefers-reduced-motion: reduce` enabled
5. [ ] Confirm toast cutout positioning if toast container location changed
