#!/usr/bin/env bash
# Run frontend Jest tests, lint, and type-check. Use from repo root.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"

if [[ ! -d "node_modules" ]]; then
  echo "Installing frontend dependencies..."
  npm install
fi

echo "==> Running Jest tests..."
npx jest --runInBand --watchAll=false "$@"

echo "==> Running ESLint..."
npm run lint

echo "==> Running TypeScript type-check..."
npx tsc --noEmit

echo "All frontend checks passed."
