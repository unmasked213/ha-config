// /config/www/base/skeletons.js

// ============================================================
// SKELETON LOADING SYSTEM
// Placeholder UI elements that indicate content loading
// ============================================================
//
// USAGE PATTERNS:
//
// 1. Text Line Skeleton:
//    <div class="ui-skeleton ui-skeleton--text"></div>
//
// 2. Circle Skeleton (avatars, icons):
//    <div class="ui-skeleton ui-skeleton--circle"></div>
//
// 3. Rectangle Skeleton (cards, images):
//    <div class="ui-skeleton ui-skeleton--rect"></div>
//
// 4. Custom Width (use inline style):
//    <div class="ui-skeleton ui-skeleton--text" style="width: 60%"></div>
//
// 5. Skeleton Group (multiple lines):
//    <div class="ui-skeleton-group">
//      <div class="ui-skeleton ui-skeleton--text"></div>
//      <div class="ui-skeleton ui-skeleton--text" style="width: 80%"></div>
//      <div class="ui-skeleton ui-skeleton--text" style="width: 60%"></div>
//    </div>
//
// 6. Inline Row (icon + text pattern):
//    <div class="ui-skeleton-row">
//      <div class="ui-skeleton ui-skeleton--circle ui-skeleton--sm"></div>
//      <div class="ui-skeleton ui-skeleton--text" style="flex: 1"></div>
//    </div>
//
// SIZE MODIFIERS:
//   --xs: Extra small (8px)
//   --sm: Small (12px)
//   --md: Medium (16px, default)
//   --lg: Large (24px)
//   --xl: Extra large (32px)
//
// ============================================================

export const uiSkeletons = new CSSStyleSheet();

uiSkeletons.replaceSync(`

  /* ============================================================
   * SHIMMER ANIMATION
   * Subtle left-to-right shine effect
   * ============================================================ */

  @keyframes ui-skeleton-shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }


  /* ============================================================
   * BASE SKELETON
   * ============================================================ */

  .ui-skeleton {
    /* Base appearance */
    background: linear-gradient(
      90deg,
      var(--ui-skeleton-base) 0%,
      var(--ui-skeleton-shine) 50%,
      var(--ui-skeleton-base) 100%
    );
    background-size: 200% 100%;

    /* Animation */
    animation: ui-skeleton-shimmer var(--ui-skeleton-animation-duration, 1.5s) ease-in-out infinite;

    /* Default shape */
    border-radius: var(--ui-skeleton-radius, var(--ui-radius-s));

    /* Remove any text/content */
    color: transparent;
    user-select: none;
    pointer-events: none;

    /* Default size */
    height: var(--ui-skeleton-height, 16px);
    width: 100%;
  }


  /* ============================================================
   * SHAPE VARIANTS
   * ============================================================ */

  /* Text line - default, pill-shaped ends */
  .ui-skeleton--text {
    border-radius: var(--ui-radius-s, 8px);
    height: var(--ui-skeleton-height, 16px);
  }

  /* Circle - for avatars, icons */
  .ui-skeleton--circle {
    border-radius: 50%;
    width: var(--ui-skeleton-height, 16px);
    height: var(--ui-skeleton-height, 16px);
    flex-shrink: 0;
  }

  /* Rectangle - for cards, images */
  .ui-skeleton--rect {
    border-radius: var(--ui-radius-s, 8px);
    height: auto;
    aspect-ratio: 16 / 9;
  }

  /* Square - for thumbnails */
  .ui-skeleton--square {
    border-radius: var(--ui-radius-s, 8px);
    aspect-ratio: 1;
    height: auto;
  }


  /* ============================================================
   * SIZE MODIFIERS
   * ============================================================ */

  .ui-skeleton--xs {
    --ui-skeleton-height: 8px;
  }

  .ui-skeleton--sm {
    --ui-skeleton-height: 12px;
  }

  .ui-skeleton--md {
    --ui-skeleton-height: 16px;
  }

  .ui-skeleton--lg {
    --ui-skeleton-height: 24px;
  }

  .ui-skeleton--xl {
    --ui-skeleton-height: 32px;
  }


  /* ============================================================
   * SKELETON GROUP
   * Vertical stack of skeleton lines with spacing
   * ============================================================ */

  .ui-skeleton-group {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-2, 8px);
  }


  /* ============================================================
   * SKELETON ROW
   * Horizontal layout for icon + text patterns
   * ============================================================ */

  .ui-skeleton-row {
    display: flex;
    align-items: center;
    gap: var(--ui-space-3, 12px);
  }


  /* ============================================================
   * SKELETON REVEAL
   * Apply to each content element that replaces a skeleton.
   * Slides up from below and fades in — clearly distinct from
   * the shimmer state so the transition reads immediately.
   *
   * Set --ui-anim-from-y to control travel distance (default 12px).
   * Set --ui-anim-delay to stagger multiple elements.
   *
   * USAGE:
   *   element.classList.add('ui-skeleton-reveal');
   *   // or set on the element before inserting into the DOM
   *
   * ONE-SHOT: Remove after animation if you need to re-trigger:
   *   el.addEventListener('animationend', () =>
   *     el.classList.remove('ui-skeleton-reveal'), { once: true });
   * ============================================================ */

  .ui-skeleton-reveal {
    --ui-anim-from-y: 12px;
    animation: ui-slide-in 380ms var(--ui-ease-spring) both;
    animation-delay: var(--ui-anim-delay, 0s);
  }


  /* ============================================================
   * REDUCED MOTION
   * Respect user preferences - show static placeholder
   * ============================================================ */

  @media (prefers-reduced-motion: reduce) {
    .ui-skeleton {
      animation: none;
      background: var(--ui-skeleton-base);
    }

    .ui-skeleton-reveal {
      animation: none;
    }
  }

`);
