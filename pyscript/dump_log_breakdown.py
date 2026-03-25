# Temporary: dump full system_log breakdown to a sensor

@service
def dump_log_breakdown():
    """Dump detailed system_log breakdown."""
    handler = hass.data.get("system_log")

    if handler is None or not hasattr(handler, "records"):
        state.set("sensor.log_breakdown_dump", "no_handler", {"error": "No system_log handler"})
        return

    error_sources = {}
    warning_sources = {}
    error_details = []
    warning_details = []

    for entry in handler.records.values():
        level = None
        source_path = "unknown"
        count = 1
        message = ""

        if hasattr(entry, "level"):
            level = str(entry.level).upper()
            source = getattr(entry, "source", ())
            count = getattr(entry, "count", 1)
            msg_raw = getattr(entry, "message", "")
            if isinstance(msg_raw, (list, tuple)):
                message = str(msg_raw[0])[:150] if msg_raw else ""
            else:
                message = str(msg_raw)[:150]
            if source and len(source) > 0:
                source_path = str(source[0])
        elif isinstance(entry, dict):
            level = str(entry.get("level", "")).upper()
            source = entry.get("source", ())
            count = entry.get("count", 1)
            msg_raw = entry.get("message", "")
            if isinstance(msg_raw, (list, tuple)):
                message = str(msg_raw[0])[:150] if msg_raw else ""
            else:
                message = str(msg_raw)[:150]
            if source and len(source) > 0:
                source_path = str(source[0])

        if not level:
            continue

        # Extract component name
        comp = "unknown"
        path = str(source_path)
        if "custom_components/" in path:
            comp = path.split("custom_components/")[1].split("/")[0]
        elif "components/" in path:
            comp = path.split("components/")[1].split("/")[0]
        elif "site-packages/" in path:
            comp = path.split("site-packages/")[1].split("/")[0]
        elif "helpers/" in path:
            comp = "helpers"

        if level == "ERROR":
            error_sources[comp] = error_sources.get(comp, 0) + count
            error_details.append(f"{comp} x{count}: {message}")
        elif level == "WARNING":
            warning_sources[comp] = warning_sources.get(comp, 0) + count
            warning_details.append(f"{comp} x{count}: {message}")

    # Sort by count descending
    sorted_errors = sorted(error_sources.items(), key=lambda x: x[1], reverse=True)
    sorted_warnings = sorted(warning_sources.items(), key=lambda x: x[1], reverse=True)

    # Build error detail strings sorted by count
    error_detail_sorted = sorted(error_details, key=lambda x: int(x.split(" x")[1].split(":")[0]) if " x" in x else 0, reverse=True)
    warning_detail_sorted = sorted(warning_details, key=lambda x: int(x.split(" x")[1].split(":")[0]) if " x" in x else 0, reverse=True)

    total_errors = sum(c for _, c in sorted_errors)
    total_warnings = sum(c for _, c in sorted_warnings)

    state.set(
        "sensor.log_breakdown_dump",
        total_errors + total_warnings,
        {
            "friendly_name": "Log Breakdown Dump",
            "error_by_component": {k: v for k, v in sorted_errors},
            "warning_by_component": {k: v for k, v in sorted_warnings},
            "total_errors": total_errors,
            "total_warnings": total_warnings,
            "top_error_details": error_detail_sorted[:30],
            "top_warning_details": warning_detail_sorted[:30],
        },
    )
    log.info(f"Log breakdown dumped: {total_errors} errors, {total_warnings} warnings, {len(sorted_errors)} error sources, {len(sorted_warnings)} warning sources")
