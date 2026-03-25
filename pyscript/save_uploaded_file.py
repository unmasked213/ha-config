# /config/pyscript/save_uploaded_file.py
import base64
import io
import os
from datetime import datetime

MAX_BYTES = 25 * 1024 * 1024  # ~25MB hard limit for uploads
UPLOAD_DIR = "/config/uploads"


@pyscript_executor
def _write_file(path: str, data: bytes) -> None:
    with io.open(path, "wb") as f:
        f.write(data)


def _sanitize_filename(file_name: str) -> str:
    name = os.path.basename(file_name or "")
    name = name.strip().replace(" ", "_")

    safe_chars = []
    for ch in name:
        if ch.isalnum() or ch in ("-", "_", "."):
            safe_chars.append(ch)

    safe = "".join(safe_chars)
    return safe or "upload.bin"


def _split_name_ext(file_name: str):
    safe = _sanitize_filename(file_name)
    if "." in safe:
        base, ext = safe.rsplit(".", 1)
        base = base or "upload"
        return base, ext.lower()
    return safe, ""


def _guess_mime(ext: str) -> str:
    mapping = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
        "gif": "image/gif",
        "pdf": "application/pdf",
        "txt": "text/plain",
        "json": "application/json",
        "csv": "text/csv",
        "zip": "application/zip",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "ppt": "application/vnd.ms-powerpoint",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "xls": "application/vnd.ms-excel",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
    return mapping.get(ext.lower(), "application/octet-stream")


def _update_index() -> None:
    """Scan UPLOAD_DIR and expose an index entity with metadata."""
    try:
        if not os.path.isdir(UPLOAD_DIR):
            state.set("pyscript.uploaded_files", 0, attributes={"files": []})
            return

        files = []
        for name in sorted(os.listdir(UPLOAD_DIR)):
            path = os.path.join(UPLOAD_DIR, name)
            if not os.path.isfile(path):
                continue
            st = os.stat(path)
            files.append(
                {
                    "name": name,
                    "size": st.st_size,
                    "mtime": datetime.fromtimestamp(st.st_mtime).isoformat(),
                }
            )

        state.set(
            "pyscript.uploaded_files",
            len(files),
            attributes={"files": files},
        )
    except Exception as exc:
        log.error(f"save_uploaded_file: failed to update index: {exc}")


@service("pyscript.save_uploaded_file")
@task_unique("save_uploaded_file")
async def save_uploaded_file(file_data: str = "", file_name: str = "") -> None:
    """
    Save an uploaded file from base64 data into /config/uploads with a timestamped name.
    Exposed as pyscript.save_uploaded_file.
    """
    if not file_data:
        log.error("save_uploaded_file: missing file_data")
        return

    cleaned = file_data.strip()

    # Allow either raw base64 or a full data URL.
    if cleaned.startswith("data:") and "," in cleaned:
        cleaned = cleaned.split(",", 1)[1]

    try:
        raw_bytes = base64.b64decode(cleaned, validate=True)
    except Exception as exc:
        log.error(f"save_uploaded_file: base64 decode failed: {exc}")
        return

    if len(raw_bytes) > MAX_BYTES:
        log.error(
            f"save_uploaded_file: file too large "
            f"({len(raw_bytes)} bytes > {MAX_BYTES} byte limit)"
        )
        return

    base, ext = _split_name_ext(file_name or "upload.bin")
    if not ext:
        ext = "bin"
    mime_type = _guess_mime(ext)

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    final_name = f"{timestamp}_{base}.{ext}"
    full_path = os.path.join(UPLOAD_DIR, final_name)

    await _write_file(full_path, raw_bytes)

    state.set(
        "pyscript.last_uploaded_file",
        final_name,
        attributes={
            "path": full_path,
            "mime_type": mime_type,
            "size": len(raw_bytes),
        },
    )

    _update_index()

    log.info(
        f"save_uploaded_file: saved {final_name} "
        f"({len(raw_bytes)} bytes) to {UPLOAD_DIR}"
    )


# Build the index once at load so existing files are visible immediately.
_update_index()
