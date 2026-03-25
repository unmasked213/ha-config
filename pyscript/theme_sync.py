# /config/pyscript/theme_sync.py
from __future__ import annotations
import os, io, yaml

THEMES_DIR = "/config/themes"
INPUT_SELECT_ENTITY = "input_select.theme_selector"
PLACEHOLDER = "Home Assistant"

def _extract_names_from_yaml(data) -> list[str]:
    # Accept common shapes:
    # A) { "Theme A": {...}, "Theme B": {...} }
    # B) { "themes": { "Theme A": {...}, ... } }
    # C) [ { "Theme A": {...} }, { "Theme B": {...} } ]  (rare)
    names: set[str] = set()
    if isinstance(data, dict):
        if "themes" in data and isinstance(data["themes"], dict):
            names.update(k.strip() for k in data["themes"].keys() if isinstance(k, str) and k.strip())
        else:
            names.update(k.strip() for k in data.keys() if isinstance(k, str) and k.strip())
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                names.update(k.strip() for k in item.keys() if isinstance(k, str) and k.strip())
    return [n for n in names if n.lower() != "themes"]

def _discover_theme_names(base: str) -> list[str]:
    names: set[str] = set()
    if not os.path.isdir(base):
        log.warning(f"theme_sync: themes dir missing: {base}")
        return []
    for root, _, files in os.walk(base):
        for fn in files:
            if not fn.lower().endswith((".yaml", ".yml")):
                continue
            path = os.path.join(root, fn)
            try:
                with io.open(path, "r", encoding="utf-8") as fh:
                    raw = fh.read()
                # Safe parse; ignore HA-specific tags/includes
                data = yaml.safe_load(raw)
                extracted = _extract_names_from_yaml(data)
                if extracted:
                    log.info(f"theme_sync: {os.path.relpath(path, base)} -> {extracted}")
                    names.update(extracted)
                else:
                    log.info(f"theme_sync: {os.path.relpath(path, base)} -> no theme keys found")
            except Exception as e:
                log.warning(f"theme_sync: skipped {path}: {e}")
    return sorted(names, key=str.casefold)

@service("theme_sync.refresh")
def theme_sync_refresh() -> None:
    """Reload themes and refresh input_select options."""
    # Reload HA's themes so new files are registered
    try:
        service.frontend.reload_themes()
    except Exception as e:
        log.warning(f"theme_sync: frontend.reload_themes failed: {e}")

    names = _discover_theme_names(THEMES_DIR)
    if not names:
        names = [PLACEHOLDER]

    service.input_select.set_options(entity_id=INPUT_SELECT_ENTITY, options=names)

    current = state.get(INPUT_SELECT_ENTITY)
    if current not in names:
        service.input_select.select_option(entity_id=INPUT_SELECT_ENTITY, option=names[0])

    log.info(f"theme_sync: options updated ({len(names)} themes)")
