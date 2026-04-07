// /config/www/base/modals.js

// ============================================================
// MODAL DIALOG SYSTEM
// Centered overlay dialogs with backdrop and focus trap
// Single active modal at a time (new modal closes existing)
// ============================================================
//
// NOTE: Modals are appended to document.body (not shadow DOM)
// and use CSS classes from components.js with design system tokens.
//
// USAGE:
//
// 1. Basic modal:
//    import { showModal } from '/local/base/modals.js';
//    showModal({ title: 'Hello', content: 'World' });
//
// 2. With buttons:
//    showModal({
//      title: 'Confirm',
//      content: 'Are you sure?',
//      buttons: [
//        { label: 'Cancel', variant: 'secondary', action: (modal) => modal.close() },
//        { label: 'Confirm', variant: 'primary', action: (modal) => { doThing(); modal.close(); } }
//      ]
//    });
//
// 3. Different sizes:
//    showModal({ title: 'Small', content: '...', size: 's' });
//    showModal({ title: 'Large', content: '...', size: 'l' });
//
// 4. Custom content (HTMLElement):
//    const div = document.createElement('div');
//    div.innerHTML = '<p>Custom HTML</p>';
//    showModal({ title: 'Custom', content: div });
//
// ============================================================

const STYLE_ID = 'ui-modal-styles';
const ANIMATION_MS = 240;
const ANIMATION_MS_FAST = 120;

// Single active modal reference
let activeModal = null;
let originalBodyOverflow = null;
let escapeHandler = null;

/**
 * Check for reduced motion preference
 */
function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Injects required styles if not using components.js stylesheet
 * This is a fallback for contexts where adoptedStyleSheets aren't available
 */
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  // Only inject if .ui-modal styles aren't already present
  const testEl = document.createElement('div');
  testEl.className = 'ui-modal-backdrop';
  testEl.style.cssText = 'position: absolute; visibility: hidden;';
  document.body.appendChild(testEl);
  const styles = getComputedStyle(testEl);
  const hasStyles = styles.position === 'fixed';
  document.body.removeChild(testEl);

  if (hasStyles) return;

  // Inject minimal fallback styles using CSS custom properties
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .ui-modal-backdrop {
      position: fixed;
      inset: 0;
      background: var(--ui-overlay-scrim-strong, rgba(0, 0, 0, 0.55));
      z-index: var(--ui-z-dialog, 30);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: var(--ui-space-4, 16px);
      overflow: auto;
      opacity: 0;
      transition: opacity var(--ui-modal-backdrop-in, 120ms ease-out);
    }
    .ui-modal-backdrop.is-visible { opacity: 1; }
    .ui-modal-backdrop.is-exiting {
      opacity: 0;
      transition: opacity var(--ui-modal-backdrop-out, 120ms ease-in);
    }
    .ui-modal {
      position: relative;
      background: var(--ui-elevated-2, rgb(56, 60, 72));
      border-radius: var(--ui-modal-radius, 18px);
      box-shadow: var(--ui-shadow-4, 0 6px 18px rgba(0, 0, 0, 0.86));
      width: 100%;
      max-width: var(--ui-modal-max-width-m, 720px);
      margin: auto;
      padding: var(--ui-space-6, 24px);
      display: flex;
      flex-direction: column;
      overflow: visible;
      opacity: 0;
    }
    @keyframes ui-modal-in {
      0%   { transform: scale(0.97); opacity: 0; }
      100% { transform: scale(1);    opacity: 1; }
    }
    .ui-modal-backdrop.is-visible .ui-modal {
      animation: ui-modal-in var(--ui-modal-motion-in, 200ms cubic-bezier(0, 0, 0.2, 1)) both;
      opacity: 1;
    }
    .ui-modal-backdrop.is-exiting .ui-modal {
      transform: translateY(8px) scale(0.96);
      opacity: 0;
      transition: transform var(--ui-modal-motion-out, 120ms ease-in), opacity var(--ui-modal-motion-out, 120ms ease-in);
    }
    .ui-modal--s { max-width: var(--ui-modal-max-width-s, 480px); }
    .ui-modal--l { max-width: var(--ui-modal-max-width-l, 960px); }
    .ui-modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ui-modal-header-gap, 12px);
      flex-shrink: 0;
    }
    .ui-modal__title {
      font-size: var(--ui-font-l, 1.15rem);
      font-weight: 600;
      color: var(--ui-text-strong, rgb(240, 240, 252));
      margin: 0;
      flex: 1;
    }
    .ui-modal__close {
      width: var(--ui-space-9, 40px);
      height: var(--ui-space-9, 40px);
      border-radius: 50%;
      border: none;
      background: transparent;
      color: var(--ui-text-mute, rgb(145, 147, 159));
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background var(--ui-modal-backdrop-in, 120ms ease-out), color var(--ui-modal-backdrop-in, 120ms ease-out);
    }
    .ui-modal__close:hover {
      background: var(--ui-state-hover, rgba(228, 228, 242, 0.08));
      color: var(--ui-text, rgb(228, 228, 242));
    }
    .ui-modal__body {
      overflow-y: auto;
      flex: 1;
      color: var(--ui-text, rgb(228, 228, 242));
      font-size: var(--ui-font-m, 1rem);
      line-height: 1.5;
    }
    .ui-modal__footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--ui-modal-footer-gap, 12px);
      padding-top: var(--ui-space-3, 12px);
      flex-shrink: 0;
    }
    @media (prefers-reduced-motion: reduce) {
      .ui-modal-backdrop { transition: opacity 0.01ms !important; }
      .ui-modal { animation: none !important; transform: none !important; transition: opacity 0.01ms !important; }
      .ui-modal-backdrop.is-visible .ui-modal { animation: none !important; transform: none !important; }
      .ui-modal-backdrop.is-exiting .ui-modal { transform: none; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Gets all focusable elements within a container
 */
function getFocusableElements(container) {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');
  return Array.from(container.querySelectorAll(focusableSelectors));
}

/**
 * Creates focus trap within modal
 */
function createFocusTrap(modal) {
  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements(modal);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: wrap to last if at first
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: wrap to first if at last
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  modal.addEventListener('keydown', handleKeyDown);

  return () => modal.removeEventListener('keydown', handleKeyDown);
}

/**
 * Sets up escape key handler for single modal
 */
function setupEscapeHandler(modalInstance) {
  if (escapeHandler) return;

  escapeHandler = (e) => {
    if (e.key === 'Escape' && activeModal && activeModal.closeOnEscape) {
      e.preventDefault();
      activeModal.close();
    }
  };

  document.addEventListener('keydown', escapeHandler);
}

/**
 * Removes escape key handler when no modal is open
 */
function cleanupEscapeHandler() {
  if (!activeModal && escapeHandler) {
    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  }
}

/**
 * Locks body scroll when modal opens
 */
function lockBodyScroll() {
  if (originalBodyOverflow === null) {
    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Unlocks body scroll when modal closes
 */
function unlockBodyScroll() {
  document.body.style.overflow = originalBodyOverflow || '';
  originalBodyOverflow = null;
}

/**
 * Creates the modal DOM structure
 */
function createModalElement(options) {
  const {
    title,
    content,
    size = 'm',
    closable = true,
    buttons = []
  } = options;

  const modalId = `modal-${Date.now()}`;
  const titleId = `${modalId}-title`;
  const bodyId = `${modalId}-body`;

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'ui-modal-backdrop';
  backdrop.setAttribute('role', 'presentation');

  // Modal container
  const modal = document.createElement('div');
  modal.className = `ui-modal ui-modal--${size}`;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  if (title) modal.setAttribute('aria-labelledby', titleId);
  modal.setAttribute('aria-describedby', bodyId);

  // Header (if title or closable)
  if (title || closable) {
    const header = document.createElement('div');
    header.className = 'ui-modal__header';

    if (title) {
      const titleEl = document.createElement('h2');
      titleEl.id = titleId;
      titleEl.className = 'ui-modal__title';
      titleEl.textContent = title;
      header.appendChild(titleEl);
    }

    if (closable) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'ui-modal__close';
      closeBtn.setAttribute('aria-label', 'Close dialog');
      closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      closeBtn._isCloseBtn = true;
      header.appendChild(closeBtn);
    }

    modal.appendChild(header);
  }

  // Body
  const body = document.createElement('div');
  body.id = bodyId;
  body.className = 'ui-modal__body';

  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }

  modal.appendChild(body);

  // Footer (if buttons provided)
  if (buttons.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'ui-modal__footer';

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = `ui-btn ui-btn--${btn.variant || 'secondary'}`;
      button.textContent = btn.label;
      button._action = btn.action;
      footer.appendChild(button);
    });

    modal.appendChild(footer);
  }

  backdrop.appendChild(modal);

  return { backdrop, modal, titleId, bodyId };
}

/**
 * Shows a modal dialog
 *
 * @param {Object} options - Modal configuration
 * @param {string} [options.title] - Modal title (optional)
 * @param {string|HTMLElement} options.content - Modal body content (required)
 * @param {string} [options.size='m'] - Size variant: 's', 'm', or 'l'
 * @param {boolean} [options.closable=true] - Show close button
 * @param {boolean} [options.closeOnBackdrop=true] - Click backdrop to close
 * @param {boolean} [options.closeOnEscape=true] - Escape key closes modal
 * @param {Array} [options.buttons] - Footer buttons
 * @param {Function} [options.onClose] - Callback when modal closes
 * @returns {Object} Modal controller with close() method
 */
export function showModal(options) {
  if (!options?.content) {
    console.warn('[ui-modal] No content provided');
    return null;
  }

  const {
    closeOnBackdrop = true,
    closeOnEscape = true,
    onClose
  } = options;

  // Close any existing modal before opening new one (single modal at a time)
  if (activeModal) {
    activeModal.close();
  }

  ensureStyles();

  const { backdrop, modal } = createModalElement(options);
  const previousActiveElement = document.activeElement;

  // Create modal instance
  const modalInstance = {
    backdrop,
    modal,
    closeOnEscape,
    previousActiveElement,
    onClose,
    close: null // Will be set below
  };

  // Close function
  const close = () => {
    if (!backdrop.isConnected) return Promise.resolve();

    // Clear active modal reference
    if (activeModal === modalInstance) {
      activeModal = null;
    }

    // Start exit animation
    backdrop.classList.remove('is-visible');
    backdrop.classList.add('is-exiting');

    return new Promise(resolve => {
      const duration = prefersReducedMotion() ? 10 : ANIMATION_MS_FAST;
      setTimeout(() => {
        backdrop.remove();

        // Cleanup
        unlockBodyScroll();
        cleanupEscapeHandler();

        // Restore focus
        if (previousActiveElement && previousActiveElement.focus) {
          previousActiveElement.focus();
        }

        // Callback
        if (typeof onClose === 'function') onClose();

        resolve();
      }, duration);
    });
  };

  modalInstance.close = close;

  // Append to body
  document.body.appendChild(backdrop);

  // Set active modal and setup handlers
  activeModal = modalInstance;
  lockBodyScroll();
  setupEscapeHandler(modalInstance);

  // Setup focus trap
  const cleanupFocusTrap = createFocusTrap(modal);
  modalInstance.cleanupFocusTrap = cleanupFocusTrap;

  // Click handlers
  backdrop.addEventListener('click', (e) => {
    // Close button
    if (e.target._isCloseBtn || e.target.closest('.ui-modal__close')) {
      close();
      return;
    }

    // Button actions
    if (e.target._action) {
      e.target._action(modalInstance);
      return;
    }

    // Backdrop click
    if (closeOnBackdrop && e.target === backdrop) {
      close();
    }
  });

  // Trigger enter animation
  requestAnimationFrame(() => {
    backdrop.classList.add('is-visible');

    // Focus first focusable element (or modal itself)
    const focusable = getFocusableElements(modal);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      modal.setAttribute('tabindex', '-1');
      modal.focus();
    }
  });

  return {
    close,
    element: modal,
    backdrop
  };
}

/**
 * Closes the active modal
 */
export function closeModal() {
  if (activeModal) {
    activeModal.close();
  }
}
