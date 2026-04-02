"""File I/O for speaker rename — regular Python module (not pyscript-managed).

This module runs inside task.executor where standard Python builtins are available.
Pyscript rewrites all functions in .py files under pyscript/, making them incompatible
with task.executor. This module lives in pyscript/modules/ and is imported as a regular
Python module, bypassing pyscript's AST rewriting.
"""

import os
import re

TRANSCRIPTS_DIR = "/config/www/transcripts"


def read_file(path):
    """Read and return file content."""
    with open(path, "r") as f:
        return f.read()


def rewrite_files_sync(old_name, new_name, meeting_date, meeting_title, merge):
    """Rewrite summary and transcript files. Returns (count, errors) tuple."""
    count = 0
    errors = []

    for suffix in ("summary", "transcript"):
        files = _find_meeting_files(meeting_date, meeting_title, suffix)

        for fpath in files:
            try:
                with open(fpath, "r") as f:
                    text = f.read()

                new_text = _replace_speaker(text, old_name, new_name, merge)

                if new_text != text:
                    with open(fpath, "w") as f:
                        f.write(new_text)
                    count += 1
            except Exception as e:
                errors.append(f"{os.path.basename(fpath)}: {e}")

    return count, errors


def _find_meeting_files(meeting_date, meeting_title, suffix):
    """Find files matching date prefix and optional title."""
    date_prefix = meeting_date[5:]  # "03-18" from "2026-03-18"
    prefix_str = f"{date_prefix}_"
    suffix_str = f"_{suffix}.txt"

    try:
        all_files = os.listdir(TRANSCRIPTS_DIR)
    except OSError:
        return []

    candidates = [
        os.path.join(TRANSCRIPTS_DIR, f)
        for f in all_files
        if f.startswith(prefix_str) and f.endswith(suffix_str)
    ]

    if not meeting_title or not candidates:
        return candidates

    title_lower = meeting_title.lower()
    title_words = set(re.findall(r'[a-z0-9]+', title_lower))

    matches = []
    for fpath in candidates:
        fname_lower = os.path.basename(fpath).lower()
        fname_words = set(re.findall(r'[a-z0-9]+', fname_lower))
        if title_words and len(title_words & fname_words) >= len(title_words) * 0.5:
            matches.append(fpath)

    return matches if matches else candidates


def _replace_speaker(text, old_name, new_name, merge=False):
    """Replace speaker name with word-boundary awareness and possessive handling."""
    escaped = re.escape(old_name)
    pattern = re.compile(
        r'\b' + escaped + r"('s)?\b",
        re.IGNORECASE
    )

    def replacer(m):
        possessive = m.group(1)
        if possessive:
            return f"{new_name}'s"
        return new_name

    result = pattern.sub(replacer, text)

    # Always deduplicate the Speakers line — a rename to an existing name
    # creates duplicates even without explicit merge
    result = _clean_speakers_line(result, old_name, new_name)

    return result


def _clean_speakers_line(text, old_name, new_name):
    """After a merge, remove the ghost speaker from the Speakers: metadata line."""
    def clean_line(m):
        prefix = m.group(1)
        speakers_str = m.group(2)
        entries = [s.strip() for s in speakers_str.split(",")]
        cleaned = []
        seen_new = False
        for entry in entries:
            if entry.lower().strip() == new_name.lower().strip():
                if not seen_new:
                    cleaned.append(entry)
                    seen_new = True
            else:
                cleaned.append(entry)
        return prefix + ", ".join(cleaned)

    return re.sub(
        r'^(-\s+Speakers?:\s*)(.+)$',
        clean_line,
        text,
        flags=re.MULTILINE
    )
