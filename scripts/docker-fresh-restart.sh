#!/usr/bin/env bash
# Nuclear reset: stop stack, remove DB/MinIO volumes, rebuild images without cache,
# start everything, re-seed demo data. Use when containers feel "stale" or out of date.
#
# Run from repo root: ./scripts/docker-fresh-restart.sh
#
# Requires: Docker Desktop running.
# Warning: wipes Docker Postgres + MinIO data for this project (demo baseline is restored).

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Stable project name avoids cross-talk with other checkouts and keeps volume names predictable.
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-ecm3432demo}"

echo "==> Stopping stack (clean pass so volumes can be removed)..."
# First: stop/remove containers without -v so nothing holds the DB volume.
docker compose down --remove-orphans 2>/dev/null || true
# Remove any leftover containers for this project (fixes 'No such container: <id>' after engine restarts).
for id in $(docker ps -aq --filter "name=${COMPOSE_PROJECT_NAME}-" 2>/dev/null); do
  docker rm -f "$id" 2>/dev/null || true
done
docker rm -f ecm3432-db 2>/dev/null || true
for vol in "${COMPOSE_PROJECT_NAME}_db_data" "${COMPOSE_PROJECT_NAME}_postgres_data"; do
  for id in $(docker ps -aq --filter "volume=${vol}" 2>/dev/null); do
    docker rm -f "$id" 2>/dev/null || true
  done
done

echo "==> Removing named volumes (postgres + minio)..."
docker compose down -v --remove-orphans 2>/dev/null || true
# If a volume was still in use earlier, force-remove by canonical name.
docker volume rm -f "${COMPOSE_PROJECT_NAME}_db_data" "${COMPOSE_PROJECT_NAME}_postgres_data" "${COMPOSE_PROJECT_NAME}_minio_data" 2>/dev/null || true

echo "==> Freeing host ports 3000 / 8000 (non-Docker leftovers)..."
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true

echo "==> Rebuilding backend + frontend images (--no-cache)..."
docker compose build --no-cache backend frontend

echo "==> Starting all services..."
docker compose up -d

bash "$ROOT/scripts/lib/docker-demo-reset-data.sh"

echo "==> Syncing frontend node_modules inside container (package.json changes)..."
docker compose exec frontend npm install
docker compose restart frontend

echo ""
echo "Done. Open http://localhost:3000  |  API docs: http://localhost:8000/api/docs/"
echo "Admin: admin@example.com / DemoAdmin123!"
echo ""
