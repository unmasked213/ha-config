"""Speaker rename/merge service for meeting transcripts.

Renames or merges speaker identities across summary files, transcript files,
and todo entities for a single meeting. Called from the work-actions-card
speaker chip UI.

Registered as service: pyscript.speaker_rename

File I/O and text replacement use pyscript/modules/speaker_rename_io.py (a regular
Python module loaded via importlib to bypass pyscript's AST rewriting). Pyscript
rewrites all functions — even imported ones — making them incompatible with
task.executor. importlib.util.spec_from_file_location avoids this.
"""

import re
import importlib.util

SUMMARY_ENTITY = "todo.meeting_summaries"
ACTIONS_ENTITY = "todo.work_actions"


def _load_io_module():
    """Load the I/O module as regular Python (bypasses pyscript wrapping)."""
    spec = importlib.util.spec_from_file_location(
        "speaker_rename_io",
        "/config/pyscript/modules/speaker_rename_io.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@service(supports_response="optional")
def get_meeting_summary(meeting_date=None, meeting_title=None):
    """Read a meeting summary from file. Fallback for meetings older than 7 days."""
    if not meeting_date:
        return {"error": "meeting_date is required"}

    io = _load_io_module()
    files = io._find_meeting_files(meeting_date, meeting_title, "summary")

    if not files:
        return {"found": False}

    try:
        content = task.executor(io.read_file, files[0])
        return {"found": True, "content": content}
    except Exception as e:
        log.error(f"get_meeting_summary: failed to read {files[0]}: {e}")
        return {"found": False}


@service
def speaker_rename(old_name=None, new_name=None, meeting_date=None,
                   meeting_title=None, merge=False):
    """Rename or merge a speaker across a meeting's files and entities."""
    log.info(f"speaker_rename: old='{old_name}' new='{new_name}' "
             f"date='{meeting_date}' title='{meeting_title}' merge={merge}")

    if not old_name or not new_name or not meeting_date:
        log.error("speaker_rename: old_name, new_name, and meeting_date are required")
        return

    if old_name == new_name:
        return

    io = _load_io_module()

    # Step 1+2: Rewrite files (runs in executor thread — standard Python)
    files_updated, file_errors = task.executor(io.rewrite_files_sync,
                                               old_name, new_name, meeting_date,
                                               meeting_title, merge)
    for err in file_errors:
        log.error(f"speaker_rename: file error: {err}")

    # Step 3: Update todo.meeting_summaries
    summaries_updated = _update_summaries(
        old_name, new_name, meeting_date, meeting_title, merge, io)

    # Step 4: Update todo.work_actions
    actions_updated = _update_actions(
        old_name, new_name, meeting_date, meeting_title, io)

    log.info(
        f"speaker_rename: done — "
        f"{files_updated} files, "
        f"{summaries_updated} summaries, "
        f"{actions_updated} actions"
    )


def _update_summaries(old_name, new_name, meeting_date, meeting_title, merge, io):
    """Update matching items in todo.meeting_summaries."""
    try:
        response = service.call(
            "todo", "get_items",
            entity_id=SUMMARY_ENTITY,
            status=["needs_action", "completed"],
            return_response=True,
        )
        items = response[SUMMARY_ENTITY]["items"]
    except Exception as e:
        log.warning(f"speaker_rename: cannot read {SUMMARY_ENTITY}: {e}")
        return 0

    date_prefix = meeting_date[5:]
    title_lower = (meeting_title or "").lower()
    count = 0

    for item in items:
        summary = (item.get("summary") or "").lower()
        desc = item.get("description") or ""

        date_match = (item.get("due") == meeting_date or date_prefix in summary)
        title_match = (not title_lower or title_lower in summary or title_lower in desc.lower())

        if date_match and title_match and old_name in desc:
            new_desc = io._replace_speaker(desc, old_name, new_name, merge)
            if new_desc != desc:
                try:
                    service.call(
                        "todo", "update_item",
                        entity_id=SUMMARY_ENTITY,
                        item=item["uid"],
                        description=new_desc,
                    )
                    count += 1
                except Exception as e:
                    log.error(f"speaker_rename: summary update failed: {e}")

    return count


def _update_actions(old_name, new_name, meeting_date, meeting_title, io):
    """Update work action items from the same meeting."""
    try:
        response = service.call(
            "todo", "get_items",
            entity_id=ACTIONS_ENTITY,
            status=["needs_action", "completed"],
            return_response=True,
        )
        items = response[ACTIONS_ENTITY]["items"]
    except Exception as e:
        log.warning(f"speaker_rename: cannot read {ACTIONS_ENTITY}: {e}")
        return 0

    count = 0

    for item in items:
        desc = item.get("description") or ""
        summary_text = item.get("summary") or ""

        # Match by meeting date (required) + source title (when available)
        date_match = re.search(r'Meeting date:\s*(\S+)', desc)
        if not date_match or date_match.group(1) != meeting_date:
            continue

        # If we have a title, also verify the source matches to avoid
        # cross-contamination on same-day multi-meeting items
        if meeting_title:
            source_match = re.search(r'Source:\s*(.+)', desc)
            if source_match:
                source_lower = source_match.group(1).strip().lower()
                title_lower = meeting_title.lower()
                if title_lower not in source_lower and source_lower not in title_lower:
                    continue

        changed = False
        new_desc = desc
        new_summary = summary_text

        if old_name in desc:
            new_desc = io._replace_speaker(desc, old_name, new_name)
            if new_desc != desc:
                changed = True

        if old_name in summary_text:
            new_summary = io._replace_speaker(summary_text, old_name, new_name)
            if new_summary != summary_text:
                changed = True

        if changed:
            try:
                kwargs = {"entity_id": ACTIONS_ENTITY, "item": item["uid"]}
                if new_desc != desc:
                    kwargs["description"] = new_desc
                if new_summary != summary_text:
                    kwargs["rename"] = new_summary
                service.call("todo", "update_item", **kwargs)
                count += 1
            except Exception as e:
                log.error(f"speaker_rename: action update failed: {e}")

    return count
