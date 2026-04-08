#!/bin/bash
# Assembles all documentation files into a single reference for prompt inclusion.
# Run from /config/ on the HA server (or via Claude Code addon).
# Output: /config/tmp/ha-documentation-complete.md

set -euo pipefail
OUT="/config/tmp/ha-documentation-complete.md"
mkdir -p /config/tmp

section() {
  echo ""
  echo "================================================================================"
  echo "# $1"
  echo "# Path: $2"
  echo "================================================================================"
  echo ""
  if [ -f "$2" ]; then
    cat "$2"
  else
    echo "[FILE NOT FOUND: $2]"
  fi
}

{
cat << 'HEADER'
# Complete Documentation Reference — Home Assistant Configuration
#
# This file contains every CLAUDE.md, README, spec, authoring guide,
# exception document, system context file, session file, and configuration
# file from the HA config repository's documentation layer.
#
# Purpose: Provide a complete reference for adversarial analysis of
# documentation coverage and structural weaknesses.
HEADER

echo "# Generated: $(date '+%Y-%m-%d %H:%M')"
echo "#"

# ── Root level ──
section "CLAUDE.md (Root — ha-config)" "/config/CLAUDE.md"
section "ARCHITECTURE.md" "/config/ARCHITECTURE.md"
section "README.md (Repository Root)" "/config/README.md"
section "system_context.yaml" "/config/system_context.yaml"

# ── .claude/ directory ──
section ".claude/README.md" "/config/.claude/README.md"
section ".claude/RESTRUCTURING_BRIEF.md" "/config/.claude/RESTRUCTURING_BRIEF.md"
section ".claude/settings.json" "/config/.claude/settings.json"
section ".claude/settings.local.json" "/config/.claude/settings.local.json"
section ".claude/mcp.json" "/config/.claude/mcp.json"
section ".claude/hooks/setup-env.sh" "/config/.claude/hooks/setup-env.sh"
section ".claude/session.md" "/config/.claude/session.md"
section ".claude/session_history.md" "/config/.claude/session_history.md"
section ".claude/ha_preview_proxy.py" "/config/.claude/ha_preview_proxy.py"
section ".claude/launch.json" "/config/.claude/launch.json"

# ── .claude/rules/ (all auto-injection rules) ──
for rule in /config/.claude/rules/*.md; do
  [ -f "$rule" ] && section ".claude/rules/$(basename "$rule")" "$rule"
done

# ── .claude/skills/ ──
for skill in /config/.claude/skills/*.md; do
  [ -f "$skill" ] && section ".claude/skills/$(basename "$skill")" "$skill"
done

# ── Domain CLAUDE.md files (all 14 packages) ──
for domain in ai communication dashboard device health lights network occupancy server shopping time travel weather work; do
  section "CLAUDE.md — packages/$domain" "/config/packages/$domain/CLAUDE.md"
done

# ── Card CLAUDE.md files ──
for card_dir in /config/www/cards/*/; do
  if [ -f "${card_dir}CLAUDE.md" ]; then
    card_name=$(basename "$card_dir")
    section "CLAUDE.md — www/cards/$card_name" "${card_dir}CLAUDE.md"
  fi
done

# ── Shared UI documentation ──
section "www/base/README.md (UI System)" "/config/www/base/README.md"
section "CLAUDE.md — Shared UI Design System" "/config/www/base/docs/CLAUDE.md"
section "spec.md — UI System Specification" "/config/www/base/docs/spec.md"
section "authoring.md — Component Authoring Guide" "/config/www/base/docs/authoring.md"

for comp_doc in /config/www/base/docs/componentry/*.md; do
  [ -f "$comp_doc" ] && section "componentry/$(basename "$comp_doc")" "$comp_doc"
done

# ── Directory tree (if generated) ──
for tree in /config/config_dir_tree.md /config/tmp/config_dir_tree.md /config/docs/config_dir_tree.md; do
  [ -f "$tree" ] && { section "Config Directory Tree" "$tree"; break; }
done

# ── Adversarial system ──
[ -f "/config/ai_adversarial_system/CLAUDE.md" ] && \
  section "CLAUDE.md — Same-Model Collaboration System" "/config/ai_adversarial_system/CLAUDE.md"
[ -f "/config/ai_adversarial_system/README.md" ] && \
  section "README.md — Same-Model Collaboration" "/config/ai_adversarial_system/README.md"
[ -f "/config/ai_adversarial_system/handoff.md" ] && \
  section "handoff.md — Collaboration Thread" "/config/ai_adversarial_system/handoff.md"

# ── Supplementary ──
[ -f "/config/readme_snapshot.j2" ] && \
  section "readme_snapshot.j2 (README metrics template)" "/config/readme_snapshot.j2"

} > "$OUT"

LINES=$(wc -l < "$OUT")
SIZE=$(wc -c < "$OUT")
SECTIONS=$(grep -c '^# Path:' "$OUT")

echo "Assembled $SECTIONS sections ($LINES lines, $((SIZE/1024))KB) → $OUT"
