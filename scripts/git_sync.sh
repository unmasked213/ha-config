#!/bin/sh
# git_sync.sh — Render live sensor data into docs, then commit and push.
#
# Usage:
#   /bin/sh /config/scripts/git_sync.sh            # full sync
#   /bin/sh /config/scripts/git_sync.sh --dry-run   # render + validate + diff, no commit
#
# Architecture:
#   1. Single template render via HA API (scripts/doc_snapshot.j2)
#   2. Inject sections into working copies of README.md, ARCHITECTURE.md, CLAUDE.md
#   3. Validate every injection (markers present + non-empty content)
#   4. Replace originals only after ALL validations pass (atomic commit point)
#   5. Exit non-zero before any git operation if any doc update fails
#
set -eu

REPO_DIR="/config"
OUTPUT_FILE="$REPO_DIR/git_sync_result.txt"
TEMPLATE_FILE="$REPO_DIR/scripts/doc_snapshot.j2"
TREE_SCRIPT="$REPO_DIR/scripts/ha_dir_tree.py"
DRY_RUN=false
WORK_DIR=""

# ── Argument parsing ──────────────────────────────────────────────────────

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────────────

log_result() {
  result="$(printf %s "$1" | tr '\n' ' ')"
  echo "$(printf '%.220s' "$result")" > "$OUTPUT_FILE"
}

log_msg() {
  printf '[%s] %s\n' "$(date -u +'%H:%M:%S')" "$1"
}

cleanup() {
  [ -n "$WORK_DIR" ] && [ -d "$WORK_DIR" ] && rm -rf "$WORK_DIR"
}
trap cleanup EXIT

# ── Core functions ────────────────────────────────────────────────────────

# render_template
#   Renders scripts/doc_snapshot.j2 via HA template API.
#   Prints rendered output to stdout. Returns 1 on failure.
render_template() {
  [ -f "$TEMPLATE_FILE" ] || { log_msg "Template not found: $TEMPLATE_FILE"; return 1; }

  _token=$(cat /run/supervisor.token 2>/dev/null || echo "${SUPERVISOR_TOKEN:-}")
  [ -n "$_token" ] || { log_msg "No supervisor token available"; return 1; }

  _json_body=$(jq -n --arg t "$(cat "$TEMPLATE_FILE")" '{"template": $t}') || {
    log_msg "Failed to build JSON body"; return 1;
  }

  _rendered=$(curl -sSL --max-time 30 \
    -H "Authorization: Bearer $_token" \
    -H "Content-Type: application/json" \
    -d "$_json_body" \
    http://hassio/core/api/template 2>/dev/null) || {
    log_msg "Template API call failed"; return 1;
  }

  [ -n "$_rendered" ] || { log_msg "Template API returned empty response"; return 1; }

  # Validate at least one section sentinel exists
  printf '%s' "$_rendered" | grep -q '<!-- section:' || {
    log_msg "Rendered output contains no section sentinels"; return 1;
  }

  printf '%s' "$_rendered"
}

# inject_section RENDERED WORK_TARGET SECTION_ID START_MARKER END_MARKER
#   Extracts <!-- section:ID --> block from RENDERED.
#   Replaces content between START_MARKER and END_MARKER in WORK_TARGET (in-place).
#   Returns 1 if: markers missing in target, section missing in rendered, content empty.
inject_section() {
  _rendered="$1"
  _target="$2"
  _section_id="$3"
  _start_marker="$4"
  _end_marker="$5"

  [ -f "$_target" ] || { log_msg "Target file not found: $_target"; return 1; }
  grep -q "$_start_marker" "$_target" || { log_msg "Start marker missing in $_target: $_start_marker"; return 1; }
  grep -q "$_end_marker" "$_target" || { log_msg "End marker missing in $_target: $_end_marker"; return 1; }

  # Extract content between section sentinels (excluding the sentinel lines themselves)
  _content=$(printf '%s' "$_rendered" | sed -n "/<!-- section:${_section_id} -->/,/<!-- \/section:${_section_id} -->/p" | sed '1d;$d')
  [ -n "$_content" ] || { log_msg "Section '$_section_id' empty or missing in rendered output"; return 1; }

  _tmpfile=$(mktemp) || return 1
  sed -n "1,/${_start_marker}/p" "$_target" > "$_tmpfile"
  printf '%s\n' "$_content" >> "$_tmpfile"
  sed -n "/${_end_marker}/,\$p" "$_target" >> "$_tmpfile"
  mv "$_tmpfile" "$_target"
}

# validate_section FILE START_MARKER END_MARKER
#   Confirms non-empty content exists between markers after injection.
#   Returns 1 if markers missing or content between them is empty.
validate_section() {
  _file="$1"
  _start="$2"
  _end="$3"

  grep -q "$_start" "$_file" || return 1
  grep -q "$_end" "$_file" || return 1

  _between=$(sed -n "/${_start}/,/${_end}/p" "$_file" | sed '1d;$d' | tr -d '[:space:]')
  [ -n "$_between" ] || return 1
}

# update_readme_tree TARGET_FILE
#   Runs ha_dir_tree.py --readme and injects output between TREE markers.
#   Works on the provided file path (working copy). Returns 0 on success.
update_readme_tree() {
  _target="$1"

  [ -f "$TREE_SCRIPT" ] || { log_msg "Tree script not found: $TREE_SCRIPT"; return 0; }
  grep -q '<!-- TREE:START -->' "$_target" || return 0
  grep -q '<!-- TREE:END -->' "$_target" || return 0

  _tree_output=$(python3 "$TREE_SCRIPT" --readme 2>/dev/null) || { log_msg "Tree script failed"; return 0; }
  [ -n "$_tree_output" ] || { log_msg "Tree script returned empty output"; return 0; }

  _tmpfile=$(mktemp) || return 0
  sed -n '1,/<!-- TREE:START -->/p' "$_target" > "$_tmpfile"
  printf '\n%s\n' "$_tree_output" >> "$_tmpfile"
  sed -n '/<!-- TREE:END -->/,$p' "$_target" >> "$_tmpfile"
  mv "$_tmpfile" "$_target"
}

# ── Preflight checks ─────────────────────────────────────────────────────

cd "$REPO_DIR" 2>/dev/null || {
  log_result "Error: cannot cd to $REPO_DIR"
  exit 1
}

if ! command -v git >/dev/null 2>&1; then
  log_result "Error: git not found in PATH"
  exit 127
fi

if [ ! -d .git ]; then
  log_result "Error: $REPO_DIR is not a git repository"
  exit 1
fi

# ── Phase 1: Render template (single API call) ───────────────────────────

log_msg "Rendering template..."
RENDERED=$(render_template) || {
  log_result "Doc update failed: template render error. No commit created."
  exit 1
}

# Count sections found
SECTION_COUNT=$(printf '%s' "$RENDERED" | grep -c '<!-- section:' || true)
log_msg "Template rendered OK ($SECTION_COUNT section markers found)"

# ── Phase 2: Create working copies ───────────────────────────────────────

WORK_DIR=$(mktemp -d) || {
  log_result "Error: cannot create work directory"
  exit 1
}

cp "$REPO_DIR/README.md"        "$WORK_DIR/README.md"
cp "$REPO_DIR/ARCHITECTURE.md"  "$WORK_DIR/ARCHITECTURE.md"
cp "$REPO_DIR/CLAUDE.md"        "$WORK_DIR/CLAUDE.md"

# ── Phase 3: Update README tree ──────────────────────────────────────────

update_readme_tree "$WORK_DIR/README.md"
log_msg "README tree updated"

# ── Phase 4: Inject all sections into working copies ─────────────────────

README_STATUS="OK"
ARCH_STATUS="OK"
CLAUDE_STATUS="OK"

# README (1 section)
if ! inject_section "$RENDERED" "$WORK_DIR/README.md" \
     "readme_snapshot" "<!-- SNAPSHOT:START -->" "<!-- SNAPSHOT:END -->"; then
  README_STATUS="FAIL"
fi

# ARCHITECTURE (9 sections)
for _sid in arch_header arch_packages arch_components arch_www_base \
            arch_www_cards arch_pyscript arch_themes arch_entity_counts \
            arch_ui_location; do
  # Convert section id to marker format: arch_header → ARCH:HEADER
  _marker_name=$(printf '%s' "$_sid" | tr '[:lower:]' '[:upper:]' | sed 's/^ARCH_/ARCH:/')
  if ! inject_section "$RENDERED" "$WORK_DIR/ARCHITECTURE.md" \
       "$_sid" "<!-- ${_marker_name}:START -->" "<!-- ${_marker_name}:END -->"; then
    ARCH_STATUS="FAIL"
  fi
done

# CLAUDE (1 section)
if ! inject_section "$RENDERED" "$WORK_DIR/CLAUDE.md" \
     "claude_summary" "<!-- CLAUDE:SUMMARY:START -->" "<!-- CLAUDE:SUMMARY:END -->"; then
  CLAUDE_STATUS="FAIL"
fi

log_msg "Injection complete [README $README_STATUS, ARCH $ARCH_STATUS, CLAUDE $CLAUDE_STATUS]"

# ── Phase 5: Validate all working copies ─────────────────────────────────

VALIDATION_FAILED=false

# README
if ! validate_section "$WORK_DIR/README.md" "<!-- SNAPSHOT:START -->" "<!-- SNAPSHOT:END -->"; then
  README_STATUS="FAIL"
  VALIDATION_FAILED=true
  log_msg "VALIDATION FAILED: README.md snapshot section is empty"
fi

# ARCHITECTURE — validate all 9 sections
for _sid in arch_header arch_packages arch_components arch_www_base \
            arch_www_cards arch_pyscript arch_themes arch_entity_counts \
            arch_ui_location; do
  _marker_name=$(printf '%s' "$_sid" | tr '[:lower:]' '[:upper:]' | sed 's/^ARCH_/ARCH:/')
  if ! validate_section "$WORK_DIR/ARCHITECTURE.md" \
       "<!-- ${_marker_name}:START -->" "<!-- ${_marker_name}:END -->"; then
    ARCH_STATUS="FAIL"
    VALIDATION_FAILED=true
    log_msg "VALIDATION FAILED: ARCHITECTURE.md section $_sid is empty"
  fi
done

# CLAUDE
if ! validate_section "$WORK_DIR/CLAUDE.md" "<!-- CLAUDE:SUMMARY:START -->" "<!-- CLAUDE:SUMMARY:END -->"; then
  CLAUDE_STATUS="FAIL"
  VALIDATION_FAILED=true
  log_msg "VALIDATION FAILED: CLAUDE.md summary section is empty"
fi

DOC_TAG="[docs: README $README_STATUS, ARCH $ARCH_STATUS, CLAUDE $CLAUDE_STATUS]"

if [ "$VALIDATION_FAILED" = true ]; then
  log_msg "Validation failed. No files replaced."
  log_result "Doc update failed $DOC_TAG. No commit created."
  exit 1
fi

log_msg "All validations passed $DOC_TAG"

# ── Phase 6: Dry-run reporting ───────────────────────────────────────────

if [ "$DRY_RUN" = true ]; then
  log_msg "── Dry-run diffs ──"
  for _file in README.md ARCHITECTURE.md CLAUDE.md; do
    _lines=$(diff "$REPO_DIR/$_file" "$WORK_DIR/$_file" 2>/dev/null | grep -c '^[<>]' || true)
    log_msg "$_file: $_lines lines changed"
    if [ "$_lines" -gt 0 ]; then
      diff "$REPO_DIR/$_file" "$WORK_DIR/$_file" 2>/dev/null || true
    fi
  done
  log_msg "Dry run complete. All validations passed."
  log_result "Dry run OK $DOC_TAG"
  exit 0
fi

# ── Phase 7: Replace originals (atomic commit point) ─────────────────────

mv "$WORK_DIR/README.md"        "$REPO_DIR/README.md"
mv "$WORK_DIR/ARCHITECTURE.md"  "$REPO_DIR/ARCHITECTURE.md"
mv "$WORK_DIR/CLAUDE.md"        "$REPO_DIR/CLAUDE.md"

log_msg "Working copies moved to originals"

# ── Phase 8: Git add, commit, push ───────────────────────────────────────

git add -A >/dev/null 2>&1 || true

if git diff --cached --quiet; then
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  head="$(git rev-parse --short HEAD 2>/dev/null || echo none)"
  now="$(date -u +'%Y-%m-%d %H:%M:%S UTC')"
  log_result "No changes to commit. Branch: $branch, HEAD: $head, $now"
  exit 0
fi

now="$(date -u +'%Y-%m-%d %H:%M:%S UTC')"
msg="HA config sync: $now $DOC_TAG"

if ! git commit -m "$msg" >/tmp/git_sync_commit.log 2>&1; then
  err="$(tail -n 6 /tmp/git_sync_commit.log | tr '\n' ' ')"
  log_result "Error during commit: $err"
  exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"

if git push origin "$branch" >/tmp/git_sync_push.log 2>&1; then
  short="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
  log_result "Success: pushed $short to origin/$branch at $now $DOC_TAG"
  exit 0
else
  err="$(tail -n 10 /tmp/git_sync_push.log | tr '\n' ' ')"
  log_result "Error during push: $err"
  exit 1
fi
