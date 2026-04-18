// /config/www/cards/prompt-manager/modules/highlight.snapshot.js
//
// Snapshot harness for the prompt-manager highlighter.
//
// Purpose: lock in the current visual output of `highlightPrompt()` as a
// baseline, so that any future refactor (theme extraction to www/base/,
// grammar sharing with other cards, etc.) can be verified byte-identical.
//
// Fixtures below exercise each grammar path in highlight.js:
//   - CDATA / comments
//   - XML/HTML tags with attributes
//   - {{variable}} and {inputRef}
//   - URLs, inline code, strings, numbers
//   - Headings (md #, numbered ALL-CAPS, ALL-CAPS lines, Title:)
//   - Markdown tables (including pipe-delimited → HTML table pass)
//   - Bold, italic, mid-word apostrophes
//   - Bullets, numbered lists
//   - Blockquotes, horizontal rules
//   - Fenced code (short + long-collapsed)
//   - Parenthetical dimming
//
// Usage (from browser console on any page that has the vendor loaded):
//
//   const m = await import('/local/cards/prompt-manager/modules/highlight.snapshot.js');
//   await m.captureSnapshots();   // prints a JSON blob — paste into highlight.snapshot.baseline.json
//   await m.compareSnapshots();   // fetches baseline, diffs, logs pass/fail per fixture
//
// Baseline file: /local/cards/prompt-manager/modules/highlight.snapshot.baseline.json
// Created manually from captureSnapshots() output. Kept in git so the refactor
// can be verified against a frozen reference on any machine.

import { initHighlighter, highlightPrompt } from '/local/cards/prompt-manager/modules/highlight.js';

/* ── Fixtures ──────────────────────────────────────────────────────────── */
/* Each fixture is { name, text, inputNames? } where inputNames is the Set
   of declared <inputs> names (used for {inputRef} highlighting). Keep
   fixtures small and targeted — each one should exercise a specific path. */

export const FIXTURES = [
  {
    name: 'simple-prose',
    text: `This is a simple paragraph. It's got an apostrophe, a number like 42, and a percentage 75%. Nothing else.`,
  },
  {
    name: 'headings',
    text: `# Top level heading
## Second level
### Third level

1. NUMBERED ALL CAPS HEADING
2) ANOTHER ONE

ALL CAPS LINE

Short Title:
A longer capitalised label ending with a colon:`,
  },
  {
    name: 'tags-and-variables',
    text: `<role>You are a helpful assistant.</role>
<context source="live">
  Current state: {{systemState}}
  Mode: {{mode?:default mode description}}
</context>
<!-- this is a comment -->
<![CDATA[ raw content ]]>`,
  },
  {
    name: 'strings-urls-code',
    text: `Visit https://example.com/path?x=1 for more.
The code \`const x = 42\` is valid.
A "double quoted string" and a 'single quoted string' both appear.`,
  },
  {
    name: 'markdown-table',
    text: `Some intro prose.

| Column A | Column B | Column C |
| :------- | :------: | -------: |
| alpha    | beta     | gamma    |
| one      | two      | three    |

Trailing prose.`,
  },
  {
    name: 'blockquote-hr-lists',
    text: `> This is a blockquote line.
> With a second line.

---

- Bullet one
- Bullet two
  - Nested
* Star bullet

1. First
2. Second
3) Third with paren`,
  },
  {
    name: 'bold-italic-parens',
    text: `This has **bold text** and *italic text* inline.
Also **bold with *nested italic* inside** maybe.
A parenthetical (which should dim) appears here.
And file*name with mid-word asterisks should not italic.`,
  },
  {
    name: 'fence-short',
    text: `Before code.

\`\`\`yaml
key: value
list:
  - a
  - b
\`\`\`

After code.`,
  },
  {
    name: 'fence-long-collapses',
    text: `Long block should collapse (>5 lines of code):

\`\`\`python
def one(): pass
def two(): pass
def three(): pass
def four(): pass
def five(): pass
def six(): pass
def seven(): pass
\`\`\`

End.`,
  },
  {
    name: 'input-refs',
    text: `Uses {skillName} and {taskGoal} as input refs.
Also {{templateVar}} which is different.
And {notAnInput} which shouldn't match.`,
    inputNames: new Set(['skillName', 'taskGoal']),
  },
];

/* ── Capture / compare ────────────────────────────────────────────────── */

async function _renderAll() {
  await initHighlighter();
  const out = {};
  for (const f of FIXTURES) {
    out[f.name] = highlightPrompt(f.text, f.inputNames);
  }
  return out;
}

/**
 * Render every fixture and log a JSON blob to the console.
 * Paste the blob into highlight.snapshot.baseline.json.
 * Also copies to clipboard if possible.
 */
export async function captureSnapshots() {
  const snapshots = await _renderAll();
  const payload = {
    generatedAt: new Date().toISOString(),
    fixtureCount: FIXTURES.length,
    snapshots,
  };
  const json = JSON.stringify(payload, null, 2);
  console.log('=== highlight snapshot capture ===');
  console.log(`Fixtures: ${FIXTURES.length}`);
  console.log('Paste the JSON below into highlight.snapshot.baseline.json:');
  console.log(json);
  try {
    await navigator.clipboard.writeText(json);
    console.log('(Also copied to clipboard.)');
  } catch {
    console.log('(Clipboard copy failed — copy the JSON above manually.)');
  }
  return payload;
}

/**
 * Fetch the stored baseline, render current fixtures, and diff.
 * Logs pass/fail per fixture. Returns { passed, failed } counts.
 */
export async function compareSnapshots() {
  let baseline;
  try {
    const res = await fetch('/local/cards/prompt-manager/modules/highlight.snapshot.baseline.json?t=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    baseline = await res.json();
  } catch (err) {
    console.error('Could not load baseline:', err.message);
    console.error('Run captureSnapshots() first and save the output.');
    return { passed: 0, failed: FIXTURES.length };
  }

  const current = await _renderAll();
  let passed = 0, failed = 0;
  const failures = [];

  for (const f of FIXTURES) {
    const want = baseline.snapshots?.[f.name];
    const got = current[f.name];
    if (want === undefined) {
      console.log(`? ${f.name} — no baseline (fixture added since capture)`);
      failed++;
      failures.push({ name: f.name, reason: 'missing baseline' });
    } else if (want === got) {
      console.log(`✓ ${f.name}`);
      passed++;
    } else {
      console.log(`✗ ${f.name} — DIFF`);
      console.log('  baseline:', want);
      console.log('  current :', got);
      failed++;
      failures.push({ name: f.name, reason: 'diff', baseline: want, current: got });
    }
  }

  // Check for baseline fixtures missing from current run (renamed/removed)
  for (const name of Object.keys(baseline.snapshots || {})) {
    if (!FIXTURES.find(f => f.name === name)) {
      console.log(`? ${name} — fixture removed since capture`);
      failed++;
      failures.push({ name, reason: 'fixture removed' });
    }
  }

  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  return { passed, failed, failures };
}

/* ── Convenience ───────────────────────────────────────────────────────── */

/** Render a single fixture by name and return its HTML. Useful for eyeballing. */
export async function renderFixture(name) {
  await initHighlighter();
  const f = FIXTURES.find(x => x.name === name);
  if (!f) throw new Error(`No fixture named "${name}"`);
  return highlightPrompt(f.text, f.inputNames);
}
