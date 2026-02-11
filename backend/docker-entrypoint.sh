#!/bin/sh
# Run migrations (PostgreSQL), then the main command.
set -e
python manage.py migrate --noinput
exec "$@"
