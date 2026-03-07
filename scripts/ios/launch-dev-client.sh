#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
IOS_DIR="$ROOT_DIR/apps/mobile/ios"
WORKSPACE="${IOS_WORKSPACE:-$IOS_DIR/LEDBillboardMarketplace.xcworkspace}"
SCHEME="${IOS_SCHEME:-LEDBillboardMarketplace}"
DESTINATION="${IOS_DESTINATION:-platform=iOS Simulator,name=iPhone 17 Pro}"
DERIVED_DATA_PATH="${IOS_DERIVED_DATA_PATH:-$IOS_DIR/build/DerivedData/DevLaunch}"
BUNDLE_ID="${IOS_BUNDLE_ID:-com.ledbillboard.marketplace}"

if [[ ! -d "$IOS_DIR" ]]; then
  echo "[ios:dev] Missing iOS directory: $IOS_DIR"
  exit 1
fi

if [[ ! -d "$WORKSPACE" ]]; then
  echo "[ios:dev] Missing workspace: $WORKSPACE"
  exit 1
fi

sim_name="${IOS_SIM_NAME:-}"
if [[ -z "$sim_name" && "$DESTINATION" =~ name=([^,]+) ]]; then
  sim_name="${BASH_REMATCH[1]}"
fi
if [[ -z "$sim_name" ]]; then
  sim_name="iPhone 17 Pro"
fi

mkdir -p "$DERIVED_DATA_PATH"

echo "[ios:dev] Building scheme '$SCHEME' for destination '$DESTINATION'"
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -destination "$DESTINATION" \
  -configuration Debug \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  build

app_path="$(find "$DERIVED_DATA_PATH/Build/Products/Debug-iphonesimulator" -maxdepth 1 -name "*.app" | head -n 1)"
if [[ -z "$app_path" ]]; then
  echo "[ios:dev] Could not find built .app under $DERIVED_DATA_PATH/Build/Products/Debug-iphonesimulator"
  exit 1
fi

echo "[ios:dev] Booting simulator '$sim_name'"
xcrun simctl boot "$sim_name" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$sim_name" -b

echo "[ios:dev] Installing app: $app_path"
xcrun simctl install booted "$app_path"

echo "[ios:dev] Launching bundle: $BUNDLE_ID"
xcrun simctl launch booted "$BUNDLE_ID"
