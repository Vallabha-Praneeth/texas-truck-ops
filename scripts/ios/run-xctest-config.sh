#!/usr/bin/env bash
# scripts/ios/run-xctest-config.sh  CONFIGURATION
#
# Self-contained runner for any named iOS XCTest configuration.
# Generalises run-fastregression.sh so that LocalAuthE2E and Accessibility
# can be driven from CI with the same pre-flight, warm-up, and triage
# behaviour as FastRegression.
#
# What it does
# ────────────
# 1. Ensures the API is healthy on port 8081.
# 2. Force-restarts Metro on port 8082 and polls until ready.
# 2b. Pre-warms the Metro JS bundle so the first app.launch() is fast.
# 3. Runs `xcodebuild test -only-test-configuration <CONFIGURATION>`.
# 4. On failure prints first assertion errors + service log tails.
# 5. Exits with xcodebuild's exit code.
#
# Usage
# ─────
#   bash scripts/ios/run-xctest-config.sh FastRegression
#   bash scripts/ios/run-xctest-config.sh LocalAuthE2E
#   bash scripts/ios/run-xctest-config.sh Accessibility
#   CONFIGURATION=LocalAuthE2E bash scripts/ios/run-xctest-config.sh
#
# Overridable via environment variables
# ──────────────────────────────────────
#   CONFIGURATION     (required – or pass as first positional arg)
#   IOS_DESTINATION   (default: platform=iOS Simulator,name=iPhone 16 Pro,OS=18.0)
#   IOS_WORKSPACE     (default: apps/mobile/ios/LEDBillboardMarketplace.xcworkspace)
#   IOS_SCHEME        (default: LEDBillboardMarketplace)
#   IOS_TEST_PLAN     (default: LEDBillboardMarketplace)
#   IOS_DERIVED_DATA  (default: apps/mobile/ios/build/DerivedData/<CONFIGURATION>)
#   XCODEBUILD_LOG    (default: /tmp/xcodebuild-<config-slug>.log)
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Resolve configuration ──────────────────────────────────────────────────────
CONFIGURATION="${1:-${CONFIGURATION:-}}"
[[ -n "$CONFIGURATION" ]] || {
  printf 'Usage: %s <FastRegression|LocalAuthE2E|Accessibility>\n' "$0" >&2
  exit 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ── Configuration ──────────────────────────────────────────────────────────────
WORKSPACE="${IOS_WORKSPACE:-$ROOT_DIR/apps/mobile/ios/LEDBillboardMarketplace.xcworkspace}"
SCHEME="${IOS_SCHEME:-LEDBillboardMarketplace}"
TEST_PLAN="${IOS_TEST_PLAN:-LEDBillboardMarketplace}"
DESTINATION="${IOS_DESTINATION:-platform=iOS Simulator,name=iPhone 16 Pro,OS=18.0}"
DERIVED_DATA="${IOS_DERIVED_DATA:-$ROOT_DIR/apps/mobile/ios/build/DerivedData/$CONFIGURATION}"

# Default XCODEBUILD_LOG to a per-config path (e.g. "LocalAuthE2E" → "local-auth-e2e")
_SLUG="${CONFIGURATION}"
_SLUG="${_SLUG//Auth/auth}"
_SLUG="${_SLUG//Regression/regression}"
_SLUG="${_SLUG//Accessibility/accessibility}"
_SLUG="${_SLUG//E2E/e2e}"
_SLUG="$(printf '%s' "$_SLUG" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')"
XCODEBUILD_LOG="${XCODEBUILD_LOG:-/tmp/xcodebuild-${_SLUG}.log}"

ENSURE_API="$SCRIPT_DIR/ensure-api-8081.sh"
ENSURE_METRO="$SCRIPT_DIR/ensure-metro-8082.sh"

# ── Helpers ───────────────────────────────────────────────────────────────────
log()  { printf '[xctest:%s] %s\n' "$CONFIGURATION" "$*"; }
step() { printf '\n── Step %s: %s ──\n' "$1" "$2"; }
fail() { printf '[xctest:%s] FATAL: %s\n' "$CONFIGURATION" "$*" >&2; exit 1; }

print_summary() {
  local exit_code="$1"
  printf '\n════════════════════════════════════════════════════════════\n'
  if [[ "$exit_code" -eq 0 ]]; then
    printf '✓  %s ALL TESTS PASSED\n' "$CONFIGURATION"
    grep -E 'Executed [0-9]+ tests.*[0-9]+ seconds' "$XCODEBUILD_LOG" | tail -1 || true
  else
    printf '✗  %s FAILED  (xcodebuild exit %s)\n' "$CONFIGURATION" "$exit_code"
    printf '\n── First assertion failures ──────────────────────────────\n'
    grep -E 'error: -\[|XCTAssertTrue failed|XCTAssertEqual failed' \
      "$XCODEBUILD_LOG" | head -20 || true
    printf '\n── Test-suite summary ────────────────────────────────────\n'
    grep -E 'Executed [0-9]+ tests|Test Suite.*failed|Test Suite.*passed' \
      "$XCODEBUILD_LOG" | tail -5 || true
    printf '\n── Metro log tail (last 20 lines) ────────────────────────\n'
    tail -20 "$ROOT_DIR/apps/mobile/.metro-8082.log" 2>/dev/null || true
    printf '\n── API log tail (last 20 lines) ──────────────────────────\n'
    tail -20 "$ROOT_DIR/apps/mobile/.api-8081.log" 2>/dev/null || true
  fi
  printf '════════════════════════════════════════════════════════════\n'
}

# ── Step 0: Pre-flight ─────────────────────────────────────────────────────────
step "0/3" "Pre-flight"
[[ -d "$WORKSPACE" ]]    || fail "workspace not found: $WORKSPACE"
[[ -f "$ENSURE_API" ]]   || fail "ensure-api script not found: $ENSURE_API"
[[ -f "$ENSURE_METRO" ]] || fail "ensure-metro script not found: $ENSURE_METRO"

log "configuration: $CONFIGURATION"
log "workspace:     $WORKSPACE"
log "scheme:        $SCHEME"
log "testPlan:      $TEST_PLAN"
log "destination:   $DESTINATION"
log "derivedData:   $DERIVED_DATA"
log "xcbuild log:   $XCODEBUILD_LOG"

mkdir -p "$DERIVED_DATA"
: > "$XCODEBUILD_LOG"

# ── Step 0b: Simulator boot ────────────────────────────────────────────────────
SIM_NAME="${DESTINATION##*name=}"
log "Ensuring simulator '$SIM_NAME' is booted..."
xcrun simctl boot "$SIM_NAME" 2>/dev/null || true   # exit 149 when already booted; OK

# ── Step 1: API ────────────────────────────────────────────────────────────────
step "1/3" "API pre-flight (localhost:8081)"
bash "$ENSURE_API"

# ── Step 2: Metro ──────────────────────────────────────────────────────────────
step "2/3" "Metro pre-flight (localhost:8082, force-restart)"
METRO_FORCE_RESTART=1 bash "$ENSURE_METRO"

# ── Step 2b: Metro bundle warm-up ─────────────────────────────────────────────
# Metro reports "packager-status:running" as soon as its HTTP server is up, but
# the JS bundle may not be compiled yet.  Requesting the bundle here blocks until
# Metro has compiled and cached it, so the first app.launch() in the test suite
# renders in < 2 s instead of timing out on cold start.
step "2b/3" "Metro bundle warm-up (pre-compile iOS bundle)"
log "Requesting /index.bundle to trigger compilation before xcodebuild..."
curl -sf \
  "http://localhost:8082/index.bundle?platform=ios&dev=true&minify=false" \
  -o /dev/null \
  --max-time 90 \
  && log "Bundle warm-up complete." \
  || log "WARN: Bundle warm-up request failed or timed out; proceeding anyway."

# ── Step 3: xcodebuild test ────────────────────────────────────────────────────
step "3/3" "xcodebuild test -only-test-configuration $CONFIGURATION"

export RCT_METRO_HOST="127.0.0.1"
export RCT_METRO_PORT="8082"

set +e
xcodebuild test \
  -workspace               "$WORKSPACE" \
  -scheme                  "$SCHEME" \
  -testPlan                "$TEST_PLAN" \
  -only-test-configuration "$CONFIGURATION" \
  -destination             "$DESTINATION" \
  -derivedDataPath         "$DERIVED_DATA" \
  2>&1 | tee "$XCODEBUILD_LOG"
XC_EXIT=${PIPESTATUS[0]}
set -e

print_summary "$XC_EXIT"
exit "$XC_EXIT"
