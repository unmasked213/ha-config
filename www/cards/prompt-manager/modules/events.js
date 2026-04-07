// | START: events.js
// |  PATH: www/cards/prompt-manager/modules/events.js
// InputsInferred: []
// All event handlers and CRUD operations for the prompt manager card.
// Mixed into PromptManagerCard.prototype via Object.assign in prompt-manager.js.
// All exported functions execute with `this` bound to the card instance.
// Depends on: ./constants.js, ./scoring.js, ./variables.js, ./data.js,
//   /local/base/tooltips.js (showRichTooltip, hideRichTooltip),
//   prompt-manager.js (this.state, this.shadow, this._hass, this._devMode, this.render)
import { TOOLTIP_CONTENT, CATEGORY_META, CATEGORIES } from './constants.js';
import { scorePrompt, optimizePrompt, calculateMovement, pollForResult, SCOPE_DIRECTIVES } from './scoring.js';
import { extractVariables, substituteVariables } from './variables.js';
import { savePrompts } from './data.js';
import { showRichTooltip, hideRichTooltip } from '/local/base/tooltips.js';

// ╭────────────────────╮
// │   FAB ANIMATION
// ╰────────────────────╯

/**
 * Shows a FAB with the same spring entrance animation as rich tooltips.
 * Uses a CSS class rather than style.display so the transition can play.
 */
function showFab(btn) {
  if (!btn) return;
  btn.style.display = '';
  // Trigger a reflow so the transition fires from the hidden state
  btn.offsetWidth; // eslint-disable-line no-unused-expressions
  btn.classList.add('ai-fab--visible');
}

/**
 * Hides a FAB with a matching exit transition, then sets display:none.
 * Uses transitionend as the primary trigger with a fallback setTimeout
 * slightly longer than the CSS transition (320ms transform) in case the
 * event never fires (e.g. element detached, zero-duration override).
 */
function hideFab(btn) {
  if (!btn) return;
  btn.classList.remove('ai-fab--visible');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (!btn.classList.contains('ai-fab--visible')) {
      btn.style.display = 'none';
    }
    return;
  }

  let settled = false;
  function hide() {
    if (settled) return;
    settled = true;
    clearTimeout(fallback);
    if (!btn.classList.contains('ai-fab--visible')) {
      btn.style.display = 'none';
    }
  }
  btn.addEventListener('transitionend', hide, { once: true });
  const fallback = setTimeout(hide, 350);
}

// ╭────────────────────╮
// │   CRUD OPERATIONS
// ╰────────────────────╯

export function addPrompt(title, content, categories, description, inputs = []) {
    const cats = (Array.isArray(categories) && categories.length) ? categories : ['Uncategorized'];
    const newPrompt = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      title: title || "Untitled Prompt",
      content,
      categories: cats,
      inputs: inputs || [],
      description: description || "",
      lastUsed: new Date(),
      useCount: 0,
      created: new Date(),
      score: null,
      version: 1,
    };
    this.state.prompts.unshift(newPrompt);
    savePrompts(this._hass, this.state.prompts).then(synced => { this._pendingBackendSync = !synced; });
    this.state.showAddForm = false;
    this.render();
    // Reference prompts are never auto-scored, regardless of other categories.
    const scoreCategory = cats.includes('Reference') ? null : (cats.find(c => c !== 'Uncategorized') || cats[0] || null);
    if (!scoreCategory) {
      this.updatePromptsGrid();
    } else {
      this.state.scoring[newPrompt.id] = true;
      this.updatePromptsGrid();
      scorePrompt(this._hass, content, scoreCategory).then((score) => {
        if (score !== null) {
          const mv = calculateMovement(null, score);
          if (mv) this.state.movement[newPrompt.id] = mv;
          this.state.prompts = this.state.prompts.map((p) =>
            p.id === newPrompt.id ? { ...p, score } : p
          );
          savePrompts(this._hass, this.state.prompts).then(synced => { this._pendingBackendSync = !synced; });
          this.state.justScored[newPrompt.id] = true;
          setTimeout(() => {
            delete this.state.justScored[newPrompt.id];
            this.updatePromptsGrid();
          }, 2000);
        } else {
          console.warn('Auto-scoring failed for new prompt:', newPrompt.title);
        }
        delete this.state.scoring[newPrompt.id];
        this._snapshotGrid();
        this.updatePromptsGrid();
      });
    }
  }

export function updatePrompt(id, updates) {
    const oldPrompt = this.state.prompts.find((p) => p.id === id);
    const contentChanged =
      updates.content && oldPrompt && updates.content !== oldPrompt.content;
    const oldCategories = oldPrompt?.categories || ['Uncategorized'];
    const newCategories = (Array.isArray(updates.categories) && updates.categories.length)
      ? updates.categories
      : oldCategories;
    const categoryChanged = JSON.stringify([...newCategories].sort()) !== JSON.stringify([...oldCategories].sort());
    if (contentChanged && oldPrompt?.content) {
      const versions = oldPrompt.versions || [];
      versions.push({
        timestamp: new Date().toISOString(),
        content: oldPrompt.content,
      });
      if (versions.length > 10) versions.shift();
      updates.versions = versions;
      updates.version = (oldPrompt.version || 1) + 1;
    }

    // Determine the score to persist in this save:
    // - Has Reference category (regardless of others) → clear score
    // - Content changed → clear score (will rescore below)
    // - Otherwise → keep existing score
    const hasReference = newCategories.includes('Reference');
    let scoreForSave = oldPrompt?.score ?? null;
    if (hasReference) {
      scoreForSave = null;
    } else if (contentChanged) {
      scoreForSave = null;
    }

    this.state.prompts = this.state.prompts.map((p) =>
      p.id === id
        ? {
            ...p,
            ...updates,
            categories: newCategories,
            inputs: updates.inputs !== undefined ? updates.inputs : p.inputs,
            score: scoreForSave,
            versions:
              updates.versions !== undefined
                ? updates.versions
                : p.versions || [],
          }
        : p
    );
    savePrompts(this._hass, this.state.prompts).then(synced => { this._pendingBackendSync = !synced; });
    this.state.editingPrompt = null;
    this.render();

    // Rescore if content or categories changed, and prompt has no Reference category.
    // Reference prompts are never auto-scored regardless of other categories present.
    const scoreCategory = newCategories.includes('Reference') ? null : (newCategories.find(c => c !== 'Uncategorized') || newCategories[0] || null);
    const needsRescore = !!scoreCategory && (contentChanged || categoryChanged);
    if (needsRescore) {
      const content = updates.content || oldPrompt?.content;
      if (content) {
        this.state.scoring[id] = true;
        this.updatePromptsGrid();
        scorePrompt(this._hass, content, scoreCategory).then((score) => {
          if (score !== null) {
            const mv = calculateMovement(oldPrompt?.score, score);
            if (mv) this.state.movement[id] = mv;
            this.state.prompts = this.state.prompts.map((p) =>
              p.id === id ? { ...p, score } : p
            );
            savePrompts(this._hass, this.state.prompts).then(synced => { this._pendingBackendSync = !synced; });
            this.state.justScored[id] = true;
            setTimeout(() => {
              delete this.state.justScored[id];
              this.updatePromptsGrid();
            }, 2000);
          } else {
            console.warn('Re-scoring failed for updated prompt:', id);
          }
          delete this.state.scoring[id];
          this._snapshotGrid();
          this.updatePromptsGrid();
        });
      }
    }
  }

export function deletePrompt(id) {
    this._snapshotGrid();
    this.state.prompts = this.state.prompts.filter((p) => p.id !== id);
    savePrompts(this._hass, this.state.prompts).then(synced => { this._pendingBackendSync = !synced; });
    this.render();
  }

export async function copyPrompt(prompt, filledContent = null) {
    // If prompt has variables and no filled content provided, show fill modal
    if (!filledContent) {
      const variables = extractVariables(prompt.content);
      if (variables.length > 0) {
        this.state.fillingPrompt = prompt.id;
        this.render();
        return;
      }
    }

    const slug = this.getPromptSlug(prompt);
    const isReference = (prompt.categories || []).includes('Reference');
    const baseContent = filledContent || prompt.content;

    // Copy output wrapping: Reference always fenced (AI consumption), dev mode
    // fenced with provenance tag inside, normal mode raw. The pm-source tag must
    // be inside the fence — an AI consumer sees one fenced block, not raw XML
    // floating above a code block. See also: substituteVariables skipFenceWrap
    // param which prevents double-fencing when variable values are multiline.
    let contentToCopy;
    if (isReference) {
      contentToCopy = `\`\`\`\n${baseContent}\n\`\`\``;
    } else if (this._devMode) {
      contentToCopy = `\`\`\`\n<pm-source id="${slug}" />\n\n${baseContent}\n\`\`\``;
    } else {
      contentToCopy = baseContent;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(contentToCopy);
      } else {
        const el = document.createElement("textarea");
        Object.assign(el, { value: contentToCopy });
        Object.assign(el.style, {
          position: "fixed",
          opacity: "0",
        });
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      this.state.prompts = this.state.prompts.map((p) =>
        p.id === prompt.id
          ? { ...p, useCount: p.useCount + 1 }
          : p
      );
      savePrompts(this._hass, this.state.prompts).then(synced => { this._pendingBackendSync = !synced; });
      const btn = this.shadow.querySelector(
        `[data-copy-id="${prompt.id}"]`
      );
      if (btn) {
        const orig = btn.getAttribute("aria-label") || "Copy";
        btn.classList.add("ui-copy-btn--copied");
        btn.setAttribute("aria-label", "Done");
        btn.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>';
        this._copyTimers = this._copyTimers || new Map();
        clearTimeout(this._copyTimers.get(prompt.id));
        this._copyTimers.set(
          prompt.id,
          setTimeout(() => {
            const b = this.shadow.querySelector(
              `[data-copy-id="${prompt.id}"]`
            );
            if (b) {
              b.classList.remove("ui-copy-btn--copied");
              b.innerHTML =
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a 2 2 0 0 1-2-2V4a 2 2 0 0 1 2-2h9a 2 2 0 0 1 2 2v1"></path></svg>';
              b.setAttribute("aria-label", orig);
            }
            this._copyTimers.delete(prompt.id);
          }, 3000)
        );
      }
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

export async function copyTextToClipboard(text, btnId) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement("textarea");
        Object.assign(el, { value: text });
        Object.assign(el.style, { position: "fixed", opacity: "0" });
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      const btn = this.shadow.getElementById(btnId);
      if (btn) {
        btn.classList.add("ui-copy-btn--copied");
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>';
        setTimeout(() => {
          const b = this.shadow.getElementById(btnId);
          if (b) {
            b.classList.remove("ui-copy-btn--copied");
            b.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a 2 2 0 0 1-2-2V4a 2 2 0 0 1 2-2h9a 2 2 0 0 1 2 2v1"></path></svg>';
          }
        }, 2000);
      }
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

// ╭────────────────────╮
// │   FILTER / SORT
// ╰────────────────────╯

export function getFilteredPrompts() {
    return this.state.prompts
      .filter((p) => {
        const search =
          !this.state.searchTerm ||
          [p.title, p.description, ...(p.categories || [])].some((t) =>
            t.toLowerCase().includes(
              this.state.searchTerm.toLowerCase()
            )
          );
        const categoryMatch =
          !this.state.selectedCategory ||
          (p.categories || []).includes(this.state.selectedCategory);
        return search && categoryMatch;
      });
  }

export function getAllCategories() {
    return CATEGORIES;
  }

// ╭────────────────────╮
// │   CATEGORY DROPDOWN
// ╰────────────────────╯

export function _toggleCategoryDropdown(type, forceState = null) {
    const dropdown = this.shadow.querySelector(`#${type}-category-trigger`)?.closest('.category-dropdown');
    const menu = this.shadow.getElementById(`${type}-category-menu`);
    const trigger = this.shadow.getElementById(`${type}-category-trigger`);
    if (!dropdown || !menu || !trigger) return;

    const isOpen = forceState !== null ? forceState : !dropdown.classList.contains('category-dropdown--open');

    dropdown.classList.toggle('category-dropdown--open', isOpen);
    menu.classList.toggle('ui-menu--open', isOpen);
    trigger.setAttribute('aria-expanded', isOpen);
    this.state.formCategoryOpen[type] = isOpen;
  }

export function _toggleCategory(type, category) {
    // Adds or removes a category from the multi-select state array.
    // Reference is exclusive — it cannot coexist with other categories.
    const cats = this.state.formCategory[type];
    const idx = cats.indexOf(category);

    if (idx !== -1) {
      // Removing a category — cancel any pending pulse-out timer to prevent the
      // deferred callback from overwriting the user's removal with ['Reference'].
      if (this._refPulseTimer) {
        clearTimeout(this._refPulseTimer);
        this._refPulseTimer = null;
      }
      this.state.formCategory[type] = cats.filter(c => c !== category);
    } else if (category === 'Reference') {
      // Adding Reference: pulse out existing chips, then replace after animation
      // Dropdown must close before pulse-out starts to prevent the user selecting
      // another category during the 700ms animation window. Without this, the
      // deferred state replacement would overwrite whatever the second pick was.
      if (cats.length > 0) {
        this._toggleCategoryDropdown(type, false);
        this._pulseOutChips(type);
        const pulseTimer = setTimeout(() => {
          this._refPulseTimer = null;
          this.state.formCategory[type] = ['Reference'];
          this._updateCategoryChips(type);
          this.updateFormValidity(type);
        }, 700);
        this._refPulseTimer = pulseTimer;
        return;
      }
      this.state.formCategory[type] = ['Reference'];
    } else if (cats.includes('Reference')) {
      // Adding non-Reference while Reference active: replace Reference
      this.state.formCategory[type] = [category];
    } else {
      // Normal add
      this.state.formCategory[type] = [...cats, category];
    }
    this._updateCategoryChips(type);
    this.updateFormValidity(type);
  }

export function _updateCategoryChips(type) {
    const cats = this.state.formCategory[type];
    const dropdown = this.shadow.querySelector(`#${type}-category-trigger`)?.closest('.category-dropdown');
    if (!dropdown) return;

    // Chips live in .form-header__chips — a full-width row below the title/category
    // row, so they can flow horizontally across the whole modal width unconstrained
    // by the compact 130px dropdown trigger column.
    const formHeader = dropdown.closest('.form-header');
    let chipsEl = formHeader?.querySelector('.category-dropdown__chips');
    const menu = this.shadow.getElementById(`${type}-category-menu`);

    // Always ensure the chips container exists in .form-header so its reserved
    // min-height prevents the modal from jumping when the first chip is added.
    if (!chipsEl && formHeader) {
      chipsEl = document.createElement('div');
      chipsEl.className = 'category-dropdown__chips';
      formHeader.appendChild(chipsEl);
    }

    if (cats.length) {
      // Snapshot existing chips so only newly added ones get the pop-in animation.
      const existingCats = chipsEl
        ? [...chipsEl.querySelectorAll('.category-chip')].map(el => el.dataset.chipCategory)
        : [];

      chipsEl.innerHTML = cats.map(c => {
        const tokenName = this.getCategoryTokenName(c);
        const isNew = !existingCats.includes(c);
        return `<span class="ui-badge category-chip${isNew ? ' category-chip--new' : ''}" style="--_badge-color:var(--ui-cat-${tokenName});--_badge-color-faint:var(--ui-cat-${tokenName}-faint)" data-chip-category="${this.escapeHtml(c)}" data-remove-category="${this.escapeHtml(c)}" data-form="${type}" role="button" tabindex="0" title="Click to remove">${this.escapeHtml(c)}</span>`;
      }).join('');
      dropdown.classList.add('category-dropdown--has-value');
    } else {
      if (chipsEl) chipsEl.innerHTML = '';
      dropdown.classList.remove('category-dropdown--has-value');
    }

    // Hide already-selected categories from the dropdown menu.
    if (menu) {
      menu.querySelectorAll('.ui-menu__item').forEach(item => {
        item.style.display = cats.includes(item.dataset.categoryOption) ? 'none' : '';
      });
    }
  }

// Adds the pulse-out CSS class to existing category chips. The actual DOM
// replacement happens in the deferred callback in _toggleCategory — this
// function only starts the animation. Duration must match chip-pulse-out
// keyframe in styles.js (currently 0.7s).
export function _pulseOutChips(type) {
    const dropdown = this.shadow.querySelector(
      `#${type}-category-trigger`)?.closest('.category-dropdown');
    const chipsEl = dropdown?.closest('.form-header')
      ?.querySelector('.category-dropdown__chips');
    if (!chipsEl) return;
    chipsEl.querySelectorAll('.category-chip').forEach(chip => {
      chip.classList.add('category-chip--pulse-out');
    });
  }

export function _closeAllCategoryDropdowns() {
    this.shadow.querySelectorAll('.category-dropdown').forEach(dropdown => {
      dropdown.classList.remove('category-dropdown--open');
      const menu = dropdown.querySelector('.ui-menu');
      const trigger = dropdown.querySelector('.category-dropdown__trigger');
      if (menu) menu.classList.remove('ui-menu--open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
    this.state.formCategoryOpen.add = false;
    this.state.formCategoryOpen.edit = false;
  }

// ╭────────────────────╮
// │   SCOPE DROPDOWN
// ╰────────────────────╯

/**
 * Toggle the scope split-button dropdown via DOM classes,
 * avoiding a full render() that causes modal flash.
 */
export function _toggleScopeDropdown() {
    const split = this.shadow.querySelector('.ui-split');
    const menu = this.shadow.getElementById('scope-dropdown');
    if (split) split.classList.toggle('ui-split--open', this.state.scopeDropdownOpen);
    if (menu) menu.classList.toggle('ui-menu--open', this.state.scopeDropdownOpen);
  }

// ╭────────────────────╮
// │   SEARCH HANDLERS
// ╰────────────────────╯

export function handleSearchInput(e) {
    this.state.searchTerm = e.target.value;
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this._snapshotGrid();
      this.updatePromptsGrid();
    }, 150);
  }

export function handleSearchClear() {
    this._snapshotGrid();
    this.state.searchTerm = "";
    this.updatePromptsGrid();
  }

export function updatePromptsGrid() {
    const content = this.shadow.querySelector(".content");
    if (!content) return;
    const filtered = this.getFilteredPrompts();
    if (!filtered.length) {
      content.innerHTML = `<div class="empty-state">${
        this.state.searchTerm || this.state.selectedCategory
          ? "No prompts match your filters"
          : "No prompts yet. Add your first one above."
      }</div>`;
      this._animateGrid({ duration: 450, stagger: 20 });
      return;
    }
    const sorted = [...filtered].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    const introClass = this._introPlayed ? '' : ' pm-intro-pending';
    content.innerHTML = `<div class="prompts-grid${introClass}">${sorted.map(p => this.renderPromptCard(p)).join("")}</div>`;
    this.setupContentEventListeners();
    this._animateGrid({ duration: 450, stagger: 20 });
  }

// ╭────────────────────╮
// │   GRID ANIMATIONS
// ╰────────────────────╯

/**
 * Snapshot grid card positions before a DOM change.
 * Call immediately before any state mutation that causes
 * render() or updatePromptsGrid() to rebuild the grid.
 */
export function _snapshotGrid() {
    const grid = this.shadow.querySelector('.prompts-grid');
    if (!grid) {
      this._gridSnapshots = null;
      return;
    }
    // Remove any leftover exit overlays from a previous animation
    const content = this.shadow.querySelector('.content');
    if (content) {
      content.querySelectorAll('.pm-exit-overlay').forEach(o => o.remove());
      content.style.position = '';
    }

    const map = new Map();
    grid.querySelectorAll('.prompt-card[data-prompt-id]').forEach(el => {
      // Cancel in-flight animations to read final layout position
      el.getAnimations().forEach(a => a.cancel());
      const rect = el.getBoundingClientRect();
      map.set(el.dataset.promptId, {
        top: rect.top, left: rect.left,
        width: rect.width, height: rect.height,
        html: el.outerHTML,
      });
    });
    // Store content scroll position at snapshot time so exit clones
    // are placed correctly even after a full render resets scrollTop.
    map._scrollTop = content?.scrollTop || 0;
    map._contentTop = content?.getBoundingClientRect().top || 0;
    this._gridSnapshots = map;
  }

/**
 * FLIP animate grid cards from snapshotted to current positions.
 * Cards without a snapshot (new entries) get a fade+scale entry.
 * Always clears _gridSnapshots to prevent stale data leaking
 * into unrelated renders.
 */
export function _animateGrid({ duration = 450, stagger = 25 } = {}) {
    const snapshots = this._gridSnapshots;
    this._gridSnapshots = null;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!snapshots || !snapshots.size) return;

    const content = this.shadow.querySelector('.content');
    if (!content) return;

    const grid = content.querySelector('.prompts-grid');
    const cards = grid
      ? grid.querySelectorAll('.prompt-card[data-prompt-id]')
      : [];

    const movers = [];
    const entries = [];
    const newIds = new Set();

    cards.forEach((el, index) => {
      const id = el.dataset.promptId;
      newIds.add(id);
      const newRect = el.getBoundingClientRect();

      if (snapshots.has(id)) {
        const old = snapshots.get(id);
        const deltaX = old.left - newRect.left;
        const deltaY = old.top - newRect.top;
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
          movers.push({ el, deltaX, deltaY, index });
        }
      } else {
        entries.push({ el, index });
      }
    });

    // Exit: clone removed cards and fade them out in-place.
    // Clones sit in an overlay inside .content, positioned to match
    // where the cards were before the DOM rebuild.
    const exits = [];
    for (const [id, snap] of snapshots) {
      if (!newIds.has(id)) exits.push(snap);
    }

    if (exits.length) {
      content.style.position = 'relative';
      const contentRect = content.getBoundingClientRect();
      // Use the snapshotted content top + scroll so clones land correctly
      // even after a full render() resets .content's scrollTop to 0.
      const oldContentTop = snapshots._contentTop ?? contentRect.top;
      const oldScrollTop = snapshots._scrollTop ?? content.scrollTop;
      const overlay = document.createElement('div');
      overlay.className = 'pm-exit-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:visible;';
      content.appendChild(overlay);

      exits.forEach(({ html, top, left, width, height }) => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        const clone = wrapper.firstElementChild;
        clone.style.cssText = `position:absolute;top:${top - oldContentTop + oldScrollTop}px;left:${left - contentRect.left}px;width:${width}px;height:${height}px;margin:0;pointer-events:none;box-sizing:border-box;`;
        overlay.appendChild(clone);

        clone.animate([
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.95)' },
        ], {
          duration: 250,
          easing: 'ease-in-out',
          fill: 'forwards',
        });
      });

      setTimeout(() => {
        overlay.remove();
        content.style.position = '';
      }, 300);
    }

    // FLIP: animate survivors from old position to new.
    // No stagger — all movers start simultaneously so the grid
    // feels like a single fluid surface rather than a noisy cascade.
    movers.forEach(({ el, deltaX, deltaY }) => {
      el.animate([
        { transform: `translate(${deltaX}px, ${deltaY}px)` },
        { transform: 'translate(0, 0)' },
      ], {
        duration,
        easing: 'ease-in-out',
        fill: 'backwards',
      });
    });

    // Cap per-item stagger so total cascade stays under 250ms
    const entryStagger = Math.min(stagger, 250 / Math.max(entries.length, 1));

    // Entry: fade + scale for newly visible cards
    const entryDelay = movers.length ? 200 : 0;
    entries
      .sort((a, b) => a.index - b.index)
      .forEach(({ el }, i) => {
        el.animate([
          { opacity: 0, transform: 'scale(0.95)' },
          { opacity: 1, transform: 'scale(1)' },
        ], {
          duration: 350,
          easing: 'ease-in-out',
          delay: entryDelay + i * entryStagger,
          fill: 'backwards',
        });
      });
  }

/**
 * Diagonal pop-in intro animation — fires once on first render
 * that contains prompt cards. Cards on the same top-left → bottom-right
 * diagonal share a delay, creating a wave effect.
 *
 * Inspired by the animated_category_card button-card template.
 */
export function _playIntro() {
    if (this._introPlayed) return;
    clearTimeout(this._introFallbackTimer);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this._introPlayed = true;
      const g = this.shadow.querySelector('.prompts-grid');
      if (g) g.classList.remove('pm-intro-pending');
      return;
    }

    // Single rAF ensures layout is complete after the final render.
    requestAnimationFrame(() => {
      if (this._introPlayed) return;

      const grid = this.shadow.querySelector('.prompts-grid');
      if (!grid) return;

      const cards = grid.querySelectorAll('.prompt-card[data-prompt-id]');
      if (!cards.length) return;

      const firstRect = cards[0].getBoundingClientRect();
      if (!firstRect.width || !firstRect.height) return;

      this._introPlayed = true;
      grid.classList.remove('pm-intro-pending');

      // Compute row + col for each card to get diagonal index
      const rects = [...cards].map(el => ({ el, rect: el.getBoundingClientRect() }));
      rects.sort((a, b) => {
        const rowDiff = a.rect.top - b.rect.top;
        return Math.abs(rowDiff) > 5 ? rowDiff : a.rect.left - b.rect.left;
      });

      let currentRowTop = rects[0].rect.top;
      let row = 0, col = 0;
      const items = rects.map(item => {
        if (item.rect.top - currentRowTop > 5) { row++; col = 0; currentRowTop = item.rect.top; }
        const diag = row + col;
        col++;
        return { el: item.el, diag };
      });

      // Diagonal wave — based on animated_category_card template,
      // tuned to 65% speed. Per-keyframe easing matches CSS @keyframes
      // behaviour (CSS applies timing fn per interval, not overall).
      const delaySpeed = 1.8;
      const indexOffset = 2;

      items.forEach(({ el, diag }) => {
        const delay = (0.195 + (diag + indexOffset) * 0.13) / delaySpeed;

        el.animate([
          { transform: 'scale(0)', opacity: 0, easing: 'ease' },
          { transform: 'scale(1.05)', opacity: 1, offset: 0.5, easing: 'ease' },
          { transform: 'scale(1)', opacity: 1 },
        ], {
          duration: 650,
          delay: delay * 1000,
          fill: 'backwards',
        });
      });
    });
  }

// ╭────────────────────╮
// │   EVENT SETUP
// ╰────────────────────╯

export function setupContentEventListeners() {
    this.shadow.querySelectorAll(".prompts-grid").forEach((grid) => {
      if (!grid.dataset.bound) {
        grid.addEventListener(
          "click",
          (e) => {
            const target = (e.composedPath?.() || []).find((n) =>
              n.matches?.("[data-view-id], [data-copy-id], [data-dev-id], [data-dev-action], .prompt-card")
            );
            if (!target) return;
            // Dev tools button — toggle its menu
            if (target.dataset.devId) {
              e.stopPropagation();
              const menu = target.nextElementSibling;
              if (menu?.classList.contains('ui-menu')) {
                // Close any other open dev menus first
                this.shadow.querySelectorAll('.dev-tools-btn + .ui-menu.ui-menu--open').forEach(m => {
                  if (m !== menu) m.classList.remove('ui-menu--open');
                });
                menu.classList.toggle('ui-menu--open');
              }
              return;
            }
            // Dev tools menu action
            if (target.dataset.devAction) {
              e.stopPropagation();
              const promptId = parseInt(target.dataset.devPrompt || "0");
              target.closest('.ui-menu')?.classList.remove('ui-menu--open');
              if (target.dataset.devAction === 'set-score') {
                this.state.devScoreModal = promptId;
                this.render();
              }
              return;
            }
            if (target.classList?.contains("prompt-card") && target.dataset.viewId) {
              this.state.viewingPrompt = parseInt(target.dataset.viewId || "0");
              this.render();
              return;
            }
            const id = parseInt(Object.values(target.dataset)[0] || "0");
            if (target.dataset.viewId && !target.classList?.contains("prompt-card")) {
              this.state.viewingPrompt = id;
              this.render();
            } else if (target.dataset.copyId) {
              e.stopPropagation();
              const prompt = this.state.prompts.find((p) => p.id === id);
              if (prompt) this.copyPrompt(prompt, this._devMode ? prompt.content : null);
              return;
            }
          },
          { passive: true }
        );
        grid.querySelectorAll(".ui-copy-btn svg").forEach((svg) => {
          svg.style.pointerEvents = "none";
        });
        grid.dataset.bound = "1";
      }
    });
    this.shadow
      .querySelectorAll(
        "[data-view-edit], [data-view-optimize], [data-view-score], [data-view-delete]"
      )
      .forEach((btn) => {
        if (!btn.dataset.bound) {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = parseInt(
              btn.dataset.viewEdit ||
                btn.dataset.viewOptimize ||
                btn.dataset.viewScore ||
                btn.dataset.viewDelete ||
                "0"
            );
            if (btn.dataset.viewEdit) {
              this.state.viewingPrompt = null;
              this.state.editingPrompt = id;
              // Initialize edit form categories with prompt's current categories
              const prompt = this.state.prompts.find((p) => p.id === id);
              this.state.formCategory.edit = [...(prompt?.categories || ['Uncategorized'])];
              this.state.formCategoryOpen.edit = false;
            } else if (btn.dataset.viewOptimize) {
              this.state.viewingPrompt = null;
              this.handleOptimizeClick(id);
            } else if (btn.dataset.viewScore) {
              this.state.viewingPrompt = null;
              this.handleScoreClick(id);
            } else if (btn.dataset.viewDelete) {
              const p = this.state.prompts.find((p) => p.id === id);
              if (p) {
                this.state.viewingPrompt = null;
                this.state.deleteConfirmation = { promptId: id, title: p.title };
              }
            }
            this.render();
          });
          btn.dataset.bound = "1";
        }
      });
  }

export function setupEventListeners() {
    const on = (id, event, handler) =>
      this.shadow.getElementById(id)?.addEventListener(event, handler);
    on("add-button", "click", () => {
      this.state.showAddForm = true;
      this.render();
    });
    const addBtn = this.shadow.getElementById("add-button");
    if (addBtn) {
      addBtn.querySelectorAll("svg, span").forEach((el) => {
        el.style.pointerEvents = "none";
      });
    }
    // Header overflow menu
    on("header-menu-btn", "click", (e) => {
      e.stopPropagation();
      this.state.headerMenuOpen = !this.state.headerMenuOpen;
      const menu = this.shadow.getElementById("header-menu");
      if (menu) menu.classList.toggle("ui-menu--open", this.state.headerMenuOpen);
    });
    on("header-menu-devmode", "click", () => {
      this.state.headerMenuOpen = false;
      const menu = this.shadow.getElementById("header-menu");
      if (menu) menu.classList.remove("ui-menu--open");
      if (this._hass) {
        this._hass.callService('input_boolean', 'toggle', { entity_id: 'input_boolean.prompt_manager_dev_mode' });
      }
    });
    on("header-menu-table", "click", () => {
      this.state.headerMenuOpen = false;
      this.state.showTableModal = true;
      this.render();
    });
    on("search-input", "input", this.handleSearchInput);
    on("search-input", "keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter" || e.key === "Tab") e.target.blur();
    }, true);
    on("search-input", "keyup", (e) => e.stopPropagation(), true);
    on("clear-search", "click", this.handleSearchClear);
    on("table-modal-close-x", "click", () => {
      this.state.showTableModal = false;
      this.render();
    });

    on("table-copy-btn", "click", () => {
      const tableText = this.generateTableText();
      this.copyTextToClipboard(tableText, "table-copy-btn");
    });
    ["category", "score", "version", "uses", "tokens", "description"].forEach(col => {
      const checkbox = this.shadow.getElementById(`col-toggle-${col}`);
      if (checkbox) {
        checkbox.addEventListener("change", (e) => {
          this.state.tableColumns[col] = e.target.checked;
          this.updateTableColumnVisibility();
        });
      }
    });
    this.shadow.querySelectorAll('.prompts-table th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        const sort = this.state.tableSort;
        if (sort.column === col) {
          sort.direction = sort.direction === 'asc' ? 'desc' : 'asc';
        } else {
          sort.column = col;
          sort.direction = 'asc';
        }
        // Skip the intro animation on sort-triggered re-renders
        this.state._tableModalNoAnim = true;
        this.render();
      });
    });
    this.shadow
      .getElementById("categories-container")
      ?.addEventListener("click", (e) => {
        const target = (e.composedPath?.() || []).find(
          (n) => n.dataset?.category
        );
        if (target?.dataset.category) {
          const category = target.dataset.category;
          this._snapshotGrid();
          this.state.selectedCategory = this.state.selectedCategory === category
            ? null
            : category;
          this.render();
        }
      });
    ["add", "edit"].forEach((type) => {
      on(`${type}-submit`, "click", () =>
        this.handleFormSubmit(type === "edit")
      );
      on(`${type}-close-x`, "click", this.handleFormCancel);
      on(`${type}-refine`, "click", () =>
        this.handleRefineDraft(type)
      );
      on(`${type}-generate-desc`, "click", () =>
        this.handleGenerateDescription(type)
      );
      ["title", "content", "description"].forEach(
        (field) => {
          const el = this.shadow.getElementById(`${type}-${field}`);
          if (el) {
            el.addEventListener("input", () => {
              // Toggle has-value class for floating label inputs
              if (field === "title" || field === "description" || field === "content") {
                const pill = el.closest(".ui-input__pill");
                if (pill) pill.classList.toggle("has-value", !!el.value);
              }
              // Update variables section when content changes (before validity check)
              if (field === "content") {
                const p = type === "edit"
                  ? this.state.prompts.find((p) => p.id === this.state.editingPrompt)
                  : null;
                this.updateVariablesSection(type, p?.inputs || []);
              }
              this.updateFormValidity(type);
            });
          }
        }
      );
      // Variables generate descriptions button
      const varsGenerate = this.shadow.getElementById(`${type}-variables-generate`);
      if (varsGenerate && !varsGenerate.dataset.bound) {
        varsGenerate.addEventListener("click", () => {
          this.handleGenerateVariableDescriptions(type);
        });
        varsGenerate.dataset.bound = "1";
      }
      // FAB rich tooltips — replace native title with hover-triggered rich tooltips
      const fabTooltips = {
        'generate-desc': { title: 'Generate Description', intro: 'Use AI to write a short summary based on the prompt content.' },
        'refine':        { title: 'Refine Draft',         intro: 'Use AI to improve clarity, structure, and wording of the prompt.' },
        'variables-generate': { title: 'Generate Descriptions', intro: 'Use AI to describe each template variable for the fill-in form.' }
      };
      this.shadow.querySelectorAll(`[id^="${type}-"][data-fab-tooltip]`).forEach(fab => {
        if (fab.dataset.fabTooltipBound) return;
        const key = fab.id.replace(`${type}-`, '');
        const content = fabTooltips[key] || { title: fab.dataset.fabTooltip };
        fab.addEventListener("mouseenter", () => {
          this._showHoverTooltip(fab, content, {
            position: 'top',
            delay: 600,
            zIndex: 1001
          });
        });
        fab.addEventListener("mouseleave", () => {
          this._hideHoverTooltip();
        });
        fab.dataset.fabTooltipBound = "1";
      });
      // Initialize variables section
      const p = type === "edit"
        ? this.state.prompts.find((p) => p.id === this.state.editingPrompt)
        : null;
      this.updateVariablesSection(type, p?.inputs || []);
      // Submit button tooltip for missing fields (shows on click when disabled)
      const submitBtn = this.shadow.getElementById(`${type}-submit`);
      const submitWrapper = this.shadow.getElementById(`${type}-submit-wrapper`);
      if (submitWrapper && !submitWrapper.dataset.tooltipBound) {
        submitWrapper.addEventListener("click", (e) => {
          if (submitBtn?.disabled && submitBtn.dataset.missingFields) {
            e.preventDefault();
            e.stopPropagation();

            // Highlight missing fields with error border
            const missingFields = submitBtn.dataset.missingFields.split(', ');
            const errorElements = [];

            if (missingFields.includes('Title')) {
              const titlePill = this.shadow.getElementById(`${type}-title`)?.closest('.ui-input__pill');
              if (titlePill) {
                titlePill.classList.add('ui-input__pill--error');
                errorElements.push(titlePill);
              }
            }
            if (missingFields.includes('Category')) {
              const categoryDropdown = this.shadow.querySelector(`#${type}-category-trigger`)?.closest('.category-dropdown');
              if (categoryDropdown) {
                categoryDropdown.classList.add('category-dropdown--error');
                errorElements.push(categoryDropdown);
              }
            }
            if (missingFields.includes('Prompt content')) {
              const contentPill = this.shadow.getElementById(`${type}-content`)?.closest('.ui-input__pill');
              if (contentPill) {
                contentPill.classList.add('ui-input__pill--error');
                errorElements.push(contentPill);
              }
            }
            if (missingFields.includes('Required variable descriptions')) {
              this.shadow.querySelectorAll(`#${type}-variables-list .variable-desc-input[data-required="true"]`).forEach(input => {
                if (!input.value.trim()) {
                  const pill = input.closest('.ui-input__pill');
                  if (pill) {
                    pill.classList.add('ui-input__pill--error');
                    errorElements.push(pill);
                  }
                }
              });
            }

            showRichTooltip(submitBtn, {
              title: 'Required Fields Missing',
              titleColor: getComputedStyle(document.documentElement).getPropertyValue('--ui-error').trim() || '#ff7164',
              intro: 'Please complete the following before saving:',
              items: missingFields.map(field => ({
                term: field,
                desc: field === 'Title' ? 'Give your prompt a name'
                    : field === 'Category' ? 'Select a category from the dropdown'
                    : field === 'Required variable descriptions' ? 'Add descriptions for all required template variables'
                    : 'Enter the prompt text'
              }))
            }, {
              position: 'top',
              persistent: true,
              delay: 0,
              zIndex: 1001,
              onDismiss: () => {
                // Remove error classes - transition handles the fade out
                errorElements.forEach(el => {
                  el.classList.remove('ui-input__pill--error', 'category-dropdown--error');
                });
              }
            });
          }
        });
        submitWrapper.dataset.tooltipBound = "1";
      }
      // Category dropdown trigger — blocked when Reference is the sole active category
      on(`${type}-category-trigger`, "click", (e) => {
        e.stopPropagation();
        // Dismiss any active rich tooltip (stopPropagation blocks click-outside dismiss).
        // Also clear error borders since hideRichTooltip bypasses the onDismiss callback.
        hideRichTooltip();
        this.shadow.querySelectorAll('.ui-input__pill--error, .category-dropdown--error').forEach(el => {
          el.classList.remove('ui-input__pill--error', 'category-dropdown--error');
        });
        // Close other category dropdowns regardless of Reference state
        const otherType = type === 'add' ? 'edit' : 'add';
        if (this.state.formCategoryOpen[otherType]) {
          this._toggleCategoryDropdown(otherType, false);
        }
        const currentCats = this.state.formCategory[type];
        if (currentCats.length === 1 && currentCats[0] === 'Reference') {
          const trigger = this.shadow.getElementById(`${type}-category-trigger`);
          const dropdown = trigger?.closest('.category-dropdown');
          if (dropdown) dropdown.classList.add('category-dropdown--error');
          showRichTooltip(trigger, {
            title: 'Reference is Exclusive',
            titleColor: getComputedStyle(document.documentElement)
              .getPropertyValue('--ui-error').trim() || '#ff7164',
            intro: 'Reference prompts cannot have other categories.',
            items: [{ term: 'Tip', desc: 'Remove Reference first to add other categories.' }]
          }, {
            position: 'bottom',
            persistent: true,
            delay: 0,
            zIndex: 1001,
            onDismiss: () => {
              dropdown?.classList.remove('category-dropdown--error');
            }
          });
          return;
        }
        // Toggle this dropdown
        this._toggleCategoryDropdown(type);
      });
      // Category menu items — add category, then close dropdown and blur trigger.
      // Closing + blurring on selection is intentional: the field should return
      // to its resting (unfocused) state after a pick, same as a native <select>.
      this.shadow.querySelectorAll(`#${type}-category-menu .ui-menu__item`).forEach((item) => {
        if (!item.dataset.bound) {
          item.addEventListener("click", (e) => {
            e.stopPropagation();
            hideRichTooltip();
            const category = item.dataset.categoryOption;
            const form = item.dataset.form;
            if (category && form) {
              this._toggleCategory(form, category);
              this._toggleCategoryDropdown(form, false);
              this.shadow.getElementById(`${form}-category-trigger`)?.blur();
            }
          });
          item.dataset.bound = "1";
        }
      });
      // Version history button handler
      const versionHistoryBtn = this.shadow.getElementById(`${type}-version-history-btn`);
      if (versionHistoryBtn && !versionHistoryBtn.dataset.bound) {
        versionHistoryBtn.addEventListener("click", () => {
          const promptId = type === "edit" ? this.state.editingPrompt : null;
          if (promptId) {
            this.state.versionHistoryPrompt = promptId;
            // Inject modal without re-rendering to preserve edit form state
            const modalHTML = this.renderVersionHistoryModal();
            if (modalHTML) {
              const temp = document.createElement('div');
              temp.innerHTML = modalHTML;
              this._rootEl.appendChild(temp.firstElementChild);
              this.setupEventListeners();
              this._wireInfoIcons();
            }
          }
        });
        versionHistoryBtn.dataset.bound = "1";
      }
      this.updateFormValidity(type);
      // Render initial chips into .form-header now that the DOM is ready.
      // This covers the case where a form opens with pre-existing categories
      // (e.g. editing a prompt) — _updateCategoryChips is otherwise only
      // called on chip add/remove, so without this the chips row would be
      // missing until the user interacts with the dropdown.
      this._updateCategoryChips(type);
    });
    on("delete-close-x", "click", () => {
      this.state.deleteConfirmation = null;
      this.render();
    });
    on("delete-confirm", "click", () => {
      if (this.state.deleteConfirmation) {
        const promptId = this.state.deleteConfirmation.promptId;
        this.state.deleteConfirmation = null;
        this.deletePrompt(promptId);
      }
    });
    // Version history modal event listeners
    on("version-history-close-x", "click", () => {
      this.state.versionHistoryPrompt = null;
      const vhOverlay = this.shadow.querySelector('.version-history-modal')?.closest('.ui-modal-backdrop');
      if (vhOverlay) vhOverlay.remove();
    });
    this.shadow
      .querySelectorAll(".version-history-modal .version-restore")
      .forEach((btn) => {
        if (!btn.dataset.bound) {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const versionIndex = parseInt(btn.dataset.versionIndex || "0");
            const prompt = this.state.prompts.find(
              (p) => p.id === this.state.versionHistoryPrompt
            );
            if (prompt?.versions?.[versionIndex]) {
              const textarea = this.shadow.getElementById("edit-content");
              if (textarea) {
                textarea.value = prompt.versions[versionIndex].content;
                textarea.closest('.ui-input__pill')?.classList.add('has-value');
                this.updateVariablesSection("edit", prompt?.inputs || []);
                this.updateFormValidity("edit");
              }
              // Remove version history modal without re-rendering (preserves edit form textarea value)
              this.state.versionHistoryPrompt = null;
              const vhOverlay = this.shadow.querySelector('.version-history-modal')?.closest('.ui-modal-backdrop');
              if (vhOverlay) vhOverlay.remove();
            }
          });
          btn.dataset.bound = "1";
        }
      });
    // Fill modal event listeners
    on("fill-close-x", "click", () => {
      this.state.fillingPrompt = null;
      this.render();
    });
    on("fill-copy", "click", () => {
      if (this.state.fillingPrompt) {
        const prompt = this.state.prompts.find((p) => p.id === this.state.fillingPrompt);
        if (prompt) {
          // Collect values from fill-in form inputs
          const values = {};
          this.shadow.querySelectorAll('.fill-variable-field').forEach(input => {
            values[input.dataset.variable] = input.value;
          });
          const variables = extractVariables(prompt.content);
          // willFence is passed as skipFenceWrap to substituteVariables — when the
          // final copy output will be wrapped in a fence (Reference or dev mode),
          // skip auto-fencing multiline variable values to avoid nested fences.
          const isReference = (prompt.categories || []).includes('Reference');
          const willFence = isReference || this._devMode;
          const filledContent = substituteVariables(prompt.content, values, variables, willFence);
          this.copyPrompt(prompt, filledContent);
          this.state.fillingPrompt = null;
          this.render();
        }
      }
    });
    // Fill modal — Copy Raw (copies original template without filling, closes modal)
    on("fill-copy-raw", "click", () => {
      if (this.state.fillingPrompt) {
        const prompt = this.state.prompts.find((p) => p.id === this.state.fillingPrompt);
        if (prompt) {
          this.copyPrompt(prompt, prompt.content);
          this.state.fillingPrompt = null;
          this.render();
        }
      }
    });
    // Category chip click-to-remove.
    // Delegated to _rootEl in capture phase so it fires before the dropdown
    // trigger's bubble-phase handler (which would re-open the dropdown).
    // Uses composedPath() to pierce Shadow DOM boundaries reliably.
    // The _chipRemoveBound guard ensures this is only registered once.
    if (!this._chipRemoveBound) {
      this._rootEl.addEventListener('click', (e) => {
        const path = e.composedPath();
        const chip = path.find(el => el instanceof Element && el.classList?.contains('category-chip') && el.dataset?.removeCategory);
        if (!chip) return;
        e.stopPropagation();
        e.preventDefault();
        // Same tooltip/error-border cleanup as the dropdown trigger handler —
        // stopPropagation blocks the tooltip's document-level click-outside dismiss.
        hideRichTooltip();
        this.shadow.querySelectorAll('.ui-input__pill--error, .category-dropdown--error').forEach(el => {
          el.classList.remove('ui-input__pill--error', 'category-dropdown--error');
        });
        const category = chip.dataset.removeCategory;
        const form = chip.dataset.form;
        if (category && form) this._toggleCategory(form, category);
      }, true);
      this._chipRemoveBound = true;
    }
    // Fill modal — inject server snapshot (delegated on _rootEl so it survives re-renders)
    if (!this._injectBound) {
      this._rootEl.addEventListener('click', (e) => {
        const path = e.composedPath();
        const btn = path.find(el => el instanceof Element && el.classList?.contains('fill-inject-btn'));
        if (!btn) return;
        e.stopPropagation();
        e.preventDefault();
        const snapshot = this._hass?.states?.['sensor.ha_server_snapshot']?.attributes?.snapshot;
        if (!snapshot) return;
        const field = this.shadow.querySelector(`.fill-variable-field[data-variable="${btn.dataset.variable}"]`);
        if (!field) return;
        field.value = snapshot;
        const pill = field.closest('.ui-input__pill');
        if (pill) pill.classList.add('has-value');
        field.dispatchEvent(new Event('input', { bubbles: true }));
      }, true);
      this._injectBound = true;
    }
    // Fill modal — inject button rich tooltip (delegated via mouseover/mouseout which bubble)
    if (!this._injectTooltipBound) {
      this._rootEl.addEventListener('mouseover', (e) => {
        const btn = e.target.closest?.('.fill-inject-btn');
        if (!btn || btn._tooltipShown) return;
        btn._tooltipShown = true;
        this._showHoverTooltip(btn, {
          title: 'Inject Server Snapshot',
          intro: 'Paste the current Home Assistant server state into this variable.'
        }, { position: 'top', delay: 600, zIndex: 1001 });
      });
      this._rootEl.addEventListener('mouseout', (e) => {
        const btn = e.target.closest?.('.fill-inject-btn');
        if (!btn) return;
        btn._tooltipShown = false;
        this._hideHoverTooltip();
      });
      this._injectTooltipBound = true;
    }
    // Add floating label handlers and validity checking for fill modal inputs
    this.shadow.querySelectorAll('.fill-variable-field').forEach(field => {
      const pill = field.closest('.ui-input__pill');
      if (pill) {
        field.addEventListener('input', () => {
          pill.classList.toggle('has-value', field.value.length > 0);
          this.updateFillValidity();
        });
        field.addEventListener('focus', () => {
          pill.classList.add('has-value');
        });
        field.addEventListener('blur', () => {
          pill.classList.toggle('has-value', field.value.length > 0);
        });
      }
    });
    // Fill modal copy button wrapper — tooltip + error borders on disabled click
    const fillCopyBtn = this.shadow.getElementById('fill-copy');
    const fillCopyWrapper = this.shadow.getElementById('fill-copy-wrapper');
    if (fillCopyWrapper && !fillCopyWrapper.dataset.tooltipBound) {
      fillCopyWrapper.addEventListener("click", (e) => {
        if (fillCopyBtn?.disabled && fillCopyBtn.dataset.missingFields) {
          e.preventDefault();
          e.stopPropagation();

          const errorElements = [];
          const missingItems = [];

          // Highlight empty required field pills with error border and collect descriptions
          this.shadow.querySelectorAll('.fill-variable-field[data-required="true"]').forEach(field => {
            if (!field.value.trim()) {
              const pill = field.closest('.ui-input__pill');
              if (pill) {
                pill.classList.add('ui-input__pill--error');
                errorElements.push(pill);
              }
              const name = field.dataset.variable;
              const label = pill?.querySelector('.ui-input__label')?.textContent?.replace(/\*$/, '').trim() || '';
              missingItems.push({
                term: `{{${name}}}`,
                desc: label && label !== name ? label : 'Required'
              });
            }
          });

          showRichTooltip(fillCopyBtn, {
            title: 'Required Fields Empty',
            titleColor: getComputedStyle(document.documentElement).getPropertyValue('--ui-error').trim() || '#ff7164',
            intro: 'Fill in the required fields before copying:',
            items: missingItems
          }, {
            position: 'top',
            persistent: true,
            delay: 0,
            zIndex: 1001,
            onDismiss: () => {
              errorElements.forEach(el => {
                el.classList.remove('ui-input__pill--error');
              });
            }
          });
        }
      });
      fillCopyWrapper.dataset.tooltipBound = "1";
    }
    this.updateFillValidity();
    // Dev score modal handlers
    on("dev-score-close-x", "click", () => {
      this.state.devScoreModal = null;
      this.render();
    });
    on("dev-score-confirm", "click", () => {
      if (this.state.devScoreModal) {
        const input = this.shadow.getElementById("dev-score-input");
        const val = input?.value;
        if (val == null || isNaN(val)) return;
        const id = this.state.devScoreModal;
        this.state.prompts = this.state.prompts.map(p =>
          p.id === id ? { ...p, score: val } : p
        );
        savePrompts(this._hass, this.state.prompts).then(synced => { this._pendingBackendSync = !synced; });
        this.state.devScoreModal = null;
        this.render();
      }
    });
    on("dev-score-clear", "click", () => {
      if (this.state.devScoreModal) {
        const id = this.state.devScoreModal;
        this.state.prompts = this.state.prompts.map(p =>
          p.id === id ? { ...p, score: null } : p
        );
        savePrompts(this._hass, this.state.prompts).then(synced => { this._pendingBackendSync = !synced; });
        this.state.devScoreModal = null;
        this.render();
      }
    });
    on("view-close-x", "click", () => {
      this.state.viewingPrompt = null;
      this.state.scopeDropdownOpen = false;
      this.render();
    });
    on("view-copy", "click", () => {
      const p = this.state.prompts.find(
        (p) => p.id === this.state.viewingPrompt
      );
      if (p) {
        this.copyPrompt(p);
        this.state.viewingPrompt = null;
        this.state.scopeDropdownOpen = false;
        this.render();
      }
    });
    // Inputs collapsible toggle in view modal
    on("inputs-toggle-btn", "click", () => {
      const btn = this.shadow.getElementById('inputs-toggle-btn');
      const body = btn?.nextElementSibling;
      if (!btn || !body) return;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      body.classList.toggle('inputs-collapsible__body--open', !expanded);
      btn.querySelector('.inputs-toggle__chevron')?.classList.toggle('inputs-toggle__chevron--open', !expanded);
    });
    on("scope-dropdown-toggle", "click", (e) => {
      e.stopPropagation();
      this.state.scopeDropdownOpen = !this.state.scopeDropdownOpen;
      this._toggleScopeDropdown();
    });
    this.shadow.querySelectorAll(".ui-menu__item[data-scope]").forEach((btn) => {
      if (!btn.dataset.bound) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const scope = btn.dataset.scope;
          this.state.selectedScope = scope;
          this.state.scopeDropdownOpen = false;
          this._toggleScopeDropdown();
          // Update the split button label without a full re-render
          const label = this.shadow.querySelector('.ui-split__label');
          if (label) label.textContent = scope === 'No Focus' ? 'Optimize' : scope;
          // Update selected state in menu
          this.shadow.querySelectorAll('.ui-menu__item[data-scope]').forEach(item => {
            item.classList.toggle('ui-menu__item--selected', item.dataset.scope === scope);
          });
        });
        btn.dataset.bound = "1";
      }
    });
    const splitButtonMain = this.shadow.querySelector(".ui-split__main[data-view-optimize]");
    if (splitButtonMain && !splitButtonMain.dataset.bound) {
      splitButtonMain.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = parseInt(splitButtonMain.dataset.viewOptimize || "0");
        if (id) {
          this.state.viewingPrompt = null;
          this.handleOptimizeClick(id);
        }
      });
      splitButtonMain.dataset.bound = "1";
    }
    on("optimize-accept", "click", async () => {
      if (!this.state.optimizingPrompt) return;

      const { id, optimized, original } = this.state.optimizingPrompt;
      const prompt = this.state.prompts.find((p) => p.id === id);
      if (!prompt) {
        this.state.optimizingPrompt = null;
        this.render();
        return;
      }

      const versions = prompt.versions || [];
      versions.push({ timestamp: new Date().toISOString(), content: original });
      if (versions.length > 10) versions.shift();

      this.state.prompts = this.state.prompts.map((p) =>
        p.id === id
          ? {
              ...p,
              content: optimized,
              score: null,
              versions,
              version: (p.version || 1) + 1,
            }
          : p
      );
      savePrompts(this._hass, this.state.prompts).then(synced => { this._pendingBackendSync = !synced; });

      // Close modal immediately — scoring continues in the background
      this.state.optimizingPrompt = null;
      this.render();

      const optimizeScoreCategory = (prompt.categories || []).find(c => c !== 'Reference') || null;
      if (optimizeScoreCategory) {
        this.state.scoring[id] = true;
        this.updatePromptsGrid();
      }

      const newScore = optimizeScoreCategory ? await scorePrompt(this._hass, optimized, optimizeScoreCategory) : null;

      if (optimizeScoreCategory) delete this.state.scoring[id];

      if (newScore !== null && !isNaN(newScore)) {
        const currentPrompt = this.state.prompts.find((p) => p.id === id);
        const oldScore = currentPrompt?.score ?? null;
        const mv = calculateMovement(oldScore, newScore);
        if (mv) this.state.movement[id] = mv;

        this.state.prompts = this.state.prompts.map((p) =>
          p.id === id
            ? {
                ...p,
                score: newScore,
              }
            : p
        );
        savePrompts(this._hass, this.state.prompts).then(synced => { this._pendingBackendSync = !synced; });
      }

      this._snapshotGrid();
      this.updatePromptsGrid();
    });

    on("optimize-close-x", "click", () => {
      this.state.optimizingPrompt = null;
      this.render();
    });
    on("optimize-reject", "click", () => {
      this.state.optimizingPrompt = null;
      this.render();
    });
    on("optimize-copy-original", "click", () => {
      if (this.state.optimizingPrompt?.original) {
        this.copyTextToClipboard(this.state.optimizingPrompt.original, "optimize-copy-original");
      }
    });
    on("optimize-copy-optimized", "click", () => {
      if (this.state.optimizingPrompt?.optimized) {
        this.copyTextToClipboard(this.state.optimizingPrompt.optimized, "optimize-copy-optimized");
      }
    });
  }

// ╭────────────────────╮
// │   TOOLTIP HELPERS
// ╰────────────────────╯

export function _showHoverTooltip(anchor, content, options) {
    clearTimeout(this._hoverTooltipTimer);
    showRichTooltip(anchor, content, options);
  }

export function _hideHoverTooltip() {
    clearTimeout(this._hoverTooltipTimer);
    this._hoverTooltipTimer = setTimeout(() => {
      hideRichTooltip();
    }, 80);
  }

// ╭────────────────────╮
// │   INFO ICON WIRING
// ╰────────────────────╯

/**
 * Assigns .tooltipContent to all <ui-info-icon> elements in the shadow root.
 * Called after each render — the component handles its own click binding.
 */
export function _wireInfoIcons() {
  // Standard: assign content from TOOLTIP_CONTENT dictionary
  this.shadow.querySelectorAll('ui-info-icon[data-tooltip-key]').forEach(icon => {
    const key = icon.dataset.tooltipKey;
    if (key && TOOLTIP_CONTENT[key]) {
      icon.tooltipContent = TOOLTIP_CONTENT[key];
    }
  });

  // Card header: dynamic content based on selected category
  const headerIcon = this.shadow.querySelector('.ui-card-header ui-info-icon');
  if (headerIcon) {
    const selCat = this.state.selectedCategory;
    headerIcon.tooltipContent = (selCat && CATEGORY_META[selCat])
      ? CATEGORY_META[selCat].tooltip
      : TOOLTIP_CONTENT.cardHeader;
  }

  // View modal: description tooltip with dynamic prompt content
  const viewDescIcon = this.shadow.getElementById('view-desc-info');
  if (viewDescIcon) {
    const p = this.state.prompts.find(p => p.id === this.state.viewingPrompt);
    if (p?.description) {
      viewDescIcon.tooltipContent = {
        title: 'Prompt Description',
        intro: p.description,
        items: []
      };
    }
  }

  // View modal: scope info icon — hidden when no focus mode is selected (matches
  // the old inline text behaviour), shown with a single-mode description when one is.
  const scopeIcon = this.shadow.getElementById('scope-info');
  if (scopeIcon) {
    const scopeDescriptions = {
      'General mode':        'Standard pass — improves structure and clarity.',
      'Answer directly':     'Strips anything that causes digression or preamble.',
      'Clarify first':       'Adds a single targeted clarifying question before acting.',
      'Concise but complete':'Reduces length without losing correctness.',
      'Total rebuild':       'Full rewrite from scratch, preserving meaning and constraints.',
    };
    const selected = this.state.selectedScope;
    const desc = scopeDescriptions[selected];
    if (desc) {
      scopeIcon.style.display = '';
      scopeIcon.tooltipContent = {
        title: selected,
        intro: desc,
        items: []
      };
    } else {
      scopeIcon.style.display = 'none';
    }
  }
}

// ╭────────────────────╮
// │   GLOBAL HANDLERS
// ╰────────────────────╯

export function _handleOutsideClick(e) {
    // Use composedPath() to see inside shadow DOM from document-level listener
    const path = e.composedPath();
    const inDropdown = path.some(el => el.classList?.contains("dropdown-container"));
    const inSplit = path.some(el => el.classList?.contains("ui-split"));
    const inCategoryDropdown = path.some(el => el.classList?.contains("category-dropdown"));

    if (!inDropdown && !inSplit) {
      // Only close menus whose parent container is not in the click path,
      // so a click that opens a menu doesn't immediately close it.
      this.shadow
        .querySelectorAll(".ui-menu.ui-menu--open")
        .forEach((m) => {
          if (!path.includes(m) && !path.includes(m.parentElement)) {
            m.classList.remove("ui-menu--open");
          }
        });
      if (this.state.headerMenuOpen) this.state.headerMenuOpen = false;
    }
    if (!inSplit && this.state.scopeDropdownOpen) {
      this.state.scopeDropdownOpen = false;
      this._toggleScopeDropdown();
    }
    // Close category dropdowns when clicking outside
    if (!inCategoryDropdown) {
      this._closeAllCategoryDropdowns();
    }
  }

export function _handleEsc(e) {
    if (e.key === "Escape") {
      this.shadow
        .querySelectorAll(".ui-menu")
        .forEach((m) => m.classList.remove("ui-menu--open"));
      if (this.state.headerMenuOpen) {
        this.state.headerMenuOpen = false;
        const menu = this.shadow.getElementById("header-menu");
        if (menu) menu.classList.remove("ui-menu--open");
        return;
      }
      if (this.state.scopeDropdownOpen) {
        this.state.scopeDropdownOpen = false;
        this._toggleScopeDropdown();
        return;
      }
      // Close category dropdowns first before closing form
      if (this.state.formCategoryOpen.add || this.state.formCategoryOpen.edit) {
        this._closeAllCategoryDropdowns();
        return;
      }
      if (
        this.state.showAddForm ||
        this.state.editingPrompt ||
        this.state.deleteConfirmation ||
        this.state.viewingPrompt ||
        this.state.optimizingPrompt ||
        this.state.showTableModal ||
        this.state.fillingPrompt ||
        this.state.devScoreModal
      )
        this.handleFormCancel();
    }
  }

// ╭────────────────────╮
// │   ACTION HANDLERS
// ╰────────────────────╯

export async function handleOptimizeClick(id) {
    const prompt = this.state.prompts.find((p) => p.id === id);
    if (!prompt) return;

    this.state.optimizingPrompt = { id, loading: true };
    this.state.scopeDropdownOpen = false;
    this.render();

    const result = await optimizePrompt(this._hass, prompt, SCOPE_DIRECTIVES[this.state.selectedScope]);
    if (!result) {
      this.state.optimizingPrompt = null;
      this.render();
      return;
    }

    const optimized = result.optimizedPrompt || prompt.content;

    const previewScoreCat = (prompt.categories || []).find(c => c !== 'Reference') || null;
    const previewScore = previewScoreCat ? await scorePrompt(this._hass, optimized, previewScoreCat) : null;

    this.state.optimizingPrompt = {
      id,
      title: prompt.title,
      loading: false,
      original: prompt.content,
      originalScore: prompt.score,
      optimized,
      optimizedScore: previewScore,
      improvements: result.improvements,
    };

    this.render();
  }

export async function handleScoreClick(id) {
    const prompt = this.state.prompts.find((p) => p.id === id);
    if (!prompt) return;
    if (this.state.scoring[id]) return;
    this.shadow
      .querySelectorAll(".ui-menu")
      .forEach((m) => m.classList.remove("ui-menu--open"));
    const promptScoreCategory = (prompt.categories || []).find(c => c !== 'Reference') || null;
    if (!promptScoreCategory) {
      // All categories are Reference — clear score if present
      if (prompt.score !== null && prompt.score !== undefined) {
        this.state.prompts = this.state.prompts.map((p) =>
          p.id === id ? { ...p, score: null } : p
        );
        savePrompts(this._hass, this.state.prompts).then(synced => { this._pendingBackendSync = !synced; });
        this._snapshotGrid();
        this.updatePromptsGrid();
      }
      return;
    }
    this.state.scoring[id] = true;
    this.updatePromptsGrid();
    const score = await scorePrompt(this._hass, prompt.content, promptScoreCategory);
    if (score !== null) {
      const mv = calculateMovement(prompt.score, score);
      if (mv) this.state.movement[id] = mv;
      this.state.prompts = this.state.prompts.map((p) =>
        p.id === id ? { ...p, score } : p
      );
      savePrompts(this._hass, this.state.prompts).then(synced => { this._pendingBackendSync = !synced; });
      this.state.justScored[id] = true;
      const timerId = setTimeout(() => {
        delete this.state.justScored[id];
        this._justScoredTimers.delete(id);
        this.updatePromptsGrid();
      }, 2000);
      this._justScoredTimers.set(id, timerId);
    }
    delete this.state.scoring[id];
    this._snapshotGrid();
    this.updatePromptsGrid();
  }

export function handleFormSubmit(isEdit) {
    const prefix = isEdit ? "edit" : "add";
    const title =
      this.shadow.getElementById(`${prefix}-title`)?.value.trim();
    const rawContent =
      (this.shadow.getElementById(`${prefix}-content`)?.value || '')
        .replace(/<pm-source\s+[^/]*\/>\s*/g, '')
        .trim();

    // Strip outer code fences if the entire content is wrapped in one.
    // This normalises prompts pasted from dev-mode copies (which add fences)
    // so that stored content is always fence-free. Internal sequential fences
    // are preserved — only the outermost pair is matched via startsWith/endsWith.
    // The regex strips any language identifier on the opening fence line.
    let content = rawContent;
    if (content.length > 6 && content.startsWith('```') && content.endsWith('```')) {
      const stripped = content.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '').trim();
      if (stripped.length > 0) content = stripped;
    }

    const desc =
      this.shadow
        .getElementById(`${prefix}-description`)
        ?.value.trim() || "";
    const categories = this.state.formCategory[prefix].length
      ? this.state.formCategory[prefix]
      : ['Uncategorized'];

    // On save: drop Uncategorized if real categories are present
    const finalCategories = categories.length > 1 && categories.includes('Uncategorized')
      ? categories.filter(c => c !== 'Uncategorized')
      : categories;

    // Collect variable inputs from the form
    const inputs = [];
    this.shadow.querySelectorAll(`#${prefix}-variables-list .variable-desc-input`).forEach(input => {
      const name = input.dataset.variable;
      const description = input.value.trim();
      if (name) {
        inputs.push({ name, description });
      }
    });

    if (!title || !content) return;
    if (isEdit && this.state.editingPrompt) {
      this.updatePrompt(this.state.editingPrompt, {
        title,
        content,
        categories: finalCategories,
        description: desc,
        inputs,
      });
    } else {
      this.addPrompt(title, content, finalCategories, desc, inputs);
    }
  }

export function handleFormCancel() {
    Object.assign(this.state, {
      showAddForm: false,
      editingPrompt: null,
      deleteConfirmation: null,
      viewingPrompt: null,
      optimizingPrompt: null,
      scopeDropdownOpen: false,
      headerMenuOpen: false,
      showTableModal: false,
      fillingPrompt: null,
      devScoreModal: null,
      // Reset category dropdown state
      formCategory: { add: [], edit: [] },
      formCategoryOpen: { add: false, edit: false },
    });
    this.render();
  }

export async function handleRefineDraft(prefix) {
    const textarea = this.shadow.getElementById(
      `${prefix}-content`
    );
    if (!textarea) return;
    const currentContent = textarea.value.trim();
    if (!currentContent) return;
    const refineBtn = this.shadow.getElementById(
      `${prefix}-refine`
    );
    if (refineBtn) {
      refineBtn.disabled = true;
      refineBtn.innerHTML = '<ha-icon icon="svg-spinners:3-dots-move"></ha-icon>';
    }
    const result = await optimizePrompt(this._hass, {
      content: currentContent,
      score: null,
    }, SCOPE_DIRECTIVES[this.state.selectedScope]);
    if (result?.optimizedPrompt) {
      textarea.value = result.optimizedPrompt;
      textarea.closest('.ui-input__pill')?.classList.add('has-value');
      this.updateFormValidity(prefix);
      // Update variables section since content changed
      const p = prefix === "edit"
        ? this.state.prompts.find((p) => p.id === this.state.editingPrompt)
        : null;
      this.updateVariablesSection(prefix, p?.inputs || []);
    }
    if (refineBtn) {
      refineBtn.disabled = false;
      refineBtn.innerHTML = '<ha-icon icon="fluent:pen-sparkle-28-filled"></ha-icon>';
    }
  }

export async function handleGenerateDescription(prefix) {
    const contentTextarea = this.shadow.getElementById(
      `${prefix}-content`
    );
    const descTextarea = this.shadow.getElementById(
      `${prefix}-description`
    );
    const titleInput = this.shadow.getElementById(
      `${prefix}-title`
    );
    if (!contentTextarea || !descTextarea) return;

    const currentContent = contentTextarea.value.trim();
    if (currentContent.length < 5) return;

    const needsTitle = titleInput && !titleInput.value.trim();

    const generateBtn = this.shadow.getElementById(
      `${prefix}-generate-desc`
    );
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<ha-icon icon="svg-spinners:3-dots-move"></ha-icon>';
    }

    const preTrigger = this._hass.states?.["script.update_prompt_description"]?.attributes?.last_triggered;
    try {
      let result = null;
      try {
        const res = await this._hass.callService(
          "script",
          "update_prompt_description",
          {
            content: currentContent,
            include_title: needsTitle
          },
          {},
          true,
          true
        );
        result = res?.response?.data?.description
          ? { description: res.response.data.description, title: res.response.data.title }
          : res?.response;
      } catch (err) {
        console.warn('Description generation service call failed:', err);
      }

      if (!result) {
        const raw = await pollForResult(() => {
          const st = this._hass.states?.["script.update_prompt_description"];
          if (!st?.attributes) return null;
          if (st.attributes.last_triggered === preTrigger) return null;
          let aiRes = st.attributes.result || st.attributes.ai_result;
          if (!aiRes) return null;
          if (aiRes.data && !aiRes.description)
            aiRes = aiRes.data;
          return aiRes;
        });
        if (raw) result = raw;
      }

      if (result?.description) {
        descTextarea.value = result.description;
        descTextarea.closest('.ui-input__pill')?.classList.add('has-value');
      }
      if (needsTitle && result?.title && titleInput) {
        titleInput.value = result.title;
        titleInput.closest('.ui-input__pill')?.classList.add('has-value');
        this.updateFormValidity(prefix);
      }
    } catch (error) {
      console.error('Error generating description:', error);
    } finally {
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<ha-icon icon="fluent:sparkle-28-filled"></ha-icon>';
      }
    }
  }

export async function handleGenerateVariableDescriptions(prefix) {
    const content = this.shadow.getElementById(`${prefix}-content`)?.value || '';
    const variables = extractVariables(content);
    const listEl = this.shadow.getElementById(`${prefix}-variables-list`);
    const generateBtn = this.shadow.getElementById(`${prefix}-variables-generate`);

    if (!variables.length || !listEl) return;

    // Collect variables that need descriptions
    const needsDescription = [];
    listEl.querySelectorAll('.variable-desc-input').forEach(input => {
      if (!input.value.trim()) {
        needsDescription.push(input.dataset.variable);
      }
    });

    if (!needsDescription.length) return;

    // Show loading state
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<ha-icon icon="svg-spinners:3-dots-move"></ha-icon>';
    }

    const preTrigger = this._hass.states?.["script.generate_variable_descriptions"]?.attributes?.last_triggered;
    try {
      let result = null;
      try {
        const res = await this._hass.callService(
          "script",
          "generate_variable_descriptions",
          {
            content: content,
            variables: needsDescription
          },
          {},
          true,
          true
        );
        result = res?.response?.descriptions || res?.response?.data?.result || res?.response;
      } catch (err) {
        console.warn('Variable description generation service call failed:', err);
      }

      if (!result) {
        result = await pollForResult(() => {
          const st = this._hass.states?.["script.generate_variable_descriptions"];
          if (!st?.attributes) return null;
          if (st.attributes.last_triggered === preTrigger) return null;
          let aiRes = st.attributes.result || st.attributes.ai_result;
          if (!aiRes) return null;
          if (aiRes.data?.result) return aiRes.data.result;
          if (aiRes.descriptions) return aiRes.descriptions;
          return aiRes;
        });
      }

      // Parse JSON string if needed (AI returns JSON as plain text)
      if (result && typeof result === 'string') {
        try {
          result = JSON.parse(result);
        } catch {
          console.warn('Failed to parse variable descriptions JSON:', result);
          result = null;
        }
      }

      // Apply the generated descriptions to the form inputs
      if (result && typeof result === 'object') {
        listEl.querySelectorAll('.variable-desc-input').forEach(input => {
          const varName = input.dataset.variable;
          if (result[varName] && !input.value.trim()) {
            input.value = result[varName];
            // Update floating label state
            const pill = input.closest('.ui-input__pill');
            if (pill) pill.classList.add('has-value');
          }
        });
        // Hide the generate button since all descriptions are now filled
        if (generateBtn) hideFab(generateBtn);
        // Update form validity
        this.updateFormValidity(prefix);
      }
    } catch (error) {
      console.error('Error generating variable descriptions:', error);
    } finally {
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<ha-icon icon="fluent:sparkle-28-filled"></ha-icon>';
      }
    }
  }

// ╭────────────────────╮
// │   FORM VALIDATION
// ╰────────────────────╯

export function updateFormValidity(type) {
    const title =
      this.shadow.getElementById(`${type}-title`)?.value.trim();
    const content =
      this.shadow.getElementById(`${type}-content`)?.value.trim();
    const categories = this.state.formCategory[type];
    const submit = this.shadow.getElementById(
      `${type}-submit`
    );

    // Check for required variables with missing descriptions
    const variables = extractVariables(content || '');
    const variableInputs = this.shadow.querySelectorAll(`#${type}-variables-list .variable-desc-input`);
    let missingRequiredVarDescs = 0;
    variableInputs.forEach(input => {
      if (input.dataset.required === 'true' && !input.value.trim()) missingRequiredVarDescs++;
    });

    // Build list of missing required fields
    const missing = [];
    if (!title) missing.push('Title');
    // Categories are optional — defaults to Uncategorized if empty
    if (!content) missing.push('Prompt content');
    if (missingRequiredVarDescs > 0) missing.push('Required variable descriptions');

    if (submit) {
      submit.disabled = missing.length > 0;
      // Store missing fields for tooltip
      submit.dataset.missingFields = missing.join(', ');
    }

    // Show/hide generate description button based on prompt content length
    const generateDescBtn = this.shadow.getElementById(
      `${type}-generate-desc`
    );
    if (generateDescBtn) {
      (!content || content.length < 5) ? hideFab(generateDescBtn) : showFab(generateDescBtn);
    }

    // Show/hide refine button based on whether prompt content has any text
    const refineBtn = this.shadow.getElementById(`${type}-refine`);
    if (refineBtn) {
      content ? showFab(refineBtn) : hideFab(refineBtn);
    }
  }

export function updateVariablesSection(type, existingInputs = []) {
    const content = this.shadow.getElementById(`${type}-content`)?.value || '';
    const variables = extractVariables(content);
    const listEl = this.shadow.getElementById(`${type}-variables-list`);
    const generateBtn = this.shadow.getElementById(`${type}-variables-generate`);
    const section = this.shadow.querySelector(`[data-section-id="${type}-variables"]`);

    // Hide entire section when no variables
    if (section) {
      section.style.display = variables.length === 0 ? 'none' : '';
    }

    if (!listEl) return;

    if (variables.length === 0) {
      listEl.innerHTML = '';
      if (generateBtn) hideFab(generateBtn);
      return;
    }

    // Build a map of descriptions with priority:
    // 1. Already entered in form (highest)
    // 2. Inline from content {{name: desc}}
    // 3. Saved with prompt (lowest)
    const descMap = {};

    // Start with saved inputs (lowest priority)
    existingInputs.forEach(input => {
      if (input.name && input.description) {
        descMap[input.name] = input.description;
      }
    });

    // Override with inline descriptions from content
    variables.forEach(v => {
      if (v.description) {
        descMap[v.name] = v.description;
      }
    });

    // Preserve any descriptions already entered in the form (highest priority)
    listEl.querySelectorAll('.variable-desc-input').forEach(input => {
      if (input.dataset.variable && input.value) {
        descMap[input.dataset.variable] = input.value;
      }
    });

    // Check if any variables are missing descriptions
    const missingCount = variables.filter(v => !descMap[v.name]).length;
    if (generateBtn) {
      missingCount > 0 ? showFab(generateBtn) : hideFab(generateBtn);
    }

    listEl.innerHTML = variables.map(v => {
      const desc = descMap[v.name] || '';
      const marker = v.required ? '<span class="required-marker">*</span>' : '';
      return `<div class="ui-input">
        <div class="ui-input__pill${desc ? ' has-value' : ''}">
          <label class="ui-input__label">{{${this.escapeHtml(v.name)}}}${marker}</label>
          <input type="text" class="ui-input__field variable-desc-input" data-variable="${this.escapeHtml(v.name)}" data-required="${v.required}" value="${this.escapeHtml(desc)}" />
        </div>
      </div>`;
    }).join('');

    // Add floating label event listeners
    listEl.querySelectorAll('.variable-desc-input').forEach(input => {
      const pill = input.closest('.ui-input__pill');
      if (pill) {
        input.addEventListener('input', () => {
          pill.classList.toggle('has-value', input.value.length > 0);
          // Update generate button visibility
          const anyEmpty = [...listEl.querySelectorAll('.variable-desc-input')].some(i => !i.value.trim());
          if (generateBtn) anyEmpty ? showFab(generateBtn) : hideFab(generateBtn);
          // Update form validity
          this.updateFormValidity(type);
        });
      }
    });
  }

export function updateFillValidity() {
    const copyBtn = this.shadow.getElementById('fill-copy');
    if (!copyBtn) return;
    const requiredFields = this.shadow.querySelectorAll('.fill-variable-field[data-required="true"]');
    const emptyRequired = [...requiredFields].filter(f => !f.value.trim());
    copyBtn.disabled = emptyRequired.length > 0;
    // Store empty required variable names for tooltip
    copyBtn.dataset.missingFields = emptyRequired.map(f => f.dataset.variable).join(', ');
  }

export function updateTableColumnVisibility() {
    const cols = this.state.tableColumns;
    const allCols = ["category", "score", "version", "uses", "tokens", "description"];
    allCols.forEach(col => {
      const display = cols[col] ? "" : "none";
      this.shadow.querySelectorAll(`.col-${col}`).forEach(el => {
        el.style.display = display;
      });
    });
    // Update last-visible class for header corner radius
    const ths = this.shadow.querySelectorAll('.prompts-table thead th');
    ths.forEach(th => th.classList.remove('col-last-visible'));
    for (let i = ths.length - 1; i >= 0; i--) {
      if (ths[i].style.display !== 'none') {
        ths[i].classList.add('col-last-visible');
        break;
      }
    }
  }
// |   END: events.js

