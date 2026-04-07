#!/bin/sh
set -eu

OUTPUT_FILE="/config/git_sync_result.txt"
REPO_DIR="/config"

log_result() {
  result="$(printf %s "$1" | tr '\n' ' ')"
  echo "$(printf '%.220s' "$result")" > "$OUTPUT_FILE"
}

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

update_readme_tree() {
  README_FILE="$REPO_DIR/README.md"

  [ -f /config/ha_dir_tree.py ] || return 0
  [ -f "$README_FILE" ] || return 0
  grep -q '<!-- TREE:START -->' "$README_FILE" || return 0
  grep -q '<!-- TREE:END -->' "$README_FILE" || return 0

  TREE_OUTPUT=$(python3 /config/ha_dir_tree.py --readme 2>/dev/null) || return 0
  [ -n "$TREE_OUTPUT" ] || return 0

  TMPFILE=$(mktemp) || return 0
  sed -n '1,/<!-- TREE:START -->/p' "$README_FILE" > "$TMPFILE"
  printf '\n%s\n' "$TREE_OUTPUT" >> "$TMPFILE"
  sed -n '/<!-- TREE:END -->/,$p' "$README_FILE" >> "$TMPFILE"
  mv "$TMPFILE" "$README_FILE"
}

update_readme_snapshot() {
  TEMPLATE_FILE="$REPO_DIR/readme_snapshot.j2"
  README_FILE="$REPO_DIR/README.md"

  [ -f "$TEMPLATE_FILE" ] || return 0
  [ -f "$README_FILE" ] || return 0
  grep -q '<!-- SNAPSHOT:START -->' "$README_FILE" || return 0
  grep -q '<!-- SNAPSHOT:END -->' "$README_FILE" || return 0

  TOKEN=$(cat /run/supervisor.token 2>/dev/null || echo "${SUPERVISOR_TOKEN:-}")
  [ -n "$TOKEN" ] || return 0

  JSON_BODY=$(jq -n --arg t "$(cat "$TEMPLATE_FILE")" '{"template": $t}') || return 0

  RENDERED=$(curl -sSL --max-time 30 \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$JSON_BODY" \
    http://hassio/core/api/template 2>/dev/null) || return 0

  [ -n "$RENDERED" ] || return 0
  printf '%s' "$RENDERED" | grep -q '## Key Metrics' || return 0

  TMPFILE=$(mktemp) || return 0
  sed -n '1,/<!-- SNAPSHOT:START -->/p' "$README_FILE" > "$TMPFILE"
  printf '\n%s\n' "$RENDERED" >> "$TMPFILE"
  sed -n '/<!-- SNAPSHOT:END -->/,$p' "$README_FILE" >> "$TMPFILE"
  mv "$TMPFILE" "$README_FILE"
}

update_readme_tree || true
update_readme_snapshot || true

git add -A >/dev/null 2>&1 || true

if git diff --cached --quiet; then
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  head="$(git rev-parse --short HEAD 2>/dev/null || echo none)"
  now="$(date -u +'%Y-%m-%d %H:%M:%S UTC')"
  log_result "No changes to commit. Branch: $branch, HEAD: $head, $now"
  exit 0
fi

now="$(date -u +'%Y-%m-%d %H:%M:%S UTC')"
msg="HA config sync: $now"

if ! git commit -m "$msg" >/tmp/git_sync_commit.log 2>&1; then
  err="$(tail -n 6 /tmp/git_sync_commit.log | tr '\n' ' ')"
  log_result "Error during commit: $err"
  exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"

if git push origin "$branch" >/tmp/git_sync_push.log 2>&1; then
  short="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
  log_result "Success: pushed $short to origin/$branch at $now"
  exit 0
else
  err="$(tail -n 10 /tmp/git_sync_push.log | tr '\n' ' ')"
  log_result "Error during push: $err"
  exit 1
fi