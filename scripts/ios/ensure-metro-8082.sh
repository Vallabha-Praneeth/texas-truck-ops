#!/usr/bin/env bash
set -euo pipefail

# ── nvm / pnpm bootstrap ───────────────────────────────────────────────────
# Source nvm so that pnpm is on PATH even when this script is invoked from a
# non-interactive shell (e.g. via nohup inside run-fastregression.sh).
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  . "$NVM_DIR/nvm.sh" --no-use           # load nvm without switching version
  nvm use 20 2>/dev/null || nvm use default 2>/dev/null || true
fi
# ──────────────────────────────────────────────────────────────────────────

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
MOBILE_DIR="$ROOT_DIR/apps/mobile"
METRO_PORT="${METRO_PORT:-8082}"
METRO_HOST="${METRO_HOST:-localhost}"
METRO_LOG_FILE="$MOBILE_DIR/.metro-8082.log"
METRO_PID_FILE="$MOBILE_DIR/.metro-8082.pid"
METRO_FORCE_RESTART="${METRO_FORCE_RESTART:-0}"
METRO_STATUS_URL="http://${METRO_HOST}:${METRO_PORT}/status"

if [[ ! -d "$MOBILE_DIR" ]]; then
  echo "[ios:metro] Missing mobile app directory: $MOBILE_DIR"
  exit 1
fi

if lsof -nP -iTCP:"$METRO_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  if [[ "$METRO_FORCE_RESTART" != "1" ]]; then
    echo "[ios:metro] Metro already running on port $METRO_PORT"
    exit 0
  fi

  echo "[ios:metro] Restarting Metro on port $METRO_PORT"
  if [[ -f "$METRO_PID_FILE" ]]; then
    kill "$(cat "$METRO_PID_FILE")" 2>/dev/null || true
    rm -f "$METRO_PID_FILE"
  fi

  lsof -tiTCP:"$METRO_PORT" -sTCP:LISTEN | xargs -r kill || true
  sleep 1
fi

mkdir -p "$MOBILE_DIR"
: > "$METRO_LOG_FILE"

echo "[ios:metro] Starting Metro on port $METRO_PORT (logs: $METRO_LOG_FILE)"
(
  cd "$ROOT_DIR"
  nohup pnpm --filter @led-billboard/mobile start:test \
    >>"$METRO_LOG_FILE" 2>&1 < /dev/null &
  metro_pid="$!"
  echo "$metro_pid" > "$METRO_PID_FILE"
  disown "$metro_pid" 2>/dev/null || true
)

attempts=60
while (( attempts > 0 )); do
  if [[ "$(curl -fsS "$METRO_STATUS_URL" 2>/dev/null || true)" == "packager-status:running" ]]; then
    echo "[ios:metro] Metro is ready at $METRO_STATUS_URL"
    exit 0
  fi
  attempts=$((attempts - 1))
  sleep 1
done

echo "[ios:metro] Metro did not become ready at $METRO_STATUS_URL within timeout."
echo "[ios:metro] Last Metro log lines:"
tail -n 40 "$METRO_LOG_FILE" || true
exit 1
