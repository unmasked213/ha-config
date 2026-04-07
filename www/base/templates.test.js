// /config/www/base/templates.test.js
// Quick sanity tests for template filter chain recovery behavior
// Run in browser console or via import

import { parseTemplate } from '/local/base/templates.js';

// Mock hass object for testing
const mockHass = {
  states: {
    'sensor.test_numeric': { state: '1234', attributes: {}, last_changed: new Date().toISOString() },
    'sensor.test_unknown': { state: 'unknown', attributes: {} },
    'sensor.test_unavailable': { state: 'unavailable', attributes: {} },
    'sensor.test_empty': { state: '', attributes: {} },
  }
};

function test(name, template, expected) {
  const result = parseTemplate(template, mockHass);
  const pass = result === expected;
  console.log(`${pass ? '✓' : '✗'} ${name}`);
  if (!pass) {
    console.log(`  Expected: "${expected}"`);
    console.log(`  Got:      "${result}"`);
  }
  return pass;
}

console.log('=== Template Recovery Filter Tests ===\n');

// Test 1: Unknown value with fallback should return fallback
test(
  'Unknown string with fallback returns fallback value',
  "{{ states['sensor.test_unknown'].state | fallback('N/A') }}",
  'N/A'
);

// Test 2: Unavailable value with fallback should return fallback
test(
  'Unavailable string with fallback returns fallback value',
  "{{ states['sensor.test_unavailable'].state | fallback('Offline') }}",
  'Offline'
);

// Test 3: Empty value with fallback should return fallback
test(
  'Empty string with fallback returns fallback value',
  "{{ states['sensor.test_empty'].state | fallback('No Data') }}",
  'No Data'
);

// Test 4: Normal numeric chain should work
test(
  'Numeric chain: float | divide | round | suffix_if_numeric',
  "{{ states['sensor.test_numeric'].state | float | divide(1000) | round(2) | suffix_if_numeric(' GHz') }}",
  '1.23 GHz'
);

// Test 5: Unknown value through float should be recoverable with fallback
test(
  'Unknown through float recovered by fallback',
  "{{ states['sensor.test_unknown'].state | float | round(2) | fallback('N/A') }}",
  'N/A'
);

// Test 6: Unavailable value through chain recoverable by default
test(
  'Unavailable through chain recovered by default filter',
  "{{ states['sensor.test_unavailable'].state | float | divide(1000) | default('Offline') }}",
  'Offline'
);

// Test 7: Coalesce should work as recovery filter
test(
  'Coalesce recovers unknown value',
  "{{ states['sensor.test_unknown'].state | coalesce('Fallback1', 'Fallback2') }}",
  'Fallback1'
);

// Test 8: Normal value should pass through fallback unchanged
test(
  'Normal value passes through fallback unchanged',
  "{{ states['sensor.test_numeric'].state | fallback('N/A') }}",
  '1234'
);

// Test 9: if_unavailable recovery filter
test(
  'if_unavailable recovers unavailable state',
  "{{ states['sensor.test_unavailable'].state | if_unavailable('System Offline') }}",
  'System Offline'
);

// Test 10: Chain with multiple filters ending in fallback
test(
  'Complex chain with fallback at end',
  "{{ states['sensor.test_unknown'].state | float(0) | multiply(100) | round(1) | suffix_if_numeric('%') | fallback('--') }}",
  '0.0%'
);

console.log('\n=== Tests Complete ===');
