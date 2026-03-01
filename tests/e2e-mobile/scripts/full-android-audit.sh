#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
MOBILE_DIR="$ROOT_DIR/apps/mobile"
ANDROID_DIR="$MOBILE_DIR/android"
E2E_DIR="$ROOT_DIR/tests/e2e-mobile"
API_HEALTH_URL="${MOBILE_API_HEALTH_URL:-http://localhost:8081/api/health}"
METRO_PORT="${MOBILE_METRO_PORT:-8082}"
METRO_STATUS_URL="http://localhost:${METRO_PORT}/status"
API_LOG="/tmp/b2b-mobile-audit-api.log"
METRO_LOG="/tmp/b2b-mobile-audit-metro.log"
DEFAULT_SDK_PATH="$HOME/Library/Android/sdk"
SDK_PATH="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$DEFAULT_SDK_PATH}}"
ADB_BIN="$SDK_PATH/platform-tools/adb"
EMULATOR_BIN="$SDK_PATH/emulator/emulator"
AVD_NAME="${AVD_NAME:-Pixel_8}"
STARTED_API=0
STARTED_METRO=0
API_PID=""
METRO_PID=""

wait_for_http_ok() {
  local url="$1"
  local timeout_seconds="${2:-45}"
  local elapsed=0

  until curl -fsS "$url" >/dev/null 2>&1; do
    sleep 1
    elapsed=$((elapsed + 1))
    if [ "$elapsed" -ge "$timeout_seconds" ]; then
      echo "Timed out waiting for $url"
      return 1
    fi
  done
}

kill_listeners_on_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      echo "$pids" | xargs kill >/dev/null 2>&1 || true
      sleep 1
    fi
  fi
}

wait_for_android_boot() {
  local timeout_seconds="${1:-120}"
  local elapsed=0

  "$ADB_BIN" wait-for-device >/dev/null 2>&1 || true
  until [ "$("$ADB_BIN" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    sleep 2
    elapsed=$((elapsed + 2))
    if [ "$elapsed" -ge "$timeout_seconds" ]; then
      echo "Timed out waiting for Android emulator boot completion"
      return 1
    fi
  done
}

ensure_android_device() {
  if [ ! -x "$ADB_BIN" ]; then
    echo "adb not found at $ADB_BIN"
    return 1
  fi
  if [ ! -x "$EMULATOR_BIN" ]; then
    echo "emulator binary not found at $EMULATOR_BIN"
    return 1
  fi

  if "$ADB_BIN" devices | grep -E -q '[[:space:]]device$'; then
    echo "Android device/emulator already connected"
    return 0
  fi

  if ! "$EMULATOR_BIN" -list-avds | grep -qx "$AVD_NAME"; then
    echo "Requested AVD '$AVD_NAME' not found. Available AVDs:"
    "$EMULATOR_BIN" -list-avds || true
    return 1
  fi

  echo "Starting Android emulator: $AVD_NAME"
  nohup "$EMULATOR_BIN" -avd "$AVD_NAME" -netdelay none -netspeed full \
    >/tmp/b2b-mobile-audit-emulator.log 2>&1 &

  wait_for_android_boot 180
  "$ADB_BIN" devices
}

cleanup() {
  if [ "$STARTED_METRO" -eq 1 ] && [ -n "${METRO_PID}" ]; then
    kill "$METRO_PID" >/dev/null 2>&1 || true
  fi
  if [ "$STARTED_API" -eq 1 ] && [ -n "${API_PID}" ]; then
    kill "$API_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

echo "== Android Mobile Full Audit =="
echo "Root: $ROOT_DIR"
echo

echo "0) Ensure Android emulator/device is connected"
ensure_android_device
echo

echo "1) Ensure API and Metro are running"
if curl -fsS "$API_HEALTH_URL" >/dev/null 2>&1; then
  echo "API already running at $API_HEALTH_URL"
else
  echo "Starting API at 8081 (log: $API_LOG)"
  (
    cd "$ROOT_DIR"
    PORT=8081 ./start-api.sh >"$API_LOG" 2>&1
  ) &
  API_PID="$!"
  STARTED_API=1
  wait_for_http_ok "$API_HEALTH_URL" 60
fi

# Always kill any stale Metro listener first, then start fresh.
# This eliminates the split "already running / not running" branch that could
# mistrack METRO_PID and leave a zombie process producing stale bundle errors.
echo "Stopping any existing Metro listener on port $METRO_PORT"
kill_listeners_on_port "$METRO_PORT"
sleep 1

echo "Starting Metro dev client at $METRO_PORT with clean cache (log: $METRO_LOG)"
# Must cd into MOBILE_DIR (not ROOT_DIR) so metro.config.js cwd is correct.
(
  cd "$MOBILE_DIR"
  EXPO_NO_TELEMETRY=1 pnpm exec expo start --dev-client --port "$METRO_PORT" --clear >"$METRO_LOG" 2>&1
) &
METRO_PID="$!"
STARTED_METRO=1
wait_for_http_ok "$METRO_STATUS_URL" 90
echo

echo "2) Expo dependency compatibility check"
pnpm --filter @led-billboard/mobile exec expo install --check
echo

echo "3) Android JS bundle export check"
(
  cd "$MOBILE_DIR"
  EXPO_NO_TELEMETRY=1 pnpm exec expo export --platform android --output-dir ./dist-export --clear
)
echo

echo "4) Android debug APK build"
(
  cd "$ANDROID_DIR"
  ./gradlew assembleDebug
)
echo

echo "5) Device/API/Metro preflight"
(
  cd "$E2E_DIR"
  node ./scripts/preflight-android.mjs
)
echo

echo "6) Appium Android E2E suite"
(
  cd "$E2E_DIR"
  pnpm exec wdio run wdio.conf.ts --spec ./tests/**/*.spec.ts --suite android
)
echo

echo "✅ Full Android mobile audit passed"
