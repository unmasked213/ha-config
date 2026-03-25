# | START: recorder_stats.py
# |  PATH: pyscript/recorder_stats.py

# Recorder statistics sensor using direct SQLite queries.
# Pyscript has access to Python's sqlite3 module which works in HA Core context.

import sqlite3
import time

DB_PATH = "/config/home-assistant_v2.db"


@service
def update_recorder_stats():
    """Manually trigger recorder stats update."""
    _update_stats()


@time_trigger("startup")
@time_trigger("cron(*/5 * * * *)")  # Every 5 minutes
def recorder_stats_scheduled():
    """Scheduled recorder stats update."""
    _update_stats()


def _update_stats():
    """Query recorder database and update sensor."""
    try:
        now = int(time.time())
        hour_ago = now - 3600
        day_ago = now - 86400

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # States in last hour
        cursor.execute(
            "SELECT COUNT(*) FROM states WHERE last_updated_ts > ?", (hour_ago,)
        )
        states_1h = cursor.fetchone()[0]

        # Events in last hour
        cursor.execute(
            "SELECT COUNT(*) FROM events WHERE time_fired_ts > ?", (hour_ago,)
        )
        events_1h = cursor.fetchone()[0]

        # States in last 24 hours
        cursor.execute(
            "SELECT COUNT(*) FROM states WHERE last_updated_ts > ?", (day_ago,)
        )
        states_24h = cursor.fetchone()[0]

        # Events in last 24 hours
        cursor.execute(
            "SELECT COUNT(*) FROM events WHERE time_fired_ts > ?", (day_ago,)
        )
        events_24h = cursor.fetchone()[0]

        conn.close()

        # Calculate hourly averages
        states_per_hour = states_24h // 24
        events_per_hour = events_24h // 24

        # Set sensor state and attributes
        state.set(
            "sensor.recorder_statistics",
            states_1h,
            {
                "friendly_name": "Recorder Statistics",
                "icon": "mdi:database-clock",
                "unit_of_measurement": "states/h",
                "state_class": "measurement",
                "events_1h": events_1h,
                "states_1h": states_1h,
                "events_24h": events_24h,
                "states_24h": states_24h,
                "events_per_hour": events_per_hour,
                "states_per_hour": states_per_hour,
            },
        )

        log.info(f"Recorder stats updated: {states_1h} states/h, {events_1h} events/h")

    except Exception as e:
        log.error(f"Failed to update recorder stats: {e}")
        state.set(
            "sensor.recorder_statistics",
            "unavailable",
            {
                "friendly_name": "Recorder Statistics",
                "icon": "mdi:database-clock",
                "error": str(e),
            },
        )


# |   END: recorder_stats.py
