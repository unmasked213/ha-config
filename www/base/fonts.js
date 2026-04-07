/* ===========================================================================
 *  SHARED UI SYSTEM - FONTS.JS
 * ===========================================================================
 *
 *  Font loader for the shared UI design system.
 *
 *  HOW TO SWAP FONTS:
 *  1. Place new font files in /config/www/fonts/
 *  2. Update the @font-face blocks below to reference the new files
 *  3. Update the --ui-font-family value in the :root block
 *  4. Clear browser cache / hard refresh
 *
 *  This is the ONLY file you need to edit when changing fonts.
 *
 * =========================================================================== */

(function loadFonts() {
  if (document.getElementById('ui-fonts')) return;

  const style = document.createElement('style');
  style.id = 'ui-fonts';
  style.textContent = `

    /* ── FONT FACE DECLARATIONS ─────────────────────────────────────────────── */

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/Figtree-Light.ttf') format('truetype');
      font-weight: 300;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/Figtree-LightItalic.ttf') format('truetype');
      font-weight: 300;
      font-style: italic;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/Figtree-Regular.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/Figtree-Italic.ttf') format('truetype');
      font-weight: 400;
      font-style: italic;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/Figtree-Medium.ttf') format('truetype');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/Figtree-MediumItalic.ttf') format('truetype');
      font-weight: 500;
      font-style: italic;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/Figtree-SemiBold.ttf') format('truetype');
      font-weight: 600;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/Figtree-Bold.ttf') format('truetype');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }


    /* ── FONT FAMILY TOKEN ──────────────────────────────────────────────────── */
    /* This custom property cascades into all shadow DOMs via inheritance.      */
    /* foundation.js references it as: var(--ui-font-family, ...)              */

    :root {
      --ui-font-family: 'Figtree', system-ui, sans-serif;
    }
  `;

  document.head.appendChild(style);
})();
