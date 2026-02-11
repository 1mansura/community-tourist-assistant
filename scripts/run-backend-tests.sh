#!/usr/bin/env bash
# Run backend pytest using the project venv. Use from repo root.
# Requires PostgreSQL (env: DB_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB).

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/backend/.venv"

# Load env from repo root if present (POSTGRES_*, DB_HOST, etc.)
if [[ -f "$ROOT/.env" ]]; then
  set -a
  source "$ROOT/.env"
  set +a
fi

if [[ ! -d "$VENV" ]]; then
  echo "Creating venv at backend/.venv and installing dependencies..."
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -r "$ROOT/backend/requirements.txt"
fi

cd "$ROOT/backend"
# Use SQLite test settings by default so tests run without PostgreSQL.
# Override with DJANGO_SETTINGS_MODULE=config.settings.dev to use Postgres.
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.test}"
"$VENV/bin/pytest" "$@"
