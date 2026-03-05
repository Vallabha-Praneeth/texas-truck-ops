#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
IOS_DIR="$ROOT/apps/mobile/ios"

APP_NAME="LEDBillboardMarketplace"
WORKSPACE="$IOS_DIR/${APP_NAME}.xcworkspace"
XCODEPROJ="$IOS_DIR/${APP_NAME}.xcodeproj"

# Test plan file name (without extension) + configuration name
TEST_PLAN_NAME="${APP_NAME}"          # e.g. LEDBillboardMarketplace.xctestplan
TEST_CONFIG_NAME="FastRegression"     # config inside the plan

if [[ ! -d "$IOS_DIR" ]]; then
  echo "[ios:test:fast] iOS project not present in this repo (apps/mobile/ios missing). Skipping iOS lane."
  exit 0
fi

# If workspace is missing but Podfile exists, generate it
if [[ ! -d "$WORKSPACE" ]]; then
  if [[ -f "$IOS_DIR/Podfile" ]]; then
    echo "[ios:test:fast] Workspace missing; running pod install to generate .xcworkspace"
    pushd "$IOS_DIR" >/dev/null
    # Prefer bundler if present
    if [[ -f "Gemfile" ]]; then
      bundle install
      bundle exec pod install
    else
      pod install
    fi
    popd >/dev/null
  fi
fi

# Fallback: if workspace still missing but xcodeproj exists, use xcodeproj
XCODE_ARGS=()
if [[ -d "$WORKSPACE" ]]; then
  XCODE_ARGS=(-workspace "$WORKSPACE")
elif [[ -d "$XCODEPROJ" ]]; then
  echo "[ios:test:fast] Workspace still missing; falling back to xcodeproj"
  XCODE_ARGS=(-project "$XCODEPROJ")
else
  echo "[ios:test:fast] Missing both workspace and xcodeproj for $APP_NAME in apps/mobile/ios"
  exit 1
fi

# Destination: use latest available iPhone simulator on runner
DESTINATION="${IOS_DESTINATION:-platform=iOS Simulator,name=iPhone 15,OS=latest}"

echo "[ios:test:fast] Running xcodebuild with:"
echo "  scheme: $APP_NAME"
echo "  test plan: $TEST_PLAN_NAME"
echo "  config: $TEST_CONFIG_NAME"
echo "  destination: $DESTINATION"

xcodebuild \
  "${XCODE_ARGS[@]}" \
  -scheme "$APP_NAME" \
  -testPlan "$TEST_PLAN_NAME" \
  -only-test-configuration "$TEST_CONFIG_NAME" \
  -destination "$DESTINATION" \
  test
