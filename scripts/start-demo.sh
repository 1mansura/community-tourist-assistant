#!/usr/bin/env bash
# First-time / clean Docker: wipe volumes (if needed), rebuild stack, default demo data.
# Run from repo root: ./scripts/start-demo.sh
#
# Already have containers running and only want default data again? Use: ./scripts/reset-demo-data.sh
# Nuclear rebuild (no-cache): ./scripts/docker-fresh-restart.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec "$ROOT/scripts/setup-demo-docker.sh" "$@"
