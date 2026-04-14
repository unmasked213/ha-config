#!/bin/sh
# Claude Code session cleanup - tiered retention
# Under 1MB: delete after 1 day
# Over 1MB: delete after 1095 days (3 years)

SESSION_DIR="/data/home/.claude/projects/-config"

if [ ! -d "$SESSION_DIR" ]; then
  echo "Session directory not found"
  exit 1
fi

small_deleted=0
large_deleted=0

# Delete small sessions (under 1MB) older than 1 day
for f in $(find "$SESSION_DIR" -name '*.jsonl' -size -1024k -mtime +1 2>/dev/null); do
  rm -f "$f" && small_deleted=$((small_deleted + 1))
done

# Delete large sessions (over 1MB) older than 3 years
for f in $(find "$SESSION_DIR" -name '*.jsonl' -size +1024k -mtime +1095 2>/dev/null); do
  rm -f "$f" && large_deleted=$((large_deleted + 1))
done

echo "Cleanup complete: ${small_deleted} small + ${large_deleted} large sessions deleted"
