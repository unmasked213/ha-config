export const SCOPE_DIRECTIVES = {
  'General mode': `
    Apply no extra policy. Fix structural gaps only. Write instructions to the assistant
    (imperative voice). Do not add style cues or verbosity.
  `,

  'Answer directly': `
    Integrate this as structure (not a pasted line):
    - Guardrails:
      • Stay strictly on the primary task. Do not broaden scope or introduce related topics.
      • Do not propose alternatives, extra tools, or next steps unless explicitly requested.
    - Output:
      • Begin with the direct result in the required format ("Answer:" or the specified schema).
      • Include explanation only if explicitly requested by the task; otherwise omit it.
    - Ambiguity handling:
      • Do not ask clarification questions in this mode.
      • If the request is ambiguous but answerable, choose one reasonable interpretation and
        include a single line "Assumption: …" before the answer.
    If equivalent constraints already exist, do not duplicate them.
    If the prompt lacks sections, add minimal "Guardrails" and adjust "Output Format" accordingly.
  `,

  'Clarify first': `
    Treat this as a safety-critical task and add a careful workflow:
    - Steps:
      0) Pre-flight: list required inputs and acceptance checks.
      1) If any required input is missing or ambiguous, ask exactly one concise clarifying
        question and stop. Do not proceed until answered.
      2) Execute the task per the defined steps once clarified.
      3) Verify against acceptance checks; if any check fails, report failure and stop
        rather than guessing.
    - Guardrails:
      • No unstated assumptions; do not infer facts that are not provided.
      • Prefer deferral over speculation: "Cannot proceed safely: [what's missing]".
    - Output:
      • Final result plus a short "Checks passed:" line referencing the acceptance checks.
    Keep language operational and minimal; do not add tone or boilerplate.
    If the prompt has no structure, add minimal "Steps", "Guardrails", and "Acceptance/Checks".
  `,

  'Concise but complete': `
    Optimise for token/length limits without losing mandatory content:
    - Output Format:
      • Use compact structures (bullets, tables, or tight JSON) over prose.
      • Eliminate preambles, restatements, and boilerplate.
      • Prefer key facts, lists, schemas, or code over narrative.
      • Default caps: lists ≤5 items unless the task specifies otherwise.
    - Guardrails:
      • If shortening risks loss of required detail, do not shorten that part.
      • No meta commentary, no chain-of-thought, no rationale unless explicitly required.
    - Budget awareness:
      • If a numeric budget is provided in the prompt, honour it; otherwise apply the compact
        formatting rules above.
    If the prompt lacks an Output section, add one expressing these constraints.
  `,

  'Total rebuild': `
    Replace the source prompt with a complete, clean specification while preserving the
    original intent and constraints. Do not keep legacy structure if it impedes clarity.
    Required sections (rename only if the task mandates different names):
      • Task & Objective (single, unambiguous goal)
      • Scope (in/out)
      • Inputs (required fields) + Missing-input handling (ask one question or defined fallback)
      • Output Format (testable schema/fields/acceptance checks)
      • Steps (ordered, minimal)
      • Guardrails (no guessing, no unstated assumptions)
      • Verification (checks to confirm correctness/safety)
    Keep the spec as short as possible while fully enforceable; remove redundancy and
    subjective phrasing. Do not invent new capabilities or scope.
  `
};

export function getQualityTier(score) {
  const numericScore =
    score != null && !isNaN(parseFloat(score))
      ? parseFloat(score)
      : null;
  if (numericScore === null)
    return {
      numericScore: null,
      tierLetter: "Unscored",
      tierColor: "var(--ui-text-mute)",
      tierColorFaint: "var(--ui-state-hover)",
      descriptor: "Unscored",
      rank: 99,
    };
  if (numericScore >= 9.0)
    return {
      numericScore,
      tierLetter: "A",
      tierColor: "var(--ui-tier-a)",
      tierColorFaint: "var(--ui-tier-a-faint)",
      descriptor: "Best",
      rank: 1,
    };
  if (numericScore >= 8.0)
    return {
      numericScore,
      tierLetter: "B",
      tierColor: "var(--ui-tier-b)",
      tierColorFaint: "var(--ui-tier-b-faint)",
      descriptor: "Excellent",
      rank: 2,
    };
  if (numericScore >= 6.5)
    return {
      numericScore,
      tierLetter: "C",
      tierColor: "var(--ui-tier-c)",
      tierColorFaint: "var(--ui-tier-c-faint)",
      descriptor: "Good",
      rank: 3,
    };
  return {
    numericScore,
    tierLetter: "D",
    tierColor: "var(--ui-tier-d)",
    tierColorFaint: "var(--ui-tier-d-faint)",
    descriptor: "Poor",
    rank: 4,
  };
}

export function pollForResult(checkFn, timeoutMs = 4000, intervalMs = 300) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      try {
        const val = checkFn();
        if (val != null) return resolve(val);
      } catch {}
      if (Date.now() - start >= timeoutMs) return resolve(null);
      setTimeout(poll, intervalMs);
    };
    poll();
  });
}

export async function scorePrompt(hass, content, category) {
  if (!hass) return null;
  // Snapshot last_triggered before the call so the poll can detect a fresh result.
  // Script entity attributes don't expose script variables, so we use the
  // timestamp as a staleness guard instead of correlating by request ID.
  const preTrigger = hass.states?.["script.score_prompt"]?.attributes?.last_triggered;
  let score = null;
  try {
    const serviceData = { content };
    if (category) serviceData.category = category;
    const res = await hass.callService(
      "script",
      "score_prompt",
      serviceData,
      {},
      true,
      true
    );
    const sVal = (res?.response ?? res)?.score;
    if (sVal != null) {
      const parsed = parseFloat(String(sVal).trim());
      if (!isNaN(parsed)) score = Math.min(10, Math.max(1, parsed));
    }
  } catch (err) {
    console.warn('Prompt scoring service call failed:', err);
  }
  if (score === null) {
    score = await pollForResult(() => {
      const st = hass.states?.["script.score_prompt"];
      if (!st?.attributes) return null;
      if (st.attributes.last_triggered === preTrigger) return null;
      let aiRes = st.attributes.ai_result;
      if (!aiRes) return null;
      if (aiRes.data?.score !== undefined && aiRes.score === undefined)
        aiRes = aiRes.data;
      const rawScore = aiRes.score;
      if (rawScore == null) return null;
      const parsed = parseFloat(String(rawScore).trim());
      return isNaN(parsed)
        ? null
        : Math.min(10, Math.max(1, parsed));
    });
  }
  return score;
}

export async function optimizePrompt(hass, prompt, scopeDirective) {
  if (!hass) return null;
  const preTrigger = hass.states?.["script.optimize_prompt"]?.attributes?.last_triggered;

  let result = null;
  try {
    const res = await hass.callService(
      "script",
      "optimize_prompt",
      {
        content: prompt.content,
        current_score: prompt.score || 5.0,
        scope_directives: scopeDirective || ''
      },
      {},
      true,
      true
    );
    result =
      res?.response?.result ?? res?.result ?? res?.response ?? res;
  } catch (err) {
    console.warn('Prompt optimization service call failed:', err);
  }
  if (!result) {
    const raw = await pollForResult(() => {
      const st = hass.states?.["script.optimize_prompt"];
      if (!st?.attributes) return null;
      if (st.attributes.last_triggered === preTrigger) return null;
      let aiRes = st.attributes.result || st.attributes.ai_result;
      if (!aiRes) return null;
      if (
        aiRes.data &&
        !aiRes.originalScore &&
        !aiRes.original_score
      )
        aiRes = aiRes.data;
      return aiRes;
    });
    if (raw) result = raw;
  }
  if (!result) return null;
  const originalScore = parseFloat(
    result.originalScore || result.original_score
  );
  const optimizedScore = parseFloat(
    result.optimizedScore || result.optimized_score
  );
  return {
    originalScore: !isNaN(originalScore)
      ? originalScore
      : prompt.score ?? null,
    optimizedScore: !isNaN(optimizedScore)
      ? optimizedScore
      : null,
    optimizedPrompt:
      result.optimizedPrompt ||
      result.optimized_prompt ||
      result.optimized ||
      prompt.content,
    improvements: result.improvements || result.changes || [],
  };
}

export function calculateMovement(oldScore, newScore) {
  const oldTier = getQualityTier(oldScore);
  const newTier = getQualityTier(newScore);
  if (oldTier.rank !== newTier.rank) {
    return {
      direction:
        newTier.rank < oldTier.rank ? "up" : "down",
      timestamp: Date.now(),
      tierLetter: newTier.tierLetter,
    };
  }
  return null;
}
