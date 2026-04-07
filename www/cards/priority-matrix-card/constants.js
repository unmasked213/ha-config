// /config/www/cards/priority-matrix-card/constants.js
// Criteria definitions and scoring logic — scale 1-3

export const CRITERIA = [
  { key: "time",       label: "Time",       shortLabel: "Time",   direction: "positive",
    tooltip: { title: "Time urgency", body: "How soon does this need doing?\n3 = urgent deadline\n1 = no time pressure" } },
  { key: "function",   label: "Function",   shortLabel: "Func",   direction: "positive",
    tooltip: { title: "Functional importance", body: "How important is this for things to work properly?\n3 = critical to operation\n1 = nice-to-have" } },
  { key: "blocking",   label: "Blocking",   shortLabel: "Block",  direction: "positive",
    tooltip: { title: "Blocking value", body: "Does this unblock other tasks?\n3 = several tasks waiting on this\n1 = nothing depends on it" } },
  { key: "impact",     label: "Impact",     shortLabel: "Impact", direction: "positive",
    tooltip: { title: "Impact", body: "How much does the system improve when this is done?\n3 = major improvement\n1 = barely noticeable" } },
  { key: "motivation", label: "Motivation", shortLabel: "Motiv",  direction: "positive",
    tooltip: { title: "Motivation", body: "How likely are you to actually start this?\n3 = genuinely want to do it\n1 = will keep putting it off" } },
  { key: "size",       label: "Size",       shortLabel: "Size",   direction: "inverted",
    tooltip: { title: "Size (inverted)", body: "How big is the effort? This scores inversely — smaller tasks rank higher.\n3 = massive project (lowers score)\n1 = quick win (boosts score)" } },
];

export const DEFAULT_SCORES = Object.fromEntries(CRITERIA.map(c => [c.key, 2]));

export const DEFAULT_WEIGHTS = Object.fromEntries(CRITERIA.map(c => [c.key, 1.0]));

export const SORT_COLUMNS = ["summary", ...CRITERIA.map(c => c.key), "score"];

/**
 * Compute composite score (0-100) for a task.
 * @param {Object} scores - { time, function, blocking, impact, motivation, size } each 1-3
 * @param {Object} weights - { time, function, blocking, impact, motivation, size } each 0-3
 * @returns {number} 0-100
 */
export function computeScore(scores, weights) {
  const positiveKeys = ["time", "function", "blocking", "impact", "motivation"];

  let positiveSum = 0;
  for (const k of positiveKeys) {
    positiveSum += (scores[k] || 2) * (weights[k] ?? 1);
  }

  const adjustedSize = (4 - (scores.size || 2)) * (weights.size ?? 1);

  // Max possible = sum of all criteria at max value (3) * their weight
  let maxPossible = 0;
  for (const k of positiveKeys) {
    maxPossible += 3 * (weights[k] ?? 1);
  }
  maxPossible += 3 * (weights.size ?? 1); // inverted max is also 3 (4-1=3)

  if (maxPossible === 0) return 0;

  return Math.round(((positiveSum + adjustedSize) / maxPossible) * 100);
}

/**
 * Parse a description JSON string into scores object.
 * @param {string|null} desc
 * @returns {Object} scores
 */
export function parseScores(desc) {
  if (!desc) return { ...DEFAULT_SCORES };
  try {
    const parsed = JSON.parse(desc);
    const result = {};
    for (const c of CRITERIA) {
      const v = parseInt(parsed[c.key], 10);
      result[c.key] = (v >= 1 && v <= 3) ? v : 2;
    }
    return result;
  } catch {
    return { ...DEFAULT_SCORES };
  }
}

/**
 * Serialize scores object to JSON string for todo description.
 * @param {Object} scores
 * @returns {string}
 */
export function serializeScores(scores) {
  const obj = {};
  for (const c of CRITERIA) {
    obj[c.key] = scores[c.key] ?? 2;
  }
  return JSON.stringify(obj);
}

/**
 * Get semantic color class for a score value.
 * @param {number} score 0-100
 * @returns {"green"|"amber"|"red"}
 */
export function scoreLevel(score) {
  if (score >= 70) return "green";
  if (score >= 40) return "amber";
  return "red";
}
