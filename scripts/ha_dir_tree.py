#!/usr/bin/env python3
"""
ha_dir_tree.py — HA-tailored config directory tree generator

Scans /config and produces a compact markdown tree optimised for
Home Assistant. Authored content (packages, pyscript, www/base,
www/cards, docs, etc.) gets full detail; runtime directories and
third-party code are collapsed to one-line summaries.

Output: /config/config_dir_tree.md
Usage:  python3 /config/scripts/ha_dir_tree.py
        python3 /config/scripts/ha_dir_tree.py --readme   (condensed tree to stdout)
"""
from __future__ import annotations

import os
import time as _time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path("/config")
OUTPUT = ROOT / "config_dir_tree.md"

# ── Box-drawing ──────────────────────────────────────────────

TEE   = "├── "
ELBOW = "╰── "
PIPE  = "│   "
SPACE = "    "

# ── Exclusion rules ─────────────────────────────────────────

# Directory names excluded at any depth
EXCLUDE_DIRS: frozenset[str] = frozenset({
    "__pycache__", "node_modules", ".git", ".svn", ".hg",
    ".venv", "venv", ".mypy_cache", ".pytest_cache", ".ruff_cache",
})

# Self-referential files to skip at root
SELF_FILES: frozenset[str] = frozenset({
    "ha_dir_tree.py", "dir_tree.py", "config_dir_tree.md",
})

# Extensions to skip everywhere (runtime/binary)
SKIP_EXT: tuple[str, ...] = (".db", ".db-shm", ".db-wal", ".log", ".log.fault")

# ── Directory rendering modes ────────────────────────────────
#
# 'exclude'  — hidden entirely
# 'summary'  — one line: "📁 dir/ — N dirs, N files, size"
# 'names'    — list immediate child names, no recursion
# 'full'     — full recursive tree (default)

RULES: dict[str, str] = {
    # Collapsed summaries — runtime/generated/third-party
    ".storage":          "summary",
    ".claude":           "summary",
    ".vscode":           "summary",
    ".cursor":           "summary",
    "bin":               "summary",
    "custom_icons":      "summary",
    "deps":              "summary",
    "downloads":         "summary",
    "llmvision":         "summary",
    "media":             "summary",
    "tmp":               "summary",
    "tts":               "summary",
    "uploads":           "summary",
    # Names only — show what's installed, not internals
    "custom_components": "names",
    # Full-detail overrides for children of collapsed parents
    "www/base":                    "full",
    "www/cards":                   "full",
    "addons/ha-config-ai-agent":   "full",
}

# Default mode for unlisted children of these top-level dirs
PARENT_DEFAULTS: dict[str, str] = {
    "www":    "summary",
    "addons": "summary",
}


# ── Helpers ──────────────────────────────────────────────────

def human_size(b: int) -> str:
    if b >= 1 << 30: return f"{b / (1 << 30):.1f} GB"
    if b >= 1 << 20: return f"{b // (1 << 20)} MB"
    if b >= 1 << 10: return f"{b // (1 << 10)} KB"
    return f"{b} B"


def safe_size(entry: os.DirEntry) -> int:
    try:
        return entry.stat(follow_symlinks=False).st_size
    except OSError:
        return 0


def count_recursive(path: str) -> tuple[int, int, int]:
    """Return (dirs, files, bytes) under path."""
    dirs = files = size = 0
    try:
        with os.scandir(path) as it:
            for e in it:
                if e.name in EXCLUDE_DIRS:
                    continue
                try:
                    if e.is_dir(follow_symlinks=False):
                        dirs += 1
                        d, f, s = count_recursive(e.path)
                        dirs += d; files += f; size += s
                    elif e.is_file(follow_symlinks=False):
                        files += 1
                        size += e.stat(follow_symlinks=False).st_size
                except OSError:
                    pass
    except OSError:
        pass
    return dirs, files, size


def get_mode(rel: str) -> str:
    """Resolve rendering mode for a directory at rel path from ROOT."""
    # Exact match (most specific)
    if rel in RULES:
        return RULES[rel]
    # Inherit from nearest ancestor in RULES
    parts = rel.split("/")
    for i in range(len(parts) - 1, 0, -1):
        ancestor = "/".join(parts[:i])
        if ancestor in RULES and RULES[ancestor] == "full":
            return "full"
    # Parent-level defaults for unlisted children
    top = parts[0]
    if len(parts) > 1 and top in PARENT_DEFAULTS:
        return PARENT_DEFAULTS[top]
    # Pattern-based rules
    if top.startswith("go2rtc"):
        return "summary"
    if top.startswith("."):
        return "exclude"
    return "full"


def skip_file(name: str, at_root: bool) -> bool:
    if at_root and name in SELF_FILES:
        return True
    if any(name.endswith(ext) for ext in SKIP_EXT):
        return True
    # Rotated logs: home-assistant.log.1, .log.2, etc.
    if ".log." in name:
        return True
    return False


def list_children(path: Path) -> tuple[list[os.DirEntry], list[os.DirEntry]]:
    """Return (dirs, files) sorted case-insensitively, excluding symlinks."""
    dirs: list[os.DirEntry] = []
    files: list[os.DirEntry] = []
    try:
        for e in sorted(os.scandir(path), key=lambda e: e.name.lower()):
            if e.is_symlink():
                continue
            if e.is_dir(follow_symlinks=False):
                if e.name not in EXCLUDE_DIRS:
                    dirs.append(e)
            elif e.is_file(follow_symlinks=False):
                files.append(e)
    except OSError:
        pass
    return dirs, files


def dir_label(dirs: list, files: list, file_bytes: int = 0) -> str:
    """Build inline annotation for a directory header."""
    p: list[str] = []
    if dirs:
        n = len(dirs)
        p.append(f"{n} folder{'s' if n != 1 else ''}")
    if files:
        n = len(files)
        p.append(f"{n} file{'s' if n != 1 else ''}")
    if file_bytes:
        p.append(human_size(file_bytes))
    return f"  ({', '.join(p)})" if p else ""


# ── Tree renderer ────────────────────────────────────────────

def render(path: Path, prefix: str = "") -> list[str]:
    """Render directory contents as tree lines."""
    lines: list[str] = []
    at_root = path == ROOT
    child_dirs, child_files = list_children(path)

    # Build visible items: (kind, entry, mode)
    items: list[tuple[str, os.DirEntry, str]] = []
    for d in child_dirs:
        rel = os.path.relpath(d.path, ROOT)
        mode = get_mode(rel)
        if mode != "exclude":
            items.append(("dir", d, mode))
    for f in child_files:
        if not skip_file(f.name, at_root):
            items.append(("file", f, ""))

    prev_was_dir = False
    for i, (kind, entry, mode) in enumerate(items):
        last = i == len(items) - 1
        conn = ELBOW if last else TEE
        npfx = prefix + (SPACE if last else PIPE)

        # Breathing line: after parent header before first dir, or after any dir block
        if prev_was_dir or (i == 0 and kind == "dir"):
            lines.append(f"{prefix}│")

        if kind == "file":
            lines.append(f"{prefix}{conn}{entry.name}")
            prev_was_dir = False

        elif mode == "summary":
            d, f, s = count_recursive(entry.path)
            parts = []
            if d: parts.append(f"{d} dirs")
            if f: parts.append(f"{f} files")
            if s: parts.append(human_size(s))
            lines.append(
                f"{prefix}{conn}📁 {entry.name}/"
                f"  — {', '.join(parts) or 'empty'}"
            )
            prev_was_dir = True

        elif mode == "names":
            sub_d, sub_f = list_children(Path(entry.path))
            # Filter hidden dirs in names view
            sub_d = [d for d in sub_d if not d.name.startswith(".")]
            sub_f = [f for f in sub_f if not skip_file(f.name, False)]
            count = len(sub_d)
            tag = "integrations" if entry.name == "custom_components" else "items"
            lines.append(f"{prefix}{conn}📁 {entry.name}/  ({count} {tag})")
            subs = [(d, True) for d in sub_d] + [(f, False) for f in sub_f]
            for j, (s, is_dir) in enumerate(subs):
                sl = j == len(subs) - 1
                sc = ELBOW if sl else TEE
                lines.append(f"{npfx}{sc}{s.name}{'/' if is_dir else ''}")
            prev_was_dir = True

        else:  # full
            sd, sf = list_children(Path(entry.path))
            vd = [d for d in sd
                  if get_mode(os.path.relpath(d.path, ROOT)) != "exclude"]
            vf = [f for f in sf if not skip_file(f.name, False)]
            fb = sum(safe_size(f) for f in vf)
            lines.append(
                f"{prefix}{conn}📁 {entry.name}/{dir_label(vd, vf, fb)}"
            )
            lines.extend(render(Path(entry.path), npfx))
            prev_was_dir = True

    return lines


# ── README condensed tree ────────────────────────────────────

import re as _re

def _load_domain_descriptions() -> dict[str, str]:
    """Extract scope lines from packages/*/CLAUDE.md files."""
    descs: dict[str, str] = {}
    pkg_dir = ROOT / "packages"
    if not pkg_dir.is_dir():
        return descs
    scope_re = _re.compile(r">\s*\*\*Scope:\*\*\s*(.+)")
    for domain_dir in pkg_dir.iterdir():
        if not domain_dir.is_dir():
            continue
        claude_md = domain_dir / "CLAUDE.md"
        if not claude_md.is_file():
            continue
        try:
            for line in claude_md.read_text(encoding="utf-8").splitlines()[:10]:
                m = scope_re.match(line)
                if m:
                    descs[domain_dir.name] = m.group(1).strip()
                    break
        except OSError:
            pass
    return descs


def _safe_count(path: Path, predicate) -> int:
    """Count entries in a directory, returning 0 if it doesn't exist."""
    try:
        return sum(1 for e in path.iterdir() if predicate(e))
    except OSError:
        return 0


def readme_tree() -> str:
    """Generate a condensed ~40-line tree for README.md."""
    pkg_dir = ROOT / "packages"
    try:
        domains = sorted(d.name for d in pkg_dir.iterdir() if d.is_dir())
    except OSError:
        domains = []
    pkg_count = len(domains)
    yaml_count = sum(
        len(list(d.rglob("*.yaml")))
        for d in pkg_dir.iterdir() if d.is_dir()
    ) if pkg_dir.is_dir() else 0
    cc_count = _safe_count(
        ROOT / "custom_components",
        lambda d: d.is_dir() and not d.name.startswith("."),
    )
    py_count = _safe_count(
        ROOT / "pyscript",
        lambda f: f.is_file() and f.suffix == ".py",
    )
    js_count = _safe_count(
        ROOT / "www" / "base",
        lambda f: f.is_file() and f.suffix == ".js",
    )

    # Comment column: align all # comments to the same position
    COL = 38  # characters from start of line to the #

    def _line(prefix: str, name: str, desc: str) -> str:
        left = f"{prefix}{name}"
        return f"{left:<{COL}}# {desc}" if desc else left

    lines = [
        "```",
        "/config/",
        _line("├── ", "configuration.yaml", "HA bootstrap (delegates to packages)"),
        _line("├── ", "automations.yaml", "Root automations"),
        _line("├── ", "scripts.yaml", "Reusable service-call sequences"),
        _line("├── ", "scenes.yaml", "Scene snapshots"),
        "│",
        _line("├── ", "packages/", f"{pkg_count} domain packages, {yaml_count} YAML files"),
    ]

    domain_descs = _load_domain_descriptions()
    for i, domain in enumerate(domains):
        is_last = i == len(domains) - 1
        conn = "└" if is_last else "├"
        lines.append(_line(f"│   {conn}── ", domain + "/", domain_descs.get(domain, "")))

    lines.extend([
        "│",
        _line("├── ", "pyscript/", f"{py_count} Python automations"),
        _line("├── ", "custom_components/", f"{cc_count} third-party integrations"),
        _line("├── ", "www/", "Web assets"),
        _line("│   ├── ", "base/", f"UI design system ({js_count} JS files)"),
        _line("│   ├── ", "cards/", "Custom card implementations"),
        _line("│   └── ", "community/", "Third-party card library"),
        "│",
        _line("├── ", "themes/", "Material You, Catppuccin, VisionOS"),
        _line("├── ", "ui/", "Dashboard views, templates, resources"),
        _line("├── ", "templates/", "Custom button card templates"),
        _line("├── ", "docs/", "Reports and reference documentation"),
        _line("├── ", "addons/", "Local add-ons (ha-config-ai-agent)"),
        _line("└── ", ".claude/", "AI session management"),
        "```",
    ])

    return "\n".join(lines)


# ── Main ─────────────────────────────────────────────────────

def main() -> None:
    t0 = _time.perf_counter()
    uk = ZoneInfo("Europe/London")
    now = datetime.now(uk).strftime("%Y-%m-%d %H:%M")

    total_d, total_f, total_b = count_recursive(str(ROOT))
    tree = render(ROOT)
    elapsed = _time.perf_counter() - t0

    # Build header box
    line1 = f"  /config"
    line2 = f"  Scanned: {now}  |  {elapsed:.1f}s"
    line3 = f"  {total_d:,} dirs · {total_f:,} files · {human_size(total_b)}"
    width = max(len(line1), len(line2), len(line3)) + 4
    bar = "─" * width

    doc = (
        f"```\n"
        f"╭{bar}╮\n"
        f"│{line1:<{width}}│\n"
        f"├{bar}┤\n"
        f"│{line2:<{width}}│\n"
        f"│{line3:<{width}}│\n"
        f"╰{bar}╯\n"
        f"\n"
        f"📁 config/\n"
        + "\n".join(tree)
        + "\n```\n"
    )

    OUTPUT.write_text(doc, encoding="utf-8")
    line_count = doc.count("\n")
    print(f"Done: {line_count} lines -> {OUTPUT}")


if __name__ == "__main__":
    import sys
    if "--readme" in sys.argv:
        print(readme_tree())
    else:
        main()
