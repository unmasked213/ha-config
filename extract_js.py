#!/usr/bin/env python3
"""Extract JS blocks from Home Assistant dashboard JSON with structural card boundary detection."""

import json
import sys
from pathlib import Path

def escape_pointer(s):
    """RFC 6901 escaping: ~ -> ~0, / -> ~1"""
    return str(s).replace('~', '~0').replace('/', '~1')

def is_card_boundary(parent_key, in_cards_list):
    """
    Structural card boundary detection.
    A card boundary exists when:
    - Entering a dict that is an element of a 'cards' list
    - Entering a dict under a 'card' key
    """
    return in_cards_list or parent_key == "card"

def extract_js_blocks(data, path="", js_counter=0, parent_key="", in_cards_list=False):
    """
    Recursively find [[[ ]]] blocks with structural card boundary detection.
    Returns (results, final_counter, malformed_markers).
    """
    results = []
    malformed = []

    # Check for card boundary - reset counter
    if isinstance(data, dict) and is_card_boundary(parent_key, in_cards_list):
        js_counter = 0

    if isinstance(data, dict):
        for key, value in data.items():
            escaped_key = escape_pointer(str(key))
            new_path = f"{path}/{escaped_key}"

            # Check if this key's value is a 'cards' list
            child_in_cards_list = (key == "cards" and isinstance(value, list))

            if isinstance(value, str) and "[[[" in value:
                # Process all [[[ blocks in this string, document order
                remaining = value
                while "[[[" in remaining:
                    start = remaining.find("[[[")
                    end = remaining.find("]]]", start)

                    if end == -1:
                        # Malformed: [[[ without ]]]
                        malformed.append({
                            "pointer": new_path,
                            "issue": "unmatched_open_marker",
                            "context": remaining[start:start+50] + "..." if len(remaining) > start + 50 else remaining[start:]
                        })
                        break

                    js_counter += 1
                    js_content = remaining[start + 3:end]

                    results.append({
                        "pointer": new_path,
                        "js_num": js_counter,
                        "lines": js_content.count('\n') + 1,
                        "content": js_content.strip()
                    })

                    remaining = remaining[end + 3:]

                # Check for orphan ]]] without [[[ in remaining
                if "]]]" in remaining and "[[[" not in remaining:
                    malformed.append({
                        "pointer": new_path,
                        "issue": "unmatched_close_marker",
                        "context": remaining[:50] + "..." if len(remaining) > 50 else remaining
                    })

            child_results, js_counter, child_malformed = extract_js_blocks(
                value, new_path, js_counter, key, child_in_cards_list
            )
            results.extend(child_results)
            malformed.extend(child_malformed)

    elif isinstance(data, list):
        for i, item in enumerate(data):
            child_results, js_counter, child_malformed = extract_js_blocks(
                item, f"{path}/{i}", js_counter, parent_key, in_cards_list
            )
            results.extend(child_results)
            malformed.extend(child_malformed)

    return results, js_counter, malformed

def analyze_complexity(content):
    """Compute complexity metrics for JS content."""
    lines = content.count('\n') + 1

    # Nesting depth - count max depth of ternary and conditionals
    nesting = max(
        content.count('?'),
        content.count('&&'),
        content.count('||')
    ) // 2 + 1

    # Entity references
    entity_refs = content.count('states[') + content.count('hass.states') + content.count("state_attr(")

    # State mutations
    mutations = content.count('setState') + content.count('callService') + content.count(' = ')

    # External calls
    external = content.count('fetch(') + content.count('callService')

    # Composite score
    score = lines + (nesting * 3) + (entity_refs * 2) + (mutations * 4) + (external * 3)

    return {
        'lines': lines,
        'nesting': nesting,
        'entity_refs': entity_refs,
        'mutations': mutations,
        'external': external,
        'score': score
    }

def main(filepath, mode='summary'):
    """Main extraction function."""
    with open(filepath, 'r') as f:
        data = json.load(f)

    blocks, _, malformed = extract_js_blocks(data.get("data", data))

    # Add complexity metrics
    for block in blocks:
        metrics = analyze_complexity(block['content'])
        block.update(metrics)

    # Sort by complexity score
    blocks.sort(key=lambda x: x['score'], reverse=True)

    print(f"FILE: {filepath}")
    print(f"Total JS blocks: {len(blocks)}")
    print(f"Malformed markers: {len(malformed)}")

    if malformed:
        print("\n=== MALFORMED MARKERS ===")
        for m in malformed:
            print(f"  {m['pointer']}: {m['issue']}")
            print(f"    Context: {m['context'][:80]}")

    # Score distribution
    if blocks:
        scores = [b['score'] for b in blocks]
        print(f"\nScore range: {min(scores)} - {max(scores)}")
        print(f"Median score: {sorted(scores)[len(scores)//2]}")

        # Top 10 by complexity
        print(f"\n=== TOP 10 BY COMPLEXITY ===")
        for i, b in enumerate(blocks[:10], 1):
            preview = b['content'][:100].replace('\n', ' ')
            print(f"\n{i}. Score: {b['score']} | Lines: {b['lines']} | Entities: {b['entity_refs']}")
            print(f"   Location: {b['pointer']}#js{b['js_num']}")
            print(f"   Preview: {preview}...")

    if mode == 'full':
        print("\n=== ALL BLOCKS ===")
        for b in blocks:
            print(f"\nLocation: {b['pointer']}#js{b['js_num']}")
            print(f"Score: {b['score']} | Lines: {b['lines']}")
            print(f"Content:\n{b['content'][:500]}")
            print("-" * 60)

if __name__ == "__main__":
    mode = 'full' if len(sys.argv) > 2 and sys.argv[2] == '--full' else 'summary'
    main(sys.argv[1], mode)
