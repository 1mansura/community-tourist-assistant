#!/usr/bin/env bash
# Load example places (7 categories + 12 Devon attractions) and optional demo users.
# Uses PostgreSQL only. Run from project root.
#
# For the MVP demo with Docker (PostgreSQL from Docker): use ./scripts/setup-demo-docker.sh instead.
#
# When running this script on the host against a PostgreSQL instance:
#   - Docker Postgres: ensure .env has POSTGRES_USER=postgres, POSTGRES_PASSWORD=postgres, POSTGRES_DB=tourist_assistant, DB_HOST=localhost (and start db with: docker compose up -d db)
#   - Local Postgres (e.g. Mac): set POSTGRES_USER to your DB user, POSTGRES_DB, and optionally POSTGRES_PASSWORD in .env
#
# Usage:
#   ./scripts/load-fixtures.sh                     # categories + places only
#   ./scripts/load-fixtures.sh --demo              # reset + categories + places + demo users
#   ./scripts/load-fixtures.sh --demo --with-images  # reset + demo users + placeholder images

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Load .env from repo root if present (PostgreSQL connection)
if [ -f "$ROOT/.env" ]; then
  set -a
  source "$ROOT/.env"
  set +a
fi

export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.dev}"
export POSTGRES_USER="${POSTGRES_USER:-postgres}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
export POSTGRES_DB="${POSTGRES_DB:-tourist_assistant}"
export DB_HOST="${DB_HOST:-localhost}"

cd "$ROOT/backend"

PY="python"
if [ -d ".venv" ]; then
  PY=".venv/bin/python"
fi

DEMO_MODE=false
WITH_IMAGES=false
for arg in "$@"; do
  if [ "$arg" = "--demo" ]; then
    DEMO_MODE=true
  fi
  if [ "$arg" = "--with-images" ]; then
    WITH_IMAGES=true
  fi
done

if [ "$DEMO_MODE" = true ]; then
  echo "Resetting database to demo baseline..."
  $PY manage.py flush --noinput
fi

echo "Loading example categories and places..."
$PY manage.py loaddata fixtures/categories.json fixtures/assets.json
echo "Done. 7 categories and 12 example places loaded."

if [ "$DEMO_MODE" = true ]; then
  echo "Creating demo users (admin, moderator, contributor, user)..."
  if [ "$WITH_IMAGES" = true ]; then
    $PY manage.py seed_demo --with-images
  else
    $PY manage.py seed_demo
  fi
  echo "Done. Admin: admin@example.com / DemoAdmin123!, User: demo@example.com / DemoUser123!"
fi
