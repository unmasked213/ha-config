// | START: render.js
// |  PATH: www/cards/prompt-manager/modules/render.js
// InputsInferred: []
// All rendering methods for the prompt manager card. Mixed into
// PromptManagerCard.prototype via Object.assign in prompt-manager.js.
// Produces HTML strings; DOM insertion happens in prompt-manager.js render(),
// event binding happens in events.js setupEventListeners().
// Depends on: ./constants.js, ./scoring.js, ./variables.js, ./highlight.js,
//   /local/base/helpers.js (initInputs), /local/base/utilities.js (escapeHtml)
import { CATEGORY_META } from './constants.js';
import { getQualityTier } from './scoring.js';
import { extractVariables } from './variables.js';
import { highlightPrompt, isHighlightCached } from './highlight.js';
import { initInputs } from '/local/base/helpers.js';
import { escapeHtml } from '/local/base/utilities.js';

// Re-export for mixin (events.js uses this.escapeHtml via Object.assign)
export { escapeHtml };

// Pure helpers (no this)

export function getPromptSlug(prompt) {
    const slug = (prompt.title || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const v = prompt.version || 1;
    return `${slug}-v${v}`;
  }

export function getReadableTextColor(bg) {
    try {
      const hex2rgb = (h) => {
        h = h.replace("#", "");
        if (h.length === 3)
          h = h.split("").map((c) => c + c).join("");
        const n = parseInt(h, 16);
        return {
          r: (n >> 16) & 255,
          g: (n >> 8) & 255,
          b: n & 255,
        };
      };
      let rgb;
      const str = bg?.toLowerCase().trim();
      if (str.startsWith("#")) rgb = hex2rgb(str);
      else if (str.startsWith("rgb")) {
        const m = str.match(/\(([^)]+)\)/);
        const [r, g, b] = m[1].split(",").map(parseFloat);
        rgb = { r, g, b };
      } else if (str.startsWith("hsl")) {
        const m = str.match(
          /\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/
        );
        const [h, s, l] = [
          parseFloat(m[1]),
          parseFloat(m[2]) / 100,
          parseFloat(m[3]) / 100,
        ];
        const c = (1 - Math.abs(2 * l - 1)) * s,
          x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
          m1 = l - c / 2;
        const [r1, g1, b1] =
          h < 60
            ? [c, x, 0]
            : h < 120
            ? [x, c, 0]
            : h < 180
            ? [0, c, x]
            : h < 240
            ? [0, x, c]
            : h < 300
            ? [x, 0, c]
            : [c, 0, x];
        rgb = {
          r: (r1 + m1) * 255,
          g: (g1 + m1) * 255,
          b: (b1 + m1) * 255,
        };
      }
      if (!rgb) return "#FFF";
      const srgb = (v) =>
        v <= 0.03928
          ? v / 12.92
          : Math.pow((v + 0.055) / 1.055, 2.4);
      const lum =
        0.2126 * srgb(rgb.r / 255) +
        0.7152 * srgb(rgb.g / 255) +
        0.0722 * srgb(rgb.b / 255);
      return lum > 0.57 ? "#000" : "#FFF";
    } catch {
      return "#FFF";
    }
  }

export function getCategoryTokenName(category) {
    const tokens = {
      'Analyse': 'teal',
      'Edit': 'amber',
      'Create': 'sky',
      'Image': 'violet',
      'Reference': 'green',
      'Research': 'red',
      'Configure': 'lime',
      'Uncategorized': 'slate'
    };
    return tokens[category] || 'slate';
  }

export function getCategoryColor(category) {
    return `var(--ui-cat-${getCategoryTokenName(category)})`;
  }

export function getCategoryStyle(category) {
    const name = getCategoryTokenName(category);
    return `style="--_tab-color:var(--ui-cat-${name});--_tab-color-faint:var(--ui-cat-${name}-faint);"`;
  }

/**
 * Estimates the token count for a string using a character-ratio heuristic.
 * Uses ~3.5 chars/token for code-heavy text (XML tags, punctuation) and
 * ~4 chars/token for prose, weighted by the ratio of non-alpha characters.
 * Accurate to ±10 % for typical prompt content vs cl100k_base.
 */
function estimateTokens(text) {
  if (!text) return '0';
  const len = text.length;
  const nonAlpha = (text.match(/[^a-zA-Z\s]/g) || []).length;
  const codeRatio = Math.min(nonAlpha / (len || 1), 0.5);
  // Blend between prose ratio (4.0) and code ratio (3.2)
  const charsPerToken = 4.0 - codeRatio * 1.6;
  const raw = Math.round(len / charsPerToken);
  if (raw < 1000) return String(raw <= 20 ? raw : Math.round(raw / 5) * 5);
  // 1k+ — one decimal, drop trailing .0  (e.g. 1.2k, 3k)
  const k = (raw / 1000).toFixed(1);
  return (k.endsWith('.0') ? k.slice(0, -2) : k) + 'k';
}

// Render methods (use this via mixin)
export function renderPromptCard(p) {
    const tier = getQualityTier(p.score);
    const isScoring = !!this.state.scoring[p.id];
    const justScored = !!this.state.justScored[p.id];
    const scoreDisplay = isScoring
      ? `<ha-icon icon="svg-spinners:3-dots-move" class="pm-score-icon pm-score-scoring"></ha-icon>`
      : (tier.numericScore !== null ? tier.numericScore.toFixed(1) : "—");
    const movementInfo = this.state.movement[p.id];
    const showArrow =
      movementInfo && Date.now() - movementInfo.timestamp < 15000;
    let arrowSvg = "";
    if (showArrow) {
      const path =
        movementInfo.direction === "up"
          ? "M15,20H9V12H4.16L12,4.16L19.84,12H15V20Z"
          : "M9,4H15V12H19.84L12,19.84L4.16,12H9V4Z";
      arrowSvg = `<svg class="movement-arrow" width="16" height="16" viewBox="0 0 24 24" fill="var(--ui-pink, rgb(255, 46, 146))"><path d="${path}"/></svg>`;
    }
    return `<div class="prompt-card ${
      showArrow ? "has-movement" : ""
    } ${justScored ? "just-scored" : ""}" data-prompt-id="${p.id}" data-view-id="${
      p.id
    }" style="cursor: pointer;"><div class="card-header"><h3 class="card-title">${escapeHtml(
      p.title
    )}</h3><div class="card-actions">${this._devMode ? `<div class="dropdown-container"><button class="ui-copy-btn dev-tools-btn" data-dev-id="${p.id}" title="Dev Tools"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg></button><div class="ui-menu ui-menu--down" data-dev-menu="${p.id}"><button class="ui-menu__item" data-dev-action="set-score" data-dev-prompt="${p.id}">Set Score</button></div></div>` : ''}<button class="ui-copy-btn" data-copy-id="${p.id}" title="Copy"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a 2 2 0 0 1-2-2V4a 2 2 0 0 1 2-2h9a 2 2 0 0 1 2 2v1"></path></svg></button></div></div><div class="card-score ${justScored ? "score-pulse" : ""}" style="color: ${tier.tierColor}">${arrowSvg}${
      showArrow ? " " : ""
    }${scoreDisplay}</div></div>`;
  }

export function render() {
    const filtered = this.getFilteredPrompts();
    const categories = this.getAllCategories();
    const syncBanner = this._pendingBackendSync
      ? `<div class="sync-banner">Not synced. Changes will be saved when connection is restored.</div>`
      : "";
    let contentHTML = "";
    if (!filtered.length) {
      contentHTML = `<div class="empty-state">${
        this.state.searchTerm || this.state.selectedCategory
          ? "No prompts match your filters"
          : "No prompts yet. Add your first one above."
      }</div>`;
    } else {
      const sorted = [...filtered].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
      const introClass = this._introPlayed ? '' : ' pm-intro-pending';
      contentHTML = `<div class="prompts-grid${introClass}">${sorted.map(p => this.renderPromptCard(p)).join("")}</div>`;
    }
    const selCat = this.state.selectedCategory;
    const catMeta = selCat ? CATEGORY_META[selCat] : null;
    const headerTitle = catMeta ? catMeta.headerTitle : escapeHtml(this.config?.card_title || 'Prompt Manager');
    const accentStyle = selCat ? ` style="background:${getCategoryColor(selCat)};"` : '';
    this._rootEl.innerHTML = `${syncBanner}<div class="container"><div class="header"><div class="header-top"><div class="ui-card-header"><div class="ui-card-header__accent"${accentStyle}></div><h2 class="ui-card-header__title">${headerTitle}</h2><ui-info-icon data-tooltip-key="cardHeader" position="bottom"></ui-info-icon></div><div class="header-actions"><div class="search-container"><div class="ui-input ui-input--clearable"><div class="ui-input__pill${this.state.searchTerm ? ' has-value' : ''}"><label class="ui-input__label">Search prompts...</label><input type="text" class="ui-input__field" id="search-input" value="${escapeHtml(
      this.state.searchTerm
    )}" autocomplete="off" autocapitalize="off" spellcheck="false" /><button type="button" id="clear-search" class="ui-input__clear" aria-label="Clear search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div></div></div><button class="ui-btn ui-btn--accent ui-btn--filled" id="add-button" aria-label="Add prompt"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="currentColor" d="M6 2a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 6 2"/></svg><span>Add</span></button><div class="dropdown-container header-menu"><button class="ui-btn ui-btn--icon" id="header-menu-btn" aria-label="More options">${this._devMode ? '<span class="header-menu__dot"></span>' : ''}<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></button><div class="ui-menu ui-menu--down${this.state.headerMenuOpen ? ' ui-menu--open' : ''}" id="header-menu"><button class="ui-menu__item" id="header-menu-table">View as Table</button><button class="ui-menu__item" id="header-menu-devmode">Dev Mode<span class="header-menu__toggle"><input type="checkbox" class="ui-checkbox__input" tabindex="-1" ${this._devMode ? 'checked' : ''}><span class="ui-checkbox__box"><svg class="ui-checkbox__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span></button></div></div></div></div><div class="categories"><div class="ui-tab-bar ui-tab-bar--pill ui-tab-bar--colored" id="categories-container">${categories
      .map(
        (c) =>
          `<button class="ui-tab-bar__tab${
            this.state.selectedCategory === c ? " ui-tab-bar__tab--active" : ""
          }" data-category="${escapeHtml(
            c
          )}" aria-pressed="${
            this.state.selectedCategory === c
          }" ${getCategoryStyle(c)}>${escapeHtml(c)}</button>`
      )
      .join("")}</div></div></div><div class="content">${contentHTML}</div></div>${this.state.showAddForm ? this.renderForm(false) : ""}${this.state.editingPrompt ? this.renderForm(true) : ""}${this.renderDeleteConfirmation()}${this.renderVersionHistoryModal()}${this.renderFillModal()}${this.renderDevScoreModal()}${this.renderViewModal()}${this.renderOptimizeModal()}${this.renderTableModal()}`;
    this.setupEventListeners();
    this.setupContentEventListeners();
    this._wireInfoIcons();
    initInputs(this.shadow);
    this._animateGrid();
    this._preWarmHighlightCache();

    // Async highlighting — apply after modal is in the DOM so the entrance
    // animation can start immediately. The content reveal CSS animation
    // (60ms delay + 120ms fade) masks the gap.
    // Generation counter prevents stale RAFs from applying wrong content
    // when the user rapidly switches between prompts.
    if (this._pendingHighlight) {
      const hl = this._pendingHighlight;
      this._pendingHighlight = null;
      const gen = this._hlGeneration = (this._hlGeneration || 0) + 1;
      requestAnimationFrame(() => {
        if (this._hlGeneration !== gen) return;
        const bodyPre = this._rootEl.querySelector('.view-content > pre.pm-hl--pending');
        if (bodyPre) {
          bodyPre.innerHTML = highlightPrompt(hl.content, hl.inputNames);
          bodyPre.classList.remove('pm-hl--pending');
        }
        if (hl.inputsBlock) {
          const inputsPre = this._rootEl.querySelector('pre.inputs-highlighted.pm-hl--pending');
          if (inputsPre) {
            inputsPre.innerHTML = highlightPrompt(hl.inputsBlock);
            inputsPre.classList.remove('pm-hl--pending');
          }
        }
      });
    }
  }

  /** Pre-warm the highlight cache during idle time so first opens are instant.
   *  Processes one prompt per setTimeout to avoid blocking the UI thread. */
  export function _preWarmHighlightCache() {
    if (this._hlWarmStarted || !this.state.prompts.length) return;
    this._hlWarmStarted = true;
    const queue = this.state.prompts.filter(p => p.content);
    const next = () => {
      const p = queue.shift();
      if (!p) return;
      highlightPrompt(p.content);
      setTimeout(next, 0);
    };
    setTimeout(next, 200);
  }

export function renderForm(isEdit) {
    const prefix = isEdit ? "edit" : "add";
    const p = isEdit
      ? this.state.prompts.find((p) => p.id === this.state.editingPrompt)
      : null;
    const categories = this.getAllCategories();
    const usedOften =
      p && p.useCount > 15
        ? '<span class="usage-insight">Used often</span>'
        : "";

    // Get selected categories from state (array), or from prompt if editing
    const selectedCategories = isEdit
      ? (this.state.formCategory.edit?.length ? this.state.formCategory.edit : (p?.categories || ['Uncategorized']))
      : (this.state.formCategory.add || []);
    const isOpen = this.state.formCategoryOpen[prefix];
    const hasCategory = selectedCategories.length > 0;

    // Render ALL categories in the menu — _updateCategoryChips hides already-selected
    // ones via style.display after render. This ensures removed categories can
    // reappear: if we filtered here, the item would never be in the DOM to show.
    const categoryMenuItems = categories
      .map(c => {
        const color = getCategoryColor(c);
        const hidden = selectedCategories.includes(c) ? ' style="display:none"' : '';
        return `<button class="ui-menu__item" data-category-option="${escapeHtml(c)}" data-form="${prefix}"${hidden}><span class="category-dropdown__dot" style="background:${color}"></span>${escapeHtml(c)}</button>`;
      }).join('');

    return `<div class="ui-modal-backdrop is-visible"><div class="ui-modal ui-modal--s" role="dialog" aria-modal="true"><button class="ui-modal__close" id="${prefix}-close-x" aria-label="Close"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button><h2 class="ui-modal__title">${
      isEdit ? "Edit" : "Add"
    } Prompt<ui-info-icon data-tooltip-key="${isEdit ? 'editPrompt' : 'addPrompt'}" position="bottom" z-index="1001"></ui-info-icon></h2><div class="form-header">${
      isEdit && usedOften
        ? `<div class="usage-insight-wrapper">${usedOften}</div>`
        : ""
    }<div class="form-header__row"><div class="ui-input form-header__title"><div class="ui-input__pill${p?.title ? ' has-value' : ''}"><label class="ui-input__label">Prompt title</label><input type="text" class="ui-input__field" id="${prefix}-title" value="${escapeHtml(
      p?.title || ""
    )}" required /></div></div><div class="category-dropdown${hasCategory ? ' category-dropdown--has-value' : ''}${isOpen ? ' category-dropdown--open' : ''}"><span class="category-dropdown__label">Category</span><button type="button" class="category-dropdown__trigger" id="${prefix}-category-trigger" aria-expanded="${isOpen}" aria-haspopup="listbox"><svg class="category-dropdown__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button><div class="ui-menu ui-menu--down${isOpen ? ' ui-menu--open' : ''}" id="${prefix}-category-menu" role="listbox">${categoryMenuItems}</div></div></div></div><div class="ui-modal__body ui-modal__body--tall"><div class="ui-input ui-input--textarea"><div class="ui-input__pill${p?.description ? ' has-value' : ''}"><label class="ui-input__label">Description</label><textarea class="ui-input__field" id="${prefix}-description">${escapeHtml(
      p?.description || ""
    )}</textarea></div><button type="button" class="ui-fab ui-fab--small ai-sparkle-btn${(!p?.content || p.content.length < 5) ? '' : ' ai-fab--visible'}" id="${prefix}-generate-desc" data-fab-tooltip="Generate description"${(!p?.content || p.content.length < 5) ? ' style="display:none"' : ''}><ha-icon icon="fluent:sparkle-28-filled"></ha-icon></button></div><div class="ui-input ui-input--textarea ui-input--textarea-lg"><div class="ui-input__pill${p?.content ? ' has-value' : ''}"><label class="ui-input__label">Prompt content</label><textarea class="ui-input__field" id="${prefix}-content" required>${escapeHtml(
      p?.content || ""
    )}</textarea></div><button type="button" class="ui-fab ui-fab--small ai-sparkle-btn${!p?.content ? '' : ' ai-fab--visible'}" id="${prefix}-refine" data-fab-tooltip="Refine draft"${!p?.content ? ' style="display:none"' : ''}><ha-icon icon="fluent:pen-sparkle-28-filled"></ha-icon></button></div><div class="variables-section" data-section-id="${prefix}-variables" style="display:none"><div class="variables-header-row"><h3 class="variables-title">Variable Descriptions<ui-info-icon data-tooltip-key="variables" position="bottom" z-index="1001"></ui-info-icon></h3><button type="button" class="ui-fab ui-fab--small variables-generate-btn" id="${prefix}-variables-generate" data-fab-tooltip="Generate variable descriptions" style="display:none"><ha-icon icon="fluent:sparkle-28-filled"></ha-icon></button></div><div class="variables-list" id="${prefix}-variables-list"></div></div><div class="form-buttons">${
      isEdit && p?.versions?.length > 0
        ? `<button class="ui-btn ui-btn--outline" id="${prefix}-version-history-btn">History (${p.versions.length})</button>`
        : ''
    }<span class="submit-btn-wrapper" id="${prefix}-submit-wrapper"><button class="ui-btn ui-btn--accent ui-btn--filled" id="${prefix}-submit" disabled>${
      isEdit ? "Update" : "Add Prompt"
    }</button></span></div></div></div></div>`;
  }

export function renderDeleteConfirmation() {
    if (!this.state.deleteConfirmation) return "";
    return `<div class="ui-modal-backdrop is-visible"><div class="ui-modal ui-modal--s delete-confirmation-modal" role="dialog" aria-modal="true"><button class="ui-modal__close" id="delete-close-x" aria-label="Close"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button><h2 class="ui-modal__title">Delete Prompt?</h2><p class="confirmation-message">Are you sure you want to delete "<strong>${escapeHtml(
      this.state.deleteConfirmation.title
    )}</strong>"?</p><p class="confirmation-warning">This action cannot be undone.</p><div class="form-buttons"><button class="ui-btn ui-btn--danger ui-btn--filled" id="delete-confirm">Delete Prompt</button></div></div></div>`;
  }

export function renderVersionHistoryModal() {
    if (!this.state.versionHistoryPrompt) return "";
    const p = this.state.prompts.find((p) => p.id === this.state.versionHistoryPrompt);
    if (!p?.versions?.length) return "";

    const currentVersion = p.version || 1;
    const versionItems = p.versions
      .slice()
      .reverse()
      .map((v, idx) => {
        const date = new Date(v.timestamp);
        const vNum = currentVersion - 1 - idx;
        const preview =
          v.content.substring(0, 150) +
          (v.content.length > 150 ? '...' : '');
        return `<div class="version-item"><div class="version-header"><span class="version-date">v${vNum} &middot; ${date.toLocaleString()}</span><button type="button" class="ui-btn ui-btn--outline version-restore" data-version-index="${
          p.versions.length - 1 - idx
        }" data-form="edit">Restore</button></div><div class="version-preview">${escapeHtml(
          preview
        )}</div></div>`;
      })
      .join('');

    return `<div class="ui-modal-backdrop is-visible"><div class="ui-modal ui-modal--s version-history-modal" role="dialog" aria-modal="true"><button class="ui-modal__close" id="version-history-close-x" aria-label="Close"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button><h2 class="ui-modal__title">History<ui-info-icon data-tooltip-key="versionHistory" position="bottom" z-index="1001"></ui-info-icon></h2><div class="ui-modal__body ui-modal__body--tall"><div class="version-history-list">${versionItems}</div></div></div></div>`;
  }

export function renderFillModal() {
    if (!this.state.fillingPrompt) return "";
    const p = this.state.prompts.find((p) => p.id === this.state.fillingPrompt);
    if (!p) return "";

    const variables = extractVariables(p.content);
    if (!variables.length) return "";

    // Build a map of descriptions from saved inputs
    const descMap = {};
    (p.inputs || []).forEach(input => {
      if (input.name && input.description) {
        descMap[input.name] = input.description;
      }
    });

    // Also get inline descriptions from variables
    variables.forEach(v => {
      if (v.description && !descMap[v.name]) {
        descMap[v.name] = v.description;
      }
    });

    const hasRequired = variables.some(v => v.required);
    const hasSnapshot = !!this._hass?.states?.['sensor.ha_server_snapshot'];

    const allInputs = variables.map(v => {
      const desc = descMap[v.name] || '';
      const label = desc || v.name;
      const marker = v.required ? '<span class="required-marker">*</span>' : '';
      const injectBtn = hasSnapshot && (
        label.toLowerCase().includes('server snapshot') ||
        label.toLowerCase().includes('systemsnapshot') ||
        v.name.toLowerCase().includes('systemsnapshot') ||
        v.name.toLowerCase().includes('serversnapshot')
      )
        ? `<button class="ui-fab ui-fab--small fill-inject-btn" data-variable="${escapeHtml(v.name)}" data-fab-tooltip="Inject snapshot" aria-label="Inject server snapshot"><ha-icon icon="fluent:attach-text-24-regular"></ha-icon></button>`
        : '';
      return `<div class="fill-field-wrapper">
        <div class="ui-input ui-input--textarea">
          <div class="ui-input__pill">
            <label class="ui-input__label">${escapeHtml(label)}${marker}</label>
            <textarea class="ui-input__field fill-variable-field" data-variable="${escapeHtml(v.name)}" data-required="${v.required}" rows="1"></textarea>
          </div>${injectBtn}
        </div>
      </div>`;
    }).join('');

    return `<div class="ui-modal-backdrop is-visible"><div class="ui-modal ui-modal--s fill-modal" role="dialog" aria-modal="true">
      <button class="ui-modal__close" id="fill-close-x" aria-label="Close"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      <h2 class="ui-modal__title">${escapeHtml(p.title)}<ui-info-icon data-tooltip-key="fillPrompt" position="bottom" z-index="1001"></ui-info-icon></h2>
      <p class="fill-modal-subtitle">Fill in the fields to copy this prompt.${hasRequired ? ' Required fields are marked with <span class="required-marker">*</span>' : ''}</p>
      <div class="fill-variables-list">${allInputs}</div>
      <div class="form-buttons">
        ${this._devMode ? '<button class="ui-btn ui-btn--outline" id="fill-copy-raw">Copy Raw</button>' : ''}
        <span class="submit-btn-wrapper" id="fill-copy-wrapper"><button class="ui-btn ui-btn--accent ui-btn--filled" id="fill-copy"${hasRequired ? ' disabled' : ''}>Copy Prompt</button></span>
      </div>
    </div></div>`;
  }

export function renderDevScoreModal() {
    if (!this.state.devScoreModal) return "";
    const p = this.state.prompts.find((p) => p.id === this.state.devScoreModal);
    if (!p) return "";
    const currentScore = p.score != null ? parseFloat(p.score).toFixed(1) : '';
    const tier = getQualityTier(p.score);
    return `<div class="ui-modal-backdrop is-visible"><div class="ui-modal ui-modal--s delete-confirmation-modal" role="dialog" aria-modal="true"><button class="ui-modal__close" id="dev-score-close-x" aria-label="Close"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button><h2 class="ui-modal__title">Set Score</h2><p class="confirmation-message">${escapeHtml(p.title)}</p><p class="confirmation-hint">Current: ${currentScore ? `${tier.tierLetter} (${currentScore})` : 'Unscored'}</p><div style="display:flex;justify-content:center;margin:var(--ui-space-4) 0;"><ui-number-input id="dev-score-input" value="${currentScore || 0}" min="0" max="10" step="0.5" aria-label="Score"></ui-number-input></div><div class="form-buttons"><button class="ui-btn ui-btn--outline" id="dev-score-clear">Clear Score</button><button class="ui-btn ui-btn--accent ui-btn--filled" id="dev-score-confirm">Set</button></div></div></div>`;
  }

/** Extract declared input names from an <inputs> XML block.
 *  Returns a Set of tag names (e.g. 'skillName', 'context').
 *  If `text` is a full prompt (not just the <inputs> block), the block
 *  is isolated first so body tags don't pollute the result. */
function _extractInputNames(text) {
  if (!text) return null;
  const trimmed = text.trimStart();
  // Isolate <inputs> block if the text contains more than just the block
  const openMatch = trimmed.match(/^<inputs(?=[\s>\/\n])/i);
  let block = trimmed;
  if (openMatch) {
    const closeMatch = trimmed.match(/.*(<\/inputs\s*>)/is);
    if (closeMatch) {
      const closeIdx = trimmed.lastIndexOf(closeMatch[1]);
      block = trimmed.substring(0, closeIdx + closeMatch[1].length);
    } else {
      return null; // malformed — no closing tag
    }
  } else {
    return null; // no <inputs> block found
  }
  const re = /<(?!inputs\b|\/inputs\b|\/)([a-zA-Z][\w-]*)/g;
  const names = new Set();
  let m;
  while ((m = re.exec(block)) !== null) names.add(m[1]);
  return names.size ? names : null;
}

export function renderViewModal() {
    if (!this.state.viewingPrompt) { this._pendingHighlight = null; return ""; }
    const p = this.state.prompts.find(
      (p) => p.id === this.state.viewingPrompt
    );
    if (!p) { this._pendingHighlight = null; return ""; }
    const tier = getQualityTier(p.score);
    const buttonText = this.state.selectedScope === 'No Focus' ? 'Optimize' : this.state.selectedScope;
    const scopeOptions = [
      'General mode',
      'Answer directly',
      'Clarify first',
      'Concise but complete',
      'Total rebuild'
    ];

    const isReference = (p.categories || []).includes('Reference');
    const categoryTags = (p.categories?.length ? p.categories : ['Uncategorized'])
      .map(c => `<span class="pm-tag" ${getCategoryStyle(c)}>${escapeHtml(c)}</span>`)
      .join('');

    // Stat chips — each stat rendered as its own pill
    // Order: prompt size (tokens) → history (version, uses)
    const statChips = [];
    const tokenEst = estimateTokens(p.content || '');
    statChips.push(`<span class="view-strip__chip">${tokenEst} tokens</span>`);
    statChips.push(`<span class="view-strip__chip">v${p.version || 1}</span>`);
    const uLabel = p.useCount === 1 ? '1 use' : `${p.useCount || 0} uses`;
    statChips.push(`<span class="view-strip__chip">${uLabel}</span>`);
    if (this._devMode) statChips.push(`<span class="view-strip__chip prompt-id">${escapeHtml(getPromptSlug(p))}</span>`);
    const statsHtml = statChips.join('');

    // Score / status badge — three states: scored, reference, unscored
    let badgeHtml;
    if (isReference) {
      badgeHtml = `<span class="view-strip__badge view-strip__badge--muted">Reference</span>`;
    } else if (tier.numericScore !== null) {
      badgeHtml = `<span class="view-strip__badge" style="--_badge-color:${tier.tierColor};--_badge-bg:${tier.tierColorFaint};"><span class="view-strip__badge-score">${tier.numericScore.toFixed(1)}</span><span class="view-strip__badge-tier">${tier.descriptor}</span></span>`;
    } else {
      badgeHtml = `<span class="view-strip__badge view-strip__badge--muted">Not rated</span>`;
    }
    const stripHtml = `<div class="view-strip">${badgeHtml}<span class="view-strip__spacer"></span><div class="view-strip__chips">${statsHtml}</div></div>`;

    // Detect <inputs> block for collapsible rendering in view modal only.
    // The edit textarea (renderFormModal) shows the full raw content including
    // the <inputs> block — collapsing is a read-time presentation concern.
    // Case-insensitive, requires tag boundary (space, > or newline after "inputs"),
    // and finds the last closing tag to handle nested references.
    const trimmedContent = (p.content || '').trimStart();
    let inputsToggleHtml = '';
    let displayContent = p.content;
    let inputNames = null;
    let inputsBlock = null;
    const inputsOpenMatch = trimmedContent.match(/^<inputs(?=[\s>\/\n])/i);

    if (inputsOpenMatch) {
      const closeMatch = trimmedContent.match(/.*(<\/inputs\s*>)/is);
      if (closeMatch) {
        const closeIdx = trimmedContent.lastIndexOf(closeMatch[1]);
        const endOfBlock = closeIdx + closeMatch[1].length;
        inputsBlock = trimmedContent.substring(0, endOfBlock);
        const restContent = trimmedContent.substring(endOfBlock).trimStart();
        // Count opening XML tags that are not <inputs>, </inputs>, or self-closing.
        // This is a heuristic for the number of input variables declared — not a
        // full XML parser. Only used for the toggle label ("Inputs (N)").
        const childCount = (inputsBlock.match(/<(?!inputs\b|\/inputs\b|\/)([a-zA-Z][\w-]*)/g) || []).length;
        // Extract declared input names for single-brace highlighting in body
        inputNames = _extractInputNames(inputsBlock);

        inputsToggleHtml = `<div class="inputs-collapsible">` +
          `<button class="inputs-toggle" id="inputs-toggle-btn" aria-expanded="false">` +
            `<svg class="inputs-toggle__chevron" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">` +
              `<path d="M7 10l5 5 5-5z"/>` +
            `</svg>` +
            `<span class="inputs-toggle__label">${childCount} inputs</span>` +
          `</button>` +
          `<div class="inputs-collapsible__body">` +
            `<pre class="pm-highlighted inputs-highlighted${isHighlightCached(inputsBlock) ? '' : ' pm-hl--pending'}">${isHighlightCached(inputsBlock) ? highlightPrompt(inputsBlock) : escapeHtml(inputsBlock)}</pre>` +
          `</div>` +
        `</div>`;
        displayContent = restContent;
      }
    }

    // Use sync path when cached (instant, no animation), async when not
    const cached = isHighlightCached(displayContent, inputNames);
    let bodyContent, pendingClass;
    if (cached) {
      bodyContent = highlightPrompt(displayContent, inputNames);
      pendingClass = '';
      this._pendingHighlight = null;
    } else {
      bodyContent = escapeHtml(displayContent || '');
      pendingClass = ' pm-hl--pending';
      this._pendingHighlight = { content: displayContent, inputNames, inputsBlock };
    }

    return `<div class="ui-modal-backdrop is-visible"><div class="ui-modal view-modal" role="dialog" aria-modal="true"><button class="ui-modal__close" id="view-close-x" aria-label="Close"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button><h2 class="ui-modal__title">${escapeHtml(
      p.title
    )}${p.description ? `<ui-info-icon id="view-desc-info" position="bottom" z-index="1001"></ui-info-icon>` : ''}</h2><div class="view-meta">${categoryTags}</div>${stripHtml}<div class="view-content">${inputsToggleHtml}<pre class="pm-highlighted${pendingClass}">${bodyContent}</pre></div><div class="form-buttons">${isReference ? '' : `<ui-info-icon id="scope-info" position="top" z-index="1001"></ui-info-icon><div class="ui-split ${this.state.scopeDropdownOpen ? 'ui-split--open' : ''} ui-split--toggle"><button class="ui-split__main" data-view-optimize="${p.id}"><span class="ui-split__label">${buttonText}</span></button><button class="ui-split__arrow" id="scope-dropdown-toggle"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg></button><div class="ui-menu ${this.state.scopeDropdownOpen ? 'ui-menu--open' : ''}" id="scope-dropdown">${scopeOptions.map(option => `<button class="ui-menu__item ${this.state.selectedScope === option ? 'ui-menu__item--selected' : ''}" data-scope="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join('')}</div></div><button class="ui-btn ui-btn--outline" data-view-score="${p.id}">Rate</button>`}<button class="ui-btn ui-btn--outline" id="view-copy">Copy</button><button class="ui-btn ui-btn--outline" data-view-edit="${p.id}">Edit</button><button class="ui-btn ui-btn--danger ui-btn--filled" data-view-delete="${p.id}">Delete</button></div></div></div>`;
  }

export function renderOptimizeModal() {
    if (!this.state.optimizingPrompt) return "";
    const { loading, title, original, originalScore, optimized, optimizedScore, improvements } =
      this.state.optimizingPrompt;
    if (loading)
      return `<div class="ui-modal-backdrop is-visible"><div class="ui-modal optimize-modal optimize-modal--loading" role="dialog" aria-modal="true"><button class="ui-modal__close" id="optimize-close-x" aria-label="Close"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button><h2 class="ui-modal__title">Optimizing Prompt...</h2><div class="loading-indicator"><ha-icon icon="svg-spinners:3-dots-move" class="loading-spinner-icon"></ha-icon><p>Analyzing and improving your prompt...</p></div></div></div>`;
    const oldTier = getQualityTier(originalScore),
      newTier = getQualityTier(optimizedScore);
    const oldDisplay =
      oldTier.numericScore !== null
        ? `${oldTier.numericScore.toFixed(1)}`
        : '—';
    const newDisplay =
      newTier.numericScore !== null
        ? `${newTier.numericScore.toFixed(1)}`
        : '—';

    // Score delta pill
    let deltaHtml = '';
    if (oldTier.numericScore !== null && newTier.numericScore !== null) {
      const delta = newTier.numericScore - oldTier.numericScore;
      const sign = delta > 0 ? '+' : '';
      const deltaClass = delta > 0 ? 'optimize-delta--up' : delta < 0 ? 'optimize-delta--down' : 'optimize-delta--same';
      deltaHtml = `<span class="optimize-delta ${deltaClass}">${sign}${delta.toFixed(1)}</span>`;
    }

    // Token & character stats
    const oldTokens = estimateTokens(original || '');
    const newTokens = estimateTokens(optimized || '');
    const oldChars = (original || '').length;
    const newChars = (optimized || '').length;
    const charDiff = newChars - oldChars;
    const charSign = charDiff > 0 ? '+' : '';
    const charSummary = charDiff !== 0
      ? `<span class="optimize-stat-delta">${charSign}${charDiff} chars</span>`
      : '';

    const improvementsList =
      typeof improvements === "string"
        ? improvements.split(",").map((i) => i.trim())
        : Array.isArray(improvements)
        ? improvements
        : [];

    // Extract input names from original content for single-brace highlighting
    const optInputNames = _extractInputNames(original);

    return `<div class="ui-modal-backdrop is-visible"><div class="ui-modal optimize-modal" role="dialog" aria-modal="true"><button class="ui-modal__close" id="optimize-close-x" aria-label="Close"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button><h2 class="ui-modal__title">${escapeHtml(title || "Optimized Prompt")}<ui-info-icon data-tooltip-key="optimizeModal" position="bottom" z-index="1001"></ui-info-icon></h2><div class="optimize-stats-bar"><div class="optimize-scores-row"><span class="optimize-score-pill" style="color:${oldTier.tierColor}">${oldTier.tierLetter} ${oldDisplay}</span>${deltaHtml}<span class="optimize-score-pill optimized" style="color:${newTier.tierColor}">${newTier.tierLetter} ${newDisplay}</span></div><div class="optimize-meta-row"><span class="optimize-meta-chip">${oldTokens} → ${newTokens} tokens</span>${charSummary}</div></div><div class="optimize-comparison"><div class="optimize-column"><div class="optimize-header"><h3>Before</h3><button class="ui-copy-btn" id="optimize-copy-original" title="Copy original"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a 2 2 0 0 1-2-2V4a 2 2 0 0 1 2-2h9a 2 2 0 0 1 2 2v1"></path></svg></button></div><div class="optimize-content"><pre class="pm-highlighted">${highlightPrompt(original, optInputNames)}</pre></div></div><div class="optimize-column"><div class="optimize-header"><h3>After</h3><button class="ui-copy-btn" id="optimize-copy-optimized" title="Copy optimized"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a 2 2 0 0 1-2-2V4a 2 2 0 0 1 2-2h9a 2 2 0 0 1 2 2v1"></path></svg></button></div><div class="optimize-content"><pre class="pm-highlighted">${highlightPrompt(optimized, optInputNames)}</pre></div></div></div>${improvementsList.length > 0 ? `<div class="optimize-improvements"><div class="optimize-improvements-chips">${
      improvementsList.map((i) => `<span class="optimize-improvement-chip">${escapeHtml(i)}</span>`).join("")
    }</div></div>` : ''}<div class="form-buttons"><button class="ui-btn" id="optimize-reject">Keep Original</button><button class="ui-btn ui-btn--accent ui-btn--filled" id="optimize-accept">Use Optimized</button></div></div></div>`;
  }

export function renderTableModal() {
    if (!this.state.showTableModal) return "";
    const cols = this.state.tableColumns;
    const sort = this.state.tableSort;

    // Sort prompts
    let sortedPrompts = [...this.state.prompts];
    if (sort.column) {
      sortedPrompts.sort((a, b) => {
        let aVal, bVal;
        switch (sort.column) {
          case 'title':
            aVal = (a.title || "").toLowerCase(); bVal = (b.title || "").toLowerCase();
            break;
          case 'category':
            aVal = (a.categories?.[0] || "").toLowerCase(); bVal = (b.categories?.[0] || "").toLowerCase();
            break;
          case 'score':
            aVal = a.score ?? -1; bVal = b.score ?? -1;
            break;
          case 'version':
            aVal = a.version || 1; bVal = b.version || 1;
            break;
          case 'uses':
            aVal = a.useCount || 0; bVal = b.useCount || 0;
            break;
          case 'tokens':
            aVal = (a.content || '').length; bVal = (b.content || '').length;
            break;
          case 'description':
            aVal = (a.description || "").toLowerCase(); bVal = (b.description || "").toLowerCase();
            break;
          default:
            return 0;
        }
        if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Column definitions — order determines table column order
    const columnDefs = [
      { key: 'title',       label: 'Name',        always: true },
      { key: 'category',    label: 'Category' },
      { key: 'score',       label: 'Score' },
      { key: 'version',     label: 'Ver' },
      { key: 'uses',        label: 'Uses' },
      { key: 'tokens',      label: 'Tokens' },
      { key: 'description', label: 'Description' },
    ];
    // Cell getters per column key
    const cellValue = (p, key) => {
      switch (key) {
        case 'title': return escapeHtml(p.title || '');
        case 'category': return escapeHtml(p.categories?.length ? p.categories.join(', ') : 'Uncategorized');
        case 'score': return p.score != null ? parseFloat(p.score).toFixed(1) : '';
        case 'version': return `v${p.version || 1}`;
        case 'uses': return String(p.useCount || 0);
        case 'tokens': return estimateTokens(p.content || '');
        case 'description': return escapeHtml(p.description || '');
        default: return '';
      }
    };

    const tableRows = sortedPrompts.map(p => {
      const cells = columnDefs.map(c => {
        const visible = c.always || cols[c.key];
        return `<td class="col-${c.key}"${visible ? '' : ' style="display:none"'}>${cellValue(p, c.key)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join("");

    const sortIndicator = (col) => {
      if (sort.column !== col) return '<span class="sort-indicator">↕</span>';
      return `<span class="sort-indicator">${sort.direction === 'asc' ? '↑' : '↓'}</span>`;
    };
    const sortedClass = (col) => sort.column === col ? 'sorted' : '';

    // Find the last visible column key for the rounded-corner class
    const visibleKeys = columnDefs.filter(c => c.always || cols[c.key]).map(c => c.key);
    const lastVisibleKey = visibleKeys[visibleKeys.length - 1];

    // Build header cells
    const headerCells = columnDefs.map(c => {
      const visible = c.always || cols[c.key];
      const isLast = c.key === lastVisibleKey;
      return `<th class="col-${c.key} ${sortedClass(c.key)}${isLast ? ' col-last-visible' : ''}" data-sort="${c.key}"${visible ? '' : ' style="display:none"'}>${c.label}${sortIndicator(c.key)}</th>`;
    }).join('');

    // Build column toggle checkboxes (skip 'title' — always shown)
    const checkboxSvg = '<svg class="ui-checkbox__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 12.5l5.5 5.5 10.5-10.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const toggles = columnDefs.filter(c => !c.always).map(c =>
      `<label class="ui-checkbox"><input type="checkbox" class="ui-checkbox__input" id="col-toggle-${c.key}" ${cols[c.key] ? 'checked' : ''}><span class="ui-checkbox__box">${checkboxSvg}</span><span class="ui-checkbox__label">${c.label}</span></label>`
    ).join('');

    // Suppress intro animation on sort-only re-renders
    const noAnim = this.state._tableModalNoAnim;
    this.state._tableModalNoAnim = false;
    const animClass = noAnim ? ' table-modal--no-anim' : '';

    return `<div class="ui-modal-backdrop is-visible"><div class="ui-modal table-modal${animClass}" role="dialog" aria-modal="true">
      <button class="ui-modal__close" id="table-modal-close-x" aria-label="Close"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      <div class="table-modal-header">
        <h2 class="ui-modal__title">All Prompts (${sortedPrompts.length})<ui-info-icon data-tooltip-key="allPrompts" position="bottom" z-index="1001"></ui-info-icon></h2>
        <div class="table-header-actions">
          <div class="table-column-toggles">${toggles}</div>
          <button class="ui-copy-btn" id="table-copy-btn" title="Copy Table">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a 2 2 0 0 1-2-2V4a 2 2 0 0 1 2-2h9a 2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>
      </div>
      <div class="table-scroll-container">
        <table class="prompts-table">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </div></div>`;
  }

export function generateTableText() {
    const cols = this.state.tableColumns;
    const sort = this.state.tableSort;

    // Build column definitions: { key, header, getter, align }
    const colDefs = [{ key: 'title', header: 'Name', getter: p => p.title || '', align: 'left' }];
    if (cols.category) colDefs.push({ key: 'category', header: 'Category', getter: p => p.categories?.length ? p.categories.join(', ') : 'Uncategorized', align: 'left' });
    if (cols.score) colDefs.push({ key: 'score', header: 'Score', getter: p => p.score != null ? parseFloat(p.score).toFixed(1) : '—', align: 'right' });
    if (cols.version) colDefs.push({ key: 'version', header: 'Ver', getter: p => `v${p.version || 1}`, align: 'right' });
    if (cols.uses) colDefs.push({ key: 'uses', header: 'Uses', getter: p => String(p.useCount || 0), align: 'right' });
    if (cols.tokens) colDefs.push({ key: 'tokens', header: 'Tokens', getter: p => estimateTokens(p.content || ''), align: 'right' });
    if (cols.description) colDefs.push({ key: 'description', header: 'Description', getter: p => p.description || '', align: 'left' });

    // Sort prompts same as table display
    let sortedPrompts = [...this.state.prompts];
    if (sort.column) {
      sortedPrompts.sort((a, b) => {
        let aVal, bVal;
        switch (sort.column) {
          case 'title': aVal = (a.title || "").toLowerCase(); bVal = (b.title || "").toLowerCase(); break;
          case 'category': aVal = (a.categories?.[0] || "").toLowerCase(); bVal = (b.categories?.[0] || "").toLowerCase(); break;
          case 'score': aVal = a.score ?? -1; bVal = b.score ?? -1; break;
          case 'version': aVal = a.version || 1; bVal = b.version || 1; break;
          case 'uses': aVal = a.useCount || 0; bVal = b.useCount || 0; break;
          case 'tokens': aVal = (a.content || '').length; bVal = (b.content || '').length; break;
          case 'description': aVal = (a.description || "").toLowerCase(); bVal = (b.description || "").toLowerCase(); break;
          default: return 0;
        }
        if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Strip zero-width / invisible Unicode characters that break plain-text alignment
    const clean = s => s.replace(/[\u200B-\u200D\u00AD\u2060\uFEFF]/g, '');

    // Build rows as arrays of cell strings
    const dataRows = sortedPrompts.map(p => colDefs.map(c => clean(c.getter(p))));

    // Compute column widths (header vs longest data value)
    const colWidths = colDefs.map((c, i) => {
      const headerLen = c.header.length;
      const dataMax = dataRows.reduce((m, row) => Math.max(m, row[i].length), 0);
      return Math.max(headerLen, dataMax);
    });

    // Pad helper
    const pad = (str, width, align) => {
      const truncated = str.length > width ? str.slice(0, width - 1) + '…' : str;
      return align === 'right' ? truncated.padStart(width) : truncated.padEnd(width);
    };

    // Format header + separator + rows
    const headerLine = colDefs.map((c, i) => pad(c.header, colWidths[i], c.align)).join('  ');
    const separator = colWidths.map(w => '─'.repeat(w)).join('──');
    const bodyLines = dataRows.map(row =>
      colDefs.map((c, i) => pad(row[i], colWidths[i], c.align)).join('  ')
    );

    return [headerLine, separator, ...bodyLines].join('\n');
  }
// |   END: render.js
