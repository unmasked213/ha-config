# .claude/ — Claude Code Configuration

## Session Continuity

### Why This Exists

The user accesses Claude Code from two environments:

| Device | Access Method | Native Resume? |
|--------|---------------|----------------|
| PC | Claude Code Desktop (direct file access via Samba) | Yes |
| Tablet/Phone | Home Assistant addon | No |

**Problem:** The HA addon has no `--resume` support. When the chat closes, context is lost.

**Additional benefit:** This system enables **cross-device continuity**. Work started on PC can be resumed on tablet, and vice versa — something native resume can't do.

This system persists session state to files that Claude reads on startup, regardless of which device initiates the session.

## Design Rationale

### Why files instead of other approaches?

- **Addon constraint:** No access to Claude's native session persistence
- **Simplicity:** Markdown files are human-readable, debuggable, and don't require tooling
- **Reliability:** Files persist through addon restarts, HA reboots, etc.

### Why two files (session.md + session_history.md)?

| File | Purpose | Why separate? |
|------|---------|---------------|
| `session.md` | Current task snapshot | Kept small for quick parsing on resume |
| `session_history.md` | Rolling archive | Longer-term reference without bloating current session |

Combining them would either lose history (if we overwrite) or bloat the current session file (if we append).

### Why overwrite session.md instead of append?

- **Problem:** Appending accumulates stale context. After 10 tasks, the file would be cluttered with irrelevant info.
- **Solution:** Overwrite keeps only current task. History moves to separate archive.
- **Trade-off:** Slightly more complex (two files), but much cleaner on resume.

### Why cap history at 20 entries?

- **Too few (<10):** Loses useful context for "what did we do last week?"
- **Too many (>50):** File becomes unwieldy, searching is slower, most entries are never referenced
- **20 entries:** ~2-4 weeks of typical work. Old enough to be useful, bounded enough to stay manageable.

### Why 3 items in Recent section?

- **Immediate context:** "What just happened?" is the most common need on resume
- **Rolls to history:** Provides natural pipeline — Recent (3) → History (20) → deleted
- **Visual simplicity:** Glanceable without scrolling

### Why staleness check at 3 days?

- **<3 days:** Likely continuing same work, context still fresh
- **>3 days:** User may have moved on mentally; worth confirming before diving into old context
- **Not a hard block:** Just a soft prompt — user can continue or start fresh

### Why mandatory update triggers?

Without explicit triggers, updates rely on Claude's judgment, which can fail:
- Chat resets unexpectedly mid-task
- Claude forgets to update after a complex sequence
- Context is lost or stale on resume

Explicit triggers (after file changes, before waiting, etc.) make updates mechanical and reliable.

### Why recognize natural phrases instead of commands?

- **User experience:** Saying "fresh start" is more natural than remembering `/clear`
- **Flexibility:** Multiple phrasings work ("clear session", "new task", "start over")
- **No syntax to remember:** Conversational, not CLI-like

## File Structure

```
.claude/
├── README.md               # This file — rationale and design decisions
├── RESTRUCTURING_BRIEF.md  # Historical — original restructuring context
├── session.md              # Current task snapshot (overwritten each update)
├── session_history.md      # Rolling archive (capped at 20 entries)
├── settings.json           # Claude Code settings
├── settings.local.json     # Local overrides (not synced)
├── mcp.json                # MCP connection config (Supervisor SSE endpoint)
├── haq                     # HA Query CLI wrapper script
├── hooks/                  # SessionStart hooks (environment setup)
├── skills/                 # Reusable workflows
└── rules/                  # Path-based auto-injection rules
    ├── ai.md
    ├── communication.md
    ├── lights.md
    ├── occupancy.md
    └── shared-ui.md
```

---

## Rules System (Domain Documentation)

### The Hybrid Approach

This repo uses two complementary documentation methods:

1. **Domain CLAUDE.md files** — Live in package folders (e.g., `packages/occupancy/CLAUDE.md`)
2. **`.claude/rules/` pointers** — Auto-inject those docs when touching relevant files

### Why Both?

| Approach | Strength | Weakness |
|----------|----------|----------|
| Domain CLAUDE.md in folders | Human-discoverable, good repo organization | Requires Claude to remember to read them |
| `.claude/rules/` auto-injection | Automatic, reliable | Less discoverable, requires specific syntax |

**Solution:** Keep domain docs in their natural locations for human discoverability. Use `.claude/rules/` to auto-inject them for AI reliability. No duplication — rules just point to existing docs via `@path` syntax.

### How Rules Work

Each rule file in `.claude/rules/` has:
```markdown
---
paths:
  - "packages/occupancy/**"
---

@packages/occupancy/CLAUDE.md
```

When Claude touches any file matching the path glob, the referenced CLAUDE.md is automatically injected into context.

### Current Rules

| Rule File | Triggers On | Injects |
|-----------|-------------|---------|
| `ai.md` | `packages/ai/**` | `packages/ai/CLAUDE.md` |
| `communication.md` | `packages/communication/**` | `packages/communication/CLAUDE.md` |
| `lights.md` | `packages/lights/**` | `packages/lights/CLAUDE.md` |
| `occupancy.md` | `packages/occupancy/**` | `packages/occupancy/CLAUDE.md` |
| `shared-ui.md` | `www/base/**`, `www/cards/**` | `www/base/docs/CLAUDE.md` |

**Note:** Only 5 of 13 package domains currently have auto-injection rules. The remaining 8 (dashboard, device, health, network, server, shopping, time, travel, weather) have `CLAUDE.md` files but no `.claude/rules/` pointer — they rely on the root CLAUDE.md directing Claude to read them manually when working in those paths.

### Adding New Domains

1. Create `packages/[domain]/CLAUDE.md` with domain-specific rules
2. Create `.claude/rules/[domain].md` pointing to it
3. Update root `CLAUDE.md` orientation table (for reference)

---

## Not Redundancy

This system may appear redundant with Claude's native capabilities, but it exists specifically because:

1. **Native resume is unavailable** in the HA addon environment (tablet/phone access)
2. **Cross-device continuity** — native resume is device-specific; this system works across PC, tablet, and phone
3. **Context persistence is critical** for multi-session work on a complex codebase
4. **Each component serves a distinct purpose** — no duplication

Even if native `--resume` becomes available in the addon, this system provides cross-device continuity that native resume cannot. The two approaches complement rather than duplicate.

---

*Last Updated: 2026-02-24*
