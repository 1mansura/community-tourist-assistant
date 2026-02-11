#!/usr/bin/env bash
# Full demo setup using Docker: PostgreSQL, MinIO, backend, frontend.
# Migrations run automatically when the backend container starts.
# This script brings the stack up and loads fixtures + demo users + placeholder images.
#
# Run from repo root. Requires Docker and Docker Compose.
#
# Usage:
#   ./scripts/setup-demo-docker.sh              # start stack + load data + demo users + images
#   ./scripts/setup-demo-docker.sh --no-seed     # start stack + load fixtures only (no demo users)
#
# If the stack is already up and you only want default data again, use ./scripts/reset-demo-data.sh (faster).

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Default project name avoids stale Compose state after Docker Engine glitches (ghost container IDs).
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-ecm3432demo}"

if ! docker info >/dev/null 2>&1; then
  echo "error: cannot connect to the Docker daemon." >&2
  echo "  Start Docker Desktop, wait until it is running, then: docker info" >&2
  exit 1
fi

# Pre-flight: after Docker Engine restarts, Compose can reference a removed DB container ID
# ("No such container: ...") or leave volumes "not created by Compose". Tear down hard so `up` works.
echo "Preparing Docker project (${COMPOSE_PROJECT_NAME})..."
docker compose down --remove-orphans 2>/dev/null || true
ids=$(docker ps -aq --filter "name=${COMPOSE_PROJECT_NAME}-" 2>/dev/null || true)
for id in $ids; do
  docker rm -f "$id" 2>/dev/null || true
done
docker rm -f ecm3432-db 2>/dev/null || true
# Ghost DB containers often have no name but still hold the DB volume (blocks volume rm + breaks compose up).
for vol in "${COMPOSE_PROJECT_NAME}_db_data" "${COMPOSE_PROJECT_NAME}_postgres_data"; do
  for id in $(docker ps -aq --filter "volume=${vol}" 2>/dev/null || true); do
    docker rm -f "$id" 2>/dev/null || true
  done
done
docker volume rm -f "${COMPOSE_PROJECT_NAME}_db_data" "${COMPOSE_PROJECT_NAME}_postgres_data" "${COMPOSE_PROJECT_NAME}_minio_data" 2>/dev/null || true

echo "Freeing host ports 3000 and 8000 (stop local dev servers)..."
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true

echo "Starting Docker stack (PostgreSQL, MinIO, backend, frontend)..."
docker compose up -d --build

exec bash "$ROOT/scripts/lib/docker-demo-reset-data.sh" "$@"
