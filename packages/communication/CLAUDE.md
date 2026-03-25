# CLAUDE - Communication

> **Scope:** WhatsApp messaging, AI text generation, notifications
> **Last reviewed:** 2026-02
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

Manages all messaging and notification flows in the home. This includes two isolated WhatsApp clients (C and E), AI-powered auto-reply generation via `ha_text_ai`, contact resolution, unread state tracking, alert notifications, and a Plaud voice recorder transcript pipeline. Inbound messages are filtered, resolved to contacts, logged, and optionally answered by AI; outbound messages go through translation checks before sending.

---

## Structure

| File | Purpose |
|------|---------|
| `whatsapp_config.yaml` | Core WhatsApp config, contact mapping, AI replies |
| `c_whatsapp_auto_reply.yaml` | Auto-reply automation for specific contact |
| `whatsapp_e.yaml` | Secondary WhatsApp client message recorder |
| `alerts.yaml` | Alert notification configuration |
| `activity_alerts.yaml` | Sound alert cooldown |
| `transcript_pipeline.yaml` | Plaud voice recorder transcript fetcher via IMAP. Writes summaries to `todo.meeting_summaries` and full transcripts to `todo.meeting_transcripts`. |

---

## Key Components

- **`whatsapp_config.yaml`** — Entry point for all WhatsApp behaviour. Defines `sensor.whatsapp_contacts_config` which holds three authoritative maps: `contacts_by_name`, `phone_to_name`, `full_name_to_name`. All contact resolution flows through this sensor.
- **`c_whatsapp_auto_reply.yaml`** — Automation that buffers inbound messages and generates AI replies for a specific contact using `ha_text_ai`.
- **`whatsapp_e.yaml`** — Records messages from the secondary WhatsApp client (`clientId: "e"`), fully isolated from client C.
- **`alerts.yaml`** — Notification alert definitions.
- **`activity_alerts.yaml`** — Manages cooldown periods for sound alerts.
- **`transcript_pipeline.yaml`** — Fetches Plaud voice recorder transcripts via IMAP, saves files to `/config/www/transcripts/`, and writes to two todo lists: `todo.meeting_summaries` (lightweight, read first) and `todo.meeting_transcripts` (full text, on demand). Items are paired by `due_datetime` and expire after 7 days.

### Key Entities

| Entity Type | Pattern | Examples |
|-------------|---------|----------|
| WhatsApp helpers | `whatsapp_[scope]_[type]` | `whatsapp_c_message_to_send` |
| AI reply options | `whatsapp_reply_option_[1-3]` | |
| Unread counts | `whatsapp_c_unread_count[_contactXX]` | |
| Contact files | `contact0X.txt` | `contact01.txt` through `contact04.txt` |

### Message Flow Quick Reference

**Inbound:** Event -> Filter broadcasts/groups -> Resolve contact -> Extract message -> Update unread -> Log to history -> (Optional: buffer -> AI -> auto-reply)

**Outbound:** Input change -> Translation check -> Lookup phone -> Send -> Log -> Clear unread

---

## Development Workflows

### AI Text Generation

```yaml
action:
  - service: ha_text_ai.generate_text
    data:
      model: "anthropic/claude-3-5-sonnet-20241022"
      prompt: "{{ prompt_text }}"
      system_prompt: "System context"
    response_variable: ai_response
```

### WhatsApp Send Message

```yaml
action:
  - service: whatsapp.send_message
    data:
      clientId: "c"
      to: "{{ phone_number }}"
      body:
        text: "{{ message }}"
```

### Contact Resolution Priority

1. `phone_to_name` (exact phone match)
2. `full_name_to_name` (sender's full name)
3. Fuzzy match in push_name
4. Log as "unknown number"

---

## Conventions for AI Assistants

### Critical Constraints

1. **Contact Mapping is Authoritative** — `sensor.whatsapp_contacts_config` holds
   three maps: `contacts_by_name`, `phone_to_name`, `full_name_to_name`.
   Always validate against these.

2. **Message Filtering Required** — Always exclude:
   - `status@broadcast` (WhatsApp stories)
   - `@g.us` (group chats)

3. **Unread State is Dual** — Both count AND boolean must be cleared together:
   - `input_number.whatsapp_c_unread_count[_contactXX]`
   - `input_boolean.whatsapp_c_unread[_contactXX]`

4. **Client Isolation** — `clientId: "c"` and `clientId: "e"` are separate
   WhatsApp integrations. Never mix.

### Naming Conventions

**Phone format:** `447XXXXXXXXX@s.whatsapp.net` (no leading +)

### Anti-Patterns

- Don't assume instant AI response (generation takes time, use delays)
- Don't hardcode phone numbers — always use contact mapping
- Don't send without checking clientId isolation
- Don't skip message type handling (conversation vs extendedTextMessage)
- Don't forget "(Translated)" tag for translated messages

### Coupling Warnings

**This domain affects:**
- UI chat display components
- Notification automations

**Depends on:**
- `ha_text_ai` custom component (AI generation)
- `whatsapp` custom component (messaging)
- Message history files at `/config/www/whatsapp_histories/`

**Before modifying contact maps:** Check all automations using `whatsapp_contacts_config`.

---

## TODOs & Gaps

None currently identified.

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-02-24 | `b350903` | Restructured to 8-section format; all existing content preserved |

---

*Last Updated: 2026-02-24*
