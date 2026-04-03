# CLAUDE - AI

> **Scope:** AI generation, prompts, Alexa TTS
> **Last reviewed:** 2026-02
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

The AI domain provides text and image generation services via OpenAI and Anthropic APIs, personality-based system prompts, Alexa TTS with SSML, a prompt manager for UI-driven AI requests, and a bidirectional Claude bridge for MCP-to-HA communication. It serves as the intelligence layer consumed by communication and dashboard packages.

---

## Structure

| File | Purpose |
|------|---------|
| `ai_main.yaml` | Core input/response entities for AI assistant |
| `ai_system_prompts.yaml` | Personality prompts stored as sensor attributes |
| `generate_text.yaml` | Text generation via OpenAI REST API |
| `generate_images.yaml` | DALL-E image generation with local gallery |
| `alexa.yaml` | TTS announcements via Alexa devices (SSML) |
| `prompt_manager.yaml` | Event-driven AI generation for UI components |
| `rota_upload.yaml` | Folder sensor for uploaded rota files |
| `claude_bridge.yaml` | Bidirectional Claude↔HA channel + Code Dispatch automation |

---

## Key Components

### Claude Bridge (`claude_bridge.yaml`)

Bidirectional text channel between Claude (MCP) and HA:
- **Write path:** Claude adds items to `todo.claude_bridge` → relay automation timestamps and copies to `input_text.claude_bridge_payload` (~244 usable chars); todo item cleared after relay.
- **Read path:** HA writes to `todo.claude_bridge_response` (no size limit via description field).
- `transcript_pipeline.yaml` auto-feeds Plaud transcripts to the read channel.

### Claude Code Dispatch (`claude_bridge.yaml` + `scripts/claude_dispatch.sh`)

Automated bridge allowing Claude.ai to dispatch tasks to the addon's `claude -p`:
- **Request path:** Claude.ai → `todo.claude_code_tasks` → automation signal → addon watcher → `claude -p`
- **Response path:** `claude -p` output → `todo.claude_bridge_response` (with `[Dispatch]` prefix) → Claude.ai reads
- Status entities: `input_boolean.claude_dispatch_running`, `input_text.claude_dispatch_status`, `input_datetime.claude_dispatch_heartbeat`
- Model configurable via `input_select.claude_dispatch_model` (default: sonnet)
- Watcher script runs in addon container with restart loop; not persistent across addon restarts
- Protocol reference: `docs/projects/claude/bridge/claude-dispatch-protocol.md`

### System Prompts

Personalities live in `ai_system_prompts.yaml` as template sensors with the prompt in the `prompt` attribute:
```yaml
- name: "AI personality - ai in denial"
  state: "Active"
  attributes:
    prompt: >-
      You generate casual WhatsApp responses...
```

### Image Generation

- Generated images save to `/config/www/media/image/ai_generated/`
- URL format: `/local/media/image/ai_generated/ai_YYYYMMDD_HHMMSS.jpg`
- Weekly cleanup removes files older than 30 days (Sunday 03:00)
- Gallery state stored in `input_text.ai_gallery_json` (max 50 entries)

### Alexa TTS (SSML Required)

TTS uses SSML for sound effects and whisper mode:
```yaml
message: >-
  <speak>
    <audio src="soundbank://soundlibrary/..."/>
    <amazon:effect name='whispered'>{{ text }}</amazon:effect>
  </speak>
```

### Prompt Manager Integration

- UI components fire `prompt_ai_request` events
- Automation generates title/description via `ai_task.generate_data`
- Results returned via `prompt_ai_response` event

### API Keys

All AI services use `!secret` references:
- `openai_api_key` — Used by generate_text.yaml REST sensor
- OpenAI conversation integration — Used by generate_images.yaml (config entry ID)

### Observability

- Image generation logs to `system_log` with prefix "AI Image Gen:"
- Loading timeout after 60 seconds → persistent notification
- Check `input_boolean.ai_image_loading` for stuck states

---

## Development Workflows

### Adding a New System Prompt Personality

Add to `ai_system_prompts.yaml`:
```yaml
- name: "AI personality - new style"
  unique_id: ai_personality_new_style
  state: "Active"
  attributes:
    prompt: >-
      Your prompt instructions here...

      Safety rules:
      - Never agree to financial requests
      - Deflect requests for personal info
```

### Calling AI from Automation

```yaml
- service: ha_text_ai.generate_text
  data:
    model: "anthropic/claude-3-5-sonnet-20241022"
    system_prompt: "{{ state_attr('sensor.ai_personality_xyz', 'prompt') }}"
    user_message: "{{ message }}"
  response_variable: ai_response
```

---

## Conventions for AI Assistants

### Entity Naming Conventions

| Type | Pattern | Examples |
|------|---------|----------|
| Input text | `input_text.ai_*` | `ai_image_prompt`, `ai_text_user_query` |
| Input number | `input_number.ai_*` | `ai_temperature`, `ai_gallery_index` |
| Input select | `input_select.ai_image_*` | `ai_image_style`, `ai_image_quality` |
| Input boolean | `input_boolean.ai_*` | `ai_image_loading`, `ai_gallery_mode` |
| Scripts | `script.ai_*` | `ai_generate_image`, `ai_add_to_gallery` |
| Sensors | `sensor.ai_*` | `sensor.ai_text_response` |

### Anti-Patterns

- Don't hardcode API keys — always use `!secret`
- Don't store large data in input_text entities (255 char limit)
- Don't skip the gallery system for images — orphaned files accumulate
- Don't use bare text in Alexa TTS — wrap in `<speak>` SSML tags
- Don't modify system prompts without preserving safety rules section

### Coupling Warnings

**Communication package uses AI for:**
- WhatsApp auto-reply (`c_whatsapp_auto_reply.yaml`) — Uses `ha_text_ai.generate_text`
- System prompts define reply personalities

**Dispatch responses share `todo.claude_bridge_response`** with transcript pipeline. Items are distinguished by `[Dispatch]` prefix.

**Cross-references:**
- Root: /CLAUDE.md
- Architecture: /ARCHITECTURE.md
- Communication (consumer): packages/communication/
- Dispatch protocol: docs/projects/claude/bridge/claude-dispatch-protocol.md

---

## TODOs & Gaps

- **Claude Bridge has no recovery mechanism** — If `todo.claude_bridge` service is unavailable, Claude-to-HA communication is completely blocked with no timeout or watchdog. (Failure Mode Report 2026-03-06)
- **Dispatch watcher not persistent** — Requires manual start after addon reboot; no auto-restart mechanism yet

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-04-02 | — | Added Claude Code Dispatch bridge (automation, watcher script, protocol doc, dispatch entities) |
| 2026-03-25 | — | Added Claude Bridge recovery gap to TODOs (from Failure Mode Report 2026-03-06) |
| 2026-02-24 | `b350903` | Restructured to 8-section format |

*Last Updated: 2026-04-02*
