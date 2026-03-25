"""Remove duplicate work shift events from Enhy's calendar."""
import re

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
async def cleanup_duplicate_work_events() -> None:
    """
    Remove duplicate work shift events from calendar.
    Keeps only the most recent entry for each date.
    """
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

    # Separate work events from other events
    work_events_by_date = {}
    other_events = []

    for event in all_events:
        # Check if this is a work shift
        has_work_description = 'DESCRIPTION:Work shift auto-added from rota upload' in event

        if has_work_description:
            # Extract the date from DTSTART
            match = re.search(r'DTSTART:(\d{8})', event)
            if match:
                date = match.group(1)
                # Extract creation timestamp to keep newest
                created_match = re.search(r'CREATED:(\d{8}T\d{6})Z?', event)
                created = created_match.group(1) if created_match else "00000000T000000"

                # Keep only the newest event for each date
                if date not in work_events_by_date or created > work_events_by_date[date]['created']:
                    work_events_by_date[date] = {'event': event, 'created': created}
            else:
                # Work event without parseable date - keep it to avoid data loss
                other_events.append(event)
        else:
            # Keep all non-work events
            other_events.append(event)

    # Combine: all non-work events + one work event per date
    final_events = other_events + [info['event'] for info in work_events_by_date.values()]

    # Rebuild valid ICS file
    new_ics_content = _rebuild_ics(final_events)

    # Write back to file
    await _write_ics_file(ics_path, new_ics_content)

    total_work_events = sum(1 for e in all_events if 'DESCRIPTION:Work shift auto-added from rota upload' in e)
    kept_events = len(work_events_by_date)
    deleted = total_work_events - kept_events

    log.info(f"Cleaned up {deleted} duplicate work events, kept {kept_events} unique dates")
