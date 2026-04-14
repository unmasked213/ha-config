/* ===========================================================================
 *  SHARED UI SYSTEM - FONTS.JS
 * ===========================================================================
 *
 *  Font loader for the shared UI design system.
 *
 *  HOW TO SWAP FONTS:
 *  1. Place new font files in /config/www/fonts/<font-name>/
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
      src: url('/local/fonts/figtree/Figtree-Light.ttf') format('truetype');
      font-weight: 300;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/figtree/Figtree-LightItalic.ttf') format('truetype');
      font-weight: 300;
      font-style: italic;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/figtree/Figtree-Regular.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/figtree/Figtree-Italic.ttf') format('truetype');
      font-weight: 400;
      font-style: italic;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/figtree/Figtree-Medium.ttf') format('truetype');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/figtree/Figtree-MediumItalic.ttf') format('truetype');
      font-weight: 500;
      font-style: italic;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/figtree/Figtree-SemiBold.ttf') format('truetype');
      font-weight: 600;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Figtree';
      src: url('/local/fonts/figtree/Figtree-Bold.ttf') format('truetype');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }


    /* ── GOOGLE SANS FLEX (variable font) ──────────────────────────────────── */

    @font-face {
      font-family: 'Google Sans Flex';
      src: url('/local/fonts/google-sans-flex/GoogleSansFlex-Variable.ttf') format('truetype');
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
    }


    /* ── GOOGLE SANS MONO ──────────────────────────────────────────────────── */

    @font-face {
      font-family: 'Google Sans Mono';
      src: url('/local/fonts/Google Sans Mono/Google-Sans-Mono-Regular.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Google Sans Mono';
      src: url('/local/fonts/Google Sans Mono/Google-Sans-Mono-Italic.ttf') format('truetype');
      font-weight: 400;
      font-style: italic;
      font-display: swap;
    }

    @font-face {
      font-family: 'Google Sans Mono';
      src: url('/local/fonts/Google Sans Mono/Google-Sans-Mono-Medium.ttf') format('truetype');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Google Sans Mono';
      src: url('/local/fonts/Google Sans Mono/Google-Sans-Mono-SemiBold.ttf') format('truetype');
      font-weight: 600;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Google Sans Mono';
      src: url('/local/fonts/Google Sans Mono/Google-Sans-Mono-Bold.ttf') format('truetype');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }


    /* ── INTER ──────────────────────────────────────────────────────────────── */

    @font-face {
      font-family: 'Inter';
      src: url('/local/fonts/Inter/Inter_24pt-Regular.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Inter';
      src: url('/local/fonts/Inter/Inter_24pt-Italic.ttf') format('truetype');
      font-weight: 400;
      font-style: italic;
      font-display: swap;
    }

    @font-face {
      font-family: 'Inter';
      src: url('/local/fonts/Inter/Inter_24pt-Medium.ttf') format('truetype');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Inter';
      src: url('/local/fonts/Inter/Inter_24pt-SemiBold.ttf') format('truetype');
      font-weight: 600;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Inter';
      src: url('/local/fonts/Inter/Inter_24pt-Bold.ttf') format('truetype');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }


    /* ── SF MONO ────────────────────────────────────────────────────────────── */

    @font-face {
      font-family: 'SF Mono';
      src: url('/local/fonts/sfmono/SFMono-Regular.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'SF Mono';
      src: url('/local/fonts/sfmono/SFMono-RegularItalic.woff2') format('woff2');
      font-weight: 400;
      font-style: italic;
      font-display: swap;
    }

    @font-face {
      font-family: 'SF Mono';
      src: url('/local/fonts/sfmono/SFMono-Medium.woff2') format('woff2');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'SF Mono';
      src: url('/local/fonts/sfmono/SFMono-Semibold.woff2') format('woff2');
      font-weight: 600;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'SF Mono';
      src: url('/local/fonts/sfmono/SFMono-Bold.woff2') format('woff2');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }


    /* ── DEJAVU SANS MONO ─────────────────────────────────────────────────── */

    @font-face {
      font-family: 'DejaVu Sans Mono';
      src: url('/local/fonts/DejaVu Sans Mono/DejaVuSansMono.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'DejaVu Sans Mono';
      src: url('/local/fonts/DejaVu Sans Mono/DejaVuSansMono-Oblique.ttf') format('truetype');
      font-weight: 400;
      font-style: italic;
      font-display: swap;
    }

    @font-face {
      font-family: 'DejaVu Sans Mono';
      src: url('/local/fonts/DejaVu Sans Mono/DejaVuSansMono-Bold.ttf') format('truetype');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }


    /* ── ROBOTO ─────────────────────────────────────────────────────────────── */

    @font-face {
      font-family: 'Roboto';
      src: url('/local/fonts/Roboto/Roboto-Regular.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Roboto';
      src: url('/local/fonts/Roboto/Roboto-Italic.ttf') format('truetype');
      font-weight: 400;
      font-style: italic;
      font-display: swap;
    }

    @font-face {
      font-family: 'Roboto';
      src: url('/local/fonts/Roboto/Roboto-Medium.ttf') format('truetype');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Roboto';
      src: url('/local/fonts/Roboto/Roboto-Bold.ttf') format('truetype');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }


    /* ── FONT FAMILY TOKEN ──────────────────────────────────────────────────── */
    /* This custom property cascades into all shadow DOMs via inheritance.      */
    /* foundation.js references it as: var(--ui-font-family, ...)              */
    /* Swap the active line below to switch fonts.                             */

    :root {
      --ui-font-family: 'Inter', system-ui, sans-serif;
      /* --ui-font-family: 'Figtree', system-ui, sans-serif; */
      /* --ui-font-family: 'Google Sans Flex', system-ui, sans-serif; */
    }
  `;

  document.head.appendChild(style);
})();
