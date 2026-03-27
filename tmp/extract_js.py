import json
import sys
import re
from pathlib import Path

def escape_pointer(s):
    """RFC 6901 escaping: ~ -> ~0, / -> ~1"""
    return str(s).replace('~', '~0').replace('/', '~1')

def is_card_boundary(parent_key, in_cards_list):
    return in_cards_list or parent_key == "card"

def extract_js_blocks(data, path="", js_counter=0, parent_key="", in_cards_list=False):
    results = []
    malformed = []

    if isinstance(data, dict) and is_card_boundary(parent_key, in_cards_list):
        js_counter = 0

    if isinstance(data, dict):
        for key, value in data.items():
            escaped_key = escape_pointer(str(key))
            new_path = f"{path}/{escaped_key}"
            child_in_cards_list = (key == "cards" and isinstance(value, list))

            if isinstance(value, str) and "[[[" in value:
                remaining = value
                while "[[[" in remaining:
                    start = remaining.find("[[[")
                    end = remaining.find("]]]", start)

                    if end == -1:
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

def score_block(content):
    """Score a JS block for complexity."""
    lines = content.count('\n') + 1

    # Nesting: count ternary chains, nested ifs, logical chains
    nesting = 0
    ternary_depth = 0
    for line in content.split('\n'):
        ternaries = line.count('?')
        if ternaries > nesting:
            nesting = ternaries
        ifs = len(re.findall(r'\bif\b', line))
        logical = len(re.findall(r'&&|\|\|', line))
        depth = ifs + logical
        if depth > nesting:
            nesting = depth

    # Entity references
    entities = len(re.findall(r'states\[|hass\.states|entity_id|states\.', content))

    # State mutations
    mutations = len(re.findall(r'setState|callService|hass\.call|=\s*[^=]', content))
    # Reduce false positives from === and !==
    mutations -= len(re.findall(r'===|!==|==', content))
    mutations = max(0, mutations)

    # External calls
    external = len(re.findall(r'fetch\(|callService|callApi|hass\.connection', content))

    score = lines + (nesting * 3) + (entities * 2) + (mutations * 4) + (external * 3)

    return {
        "lines": lines,
        "nesting": nesting,
        "entities": entities,
        "mutations": mutations,
        "external": external,
        "score": score
    }

def main():
    output = {"dashboards": {}}

    storage = Path("/config/.storage")
    for f in sorted(storage.glob("lovelace*")):
        if f.stat().st_size < 100:
            continue
        try:
            with open(f, 'r') as fh:
                data = json.load(fh)
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue

        blocks, _, malformed = extract_js_blocks(data.get("data", data))

        if blocks or malformed:
            scored = []
            for b in blocks:
                s = score_block(b["content"])
                scored.append({
                    "pointer": b["pointer"],
                    "js_num": b["js_num"],
                    "lines": b["lines"],
                    "score": s,
                    "preview": b["content"][:200]
                })

            output["dashboards"][f.name] = {
                "blocks": len(blocks),
                "malformed": len(malformed),
                "total_lines": sum(b["lines"] for b in blocks),
                "items": sorted(scored, key=lambda x: x["score"]["score"], reverse=True),
                "malformed_details": malformed
            }

    # Print summary
    total_blocks = sum(d["blocks"] for d in output["dashboards"].values())
    total_malformed = sum(d["malformed"] for d in output["dashboards"].values())
    total_lines = sum(d["total_lines"] for d in output["dashboards"].values())

    print(f"SUMMARY: {total_blocks} JS blocks, {total_malformed} malformed, {total_lines} total lines across {len(output['dashboards'])} dashboards\n")

    # Print malformed
    for dname, ddata in output["dashboards"].items():
        for m in ddata["malformed_details"]:
            print(f"[MALFORMED] {dname}:{m['pointer']} — {m['issue']}: {m['context']}")

    # Print all items sorted by score globally
    all_items = []
    for dname, ddata in output["dashboards"].items():
        for item in ddata["items"]:
            item["dashboard"] = dname
            all_items.append(item)

    all_items.sort(key=lambda x: x["score"]["score"], reverse=True)

    print("\n=== TOP 30 BY SCORE ===")
    for i, item in enumerate(all_items[:30]):
        s = item["score"]
        print(f"\n#{i+1} Score:{s['score']} Lines:{s['lines']} Nest:{s['nesting']} Ent:{s['entities']} Mut:{s['mutations']} Ext:{s['external']}")
        print(f"  Location: {item['dashboard']}:{item['pointer']}#js{item['js_num']}")
        print(f"  Preview: {item['preview'][:150]}")

    print(f"\n=== SCORE DISTRIBUTION ===")
    # Tier assignment
    deep_count = min(10, max(1, int(len(all_items) * 0.15)))
    if len(all_items) <= 66:
        deep_count = min(10, len(all_items))

    deep = all_items[:deep_count]
    standard_end = min(deep_count + 30, len(all_items))
    standard = all_items[deep_count:standard_end]
    inventory = all_items[standard_end:]

    if deep:
        print(f"Deep ({len(deep)}): scores {deep[-1]['score']['score']}-{deep[0]['score']['score']}, lines {min(d['score']['lines'] for d in deep)}-{max(d['score']['lines'] for d in deep)}")
    if standard:
        print(f"Standard ({len(standard)}): scores {standard[-1]['score']['score']}-{standard[0]['score']['score']}, lines {min(d['score']['lines'] for d in standard)}-{max(d['score']['lines'] for d in standard)}")
    if inventory:
        print(f"Inventory ({len(inventory)}): scores {inventory[-1]['score']['score']}-{inventory[0]['score']['score']}, lines {min(d['score']['lines'] for d in inventory)}-{max(d['score']['lines'] for d in inventory)}")

    print(f"\n=== PER-DASHBOARD BREAKDOWN ===")
    for dname, ddata in sorted(output["dashboards"].items(), key=lambda x: x[1]["total_lines"], reverse=True):
        print(f"{dname}: {ddata['blocks']} blocks, {ddata['total_lines']} lines, {ddata['malformed']} malformed")

    # Output full JSON for analysis
    with open("/config/tmp/js_extraction.json", "w") as f:
        json.dump({"summary": {"total_blocks": total_blocks, "total_malformed": total_malformed, "total_lines": total_lines}, "all_items": [{"dashboard": it["dashboard"], "pointer": it["pointer"], "js_num": it["js_num"], "lines": it["score"]["lines"], "score": it["score"]["score"], "preview": it["preview"]} for it in all_items]}, f, indent=2)

if __name__ == "__main__":
    main()
