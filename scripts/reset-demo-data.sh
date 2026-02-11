#!/usr/bin/env bash
# Quick demo reset: same Docker containers/volumes, default seeded data again.
# Use after practice demos without tearing the stack down.
#
# Usage:
#   ./scripts/reset-demo-data.sh           # docker compose up -d, then flush + fixtures + seed
#   ./scripts/reset-demo-data.sh --build   # same but rebuild images first (code changed)
#   ./scripts/reset-demo-data.sh --no-seed # fixtures only (no demo users / seed_demo)
#
# For broken Docker state or clean volumes, use: ./scripts/start-demo.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-ecm3432demo}"

if ! docker info >/dev/null 2>&1; then
  echo "error: cannot connect to the Docker daemon." >&2
  echo "  - Start Docker Desktop and wait until it is fully running." >&2
  echo "  - Then run: docker info   (should print Server Version without errors)" >&2
  echo "  - If it still fails: docker context ls   then  docker context use desktop-linux" >&2
  exit 1
fi

ARGS=()
BUILD=0
for a in "$@"; do
  case "$a" in
    --build) BUILD=1 ;;
    *) ARGS+=("$a") ;;
  esac
done

echo "==> Ensuring stack is up (project: ${COMPOSE_PROJECT_NAME})..."
echo "==> Freeing host ports 3000 and 8000 (stop local dev servers)..."
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
if [ "$BUILD" -eq 1 ]; then
  docker compose up -d --build
else
  docker compose up -d
fi

exec bash "$ROOT/scripts/lib/docker-demo-reset-data.sh" "${ARGS[@]}"
