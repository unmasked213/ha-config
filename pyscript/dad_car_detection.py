# /config/pyscript/dad_car_detection.py
"""
Detect dad's white car presence on the driveway.

Primary: Image analysis (fast, free) - looks for:
  1. High contrast edges (max_delta) - car creates sharp white/dark boundaries
  2. White pixel percentage - white car roof is distinctive
  3. Edge density - count of high-contrast pixels (robust to noise)

Fallback: OpenAI Vision API (accurate, ~$0.002/call) - for state transitions only

Triggers:
  - C10 vehicle detection (daytime only)
  - Periodic check every 10 minutes (daytime only)

Reliability features:
  - Weather-aware threshold adjustment
  - Consecutive reading requirement before state change
  - AI only called on potential state transitions (cost optimization)
"""

import os
import base64
import json

# Configuration
CAMERA_ENTITY = "camera.c10_snapshots_clear"
SNAPSHOT_PATH = "/config/www/c10_snapshot_temp.jpg"
RESULT_ENTITY = "input_boolean.dad_car_home"

# Threshold entities (configurable via UI)
MAX_DELTA_THRESHOLD_ENTITY = "input_number.dad_car_max_delta_threshold"  # Default: 150
WHITE_PCT_THRESHOLD_ENTITY = "input_number.dad_car_white_pct_threshold"  # Default: 8%
RAIN_DELTA_THRESHOLD_ENTITY = "input_number.dad_car_rain_delta_threshold"  # Default: 60

# AI fallback config
AI_ENABLED_ENTITY = "input_boolean.dad_car_ai_enabled"
AI_CALL_COUNT_ENTITY = "counter.dad_car_ai_calls"
DEBUG_ENTITY = "input_text.dad_car_last_detection"

# Crop zone (percentage of image dimensions)
# x1, y1, x2, y2 - targeting the brick driveway area
CROP_ZONE_PCT = (0.25, 0.75, 0.55, 0.95)

# White pixel threshold (brightness value)
WHITE_BRIGHTNESS = 180

# Edge density threshold (pixels with delta > this count as edges)
EDGE_DELTA_THRESHOLD = 50

# Consecutive readings required before state change
CONSECUTIVE_REQUIRED = 2

# Track consecutive readings (in-memory state)
_consecutive_readings = {"count": 0, "last_result": None}

# Periodic check interval (minutes)
PERIODIC_CHECK_MINUTES = 10


@pyscript_executor
def _get_secret(secret_name: str) -> str:
    """Read a secret from secrets.yaml."""
    try:
        import yaml
        with open("/config/secrets.yaml", "r") as f:
            secrets = yaml.safe_load(f)
        return secrets.get(secret_name, "")
    except Exception as e:
        # Can't use log here since we're in executor
        return ""


def _get_weather_adjustment() -> dict:
    """
    Get threshold adjustments based on current weather.
    Returns multipliers for thresholds (< 1.0 = more lenient).
    """
    adjustment = {"max_delta": 1.0, "white_pct": 1.0, "description": "normal"}

    # Try to get weather entity state - use actual entity names
    weather_state = None
    for entity in ["weather.pirateweather", "weather.forecast_home"]:
        try:
            weather_state = state.get(entity)
            if weather_state:
                break
        except Exception:
            continue

    if not weather_state:
        return adjustment

    # Conditions that reduce visibility/contrast
    poor_conditions = ["rainy", "pouring", "snowy", "fog", "hail", "lightning-rainy"]
    moderate_conditions = ["cloudy", "partlycloudy", "windy"]

    weather_lower = weather_state.lower()

    # Check for poor conditions (pyscript doesn't support generator expressions)
    is_poor = False
    for cond in poor_conditions:
        if cond in weather_lower:
            is_poor = True
            break

    is_moderate = False
    for cond in moderate_conditions:
        if cond in weather_lower:
            is_moderate = True
            break

    if is_poor:
        # Significantly reduce thresholds in poor weather
        adjustment["max_delta"] = 0.7
        adjustment["white_pct"] = 0.7
        adjustment["description"] = f"poor ({weather_state})"
    elif is_moderate:
        # Slightly reduce thresholds in moderate conditions
        adjustment["max_delta"] = 0.85
        adjustment["white_pct"] = 0.85
        adjustment["description"] = f"moderate ({weather_state})"
    else:
        adjustment["description"] = f"good ({weather_state})"

    return adjustment


@pyscript_executor
def _analyze_image(path: str, thresholds: dict) -> dict:
    """Analyze the cropped zone for car presence."""
    from PIL import Image
    try:
        img = Image.open(path)
        w, h = img.size

        x1 = int(w * CROP_ZONE_PCT[0])
        y1 = int(h * CROP_ZONE_PCT[1])
        x2 = int(w * CROP_ZONE_PCT[2])
        y2 = int(h * CROP_ZONE_PCT[3])

        zone = img.crop((x1, y1, x2, y2)).convert('L')
        zw, zh = zone.size
        pixels = list(zone.getdata())

        def get_pixel(x, y):
            if 0 <= x < zw and 0 <= y < zh:
                return pixels[y * zw + x]
            return 0

        # Calculate max brightness delta and edge density
        max_delta = 0
        edge_count = 0
        total_comparisons = 0

        for y in range(zh):
            for x in range(zw - 1):
                delta = abs(get_pixel(x, y) - get_pixel(x + 1, y))
                max_delta = max(max_delta, delta)
                if delta > EDGE_DELTA_THRESHOLD:
                    edge_count += 1
                total_comparisons += 1

        for y in range(zh - 1):
            for x in range(zw):
                delta = abs(get_pixel(x, y) - get_pixel(x, y + 1))
                max_delta = max(max_delta, delta)
                if delta > EDGE_DELTA_THRESHOLD:
                    edge_count += 1
                total_comparisons += 1

        # Edge density as percentage
        edge_density = (edge_count / total_comparisons) * 100 if total_comparisons > 0 else 0

        # Calculate white pixel percentage (car roof is white)
        white_count = sum(1 for p in pixels if p > WHITE_BRIGHTNESS)
        white_pct = (white_count / len(pixels)) * 100

        # Calculate average brightness
        avg_brightness = sum(pixels) / len(pixels)

        # Get thresholds (already weather-adjusted by caller)
        max_delta_thresh = thresholds.get("max_delta", 150)
        white_pct_thresh = thresholds.get("white_pct", 8.0)
        rain_delta_thresh = thresholds.get("rain_delta", 60)

        # Detection logic with edge density
        # Edge density > 0.5% indicates significant structure (car creates many edges)
        # Calibrated from real data: car present = 0.71%, car absent = lower
        has_significant_edges = edge_density > 0.5

        # Check for low-visibility conditions FIRST (rain/fog detection)
        # Low max_delta indicates poor visibility - don't trust other metrics
        is_low_visibility = max_delta < rain_delta_thresh

        if is_low_visibility:
            # Poor visibility conditions - can't reliably detect
            # This catches rain BEFORE white_pct can falsely trigger on wet pavement
            car_present = None
            confidence = "low_visibility"
            needs_ai = True
        elif max_delta > max_delta_thresh and white_pct > white_pct_thresh:
            # High contrast edge AND significant white - definitely a white car
            car_present = True
            confidence = "high"
            needs_ai = False
        elif max_delta > max_delta_thresh:
            # High contrast but low white - could be brick/road edge, not car
            # Defer to AI for confirmation
            car_present = None
            confidence = "uncertain_edge"
            needs_ai = True
        elif white_pct > white_pct_thresh and has_significant_edges:
            # Significant white area with edge structure - likely car
            car_present = True
            confidence = "high"
            needs_ai = False
        elif white_pct > white_pct_thresh:
            # Significant white area but no edge structure - less certain
            # Without edges, could be wet pavement reflection - defer to AI
            car_present = None
            confidence = "uncertain_white"
            needs_ai = True
        elif has_significant_edges:
            # Some edges present but low white - uncertain
            car_present = None
            confidence = "uncertain"
            needs_ai = True
        else:
            # Low contrast, low white, few edges - no car
            car_present = False
            confidence = "medium"
            needs_ai = False  # Confident enough when all metrics agree

        return {
            "car_present": car_present,
            "max_delta": max_delta,
            "white_pct": round(white_pct, 1),
            "edge_density": round(edge_density, 2),
            "avg_brightness": round(avg_brightness, 0),
            "confidence": confidence,
            "needs_ai": needs_ai,
            "thresholds": thresholds,
            "success": True
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@pyscript_executor
def _call_vision_api(image_path: str, api_key: str) -> dict:
    """Call OpenAI Vision API to analyze the CROPPED image."""
    import urllib.request
    import ssl
    from PIL import Image
    import io

    try:
        # Crop the image to the detection zone before sending to AI
        img = Image.open(image_path)
        w, h = img.size
        x1 = int(w * CROP_ZONE_PCT[0])
        y1 = int(h * CROP_ZONE_PCT[1])
        x2 = int(w * CROP_ZONE_PCT[2])
        y2 = int(h * CROP_ZONE_PCT[3])
        cropped = img.crop((x1, y1, x2, y2))

        # Convert cropped image to base64
        buffer = io.BytesIO()
        cropped.save(buffer, format="JPEG", quality=85)
        image_data = base64.b64encode(buffer.getvalue()).decode("utf-8")

        mime_type = "image/jpeg" if image_path.lower().endswith(".jpg") else "image/png"

        prompt = """This is a cropped view of a brick driveway.

Is there a WHITE CAR visible in this image?

Respond with ONLY a JSON object (no markdown):
{"car_present": true/false, "confidence": "high"/"medium"/"low", "reason": "brief explanation"}

If you only see brick/pavement with no car, respond car_present: false.
If you cannot determine due to weather/lighting, use confidence "low"."""

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_data}",
                                "detail": "low"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 100
        }

        data = json.dumps(payload).encode("utf-8")

        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=data,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
        )

        ctx = ssl.create_default_context()

        with urllib.request.urlopen(req, timeout=30, context=ctx) as response:
            result = json.loads(response.read().decode("utf-8"))

        content = result["choices"][0]["message"]["content"]

        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        ai_result = json.loads(content.strip())

        return {
            "success": True,
            "car_present": ai_result.get("car_present"),
            "confidence": ai_result.get("confidence", "medium"),
            "reason": ai_result.get("reason", ""),
            "source": "ai"
        }

    except Exception as e:
        return {"success": False, "error": str(e), "source": "ai"}


@service("pyscript.check_dad_car")
async def check_dad_car(force: bool = False, skip_ai: bool = False):
    """
    Check if dad's car is on the driveway.

    Args:
        force: If True, run even if sun is below horizon
        skip_ai: If True, skip AI fallback even if enabled
    """
    global _consecutive_readings

    if not force:
        sun_state = state.get("sun.sun")
        if sun_state != "above_horizon":
            log.info("dad_car_detection: Skipping - sun below horizon")
            return {"skipped": True, "reason": "nighttime"}

    try:
        await hass.services.async_call(
            "camera",
            "snapshot",
            {"entity_id": CAMERA_ENTITY, "filename": SNAPSHOT_PATH},
            blocking=True
        )
    except Exception as e:
        log.error(f"dad_car_detection: Failed to take snapshot: {e}")
        return {"success": False, "error": f"snapshot failed: {e}"}

    await task.sleep(0.5)

    # Get base thresholds
    base_thresholds = {
        "max_delta": float(state.get(MAX_DELTA_THRESHOLD_ENTITY) or 150),
        "white_pct": float(state.get(WHITE_PCT_THRESHOLD_ENTITY) or 8.0),
        "rain_delta": float(state.get(RAIN_DELTA_THRESHOLD_ENTITY) or 60),
    }

    # Apply weather adjustment
    weather_adj = _get_weather_adjustment()
    thresholds = {
        "max_delta": base_thresholds["max_delta"] * weather_adj["max_delta"],
        "white_pct": base_thresholds["white_pct"] * weather_adj["white_pct"],
        "rain_delta": base_thresholds["rain_delta"],  # Don't adjust rain threshold
    }

    # Analyze image
    result = await _analyze_image(SNAPSHOT_PATH, thresholds)

    if not result.get("success"):
        log.error(f"dad_car_detection: Analysis failed: {result.get('error')}")
        _cleanup_snapshot()
        return result

    car_present = result["car_present"]
    confidence = result["confidence"]
    needs_ai = result["needs_ai"]
    detection_source = "local"

    # Get current state for comparison
    current_state = state.get(RESULT_ENTITY)
    current_car_present = current_state == "on"

    # AI fallback - only call when:
    # 1. AI is enabled
    # 2. Local detection is uncertain OR local result would change state
    # 3. Not explicitly skipped
    ai_enabled = state.get(AI_ENABLED_ENTITY) == "on"
    would_change_state = car_present is not None and car_present != current_car_present

    should_call_ai = (
        ai_enabled and
        not skip_ai and
        (needs_ai or would_change_state)
    )

    if should_call_ai:
        log.info(
            f"dad_car_detection: Calling AI (uncertain={needs_ai}, would_change={would_change_state}) "
            f"[weather: {weather_adj['description']}] "
            f"(max_delta={result['max_delta']}, white%={result['white_pct']}, edge%={result.get('edge_density', 0)})"
        )

        api_key = await _get_secret("openai_api_key")
        if api_key:
            ai_result = await _call_vision_api(SNAPSHOT_PATH, api_key)

            if ai_result.get("success"):
                try:
                    await hass.services.async_call(
                        "counter", "increment",
                        {"entity_id": AI_CALL_COUNT_ENTITY},
                        blocking=True
                    )
                except:
                    pass

                car_present = ai_result["car_present"]
                confidence = f"ai_{ai_result['confidence']}"
                detection_source = "ai"

                log.info(
                    f"dad_car_detection: AI result - car_present={car_present}, "
                    f"confidence={ai_result['confidence']}, reason={ai_result.get('reason')}"
                )
            else:
                log.warning(f"dad_car_detection: AI call failed: {ai_result.get('error')}")
        else:
            log.warning("dad_car_detection: AI enabled but no API key found")

    _cleanup_snapshot()

    # Handle uncertain result
    if car_present is None:
        _consecutive_readings = {"count": 0, "last_result": None}
        log.info(
            f"dad_car_detection: Uncertain, keeping state={current_state} "
            f"[weather: {weather_adj['description']}] "
            f"(max_delta={result['max_delta']}, white%={result['white_pct']}, edge%={result.get('edge_density', 0)}, source={detection_source})"
        )
        # Write debug info
        debug_info = f"d={result['max_delta']} w={result['white_pct']}% e={result.get('edge_density', 0)}% conf={confidence} src={detection_source} result=UNCERTAIN(kept {current_state})"
        try:
            state.set(DEBUG_ENTITY, debug_info)
        except:
            pass
        return {
            "success": True,
            "car_present": None,
            "state_changed": False,
            "reason": "uncertain",
            "max_delta": result["max_delta"],
            "white_pct": result["white_pct"],
            "edge_density": result.get("edge_density", 0),
            "confidence": confidence,
            "source": detection_source,
            "weather": weather_adj["description"]
        }

    # Consecutive reading logic
    new_state = "on" if car_present else "off"

    if car_present == _consecutive_readings.get("last_result"):
        _consecutive_readings["count"] += 1
    else:
        _consecutive_readings = {"count": 1, "last_result": car_present}

    consecutive_count = _consecutive_readings["count"]

    # Only change state if we have enough consecutive readings
    # OR if confidence is high (from AI or strong local detection)
    is_high_confidence = confidence in ["high", "ai_high"]
    can_change_state = consecutive_count >= CONSECUTIVE_REQUIRED or is_high_confidence

    if current_state != new_state:
        if can_change_state:
            await hass.services.async_call(
                "input_boolean",
                f"turn_{new_state}",
                {"entity_id": RESULT_ENTITY},
                blocking=True
            )
            log.info(
                f"dad_car_detection: State changed to {new_state} [{confidence}] "
                f"(consecutive={consecutive_count}, weather={weather_adj['description']}, "
                f"max_delta={result['max_delta']}, white%={result['white_pct']}, edge%={result.get('edge_density', 0)}, source={detection_source})"
            )
            state_changed = True
            # Reset consecutive counter after state change
            _consecutive_readings = {"count": 0, "last_result": None}
        else:
            log.info(
                f"dad_car_detection: Detected {new_state} but waiting for more readings "
                f"(consecutive={consecutive_count}/{CONSECUTIVE_REQUIRED}, confidence={confidence})"
            )
            state_changed = False
    else:
        log.debug(
            f"dad_car_detection: State unchanged ({new_state}) [{confidence}] "
            f"(max_delta={result['max_delta']}, white%={result['white_pct']}, edge%={result.get('edge_density', 0)}, source={detection_source})"
        )
        state_changed = False
        # Reset consecutive counter when state matches
        _consecutive_readings = {"count": 0, "last_result": None}

    # Write debug info to entity for visibility
    debug_info = f"d={result['max_delta']} w={result['white_pct']}% e={result.get('edge_density', 0)}% conf={confidence} src={detection_source} result={car_present}"
    try:
        state.set(DEBUG_ENTITY, debug_info)
    except:
        pass

    return {
        "success": True,
        "car_present": car_present,
        "state_changed": state_changed,
        "consecutive_count": consecutive_count,
        "max_delta": result["max_delta"],
        "white_pct": result["white_pct"],
        "edge_density": result.get("edge_density", 0),
        "confidence": confidence,
        "source": detection_source,
        "weather": weather_adj["description"]
    }


def _cleanup_snapshot():
    """Remove temporary snapshot file."""
    try:
        if os.path.exists(SNAPSHOT_PATH):
            os.remove(SNAPSHOT_PATH)
    except:
        pass


@time_trigger(f"cron(0/{PERIODIC_CHECK_MINUTES} * * * *)")
@state_active("sun.sun == 'above_horizon'")
async def periodic_check():
    """Periodic check every N minutes during daytime to prevent stale state."""
    log.debug("dad_car_detection: Periodic check triggered")

    # First try without AI to save costs
    result = await check_dad_car(force=True, skip_ai=True)

    # If uncertain and state has been unchanged for a while, allow AI to break stale state
    if result.get("success") and result.get("car_present") is None:
        # Check how long current state has been unchanged
        current_state_entity = state.get(RESULT_ENTITY)
        last_changed = state.getattr(RESULT_ENTITY).get("last_changed")

        if last_changed:
            import datetime
            try:
                # last_changed is ISO format string
                if isinstance(last_changed, str):
                    last_changed_dt = datetime.datetime.fromisoformat(last_changed.replace('Z', '+00:00'))
                else:
                    last_changed_dt = last_changed
                now = datetime.datetime.now(datetime.timezone.utc)
                minutes_unchanged = (now - last_changed_dt).total_seconds() / 60

                # If state unchanged for over 30 minutes and we're uncertain, use AI
                if minutes_unchanged > 30:
                    log.info(
                        f"dad_car_detection: Periodic check uncertain, state unchanged for {minutes_unchanged:.0f}m, "
                        f"calling AI to verify"
                    )
                    result = await check_dad_car(force=True, skip_ai=False)
            except Exception as e:
                log.warning(f"dad_car_detection: Could not check state age: {e}")

    if result.get("success"):
        if result.get("state_changed"):
            log.info(
                f"dad_car_detection: Periodic check changed state - car_present={result.get('car_present')}"
            )


@state_trigger("binary_sensor.c10_vehicle == 'on'")
@state_active("sun.sun == 'above_horizon'")
async def on_vehicle_detected():
    """Trigger car check when C10 detects a vehicle (daytime only)."""
    await task.sleep(3)

    log.info("dad_car_detection: Vehicle detected, checking for dad's car")
    result = await check_dad_car(force=True)

    if result.get("success"):
        log.info(
            f"dad_car_detection: Check complete - car_present={result.get('car_present')}, "
            f"consecutive={result.get('consecutive_count', 0)}, source={result.get('source')}"
        )


@state_trigger("binary_sensor.c10_vehicle == 'off'")
@state_active("sun.sun == 'above_horizon'")
async def on_vehicle_left():
    """Re-check when vehicle detection turns off (car may have left)."""
    await task.sleep(5)

    log.info("dad_car_detection: Vehicle detection off, re-checking")
    await check_dad_car(force=True)
