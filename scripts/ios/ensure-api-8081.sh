#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
API_PORT="${API_PORT:-8081}"
API_HEALTH_URL="${API_HEALTH_URL:-http://localhost:${API_PORT}/api/health}"
API_LOG_FILE="${API_LOG_FILE:-$ROOT_DIR/apps/mobile/.api-${API_PORT}.log}"
API_PID_FILE="${API_PID_FILE:-$ROOT_DIR/apps/mobile/.api-${API_PORT}.pid}"

if curl -fsS "$API_HEALTH_URL" >/dev/null 2>&1; then
  echo "[ios:api] API already healthy at $API_HEALTH_URL"
  exit 0
fi

mkdir -p "$(dirname "$API_LOG_FILE")"
: > "$API_LOG_FILE"

echo "[ios:api] Starting API on port $API_PORT (logs: $API_LOG_FILE)"
(
  cd "$ROOT_DIR"
  nohup env CI=1 PORT="$API_PORT" ./start-api.sh >>"$API_LOG_FILE" 2>&1 < /dev/null &
  api_pid="$!"
  echo "$api_pid" > "$API_PID_FILE"
  disown "$api_pid" 2>/dev/null || true
)

attempts=60
while (( attempts > 0 )); do
  if curl -fsS "$API_HEALTH_URL" >/dev/null 2>&1; then
    echo "[ios:api] API is healthy at $API_HEALTH_URL"
    exit 0
  fi

  attempts=$((attempts - 1))
  sleep 1
done

echo "[ios:api] API did not become healthy at $API_HEALTH_URL within timeout."
echo "[ios:api] Last API log lines:"
tail -n 80 "$API_LOG_FILE" || true
exit 1
