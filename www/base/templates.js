// /config/www/base/templates.js

/* ========================================================================
 *  TEMPLATES — HOME ASSISTANT TEMPLATE PARSING
 * ========================================================================
 *
 *  Jinja2-style template parsing for custom cards. Supports entity state
 *  access, filter chains, math expressions, conditionals, and shorthand syntax.
 *
 *  SYNTAX:
 *    {{ states['entity_id'].state }}
 *    {{ states['entity_id'].attributes.attr_name }}
 *    {{ states['entity_id'].attributes.forecast[0].temperature }}
 *    {{ states['entity_id'].state | filter1 | filter2('arg') }}
 *    {{ states['entity_id'].state | divide(states['other_entity'].state) }}
 *    {{ (states['sensor.a'].state / states['sensor.b'].state) * 100 | round(0) }}
 *    {{ attr('entity_id', 'attribute_name') }}
 *    {{ iif(condition, if_true, if_false) }}
 *    {{ states['sensor.x'].state ~ ':suffix' }}  (string concatenation)
 *
 *  IIF CONDITIONALS:
 *    {{ iif(states['sensor.x'].state | float(0) > 0, 'Yes', 'No') }}
 *    {{ iif((a / b * 100) > 50, 'High', 'Low') | append('%') }}
 *
 *  USAGE:
 *    import { parseTemplate } from '/local/base/templates.js';
 *    const result = parseTemplate("{{ states['sensor.temp'].state }}°C", hass);
 *
 * ======================================================================== */

import { getRelativeTime, formatDuration } from '/local/base/utilities.js';


// -----------------------------------------------------------------------
// MAIN ENTRY POINT
// -----------------------------------------------------------------------

/**
 * Parse a template string containing {{ }} expressions
 * @param {string} template - Template string with {{ }} placeholders
 * @param {Object} hass - Home Assistant object
 * @returns {string} - Processed string with values substituted
 */
export function parseTemplate(template, hass) {
  if (!template || typeof template !== 'string') return template;
  if (!template.includes('{{')) return template;

  // Check if template is a single expression (may return object for colored values)
  const singleExprMatch = template.match(/^\s*\{\{\s*([\s\S]+?)\s*\}\}\s*$/);
  if (singleExprMatch) {
    try {
      const result = evaluateExpression(singleExprMatch[1], hass);
      // Return object directly if it's a colored value object
      if (result && typeof result === 'object') return result;
      return result;
    } catch (e) {
      console.error('Template parse error:', e, 'Expression:', singleExprMatch[1]);
      return 'Unknown';
    }
  }

  // Multiple expressions or mixed content - must stringify
  return template.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, (match, expression) => {
    try {
      const result = evaluateExpression(expression, hass);
      // Convert objects to their text representation for mixed templates
      if (result && typeof result === 'object' && result.text !== undefined) {
        return result.text;
      }
      return result;
    } catch (e) {
      console.error('Template parse error:', e, 'Expression:', expression);
      return 'Unknown';
    }
  });
}


// -----------------------------------------------------------------------
// EXPRESSION EVALUATION
// -----------------------------------------------------------------------

/**
 * Evaluate a complete expression (entity reference, math, or shorthand)
 * @param {string} expression - The expression inside {{ }}
 * @param {Object} hass - Home Assistant object
 * @returns {string} - Evaluated result
 */
function evaluateExpression(expression, hass) {
  // FIRST: Check for ~ concatenation operator at the top level (before filter splitting)
  // This handles cases like: states['x'].state | round(0) ~ ' suffix'
  // where ~ has lower precedence than filters
  const concatParts = splitByConcatOperator(expression);
  if (concatParts.length > 1) {
    // Evaluate each part (which may contain filters) and concatenate the results
    const evaluatedParts = concatParts.map(part => {
      const result = evaluateExpression(part.trim(), hass);
      // Handle objects with text property (like colored values)
      if (result && typeof result === 'object' && result.text !== undefined) {
        return result.text;
      }
      return result;
    });
    const value = evaluatedParts.join('');

    // Preserve objects (e.g., from range_to_label with color), only stringify primitives
    if (value === undefined || value === null) return 'Unknown';
    if (typeof value === 'object') return value;
    return value.toString();
  }

  // Split expression and filters
  let { baseExpr: rawBaseExpr, filterChain } = splitExpressionAndFilters(expression);

  // Strip outer parentheses from base expression to handle wrapped expressions
  // e.g., ((a / b) * 100) or (iif(...))
  let baseExpr = stripOuterParens(rawBaseExpr);

  // If we stripped parens and there was no filter chain found, re-check for filters
  // This handles cases like: (states['x'].state | float | round(1))
  // where the filter chain is inside the parens
  if (!filterChain && baseExpr !== rawBaseExpr) {
    const reParsed = splitExpressionAndFilters(baseExpr);
    baseExpr = stripOuterParens(reParsed.baseExpr);
    filterChain = reParsed.filterChain;
  }

  let value;
  let sourceEntityId = null;

  // Check for iif() function first: iif(condition, if_true, if_false)
  const iifMatch = baseExpr.match(/^iif\s*\(([\s\S]+)\)$/);
  if (iifMatch) {
    value = evaluateIif(iifMatch[1], hass);
    // Apply any filters after iif() result
    if (filterChain && value !== 'Unknown') {
      value = applyFilters(value, filterChain, hass, null);
    }
    // Preserve objects (e.g., from range_to_label with color), only stringify primitives
    if (value === undefined || value === null) return 'Unknown';
    if (typeof value === 'object') return value;
    return value.toString();
  }

  // Check for attr() shorthand: attr('entity_id', 'attribute')
  const attrMatch = baseExpr.match(/^attr\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)$/);
  if (attrMatch) {
    const entityId = attrMatch[1];
    const attrName = attrMatch[2];
    sourceEntityId = entityId;
    const entity = hass?.states?.[entityId];
    if (!entity) return 'Unknown';
    value = getNestedValue(entity.attributes, attrName);
    if (value === undefined) return 'Unknown';
  }
  // Check for state() shorthand: state('entity_id')
  else if (/^state\(\s*['"]([^'"]+)['"]\s*\)$/.test(baseExpr)) {
    const stateMatch = baseExpr.match(/^state\(\s*['"]([^'"]+)['"]\s*\)$/);
    const entityId = stateMatch[1];
    sourceEntityId = entityId;
    const entity = hass?.states?.[entityId];
    if (!entity) return 'Unknown';
    value = entity.state;
  }
  // Check if this is a math expression (contains operators outside entity refs)
  else if (isMathExpression(baseExpr)) {
    value = evaluateMathExpression(baseExpr, hass);
    if (value === null || value === undefined || isNaN(value)) return 'Unknown';
  }
  // Standard entity reference: states['entity_id'].state or .attributes.x
  else {
    const entityMatch = baseExpr.match(/states\['([^']+)'\]\.?(.*)?/);
    if (entityMatch) {
      const entityId = entityMatch[1];
      sourceEntityId = entityId;
      const accessor = entityMatch[2] || 'state';
      const entity = hass?.states?.[entityId];
      if (!entity) {
        console.warn('[evaluateExpression] Entity not found:', entityId);
        return 'Unknown';
      }

      value = resolveEntityAccessor(entity, accessor);
      if (value === undefined || value === null) {
        console.warn('[evaluateExpression] Accessor returned undefined/null:', entityId, accessor);
        return 'Unknown';
      }
    }
    // Handle literal values (numbers, quoted strings)
    else if (/^-?\d+(\.\d+)?$/.test(baseExpr)) {
      value = baseExpr;
    }
    else if (/^['"].*['"]$/.test(baseExpr)) {
      value = baseExpr.slice(1, -1);
    }
    else {
      return 'Unknown';
    }
  }

  // Apply filter chain if present
  if (filterChain) {
    value = applyFilters(value, filterChain, hass, sourceEntityId);
  }

  // Preserve objects (e.g., from range_to_label with color), only stringify primitives
  if (value === undefined || value === null) return 'Unknown';
  if (typeof value === 'object') return value;
  return value.toString();
}


// -----------------------------------------------------------------------
// IIF FUNCTION SUPPORT
// -----------------------------------------------------------------------

/**
 * Parse iif() function arguments, handling nested parens/quotes/brackets
 * @param {string} argsStr - The content inside iif(...)
 * @returns {string[]} - Array of arguments [condition, if_true, if_false]
 */
function parseIifArgs(argsStr) {
  const args = [];
  let current = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];

    if ((char === '"' || char === "'") && argsStr[i - 1] !== '\\') {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
      current += char;
    } else if (!inQuote) {
      if (char === '(') {
        parenDepth++;
        current += char;
      } else if (char === ')') {
        parenDepth--;
        current += char;
      } else if (char === '[') {
        bracketDepth++;
        current += char;
      } else if (char === ']') {
        bracketDepth--;
        current += char;
      } else if (char === ',' && parenDepth === 0 && bracketDepth === 0) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}


/**
 * Strip outer parentheses from an expression if they wrap the entire thing
 * Recursive: handles ((expr)) -> expr
 * @param {string} expr - Expression to process
 * @returns {string} - Expression with outer parens removed if applicable
 */
function stripOuterParens(expr) {
  expr = expr.trim();
  if (!expr.startsWith('(') || !expr.endsWith(')')) return expr;

  // Check if the opening and closing parens are matching
  let depth = 0;
  for (let i = 0; i < expr.length - 1; i++) {
    if (expr[i] === '(') depth++;
    else if (expr[i] === ')') depth--;
    if (depth === 0) return expr; // Parens close before end, not wrapping
  }

  // The parens wrap the entire expression - strip and recurse
  return stripOuterParens(expr.slice(1, -1).trim());
}


/**
 * Evaluate a boolean condition expression
 * Handles comparisons (>, <, >=, <=, ==, !=) and truthy checks
 * @param {string} conditionExpr - The condition to evaluate
 * @param {Object} hass - Home Assistant object
 * @returns {boolean} - Result of condition evaluation
 */
function evaluateCondition(conditionExpr, hass) {
  conditionExpr = conditionExpr.trim();

  // Check for comparison operators (order matters: >= before >, etc.)
  const comparisonMatch = conditionExpr.match(/^(.+?)\s*(>=|<=|==|!=|>|<)\s*(.+)$/);

  if (comparisonMatch) {
    let leftExpr = comparisonMatch[1].trim();
    const operator = comparisonMatch[2];
    let rightExpr = comparisonMatch[3].trim();

    // Strip outer parens before evaluating
    leftExpr = stripOuterParens(leftExpr);
    rightExpr = stripOuterParens(rightExpr);

    // Evaluate both sides
    let leftVal = evaluateExpression(leftExpr, hass);
    let rightVal = evaluateExpression(rightExpr, hass);

    // Handle "Unknown" as evaluation failure
    if (leftVal === 'Unknown' || rightVal === 'Unknown') {
      console.warn('[iif condition] Unknown value - left:', leftExpr, '=', leftVal, ', right:', rightExpr, '=', rightVal);
      return false;
    }

    // Try numeric comparison first
    const leftNum = parseFloat(leftVal);
    const rightNum = parseFloat(rightVal);

    if (!isNaN(leftNum) && !isNaN(rightNum)) {
      switch (operator) {
        case '>': return leftNum > rightNum;
        case '<': return leftNum < rightNum;
        case '>=': return leftNum >= rightNum;
        case '<=': return leftNum <= rightNum;
        case '==': return leftNum === rightNum;
        case '!=': return leftNum !== rightNum;
      }
    }

    // String comparison fallback
    switch (operator) {
      case '==': return String(leftVal) === String(rightVal);
      case '!=': return String(leftVal) !== String(rightVal);
      case '>': return String(leftVal) > String(rightVal);
      case '<': return String(leftVal) < String(rightVal);
      case '>=': return String(leftVal) >= String(rightVal);
      case '<=': return String(leftVal) <= String(rightVal);
    }
  }

  // No comparison operator - evaluate as truthy
  const stripped = stripOuterParens(conditionExpr);
  const val = evaluateExpression(stripped, hass);

  // Check truthiness
  if (val === 'Unknown' || val === null || val === undefined) return false;
  if (val === '' || val === '0' || val === 0 || val === 'false' || val === false) return false;
  return true;
}


/**
 * Evaluate an iif() function call
 * @param {string} iifContent - The content inside iif(...)
 * @param {Object} hass - Home Assistant object
 * @returns {string} - Evaluated result
 */
function evaluateIif(iifContent, hass) {
  const args = parseIifArgs(iifContent);

  if (args.length < 2) {
    console.error('iif() requires at least 2 arguments (condition, if_true)');
    return 'Unknown';
  }

  const condition = args[0];
  const ifTrue = args[1];
  const ifFalse = args.length > 2 ? args[2] : '';

  // Evaluate the condition
  const conditionResult = evaluateCondition(condition, hass);

  // Debug logging for iif evaluation
  console.log('[iif] condition:', condition, '→', conditionResult);
  console.log('[iif] ifTrue:', ifTrue, ', ifFalse:', ifFalse);

  // Get the appropriate branch
  const resultExpr = conditionResult ? ifTrue : ifFalse;

  // Handle literal values (numbers, empty string)
  if (resultExpr === '') return '';
  // Handle quoted empty string
  if (resultExpr === "''" || resultExpr === '""') return '';
  if (/^-?\d+(\.\d+)?$/.test(resultExpr)) return resultExpr;

  // Handle quoted string literals (including color suffixes like ':warning')
  if (/^['"].*['"]$/.test(resultExpr)) {
    return resultExpr.slice(1, -1);
  }

  // Strip outer parens and evaluate
  const stripped = stripOuterParens(resultExpr);
  return evaluateExpression(stripped, hass);
}

/**
 * Split expression into base expression and filter chain
 * Handles pipes inside parentheses and quotes
 * @param {string} expression - Full expression
 * @returns {Object} - { baseExpr, filterChain }
 */
function splitExpressionAndFilters(expression) {
  let inQuote = false;
  let quoteChar = '';
  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if ((char === '"' || char === "'") && expression[i - 1] !== '\\') {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
    } else if (!inQuote) {
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;
      else if (char === '[') bracketDepth++;
      else if (char === ']') bracketDepth--;
      else if (char === '|' && parenDepth === 0 && bracketDepth === 0) {
        return {
          baseExpr: expression.substring(0, i).trim(),
          filterChain: expression.substring(i + 1).trim()
        };
      }
    }
  }

  return { baseExpr: expression.trim(), filterChain: null };
}

/**
 * Split expression by the ~ concatenation operator (Jinja2-style)
 * Only splits at top-level ~ (not inside quotes, parens, or brackets)
 * @param {string} expression - Expression to split
 * @returns {string[]} - Array of parts (length 1 if no ~ found)
 */
function splitByConcatOperator(expression) {
  const parts = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if ((char === '"' || char === "'") && expression[i - 1] !== '\\') {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
      current += char;
    } else if (!inQuote) {
      if (char === '(') {
        parenDepth++;
        current += char;
      } else if (char === ')') {
        parenDepth--;
        current += char;
      } else if (char === '[') {
        bracketDepth++;
        current += char;
      } else if (char === ']') {
        bracketDepth--;
        current += char;
      } else if (char === '~' && parenDepth === 0 && bracketDepth === 0) {
        // Found top-level concatenation operator
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    } else {
      current += char;
    }
  }

  // Add the last part
  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

/**
 * Check if expression contains math operators outside entity references
 * @param {string} expr - Expression to check
 * @returns {boolean}
 */
function isMathExpression(expr) {
  // Remove all states['...'] references to check what's left
  const withoutRefs = expr.replace(/states\['[^']+'\](?:\.[a-zA-Z_][\w.\[\]]*)?/g, '0');
  // Check for arithmetic operators
  return /[+\-*\/]/.test(withoutRefs) || /^\s*\(/.test(expr);
}

/**
 * Evaluate a math expression containing entity references
 * Handles sub-expressions with filters like (states['x'].y | float(0))
 * @param {string} expr - Math expression
 * @param {Object} hass - Home Assistant object
 * @returns {number|null} - Result or null on error
 */
function evaluateMathExpression(expr, hass) {
  try {
    let resolved = expr;

    // Phase 1: Iteratively evaluate innermost parenthesized expressions
    // containing entity refs or pipes. Process innermost first to handle
    // nested structures like (states['x'].y | float(0))
    let changed = true;
    let iterations = 0;
    const maxIterations = 50;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      // Find innermost parentheses containing entity refs or pipes
      let bestMatch = null;
      let parenStack = [];

      for (let i = 0; i < resolved.length; i++) {
        if (resolved[i] === '(') {
          parenStack.push(i);
        } else if (resolved[i] === ')' && parenStack.length > 0) {
          const start = parenStack.pop();
          const content = resolved.substring(start + 1, i);

          // Process if contains entity refs or pipes
          // Note: by stack logic, any parens in content are already balanced
          const hasEntityOrPipe = content.includes("states['") || content.includes('|');

          if (hasEntityOrPipe) {
            bestMatch = { start, end: i, content };
            break; // Process this match first
          }
        }
      }

      if (bestMatch) {
        // Evaluate this sub-expression through the normal pipeline
        const evalResult = evaluateExpression(bestMatch.content, hass);
        const num = parseFloat(evalResult);

        if (!isNaN(num)) {
          resolved = resolved.substring(0, bestMatch.start) + num.toString() + resolved.substring(bestMatch.end + 1);
          changed = true;
        } else {
          resolved = resolved.substring(0, bestMatch.start) + 'NaN' + resolved.substring(bestMatch.end + 1);
          changed = true;
        }
      }
    }

    // Phase 2: Replace any remaining entity refs (without parens/filters)
    resolved = resolved.replace(
      /states\['([^']+)'\]\.?([\w.\[\]]*)?/g,
      (match, entityId, accessor) => {
        const entity = hass?.states?.[entityId];
        if (!entity) return 'NaN';

        const path = accessor || 'state';
        const value = resolveEntityAccessor(entity, path);

        if (value === undefined || value === null) return 'NaN';
        const num = parseFloat(value);
        return isNaN(num) ? 'NaN' : num.toString();
      }
    );

    // Phase 3: Validate and evaluate
    if (!/^[\d\s+\-*\/().NaN]+$/.test(resolved)) {
      console.warn('Math expression contains invalid characters:', resolved);
      return null;
    }

    if (resolved.includes('NaN')) {
      return null;
    }

    const result = new Function(`return (${resolved})`)();
    return typeof result === 'number' && !isNaN(result) ? result : null;
  } catch (e) {
    console.error('Math expression error:', e, 'Expression:', expr);
    return null;
  }
}

/**
 * Resolve an accessor path on an entity (handles nested paths and arrays)
 * @param {Object} entity - HA entity object
 * @param {string} accessor - Path like "state", "attributes.forecast[0].temp"
 * @returns {any} - Resolved value
 */
function resolveEntityAccessor(entity, accessor) {
  if (!accessor || accessor === 'state') {
    return entity.state;
  }

  // Handle attributes.x.y.z[0].etc
  if (accessor.startsWith('attributes')) {
    const attrPath = accessor.replace(/^attributes\.?/, '');
    if (!attrPath) return entity.attributes;
    return getNestedValue(entity.attributes, attrPath);
  }

  return undefined;
}

/**
 * Get a nested value from an object using dot/bracket notation
 * Supports: "forecast[0].temperature", "items[2]", "nested.deep.value"
 * @param {Object} obj - Source object
 * @param {string} path - Path string
 * @returns {any} - Resolved value or undefined
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return obj;

  // Parse path into segments: "forecast[0].temperature" -> ["forecast", "0", "temperature"]
  const segments = path.split(/\.|\[|\]/).filter(s => s !== '');

  let current = obj;
  for (const segment of segments) {
    if (current === undefined || current === null) return undefined;

    // Try numeric index first for arrays
    const index = parseInt(segment, 10);
    if (!isNaN(index) && Array.isArray(current)) {
      current = current[index];
    } else {
      current = current[segment];
    }
  }

  return current;
}


// -----------------------------------------------------------------------
// FILTER CHAIN PROCESSING
// -----------------------------------------------------------------------

/**
 * Apply a chain of filters to a value
 * @param {any} value - Starting value
 * @param {string} filterChain - Filter expression
 * @param {Object} hass - Home Assistant object (for entity-aware filters)
 * @param {string} entityId - Source entity ID (for entity-aware filters)
 * @returns {any} - Processed value
 */
function applyFilters(value, filterChain, hass, entityId) {
  const filters = parseFilterChain(filterChain);

  for (const filter of filters) {
    try {
      value = applyFilter(value, filter, hass, entityId);
      // Do not break on 'Unknown' - allow recovery filters (fallback/default/coalesce) to run
    } catch (e) {
      console.error('Filter error:', e, 'Filter:', filter);
      value = 'Unknown';
      // Continue processing so recovery filters can handle the error
    }
  }

  return value;
}

/**
 * Parse filter chain string into individual filters
 * Handles quoted strings containing pipe characters
 * @param {string} filterChain - Raw filter chain string
 * @returns {string[]} - Array of individual filter expressions
 */
function parseFilterChain(filterChain) {
  const filters = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  let parenDepth = 0;

  for (let i = 0; i < filterChain.length; i++) {
    const char = filterChain[i];

    if ((char === '"' || char === "'") && filterChain[i - 1] !== '\\') {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
      current += char;
    } else if (char === '(' && !inQuote) {
      parenDepth++;
      current += char;
    } else if (char === ')' && !inQuote) {
      parenDepth--;
      current += char;
    } else if (char === '|' && !inQuote && parenDepth === 0) {
      if (current.trim()) filters.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) filters.push(current.trim());
  return filters;
}


// -----------------------------------------------------------------------
// INDIVIDUAL FILTER APPLICATION
// -----------------------------------------------------------------------

/**
 * Apply a single filter to a value
 * @param {any} value - Input value
 * @param {string} filter - Filter expression
 * @param {Object} hass - Home Assistant object
 * @param {string} entityId - Source entity ID
 * @returns {any} - Filtered value
 */
function applyFilter(value, filter, hass, entityId) {
  const filterName = filter.split('(')[0].trim();
  const argsMatch = filter.match(/\((.+)\)/s);
  const args = argsMatch ? parseArgs(argsMatch[1], hass) : [];

  switch (filterName) {

    // =====================================================================
    // DEBUG & ERROR HANDLING
    // =====================================================================

    case 'debug': {
      console.log('[Template Debug]', {
        value,
        type: typeof value,
        entityId,
        filter
      });
      return value;
    }

    case 'fallback': {
      // Recovery filter: replaces Unknown/unavailable/empty values with fallback
      const fallbackVal = args[0] !== undefined ? args[0] : 'N/A';
      if (value === undefined || value === null) return fallbackVal;
      if (typeof value === 'number' && isNaN(value)) return fallbackVal;
      const strVal = String(value).toLowerCase();
      if (strVal === 'unknown' || strVal === 'unavailable' ||
          strVal === 'nan' || strVal === '') {
        return fallbackVal;
      }
      return value;
    }

    case 'type': {
      // Debug filter: returns the type of the value
      return typeof value;
    }

    case 'json': {
      // Debug filter: returns JSON representation
      try {
        return JSON.stringify(value);
      } catch {
        return '[Circular]';
      }
    }


    // =====================================================================
    // TYPE CONVERSION
    // =====================================================================

    case 'float': {
      const defaultVal = args[0] !== undefined ? parseFloat(args[0]) : NaN;
      const result = parseFloat(value);
      return isNaN(result) ? (isNaN(defaultVal) ? 'Unknown' : defaultVal) : result;
    }

    case 'int': {
      const defaultVal = args[0] !== undefined ? parseInt(args[0]) : NaN;
      const result = parseInt(value);
      return isNaN(result) ? (isNaN(defaultVal) ? 'Unknown' : defaultVal) : result;
    }

    case 'string': {
      return String(value);
    }

    case 'bool': {
      const strVal = String(value).toLowerCase();
      return strVal === 'on' || strVal === 'true' || strVal === '1' || strVal === 'yes';
    }


    // =====================================================================
    // MATH OPERATIONS
    // =====================================================================

    case 'round': {
      const decimals = args[0] !== undefined ? parseInt(args[0]) : 0;
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : num.toFixed(decimals);
    }

    case 'floor': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : Math.floor(num);
    }

    case 'ceil': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : Math.ceil(num);
    }

    case 'multiply': {
      const factor = parseFloat(args[0]);
      const num = parseFloat(value);
      return isNaN(num) || isNaN(factor) ? 'Unknown' : num * factor;
    }

    case 'divide': {
      const divisor = parseFloat(args[0]);
      const num = parseFloat(value);
      return isNaN(num) || isNaN(divisor) || divisor === 0 ? 'Unknown' : num / divisor;
    }

    case 'add': {
      const addend = parseFloat(args[0]);
      const num = parseFloat(value);
      return isNaN(num) || isNaN(addend) ? 'Unknown' : num + addend;
    }

    case 'subtract': {
      const subtrahend = parseFloat(args[0]);
      const num = parseFloat(value);
      return isNaN(num) || isNaN(subtrahend) ? 'Unknown' : num - subtrahend;
    }

    case 'abs': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : Math.abs(num);
    }

    case 'min': {
      const limit = parseFloat(args[0]);
      const num = parseFloat(value);
      return isNaN(num) || isNaN(limit) ? 'Unknown' : Math.max(num, limit);
    }

    case 'max': {
      const limit = parseFloat(args[0]);
      const num = parseFloat(value);
      return isNaN(num) || isNaN(limit) ? 'Unknown' : Math.min(num, limit);
    }

    case 'clamp': {
      const minVal = parseFloat(args[0]);
      const maxVal = parseFloat(args[1]);
      const num = parseFloat(value);
      if (isNaN(num) || isNaN(minVal) || isNaN(maxVal)) return 'Unknown';
      return Math.min(Math.max(num, minVal), maxVal);
    }

    case 'percent': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num * 100).toFixed(0) + '%';
    }

    case 'pow': {
      const exponent = parseFloat(args[0]);
      const num = parseFloat(value);
      return isNaN(num) || isNaN(exponent) ? 'Unknown' : Math.pow(num, exponent);
    }

    case 'sqrt': {
      const num = parseFloat(value);
      return isNaN(num) || num < 0 ? 'Unknown' : Math.sqrt(num);
    }

    case 'log': {
      const num = parseFloat(value);
      return isNaN(num) || num <= 0 ? 'Unknown' : Math.log10(num);
    }

    case 'ln': {
      const num = parseFloat(value);
      return isNaN(num) || num <= 0 ? 'Unknown' : Math.log(num);
    }

    case 'ordinal': {
      const num = parseInt(value);
      if (isNaN(num)) return 'Unknown';
      const suffixes = ['th', 'st', 'nd', 'rd'];
      const v = num % 100;
      return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
    }

    case 'thousands': {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      return num.toLocaleString('en-GB');
    }

    case 'thousands_int': {
      const num = parseInt(value);
      if (isNaN(num)) return 'Unknown';
      return num.toLocaleString('en-GB');
    }


    // =====================================================================
    // STRING FILTERS
    // =====================================================================

    case 'title':
      return String(value).replace(/\b\w/g, c => c.toUpperCase());

    case 'upper':
      return String(value).toUpperCase();

    case 'lower':
      return String(value).toLowerCase();

    case 'capitalize':
      return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();

    case 'replace': {
      const search = args[0] || '';
      const replacement = args[1] !== undefined ? args[1] : '';
      return String(value).split(search).join(replacement);
    }

    case 'trim':
      return String(value).trim();

    case 'truncate': {
      const length = args[0] !== undefined ? parseInt(args[0]) : 20;
      const suffix = args[1] !== undefined ? args[1] : '…';
      const str = String(value);
      return str.length > length ? str.slice(0, length) + suffix : str;
    }

    case 'split_last': {
      const delimiter = args[0] || '.';
      const parts = String(value).split(delimiter);
      return parts[parts.length - 1];
    }

    case 'split_first': {
      const delimiter = args[0] || '.';
      const parts = String(value).split(delimiter);
      return parts[0];
    }

    case 'slug':
      return String(value)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '_');

    case 'append': {
      const suffix = args[0] !== undefined ? args[0] : '';
      return String(value) + suffix;
    }

    case 'prepend': {
      const prefix = args[0] !== undefined ? args[0] : '';
      return prefix + String(value);
    }

    case 'pad': {
      const length = args[0] !== undefined ? parseInt(args[0]) : 2;
      const char = args[1] !== undefined ? String(args[1]) : '0';
      return String(value).padStart(length, char);
    }

    case 'pad_end': {
      const length = args[0] !== undefined ? parseInt(args[0]) : 2;
      const char = args[1] !== undefined ? String(args[1]) : ' ';
      return String(value).padEnd(length, char);
    }

    case 'regex_extract': {
      const pattern = args[0] || '';
      try {
        const regex = new RegExp(pattern);
        const match = String(value).match(regex);
        return match ? (match[1] || match[0]) : value;
      } catch {
        return value;
      }
    }

    case 'regex_replace': {
      const pattern = args[0] || '';
      const replacement = args[1] !== undefined ? args[1] : '';
      try {
        const regex = new RegExp(pattern, 'g');
        return String(value).replace(regex, replacement);
      } catch {
        return value;
      }
    }

    case 'mask': {
      const visibleChars = args[0] !== undefined ? parseInt(args[0]) : 4;
      const maskChar = args[1] !== undefined ? String(args[1]) : '•';
      const str = String(value);
      if (str.length <= visibleChars) return str;
      const masked = maskChar.repeat(str.length - visibleChars);
      return masked + str.slice(-visibleChars);
    }

    case 'pluralize': {
      const singular = args[0] !== undefined ? args[0] : '';
      const plural = args[1] !== undefined ? args[1] : singular + 's';
      const num = parseFloat(value);
      if (isNaN(num)) return value;
      return num + ' ' + (num === 1 ? singular : plural);
    }

    case 'wordwrap': {
      const width = args[0] !== undefined ? parseInt(args[0]) : 70;
      const str = String(value);
      const regex = new RegExp(`(.{1,${width}})(\\s|$)`, 'g');
      return str.match(regex)?.join('\n').trim() || str;
    }


    // =====================================================================
    // BOOLEAN MAPPING
    // =====================================================================

    case 'bool_to': {
      const trueVal = args[0] !== undefined ? args[0] : 'Yes';
      const falseVal = args[1] !== undefined ? args[1] : 'No';
      const strVal = String(value).toLowerCase();
      return (strVal === 'on' || strVal === 'true' || strVal === '1') ? trueVal : falseVal;
    }


    // =====================================================================
    // ZERO/EMPTY/UNAVAILABLE HANDLING
    // =====================================================================

    case 'zero_to': {
      const replacement = args[0] !== undefined ? args[0] : 'None';
      const num = parseFloat(value);
      return (num === 0 || String(value) === '0') ? replacement : value;
    }

    case 'empty_to': {
      const replacement = args[0] !== undefined ? args[0] : 'None';
      const strVal = String(value).trim();
      return (strVal === '' || strVal === '0') ? replacement : value;
    }

    case 'default': {
      // Recovery filter: replaces Unknown/unavailable/empty/none values with default
      const defaultVal = args[0] !== undefined ? args[0] : '';
      if (value === undefined || value === null) return defaultVal;
      if (typeof value === 'number' && isNaN(value)) return defaultVal;
      const strVal = String(value).toLowerCase();
      return (strVal === 'unknown' || strVal === 'unavailable' || strVal === '' || strVal === 'none' || strVal === 'nan')
        ? defaultVal
        : value;
    }

    case 'if_unavailable': {
      // Recovery filter: replaces unavailable/unknown values
      const replacement = args[0] !== undefined ? args[0] : '';
      if (value === undefined || value === null) return replacement;
      if (typeof value === 'number' && isNaN(value)) return replacement;
      const strVal = String(value).toLowerCase();
      return (strVal === 'unavailable' || strVal === 'unknown' || strVal === 'nan') ? replacement : value;
    }

    case 'coalesce': {
      // Recovery filter: returns first valid value from value or args
      if (value === undefined || value === null) {
        for (const fallback of args) {
          if (fallback !== undefined && fallback !== '') return fallback;
        }
        return value;
      }
      if (typeof value === 'number' && isNaN(value)) {
        for (const fallback of args) {
          if (fallback !== undefined && fallback !== '') return fallback;
        }
        return value;
      }
      const strVal = String(value).toLowerCase();
      if (strVal !== 'unavailable' && strVal !== 'unknown' && strVal !== '' && strVal !== 'nan') {
        return value;
      }
      for (const fallback of args) {
        if (fallback !== undefined && fallback !== '') return fallback;
      }
      return value;
    }


    // =====================================================================
    // CONDITIONAL SUFFIX/PREFIX
    // =====================================================================

    case 'suffix_if_numeric': {
      const suffix = args[0] !== undefined ? args[0] : '';
      const strVal = String(value).toLowerCase();
      if (strVal === 'unavailable' || strVal === 'unknown' || strVal === 'n/a' || strVal === 'none') {
        return value;
      }
      const num = parseFloat(value);
      return isNaN(num) ? value : value + suffix;
    }

    case 'suffix_if_not': {
      const excludeVal = args[0] !== undefined ? args[0] : '';
      const suffix = args[1] !== undefined ? args[1] : '';
      return String(value).toLowerCase() === String(excludeVal).toLowerCase() ? value : value + suffix;
    }

    case 'prefix_if_numeric': {
      const prefix = args[0] !== undefined ? args[0] : '';
      const strVal = String(value).toLowerCase();
      if (strVal === 'unavailable' || strVal === 'unknown' || strVal === 'n/a' || strVal === 'none') {
        return value;
      }
      const num = parseFloat(value);
      return isNaN(num) ? value : prefix + value;
    }


    // =====================================================================
    // UNIT CONVERSIONS - TIME
    // =====================================================================

    case 'ms_to_sec': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : Math.round(num / 1000);
    }

    case 'ms_to_min': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : Math.round(num / 60000);
    }

    case 'sec_to_min': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : Math.round(num / 60);
    }

    case 'sec_to_hour': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num / 3600).toFixed(1);
    }

    case 'min_to_hour': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num / 60).toFixed(1);
    }


    // =====================================================================
    // UNIT CONVERSIONS - DATA
    // =====================================================================

    case 'bytes_to_kb': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num / 1024).toFixed(2);
    }

    case 'bytes_to_mb': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num / 1048576).toFixed(2);
    }

    case 'bytes_to_gb': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num / 1073741824).toFixed(2);
    }

    case 'kb_to_mb': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num / 1024).toFixed(2);
    }

    case 'kb_to_gb': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num / 1048576).toFixed(2);
    }

    case 'mb_to_gb': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num / 1024).toFixed(2);
    }

    case 'gb_to_tb': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num / 1024).toFixed(2);
    }

    case 'mb_to_tb': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num / 1048576).toFixed(2);
    }

    case 'bytes_to_tb': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num / 1099511627776).toFixed(2);
    }


    // =====================================================================
    // UNIT CONVERSIONS - TEMPERATURE
    // =====================================================================

    case 'c_to_f': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : ((num * 9/5) + 32).toFixed(1);
    }

    case 'f_to_c': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : ((num - 32) * 5/9).toFixed(1);
    }


    // =====================================================================
    // UNIT CONVERSIONS - DISTANCE
    // =====================================================================

    case 'km_to_miles': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num * 0.621371).toFixed(2);
    }

    case 'miles_to_km': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num * 1.60934).toFixed(2);
    }

    case 'm_to_ft': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num * 3.28084).toFixed(2);
    }

    case 'ft_to_m': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num * 0.3048).toFixed(2);
    }


    // =====================================================================
    // UNIT CONVERSIONS - PRESSURE
    // =====================================================================

    case 'pa_to_hpa': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num / 100).toFixed(1);
    }

    case 'hpa_to_inhg': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num * 0.02953).toFixed(2);
    }

    case 'psi_to_bar': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num * 0.0689476).toFixed(2);
    }

    case 'bar_to_psi': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : (num * 14.5038).toFixed(1);
    }


    // =====================================================================
    // UNIT CONVERSIONS - BRIGHTNESS
    // =====================================================================

    case 'brightness_pct': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : Math.round((num / 255) * 100);
    }

    case 'pct_to_brightness': {
      const num = parseFloat(value);
      return isNaN(num) ? 'Unknown' : Math.round((num / 100) * 255);
    }


    // =====================================================================
    // SMART/AUTO FORMATTING
    // =====================================================================

    case 'auto_data': {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      if (num === 0) return '0';
      if (num < 0.001) {
        const kb = num * 1024 * 1024;
        return formatCleanNumber(kb) + ' KB';
      }
      if (num < 1) {
        const mb = num * 1024;
        return formatCleanNumber(mb) + ' MB';
      }
      if (num < 1024) {
        return formatCleanNumber(num) + ' GB';
      }
      return formatCleanNumber(num / 1024) + ' TB';
    }

    case 'auto_bytes': {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      if (num === 0) return '0 B';
      if (num < 1024) return Math.round(num) + ' B';
      if (num < 1048576) return formatCleanNumber(num / 1024) + ' KB';
      if (num < 1073741824) return formatCleanNumber(num / 1048576) + ' MB';
      if (num < 1099511627776) return formatCleanNumber(num / 1073741824) + ' GB';
      return formatCleanNumber(num / 1099511627776) + ' TB';
    }

    case 'auto_watts': {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      if (num === 0) return '0 W';
      if (num < 0.01) return '0 W';
      if (num < 1) return formatCleanNumber(num * 1000) + ' mW';
      if (num >= 1000) return formatCleanNumber(num / 1000) + ' kW';
      return formatCleanNumber(num) + ' W';
    }

    case 'auto_hz': {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      if (num === 0) return '0 Hz';
      if (num < 1000) return formatCleanNumber(num) + ' Hz';
      if (num < 1000000) return formatCleanNumber(num / 1000) + ' kHz';
      if (num < 1000000000) return formatCleanNumber(num / 1000000) + ' MHz';
      return formatCleanNumber(num / 1000000000) + ' GHz';
    }

    case 'auto_bps': {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      if (num === 0) return '0 bps';
      if (num < 1000) return formatCleanNumber(num) + ' bps';
      if (num < 1000000) return formatCleanNumber(num / 1000) + ' Kbps';
      if (num < 1000000000) return formatCleanNumber(num / 1000000) + ' Mbps';
      return formatCleanNumber(num / 1000000000) + ' Gbps';
    }

    case 'auto_number': {
      const num = parseFloat(value);
      if (isNaN(num)) return value;
      return parseFloat(num.toPrecision(12)).toString();
    }


    // =====================================================================
    // DURATION FORMATTING
    // =====================================================================

    case 'duration': {
      const seconds = parseFloat(value);
      if (isNaN(seconds)) return 'Unknown';
      return formatDuration(Math.round(seconds));
    }

    case 'duration_short': {
      const seconds = parseFloat(value);
      if (isNaN(seconds)) return 'Unknown';
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      return `${m}:${String(s).padStart(2, '0')}`;
    }

    case 'duration_words': {
      const seconds = parseFloat(value);
      if (isNaN(seconds)) return 'Unknown';
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const parts = [];
      if (d > 0) parts.push(`${d} day${d !== 1 ? 's' : ''}`);
      if (h > 0) parts.push(`${h} hour${h !== 1 ? 's' : ''}`);
      if (m > 0) parts.push(`${m} minute${m !== 1 ? 's' : ''}`);
      if (s > 0 && d === 0) parts.push(`${s} second${s !== 1 ? 's' : ''}`);
      return parts.join(', ') || '0 seconds';
    }


    // =====================================================================
    // DATE & TIME
    // =====================================================================

    case 'date_format': {
      const format = args[0] || '%d %b %Y, %H:%M';
      return formatDate(value, format);
    }

    case 'relative_time': {
      return getRelativeTime(value);
    }

    case 'time_until': {
      return timeUntil(value);
    }

    case 'state_age': {
      if (!hass || !entityId) return 'Unknown';
      const entity = hass.states[entityId];
      if (!entity?.last_changed) return 'Unknown';
      return getRelativeTime(entity.last_changed);
    }

    case 'last_changed': {
      if (!hass || !entityId) return 'Unknown';
      const entity = hass.states[entityId];
      if (!entity?.last_changed) return 'Unknown';
      const format = args[0] || '%d %b %Y, %H:%M';
      return formatDate(entity.last_changed, format);
    }

    case 'last_updated': {
      if (!hass || !entityId) return 'Unknown';
      const entity = hass.states[entityId];
      if (!entity?.last_updated) return 'Unknown';
      const format = args[0] || '%d %b %Y, %H:%M';
      return formatDate(entity.last_updated, format);
    }


    // =====================================================================
    // NUMERIC RANGE MAPPING
    // =====================================================================

    case 'range_to_label': {
      // Supports optional color suffix: 'Label:color' where color is success/warning/error/info
      // Example: range_to_label(0,50,'Critical:error',51,80,'Fair:warning',81,100,'Nominal:success')
      // Returns { text: 'Label', color: 'success' } when color specified, or plain string otherwise
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      for (let i = 0; i < args.length; i += 3) {
        const min = parseFloat(args[i]);
        const max = parseFloat(args[i + 1]);
        const labelArg = args[i + 2];
        if (num >= min && num <= max) {
          // Check for color suffix (e.g., "Nominal:success")
          if (typeof labelArg === 'string' && labelArg.includes(':')) {
            const colonIndex = labelArg.lastIndexOf(':');
            const text = labelArg.substring(0, colonIndex);
            const color = labelArg.substring(colonIndex + 1);
            // Only treat as color if it's a valid semantic color
            if (['success', 'warning', 'error', 'info', 'muted'].includes(color)) {
              return { text, color };
            }
          }
          return labelArg;
        }
      }
      return value;
    }

    case 'signal_bars': {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      if (num >= -65) return '4';
      if (num >= -75) return '3';
      if (num >= -85) return '2';
      if (num >= -95) return '1';
      return '0';
    }

    case 'signal_quality': {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      if (num >= -65) return 'Excellent';
      if (num >= -75) return 'Good';
      if (num >= -85) return 'Fair';
      if (num >= -95) return 'Poor';
      return 'No Signal';
    }

    case 'wifi_quality': {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      if (num >= -50) return 'Excellent';
      if (num >= -60) return 'Good';
      if (num >= -70) return 'Fair';
      if (num >= -80) return 'Weak';
      return 'Poor';
    }

    case 'battery_level': {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      if (num >= 80) return 'Full';
      if (num >= 50) return 'Good';
      if (num >= 20) return 'Low';
      return 'Critical';
    }

    case 'lux_to_level': {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      if (num < 1) return 'Dark';
      if (num < 50) return 'Dim';
      if (num < 500) return 'Normal';
      if (num < 5000) return 'Bright';
      return 'Very Bright';
    }


    // =====================================================================
    // CONDITIONALS
    // =====================================================================

    case 'if_eq': {
      const compareVal = args[0];
      const thenVal = args[1] !== undefined ? args[1] : value;
      const elseVal = args[2] !== undefined ? args[2] : value;
      return String(value) === String(compareVal) ? thenVal : elseVal;
    }

    case 'if_ne': {
      const compareVal = args[0];
      const thenVal = args[1] !== undefined ? args[1] : value;
      const elseVal = args[2] !== undefined ? args[2] : value;
      return String(value) !== String(compareVal) ? thenVal : elseVal;
    }

    case 'if_gt': {
      const compareVal = parseFloat(args[0]);
      const thenVal = args[1] !== undefined ? args[1] : value;
      const elseVal = args[2] !== undefined ? args[2] : value;
      return parseFloat(value) > compareVal ? thenVal : elseVal;
    }

    case 'if_lt': {
      const compareVal = parseFloat(args[0]);
      const thenVal = args[1] !== undefined ? args[1] : value;
      const elseVal = args[2] !== undefined ? args[2] : value;
      return parseFloat(value) < compareVal ? thenVal : elseVal;
    }

    case 'if_gte': {
      const compareVal = parseFloat(args[0]);
      const thenVal = args[1] !== undefined ? args[1] : value;
      const elseVal = args[2] !== undefined ? args[2] : value;
      return parseFloat(value) >= compareVal ? thenVal : elseVal;
    }

    case 'if_lte': {
      const compareVal = parseFloat(args[0]);
      const thenVal = args[1] !== undefined ? args[1] : value;
      const elseVal = args[2] !== undefined ? args[2] : value;
      return parseFloat(value) <= compareVal ? thenVal : elseVal;
    }

    case 'if_between': {
      const minVal = parseFloat(args[0]);
      const maxVal = parseFloat(args[1]);
      const thenVal = args[2] !== undefined ? args[2] : value;
      const elseVal = args[3] !== undefined ? args[3] : value;
      const num = parseFloat(value);
      return (num >= minVal && num <= maxVal) ? thenVal : elseVal;
    }

    case 'if_contains': {
      const search = args[0] || '';
      const thenVal = args[1] !== undefined ? args[1] : value;
      const elseVal = args[2] !== undefined ? args[2] : value;
      return String(value).includes(search) ? thenVal : elseVal;
    }

    case 'if_in': {
      const list = args[0] ? String(args[0]).split(',').map(s => s.trim()) : [];
      const thenVal = args[1] !== undefined ? args[1] : value;
      const elseVal = args[2] !== undefined ? args[2] : value;
      return list.includes(String(value)) ? thenVal : elseVal;
    }

    case 'switch': {
      for (let i = 0; i < args.length - 1; i += 2) {
        if (String(value) === String(args[i])) return args[i + 1];
      }
      return args.length % 2 === 1 ? args[args.length - 1] : value;
    }


    // =====================================================================
    // ARRAY/LIST OPERATIONS
    // =====================================================================

    case 'join': {
      const delimiter = args[0] !== undefined ? args[0] : ', ';
      if (Array.isArray(value)) return value.join(delimiter);
      return value;
    }

    case 'first': {
      if (Array.isArray(value)) return value[0] || 'Unknown';
      return String(value).split(',')[0]?.trim() || value;
    }

    case 'last': {
      if (Array.isArray(value)) return value[value.length - 1] || 'Unknown';
      const parts = String(value).split(',');
      return parts[parts.length - 1]?.trim() || value;
    }

    case 'count': {
      if (Array.isArray(value)) return value.length;
      if (typeof value === 'string' && value.includes(',')) {
        return value.split(',').length;
      }
      return value ? 1 : 0;
    }

    case 'index': {
      const idx = args[0] !== undefined ? parseInt(args[0]) : 0;
      if (Array.isArray(value)) return value[idx] || 'Unknown';
      const parts = String(value).split(',');
      return parts[idx]?.trim() || 'Unknown';
    }

    case 'slice': {
      const start = args[0] !== undefined ? parseInt(args[0]) : 0;
      const end = args[1] !== undefined ? parseInt(args[1]) : undefined;
      if (Array.isArray(value)) return value.slice(start, end);
      return String(value).slice(start, end);
    }

    case 'reverse': {
      if (Array.isArray(value)) return [...value].reverse();
      return String(value).split('').reverse().join('');
    }

    case 'sort': {
      if (Array.isArray(value)) return [...value].sort();
      return value;
    }

    case 'unique': {
      if (Array.isArray(value)) return [...new Set(value)];
      return value;
    }


    // =====================================================================
    // HA DOMAIN-SPECIFIC
    // =====================================================================

    case 'media_state': {
      const states = {
        'playing': 'Playing',
        'paused': 'Paused',
        'idle': 'Idle',
        'off': 'Off',
        'on': 'On',
        'buffering': 'Buffering',
        'standby': 'Standby'
      };
      return states[String(value).toLowerCase()] || value;
    }

    case 'climate_action': {
      const actions = {
        'off': 'Off',
        'heating': 'Heating',
        'cooling': 'Cooling',
        'drying': 'Drying',
        'idle': 'Idle',
        'fan': 'Fan Only',
        'preheating': 'Preheating'
      };
      return actions[String(value).toLowerCase()] || value;
    }

    case 'climate_mode': {
      const modes = {
        'off': 'Off',
        'heat': 'Heat',
        'cool': 'Cool',
        'heat_cool': 'Auto',
        'auto': 'Auto',
        'dry': 'Dry',
        'fan_only': 'Fan Only'
      };
      return modes[String(value).toLowerCase()] || value;
    }

    case 'cover_position': {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      if (num === 0) return 'Closed';
      if (num === 100) return 'Open';
      return num + '%';
    }

    case 'lock_state': {
      const states = {
        'locked': 'Locked',
        'unlocked': 'Unlocked',
        'locking': 'Locking',
        'unlocking': 'Unlocking',
        'jammed': 'Jammed'
      };
      return states[String(value).toLowerCase()] || value;
    }

    case 'alarm_state': {
      const states = {
        'disarmed': 'Disarmed',
        'armed_home': 'Armed Home',
        'armed_away': 'Armed Away',
        'armed_night': 'Armed Night',
        'armed_vacation': 'Armed Vacation',
        'pending': 'Pending',
        'arming': 'Arming',
        'triggered': 'Triggered'
      };
      return states[String(value).toLowerCase()] || value;
    }

    case 'vacuum_state': {
      const states = {
        'cleaning': 'Cleaning',
        'docked': 'Docked',
        'paused': 'Paused',
        'idle': 'Idle',
        'returning': 'Returning',
        'error': 'Error'
      };
      return states[String(value).toLowerCase()] || value;
    }


    // =====================================================================
    // VISUAL
    // =====================================================================

    case 'progress_bar': {
      const width = args[0] !== undefined ? parseInt(args[0]) : 10;
      const fillChar = args[1] !== undefined ? String(args[1]) : '█';
      const emptyChar = args[2] !== undefined ? String(args[2]) : '░';
      const num = parseFloat(value);
      if (isNaN(num)) return 'Unknown';
      const pct = Math.min(100, Math.max(0, num));
      const filled = Math.round((pct / 100) * width);
      return fillChar.repeat(filled) + emptyChar.repeat(width - filled);
    }

    case 'trend_arrow': {
      const num = parseFloat(value);
      if (isNaN(num)) return '';
      if (num > 0) return '↑';
      if (num < 0) return '↓';
      return '→';
    }

    case 'trend_icon': {
      const num = parseFloat(value);
      if (isNaN(num)) return '';
      if (num > 0) return '▲';
      if (num < 0) return '▼';
      return '●';
    }


    // =====================================================================
    // LEGACY INLINE MATH (backwards compatibility)
    // =====================================================================

    default: {
      const divMatch = filter.match(/^\/\s*([\d.]+)$/);
      if (divMatch) {
        const num = parseFloat(value);
        return isNaN(num) ? 'Unknown' : num / parseFloat(divMatch[1]);
      }

      const multMatch = filter.match(/^\*\s*([\d.]+)$/);
      if (multMatch) {
        const num = parseFloat(value);
        return isNaN(num) ? 'Unknown' : num * parseFloat(multMatch[1]);
      }

      return value;
    }
  }
}


// -----------------------------------------------------------------------
// ARGUMENT PARSING
// -----------------------------------------------------------------------

/**
 * Parse filter arguments, handling quoted strings, numbers, and entity references
 * @param {string} argsStr - Raw arguments string
 * @param {Object} hass - Home Assistant object for entity evaluation
 * @returns {Array} - Parsed arguments
 */
function parseArgs(argsStr, hass) {
  const args = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  let bracketDepth = 0;

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];

    if ((char === '"' || char === "'") && argsStr[i - 1] !== '\\') {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
      current += char;
    } else if (char === '[' && !inQuote) {
      bracketDepth++;
      current += char;
    } else if (char === ']' && !inQuote) {
      bracketDepth--;
      current += char;
    } else if (char === ',' && !inQuote && bracketDepth === 0) {
      args.push(cleanArg(current, hass));
      current = '';
    } else {
      current += char;
    }
  }

  if (current) args.push(cleanArg(current, hass));
  return args;
}

/**
 * Clean and convert a single argument value
 * Supports entity references: states['entity_id'].state or states['entity_id'].attributes.xxx
 * Also supports ~ concatenation operator within arguments
 * @param {string} arg - Raw argument
 * @param {Object} hass - Home Assistant object for entity evaluation
 * @returns {string|number} - Cleaned argument (evaluated if entity reference)
 */
function cleanArg(arg, hass) {
  arg = arg.trim();

  // Check for ~ concatenation operator first (handles expressions like: states['x'].state ~ ':suffix')
  const concatParts = splitByConcatOperator(arg);
  if (concatParts.length > 1) {
    // Evaluate each part and concatenate the results
    const evaluatedParts = concatParts.map(part => cleanArg(part.trim(), hass));
    return evaluatedParts.join('');
  }

  // Check for expressions with filters (contains | outside of quotes)
  // e.g., states['sensor.x'].state | round(0)
  if (arg.includes('|') && arg.includes('states[')) {
    try {
      const result = evaluateExpression(arg, hass);
      // Handle objects with text property (like colored values)
      if (result && typeof result === 'object' && result.text !== undefined) {
        return result.text;
      }
      return result;
    } catch (e) {
      // Fall through to other handling
    }
  }

  // Check for entity reference: states['entity_id'].xxx
  const entityMatch = arg.match(/^states\['([^']+)'\]\.?(.*)$/);
  if (entityMatch && hass) {
    const entityId = entityMatch[1];
    const accessor = entityMatch[2] || 'state';
    const entity = hass.states?.[entityId];

    if (!entity) return 'Unknown';
    return resolveEntityAccessor(entity, accessor);
  }

  // Quoted string
  if ((arg.startsWith('"') && arg.endsWith('"')) ||
      (arg.startsWith("'") && arg.endsWith("'"))) {
    return arg.slice(1, -1);
  }

  // Number
  const num = parseFloat(arg);
  return isNaN(num) ? arg : num;
}


// -----------------------------------------------------------------------
// NUMBER FORMATTING HELPERS
// -----------------------------------------------------------------------

/**
 * Format a number cleanly (remove unnecessary trailing zeros)
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
function formatCleanNumber(num) {
  if (Number.isInteger(num)) return num.toString();
  const formatted = num.toFixed(2);
  return parseFloat(formatted).toString();
}


// -----------------------------------------------------------------------
// DATE & TIME HELPERS
// -----------------------------------------------------------------------

/**
 * Format a date string using strftime-style tokens
 * @param {string} dateStr - ISO date string or Date-parseable string
 * @param {string} format - Format pattern using % tokens
 * @returns {string} - Formatted date string
 *
 * Supported tokens:
 *   %Y - 4-digit year (2024)
 *   %y - 2-digit year (24)
 *   %B - Full month name (January)
 *   %b - Abbreviated month (Jan)
 *   %m - Month number, zero-padded (01-12)
 *   %d - Day of month, zero-padded (01-31)
 *   %e - Day of month (1-31)
 *   %A - Full weekday name (Monday)
 *   %a - Abbreviated weekday (Mon)
 *   %H - Hour 24h, zero-padded (00-23)
 *   %I - Hour 12h, zero-padded (01-12)
 *   %M - Minutes, zero-padded (00-59)
 *   %S - Seconds, zero-padded (00-59)
 *   %p - AM/PM
 */
function formatDate(dateStr, format) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday',
                      'Thursday', 'Friday', 'Saturday'];

    const pad = (n) => String(n).padStart(2, '0');

    return format
      .replace(/%Y/g, date.getFullYear())
      .replace(/%y/g, String(date.getFullYear()).slice(-2))
      .replace(/%B/g, fullMonths[date.getMonth()])
      .replace(/%b/g, months[date.getMonth()])
      .replace(/%m/g, pad(date.getMonth() + 1))
      .replace(/%d/g, pad(date.getDate()))
      .replace(/%e/g, date.getDate())
      .replace(/%A/g, fullDays[date.getDay()])
      .replace(/%a/g, days[date.getDay()])
      .replace(/%H/g, pad(date.getHours()))
      .replace(/%I/g, pad(date.getHours() % 12 || 12))
      .replace(/%M/g, pad(date.getMinutes()))
      .replace(/%S/g, pad(date.getSeconds()))
      .replace(/%p/g, date.getHours() >= 12 ? 'PM' : 'AM');
  } catch {
    return 'Unknown';
  }
}

/**
 * Get time until a future date
 * @param {string} dateStr - ISO date string
 * @returns {string} - Human-readable time until
 */
function timeUntil(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';

    const now = new Date();
    const diffMs = date - now;

    if (diffMs < 0) return 'passed';

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return `${diffSec}s`;
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h ${diffMin % 60}m`;
    if (diffDay < 7) return `${diffDay}d ${diffHour % 24}h`;
    return `${diffDay}d`;
  } catch {
    return 'Unknown';
  }
}