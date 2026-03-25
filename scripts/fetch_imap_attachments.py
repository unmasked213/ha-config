#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
fetch_imap_attachments.py (Python 3.10+)

Fetch attachments for a specific message UID from an IMAP mailbox and save to disk.
- Self-contained (stdlib only): imaplib, email, ssl, json, pathlib.
- Uses UID to avoid ambiguity.
- Sanitizes filenames, avoids path traversal, and deduplicates output names.
- Prefixes filenames with slugified title from email subject.
- Prints JSON summary to stdout; non-zero exit codes on failure.

Environment variables (recommended):
  IMAP_HOST       e.g. "imap.gmail.com"
  IMAP_PORT       default "993"
  IMAP_USER       mailbox username
  IMAP_PASS       mailbox password (for Gmail, use an App Password if applicable)
  IMAP_MAILBOX    default "INBOX"
  OUTPUT_DIR      default "./out"
Optional:
  ALLOW_EXT       comma-separated allowed extensions, e.g. "pdf,txt,m4a,wav"
  MAX_BYTES       max attachment size in bytes, default "52428800" (50 MiB)
"""

from __future__ import annotations

import email
import imaplib
import json
import os
import re
import ssl
import sys
from datetime import datetime, timezone
from email.header import decode_header, make_header
from email.message import Message
from pathlib import Path
from typing import List, Tuple, Optional


def _env(name: str, default: Optional[str] = None) -> str:
    value = os.environ.get(name, default)
    if value is None or value == "":
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


_filename_bad = re.compile(r"[^A-Za-z0-9._ -]+")


def sanitize_filename(name: str) -> str:
    name = name.strip().replace("\x00", "")
    name = name.replace("/", "_").replace("\\", "_")
    name = _filename_bad.sub("_", name)
    name = name.strip(" ._")
    return name or "attachment"


def dedupe_path(path: Path) -> Path:
    if not path.exists():
        return path
    stem, suffix = path.stem, path.suffix
    for i in range(2, 10_000):
        candidate = path.with_name(f"{stem} ({i}){suffix}")
        if not candidate.exists():
            return candidate
    raise RuntimeError("Could not deduplicate output filename")


def parse_allow_ext(raw: str) -> Optional[set]:
    raw = (raw or "").strip()
    if not raw:
        return None
    parts = [p.strip().lower().lstrip(".") for p in raw.split(",")]
    parts = [p for p in parts if p]
    return set(parts) if parts else None


def extract_attachments(msg: Message) -> List[Tuple[str, bytes, str]]:
    """
    Returns list of (filename, content_bytes, content_type)
    """
    out: List[Tuple[str, bytes, str]] = []
    for part in msg.walk():
        if part.is_multipart():
            continue

        content_disposition = (part.get("Content-Disposition") or "").lower()
        filename = part.get_filename()
        content_type = part.get_content_type()

        # Attachment detection: explicit disposition OR named part that isn't plain inline text.
        is_attachment = ("attachment" in content_disposition) or bool(filename)
        if not is_attachment:
            continue

        if not filename:
            safe_type = content_type.replace("/", "_")
            filename = f"{safe_type}.bin"

        payload = part.get_payload(decode=True)
        if payload is None:
            continue

        out.append((filename, payload, content_type))
    return out


def extract_file_prefix(subject: str, uid: str) -> str:
    """
    Build a descriptive filename prefix from the Plaud email subject.
    Strips the [Plaud-AutoFlow] tag, slugifies the remainder.
    Falls back to UID if the subject is empty or has no useful content.
    """
    match = re.search(r"\]\s*(.+)", subject)
    raw = match.group(1).strip() if match else subject.strip()
    if not raw:
        return uid
    slug = re.sub(r"[^A-Za-z0-9_\-]+", "_", raw)
    slug = re.sub(r"_+", "_", slug).strip("_")
    return slug or uid


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: fetch_imap_attachments.py <UID>", file=sys.stderr)
        return 2

    uid = sys.argv[1].strip()
    if not uid.isdigit():
        print("UID must be numeric", file=sys.stderr)
        return 2

    host = _env("IMAP_HOST")
    port = int(os.environ.get("IMAP_PORT", "993"))
    user = _env("IMAP_USER")
    password = _env("IMAP_PASS")
    mailbox = os.environ.get("IMAP_MAILBOX", "INBOX")
    out_dir = Path(os.environ.get("OUTPUT_DIR", "./out")).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    allow_ext = parse_allow_ext(os.environ.get("ALLOW_EXT", ""))
    max_bytes = int(os.environ.get("MAX_BYTES", "52428800"))

    ctx = ssl.create_default_context()

    result = {
        "ok": False,
        "uid": uid,
        "mailbox": mailbox,
        "saved": [],
        "skipped": [],
        "error": None,
        "ts_utc": datetime.now(timezone.utc).isoformat(),
    }

    try:
        with imaplib.IMAP4_SSL(host=host, port=port, ssl_context=ctx, timeout=30) as imap:
            imap.login(user, password)

            typ, _ = imap.select(mailbox, readonly=True)
            if typ != "OK":
                raise RuntimeError(f"Failed to select mailbox: {mailbox}")

            # Fetch the full RFC822 message by UID
            typ, data = imap.uid("FETCH", uid, "(RFC822)")
            if typ != "OK" or not data or not data[0] or not isinstance(data[0], tuple):
                raise RuntimeError(f"Failed to fetch message for UID {uid}")

            raw_bytes = data[0][1]
            msg = email.message_from_bytes(raw_bytes)

            raw_subject = msg.get("Subject", "")
            try:
                subject = str(make_header(decode_header(raw_subject)))
            except Exception:
                subject = raw_subject
            prefix = extract_file_prefix(subject, uid)

            attachments = extract_attachments(msg)
            if not attachments:
                result["ok"] = True
                print(json.dumps(result, ensure_ascii=False))
                return 0

            for filename, blob, content_type in attachments:
                safe_name = sanitize_filename(filename)

                # Extension allowlist (optional)
                ext = Path(safe_name).suffix.lower().lstrip(".")
                if allow_ext is not None and ext not in allow_ext:
                    result["skipped"].append(
                        {"name": safe_name, "reason": "ext_not_allowed", "content_type": content_type}
                    )
                    continue

                if len(blob) > max_bytes:
                    result["skipped"].append(
                        {"name": safe_name, "reason": "too_large", "bytes": len(blob), "content_type": content_type}
                    )
                    continue

                target = dedupe_path(out_dir / f"{prefix}_{safe_name}")
                target.write_bytes(blob)

                result["saved"].append(
                    {"path": str(target), "bytes": len(blob), "content_type": content_type}
                )

            result["ok"] = True
            print(json.dumps(result, ensure_ascii=False))
            return 0

    except Exception as e:
        result["error"] = str(e)
        print(json.dumps(result, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())