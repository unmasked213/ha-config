# | START: system_context.py
# |  PATH: pyscript/system_context.py

# Loads /config/system_context.yaml and publishes as sensor.ha_system_context.
# Each top-level key becomes a native dict attribute on the sensor.
# Runs on startup. Call service pyscript.system_context_reload to refresh after edits.

import yaml
import pathlib

CONTEXT_FILE = "/config/system_context.yaml"


@service
def system_context_reload():
    """Reload system context from YAML file."""
    _publish_context()


@time_trigger("startup")
def system_context_startup():
    """Load system context on HA startup."""
    _publish_context()


def _publish_context():
    """Read YAML file and publish as sensor attributes."""
    try:
        content = task.executor(pathlib.Path(CONTEXT_FILE).read_text)
        data = yaml.safe_load(content)

        if not isinstance(data, dict):
            log.error(f"system_context: expected dict, got {type(data)}")
            state.set(
                "sensor.ha_system_context",
                "error",
                {"friendly_name": "HA System Context", "error": "Invalid YAML structure"},
            )
            return

        attrs = {"friendly_name": "HA System Context"}
        attrs.update(data)

        state.set(
            "sensor.ha_system_context",
            "ready",
            attrs,
        )

        section_count = len([k for k in data.keys()])
        log.info(f"system_context: published {section_count} sections")

    except FileNotFoundError:
        log.error(f"system_context: {CONTEXT_FILE} not found")
        state.set(
            "sensor.ha_system_context",
            "error",
            {"friendly_name": "HA System Context", "error": "File not found"},
        )
    except Exception as e:
        log.error(f"system_context: failed to load: {e}")
        state.set(
            "sensor.ha_system_context",
            "error",
            {"friendly_name": "HA System Context", "error": str(e)},
        )


# |   END: system_context.py
