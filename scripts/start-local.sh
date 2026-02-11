#!/usr/bin/env bash
# Start backend (8000) and frontend (3000). One localhost only.
# Run from project root: ./scripts/start-local.sh

set -e
cd "$(dirname "$0")/.."

# Free ports so we always get 3000 and 8000
echo "Freeing ports 3000 and 8000..."
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3002 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 2

cleanup() {
  echo "Stopping servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "Starting backend on http://localhost:8000 ..."
(
  cd backend
  if [ -f "../.env" ]; then
    set -a
    source ../.env
    set +a
  fi
  # Use .venv if it exists, fall back to venv, then system python
  if [ -d ".venv" ]; then
    source .venv/bin/activate
  elif [ -d "venv" ]; then
    source venv/bin/activate
  fi
  export DJANGO_SETTINGS_MODULE=config.settings.dev
export DB_HOST="${DB_HOST:-localhost}"
export POSTGRES_USER="${POSTGRES_USER:-$(whoami)}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
export POSTGRES_DB="${POSTGRES_DB:-tourist_assistant}"
  exec python manage.py runserver 0.0.0.0:8000
) &
BACKEND_PID=$!

sleep 3

echo "Starting frontend on http://localhost:3000 ..."
(
  cd frontend
  export NEXT_PUBLIC_API_URL=http://localhost:8000/api
  exec npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API docs:  http://localhost:8000/api/docs/"
echo ""
echo "Press Ctrl+C to stop both."
echo ""

wait
