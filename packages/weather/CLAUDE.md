# CLAUDE - Weather Domain

> **Scope:** Forecasts, AI clothing suggestions
> **Last reviewed:** 2026-02
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

Aggregates Pirate Weather forecast data into structured 24-hour and 7-day arrays, generates human-readable weather descriptions (temperature, wind, precipitation categories), and provides an AI-powered hourly clothing recommendation via the ha_text_ai integration.

---

## Structure

| File | Purpose |
|------|---------|
| `frontend_weather.yaml` | AI clothing recommendation (hourly), 24h forecast arrays (temperature, rain, wind), 7-day forecast arrays, human-readable weather descriptions |

---

## Key Components

### AI Clothing Suggestion

`Weather Grab Recommendation` automation:
- Triggers hourly + on HA start (with 5-minute startup delay)
- Calls `ha_text_ai.ask_question` with weather context (condition, temp, humidity, wind, clouds, 24h forecast)
- Prompt asks for a casual 10-word-or-less recommendation
- Result stored in `input_text.ai_weather_clothing_suggestion` (max 255 chars)
- **Instance:** `sensor.ha_text_ai_weather_summary`

### Forecast Data Structure

Forecast sensors store 24h or 7d arrays in `values` attributes as JSON:
- `sensor.pirateweather_today_apparent_temperature` -- 25 hourly values (0h-24h)
- `sensor.pirateweather_today_precip_accumulation` -- 25 hourly values
- `sensor.pirateweather_today_wind_speed` -- 25 hourly values
- `sensor.pirateweather_week_high_temperature` -- 8 daily values (0d-7d)
- `sensor.pirateweather_week_precip_accumulation` -- 8 daily values
- `sensor.pirateweather_week_wind_speed` -- 8 daily values

All reference individual Pirate Weather hourly/daily sensors (`sensor.pirateweather_*_{N}h` / `sensor.pirateweather_*_{N}d`).

### Weather Description Sensors

Human-readable categorisations:
- **Temperature:** Glacial (<=\-5C) -> Freezing -> Cold -> Cool -> Pleasant -> Hot -> Very Hot -> Infernal (>32C)
- **Wind:** Calm (<5) -> Breezy (<15) -> Windy (<30) -> Gale (<45) -> Storm (>=45 km/h)
- **Precipitation:** Clear (0) -> Drizzle (<1mm) -> Light rain (<2.5mm) -> Heavy rain (<10mm) -> Monsoon (>=10mm)

### Key Entities

- `input_text.ai_weather_clothing_suggestion` -- AI clothing recommendation text
- `sensor.ha_text_ai_weather_summary` -- ha_text_ai instance
- `sensor.pirateweather_today_*` -- 24h forecast arrays
- `sensor.pirateweather_week_*` -- 7-day forecast arrays
- `weather.pirateweather` -- main weather entity

---

## Development Workflows

- AI clothing suggestion can be tested by triggering the `Weather Grab Recommendation` automation manually and checking `input_text.ai_weather_clothing_suggestion`.
- Forecast array sensors can be validated by inspecting the `values` attribute (should contain JSON arrays of the expected length: 25 for hourly, 8 for daily).
- Weather description thresholds are hardcoded in templates; verify category boundaries when modifying.

---

## Conventions for AI Assistants

### Forecast Sensor Pattern

All forecast sensors follow the naming pattern `sensor.pirateweather_{today|week}_{metric}` and store data in a `values` attribute as JSON arrays. Do not look for the data in the sensor state.

### Coupling Warnings

**This domain depends on:**
- Pirate Weather integration -- `weather.pirateweather` + all hourly/daily forecast sensors
- ha_text_ai custom integration -- `sensor.ha_text_ai_weather_summary`

**This domain is consumed by:**
- Dashboard weather cards display clothing suggestion and forecast data
- AI package may reference weather data for prompts

### Cross-References

- Root: /CLAUDE.md
- AI (ha_text_ai): packages/ai/CLAUDE.md

---

## TODOs & Gaps

None currently identified.

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-02-24 | `b350903` | Restructured to 8-section format |

*Last Updated: 2026-02-24*
