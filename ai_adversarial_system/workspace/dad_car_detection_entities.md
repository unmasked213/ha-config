# Dad's Car Detection — Entity Reference

> All entities that contribute to the car detection system

---

## Core Entities

### `input_boolean.dad_car_home`
**Primary result entity** — the source of truth for car presence.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | string | `on`, `off` | `on` = car is on driveway, `off` = car is absent |

---

### `binary_sensor.dad_car_on_driveway`
**User-facing template sensor** — wraps input_boolean with additional context.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | string | `on`, `off` | Mirrors `input_boolean.dad_car_home` |
| `detection_method` | string | `"contrast + white%"` | Always this fixed value |
| `ai_enabled` | string | `"True"`, `"False"` | Whether AI fallback is active |
| `ai_calls_today` | string | `"0"`, `"1"`, `"2"`, ... | Number of AI API calls made today |
| `camera` | string | `"camera.c10_snapshots_clear"` | Source camera entity ID |
| `note` | string | `"Detection paused (nighttime)"`, `"Local + AI fallback active"`, `"Local detection only"` | Current operational status |

---

### `input_text.dad_car_last_detection`
**Debug output** — shows values from the most recent detection run.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | string | See format below | Formatted debug string |

**State format:** `d=<delta> w=<white>% e=<edge>% conf=<confidence> src=<source> result=<result>`

| Component | Format | Possible Values | Description |
|-----------|--------|-----------------|-------------|
| `d` | integer | `0` - `255` (typical: `60`-`220`) | Max brightness delta (contrast). Car present ≈ 150-220, absent ≈ 60-120 |
| `w` | float | `0.0%` - `100.0%` (typical: `0.5%`-`20%`) | White pixel percentage. Car present ≈ 10-18%, absent ≈ 1-5% |
| `e` | float | `0.0%` - `5.0%` (typical: `0.01%`-`1%`) | Edge density. Car present ≈ 0.5-1%, absent ≈ 0.01-0.3% |
| `conf` | string | `high`, `medium`, `low_visibility`, `uncertain_white`, `uncertain_edge`, `ai_high`, `ai_medium`, `ai_low` | Confidence level of detection |
| `src` | string | `local`, `ai` | `local` = image analysis only, `ai` = OpenAI Vision was called |
| `result` | string | `True`, `False`, `UNCERTAIN(kept on)`, `UNCERTAIN(kept off)` | Final detection result |

---

## Configuration Entities

### `input_number.dad_car_max_delta_threshold`
**Contrast threshold** — car creates sharp white/dark boundaries.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | float | `100.0` - `200.0` (default: `150.0`) | Current threshold value |
| `min` | float | `100` | Minimum allowed value |
| `max` | float | `200` | Maximum allowed value |
| `step` | float | `5` | Slider increment |
| `mode` | string | `slider` | UI display mode |

**Calibration:** Car present ≈ 178-219, Car absent ≈ 115

---

### `input_number.dad_car_white_pct_threshold`
**White pixel threshold** — white car roof shows as bright pixels.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | float | `5.0` - `15.0` (default: `8.0`) | Current threshold percentage |
| `unit_of_measurement` | string | `"%"` | Unit label |
| `min` | float | `5` | Minimum allowed value |
| `max` | float | `15` | Maximum allowed value |
| `step` | float | `0.5` | Slider increment |
| `mode` | string | `slider` | UI display mode |

**Calibration:** Car present ≈ 10-18%, Car absent ≈ 1-5%

---

### `input_number.dad_car_rain_delta_threshold`
**Rain/fog detection** — low contrast indicates poor visibility.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | float | `30.0` - `100.0` (default: `60.0`) | Current threshold value |
| `min` | float | `30` | Minimum allowed value |
| `max` | float | `100` | Maximum allowed value |
| `step` | float | `5` | Slider increment |
| `mode` | string | `slider` | UI display mode |

**Usage:** If max_delta < this threshold → low visibility → uncertain → defers to AI

---

### `input_boolean.dad_car_ai_enabled`
**AI fallback toggle** — enables/disables OpenAI Vision API calls.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | string | `on`, `off` | `on` = AI called when uncertain, `off` = local only |

---

## Tracking Entities

### `counter.dad_car_ai_calls`
**API call counter** — tracks AI usage for cost monitoring.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | integer | `0`, `1`, `2`, ... (resets daily or manually) | Number of AI calls since last reset |
| `initial` | integer | `0` | Starting value after reset |
| `step` | integer | `1` | Increment per call |

**Cost:** ~$0.002 per call (gpt-4o-mini with low detail image)

---

## Trigger Entities

### `button.check_dad_car_now`
**Manual trigger** — runs detection immediately.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | timestamp | ISO 8601 datetime or `unknown` | Last pressed time |

**Action:** Calls `pyscript.check_dad_car` with `force: true`

---

### `binary_sensor.c10_vehicle`
**Frigate vehicle detection** — triggers automatic detection.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | string | `on`, `off` | `on` = vehicle currently detected in camera view |

**Triggers:**
- `on` → waits 3s, then runs detection
- `off` → waits 5s, then re-checks (car may have left)

---

### `sun.sun`
**Day/night detection** — pauses detection at night.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | string | `above_horizon`, `below_horizon` | Detection only runs when `above_horizon` |
| `elevation` | float | `-90.0` to `90.0` | Sun angle in degrees |
| `rising` | boolean | `true`, `false` | Whether sun is rising or setting |

---

## Source Entities

### `camera.c10_snapshots_clear`
**Source camera** — provides snapshots for analysis.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | string | `idle`, `streaming`, `recording` | Camera status |
| `entity_picture` | string | URL path | Current snapshot URL |

**Snapshot path:** `/config/www/c10_snapshot_temp.jpg` (deleted after analysis)

---

### `weather.pirateweather`
**Primary weather source** — adjusts thresholds based on conditions.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | string | `sunny`, `clear-night`, `cloudy`, `partlycloudy`, `rainy`, `pouring`, `snowy`, `fog`, `hail`, `lightning`, `lightning-rainy`, `windy`, `windy-variant`, `exceptional` | Current weather condition |
| `temperature` | float | `-40` to `50` (°C) | Current temperature |
| `humidity` | integer | `0` to `100` (%) | Current humidity |

**Threshold adjustments based on state:**
| Condition | Multiplier | States |
|-----------|------------|--------|
| Poor | × 0.7 | `rainy`, `pouring`, `snowy`, `fog`, `hail`, `lightning-rainy` |
| Moderate | × 0.85 | `cloudy`, `partlycloudy`, `windy` |
| Good | × 1.0 | All others |

---

### `weather.forecast_home`
**Fallback weather source** — used if pirateweather unavailable.

| Field | Format | Possible Values | Description |
|-------|--------|-----------------|-------------|
| state | string | Same as `weather.pirateweather` | Current weather condition |

---

## Services

### `pyscript.check_dad_car`
**Main detection service**

| Parameter | Type | Possible Values | Default | Description |
|-----------|------|-----------------|---------|-------------|
| `force` | bool | `true`, `false` | `false` | If `true`, runs even at night |
| `skip_ai` | bool | `true`, `false` | `false` | If `true`, never calls AI |

**Return dict fields:**

| Field | Type | Possible Values | Description |
|-------|------|-----------------|-------------|
| `success` | bool | `true`, `false` | Whether detection completed |
| `car_present` | bool/null | `true`, `false`, `null` | Detection result (`null` = uncertain) |
| `state_changed` | bool | `true`, `false` | Whether input_boolean was updated |
| `max_delta` | int | `0`-`255` | Contrast value measured |
| `white_pct` | float | `0.0`-`100.0` | White pixel percentage |
| `edge_density` | float | `0.0`-`5.0` | Edge density percentage |
| `confidence` | string | `high`, `medium`, `low_visibility`, `uncertain_white`, `uncertain_edge`, `ai_high`, `ai_medium`, `ai_low` | Confidence level |
| `source` | string | `local`, `ai` | Detection method used |
| `weather` | string | e.g., `"good (sunny)"`, `"poor (rainy)"` | Weather adjustment applied |
| `skipped` | bool | `true` | Only present if skipped (nighttime) |
| `reason` | string | `"nighttime"`, `"uncertain"` | Why skipped or uncertain |
| `error` | string | Error message | Only present on failure |

---

## Files

| Path | Purpose |
|------|---------|
| `/config/pyscript/dad_car_detection.py` | Detection logic, AI integration, triggers |
| `/config/packages/device/driveway_detection.yaml` | Entity definitions, template sensors |

---

## Detection Logic Flow

```
1. Take snapshot from camera
2. Crop to CROP_ZONE_PCT (0.25, 0.75, 0.55, 0.95)
3. Analyze cropped image:
   - Calculate max_delta (contrast)
   - Calculate white_pct (bright pixels)
   - Calculate edge_density (structure)
4. Apply weather-adjusted thresholds
5. Decision tree:
   - delta < rain_threshold → uncertain (AI if enabled)
   - delta > threshold AND white > threshold → car present (high confidence)
   - delta > threshold only → uncertain edge (AI if enabled)
   - white > threshold AND edges → car present
   - white > threshold only → uncertain white (AI if enabled)
   - else → car absent
6. If AI called: send CROPPED image with simplified prompt
7. Update state after 2 consecutive matching readings (or immediately if high confidence)
```

---
*Generated: 2026-02-03*
