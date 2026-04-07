/**
 * Prompt Template Syntax Highlighter
 *
 * Loads Prism core + markup grammar (shared vendor bundles), then registers
 * a custom "prompt" grammar that highlights the patterns common across all
 * prompt templates: XML/HTML tags, {{variables}}, quoted strings, numbers,
 * URLs, CDATA sections, and section headings.
 *
 * Each line is highlighted independently so that no token span can cross
 * a line boundary — this keeps line-number wrapping safe from broken HTML.
 *
 * Usage:
 *   import { initHighlighter, highlightPrompt } from './highlight.js';
 *   await initHighlighter();
 *   const html = highlightPrompt(rawText);
 *   const html = highlightPrompt(rawText, new Set(['skillName'])); // with input refs
 */

let _ready = false;
let _loadPromise = null;

/* ── Script loader ─────────────────────────────────────────────────────── */

function _loadScript(src) {
  return new Promise((resolve, reject) => {
    // Skip if already loaded (another card may have loaded it)
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

/* ── Load Prism core + markup ──────────────────────────────────────────── */

function _loadPrism() {
  if (window.Prism?.languages?.markup) return Promise.resolve();

  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    window.Prism = window.Prism || {};
    window.Prism.manual = true;

    await _loadScript('/local/vendor/prism-core.min.js');
    await _loadScript('/local/vendor/prism-markup.min.js');
  })();

  return _loadPromise;
}

/* ── Custom grammar: "prompt" ──────────────────────────────────────────── */
/* Because each line is highlighted in isolation, every pattern here must
   be single-line safe.  No [\s\S] or \s that could match across lines.  */

function _registerPromptGrammar() {
  if (window.Prism.languages.prompt) return;

  const prompt = {
    // CDATA open/close markers (single-line portions)
    'cdata': /<!\[CDATA\[|\]\]>/,

    // XML/HTML comments (single-line or opening partial)
    'comment': /<!--.*?-->|<!--.*$/,

    // Template variables: {{variableName}} or {{variable?:description}}
    'variable': /\{\{[\w?:.*][^}\n]*\}\}/,

    // XML/HTML tags (open, close, self-closing) with attributes
    'tag': {
      pattern: /<\/?[\w.:-]+(?:\s+[\w.:-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>/,
      greedy: true,
      inside: {
        'tag': {
          pattern: /^<\/?[\w.:-]+/,
          inside: {
            'punctuation': /^<\/?/,
            'namespace': /^[\w-]+?:/
          }
        },
        'special-attr': [],
        'attr-value': {
          pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
          inside: {
            'punctuation': [
              { pattern: /^=/, alias: 'attr-equals' },
              { pattern: /^["']|["']$/ }
            ]
          }
        },
        'punctuation': /\/?>/,
        'attr-name': {
          pattern: /[\w.:-]+/
        }
      }
    },

    // URLs (http/https)
    'url': /https?:\/\/[^\s<>)"']+/,

    // Inline code: `some code here`
    'code': {
      pattern: /`[^`\n]+`/,
      inside: {
        'code-punctuation': /^`|`$/
      }
    },

    // Mid-word apostrophes (e.g. subject's, don't) — must precede string
    // rule so Prism matches these first and leaves them uncoloured
    'apostrophe': /\b'\b/,

    // Quoted strings (double or single) — but not inside tags or mid-word
    'string': {
      pattern: /(^|[^\w=])(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*')/,
      lookbehind: true,
      greedy: true
    },

    // Section headings:
    //   1. Markdown-style # headings (1-6 #, any case after marker)
    //   2. Numbered ALL-CAPS labels: 1. HEADING or 2) HEADING
    //   3. ALL-CAPS lines (4+ uppercase chars, may end with colon)
    //   4. Short capitalised labels ending with colon (≤50 chars to avoid prose)
    'keyword': {
      pattern: /^#{1,6} [^\n]+$|^\d+[.)]\s*[A-Z][A-Z _\-/]{3,}:?$|^[A-Z][A-Z _\-/]{3,}:?$|^[A-Z][^:\n]{2,48}:$/,
      inside: {
        'md-heading-marker': /^#{1,6} /
      }
    },

    // Markdown table separator rows:  | --- | --- |
    'table-separator': /^\s*\|?[\s\-:|]+\|\s*$/,

    // Table cell delimiter pipes (must come after tag/string/variable
    // so it only matches free-standing | characters)
    'table-pipe': /\|/,

    // Markdown-style bold
    'bold': {
      pattern: /\*\*[^*\n]+\*\*/,
      inside: {
        'punctuation': /^\*\*|\*\*$/
      }
    },

    // Markdown-style italic — must follow bold so ** matches first.
    // Negative lookbehind excludes * preceded by * (leftover from bold)
    // or by word char (mid-word asterisks like file*name).
    'italic': {
      pattern: /(?<!\*|\w)\*(?!\s)[^*\n]+(?<!\s)\*(?!\*|\w)/,
      inside: {
        'punctuation': /^\*|\*$/
      }
    },

    // Numbers (integers, decimals, percentages)
    // Lookahead instead of \b so trailing % is captured (% is non-word)
    'number': /\b\d+(?:\.\d+)?%?(?!\w)/,

    // Bullet points (rendered as • via CSS)
    'list-bullet': /^[ \t]*[-*•][ \t]/,

    // Numbered lists
    'list-number': /^[ \t]*\d+[.)][ \t]/
  };

  window.Prism.languages.prompt = prompt;
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

const _fenceRe = /^\s*`{3}/;
const _separatorRe = /^\s*\|?[\s\-:|]+\|\s*$/;
const _codeCollapseThreshold = 5;
const _blockquoteRe = /^>([ \t]?)/;
const _hrRe = /^(?:-{3,}|\*{3,}|_{3,})\s*$/;

function _esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;') || ' ';
}

/* ── Input-ref placeholder pre/post-pass ──────────────────────────────── */
/* When a prompt declares inputs via <inputs><skillName>…</inputs>, single-
   brace references like {skillName} in the body should be highlighted.
   Because input names are prompt-specific (not universal), we can't bake
   them into the static Prism grammar.  Instead:
   1. Pre-pass: replace {inputName} with control-char placeholders that
      Prism won't match.
   2. Prism highlights the modified line normally.
   3. Post-pass: swap placeholders back to <span class="token input-ref">. */

/** Replace {inputName} matches with opaque placeholders.
 *  Returns { line, refs } where refs[i] holds the original matched text. */
function _markInputRefs(rawLine, inputNames) {
  if (!inputNames?.size) return { line: rawLine, refs: null };
  const refs = [];
  const line = rawLine.replace(/(?<!\$)(?<!\{)\{([a-zA-Z_]\w*)\}(?!\})/g, (match, word) => {
    if (!inputNames.has(word)) return match;
    const idx = refs.length;
    refs.push(match);
    return `\x01IREF${idx}\x02`;
  });
  return { line, refs: refs.length ? refs : null };
}

/** Restore placeholders in Prism HTML output with highlighted spans. */
function _restoreInputRefs(html, refs) {
  if (!refs) return html;
  return html.replace(/\x01IREF(\d+)\x02/g, (_, idx) => {
    const original = refs[parseInt(idx)];
    return `<span class="token input-ref">${_esc(original)}</span>`;
  });
}

/** Split a pipe-delimited line into cell strings (trims outer pipes).
 *  Respects escaped pipes: \| is a literal pipe inside a cell, not a delimiter. */
function _splitCells(line) {
  const s = line.trim();
  // Split on unescaped pipes only — \| is kept as literal |
  const cells = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') {
      cur += '|';
      i++;
    } else if (s[i] === '|') {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += s[i];
    }
  }
  cells.push(cur.trim());
  // Drop empty first/last cells left by leading/trailing delimiter pipes
  if (cells.length && cells[0] === '') cells.shift();
  if (cells.length && cells[cells.length - 1] === '') cells.pop();
  return cells;
}

/** Parse column alignments from a separator row (e.g. | :--- | ---: | :---: |). */
function _parseAligns(sepLine) {
  return _splitCells(sepLine).map(c => {
    const t = c.replace(/\s/g, '');
    if (t.startsWith(':') && t.endsWith(':')) return 'center';
    if (t.endsWith(':')) return 'right';
    return 'left';
  });
}

/**
 * Build an HTML <table> from buffered table entries.
 * Each entry: { rawLine, displayNum, gutterWidth }
 * Returns HTML string.
 */
function _buildTable(entries, grammar, inputNames) {
  // Identify separator row (usually index 1)
  let sepIdx = -1;
  for (let i = 0; i < entries.length; i++) {
    if (_separatorRe.test(entries[i].rawLine)) { sepIdx = i; break; }
  }

  const aligns = sepIdx >= 0 ? _parseAligns(entries[sepIdx].rawLine) : [];

  const highlightCell = (text) => {
    if (!text) return '&nbsp;';
    if (grammar) {
      const { line, refs } = _markInputRefs(text, inputNames);
      const html = window.Prism.highlight(line, grammar, 'prompt') || _esc(text);
      return _restoreInputRefs(html, refs);
    }
    return _esc(text);
  };

  const alignAttr = (colIdx) => {
    const a = aligns[colIdx];
    return a && a !== 'left' ? ` style="text-align:${a}"` : '';
  };

  // Collect body entries (skip separator rows)
  const bodyEntries = [];
  const bodyStart = sepIdx >= 0 ? sepIdx + 1 : 0;
  for (let i = bodyStart; i < entries.length; i++) {
    if (!_separatorRe.test(entries[i].rawLine)) bodyEntries.push(entries[i]);
  }

  // All elements are <span> (phrasing content) — safe inside <pre>.
  // CSS display:table/table-row/table-cell provides table layout.

  // ── Gutter: sticky flex column with line numbers ──
  let gutter = '<span class="pm-table-gutter">';
  if (sepIdx > 0) {
    for (let i = 0; i < sepIdx; i++) {
      const num = String(entries[i].displayNum).padStart(entries[i].gutterWidth, ' ');
      gutter += `<span class="pm-table-num pm-table-num--head">${num}</span>`;
    }
  }
  for (let bi = 0; bi < bodyEntries.length; bi++) {
    const num = String(bodyEntries[bi].displayNum).padStart(bodyEntries[bi].gutterWidth, ' ');
    const lastCls = bi === bodyEntries.length - 1 ? ' pm-table-num--last' : '';
    gutter += `<span class="pm-table-num${lastCls}">${num}</span>`;
  }
  gutter += '</span>';

  // ── Data table (spans with CSS table display) ──
  let data = '<span class="pm-table">';
  if (sepIdx > 0) {
    data += '<span class="pm-thead">';
    for (let i = 0; i < sepIdx; i++) {
      const cells = _splitCells(entries[i].rawLine);
      data += '<span class="pm-tr">';
      cells.forEach((c, ci) => { data += `<span class="pm-th"${alignAttr(ci)}>${highlightCell(c)}</span>`; });
      data += '</span>';
    }
    data += '</span>';
  }
  data += '<span class="pm-tbody">';
  for (let bi = 0; bi < bodyEntries.length; bi++) {
    const cells = _splitCells(bodyEntries[bi].rawLine);
    const lastCls = bi === bodyEntries.length - 1 ? ' pm-tr--last' : '';
    data += `<span class="pm-tr${lastCls}">`;
    cells.forEach((c, ci) => { data += `<span class="pm-td"${alignAttr(ci)}>${highlightCell(c)}</span>`; });
    data += '</span>';
  }
  data += '</span></span>';

  return `<span class="pm-table-block">${gutter}<span class="pm-table-wrap">${data}</span></span>`;
}

/* ── Public API ────────────────────────────────────────────────────────── */

/**
 * Load Prism and register the prompt grammar.
 * Safe to call multiple times — only loads once.
 */
export async function initHighlighter() {
  if (_ready) return;
  await _loadPrism();
  _registerPromptGrammar();
  _ready = true;
}

/**
 * Highlight a raw prompt string and return HTML with line numbers.
 * Each line is highlighted independently to avoid cross-line token spans.
 * Returns the original text (escaped) if the highlighter isn't ready.
 *
 * @param {string} text - Raw prompt content
 * @param {Set<string>} [inputNames] - Declared input names from <inputs> block.
 *   When provided, single-brace references like {skillName} are highlighted
 *   as input-ref tokens if the name matches (case-sensitive, exact).
 * @returns {string} HTML string with <span class="token ..."> wrappers
 *                   and per-line number gutter
 */
const _hlCache = new Map();
const _hlCacheMax = 20;

/** Check if highlighting for this content is already cached. */
export function isHighlightCached(text, inputNames) {
  if (!text) return true;
  const key = inputNames?.size
    ? text + '\x00' + [...inputNames].sort().join(',')
    : text;
  return _hlCache.has(key);
}

export function highlightPrompt(text, inputNames) {
  if (!text) return '';

  // Cache key: text + sorted input names (if any)
  const cacheKey = inputNames?.size
    ? text + '\x00' + [...inputNames].sort().join(',')
    : text;
  const cached = _hlCache.get(cacheKey);
  if (cached) return cached;

  const usePrism = _ready && window.Prism?.languages?.prompt;
  const grammar = usePrism ? window.Prism.languages.prompt : null;
  const lines = text.split('\n');
  const gutterWidth = String(lines.length).length;

  // Pre-pass: identify fenced code blocks and mark long ones for collapsing
  // lineFlags: 0 = normal, 1 = opening fence, 2 = code content, 3 = closing fence
  const lineFlags = new Array(lines.length).fill(0);
  const longBlocks = new Set();   // fenceOpenIdx
  const longCloses = new Set();   // fenceCloseIdx
  let insideFence = false, fenceOpenIdx = -1, fenceCodeCount = 0;
  for (let j = 0; j < lines.length; j++) {
    if (_fenceRe.test(lines[j])) {
      if (insideFence) {
        lineFlags[j] = 3;
        if (fenceCodeCount > _codeCollapseThreshold) {
          longBlocks.add(fenceOpenIdx);
          longCloses.add(j);
        }
      } else {
        lineFlags[j] = 1;
        fenceOpenIdx = j;
        fenceCodeCount = 0;
      }
      insideFence = !insideFence;
    } else if (insideFence) {
      lineFlags[j] = 2;
      fenceCodeCount++;
    }
  }

  // Count visible lines for display numbering (fence lines are hidden)
  const visibleCount = lineFlags.reduce((n, f) => n + (f === 1 || f === 3 ? 0 : 1), 0);
  const visGutterWidth = String(visibleCount).length;
  let displayNum = 0;

  const htmlLines = lines.map((line, i) => {
    const isFence = lineFlags[i] === 1 || lineFlags[i] === 3;
    if (!isFence) displayNum++;
    const num = isFence ? '' : String(displayNum).padStart(visGutterWidth, ' ');
    let content;

    if (isFence) {
      content = ' ';
    } else if (lineFlags[i] === 2) {
      content = _esc(line);
    } else if (_hrRe.test(line)) {
      // Horizontal rule — handled outside grammar to avoid per-line regex cost
      content = `<span class="token hr">${_esc(line)}</span>`;
    } else if (_blockquoteRe.test(line)) {
      // Blockquote — strip > marker, highlight rest with normal grammar
      const stripped = line.replace(_blockquoteRe, '');
      let inner;
      if (grammar) {
        const { line: marked, refs } = _markInputRefs(stripped, inputNames);
        inner = window.Prism.highlight(marked, grammar, 'prompt') || ' ';
        inner = _restoreInputRefs(inner, refs);
      } else {
        inner = _esc(stripped);
      }
      content = `<span class="token blockquote">${inner}</span>`;
    } else if (grammar) {
      const { line: marked, refs } = _markInputRefs(line, inputNames);
      content = window.Prism.highlight(marked, grammar, 'prompt') || ' ';
      content = _restoreInputRefs(content, refs);
    } else {
      content = _esc(line);
    }

    // Visual-only post-passes (only on highlighted content)
    if (content !== ' ') {
      content = content.replace(/\u2014/g, '-');
      // Dim parentheticals — runs on the HTML output, only wraps (text)
      // that wasn't already consumed by a Prism token
      content = content.replace(/\([^()<>]*\)/g, '<span class="token paren">$&</span>');
    }

    // Build line class
    let cls = 'pm-line';
    if (lineFlags[i] === 1)      cls += ' pm-line--fence pm-line--fence-open';
    else if (lineFlags[i] === 3) cls += ' pm-line--fence pm-line--fence-close';
    else if (lineFlags[i] === 2) {
      cls += ' pm-line--code';
      if (lineFlags[i - 1] === 1) cls += ' pm-line--code-first';
      if (lineFlags[i + 1] === 3) cls += ' pm-line--code-last';
    }
    else if ((content.includes('table-pipe') || content.includes('table-separator'))
             && (line.split('|').length >= 3))
                                 cls += ' pm-line--table';

    // Insert code-block wrapper open/close around fenced regions
    let prefix = '';
    let suffix = '';
    if (lineFlags[i] === 1) {
      if (longBlocks.has(i)) {
        prefix = '<span class="pm-code-collapse"><span class="pm-code-block">';
      } else {
        prefix = '<span class="pm-code-block">';
      }
    }
    if (lineFlags[i] === 3) {
      if (longCloses.has(i)) {
        suffix = `</span><span class="pm-code-expand" onclick="this.parentElement.classList.toggle('pm-code-collapse--open')"></span></span>`;
      } else {
        suffix = '</span>';
      }
    }

    const isTable = cls.includes('pm-line--table');
    return {
      html: `${prefix}<span class="${cls}"><span class="pm-line-num">${num}</span><span class="pm-line-content">${content}</span></span>${suffix}`,
      isTable,
      rawLine: line,
      displayNum: displayNum,
      gutterWidth: visGutterWidth
    };
  });

  // Post-pass: render consecutive table lines as real HTML tables
  const out = [];
  let tableBuf = [];
  for (const entry of htmlLines) {
    if (entry.isTable) {
      tableBuf.push(entry);
    } else {
      if (tableBuf.length) {
        out.push(_buildTable(tableBuf, grammar, inputNames));
        tableBuf = [];
      }
      out.push(entry.html);
    }
  }
  if (tableBuf.length) out.push(_buildTable(tableBuf, grammar, inputNames));

  const result = out.join('');

  // LRU-style eviction: drop oldest entry when cache is full
  if (_hlCache.size >= _hlCacheMax) _hlCache.delete(_hlCache.keys().next().value);
  _hlCache.set(cacheKey, result);

  return result;
}
