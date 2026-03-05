#!/usr/bin/env bash

set -euo pipefail

WORKSPACE_PATH="${IOS_WORKSPACE_PATH:-apps/mobile/ios/LEDBillboardMarketplace.xcworkspace}"
SCHEME="${IOS_SCHEME:-LEDBillboardMarketplace}"
TEST_PLAN="${IOS_TEST_PLAN:-FastRegression}"
DERIVED_DATA_PATH="${IOS_DERIVED_DATA_PATH:-/tmp/ios-fast-regression-derived-data}"

if [[ ! -d "$WORKSPACE_PATH" ]]; then
  echo "[ios:test:fast] Missing iOS workspace: $WORKSPACE_PATH"
  echo "[ios:test:fast] Expected workspace path for FastRegression lane."
  exit 1
fi

if ! command -v xcrun >/dev/null 2>&1; then
  echo "[ios:test:fast] xcrun is required but not found."
  exit 1
fi

DESTINATION="${IOS_DESTINATION:-}"
if [[ -z "$DESTINATION" ]]; then
  SIM_NAME="$(
    xcrun simctl list devices available \
      | awk -F'[()]' '/iPhone 16 Pro|iPhone 15 Pro|iPhone 15|iPhone 14/ { gsub(/^[[:space:]]+|[[:space:]]+$/, "", $1); print $1; exit }'
  )"

  if [[ -z "$SIM_NAME" ]]; then
    SIM_NAME="$(
      xcrun simctl list devices available \
        | awk -F'[()]' '/iPhone/ { gsub(/^[[:space:]]+|[[:space:]]+$/, "", $1); print $1; exit }'
    )"
  fi

  if [[ -z "$SIM_NAME" ]]; then
    echo "[ios:test:fast] No available iPhone simulator found."
    exit 1
  fi

  DESTINATION="platform=iOS Simulator,name=${SIM_NAME},OS=latest"
fi

echo "[ios:test:fast] workspace: $WORKSPACE_PATH"
echo "[ios:test:fast] scheme: $SCHEME"
echo "[ios:test:fast] test plan: $TEST_PLAN"
echo "[ios:test:fast] destination: $DESTINATION"

xcodebuild \
  -workspace "$WORKSPACE_PATH" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -testPlan "$TEST_PLAN" \
  -destination "$DESTINATION" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  test
