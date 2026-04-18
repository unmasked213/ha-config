#!/usr/bin/env python3
"""Stdio-to-HTTP proxy for Home Assistant's MCP endpoint.

Reads JSON-RPC messages from stdin, forwards them via HTTP POST to HA's
Streamable HTTP MCP endpoint, writes responses to stdout. This bypasses
Claude Code's HTTP transport client, which has historically failed to
connect to the HA MCP server.

Zero dependencies - stdlib only (Python 3.11+).
"""

import json
import os
import sys
import urllib.request
import urllib.error

MCP_URL = os.environ.get(
    "HA_MCP_URL", "http://supervisor/core/api/mcp"
)
SUPERVISOR_TOKEN = os.environ.get("SUPERVISOR_TOKEN", "")

session_id = None


def log(msg):
    """Log to stderr (stdout is reserved for MCP protocol)."""
    print(f"[mcp-proxy] {msg}", file=sys.stderr, flush=True)


def forward(line):
    """Forward a single JSON-RPC message to the HA MCP endpoint."""
    global session_id

    headers = {
        "Authorization": f"Bearer {SUPERVISOR_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if session_id:
        headers["Mcp-Session-Id"] = session_id

    req = urllib.request.Request(
        MCP_URL,
        data=line.encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            # Capture session ID from initialize response
            sid = resp.headers.get("Mcp-Session-Id")
            if sid:
                session_id = sid

            body = resp.read().decode("utf-8")

            # Streamable HTTP may return multiple JSON-RPC messages
            # separated by newlines, or a single one
            for part in body.strip().splitlines():
                part = part.strip()
                if part:
                    sys.stdout.write(part + "\n")
                    sys.stdout.flush()

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        log(f"HTTP {e.code}: {error_body}")

        # Try to parse the original request to get the ID
        try:
            req_obj = json.loads(line)
            req_id = req_obj.get("id")
        except Exception:
            req_id = None

        error_response = json.dumps({
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32000,
                "message": f"HTTP {e.code}: {error_body[:200]}",
            },
        })
        sys.stdout.write(error_response + "\n")
        sys.stdout.flush()

    except Exception as e:
        log(f"Error: {e}")

        try:
            req_obj = json.loads(line)
            req_id = req_obj.get("id")
        except Exception:
            req_id = None

        error_response = json.dumps({
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32000,
                "message": str(e)[:200],
            },
        })
        sys.stdout.write(error_response + "\n")
        sys.stdout.flush()


def main():
    if not SUPERVISOR_TOKEN:
        log("SUPERVISOR_TOKEN not set - auth will fail")

    log(f"Proxying stdin -> {MCP_URL}")

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        # Notifications (no "id") don't expect a response
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            log(f"Invalid JSON: {line[:100]}")
            continue

        forward(line)


if __name__ == "__main__":
    main()
