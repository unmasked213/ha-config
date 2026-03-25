#!/bin/sh
. /config/scripts/.imap_env
# Reject non-numeric UIDs before invoking Python
uid="$1"
case "$uid" in
  *[!0-9]*) echo '{"ok":false,"error":"non-numeric UID"}' >&2; exit 2;;
esac
# Try HA Core path first (/usr/local/bin), fall back to addon path (/usr/bin)
for py in /usr/local/bin/python3 /usr/bin/python3; do
  [ -x "$py" ] && exec "$py" /config/scripts/fetch_imap_attachments.py "$1"
done
echo '{"ok":false,"error":"python3 not found"}' >&2
exit 1
