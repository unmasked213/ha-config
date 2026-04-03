#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# Claude Code Dispatch Watcher
#
# Addon-side watcher that processes tasks dispatched via todo lists.
# Claude.ai writes tasks to todo.claude_code_tasks, HA automation
# touches a signal file, this script detects it and runs claude -p.
#
# Start:  nohup /config/scripts/claude_dispatch.sh &
# Stop:   kill $(cat /config/tmp/dispatch.pid)
# Logs:   /config/tmp/dispatch.log
#
# See: /config/docs/projects/claude/bridge/claude-dispatch-protocol.md
# ─────────────────────────────────────────────────────────────────────
set -uo pipefail

# ── Config ────────────────────────────────────────────────────────────

SIGNAL_FILE="/config/tmp/dispatch_signal"
LOCK_FILE="/config/tmp/dispatch.lock"
PID_FILE="/config/tmp/dispatch.pid"
LOG_FILE="/config/tmp/dispatch.log"
LOG_MAX_BYTES=102400  # ~100KB

TASK_LIST="todo.claude_code_tasks"
RESPONSE_LIST="todo.claude_bridge_response"
API_BASE="http://supervisor/core/api"

TIMEOUT_SECONDS=300  # 5 minutes max per claude -p invocation
HEARTBEAT_INTERVAL=60  # seconds between heartbeat updates when idle

# ── Helpers ───────────────────────────────────────────────────────────

log() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $*" >> "$LOG_FILE"
}

rotate_log() {
    if [ -f "$LOG_FILE" ] && [ "$(wc -c < "$LOG_FILE" 2>/dev/null || echo 0)" -gt "$LOG_MAX_BYTES" ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        log "Log rotated"
    fi
}

api_call() {
    # Usage: api_call METHOD endpoint [data]
    local method="$1" endpoint="$2" data="${3:-}"
    local args=(-s -H "Authorization: Bearer ${SUPERVISOR_TOKEN}" -H "Content-Type: application/json" -X "$method")
    if [ -n "$data" ]; then
        args+=(-d "$data")
    fi
    curl "${args[@]}" "${API_BASE}${endpoint}" 2>/dev/null
}

set_entity() {
    # Usage: set_entity domain.service entity_id key value
    local service="$1" entity="$2" key="$3" value="$4"
    api_call POST "/services/${service}" \
        "{\"entity_id\": \"${entity}\", \"${key}\": \"${value}\"}"
}

update_heartbeat() {
    set_entity "input_datetime/set_datetime" \
        "input_datetime.claude_dispatch_heartbeat" \
        "datetime" "$(date '+%Y-%m-%d %H:%M:%S')" > /dev/null
}

set_running() {
    local state="$1"
    if [ "$state" = "on" ]; then
        api_call POST "/services/input_boolean/turn_on" \
            "{\"entity_id\": \"input_boolean.claude_dispatch_running\"}" > /dev/null
    else
        api_call POST "/services/input_boolean/turn_off" \
            "{\"entity_id\": \"input_boolean.claude_dispatch_running\"}" > /dev/null
    fi
}

set_status() {
    local status="$1"
    set_entity "input_text/set_value" \
        "input_text.claude_dispatch_status" \
        "value" "$(echo "$status" | head -c 255)" > /dev/null
}

get_model() {
    local state
    state=$(api_call GET "/states/input_select.claude_dispatch_model" | python3 -c "
import sys, json
try:
    print(json.load(sys.stdin).get('state', 'sonnet'))
except:
    print('sonnet')
" 2>/dev/null)
    echo "${state:-sonnet}"
}

fetch_tasks() {
    # Fetch pending items from the task list via REST API
    # Requires ?return_response for services that return data
    api_call POST "/services/todo/get_items?return_response" \
        "{\"entity_id\": \"${TASK_LIST}\", \"status\": \"needs_action\"}" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    # Service response format: {service_response: {entity_id: {items: [...]}}}
    sr = data.get('service_response', data)
    if isinstance(sr, dict):
        for key, val in sr.items():
            if isinstance(val, dict) and 'items' in val:
                print(json.dumps(val['items']))
                sys.exit(0)
    print('[]')
except Exception as e:
    print('[]', file=sys.stdout)
    print(f'Parse error: {e}', file=sys.stderr)
" 2>> "$LOG_FILE"
}

remove_task() {
    local summary="$1"
    local payload
    payload=$(python3 -c "
import json, sys
print(json.dumps({'entity_id': '${TASK_LIST}', 'item': sys.stdin.read().strip()}))
" <<< "$summary" 2>/dev/null)
    api_call POST "/services/todo/remove_item" "$payload" > /dev/null
}

write_response() {
    local summary="$1" description="$2"
    # Use Python to safely JSON-encode the description (handles newlines, quotes, etc.)
    local payload
    payload=$(python3 -c "
import json, sys
summary = sys.argv[1]
desc = sys.stdin.read()
print(json.dumps({
    'entity_id': '${RESPONSE_LIST}',
    'item': summary,
    'description': desc
}))
" "$summary" <<< "$description" 2>/dev/null)

    if [ -n "$payload" ]; then
        api_call POST "/services/todo/add_item" "$payload" > /dev/null
    else
        log "ERROR: Failed to encode response payload"
    fi
}

# ── Core dispatch ─────────────────────────────────────────────────────

process_tasks() {
    local items_json
    items_json=$(fetch_tasks)

    # Check if there are any items
    local count
    count=$(echo "$items_json" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

    if [ "$count" -eq 0 ]; then
        log "Signal received but no pending tasks found"
        return 0
    fi

    log "Found $count pending task(s)"

    # Extract task content — concatenate all items (oldest first)
    local task_summary task_content
    task_summary=$(echo "$items_json" | python3 -c "
import sys, json
items = json.load(sys.stdin)
summaries = [item.get('summary', '').strip() for item in items if item.get('summary', '').strip()]
if not summaries:
    sys.exit(0)
print(summaries[0].split(chr(10))[0][:200])
" 2>/dev/null)

    task_content=$(echo "$items_json" | python3 -c "
import sys, json
items = json.load(sys.stdin)
summaries = [item.get('summary', '').strip() for item in items if item.get('summary', '').strip()]
if not summaries:
    sys.exit(0)
print('\n\n---\n\n'.join(summaries))
" 2>/dev/null)

    if [ -z "$task_content" ] || [ "$task_content" = " " ]; then
        log "ERROR: Could not extract task content"
        return 1
    fi

    log "Processing: $task_summary"

    # Set status entities
    set_running "on"
    set_status "$task_summary"

    # Get configured model
    local model
    model=$(get_model)
    log "Using model: $model"

    # Build the prompt
    local prompt
    prompt="$task_content"

    local append_prompt
    append_prompt="You were invoked via the Claude Code Dispatch bridge.
A task was sent by Claude.ai on behalf of the user.
Complete the task using your config access, MCP tools, and documentation.
Be concise — your response is relayed back via a todo list.
If you made file changes, list them clearly.
If the task is unclear or you need clarification, say so.
Do not modify any files unless the task explicitly requests it."

    # Run claude -p
    local start_time response exit_code duration
    start_time=$(date +%s)

    response=$(cd /config && CLAUDECODE= timeout "$TIMEOUT_SECONDS" claude \
        -p "$prompt" \
        --dangerously-skip-permissions \
        --output-format text \
        --no-session-persistence \
        --model "$model" \
        --max-budget-usd 1.00 \
        --append-system-prompt "$append_prompt" \
        2>> "$LOG_FILE") || true
    exit_code=${PIPESTATUS[0]:-$?}

    duration=$(( $(date +%s) - start_time ))

    if [ "$exit_code" -eq 124 ]; then
        log "ERROR: claude -p timed out after ${TIMEOUT_SECONDS}s"
        response="[ERROR] Task timed out after ${TIMEOUT_SECONDS} seconds.

Original task: $task_summary"
    elif [ "$exit_code" -ne 0 ] && [ -z "$response" ]; then
        log "ERROR: claude -p exited with code $exit_code"
        response="[ERROR] claude -p failed with exit code $exit_code.

Original task: $task_summary"
    fi

    # Estimate tokens (~4 chars per token, rough)
    local char_count token_estimate
    char_count=${#response}
    token_estimate=$(( char_count / 4 ))

    # Append metadata footer
    local response_with_meta
    response_with_meta="${response}

---
Dispatch metadata:
- Model: ${model}
- Duration: ${duration}s
- Tokens: ~${token_estimate}
- Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"

    # Write response
    local response_summary="[Dispatch] ${task_summary:0:200}"
    write_response "$response_summary" "$response_with_meta"
    log "Response written (${char_count} chars, ${duration}s)"

    # Remove processed tasks
    echo "$items_json" | python3 -c "
import sys, json
items = json.load(sys.stdin)
for item in items:
    summary = item.get('summary', '').strip()
    if summary:
        print(summary)
" 2>/dev/null | while IFS= read -r item_summary; do
        remove_task "$item_summary"
    done

    # Update timestamps
    set_entity "input_datetime/set_datetime" \
        "input_datetime.claude_dispatch_last_run" \
        "datetime" "$(date '+%Y-%m-%d %H:%M:%S')" > /dev/null
    set_running "off"
    set_status "Idle"

    log "Dispatch complete"
    return 0
}

# ── Signal watcher ────────────────────────────────────────────────────

watch_and_dispatch() {
    local last_heartbeat=0

    log "Watcher started (PID $$)"

    while true; do
        # Update heartbeat periodically
        local now
        now=$(date +%s)
        if (( now - last_heartbeat >= HEARTBEAT_INTERVAL )); then
            update_heartbeat
            last_heartbeat=$now
        fi

        # Check for signal file
        if [ -f "$SIGNAL_FILE" ]; then
            rm -f "$SIGNAL_FILE"
            log "Signal detected"
            rotate_log
            process_tasks || log "Task processing returned non-zero"
            update_heartbeat
            last_heartbeat=$(date +%s)
        fi

        # Brief sleep before next check
        sleep 2
    done
}

# ── Main ──────────────────────────────────────────────────────────────

main() {
    # Ensure tmp directory exists
    mkdir -p /config/tmp

    # Check for existing instance
    if [ -f "$LOCK_FILE" ]; then
        local existing_pid
        existing_pid=$(cat "$LOCK_FILE" 2>/dev/null)
        if kill -0 "$existing_pid" 2>/dev/null; then
            echo "Dispatch watcher already running (PID $existing_pid)"
            exit 1
        fi
        # Stale lock
        rm -f "$LOCK_FILE"
    fi

    # Write lock and PID files
    echo $$ > "$LOCK_FILE"
    echo $$ > "$PID_FILE"
    trap 'rm -f "$LOCK_FILE" "$PID_FILE"; log "Watcher stopped"; exit 0' EXIT INT TERM

    log "=== Claude Code Dispatch Watcher ==="
    log "PID: $$"
    log "Signal: $SIGNAL_FILE"
    log "Task list: $TASK_LIST"
    log "Response list: $RESPONSE_LIST"

    # Initial heartbeat
    update_heartbeat
    set_running "off"
    set_status "Idle"

    # Outer restart loop — if watch_and_dispatch crashes, restart
    while true; do
        watch_and_dispatch || true
        log "Watcher exited unexpectedly. Restarting in 10s..."
        sleep 10
    done
}

main "$@"
