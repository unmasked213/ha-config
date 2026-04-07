// /config/www/cards/checklist-card/checklist-card.js
import "/local/base/foundation.js";
import { applyThemeClass } from "/local/base/helpers.js";

/* ── Editor ───────────────────────────────────────────────────────────── */
class ChecklistCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; }
  connectedCallback() {
    this.innerHTML = `<p style="padding:16px;color:var(--secondary-text-color)">
      Configure with: entity (required)</p>`;
  }
}
customElements.define("checklist-card-editor", ChecklistCardEditor);

/* ── Component Styles ─────────────────────────────────────────────────── */
const styles = new CSSStyleSheet();
styles.replaceSync(`
  .checklist {
    background: var(--ui-elevated-2);
    border-radius: var(--ui-radius-m);
    box-shadow: var(--ui-shadow-2);
    padding: var(--ui-space-6) var(--ui-space-9);
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--ui-space-4);
  }

  .checklist:empty::after {
    content: "No items";
    color: var(--ui-text-mute);
    font-size: var(--ui-font-s);
    text-align: center;
    padding: var(--ui-space-4) 0;
  }

  .row {
    display: grid;
    grid-template-columns: 30px auto;
    align-items: center;
    cursor: pointer;
    min-height: 30px;
  }

  .checkbox-outer {
    display: grid;
    align-items: center;
    height: 15px;
    width: 15px;
  }

  .checkbox {
    position: relative;
    height: 15px;
    width: 15px;
    display: grid;
    align-items: center;
  }

  .check-stroke {
    position: absolute;
    height: 2px;
    background: var(--ui-accent);
    border-radius: 2px;
    width: 0;
  }

  .check-before {
    right: 60%;
    transform-origin: right bottom;
  }

  .check-after {
    left: 40%;
    transform-origin: left bottom;
  }

  .check-before.checked {
    width: 5px;
    top: 8px;
    transform: rotate(45deg);
  }

  .check-after.checked {
    width: 10px;
    top: 8px;
    transform: rotate(-45deg);
  }

  .check-before.animating {
    animation: check-01 0.4s ease forwards;
  }

  .check-after.animating {
    animation: check-02 0.4s ease forwards;
  }

  .label-wrap {
    position: relative;
    display: grid;
    align-items: center;
  }

  .label {
    cursor: pointer;
    transition: color 0.3s ease;
    user-select: none;
    line-height: 1.45;
    color: var(--ui-text);
    text-decoration: none;
  }

  .label.checked {
    color: var(--ui-border-color-strong);
    text-decoration: line-through;
    text-decoration-color: var(--ui-border-color-strong);
  }

  .label.animating {
    animation: move 0.3s ease 0.1s forwards, strike-in 0.4s ease forwards;
  }

  .firework {
    position: absolute;
    height: 4px;
    width: 4px;
    top: 8px;
    left: -25px;
    border-radius: 50%;
  }

  .firework.animating {
    animation: firework 0.5s ease forwards 0.1s;
  }

  /* ── Keyframes ─────────────────────────────────────────────────────── */

  @keyframes move {
    50%  { padding-left: 8px; padding-right: 0px; }
    100% { padding-right: 4px; }
  }

  @keyframes strike-in {
    0%   { text-decoration-color: transparent; }
    40%  { text-decoration-color: transparent; }
    100% { text-decoration-color: var(--ui-border-color-strong); }
  }

  @keyframes check-01 {
    0%   { width: 4px; top: auto; transform: rotate(0); }
    50%  { width: 0px; top: auto; transform: rotate(0); }
    51%  { width: 0px; top: 8px;  transform: rotate(45deg); }
    100% { width: 5px; top: 8px;  transform: rotate(45deg); }
  }

  @keyframes check-02 {
    0%   { width: 4px; top: auto; transform: rotate(0); }
    50%  { width: 0px; top: auto; transform: rotate(0); }
    51%  { width: 0px; top: 8px;  transform: rotate(-45deg); }
    100% { width: 10px; top: 8px; transform: rotate(-45deg); }
  }

  @keyframes firework {
    0% {
      opacity: 1;
      box-shadow:
        0 0 0 -2px var(--ui-accent),
        0 0 0 -2px var(--ui-accent),
        0 0 0 -2px var(--ui-accent),
        0 0 0 -2px var(--ui-accent),
        0 0 0 -2px var(--ui-accent),
        0 0 0 -2px var(--ui-accent);
    }
    30% { opacity: 1; }
    100% {
      opacity: 0;
      box-shadow:
        0 -15px 0 0 var(--ui-accent),
        14px -8px 0 0 var(--ui-accent),
        14px 8px 0 0 var(--ui-accent),
        0 15px 0 0 var(--ui-accent),
        -14px 8px 0 0 var(--ui-accent),
        -14px -8px 0 0 var(--ui-accent);
    }
  }
`);

/* ── Card ─────────────────────────────────────────────────────────────── */
class ChecklistCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("checklist-card-editor");
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
    this._rendered = false;
    this._container = null;
    this._items = new Map();       // uid → { uid, summary, checked }
    this._rowEls = new Map();      // uid → row DOM element
    this._animTimers = new Map();  // uid → setTimeout ID
    this._lastEntityUpdate = null;
    this._fetchGen = 0;
  }

  setConfig(config) {
    if (!config.entity) throw new Error("entity is required");
    this._config = { entity: config.entity };
    if (this._hass) {
      if (!this._rendered) this._ensureContainer();
      this._fetchItems();
    }
  }

  set hass(hass) {
    this._hass = hass;
    applyThemeClass(this, hass);
    if (!this._config) return;

    const entity = hass.states[this._config.entity];
    if (!entity) return;

    if (entity.last_updated !== this._lastEntityUpdate) {
      this._lastEntityUpdate = entity.last_updated;
      if (!this._rendered) this._ensureContainer();
      this._fetchItems();
    }
  }

  connectedCallback() {
    this.shadowRoot.adoptedStyleSheets = [window.uiFoundation, styles];
  }

  disconnectedCallback() {
    this._rendered = false;
    this._rowEls.clear();
    this._items.clear();
    this._animTimers.forEach(t => clearTimeout(t));
    this._animTimers.clear();
    this._container = null;
    this._lastEntityUpdate = null;
  }

  getCardSize() {
    return 3;
  }

  /* ── Container ─────────────────────────────────────────────────────── */

  _ensureContainer() {
    if (this._container) return;
    this.shadowRoot.innerHTML = "";
    this._container = document.createElement("div");
    this._container.className = "checklist";
    this.shadowRoot.appendChild(this._container);
    this._rendered = true;
  }

  /* ── Fetch ──────────────────────────────────────────────────────────── */

  async _fetchItems() {
    if (!this._hass || !this._config) return;

    const gen = ++this._fetchGen;

    try {
      const resp = await this._hass.connection.sendMessagePromise({
        type: "call_service",
        domain: "todo",
        service: "get_items",
        service_data: { status: ["needs_action", "completed"] },
        target: { entity_id: this._config.entity },
        return_response: true,
      });

      if (gen !== this._fetchGen) return;

      const raw = resp.response?.[this._config.entity]?.items || [];

      this._patch(raw);
    } catch (e) {
      console.warn("[checklist-card] Failed to fetch items:", e);
    }
  }

  /* ── Patch (diff against current DOM) ───────────────────────────────── */

  _patch(serverItems) {
    const incoming = new Map();
    for (const item of serverItems) {
      if (!item.uid) continue;
      incoming.set(item.uid, {
        uid: item.uid,
        summary: item.summary,
        checked: item.status === "completed",
      });
    }

    // 1. Remove rows whose uid is no longer in the server set
    for (const [uid] of this._rowEls) {
      if (!incoming.has(uid)) {
        this._rowEls.get(uid).remove();
        this._rowEls.delete(uid);
        if (this._animTimers.has(uid)) {
          clearTimeout(this._animTimers.get(uid));
          this._animTimers.delete(uid);
        }
      }
    }

    // 2. Update existing rows / create new ones
    for (const [uid, item] of incoming) {
      if (this._rowEls.has(uid)) {
        const old = this._items.get(uid);
        if (old) {
          // Status diverged and row is NOT mid-animation → snap to truth
          if (old.checked !== item.checked && !this._animTimers.has(uid)) {
            this._snapRow(uid, item.checked);
          }
          // Summary changed → update text
          if (old.summary !== item.summary) {
            const label = this._rowEls.get(uid).querySelector(".label");
            if (label) label.textContent = item.summary;
          }
        }
      } else {
        this._createRow(item);
      }
    }

    this._items = incoming;
  }

  /* ── Snap a single row to a given checked state (no animation) ──────── */

  _snapRow(uid, checked) {
    const row = this._rowEls.get(uid);
    if (!row) return;

    if (this._animTimers.has(uid)) {
      clearTimeout(this._animTimers.get(uid));
      this._animTimers.delete(uid);
    }

    const before = row.querySelector(".check-before");
    const after  = row.querySelector(".check-after");
    const label  = row.querySelector(".label");
    const fw     = row.querySelector(".firework");

    if (checked) {
      before.className = "check-stroke check-before checked";
      after.className  = "check-stroke check-after checked";
      label.className  = "label checked";
    } else {
      before.className = "check-stroke check-before";
      after.className  = "check-stroke check-after";
      label.className  = "label";
    }
    fw.className = "firework";
  }

  /* ── Create a single row element ────────────────────────────────────── */

  _createRow(item) {
    const row = document.createElement("div");
    row.className = "row";
    row.dataset.id = item.uid;
    row.addEventListener("click", () => this._toggle(item.uid));

    const outer = document.createElement("div");
    outer.className = "checkbox-outer";

    const checkbox = document.createElement("div");
    checkbox.className = "checkbox";

    const before = document.createElement("span");
    before.className = `check-stroke check-before${item.checked ? " checked" : ""}`;

    const after = document.createElement("span");
    after.className = `check-stroke check-after${item.checked ? " checked" : ""}`;

    checkbox.append(before, after);
    outer.appendChild(checkbox);

    const labelWrap = document.createElement("div");
    labelWrap.className = "label-wrap";

    const label = document.createElement("span");
    label.className = `label${item.checked ? " checked" : ""}`;
    label.textContent = item.summary;

    const fw = document.createElement("span");
    fw.className = "firework";

    labelWrap.append(label, fw);
    row.append(outer, labelWrap);

    this._container.appendChild(row);
    this._rowEls.set(item.uid, row);
  }

  /* ── Toggle (optimistic + fire-and-forget service call) ─────────────── */

  _toggle(uid) {
    const item = this._items.get(uid);
    if (!item) return;

    const next = !item.checked;
    item.checked = next;                       // optimistic

    const row = this._rowEls.get(uid);
    if (!row) return;

    const before = row.querySelector(".check-before");
    const after  = row.querySelector(".check-after");
    const label  = row.querySelector(".label");
    const fw     = row.querySelector(".firework");

    // Clear any in-flight animation timer for this row
    if (this._animTimers.has(uid)) {
      clearTimeout(this._animTimers.get(uid));
      this._animTimers.delete(uid);
    }

    if (next) {
      before.className = "check-stroke check-before animating";
      after.className  = "check-stroke check-after animating";
      label.className  = "label checked animating";
      fw.className     = "firework animating";

      this._animTimers.set(uid, setTimeout(() => {
        before.className = "check-stroke check-before checked";
        after.className  = "check-stroke check-after checked";
        label.className  = "label checked";
        fw.className     = "firework";
        this._animTimers.delete(uid);
      }, 600));
    } else {
      before.className = "check-stroke check-before";
      after.className  = "check-stroke check-after";
      label.className  = "label";
      fw.className     = "firework";
    }

    // Fire service call — don't await
    this._hass.callService(
      "todo", "update_item",
      { item: uid, status: next ? "completed" : "needs_action" },
      { entity_id: this._config.entity }
    ).catch(() => {
      // Service failed → revert optimistic state, snap DOM
      item.checked = !next;
      this._snapRow(uid, !next);
    });
  }
}

customElements.define("checklist-card", ChecklistCard);
