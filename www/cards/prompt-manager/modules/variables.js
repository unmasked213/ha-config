// | START: variables.js
// |  PATH: www/cards/prompt-manager/modules/variables.js
// InputsInferred: []
// Pure functions for template variable extraction and substitution.
// No HA or DOM dependencies — safe to call from any context.
// Self-contained.
/**
 * Extract template variables from prompt content.
 * Returns array of { name, description, required }.
 */
export function extractVariables(content) {
  if (!content) return [];
  // Match {{name}}, {{name?}}, {{name: desc}}, {{name?: desc}}
  const regex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)(\?)?(?::\s*([^}]*))?\}\}/g;
  const seen = new Set();
  const variables = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1];
    const optional = !!match[2];
    const description = match[3]?.trim() || '';
    if (!seen.has(name)) {
      seen.add(name);
      variables.push({ name, description, required: !optional });
    }
  }
  return variables;
}

/**
 * Substitute variable values into prompt content.
 * Handles multiline wrapping and XML context detection.
 *
 * @param {string} content - The prompt content with {{variable}} placeholders
 * @param {Object} values - Map of variable name to input value
 * @param {Array} variables - Array of variable objects from extractVariables
 * @param {boolean} [skipFenceWrap=false] - When true, skip auto-wrapping multiline
 *   values in triple backticks. Callers set this when the final copy output will
 *   be wrapped in an outer fence (Reference category or dev mode), preventing
 *   nested fences. See events.js fill-copy handler for the call site.
 * @returns {string} Content with variables substituted
 */
export function substituteVariables(content, values, variables, skipFenceWrap = false) {
  // Check if variable at position is inside an XML tag context
  const isInsideXmlTag = (text, varMatch) => {
    // Get text from start of current or previous line to the variable
    const beforeVar = text.substring(0, varMatch.index);
    const lines = beforeVar.split('\n');
    // Check current line and previous line (if exists)
    const relevantText = lines.slice(-2).join('\n');
    // Look for unclosed XML open tag: <tagName> not followed by </tagName> or another >
    const openTagMatch = relevantText.match(/<([a-zA-Z_][\w-]*)[^>]*>\s*$/);
    return !!openTagMatch;
  };

  let filledContent = content;
  for (const v of variables) {
    const varName = v.name;
    let value = (values[varName] !== undefined && values[varName] !== '') ? values[varName] : `{{${varName}}}`;
    // Wrap multiline values in triple backticks (if not already wrapped)
    // Skip wrapping if variable is inside an XML tag
    const trimmed = value.trim();
    const isMultiline = trimmed.includes('\n');
    const alreadyWrapped = trimmed.startsWith('```') && trimmed.endsWith('```');
    // Check if this variable appears in XML context in current content
    const varPattern = new RegExp(`\\{\\{${varName}\\??(?::[^}]*)?\\}\\}`);
    const varMatch = filledContent.match(varPattern);
    const inXmlContext = varMatch && isInsideXmlTag(filledContent, varMatch);
    if (isMultiline && !alreadyWrapped && !inXmlContext && !skipFenceWrap) {
      value = '```\n' + trimmed + '\n```';
    }
    // Replace {{var}}, {{var?}}, {{var: desc}}, {{var?: desc}} patterns
    filledContent = filledContent.replace(
      new RegExp(`\\{\\{${varName}\\??(?::[^}]*)?\\}\\}`, 'g'),
      value
    );
  }
  return filledContent;
}
// |   END: variables.js
