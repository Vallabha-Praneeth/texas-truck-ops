#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8002/api}"
TEST_PHONE="${TEST_PHONE:-+15550001111}"
INTERNAL_SERVICE_KEY="${INTERNAL_SERVICE_KEY:-dev-internal-service-key}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required"
  exit 1
fi

STREAM_LOG="$(mktemp)"
cleanup() {
  if [[ -n "${STREAM_PID:-}" ]] && kill -0 "${STREAM_PID}" >/dev/null 2>&1; then
    kill "${STREAM_PID}" >/dev/null 2>&1 || true
    wait "${STREAM_PID}" >/dev/null 2>&1 || true
  fi
  rm -f "${STREAM_LOG}"
}
trap cleanup EXIT

echo "1) Requesting test JWT token"
AUTH_RESPONSE="$(curl -sS -X POST "${API_BASE_URL}/auth/verify-otp" \
  -H 'content-type: application/json' \
  -d "{\"phone\":\"${TEST_PHONE}\",\"code\":\"123456\"}")"

TOKEN="$(echo "${AUTH_RESPONSE}" | jq -r '.token // empty')"
USER_ID="$(echo "${AUTH_RESPONSE}" | jq -r '.user.id // empty')"

if [[ -z "${TOKEN}" || -z "${USER_ID}" ]]; then
  echo "Failed to get token/user from auth response:"
  echo "${AUTH_RESPONSE}"
  exit 1
fi

echo "2) Opening SSE stream for user:${USER_ID}"
curl -sS -N "${API_BASE_URL}/realtime/stream" \
  -H "Authorization: Bearer ${TOKEN}" \
  >"${STREAM_LOG}" &
STREAM_PID=$!

sleep 2

SMOKE_EVENT="smoke:test"
SMOKE_PAYLOAD="{\"message\":\"hello-from-smoke\"}"
echo "3) Emitting ${SMOKE_EVENT} via internal endpoint"
EMIT_RESPONSE="$(curl -sS -X POST "${API_BASE_URL}/realtime/internal/emit" \
  -H 'content-type: application/json' \
  -H "x-internal-key: ${INTERNAL_SERVICE_KEY}" \
  -d "{\"channel\":\"user:${USER_ID}\",\"event\":\"${SMOKE_EVENT}\",\"payload\":${SMOKE_PAYLOAD}}")"

echo "${EMIT_RESPONSE}" | jq -e '.success == true' >/dev/null

sleep 2

echo "4) Verifying stream output"
if ! grep -q "event: ${SMOKE_EVENT}" "${STREAM_LOG}"; then
  echo "SSE event was not observed in stream output"
  echo "--- stream log ---"
  cat "${STREAM_LOG}"
  exit 1
fi

if ! grep -q "\"channel\":\"user:${USER_ID}\"" "${STREAM_LOG}"; then
  echo "SSE payload channel mismatch"
  echo "--- stream log ---"
  cat "${STREAM_LOG}"
  exit 1
fi

echo "Realtime smoke test passed"
