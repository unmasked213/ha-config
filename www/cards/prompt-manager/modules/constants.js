const uuid = () => globalThis.crypto?.randomUUID?.() || `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;

/**
 * Tooltip content for modal info icons
 * Uses structured format: title, intro, items (term/desc pairs)
 */
const TOOLTIP_CONTENT = {
  addPrompt: {
    title: 'Adding a Prompt',
    intro: 'Create a reusable prompt template.',
    items: [
      { term: 'Title', desc: 'A short name to identify this prompt.' },
      { term: 'Description', desc: 'Optional. Notes on when or how to use it. Tap ✦ to auto-generate from content.' },
      { term: 'Category', desc: 'Organises the prompt and sets the scoring rubric. The first category determines how it\'s evaluated — Reference prompts are not scored.' },
      { term: 'Content', desc: 'The prompt text. Tap ✒︎ to refine it with AI.' },
      { term: 'Variables', desc: '{{name}} in content creates fill-in fields when copying.' }
    ]
  },
  editPrompt: {
    title: 'Editing a Prompt',
    intro: 'Edits are versioned automatically.',
    items: [
      { term: 'Version history', desc: 'A snapshot is saved on each content edit, restorable via History.' },
      { term: 'Quality score', desc: 'Re-scored on save using the first category\'s rubric. Changing category may shift the score. Reference prompts are not scored.' },
      { term: 'Multiple categories', desc: 'Only the first category affects scoring — the rest are for filtering.' }
    ]
  },
  allPrompts: {
    title: 'Prompt Library',
    intro: 'All saved prompts in a sortable table.',
    items: [
      { term: 'Columns', desc: 'Toggle visibility using the checkboxes above.' },
      { term: 'Sorting', desc: 'Click a header to sort; click again to reverse.' },
      { term: 'Copy', desc: 'Exports the table as formatted text.' }
    ]
  },
  variables: {
    title: 'Template Variables',
    intro: 'Create reusable prompts with fill-in placeholders.',
    items: [
      { term: 'Syntax', desc: '{{name}} or {{name: description}} anywhere in content.' },
      { term: 'Descriptions', desc: 'Label each variable so the fill-in form is self-explanatory.' },
      { term: 'Auto-generate', desc: 'Tap ✦ to have AI suggest descriptions from your prompt.' },
      { term: 'On copy', desc: 'A form appears to fill values before the prompt is copied.' }
    ]
  },
  versionHistory: {
    title: 'Version History',
    intro: 'Snapshots saved automatically on each content edit (up to 10).',
    items: [
      { term: 'Restore', desc: 'Loads the version into the content field — review before saving.' },
      { term: 'Optimize', desc: 'Accepting an optimized prompt also creates a snapshot.' }
    ]
  },
  fillPrompt: {
    title: 'Fill-in Variables',
    intro: 'Enter values for this prompt\'s placeholders before copying.',
    items: [
      { term: 'Required *', desc: 'Must be filled before copying.' },
      { term: 'Optional', desc: 'Left empty? The placeholder is kept as-is in the copied text.' },
      { term: 'Multiline', desc: 'Multi-line values are wrapped in code fences unless inside an XML tag.' }
    ]
  },
  optimizeModal: {
    title: 'Compare & Accept',
    intro: 'Review the AI-optimized version side by side with your original before deciding.',
    items: [
      { term: 'Before / After', desc: 'Scroll each panel independently to compare changes. Copy either version with the clipboard icon.' },
      { term: 'Scores', desc: 'Both versions are rated on the same rubric — check the delta to see if the rewrite actually improved.' },
      { term: 'Use Optimized', desc: 'Replaces your prompt content and saves the original as a version snapshot you can restore later.' },
      { term: 'Keep Original', desc: 'Discards the suggestion — nothing is changed.' }
    ]
  },
  cardHeader: {
    title: 'Prompt Manager',
    intro: 'Your prompt library, scored and grouped into tiers.',
    items: [
      { term: 'Tiers', desc: 'A–D ranking by quality score, using a rubric matched to the prompt\'s first category. Unscored prompts sit in their own group.' },
      { term: 'Categories', desc: 'Filter via the tags below the search bar. The first category sets the scoring rubric — Reference is always unscored.' },
      { term: 'Copying', desc: 'Click a prompt to view it, then copy to clipboard. Variables prompt for values first.' },
      { term: 'Optimization', desc: 'Improve a prompt with AI and compare before/after side by side.' }
    ]
  }
};

const CATEGORY_META = {
  'Analyse': {
    headerTitle: 'Analysis Prompts',
    tooltip: {
      title: 'Analysis Prompts',
      intro: 'Break down, examine, and evaluate information.',
      items: [
        { term: 'Best for', desc: 'Code reviews, system audits, competitive analysis, data interpretation.' }
      ]
    }
  },
  'Edit': {
    headerTitle: 'Editing Prompts',
    tooltip: {
      title: 'Editing Prompts',
      intro: 'Refine, restructure, and improve existing content.',
      items: [
        { term: 'Best for', desc: 'Copy editing, code refactoring, tone adjustments, clarity improvements.' }
      ]
    }
  },
  'Create': {
    headerTitle: 'Creation Prompts',
    tooltip: {
      title: 'Creation Prompts',
      intro: 'Generate new content from scratch.',
      items: [
        { term: 'Best for', desc: 'Drafting articles, generating boilerplate, writing scripts, brainstorming.' }
      ]
    }
  },
  'Image': {
    headerTitle: 'Image Prompts',
    tooltip: {
      title: 'Image Prompts',
      intro: 'Generate, describe, or direct visual content.',
      items: [
        { term: 'Best for', desc: 'AI image generation, visual descriptions, design briefs.' }
      ]
    }
  },
  'Reference': {
    headerTitle: 'Reference Prompts',
    tooltip: {
      title: 'Reference Prompts',
      intro: 'Look up facts, definitions, and established knowledge.',
      items: [
        { term: 'Best for', desc: 'Documentation lookups, API references, concept explanations, factual Q&A.' },
        { term: 'Not scored', desc: 'Lookup material rather than instructions — rubric scoring doesn\'t apply.' }
      ]
    }
  },
  'Research': {
    headerTitle: 'Research Prompts',
    tooltip: {
      title: 'Research Prompts',
      intro: 'Investigate topics and synthesise findings.',
      items: [
        { term: 'Best for', desc: 'Literature reviews, technology evaluations, market research, multi-source synthesis.' }
      ]
    }
  },
  'Configure': {
    headerTitle: 'Configuration Prompts',
    tooltip: {
      title: 'Configuration Prompts',
      intro: 'Set up, configure, and troubleshoot systems.',
      items: [
        { term: 'Best for', desc: 'Server setup, CI/CD pipelines, environment configs, deployment scripts.' }
      ]
    }
  },
  'Uncategorized': {
    headerTitle: 'Uncategorized Prompts',
    tooltip: {
      title: 'Uncategorized Prompts',
      intro: 'No category assigned yet.',
      items: [
        { term: 'Tip', desc: 'Add a category when editing — the first one set determines the scoring rubric.' }
      ]
    }
  }
};

const CATEGORIES = ['Analyse', 'Edit', 'Create', 'Image', 'Reference', 'Research', 'Configure', 'Uncategorized'];

export { uuid, TOOLTIP_CONTENT, CATEGORY_META, CATEGORIES };
