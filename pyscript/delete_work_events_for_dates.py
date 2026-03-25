from datetime import datetime
import re
import json

ICS_HEADER = """BEGIN:VCALENDAR
PRODID:-//homeassistant.io//local_calendar 1.0//EN
VERSION:2.0
"""
ICS_FOOTER = "END:VCALENDAR\n"

@pyscript_executor
def _read_ics_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

@pyscript_executor
def _write_ics_file(path: str, content: str) -> None:
    import shutil
    import os
    if os.path.exists(path):
        shutil.copy2(path, path + ".bak")
    tmp_path = path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        f.write(content)
    os.replace(tmp_path, path)

def _extract_events(ics_content: str) -> list:
    """Extract all VEVENT blocks from ICS content, preserving their exact content."""
    events = []
    pattern = re.compile(r'BEGIN:VEVENT.*?END:VEVENT', re.DOTALL)
    for match in pattern.finditer(ics_content):
        events.append(match.group(0))
    return events

def _rebuild_ics(events: list) -> str:
    """Rebuild a valid ICS file from a list of VEVENT blocks."""
    # Start with header
    parts = [ICS_HEADER]
    # Add each event with proper newline separation
    for event in events:
        parts.append(event)
        parts.append("\n")
    # End with footer
    parts.append(ICS_FOOTER)
    return "".join(parts)

@service
async def delete_work_events_for_dates(dates_json: str = None) -> None:
    """
    Delete all calendar events with description 'Work shift auto-added from rota upload'
    for a list of dates (format: JSON string ["YYYY-MM-DD", "YYYY-MM-DD", ...]).
    """
    if not dates_json:
        log.warning("No dates provided to delete_work_events_for_dates")
        return

    # Parse JSON
    try:
        dates = json.loads(dates_json)
    except json.JSONDecodeError as e:
        log.error(f"Invalid JSON: {dates_json}")
        return

    # Convert dates to YYYYMMDD format
    date_strs = []
    for date in dates:
        try:
            date_obj = datetime.strptime(date, "%Y-%m-%d")
            date_strs.append(date_obj.strftime("%Y%m%d"))
        except ValueError as e:
            log.error(f"Invalid date format: {date}. Expected YYYY-MM-DD")
            continue

    if not date_strs:
        log.warning("No valid dates to process")
        return

    ics_path = "/config/.storage/local_calendar.enhy.ics"

    # Read the ICS file
    ics_content = await _read_ics_file(ics_path)

    # Extract all events
    all_events = _extract_events(ics_content)

    # Verify parsing didn't silently drop events
    expected = len(re.findall(r'^BEGIN:VEVENT\s*$', ics_content, re.MULTILINE))
    if expected > 0 and len(all_events) != expected:
        log.error(f"ICS parse mismatch: found {expected} event markers but extracted {len(all_events)} — aborting")
        return

    # Filter out work events on the target dates
    filtered_events = []
    deleted_count = 0

    for event in all_events:
        # Check if this event is a work shift
        has_work_description = 'DESCRIPTION:Work shift auto-added from rota upload' in event

        # Check if this event is on any of the target dates
        is_target_date = False
        for date_str in date_strs:
            if f'DTSTART:{date_str}T' in event or f'DTSTART:{date_str}\n' in event:
                is_target_date = True
                break

        if has_work_description and is_target_date:
            # Skip this event (delete it)
            deleted_count += 1
        else:
            # Keep this event
            filtered_events.append(event)

    # Rebuild valid ICS file
    new_ics_content = _rebuild_ics(filtered_events)

    # Write back to file
    await _write_ics_file(ics_path, new_ics_content)

    log.info(f"Deleted {deleted_count} work event(s) across {len(date_strs)} date(s)")
