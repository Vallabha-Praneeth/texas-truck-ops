#!/usr/bin/env bash
# scripts/ios/run-fastregression.sh
#
# Self-contained runner for the iOS FastRegression UITest configuration.
#
# What it does
# ────────────
# 1. Ensures the API is healthy on port 8081      (needed for testPasswordLoginHappyPath,
#    which calls POST /auth/login-password; the API resolves it via LOCAL_TEST_PASSWORD
#    credentials without touching Supabase when LOCAL_TEST_PASSWORD_ENABLED=true).
# 2. Force-restarts Metro on port 8082            (clean JS bundle state for the run).
#    Polls GET /status until Metro returns "packager-status:running" before proceeding.
# 3. Runs `xcodebuild test -only-test-configuration FastRegression`.
# 4. On failure prints first assertion errors + service log tails for triage.
# 5. Exits with xcodebuild's exit code so CI can gate on it.
#
# Documentation references
# ─────────────────────────
#   [D1] Expo CLI – CI=1 disables interactive prompts; --dev-client forces dev-build mode.
#        https://docs.expo.dev/more/expo-cli/
#   [D2] Metro GET /status returns "packager-status:running" when the bundler is ready.
#        Confirmed in ensure-metro-8082.sh + https://github.com/expo/expo/issues/2219
#   [D3] xcodebuild -only-test-configuration selects a named config inside an .xctestplan.
#        Confirmed via `xcodebuild -help` and local test runs.
#   [D4] LOCAL_TEST_PASSWORD_ENABLED=true in packages/api/.env makes POST /auth/login-password
#        return a deterministic test session for operator@example.com / password123
#        without a live Supabase call.  See packages/api/src/auth/auth.service.ts.
#
# Safe to call repeatedly
# ────────────────────────
#   • Metro: METRO_FORCE_RESTART=1 kills any prior instance and starts fresh.
#   • API:   reused unchanged if already healthy; started only when down.
#   • DerivedData: Xcode incremental build cache is preserved between runs.
#
# Overridable via environment variables
# ──────────────────────────────────────
#   IOS_DESTINATION   (default: platform=iOS Simulator,name=iPhone 16 Pro)
#   IOS_WORKSPACE     (default: apps/mobile/ios/LEDBillboardMarketplace.xcworkspace)
#   IOS_SCHEME        (default: LEDBillboardMarketplace)
#   IOS_TEST_PLAN     (default: LEDBillboardMarketplace)
#   IOS_DERIVED_DATA  (default: apps/mobile/ios/build/DerivedData/FastRegression)
#   XCODEBUILD_LOG    (default: /tmp/xcodebuild-fastregression.log)
#
# Usage
# ─────
#   ./scripts/ios/run-fastregression.sh
#   IOS_DESTINATION="platform=iOS Simulator,name=iPhone 16" ./scripts/ios/run-fastregression.sh
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ── Configuration ──────────────────────────────────────────────────────────────
WORKSPACE="${IOS_WORKSPACE:-$ROOT_DIR/apps/mobile/ios/LEDBillboardMarketplace.xcworkspace}"
SCHEME="${IOS_SCHEME:-LEDBillboardMarketplace}"
TEST_PLAN="${IOS_TEST_PLAN:-LEDBillboardMarketplace}"
CONFIGURATION="FastRegression"
DESTINATION="${IOS_DESTINATION:-platform=iOS Simulator,name=iPhone 16 Pro}"
DERIVED_DATA="${IOS_DERIVED_DATA:-$ROOT_DIR/apps/mobile/ios/build/DerivedData/$CONFIGURATION}"
XCODEBUILD_LOG="${XCODEBUILD_LOG:-/tmp/xcodebuild-fastregression.log}"

ENSURE_API="$SCRIPT_DIR/ensure-api-8081.sh"
ENSURE_METRO="$SCRIPT_DIR/ensure-metro-8082.sh"

# ── Helpers ───────────────────────────────────────────────────────────────────
log()  { printf '[fastregression] %s\n' "$*"; }
step() { printf '\n── Step %s: %s ──\n' "$1" "$2"; }
fail() { printf '[fastregression] FATAL: %s\n' "$*" >&2; exit 1; }

print_summary() {
  local exit_code="$1"
  printf '\n════════════════════════════════════════════════════════════\n'
  if [[ "$exit_code" -eq 0 ]]; then
    printf '✓  FastRegression ALL TESTS PASSED\n'
    grep -E 'Executed [0-9]+ tests.*[0-9]+ seconds' "$XCODEBUILD_LOG" | tail -1 || true
  else
    printf '✗  FastRegression FAILED  (xcodebuild exit %s)\n' "$exit_code"
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

# ── Step 0: Pre-flight checks ──────────────────────────────────────────────────
step "0/3" "Pre-flight"
[[ -d "$WORKSPACE" ]]    || fail "workspace not found: $WORKSPACE"
[[ -f "$ENSURE_API" ]]   || fail "ensure-api script not found: $ENSURE_API"
[[ -f "$ENSURE_METRO" ]] || fail "ensure-metro script not found: $ENSURE_METRO"

log "workspace:    $WORKSPACE"
log "scheme:       $SCHEME"
log "testPlan:     $TEST_PLAN"
log "config:       $CONFIGURATION"
log "destination:  $DESTINATION"
log "derivedData:  $DERIVED_DATA"
log "xcbuild log:  $XCODEBUILD_LOG"

mkdir -p "$DERIVED_DATA"
: > "$XCODEBUILD_LOG"

# ── Step 1: API ────────────────────────────────────────────────────────────────
# testPasswordLoginHappyPath calls POST /auth/login-password which resolves to a
# deterministic local session via LOCAL_TEST_PASSWORD_* env vars [D4]. No Supabase
# round-trip occurs so the API starts fast even on a fresh CI runner.
step "1/3" "API pre-flight (localhost:8081)"
bash "$ENSURE_API"

# ── Step 2: Metro ──────────────────────────────────────────────────────────────
# Force-restart gives every test run a clean JS bundle. CI=1 and --host localhost
# are already baked into the start:test npm script, satisfying [D1].
# Polling GET /status waits until Metro responds "packager-status:running" [D2].
step "2/3" "Metro pre-flight (localhost:8082, force-restart)"
METRO_FORCE_RESTART=1 bash "$ENSURE_METRO"

# ── Step 3: xcodebuild test ────────────────────────────────────────────────────
# -only-test-configuration [D3] selects the FastRegression configuration from the
# LEDBillboardMarketplace.xctestplan, which maps to 5 UITests + 2 unit tests.
step "3/3" "xcodebuild test -only-test-configuration $CONFIGURATION"

# Use set +e / PIPESTATUS so xcodebuild failure does NOT short-circuit the script
# before we can print the diagnostic summary.
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
