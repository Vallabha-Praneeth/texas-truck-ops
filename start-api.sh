#!/bin/bash
# start-api.sh — launch the NestJS API in test mode.
#
# Self-contained: sources nvm so that node/pnpm are on PATH even when this
# script is spawned from a non-interactive shell (e.g. via nohup inside
# scripts/ios/ensure-api-8081.sh). Without this, bare `pnpm` is not found
# because ~/.zshrc is never sourced for non-login/non-interactive shells.

# ── nvm / pnpm bootstrap ───────────────────────────────────────────────────
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  . "$NVM_DIR/nvm.sh" --no-use           # load nvm without switching version
  nvm use 20 2>/dev/null || nvm use default 2>/dev/null || true
fi
# ──────────────────────────────────────────────────────────────────────────

# Start API Server in Test Mode
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT/packages/api"
echo "🚀 Starting API server in test mode..."
echo "📍 Location: packages/api"
PORT="${PORT:-8081}"
echo "🌐 URL: http://localhost:${PORT}"
echo ""
NODE_ENV=test PORT="${PORT}" pnpm dev
