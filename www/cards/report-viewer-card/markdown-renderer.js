/**
 * Markdown Renderer for Report Viewer Card
 *
 * Handles markdown-it setup, Prism syntax highlighting, and configuration.
 * Loaded by report-viewer-card.js — not registered independently.
 */

/* ── Load markdown-it (UMD bundle) ─────────────────────────────────────── */

let _mdInstance = null;
let _loadPromise = null;

/**
 * Dynamically load the markdown-it UMD bundle if not already present.
 * Returns a promise that resolves when window.markdownit is available.
 */
function _loadMarkdownIt() {
  if (window.markdownit) return Promise.resolve();

  if (_loadPromise) return _loadPromise;

  _loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/local/vendor/markdown-it.min.js';
    script.onload = () => {
      if (window.markdownit) {
        resolve();
      } else {
        reject(new Error('markdown-it loaded but window.markdownit not found'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load markdown-it'));
    document.head.appendChild(script);
  });

  return _loadPromise;
}

/**
 * Get or create the configured markdown-it instance.
 */
function _getInstance() {
  if (_mdInstance) return _mdInstance;

  _mdInstance = window.markdownit({
    html: false,
    linkify: false,
    typographer: false,
    breaks: false,
  });

  // Enable strikethrough plugin (bundled with markdown-it core)
  _mdInstance.enable('strikethrough');

  return _mdInstance;
}


/* ── Load Prism (UMD core + language packs) ────────────────────────────── */

let _prismPromise = null;

/**
 * Load a script and return a promise.
 */
function _loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Load Prism core and language packs sequentially.
 * Language packs must load after core; markup must load before jinja2.
 */
function _loadPrism() {
  if (window.Prism) return Promise.resolve();

  if (_prismPromise) return _prismPromise;

  _prismPromise = (async () => {
    // Prevent Prism from auto-highlighting on load
    window.Prism = window.Prism || {};
    window.Prism.manual = true;

    await _loadScript('/local/vendor/prism-core.min.js');

    // Language packs — order matters (markup → markup-templating → jinja2)
    await _loadScript('/local/vendor/prism-markup.min.js');
    await _loadScript('/local/vendor/prism-markup-templating.min.js');
    await Promise.all([
      _loadScript('/local/vendor/prism-yaml.min.js'),
      _loadScript('/local/vendor/prism-python.min.js'),
      _loadScript('/local/vendor/prism-bash.min.js'),
      _loadScript('/local/vendor/prism-json.min.js'),
    ]);
    // Jinja2 (django) depends on markup-templating
    await _loadScript('/local/vendor/prism-jinja2.min.js');
  })();

  return _prismPromise;
}

/**
 * Detect if a code block is a cascade tree (failure-mode reports).
 * Heuristic: 50%+ of non-empty lines contain → character.
 */
export function isCascadeTree(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return false;
  const arrowLines = lines.filter(l => l.includes('→'));
  return arrowLines.length / lines.length >= 0.5;
}

/**
 * Map markdown-it language hints to Prism grammar names.
 */
const LANG_MAP = {
  yaml: 'yaml',
  yml: 'yaml',
  python: 'python',
  py: 'python',
  bash: 'bash',
  shell: 'bash',
  sh: 'bash',
  json: 'json',
  jinja2: 'django',
  jinja: 'django',
  html: 'markup',
  xml: 'markup',
};


/* ── Public API ────────────────────────────────────────────────────────── */

/**
 * Initialise the renderer. Call once at card startup.
 * Returns a promise that resolves when ready.
 */
export async function initRenderer() {
  await Promise.all([
    _loadMarkdownIt(),
    _loadPrism(),
  ]);
  _getInstance();
}

/**
 * Render a markdown string to an HTML string.
 * Must call initRenderer() first.
 */
export function renderMarkdown(src) {
  const md = _getInstance();
  return md.render(src || '');
}

/**
 * Apply Prism syntax highlighting to code blocks inside a DOM root.
 * Skips cascade tree blocks (detected by arrow heuristic).
 */
export function highlightCodeBlocks(root) {
  if (!window.Prism) return;

  const codeEls = root.querySelectorAll('pre code');
  codeEls.forEach(code => {
    // Skip cascade trees
    if (isCascadeTree(code.textContent)) return;

    // Extract language from class (markdown-it adds "language-xxx")
    const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
    const langHint = langClass ? langClass.replace('language-', '') : null;
    const grammarName = langHint ? LANG_MAP[langHint] : null;

    if (grammarName && window.Prism.languages[grammarName]) {
      const highlighted = window.Prism.highlight(
        code.textContent,
        window.Prism.languages[grammarName],
        grammarName
      );
      code.innerHTML = highlighted;
    }
  });
}
