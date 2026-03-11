#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8002/api/v1}"
MINT_TOKEN_URL="${API_BASE_URL}/dev/mint-token"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GET_SLOT_SCRIPT="${SCRIPT_DIR}/get-slot-id.mjs"

GREEN="$(printf '\033[0;32m')"
RED="$(printf '\033[0;31m')"
BLUE="$(printf '\033[0;34m')"
YELLOW="$(printf '\033[0;33m')"
RESET="$(printf '\033[0m')"

ok()   { echo "${GREEN}✓${RESET} $*"; }
fail() { echo "${RED}✗${RESET} $*" 1>&2; }
step() { echo "${BLUE}==>${RESET} $*"; }
warn() { echo "${YELLOW}⚠${RESET} $*" 1>&2; }

banner() {
cat <<'EOF'
╔════════════════════════════════════════════════════════════╗
║    Stage 3 E2E Smoke Test - With Authorization            ║
╚════════════════════════════════════════════════════════════╝
EOF
}

need_cmd() { command -v "$1" >/dev/null 2>&1 || { fail "Missing dependency: $1"; exit 1; }; }

# Performs HTTP POST and returns status:body on separate lines
# Usage: result=$(http_post_json url json [token])
#        status=$(echo "$result" | head -n 1)
#        body=$(echo "$result" | tail -n +2)
http_post_json() {
  local url="$1"
  local json="$2"
  local token="${3:-}"

  local tmp_body tmp_hdr tmp_out
  tmp_body="$(mktemp)"
  tmp_hdr="$(mktemp)"
  tmp_out="$(mktemp)"

  if [[ -n "$token" ]]; then
    curl -sS --http1.1 -X POST "$url" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${token}" \
      -d "$json" \
      -o "$tmp_body" \
      -D "$tmp_hdr" 2>/dev/null || true
  else
    curl -sS --http1.1 -X POST "$url" \
      -H "Content-Type: application/json" \
      -d "$json" \
      -o "$tmp_body" \
      -D "$tmp_hdr" 2>/dev/null || true
  fi

  # Parse HTTP status from first header line
  local status
  status="$(head -n 1 "$tmp_hdr" | awk '{print $2}' | tr -d '\r\n' || echo "")"

  if [[ -z "$status" ]]; then
    fail "Failed to parse HTTP status from headers"
    echo "First 3 header lines:" 1>&2
    head -n 3 "$tmp_hdr" 1>&2
    rm -f "$tmp_body" "$tmp_hdr" "$tmp_out"
    exit 1
  fi

  # Write status on first line, body on subsequent lines
  echo "$status" > "$tmp_out"
  cat "$tmp_body" >> "$tmp_out"
  cat "$tmp_out"

  rm -f "$tmp_body" "$tmp_hdr" "$tmp_out"
}

# Performs HTTP GET and returns status:body on separate lines
http_get() {
  local url="$1"
  local token="${2:-}"

  local tmp_body tmp_hdr tmp_out
  tmp_body="$(mktemp)"
  tmp_hdr="$(mktemp)"
  tmp_out="$(mktemp)"

  if [[ -n "$token" ]]; then
    curl -sS --http1.1 -X GET "$url" \
      -H "Authorization: Bearer ${token}" \
      -o "$tmp_body" \
      -D "$tmp_hdr" 2>/dev/null || true
  else
    curl -sS --http1.1 -X GET "$url" \
      -o "$tmp_body" \
      -D "$tmp_hdr" 2>/dev/null || true
  fi

  # Parse HTTP status
  local status
  status="$(head -n 1 "$tmp_hdr" | awk '{print $2}' | tr -d '\r\n' || echo "")"

  if [[ -z "$status" ]]; then
    fail "Failed to parse HTTP status from headers"
    echo "First 3 header lines:" 1>&2
    head -n 3 "$tmp_hdr" 1>&2
    rm -f "$tmp_body" "$tmp_hdr" "$tmp_out"
    exit 1
  fi

  # Write status on first line, body on subsequent lines
  echo "$status" > "$tmp_out"
  cat "$tmp_body" >> "$tmp_out"
  cat "$tmp_out"

  rm -f "$tmp_body" "$tmp_hdr" "$tmp_out"
}

require_status() {
  local expected="$1"
  local actual="$2"
  local body="$3"
  local label="$4"

  if [[ "$actual" != "$expected" ]]; then
    fail "$label (HTTP ${actual})"
    echo "Response: $body" 1>&2
    exit 1
  fi
}

main() {
  banner

  need_cmd curl
  need_cmd jq
  need_cmd node

  step "Using API_BASE_URL: ${API_BASE_URL}"
  step "Mint token endpoint: ${MINT_TOKEN_URL}"

  step "Step 0: Minting JWT tokens via API for broker and operator..."
  local broker_result broker_status broker_resp broker_token
  local operator_result operator_status operator_resp operator_token

  broker_result="$(http_post_json "$MINT_TOKEN_URL" '{"sub":"smoke-broker-001","role":"broker"}')"
  broker_status="$(echo "$broker_result" | head -n 1)"
  broker_resp="$(echo "$broker_result" | tail -n +2)"
  require_status "200" "$broker_status" "$broker_resp" "Failed to mint broker token"
  broker_token="$(echo "$broker_resp" | jq -r '.token // empty')"
  [[ -n "$broker_token" && "$broker_token" != "null" ]] || { fail "Broker token missing"; echo "$broker_resp" 1>&2; exit 1; }
  ok "Minted broker token"

  operator_result="$(http_post_json "$MINT_TOKEN_URL" '{"sub":"smoke-operator-001","role":"operator"}')"
  operator_status="$(echo "$operator_result" | head -n 1)"
  operator_resp="$(echo "$operator_result" | tail -n +2)"
  require_status "200" "$operator_status" "$operator_resp" "Failed to mint operator token"
  operator_token="$(echo "$operator_resp" | jq -r '.token // empty')"
  [[ -n "$operator_token" && "$operator_token" != "null" ]] || { fail "Operator token missing"; echo "$operator_resp" 1>&2; exit 1; }
  ok "Minted operator token"

  step "Step 0.5: Fetching valid slot ID from database..."
  [[ -f "$GET_SLOT_SCRIPT" ]] || { fail "Missing script: $GET_SLOT_SCRIPT"; exit 1; }
  local slot_id
  slot_id="$(node "$GET_SLOT_SCRIPT")"
  [[ -n "$slot_id" ]] || { fail "No slot ID found. Ensure DB has at least one availability slot."; exit 1; }
  ok "Found slot ID: $slot_id"

  step "Step 1: Creating request (broker)..."
  local request_result request_status request_body request_id
  request_result="$(http_post_json "${API_BASE_URL}/requests" \
    '{
      "region":"DFW",
      "title":"Smoke Test Campaign",
      "description":"Stage 3 smoke test request",
      "preferredStartAt":"2026-03-01T10:00:00Z",
      "preferredEndAt":"2026-03-05T18:00:00Z",
      "budgetCents":250000
    }' \
    "$broker_token")"
  request_status="$(echo "$request_result" | head -n 1)"
  request_body="$(echo "$request_result" | tail -n +2)"
  require_status "201" "$request_status" "$request_body" "Create request failed"
  request_id="$(echo "$request_body" | jq -r '.id')"
  ok "Created request: $request_id"

  step "Step 2: List offers (should be empty)..."
  local offers_result offers_status offers_body total0
  offers_result="$(http_get "${API_BASE_URL}/requests/${request_id}/offers" "$broker_token")"
  offers_status="$(echo "$offers_result" | head -n 1)"
  offers_body="$(echo "$offers_result" | tail -n +2)"
  require_status "200" "$offers_status" "$offers_body" "List offers failed"
  total0="$(echo "$offers_body" | jq -r '.total')"
  [[ "$total0" == "0" ]] || { fail "Expected total=0, got total=$total0"; echo "$offers_body" 1>&2; exit 1; }
  ok "Offers empty as expected (total=0)"

  step "Step 3: Create offer (operator)..."
  local offer_result offer_status offer_body offer_id
  offer_result="$(http_post_json "${API_BASE_URL}/offers" \
    "{
      \"requestId\":\"${request_id}\",
      \"slotId\":\"${slot_id}\",
      \"amountCents\":120000,
      \"terms\":{\"deposit\":30}
    }" \
    "$operator_token")"
  offer_status="$(echo "$offer_result" | head -n 1)"
  offer_body="$(echo "$offer_result" | tail -n +2)"
  require_status "201" "$offer_status" "$offer_body" "Create offer failed"
  offer_id="$(echo "$offer_body" | jq -r '.id')"
  ok "Created offer: $offer_id"

  step "Step 4: List offers (should have >= 1)..."
  local offers2_result offers2_status offers2_body total2
  offers2_result="$(http_get "${API_BASE_URL}/requests/${request_id}/offers" "$broker_token")"
  offers2_status="$(echo "$offers2_result" | head -n 1)"
  offers2_body="$(echo "$offers2_result" | tail -n +2)"
  require_status "200" "$offers2_status" "$offers2_body" "List offers (after create) failed"
  total2="$(echo "$offers2_body" | jq -r '.total')"
  [[ "$total2" =~ ^[0-9]+$ ]] && [[ "$total2" -ge 1 ]] || { fail "Expected total>=1, got total=$total2"; echo "$offers2_body" 1>&2; exit 1; }
  ok "Offers present (total=$total2)"

  step "Step 5: Accept offer (operator)..."
  local accept_result accept_status accept_body booking_id
  accept_result="$(http_post_json "${API_BASE_URL}/offers/${offer_id}/accept" '{}' "$operator_token")"
  accept_status="$(echo "$accept_result" | head -n 1)"
  accept_body="$(echo "$accept_result" | tail -n +2)"
  require_status "201" "$accept_status" "$accept_body" "Accept offer failed"
  booking_id="$(echo "$accept_body" | jq -r '.booking.id')"
  ok "Booking created: $booking_id"

  step "Step 6: Get booking (broker)..."
  local booking_result booking_status booking_body got_booking_id got_offer_id got_slot_id
  booking_result="$(http_get "${API_BASE_URL}/bookings/${booking_id}" "$broker_token")"
  booking_status="$(echo "$booking_result" | head -n 1)"
  booking_body="$(echo "$booking_result" | tail -n +2)"
  require_status "200" "$booking_status" "$booking_body" "Get booking failed"

  got_booking_id="$(echo "$booking_body" | jq -r '.id')"
  got_offer_id="$(echo "$booking_body" | jq -r '.acceptedOfferId')"
  got_slot_id="$(echo "$booking_body" | jq -r '.slot.id')"

  [[ "$got_booking_id" == "$booking_id" ]] || { fail "Booking ID mismatch"; echo "$booking_body" 1>&2; exit 1; }
  [[ "$got_offer_id" == "$offer_id" ]] || { fail "Offer ID mismatch"; echo "$booking_body" 1>&2; exit 1; }
  [[ "$got_slot_id" == "$slot_id" ]] || { fail "Slot ID mismatch"; echo "$booking_body" 1>&2; exit 1; }

  cat <<EOF
╔════════════════════════════════════════════════════════════╗
║                  ${GREEN}✓ ALL TESTS PASSED!${RESET}                       ║
╚════════════════════════════════════════════════════════════╝
EOF
  echo "Full vertical slice working correctly! 🎉"
}

main "$@"
