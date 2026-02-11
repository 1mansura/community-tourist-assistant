#!/usr/bin/env bash
# One-time setup for demo when running backend locally (not in Docker).
# Runs: migrate (PostgreSQL), reset to baseline, load fixtures, demo users + placeholder images.
# Run from repo root. Requires PostgreSQL running and backend/.venv (or python in path).
#
# After this, start the app with ./scripts/start-local.sh and open http://localhost:3000.
# Log in with admin@example.com / DemoAdmin123! or demo@example.com / DemoUser123!

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Save any env vars set by caller (so .env doesn't override them)
_SAVED_POSTGRES_USER="$POSTGRES_USER"
_SAVED_POSTGRES_PASSWORD="$POSTGRES_PASSWORD"
_SAVED_POSTGRES_DB="$POSTGRES_DB"
_SAVED_DB_HOST="$DB_HOST"

if [ -f "$ROOT/.env" ]; then
  set -a
  source "$ROOT/.env"
  set +a
fi

export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.dev}"
# Prefer caller's env; then .env; then default to current user (Mac often has no "postgres" role)
export POSTGRES_USER="${_SAVED_POSTGRES_USER:-${POSTGRES_USER:-$(whoami)}}"
export POSTGRES_PASSWORD="${_SAVED_POSTGRES_PASSWORD:-${POSTGRES_PASSWORD:-}}"
export POSTGRES_DB="${_SAVED_POSTGRES_DB:-${POSTGRES_DB:-tourist_assistant}}"
export DB_HOST="${_SAVED_DB_HOST:-${DB_HOST:-localhost}}"

cd "$ROOT/backend"
PY="${ROOT}/backend/.venv/bin/python"
[ -x "$PY" ] || PY="python"

echo "Running migrations (PostgreSQL)..."
$PY manage.py migrate --noinput

echo "Resetting and loading demo fixtures..."
cd "$ROOT"
./scripts/load-fixtures.sh --demo --with-images

echo ""
echo "Done. Start the app with: ./scripts/start-local.sh"
echo "Then open http://localhost:3000 and log in with:"
echo "  Admin:   admin@example.com / DemoAdmin123!"
echo "  Customer: demo@example.com / DemoUser123!"
