# Clearable Input Exception Documentation

This document covers timing exceptions specific to the clearable input variant (`.ui-input--clearable`) that cannot be expressed as standard motion tokens.

---

## Pop-In Animation

The clear button entrance uses a multi-step wobble keyframe (`ui-input-clear-pop`) with `--ui-ease-spring-heavy` easing.

| Property | Value | Rationale |
|----------|-------|-----------|
| Duration | `400ms` | Longer than `--ui-motion-slow` (360ms) to allow the 4-step wobble keyframes to resolve visually. 360ms compresses the settle steps. |
| Easing | `--ui-ease-spring-heavy` | Token-sourced. |

---

## Clearing Pulse Sequence

When the clear button is clicked, the input border snaps to `--ui-pink` then fades to `--ui-accent`. This is a two-phase JS-driven sequence with intentional timing.

| Phase | Duration | Purpose |
|-------|----------|---------|
| Pink hold | `350ms` (JS timeout) | Lets the user register the pink flash before it starts fading. Shorter feels abrupt; longer feels sluggish. |
| Fade to accent | `500ms ease-out` (CSS) | Slow fade creates a satisfying dissolve from pink to the focus accent color. Standard motion tokens (120–360ms) are too fast for a decorative fade. |
| Cleanup timeout | `550ms` (JS timeout) | Slightly longer than the CSS fade to ensure the transition completes before removing the class. |

---

## Maintenance Notes

- The pop-in animation duration (400ms) and clearing pulse timings (350ms hold, 500ms fade) are tuned as a set. Changing one may require adjusting the others.
- The hover/focus color transition uses `--ui-motion-med` (token-sourced, not an exception).
