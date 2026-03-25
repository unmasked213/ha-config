# CLAUDE - Shopping

> **Scope:** Shopping list management, text sanitisation, supermarket busyness tracking
> **Last reviewed:** 2026-02
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

Manages household shopping lists for two stores (Tesco/general and Amazon) with input sanitisation, auto-clearing of completed items, and a Popular Times integration that tracks supermarket busyness, trends, and opening hours for the local Sainsbury's.

---

## Structure

| File | Purpose |
|------|---------|
| `shopping_list.yaml` | Dashboard shopping list with store selector (Amazon/Tesco), text sanitisation, auto-clear of completed items at 05:00 |
| `tesco_sensors.yaml` | Popular Times integration for local supermarket: busyness status, trend prediction, relative busyness, opening hours |

---

## Key Components

- **`shopping_list.yaml`** — Entry point for all shopping list behaviour. Contains the `Dynamic List Add` automation (sanitises input then adds to the active todo list), the store selector toggle automation, and the 05:00 auto-clear automation. Drives two lists: `todo.shop_list` (Tesco/general) and `todo.amazon_list` (Amazon).
- **`tesco_sensors.yaml`** — Despite the filename, this actually points to **Sainsbury's Local** (address: `Sainsburys Local, 6-9, Purley Parade, High St, Purley CR8 2AB`). Provides busyness status, trend prediction (compares current hour to next hour's historical data), relative busyness percentage, and opening status with countdown.

### Key Entities

- `todo.shop_list` — Tesco/general shopping (when `input_boolean.shopping_list_type_toggle` is off)
- `todo.amazon_list` — Amazon purchases (when toggle is on)
- `input_select.shopping_store` — Dropdown that drives the toggle via a separate automation
- `input_boolean.shopping_list_type_toggle` — Controls which list is active

### Busyness Thresholds

| Status | Threshold |
|--------|-----------|
| Very Busy | >= 85% |
| Busy | >= 50% |
| Quiet | >= 30% |
| Very Quiet | < 30% |
| Closed | 0 |

Opening status sensor includes countdown to open/close, rounded to nearest 5 minutes.

---

## Development Workflows

### Adding Items to Shopping Lists

Items are added through the `Dynamic List Add` automation which sanitises input before writing to the active todo list. The store selector (`input_select.shopping_store`) determines which list receives the item.

### Testing Sanitisation

Verify the sanitisation pipeline handles these cases:
1. Special characters are stripped (only `A-Za-z0-9`, spaces, `'",.\\-!?;()/&` allowed)
2. Multiple spaces collapse to single space
3. ALL CAPS input converts to lowercase then capitalises first word (preserves hyphenated words and numbers)
4. Inputs under 3 characters are rejected

---

## Conventions for AI Assistants

### Critical Constraints

#### 1. Text Sanitisation Rules

`Dynamic List Add` automation sanitises input before adding to todo list:
1. **Regex filter:** Strips all characters except `A-Za-z0-9`, spaces, `'",.\\-!?;()/&`
2. **Whitespace normalisation:** Collapses multiple spaces to single space
3. **Case normalisation:** If input is ALL CAPS, converts to lowercase then capitalises first word (preserves hyphenated words and numbers)
4. **Minimum length:** 3 characters required

#### 2. Two Shopping Lists

- `todo.shop_list` — Tesco/general shopping (when `input_boolean.shopping_list_type_toggle` is off)
- `todo.amazon_list` — Amazon purchases (when toggle is on)

The `input_select.shopping_store` dropdown drives the toggle via a separate automation.

#### 3. Popular Times Integration

`tesco_sensors.yaml` actually points to **Sainsbury's Local** (not Tesco, despite the filename):
- Address: `Sainsburys Local, 6-9, Purley Parade, High St, Purley CR8 2AB`
- Trend prediction compares current hour to next hour's historical data

#### 4. Auto-Clear at 05:00

Completed items in both `todo.shop_list` and `todo.amazon_list` are automatically removed daily at 05:00. A persistent notification is created and auto-dismissed after 1 hour.

### Coupling Warnings

**This domain depends on:**
- Popular Times custom integration (`custom_components/populartimes`)
- HA built-in todo integration

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
