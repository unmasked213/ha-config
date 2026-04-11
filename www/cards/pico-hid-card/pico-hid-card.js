import '/local/base/foundation.js';
import '/local/base/tooltips.js';
import { applyThemeClass, initInputs, initButtons } from '/local/base/helpers.js';
import { uiComponents } from '/local/base/components.js';

/* -- Constants ----------------------------------------------------------- */

const CHAR_LIMIT = 50000;

/* -- Styles -------------------------------------------------------------- */

const cardStyles = new CSSStyleSheet();
cardStyles.replaceSync(`
  :host {
    display: block;
  }

  .container {
    position: relative;
    overflow: hidden;
    background: var(--ui-surface);
    color: var(--ui-text);
    border-radius: var(--ui-radius-l);
    padding: var(--ui-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-4);
    box-sizing: border-box;
  }

  /* -- Header ------------------------------------------------------------ */

  .ui-card-header__title {
    flex: none;
  }

  /* -- Header accent status ---------------------------------------------- */

  .ui-card-header__accent {
    transition: background var(--ui-motion-med);
  }

  .ui-card-header__accent.is-online  { background: var(--ui-success); }
  .ui-card-header__accent.is-offline { background: var(--ui-error); }
  .ui-card-header__accent.is-typing  { background: var(--ui-warning); animation: accent-pulse 1.2s ease-in-out infinite; }

  @keyframes accent-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* -- Text area (shared .ui-input with textarea overrides) ------------- */

  .text-section {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-2);
  }

  .ui-input--textarea {
    height: auto;
    min-height: 160px;
  }

  .ui-input--textarea .ui-input__pill {
    height: auto;
    min-height: 160px;
    border-radius: var(--ui-radius-l);
    align-items: flex-start;
  }

  .ui-input--textarea .ui-input__field {
    height: 140px;
    padding: var(--ui-space-6) var(--ui-space-4) var(--ui-space-3);
    resize: none;
    font-family: monospace;
    line-height: var(--ui-font-line-height-m);
    scrollbar-width: none;
    overflow-y: auto;
  }

  .ui-input--textarea .ui-input__label {
    top: var(--ui-space-3);
    transform: translateY(0);
  }

  .ui-input--textarea .ui-input__pill.has-value .ui-input__label,
  .ui-input--textarea .ui-input__pill:focus-within .ui-input__label {
    transform: translateY(-34px) scale(0.75);
  }

  .text-meta {
    display: flex;
    justify-content: flex-end;
    gap: var(--ui-space-3);
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
  }

  .text-meta .char-warning { color: var(--ui-warning); }
  .text-meta .char-danger  { color: var(--ui-error); }

  /* -- Controls ---------------------------------------------------------- */

  .controls {
    display: flex;
    gap: var(--ui-space-3);
    flex-wrap: wrap;
  }

  /* -- Progress ---------------------------------------------------------- */

  .progress-section {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-2);
  }

  .progress-stats {
    display: flex;
    justify-content: space-between;
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
  }

  /* -- Preset row -------------------------------------------------------- */

  .preset-row {
    display: flex;
    gap: var(--ui-space-2);
  }

  .preset-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--ui-space-1);
    padding: var(--ui-space-3) var(--ui-space-3);
    min-height: var(--ui-space-10);
    border-radius: var(--ui-radius-m);
    border: var(--ui-border-width-s) solid var(--ui-border-color-light);
    background: transparent;
    color: var(--ui-text);
    cursor: pointer;
    text-align: center;
    transition: background var(--ui-motion-fast), border-color var(--ui-motion-fast);
  }

  .preset-btn:hover {
    background: var(--ui-state-hover);
  }

  .preset-btn:active {
    background: var(--ui-state-pressed);
  }

  .preset-btn.is-active {
    border-color: var(--ui-accent);
    background: var(--ui-chip-selected-bg);
  }

  .preset-btn:disabled {
    opacity: var(--ui-state-disabled-opacity);
    cursor: default;
    pointer-events: none;
  }

  .preset-btn:focus-visible {
    outline: var(--ui-border-width-m) solid var(--ui-state-focus-ring);
    outline-offset: var(--ui-focus-outline-offset);
  }

  .preset-label {
    font-size: var(--ui-font-s);
    font-weight: var(--ui-font-weight-l);
    color: var(--ui-text);
  }

  .preset-desc {
    font-size: var(--ui-font-xs);
    color: var(--ui-text-mute);
  }

  @media (prefers-reduced-motion: reduce) {
    .preset-btn { transition: none; }
  }

  /* -- Footer ------------------------------------------------------------ */

  .footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-top: var(--ui-space-2);
  }

  /* -- Toast ------------------------------------------------------------- */

  .toast {
    position: fixed;
    bottom: var(--ui-space-4);
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: var(--ui-elevated-2);
    color: var(--ui-text);
    font-size: var(--ui-font-s);
    padding: var(--ui-space-2) var(--ui-space-4);
    border-radius: var(--ui-radius-m);
    border: var(--ui-border-width-s) solid var(--ui-border-color-med);
    box-shadow: var(--ui-shadow-2);
    opacity: 0;
    transition: transform var(--ui-motion-med),
                opacity var(--ui-motion-med);
    pointer-events: none;
    z-index: 1000;
  }

  .toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }

  .toast.error { border-color: var(--ui-error); }
`);

/* -- Card Editor --------------------------------------------------------- */

class PicoHidCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; }

  connectedCallback() {
    const url = this._config?.pico_url || 'http://192.168.4.176';
    this.innerHTML = `
      <div style="padding:16px;">
        <label style="display:block;margin-bottom:8px;color:var(--secondary-text-color)">Pico URL</label>
        <input type="text" value="${url}"
          style="width:100%;padding:8px;background:var(--card-background-color);
                 color:var(--primary-text-color);border:1px solid var(--divider-color);
                 border-radius:4px;">
      </div>`;
    this.querySelector('input').addEventListener('input', (e) => this._changed(e));
  }

  _changed(e) {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: { ...this._config, pico_url: e.target.value } },
      bubbles: true, composed: true,
    }));
  }
}
customElements.define("pico-hid-card-editor", PicoHidCardEditor);

/* -- Main Card ----------------------------------------------------------- */

class PicoHidCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("pico-hid-card-editor");
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this._rootEl = document.createElement("div");
    this.shadow.appendChild(this._rootEl);

    this.config = {};
    this._picoUrl = 'http://192.168.4.176';

    this._state = {
      online: false,
      mode: 'unknown',
      typing: false,
      charsSent: 0,
      charsTotal: 0,
      charsRemaining: 0,
      elapsed: 0,
      bufferLoaded: false,
      picoConfig: null,
      textValue: '',
      lastError: null,
      activePreset: 'natural',
    };

    this._pollTimer = null;
    this._toastTimer = null;
    this._syncingConfig = false;
  }

  setConfig(config) {
    this.config = config;
    this._picoUrl = (config.pico_url || 'http://192.168.4.176').replace(/\/$/, '');
    this.render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    applyThemeClass(this, hass);
    if (first) this.render();
  }

  connectedCallback() {
    this.shadow.adoptedStyleSheets = [
      window.uiFoundation,
      uiComponents,
      cardStyles
    ];
    initButtons(this.shadow);
    this.render();
    this._startPolling();
    this._fetchHealth();
    this._fetchConfig();
  }

  disconnectedCallback() {
    this._stopPolling();
    clearTimeout(this._toastTimer);
  }

  /* -- Polling --------------------------------------------------------- */

  _startPolling() {
    this._stopPolling();
    this._pollTimer = setInterval(() => this._poll(), 2000);
  }

  _stopPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  async _poll() {
    const res = await this._fetch('/status');
    if (!res) {
      if (this._state.online) {
        this._state.online = false;
        this._updateStatus();
      }
      return;
    }
    const wasTyping = this._state.typing;
    this._state.online = true;
    this._state.typing = res.typing;
    this._state.charsSent = res.sent || 0;
    this._state.charsTotal = res.total || 0;
    this._state.charsRemaining = res.chars || 0;
    this._state.elapsed = res.elapsed || 0;
    this._state.bufferLoaded = (res.chars || 0) > 0 || res.typing;

    if (wasTyping && !res.typing) {
      this._toast('Typing complete.');
    }

    this._updateStatus();
  }

  async _fetchHealth() {
    const res = await this._fetch('/health');
    if (res) {
      this._state.online = true;
      this._state.mode = res.mode || 'stealth';
    } else {
      this._state.online = false;
    }
    this._updateStatus();
  }

  async _fetchConfig() {
    const res = await this._fetch('/config');
    if (res) {
      this._state.picoConfig = res;
      this._updateConfig();
    }
  }

  /* -- API helpers ----------------------------------------------------- */

  async _fetch(path, opts = {}) {
    try {
      const resp = await fetch(this._picoUrl + path, {
        ...opts,
        signal: AbortSignal.timeout(3000),
      });
      if (!resp.ok) return null;
      return await resp.json();
    } catch {
      return null;
    }
  }

  async _post(path, body) {
    return this._fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

  async _postText(path, text) {
    try {
      const resp = await fetch(this._picoUrl + path, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: text,
        signal: AbortSignal.timeout(5000),
      });
      if (!resp.ok) return null;
      return await resp.json();
    } catch {
      return null;
    }
  }

  /* -- Actions --------------------------------------------------------- */

  async _sendText() {
    const ta = this.shadow.getElementById('pico-text');
    const text = ta?.value?.trim();
    if (!text) return;
    if (text.length > CHAR_LIMIT) {
      this._toast('Over the character limit.', true);
      return;
    }

    const res = await this._postText('/send', text);
    if (res?.status) {
      this._toast(res.status);
      this._state.bufferLoaded = true;
      this._updateStatus();
    } else {
      this._toast('Could not reach the device.', true);
    }
  }

  async _startTyping() {
    const res = await this._post('/type', '');
    if (res?.status) {
      this._toast(res.status);
      setTimeout(() => this._poll(), 500);
    } else {
      this._toast('Could not start typing.', true);
    }
  }

  async _stopTyping() {
    const res = await this._post('/stop', '');
    if (res?.status) {
      this._toast(res.status);
      setTimeout(() => this._poll(), 500);
    } else {
      this._toast('Could not stop typing.', true);
    }
  }

  async _updatePicoConfig(key, value) {
    const update = {};
    update[key] = value;
    const res = await this._post('/config', update);
    if (res) {
      const { note, ...cfg } = res;
      this._state.picoConfig = cfg;
      this._updateConfig();
      if (note) this._toast(note);
    }
  }

  async _clearBuffer() {
    const res = await this._post('/clear', '');
    if (res?.status) {
      this._toast(res.status);
      this._state.bufferLoaded = false;
      this._state.charsSent = 0;
      this._state.charsTotal = 0;
      this._state.charsRemaining = 0;
      const ta = this.shadow.getElementById('pico-text');
      if (ta) { ta.value = ''; this._state.textValue = ''; }
      this._updateStatus();
    } else {
      this._toast('Could not clear buffer.', true);
    }
  }

  async _requestMaintenance() {
    const res = await this._post('/maintenance', '');
    if (res?.status) {
      this._toast(res.status);
    }
  }

  /* -- Toast ----------------------------------------------------------- */

  _toast(msg, isError = false) {
    const el = this.shadow.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast' + (isError ? ' error' : '');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
  }

  /* -- Derived state helpers ------------------------------------------ */

  /** True when typing was stopped before finishing (can be resumed). */
  get _isPaused() {
    const s = this._state;
    return !s.typing && s.bufferLoaded && s.charsSent > 0
      && s.charsRemaining > 0;
  }

  /* -- Partial updates (avoid full re-render on poll) ------------------ */

  _updateStatus() {
    const accent = this.shadow.getElementById('header-accent');
    const progressSection = this.shadow.getElementById('progress-section');
    const progressFill = this.shadow.getElementById('progress-fill');
    const statsLeft = this.shadow.getElementById('stats-left');
    const statsRight = this.shadow.getElementById('stats-right');
    const sendBtn = this.shadow.getElementById('btn-send');
    const clearBtn = this.shadow.getElementById('btn-clear');
    const typeBtn = this.shadow.getElementById('btn-type');
    const stopBtn = this.shadow.getElementById('btn-stop');
    const maintBtn = this.shadow.getElementById('btn-maintenance');

    if (accent) {
      accent.className = 'ui-card-header__accent ' +
        (this._state.typing ? 'is-typing' : this._state.online ? 'is-online' : 'is-offline');
    }

    /* Progress — only visible while typing */
    if (progressSection) {
      progressSection.style.display = this._state.typing ? '' : 'none';
    }

    const pct = this._state.charsTotal > 0
      ? Math.round((this._state.charsSent / this._state.charsTotal) * 100)
      : 0;

    if (progressFill) progressFill.style.width = pct + '%';
    if (statsLeft) {
      statsLeft.textContent = this._state.typing
        ? `${this._state.charsSent} of ${this._state.charsTotal} typed`
        : '';
    }
    if (statsRight) {
      statsRight.textContent = this._state.elapsed > 0
        ? this._formatElapsed(this._state.elapsed) : '';
    }

    /* Preset buttons — disabled when offline */
    this.shadow.querySelectorAll('[data-preset]').forEach(btn => {
      btn.disabled = !this._state.online;
    });
    if (sendBtn) sendBtn.disabled = !this._state.online;
    if (clearBtn) clearBtn.disabled = !this._state.online || !this._state.bufferLoaded || this._state.typing;
    if (maintBtn) maintBtn.disabled = !this._state.online;

    /* Type / Stop toggle visibility */
    if (typeBtn) {
      typeBtn.style.display = this._state.typing ? 'none' : '';
      typeBtn.disabled = !this._state.online || !this._state.bufferLoaded;
      typeBtn.textContent = this._isPaused ? 'Resume' : 'Type';
    }
    if (stopBtn) {
      stopBtn.style.display = this._state.typing ? '' : 'none';
    }
  }

  _updateConfig() {
    if (!this._state.picoConfig) return;
    this._syncingConfig = true;
    const cfg = this._state.picoConfig;
    this.shadow.querySelectorAll('ui-circle-slider[data-key]').forEach(slider => {
      const key = slider.dataset.key;
      if (key && cfg[key] !== undefined) {
        slider.value = cfg[key];
      }
    });
    // Defer releasing guard to next animation frame so any async ui-change
    // events fired by circle sliders on value set are still suppressed
    Promise.resolve().then(() => requestAnimationFrame(() => {
      this._syncingConfig = false;
    }));
  }

  _formatElapsed(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  /* -- Presets --------------------------------------------------------- */

  get _presets() {
    return [
      {
        id: 'natural',
        label: 'Natural',
        desc: '150 WPM · fast',
        config: { wpm: 150, jitter_pct: 15, typo_rate: 0.3, think_chance: 0.1, think_min_ms: 100, think_max_ms: 500, punct_pause_ms: 80, fatigue_pct: 5 }
      },
      {
        id: 'careful',
        label: 'Careful',
        desc: '80 WPM',
        config: { wpm: 80, jitter_pct: 40, typo_rate: 2.5, think_chance: 1.5, think_min_ms: 400, think_max_ms: 4000, punct_pause_ms: 350, fatigue_pct: 20 }
      },
      {
        id: 'urgent',
        label: 'Urgent',
        desc: '150 WPM · minimal pauses',
        config: { wpm: 150, jitter_pct: 15, typo_rate: 0.1, think_chance: 0.05, think_min_ms: 100, think_max_ms: 300, punct_pause_ms: 50, fatigue_pct: 3 }
      },
    ];
  }

  async _applyPreset(preset) {
    this._state.activePreset = preset.id;
    this._updatePresetButtons();
    const res = await this._post('/config', preset.config);
    if (res) {
      this._state.picoConfig = res;
      if (res.note) this._toast(res.note);
    } else {
      this._toast('Could not update config.', true);
    }
  }

  _updatePresetButtons() {
    this.shadow.querySelectorAll('[data-preset]').forEach(btn => {
      btn.classList.toggle('is-selected', btn.dataset.preset === this._state.activePreset);
    });
  }

  /* -- Config definitions (kept for reference, no longer rendered as sliders) */

  _sliderHtml() { return ''; }

  /* -- Settings drawer ------------------------------------------------- */

  /* -- Render ----------------------------------------------------------- */

  render() {
    const s = this._state;
    const cfg = s.picoConfig || {};

    this._rootEl.innerHTML = `
      <div class="container">

        <div class="ui-card-header">
          <div class="ui-card-header__accent ${s.typing ? 'is-typing' : s.online ? 'is-online' : 'is-offline'}" id="header-accent"></div>
          <h2 class="ui-card-header__title">Pico HID</h2>
          <ui-info-icon position="bottom"></ui-info-icon>
        </div>

        <div class="text-section">
          <div class="ui-input ui-input--textarea">
            <div class="ui-input__pill${s.textValue ? ' has-value' : ''}">
              <label class="ui-input__label">Content to add</label>
              <textarea class="ui-input__field" id="pico-text"
                maxlength="${CHAR_LIMIT}"
                spellcheck="false">${this._escHtml(s.textValue)}</textarea>
            </div>
          </div>
          <div class="text-meta">
            <span id="char-remaining"></span>
          </div>
        </div>

        <div class="controls">
          <button class="ui-btn ui-btn--accent ui-btn--filled" id="btn-send" ${!s.online ? 'disabled' : ''}>Add</button>
          <button class="ui-btn ui-btn--outline" id="btn-clear" ${!s.online || !s.bufferLoaded || s.typing ? 'disabled' : ''}>Clear</button>
          <button class="ui-btn ui-btn--accent ui-btn--filled" id="btn-type"
            style="${s.typing ? 'display:none' : ''}"
            ${!s.online || !s.bufferLoaded ? 'disabled' : ''}>${this._isPaused ? 'Resume' : 'Type'}</button>
          <button class="ui-btn ui-btn--danger" id="btn-stop"
            style="${!s.typing ? 'display:none' : ''}">Stop</button>
        </div>

        <div class="progress-section" id="progress-section" style="${!s.typing ? 'display:none' : ''}">
          <div class="ui-progress ui-progress--thin">
            <div class="ui-progress__bar" id="progress-fill" style="width:0%"></div>
          </div>
          <div class="progress-stats">
            <span id="stats-left"></span>
            <span id="stats-right"></span>
          </div>
        </div>

        <div class="footer">
          <button class="ui-btn ui-btn--muted ui-btn--small" id="btn-maintenance" ${!s.online ? 'disabled' : ''}>Maintenance</button>
        </div>

        <div class="preset-row">
          ${this._presets.map(p => `
            <button class="ui-btn ui-btn--toggle${s.activePreset === p.id ? ' is-selected' : ''}" data-preset="${p.id}" ${!s.online ? 'disabled' : ''}>${p.label}</button>`).join('')}
        </div>

      </div>
      <div class="toast" id="toast"></div>
    `;

    this._bindEvents();
    this._wireInfoIcon();
    initInputs(this.shadow);
  }

  _escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* -- Tooltip wiring -------------------------------------------------- */

  _wireInfoIcon() {
    const cardIcon = this.shadow.querySelector('.ui-card-header ui-info-icon');
    if (cardIcon) {
      cardIcon.tooltipContent = {
        title: 'Pico HID',
        intro: 'Types out text on a connected computer using a small USB device, making it look like a real person is typing.',
        items: [
          { term: 'Status line', desc: 'The coloured bar next to the title. Green = connected, red = offline, pulsing amber = typing.' },
          { term: 'Add', desc: 'Sends your text to the device so it\u2019s ready to be typed out.' },
          { term: 'Clear', desc: 'Discards the loaded text without typing it.' },
          { term: 'Type', desc: 'Begins typing the loaded text. Shows Resume if paused mid-run.' },
          { term: 'Stop', desc: 'Pauses typing where it is \u2014 resume any time.' },
          { term: 'Settings', desc: 'Switch between typing presets.' },
          { term: 'Natural', desc: '150 WPM with realistic rhythm, occasional typos, and thinking pauses.' },
          { term: 'Careful', desc: '80 WPM with more hesitation and variation, as if composing on the fly.' },
          { term: 'Urgent', desc: '150 WPM, minimal pauses and typos \u2014 fast and focused.' },
          { term: 'Maintenance', desc: 'Puts the device into a service mode for updates or troubleshooting.' },
        ],
      };
    }
  }

  /* -- Event binding --------------------------------------------------- */

  _bindEvents() {
    const $ = (id) => this.shadow.getElementById(id);

    // Text area — character remaining display
    const ta = $('pico-text');
    if (ta) {
      const remainEl = $('char-remaining');
      const updateRemaining = () => {
        const len = ta.value.length;
        this._state.textValue = ta.value;
        const remaining = CHAR_LIMIT - len;

        if (!remainEl) return;

        if (remaining <= 0) {
          remainEl.textContent = 'Limit reached';
          remainEl.className = 'char-danger';
        } else if (len >= 45000) {
          remainEl.textContent = remaining.toLocaleString() + ' remaining';
          remainEl.className = 'char-danger';
        } else if (len >= 40000) {
          remainEl.textContent = remaining.toLocaleString() + ' remaining';
          remainEl.className = 'char-warning';
        } else {
          remainEl.textContent = '';
          remainEl.className = '';
        }
      };
      ta.addEventListener('input', updateRemaining);
      updateRemaining();
    }

    // Buttons
    $('btn-send')?.addEventListener('click', () => this._sendText());
    $('btn-clear')?.addEventListener('click', () => this._clearBuffer());
    $('btn-type')?.addEventListener('click', () => this._startTyping());
    $('btn-stop')?.addEventListener('click', () => this._stopTyping());
    $('btn-maintenance')?.addEventListener('click', () => this._requestMaintenance());

    // Preset buttons
    this.shadow.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = this._presets.find(p => p.id === btn.dataset.preset);
        if (preset) this._applyPreset(preset);
      });
    });
  }
}

customElements.define("pico-hid-card", PicoHidCard);