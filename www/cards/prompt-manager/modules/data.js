import { CATEGORIES } from './constants.js';

export function migratePrompt(p) {
  // Already migrated — has categories array. Only fill missing fields.
  if (Array.isArray(p.categories)) {
    return {
      ...p,
      promptId: p.promptId || null,
      inputs: p.inputs || [],
      version: p.version || (p.versions?.length ? p.versions.length + 1 : 1),
    };
  }

  // Migrate from old single category string, or auto-assign from title prefix
  let cats;
  if (p.category && CATEGORIES.includes(p.category)) {
    cats = [p.category];
  } else if (p.category) {
    console.warn(`migratePrompt: unknown category "${p.category}" on prompt "${p.title || p.id}" — defaulting to title-prefix match`);
  }
  if (!cats) {
    let cat = 'Uncategorized';
    const title = (p.title || '').trim();
    if (title.startsWith('Audit:')) cat = 'Analyse';
    else if (title.startsWith('Edit:')) cat = 'Edit';
    else if (title.startsWith('Create:') || title.startsWith('Create/Edit:')) cat = 'Create';
    else if (title.startsWith('Image:')) cat = 'Image';
    cats = [cat];
  }

  // Extract promptId from content body
  let promptId = null;
  let content = p.content || '';
  const promptIdMatch = content.match(/^Prompt ID:\s*(.+)$/m);
  if (promptIdMatch) {
    promptId = promptIdMatch[1].trim();
    content = content.replace(/^Prompt ID:\s*.+\n?/m, '').trim();
  }

  const { tags, category, ...rest } = p;
  return {
    ...rest,
    content,
    categories: cats,
    promptId,
    inputs: [],
    version: p.version || (p.versions?.length ? p.versions.length + 1 : 1)
  };
}

export function getDefaultPrompts() {
  return [
    {
      id: 1,
      title: "Meeting Minutes",
      content:
        "Generate clear and final minutes for a generic professional meeting, intended as the authoritative record for the attending group. Using the provided transcript and any accompanying documents as primary sources, craft a polished narrative that functions as both an immediate account and a lasting reference for decisions and actions.\n\nStructure and Narrative Flow\n• Follow the agenda items sequentially as set out in the meeting materials.\n• For each agenda item, maintain its exact title as a heading.\n• Develop a smooth narrative within each agenda item that captures the substance of discussions without transcribing conversation fragments.",
      categories: ["Create"],
      promptId: null,
      inputs: [],
      lastUsed: new Date("2024-01-15"),
      useCount: 23,
      created: new Date("2024-01-10"),
      score: null,
    },
    {
      id: 2,
      title: "Create: Home Assistant Dashboard Component",
      content:
        "Create a Home Assistant Lovelace custom card component that follows zero-UI design principles. The component should:\\n\\n1. Use minimal visual elements - no unnecessary borders, shadows, or decorative elements\\n2. Display information directly without explanatory text\\n3. Implement sophisticated functionality beneath a clean interface\\n4. Use functional color coding rather than aesthetic choices\\n5. Include error handling and graceful degradation\\n\\nThe card should be built as a custom element with Shadow DOM encapsulation.",
      categories: ["Create"],
      promptId: null,
      inputs: [],
      lastUsed: new Date("2024-01-14"),
      useCount: 12,
      created: new Date("2024-01-05"),
      score: null,
    },
    {
      id: 3,
      title: "Create: MPV Lua Script Generator",
      content:
        "Write a Lua script for MPV that enhances video playback functionality. The script should:\\n\\n• Be efficient and follow MPV scripting best practices\\n• Include proper error handling and logging\\n• Use minimal system resources\\n• Provide useful keyboard shortcuts\\n• Work across different video formats\\n\\nEnsure the script integrates seamlessly with existing MPV configuration.",
      categories: ["Create"],
      promptId: null,
      inputs: [],
      lastUsed: new Date("2024-01-13"),
      useCount: 8,
      created: new Date("2024-01-08"),
      score: null,
    },
  ];
}

export function serializePrompts(prompts) {
  return prompts.map((p) => ({
    ...p,
    lastUsed: p.lastUsed?.toISOString() || null,
    created: p.created?.toISOString() || null,
  }));
}

export function loadPromptsFromStorage() {
  try {
    const stored = localStorage.getItem("ai_prompts");
    let prompts = stored ? JSON.parse(stored) : getDefaultPrompts();
    // Migrate prompts to new schema
    return prompts.map(p => migratePrompt(p));
  } catch (error) {
    console.warn("Could not load prompts:", error);
    return [];
  }
}

export function savePromptsToLocalStorage(prompts) {
  try {
    localStorage.setItem("ai_prompts", JSON.stringify(prompts));
  } catch (error) {
    console.warn("Could not save prompts:", error);
  }
}

// Serializes backend writes so concurrent saves don't race.
// Each call waits for the previous one to finish before sending.
let _backendWriteChain = Promise.resolve();

export async function savePromptsToBackend(hass, prompts) {
  const serialized = serializePrompts(prompts);
  _backendWriteChain = _backendWriteChain.then(async () => {
    try {
      if (!hass?.connection) return false;
      await hass.connection.sendMessagePromise({
        type: "prompt_manager/set_prompts",
        prompts: serialized,
      });
      localStorage.removeItem("ai_prompts_unsynced");
      return true;
    } catch (err) {
      console.warn("Backend save failed:", err);
      localStorage.setItem(
        "ai_prompts_unsynced",
        JSON.stringify(serialized)
      );
      return false;
    }
  }).catch(() => false);
  return _backendWriteChain;
}

export function savePrompts(hass, prompts) {
  savePromptsToLocalStorage(prompts);
  return savePromptsToBackend(hass, prompts);
}

export async function fetchPromptsFromBackend(hass) {
  try {
    if (!hass?.connection) return null;
    const resp = await hass.connection.sendMessagePromise({
      type: "prompt_manager/get_prompts",
    });
    if (!resp?.prompts) return null;
    const backendPrompts = resp.prompts.map((p) => migratePrompt({
      ...p,
      lastUsed: p.lastUsed ? new Date(p.lastUsed) : null,
      created: p.created ? new Date(p.created) : null,
    }));
    const localPrompts = JSON.parse(
      localStorage.getItem("ai_prompts") || "[]"
    );
    if (!backendPrompts.length && localPrompts.length) {
      const migrated = localPrompts.map((p) => migratePrompt({
        ...p,
        lastUsed: p.lastUsed ? new Date(p.lastUsed) : null,
        created: p.created ? new Date(p.created) : null,
      }));
      return { prompts: migrated, shouldSeedBackend: true };
    }
    return { prompts: backendPrompts, shouldSeedBackend: false };
  } catch (err) {
    console.warn("Backend fetch failed:", err);
    return null;
  }
}

export async function attemptBackendSync(hass, prompts) {
  if (!hass?.connection) return false;
  const toSync = JSON.parse(
    localStorage.getItem("ai_prompts_unsynced") || "null"
  );
  try {
    await hass.connection.sendMessagePromise({
      type: "prompt_manager/set_prompts",
      prompts: toSync || serializePrompts(prompts),
    });
    localStorage.removeItem("ai_prompts_unsynced");
    return true;
  } catch (e) {
    console.warn("Retry sync failed:", e);
    return false;
  }
}
