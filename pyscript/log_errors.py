# | START: log_errors.py
# |  PATH: pyscript/log_errors.py

# Log error statistics sensor using HA's system_log internal data.


def _extract_component_name(path):
    """Extract clean component name from source path.
    
    Examples:
        components/websocket_api/http.py ? websocket_api
        custom_components/nationalrailtimes/apidata.py ? nationalrailtimes
        helpers/entity_platform.py ? helpers
        /usr/local/lib/python3.13/site-packages/switchbot/devices/device.py ? switchbot
    """
    if not path or path == "unknown":
        return "unknown"
    
    path = str(path)
    
    # custom_components/X/... ? X
    if "custom_components/" in path:
        parts = path.split("custom_components/")
        if len(parts) > 1:
            component = parts[1].split("/")[0]
            return component
    
    # components/X/... ? X
    if "components/" in path:
        parts = path.split("components/")
        if len(parts) > 1:
            component = parts[1].split("/")[0]
            return component
    
    # site-packages/X/... ? X
    if "site-packages/" in path:
        parts = path.split("site-packages/")
        if len(parts) > 1:
            component = parts[1].split("/")[0]
            return component
    
    # helpers/X.py ? helpers
    if "helpers/" in path:
        return "helpers"
    
    # Fallback: filename without extension
    if "/" in path:
        filename = path.split("/")[-1]
    else:
        filename = path
    
    if filename.endswith(".py"):
        filename = filename[:-3]
    
    return filename


@service
def update_log_errors():
    """Manually trigger log error stats update."""
    _update_stats()


@time_trigger("startup")
@time_trigger("cron(*/5 * * * *)")  # Every 5 minutes
def log_errors_scheduled():
    """Scheduled log error stats update."""
    _update_stats()


def _update_stats():
    """Query system_log records and update sensor."""
    try:
        errors = 0
        warnings = 0
        recent_sources = []
        
        handler = hass.data.get("system_log")
        
        if handler is not None and hasattr(handler, "records"):
            # DedupStore is dict-like, iterate via values()
            for entry in handler.records.values():
                level = None
                source_name = "unknown"
                count = 1
                
                # Check if it's a namedtuple with _fields
                if hasattr(entry, "_fields"):
                    level = getattr(entry, "level", None)
                    source = getattr(entry, "source", ())
                    count = getattr(entry, "count", 1)
                    if source and len(source) > 0:
                        source_name = _extract_component_name(source[0])
                elif hasattr(entry, "level"):
                    level = entry.level
                    source = getattr(entry, "source", ())
                    count = getattr(entry, "count", 1)
                    if source and len(source) > 0:
                        source_name = _extract_component_name(source[0])
                elif isinstance(entry, dict):
                    level = entry.get("level", "")
                    source = entry.get("source", ())
                    count = entry.get("count", 1)
                    if source and len(source) > 0:
                        source_name = _extract_component_name(source[0])
                
                if level:
                    level_str = str(level).upper()
                    if level_str == "ERROR":
                        errors += count
                        # Capitalize first letter of source name
                        source_display = source_name.capitalize() if source_name else "Unknown"
                        if source_display not in recent_sources and len(recent_sources) < 5:
                            recent_sources.append(source_display)
                    elif level_str == "WARNING":
                        warnings += count
        
        total = errors + warnings

        state.set(
            "sensor.log_error_count",
            errors,
            {
                "friendly_name": "Log Error Count",
                "icon": "mdi:alert-circle",
                "unit_of_measurement": "errors",
                "state_class": "measurement",
                "errors": errors,
                "warnings": warnings,
                "total": total,
                "recent_sources": recent_sources,
            },
        )

        log.info(f"Log errors updated: {errors} errors, {warnings} warnings")

    except Exception as e:
        log.error(f"Failed to update log errors: {e}")
        state.set(
            "sensor.log_error_count",
            "unavailable",
            {
                "friendly_name": "Log Error Count",
                "icon": "mdi:alert-circle",
                "error": str(e),
            },
        )


# |   END: log_errors.py