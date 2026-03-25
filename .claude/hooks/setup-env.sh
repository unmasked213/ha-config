#!/bin/bash
# SessionStart hook for Claude Code
# 1. Adds .claude/ to PATH so haq (HA Query) is reachable by name
# 2. Syncs mcp.json to ~/.claude/ for the HA add-on (where $HOME != /config)

if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export PATH="$PATH:'"$CLAUDE_PROJECT_DIR"'/.claude"' >> "$CLAUDE_ENV_FILE"
fi

# Write a single-server mcp.json to ~/.claude/ based on detected environment.
# The source .claude/mcp.json has both servers; we pick the right one.
HOME_MCP="$HOME/.claude/mcp.json"
mkdir -p "$HOME/.claude"

if [ -S /var/run/supervisor.sock ] || [ -n "$SUPERVISOR_TOKEN" ]; then
  # HA add-on: use local Supervisor endpoint
  cat > "$HOME_MCP" << 'MCPEOF'
{
  "mcpServers": {
    "homeassistant-local": {
      "type": "sse",
      "url": "http://supervisor/core/api/mcp/sse",
      "headers": {
        "Authorization": "Bearer ${SUPERVISOR_TOKEN:-not_available}",
        "Content-Type": "application/json"
      },
      "dangerouslySkipPermissions": true
    }
  }
}
MCPEOF
else
  # Desktop: use Nabu Casa endpoint
  cat > "$HOME_MCP" << 'MCPEOF'
{
  "mcpServers": {
    "homeassistant": {
      "type": "sse",
      "url": "https://0lzzezo208hjmjairhsh1gjzwn72kts9.ui.nabu.casa/api/mcp/sse",
      "headers": {
        "Authorization": "Bearer ${HA_TOKEN}",
        "Content-Type": "application/json"
      },
      "dangerouslySkipPermissions": true
    }
  }
}
MCPEOF
fi

exit 0
