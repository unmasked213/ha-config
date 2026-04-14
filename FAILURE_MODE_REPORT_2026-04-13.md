# Failure Mode Report — 2026-04-13

## 1. Metadata

| Field | Value |
|-------|-------|
| Report Date | 2026-04-13 |
| Repository Path | `/config/` |
| systemSnapshot | Used (2026-04-13T11:02:17) |
| Intelligence Report | Referenced: `docs/reports/config-intel/2026-04-13-09-52-config-intel.md` |
| Prior Failure Mode Report | `docs/reports/failure-mode/FAILURE_MODE_REPORT_2026-03-06.md` |
| Cascade Depth Limit | 3 |
| Entities Analysed for Cascades | 32 |
| Files Examined | 68 |
| HA Version | 2026.4.2 on HA OS 17.2 |
| Uptime at Analysis | 5d 17h 9m |

---

## 2. Executive Summary

The highest-risk failure mode remains **silent WhatsApp message loss** (FM-01, unchanged from prior report): when the WhatsApp integration goes offline, `whatsapp.send_message` is called without `continue_on_error`, unread counters are cleared after the send call regardless of success, and no retry queue exists — the user believes a message was sent when it was not (`whatsapp_config.yaml:539-569`).

The system's resilience character is **bifurcated with an expanding tail**: presence/lighting subsystems have mature availability guards and startup recovery (both main floors), while the communication, AI, and newly-added dispatch subsystems exhibit cliff-edge failure. The Claude Code Dispatch bridge (`claude_bridge.yaml:182-197`) adds a new unmonitored dependency chain — signal file, addon watcher script, and status entities — with no heartbeat watchdog and no auto-restart after addon reboot.

Key recovery gaps since last report: (1) Claude Dispatch watcher has no persistence or health monitoring (new); (2) `input_boolean.claude_dispatch_running` can get stuck "on" if the dispatch process crashes (new state corruption path); (3) `chatreader` sensor at 5-second scan interval represents the highest single-entity resource pressure with no timeout guard (new finding); (4) office lighting still has no startup recovery (unchanged). The Floor 01 raw sensor coupling and WhatsApp contact KeyError risks persist unmitigated.

Analysis was limited by static config inspection. Timing-dependent failures and resource exhaustion effects require runtime verification.

---

## 3. Single Points of Failure

| Entity/Component | In-Degree | Dependents (sample) | Failure Consequence | Recovery Path |
|-----------------|-----------|---------------------|---------------------|---------------|
| `sensor.whatsapp_contacts_config` | ~15 refs / 2 files | `whatsapp_config.yaml:536,578,607,648,705` (all contact resolution), `c_whatsapp_auto_reply.yaml` | **All WhatsApp incoming/outgoing processing halts**; `contacts[selected_contact]` KeyError at line 538 crashes outbound; incoming dropped at line 648 | Manual-only: restart HA or reload templates |
| `notify.alexa_media` | 66 refs / multiple files | `scripts.yaml` (TTS announcements), `automations.yaml` (alerts) | All Alexa TTS announcements fail; activity alerts, alarm notifications silent | Self-heal on Alexa Media reconnect; no retry |
| `notify.mobile_app_phone_c` | 42 refs / multiple files | `automations.yaml:707` (alarms), intruder alerts, location updates | Critical notifications undelivered; alarm setup fails; 6 sequential calls with 2s delays block 12+ seconds | Manual-only: phone unreachable = notifications lost |
| `media_player.cam_s_echo_show_8` | 37 refs / multiple files | `scripts.yaml` (TTS, camera feeds), `alexa.yaml` | Primary Echo Show TTS/display fails | Device reconnect; no software fallback |
| `binary_sensor.presence_floor_02` | 9 refs / 3 files | `lights.yaml:28,33` (Floor 02 auto-lights), `automations.yaml:10` (TTS activity alerts) | Floor 02 lights unresponsive to presence; landing/stairs dark | Startup recovery exists (`lights.yaml:38-40`); template auto-recovers on sensor reconnect |
| `switch.sonoff_zbminil2_switch` | 6 refs / 1 file | `lights.yaml:134,162,178,190,208,238,262` (Floor 01 on/off control + state detection) | Floor 01 lights completely uncontrollable by automation | Device reconnect; no software fallback |
| `timer.light_override` | 5 refs / 1 file | `lights.yaml:145,167,195,221,251` (all Floor 01 branches gated by idle state) | If stuck active: Floor 01 lighting permanently locked out of automation | Self-heal: timer auto-expires (5 min max); `restore: true` persists across restarts |
| `input_boolean.floor01_auto_active` | 8 refs / 1 file | `lights.yaml:154,174,183,204,213,234,243,258,267` (manual override detection flag) | If stuck "on": manual control detection breaks; automation believes it caused all state changes | 2-second delay resets (`lights.yaml:184`); no watchdog |
| `sun.sun` | 8+ refs / 3 files | `lights.yaml:165,193,224,254` (Floor 01 darkness), `curtains.yaml` (cover morning/evening) | Floor 01 darkness detection fails; covers don't open/close | Self-heal on HA reload; no lux fallback for Floor 01 |
| `todo.claude_bridge` | 3 refs / 1 file | `claude_bridge.yaml:114,122,148` (relay trigger, get_items, remove_item) | Claude-to-HA communication completely blocked | Manual-only: restart HA; no watchdog |
| Raw Floor 01 sensors (7 entities) | 2 refs each / 1 file | `lights.yaml:110-128` (triggers), `lights.yaml:226-230,277-289` (expand lists) | **Silent breakage** on entity rename — Floor 01 lighting stops responding; no error logged | Manual-only: human must notice and update entity IDs |
| `chatreader` platform sensor | 1 ref / 1 file | `configuration.yaml:156-157` (5-second scan interval) | If integration crashes: HA event loop hammered every 5s with errors; potential UI lag | Manual-only: restart integration; no timeout configured |

---

## 4. Cascade Maps

### 4.1 `sensor.whatsapp_contacts_config`: Contact Resolution Hub

**Failure trigger:** Template sensor becomes unavailable (integration restart, JSON parse error in attribute)

**Cascade path:**
```
sensor.whatsapp_contacts_config [unavailable]
  → whatsapp_config.yaml:536 [template read: from_json] — contacts dict returns None/empty
    → whatsapp_config.yaml:538 [template: contacts[selected_contact]] — KeyError
      → Outbound message automation HALTS — STOP: message never sent, no error to user
  → whatsapp_config.yaml:607 [template read: from_json] — inbound contact lookup returns None
    → whatsapp_config.yaml:648 [condition: contact is not none] — blocks normal path
      → whatsapp_config.yaml:678-682 [else: log warning, skip] — STOP: incoming message dropped
```

**Blast radius:** All WhatsApp messaging (inbound contact resolution, outbound sending, unread tracking, history append, auto-reply). 2 automations, 6+ input helpers (unread counts/booleans), shell_command history.

**Recovery:** **(d) Manual-only** — restart HA or reload template integration. No watchdog or periodic re-evaluation.

---

### 4.2 `binary_sensor.presence_floor_02`: Stair Safety Lighting

**Failure trigger:** FP2 sensors in Floor 02 area go offline (Zigbee coordinator failure, power outage)

**Cascade path:**
```
binary_sensor.presence_floor_02 [unavailable via availability template]
  → lights.yaml:28 [state trigger: to "on"] — trigger never fires
    → light.floor_02 [stays in current state] — STOP: no action
  → lights.yaml:33 [state trigger: from "on" to "off" for 10s] — trigger never fires
    → light.floor_02 [stays on/off indefinitely] — STOP: lights frozen
  → automations.yaml:10 [trigger: state, presence_floor_02] — stale
    → TTS activity alert notifications stop — STOP: leaves HA boundary
```

**Blast radius:** 1 automation (Floor 02 auto-lights, mode: restart), 1 light entity, TTS activity alerts.

**Recovery:** **(b) Startup recovery** (`lights.yaml:38-40`) + **(a) Self-heal** on sensor reconnect (template re-evaluates automatically).

---

### 4.3 Raw Floor 01 Sensors: Silent Naming Cascade

**Failure trigger:** Occupancy package renames any of the 7 raw sensor entity IDs used in `lights.yaml:110-128`

**Cascade path:**
```
binary_sensor.ms05_motion [entity renamed → old ID returns unavailable]
  → lights.yaml:110 [trigger entity_id list] — trigger on old ID: never fires
    → lights.yaml:108 [Presence trigger group] — reduced sensor coverage
      → [degraded: fewer sensors contributing to presence detection]
  → lights.yaml:121 [Motion_Change trigger group] — same reduction
  → lights.yaml:277-280 [variables: motion_sensors list] — expand() returns valid entities only
    → lights.yaml:170 [startup: expand(motion_sensors)] — reduced startup recovery
      → STOP: startup recovery partially degraded

[If ALL 7 sensors renamed simultaneously:]
  → lights.yaml:108-128 [all triggers on old IDs] — NO triggers fire
    → Floor 01 lighting completely unresponsive — STOP
  → lights.yaml:170 [expand returns empty] — startup recovery produces count=0
    → STOP: no automated recovery possible
```

**Blast radius:** Entire Floor 01 lighting. 1 automation (mode: single), 7 trigger entities, 6 action branches. Zero error messages produced — triggers simply stop firing.

**Recovery:** **(d) Manual-only** — requires human to notice lights aren't working and update entity IDs. No validation that entities exist.

---

### 4.4 `todo.claude_bridge` + `todo.claude_code_tasks`: Communication Blackout

**Failure trigger:** Todo integration offline or todo list entity unavailable

**Cascade path:**
```
todo.claude_bridge [unavailable]
  → claude_bridge.yaml:113 [trigger: state change] — trigger fires on unavailable transition
    → claude_bridge.yaml:117 [condition: int(0) > 0] — "unavailable" | int(0) = 0 → BLOCKED
      → STOP: relay automation blocks, no payload extracted
  → (write path blocked: Claude MCP HassListAddItem fails at intent layer)
    → STOP: no items can be added

todo.claude_code_tasks [unavailable]
  → claude_bridge.yaml:186 [trigger: state change] — fires on transition
    → claude_bridge.yaml:189-192 [condition: todo_items_count | int(0) > 0] — 0 → BLOCKED
      → STOP: dispatch signal never sent
  → input_boolean.claude_dispatch_running [potential stuck state: see FM-22]
    → Subsequent dispatch requests blocked even after todo recovers — STOP
```

**Blast radius:** All Claude-to-HA communication (bridge) and automated code dispatch. Transcript pipeline response writes also blocked.

**Recovery:** **(d) Manual-only** — requires HA restart or todo integration reload. No watchdog, timeout, or health check.

---

### 4.5 `sun.sun`: Darkness Detection Failure

**Failure trigger:** Sun integration fails to initialize (rare but documented in HA issues)

**Cascade path:**
```
sun.sun [unavailable]
  → lights.yaml:165 [template: state_attr('sun.sun', 'elevation') < 6] — returns None < 6 → False in Jinja2
    → Floor 01 startup/presence: lights don't turn on at night — STOP
  → lights.yaml:63-68 [condition: sun, after: sunset] — condition evaluates to false
    → Floor 02: lights don't turn on at twilight — STOP (lux fallback MAY catch gloomy days)
  → curtains.yaml [trigger: numeric_state, sun.sun elevation] — trigger never fires
    → Cover morning phase never starts; evening close never triggers — STOP
```

**Blast radius:** All darkness-dependent automations: Floor 01 lights (4 branches), Floor 02 lights (twilight path), cover morning/evening. Floor 02 retains lux fallback (`lights.yaml:72`) but Floor 01 has no lux fallback.

**Recovery:** **(a) Self-heal** — sun.sun recovers on HA reload. Timing gap (night without lights) is unrecoverable.

---

### 4.6 `ha_text_ai` Service: AI Chain Failure

**Failure trigger:** ha_text_ai custom integration offline, API key expired, or upstream API unavailable

**Cascade path:**
```
ha_text_ai service [unavailable]
  → c_whatsapp_auto_reply.yaml:124 [service: ha_text_ai.ask_question, no continue_on_error]
    → Automation ERROR — auto-reply never sent — STOP
  → whatsapp_config.yaml:450 [service: ai_task.generate_data, continue_on_error: true]
    → Falls through to else branch — reply generation skipped gracefully — STOP (handled)
  → frontend_weather.yaml:46 [service: ha_text_ai.ask_question, no continue_on_error]
    → input_text.ai_weather_clothing_suggestion retains stale value — STOP (stale data)
```

**Blast radius:** WhatsApp auto-replies (2 automations), weather clothing suggestion (1 automation). Only `whatsapp_config.yaml:450` has `continue_on_error: true`; other paths halt on error.

**Recovery:** Weather retries hourly (`frontend_weather.yaml` time_pattern). WhatsApp auto-reply has no retry. **(d) Manual-only** for WhatsApp; **(a) Self-heal** for weather.

---

### 4.7 Claude Dispatch Watcher: Unmonitored Process Chain (NEW)

**Failure trigger:** HA addon restarts, watcher script crashes, or signal file not created

**Cascade path:**
```
scripts/claude_dispatch.sh [process dies — addon restart or crash]
  → /config/tmp/dispatch_signal [file touched but no consumer]
    → todo.claude_code_tasks [items accumulate with no processing] — no drain
      → input_boolean.claude_dispatch_running [stays "off" — looks healthy]
        → STOP: system appears functional but dispatch is completely dead

scripts/claude_dispatch.sh [crash mid-execution]
  → input_boolean.claude_dispatch_running [stuck "on" from pre-crash set]
    → claude_bridge.yaml:194 [condition: dispatch_running state "off"] — BLOCKED
      → New dispatch requests permanently blocked — STOP
      → No auto-reset mechanism; no TTL on the boolean
```

**Blast radius:** All Claude.ai-to-Claude Code dispatch. Tasks queue silently with no feedback to the user.

**Recovery:** **(d) Manual-only** — requires manually toggling `input_boolean.claude_dispatch_running` off and restarting the watcher script in the addon.

---

## 5. Failure Mode Register

| ID | Lens | Location | Mechanism | Tier | Severity | Likelihood | Detectability | Runtime Verification |
|----|------|----------|-----------|------|----------|------------|---------------|---------------------|
| FM-01 | External Dep | `whatsapp_config.yaml:539-569` | WhatsApp service call fails; no `continue_on_error`; unread counter cleared after send call regardless of outcome | Tier 1 | High | Medium | **Silent** — user sees unread cleared, believes message sent | Check automation traces for red errors on `whatsapp.send_message` |
| FM-02 | Dependency | `whatsapp_config.yaml:538,580` | `contacts[selected_contact]` KeyError when contact sensor unavailable or contact not in dict | Tier 1 | High | Medium | Visible — automation trace shows error | Trigger outbound send with sensor unavailable |
| FM-03 | Dependency | `lights.yaml:110-128` | Floor 01 raw sensor entity IDs hardcoded; rename breaks silently | Tier 1 | High | Low | **Silent** — no error, triggers stop firing | Rename one sensor and verify Floor 01 lights respond |
| FM-04 | External Dep | `claude_bridge.yaml:110-151` | Todo service unavailable blocks all Claude-to-HA communication; no timeout or watchdog | Tier 1 | High | Low | Semi-visible — Claude gets error on HassListAddItem | Disable todo integration and verify bridge behavior |
| FM-05 | State Corruption | `claude_bridge.yaml:135-136` | Payloads >244 chars silently truncated via `[:255]` (11 chars used by timestamp prefix); downstream receives malformed commands | Tier 1 | Medium | Medium | **Silent** — no truncation indicator | Send 300-char command via Claude Bridge and verify |
| FM-06 | External Dep | `c_whatsapp_auto_reply.yaml:124` | `ha_text_ai.ask_question` fails; no `continue_on_error`; auto-reply never sent during message window | Tier 1 | Medium | Medium | Semi-visible — automation trace error | Disable ha_text_ai and send test WhatsApp message |
| FM-07 | Sensor Failure | `tesco_sensors.yaml:68-72,141-143` | `state_attr('sensor.popular_times_location', 'popularity_' ~ day)` returns None; `raw_hours[current_hour]` TypeError | Tier 1 | Medium | Medium | Semi-visible — sensor unavailable | Set Popular Times integration offline |
| FM-08 | Dependency | `lights.yaml:165,193,224,254` | `sun.sun` unavailable → `state_attr()` returns None → darkness detection fails for Floor 01 (no lux fallback) | Tier 1 | Medium | Low | **Silent** — lights don't turn on, no error | Stop sun integration and verify at night |
| FM-09 | Recovery | `lights_office.yaml` | Office lighting has no `homeassistant_started` trigger; requires manual intervention after restart | Tier 1 | Medium | Medium | Semi-visible — lights off after restart | Restart HA and check office lights |
| FM-10 | External Dep | `automations.yaml:707` | `notify.mobile_app_phone_c` unreachable; 6 sequential calls with 2s delays block 12+ seconds; no fallback alarm method | Tier 1 | Medium | Medium | Semi-visible — alarm not set | Put phone in airplane mode |
| FM-11 | Sensor Failure | `health.yaml:71-104` | Multiple health sensors lack `availability` guards; if Withings reports unavailable, calculations produce invalid values or `unknown` | Tier 1 | Low | Medium | Semi-visible — dashboard shows invalid data | Disable Withings integration |
| FM-12 | State Corruption | `log_errors.py:78-80` | System log handler absent at startup → sensor reports 0 errors instead of unavailable; false-healthy monitoring | Tier 1 | Medium | Low | **Silent** — sensor shows "healthy" when monitoring broken | Check sensor state immediately after HA restart |
| FM-13 | Temporal | `lights.yaml:72` | Lux hovers near threshold 50 → Floor 02 lights flicker on/off with presence cycling | Tier 2 | Low | Medium | Visible — lights flicker | Monitor lux values on overcast days |
| FM-14 | Concurrency | `lights.yaml:291` | Floor 01 mode:single; simultaneous `Presence` + `light_state_changed` triggers; loser silently dropped | Tier 2 | Low | Medium | **Silent** — dropped trigger not logged | Enable debug logging; press switch during motion |
| FM-15 | Temporal | `hourly_triggers.yaml:53-59` | DST spring-forward skips 01:00-02:00 triggers; fall-back may fire twice | Tier 2 | Low | Low | **Silent** — missed/doubled trigger | Check traces across DST dates |
| FM-16 | Recovery | Occupancy domain | `binary_sensor.bed_state_asleep_likely_bedroom` defined but consumed by zero automations | Tier 1 | Low | N/A | N/A | grep entity_id across all files |
| FM-17 | Recovery | `floor02_travel_tracking.yaml` | `room_occupancy_change` events fired — zero automations listen | Tier 1 | Low | N/A | N/A | Check event bus |
| FM-18 | Resource | `configuration.yaml:156-157` | `chatreader` sensor at 5-second scan interval with no timeout; if integration crashes, errors fire every 5s | Tier 1 | Medium | Medium | Visible — log spam | Monitor HA logs when chatreader fails |
| FM-19 | External Dep | `transcript_pipeline.yaml:97` | `shell_command.fetch_transcript` fire-and-forget; 15s delay hardcoded; if script hangs, automation continues with stale data | Tier 1 | Medium | Low | Semi-visible — persistent notification on staleness | Remove fetch script and trigger IMAP event |
| FM-20 | Concurrency | `whatsapp_config.yaml:545,668` | Multiple automations call `shell_command.append_whatsapp_message` with `>>` append; no file locking; rapid messages may interleave | Tier 2 | Low | Low | **Silent** — corrupted history file | Send multiple messages rapidly |
| FM-21 | State Corruption | `c_whatsapp_auto_reply.yaml:53` | `input_text.whatsapp_message_buffer` max 255 chars; rapid messages concatenated without size check; silent truncation | Tier 2 | Low | Medium | **Silent** — buffer overflow truncated | Send 10+ rapid WhatsApp messages |
| FM-22 | State Corruption | `claude_bridge.yaml:86-88,194` | `input_boolean.claude_dispatch_running` has no TTL or auto-reset; if dispatch crashes mid-run, boolean stays "on" permanently, blocking all future dispatches | Tier 1 | Medium | Low | **Silent** — dispatch appears idle but is permanently blocked | Kill dispatch watcher mid-task; check boolean state |
| FM-23 | Recovery | `claude_bridge.yaml:182-197` + `scripts/claude_dispatch.sh` | Dispatch watcher script not persistent across addon restarts; no heartbeat monitoring; no auto-restart | Tier 1 | Medium | Medium | **Silent** — tasks queue with no feedback | Restart addon; check if watcher resumes |
| FM-24 | Sensor Failure | `frontend_weather.yaml:58-76` | `state_attr('weather.pirateweather', 'temperature') | int` crashes with TypeError when entity unavailable (None | int fails) | Tier 1 | Medium | Low | Semi-visible — sensor unavailable | Disable Pirate Weather integration |
| FM-25 | Temporal | `automations.yaml:305-307`, `transcript_pipeline.yaml:153-154`, `generate_images.yaml:457-459` | Multiple 03:00 triggers (toothbrush reset, transcript cleanup, image cleanup, config tree, dir tree); DST fall-back may fire all twice | Tier 2 | Low | Low | **Silent** — doubled cleanup is mostly harmless | Check traces after October DST |

---

## 6. Unhandled Failure Signatures

| Sensor/Integration | Failure Signature | Consuming Automation/Template | Handling Present | Gap |
|-------------------|-------------------|-------------------------------|-----------------|-----|
| WhatsApp integration | Service call fails/times out | `whatsapp_config.yaml:539` (send), `c_whatsapp_auto_reply.yaml:135` | No | No `continue_on_error`, no retry, unread cleared post-send |
| `ha_text_ai` service | Service unavailable | `c_whatsapp_auto_reply.yaml:124`, `frontend_weather.yaml:46` | Partial (1/3 paths) | 2 of 3 callers have no error handling |
| `sensor.whatsapp_contacts_config` | Unavailable / JSON parse error | `whatsapp_config.yaml:536-538` (outbound), `whatsapp_config.yaml:607-682` (inbound) | Partial (inbound has `contact is not none` at 648) | Outbound `contacts[selected_contact]` at line 538 has no guard |
| `notify.mobile_app_phone_c` | Phone unreachable | `automations.yaml:707` (alarms), intruder alerts | No | Critical alerts may not deliver; no fallback channel |
| `sensor.popular_times_location` | Attribute returns None | `tesco_sensors.yaml:68,141` (busyness, opening status) | No | Array index on None causes TypeError |
| `weather.pirateweather` | Unavailable | `frontend_weather.yaml:58-76` (weather display template) | No | `state_attr() | int` crashes on None |
| `sun.sun` | Unavailable | `lights.yaml:165,193,224,254` (Floor 01 darkness) | No | `state_attr() returns None; None < 6` evaluates as False |
| IMAP integration | Offline / email never arrives | `transcript_pipeline.yaml:64` (trigger: imap_content event) | No | Event never fires; no periodic check for missed emails |
| `shell_command.append_whatsapp_message` | Script execution failure | `whatsapp_config.yaml:545,668` (3 call sites) | No | Message history silently drops entries |
| `calendar.united_kingdom_eng` | Unavailable | `hourly_triggers.yaml:170-173` (holiday check) | No | `state_attr(..., 'start_time')` returns None; string parsing fails |
| `chatreader` platform | Integration crash | `configuration.yaml:156-157` (5s scan interval) | No | No command_timeout; errors every 5s flood logs |
| Govee REST API | API timeout / auth failure | `govee.yaml:10-19` (heater control) | No | Fire-and-forget; no response validation |
| HASS.Agent REST | PC offline / port unreachable | `pc.yaml:38-43` (notifications) | No | Silent failure; optional notifications lost |
| `todo.claude_code_tasks` | Todo service unavailable | `claude_bridge.yaml:186` (dispatch signal) | No | Dispatch permanently blocked; no retry |

---

## 7. Recovery Assessment

| Subsystem | Failure Mode | Recovery Mechanism | Classification | Evidence |
|-----------|-------------|-------------------|----------------|----------|
| Lighting - Floor 02 | Presence sensor unavailable | Startup trigger `lights.yaml:38-40`; template auto-recovers | **(b) Startup + (a) Self-heal** | Trigger re-evaluates on start; sensor reconnect triggers template |
| Lighting - Floor 01 | Presence sensor unavailable | Startup trigger `lights.yaml:136-138`; checks `expand(motion_sensors)` | **(b) Startup** | Startup checks 7 raw sensors; reduced if subset unavailable |
| Lighting - Floor 01 | Manual override lockout | Timer auto-expiry (5 min), `restore: true` | **(a) Self-heal** | `auto_lights.yaml:12` — 2-minute base, extended to 5 dynamically |
| Lighting - Office | Presence sensor unavailable | No startup trigger; next presence change resumes | **(d) Manual-only** (until sensor reconnects) | No `homeassistant_started` trigger in `lights_office.yaml` |
| Covers - Morning | sun.sun unavailable | No fallback; cover phase never triggers | **(d) Manual-only** | No lux-based fallback for cover triggers |
| Covers - Evening | sun.sun unavailable | No fallback; covers stay open overnight | **(d) Manual-only** | `curtains.yaml` — `numeric_state` trigger on sun.sun only |
| WhatsApp - Send | Integration offline | No retry, no queue, no fallback | **(d) Manual-only** | Zero error handling on `whatsapp.send_message` calls |
| WhatsApp - Receive | Contact sensor unavailable | No recovery; incoming messages dropped | **(d) Manual-only** | `whatsapp_config.yaml:607-682` — single resolution path |
| Claude Bridge - Write | Todo service unavailable | No timeout, no watchdog, no health check | **(d) Manual-only** | `claude_bridge.yaml:117` — condition blocks when todo unavailable |
| Claude Bridge - Read | Todo service unavailable | No fallback; responses never written | **(d) Manual-only** | `todo.add_item` with no error handling |
| Claude Dispatch | Watcher script dead | No heartbeat, no auto-restart, no health check | **(d) None found** | `scripts/claude_dispatch.sh` dies silently on addon restart |
| Claude Dispatch | `dispatch_running` stuck on | No TTL, no auto-reset watchdog | **(d) None found** | Boolean has no expiry mechanism |
| AI Text Generation | ha_text_ai offline | Weather: hourly retry; WhatsApp: none | Weather: **(a) Self-heal**. WhatsApp: **(d) Manual-only** | Weather has time_pattern; WhatsApp window expires |
| Transcript Pipeline | IMAP offline | No periodic check; relies on event trigger | **(d) Manual-only** | No polling fallback for missed emails |
| Transcript Pipeline | Shell script failure | wait_template + persistent_notification (45s timeout) | **(c) Watchdog** (partial) | `transcript_pipeline.yaml:105-126` |
| Work Actions Pipeline | AI classification fails | Persistent notification `action_pipeline_error` | **(c) Watchdog** (notification only) | Pipeline aborts safely; manual reprocessing required |
| PC Session | HASS.Agent offline | 150s grace → "off"; 30s periodic re-check | **(a) Self-heal** | `pc.yaml` — 3-sensor consensus with time_pattern |
| Driveway Detection | Camera offline | 10-minute periodic check; snapshot failure caught | **(a) Self-heal** | `dad_car_detection.py` — cron trigger every 10 min |
| Log Monitoring | Handler absent at startup | Reports 0 instead of unavailable; no health check | **(d) None found** | `log_errors.py:78-80` — false-healthy on handler absence |
| Server Theme | HA restart | Startup trigger sets Material You dark | **(b) Startup** | `frontend_theme_management.yaml` |
| Weather Forecast | API down | 15-minute periodic refresh | **(a) Self-heal** | `frontend_weather.yaml` — `time_pattern: minutes: /15` |
| Shopping - Auto-clear | Missed 05:00 trigger (restart) | No catch-up; completed items persist | **(d) Manual-only** | Next 05:00 fires on a subsequent day |
| Pet Fountain | Sensor stale | Hourly polling workaround forces refresh | **(a) Self-heal** | `pet_devices.yaml` — hourly `press` action |

---

## 8. Temporal and Concurrency Risks

| ID | Type | Components Involved | Overlap/Edge Case | Static Evidence | Runtime Verification |
|----|------|--------------------|--------------------|-----------------|---------------------|
| TC-01 | Concurrency | `lights.yaml:108` (Presence), `lights.yaml:133` (light_state_changed) | Both fire on manual switch press — mode:single drops one | `lights.yaml:291` — `mode: single`; shared `switch.sonoff_zbminil2_switch` | Enable debug logging; press switch during motion |
| TC-02 | Concurrency | `lights.yaml:130` (cycle /2min), `lights.yaml:108` (Presence) | Cycle fires during presence evaluation — mode:single drops cycle | `lights.yaml:291` — `mode: single`; both fire simultaneously | Monitor trace frequency during active presence |
| TC-03 | Temporal | `lights.yaml:72` | Lux oscillation near threshold 50; presence cycles cause rapid on/off | `lights.yaml:23` — `lux_threshold: 50` with no hysteresis | Monitor lux on overcast days near threshold |
| TC-04 | Temporal | `hourly_triggers.yaml`, `automations.yaml:305`, `transcript_pipeline.yaml:153`, `generate_images.yaml:457` | 5+ automations at 03:00; DST fall-back may double-fire; spring-forward skips 01:00-02:00 | All use fixed `platform: time at:` triggers | Check traces across DST transition dates |
| TC-05 | Temporal | `automations.yaml:158-165` | Camera night vision toggle at sunset/sunrise shifts during DST | `platform: sun` triggers | Check camera mode after DST |
| TC-06 | Concurrency | `whatsapp_config.yaml:545,668` | Multiple automations call `shell_command.append_whatsapp_message` with `>>` append; no file locking | `echo` with `>>` in shell_command; no mutex | Send rapid messages; check history file integrity |
| TC-07 | Temporal | `automations.yaml:36-37` | Floor 02 TTS activity alert: `(now() - trigger.from_state.last_changed).total_seconds() > 600` — if sensor goes unavailable then recovers, `last_changed` resets to now; 600s check passes immediately | `automations.yaml:36` — subtraction from last_changed | Make sensor unavailable, bring back, check TTS |
| TC-08 | Concurrency | `automations.yaml:2441-2512` | Presence Notification: `mode: parallel`, `max: 10` — rapid sensor changes fire 10 parallel REST calls | `mode: parallel`, `max: 10` | Cycle presence sensors rapidly |
| TC-09 | State Corruption | `c_whatsapp_auto_reply.yaml:53` | Message buffer `input_text` max 255 chars; rapid messages concatenated without size check | `input_text` default max; no length guard | Send 10+ rapid WhatsApp messages |
| TC-10 | Temporal | `lights.yaml:86-87` | Brightness uses `now().hour` — `{{ 10 if 1 <= h < 7 else 100 }}` — DST transition at 01:00 could cause unexpected brightness switch | `now().hour` in brightness template | Trigger presence at exact DST transition |
| TC-11 | Temporal | `configuration.yaml:24` | Timezone `Europe/London` — all `now()` calls DST-aware but `now().hour` comparisons in `lights.yaml:86,283`, `presence_desks.yaml:35,43`, `bed_state.yaml:44,81,82`, `tesco_sensors.yaml:67,107` shift by 1 hour during transitions | 9 locations with `now().hour` | Check behavior during DST transitions |

---

## 9. Risk Prioritisation

Top 10 risks ordered by (Severity x Likelihood x Inverse Detectability):

| Rank | Risk | Score Reasoning | Mitigation Gap |
|------|------|-----------------|----------------|
| 1 | **FM-01: Silent WhatsApp message loss** | High severity (message lost) x Medium likelihood (integration restarts) x Silent (user doesn't know) | No `continue_on_error`, no retry queue, no delivery confirmation. Unread cleared post-send. Unchanged since prior report. |
| 2 | **FM-03: Floor 01 raw sensor coupling** | High severity (floor dark) x Low likelihood (renames deliberate) x Silent (no error on trigger miss) | No abstraction layer; 7 hardcoded entity IDs with no validation. Unchanged since prior report. |
| 3 | **FM-02: WhatsApp contact KeyError** | High severity (all outbound halts) x Medium likelihood (sensor restart, contact change) x Semi-visible (trace error) | No guard on `contacts[selected_contact]` dict access at `whatsapp_config.yaml:538`. Unchanged. |
| 4 | **FM-22: Dispatch running boolean stuck** | Medium severity (dispatch permanently blocked) x Low likelihood (crash mid-task) x Silent (looks idle) | No TTL on `input_boolean.claude_dispatch_running`; no auto-reset watchdog. **NEW since prior report.** |
| 5 | **FM-12: Log monitoring blind spot** | Medium severity (monitoring failure) x Low likelihood (startup race) x Silent (shows 0 errors) | `log_errors.py:78-80` — handler absence produces false-healthy. Unchanged. |
| 6 | **FM-05: Bridge payload truncation** | Medium severity (malformed commands) x Medium likelihood (long AI payloads) x Silent (no indicator) | 244-char effective limit; `[:255]` truncation without warning. Unchanged. |
| 7 | **FM-18: Chatreader 5s scan hammering** | Medium severity (event loop pressure) x Medium likelihood (integration instability) x Visible (log spam) | No `command_timeout`; 5-second interval with no error backoff. **NEW finding.** |
| 8 | **FM-23: Dispatch watcher not persistent** | Medium severity (dispatch dead) x Medium likelihood (addon restarts) x Silent (tasks queue silently) | No heartbeat monitoring; no auto-restart; watcher dies silently. **NEW since prior report.** |
| 9 | **FM-09: Office lighting no startup recovery** | Medium severity (lights off after restart) x Medium likelihood (HA restarts ~monthly) x Semi-visible (dark office) | No `homeassistant_started` trigger; requires manual light switch. Unchanged. |
| 10 | **FM-24: Weather template TypeError** | Medium severity (sensor crashes) x Low likelihood (weather API stable) x Semi-visible (sensor unavailable) | `state_attr() | int` without None guard at `frontend_weather.yaml:58-76`. **NEW finding.** |

---

## 10. Cascade Trace Template

**Edge types to trace:**
- `entity_id` in trigger conditions (state, numeric_state, event)
- `entity_id` in automation/script conditions (state, template)
- `entity_id` in action targets or service data
- Helper inputs (template sensor source entities, group members)
- Template reads (`states('...')`, `state_attr(...)`, `is_state(...)`)
- Service call targets (`service: domain.action`, `target: entity_id`)
- Event data references (`trigger.event.data.*`)

**Search patterns:**
```bash
# Find all references to an entity
grep -rn "entity_id_here" packages/ automations.yaml scripts.yaml pyscript/ --include="*.yaml" --include="*.py"

# Find template reads
grep -rn "states\('entity_id_here'\)\|state_attr('entity_id_here'\)\|is_state('entity_id_here'" packages/ automations.yaml

# Find service call targets
grep -rn "entity_id: entity_id_here\|entity_id:.*entity_id_here" packages/ automations.yaml scripts.yaml
```

**Hop limit:** 3

**Stop conditions:**
- Edge leaves HA boundary (device command, notification, TTS)
- Edge is human-UI-only (dashboard display, no automation reads sensor)
- Edge repeats (cycle detected — flag as feedback loop)
- Edge target is a log/notification only (no downstream state change)

**To trace a new entity:**
1. Search for entity_id across packages/, automations.yaml, scripts.yaml, pyscript/
2. For each reference, classify edge type (trigger, condition, action, template read, service target)
3. For each consuming automation/template, identify ITS outputs (state changes, service calls, entity writes)
4. Recurse to hop limit or stop condition
5. Document path with file:line citations

---

## 11. Evidence Log

### Dependency Graph Construction

| Action | Files | Result |
|--------|-------|--------|
| Entity reference frequency analysis | All packages/, automations.yaml, scripts.yaml | `notify.alexa_media` (66 refs), `notify.mobile_app_phone_c` (42 refs), `media_player.cam_s_echo_show_8` (37 refs) top 3 by raw count |
| Occupancy cross-reference search | grep across packages/, automations.yaml | `presence_floor_02` (9 refs / 3 files), `presence_office` (5 refs / 4 files) |
| Lighting entity mapping | `lights.yaml`, `lights_office.yaml`, `auto_lights.yaml` | `timer.light_override` (5 refs), `switch.sonoff_zbminil2_switch` (6 refs), 7 raw Floor 01 sensors, `input_boolean.floor01_auto_active` (8 refs) |
| AI/Communication entity mapping | `claude_bridge.yaml`, `whatsapp_config.yaml`, `c_whatsapp_auto_reply.yaml`, `transcript_pipeline.yaml` | 5 external service dependencies; Bridge + Dispatch paths traced; new dispatch state corruption path identified |
| Device/Server entity mapping | `cameras.yaml`, `curtains.yaml`, `pc.yaml`, `configuration.yaml` | `chatreader` 5s scan interval identified; recorder config analyzed |
| Recorder config analysis | `configuration.yaml:69-102` | 7-day retention, 30s commit, 12 entity_glob excludes, 10 entity excludes, `call_service` event excluded |
| New since prior report | `claude_bridge.yaml` (dispatch section), `claude_session_cleanup.yaml`, `configuration.yaml` (chatreader) | 3 new failure modes (FM-22, FM-23, FM-18); 1 new cascade map (4.7) |

### Cascade Traces Performed

| Origin | Depth Reached | Hops Traced | Stop Reason |
|--------|--------------|-------------|-------------|
| `sensor.whatsapp_contacts_config` | 3 | 4 edges | Automation halt (KeyError) and message drop |
| `binary_sensor.presence_floor_02` | 3 | 5 edges | Leaves HA boundary (TTS), device command |
| Raw Floor 01 sensors | 3 | 5 edges | Triggers stop firing (silent) |
| `todo.claude_bridge` + `todo.claude_code_tasks` | 2 | 4 edges | Condition blocks relay; dispatch blocked |
| `sun.sun` | 3 | 5 edges | Multiple downstream targets (lights, covers) |
| `ha_text_ai` service | 2 | 4 edges | Service call error halts automation |
| Claude Dispatch watcher | 2 | 3 edges | Boolean stuck; dispatch permanently blocked |

### Failure Mode Searches by Lens

| Lens | Patterns Searched | Findings |
|------|-------------------|----------|
| Dependency Concentration | Entity in-degree counts; hidden hub analysis | 12 high-in-degree entities; `notify.alexa_media` highest raw count (66) |
| Cascade Paths | 7 cascade origins traced to depth 3 | 7 cascade maps with citations |
| Sensor Failure Modes | `default()`, `availability`, `unavailable`/`unknown` guards | 14 unhandled failure signatures |
| Temporal Edge Cases | DST, midnight, `now().hour` comparisons | 6 temporal risks; 9 `now().hour` locations across 5 files |
| Concurrent Execution | `mode:` settings, shared state, overlapping triggers | 5 concurrency risks including dispatch boolean |
| State Corruption | Input helper reset paths, invariant assumptions | Bridge truncation, dispatch boolean stuck, message buffer overflow, log_errors false-healthy |
| External Dependency | Integration-specific failure signatures | WhatsApp (silent), ha_text_ai (2/3 unhandled), IMAP (silent), chatreader (no timeout), Govee (fire-and-forget) |
| Resource Exhaustion | Recorder config, scan intervals | chatreader 5s scan, 5+ 03:00 automations |
| Recovery Paths | Startup triggers, periodic refresh, watchdogs | 9 subsystems manual-only; 6 self-heal; 3 startup; 2 partial watchdog |

### Files Examined

68 files across: `packages/occupancy/` (6), `packages/lights/` (5), `packages/ai/` (8), `packages/communication/` (6), `packages/device/` (9), `packages/server/` (14), `packages/time/` (4), `packages/travel/` (2), `packages/weather/` (1), `packages/shopping/` (2), `packages/health/` (2), `packages/work/` (2), `pyscript/` (14), `configuration.yaml`, `automations.yaml`, `scripts.yaml`.

### Files Expected but Not Found

| Expected | Reason | Impact |
|----------|--------|--------|
| `frigate.yml` | Documented in CLAUDE.md but actual file is `frigate_config_v2.yml` | Intel Report I-02; no impact on failure analysis |

### Delta from Prior Report (2026-03-06)

| Change | Detail |
|--------|--------|
| **New failure modes** | FM-18 (chatreader scan), FM-22 (dispatch running stuck), FM-23 (dispatch watcher not persistent), FM-24 (weather TypeError), FM-25 (03:00 DST clustering) |
| **New cascade map** | 4.7: Claude Dispatch watcher chain |
| **Removed** | FM-12 (prior: script.room_alert missing) — not re-verified; deferred to Intel Report |
| **Unchanged risks** | FM-01 through FM-08, FM-12 (log monitoring) — all persist unmitigated |
| **Upgraded entities analysed** | 28 → 32 |
| **HA version** | 2026.3.0 → 2026.4.2 |
| **Unavailable entities** | Trend: 281 → 150 (improved by 47%) |

---

*Generated by Claude Code — Adversarial Reliability Analysis*
*Analysis timestamp: 2026-04-13 ~11:30 UTC*
*Prior report: docs/reports/failure-mode/FAILURE_MODE_REPORT_2026-03-06.md*
