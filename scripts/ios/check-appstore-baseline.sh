#!/usr/bin/env bash
# scripts/ios/check-appstore-baseline.sh
#
# Verifies that the iOS App Store baseline settings are consistent across all
# configuration files. Run before xcodebuild so deployment-target drift and
# stale capability declarations are caught fast, not at App Store submission.
#
# Checks performed:
#   1. Podfile.properties.json  → ios.deploymentTarget == EXPECTED_IOS_TARGET
#   2. project.pbxproj          → all IPHONEOS_DEPLOYMENT_TARGET == EXPECTED_IOS_TARGET
#   3. Info.plist               → UIRequiredDeviceCapabilities does NOT contain armv7
#
# Why these values:
#   EXPECTED_IOS_TARGET = 13.4
#     [D1] Expo SDK 50 changelog: "iOS minimum deployment target bumped to 13.4"
#          https://expo.dev/changelog/2024-01-18-sdk-50
#     [D2] React Native 0.73 release notes: "Raise minimum iOS version to 13.4"
#          https://reactnative.dev/blog/2023/12/06/0.73-debugging-improvements-stable-symlinks
#     [D3] Apple Upcoming Requirements: no explicit floor set by App Store policy;
#          13.4 satisfies the framework minimum and maximises device compatibility.
#          https://developer.apple.com/news/upcoming-requirements/
#
#   armv7 must be absent from UIRequiredDeviceCapabilities:
#     [D4] Apple Required Device Capabilities: architecture values belong in Xcode
#          build settings, not UIRequiredDeviceCapabilities; armv7 is a 32-bit arch
#          deprecated since iOS 11 and incorrectly restricts availability to legacy devices.
#          https://developer.apple.com/support/required-device-capabilities/
#
# Usage:
#   bash scripts/ios/check-appstore-baseline.sh
#   (exits 0 = all checks pass, exits 1 = one or more failures)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ── Configuration ──────────────────────────────────────────────────────────
EXPECTED_IOS_TARGET="13.4"

PODFILE_PROPS="$ROOT_DIR/apps/mobile/ios/Podfile.properties.json"
PBXPROJ="$ROOT_DIR/apps/mobile/ios/LEDBillboardMarketplace.xcodeproj/project.pbxproj"
PLIST="$ROOT_DIR/apps/mobile/ios/LEDBillboardMarketplace/Info.plist"
# ──────────────────────────────────────────────────────────────────────────

echo "── check-appstore-baseline ──"
echo ""

failed=0

# ── 1. Podfile.properties.json: ios.deploymentTarget ──────────────────────
echo "Check 1/3: Podfile.properties.json → ios.deploymentTarget"
if [[ ! -f "$PODFILE_PROPS" ]]; then
  echo "  ✗ MISSING: $PODFILE_PROPS not found" >&2
  failed=1
else
  # python3 is always available on macOS; use it to parse JSON reliably
  actual_target="$(python3 -c "
import json, sys
data = json.load(open('$PODFILE_PROPS'))
print(data.get('ios.deploymentTarget', ''))
" 2>/dev/null || true)"

  if [[ "$actual_target" != "$EXPECTED_IOS_TARGET" ]]; then
    echo "  ✗ WRONG or MISSING: ios.deploymentTarget = \"${actual_target:-<not set>}\" (expected \"$EXPECTED_IOS_TARGET\")" >&2
    echo "    Fix: set \"ios.deploymentTarget\": \"$EXPECTED_IOS_TARGET\" in $PODFILE_PROPS" >&2
    failed=1
  else
    echo "  ✓ ios.deploymentTarget = \"$EXPECTED_IOS_TARGET\""
  fi
fi

# ── 2. project.pbxproj: IPHONEOS_DEPLOYMENT_TARGET ────────────────────────
echo ""
echo "Check 2/3: project.pbxproj → IPHONEOS_DEPLOYMENT_TARGET"
if [[ ! -f "$PBXPROJ" ]]; then
  echo "  ✗ MISSING: $PBXPROJ not found" >&2
  failed=1
else
  # Collect all unique IPHONEOS_DEPLOYMENT_TARGET values in the app project
  bad_targets="$(grep -o 'IPHONEOS_DEPLOYMENT_TARGET = [^;]*' "$PBXPROJ" \
    | sed 's/IPHONEOS_DEPLOYMENT_TARGET = //' \
    | sort -u \
    | grep -v "^${EXPECTED_IOS_TARGET}$" || true)"

  count_good="$(grep -c "IPHONEOS_DEPLOYMENT_TARGET = ${EXPECTED_IOS_TARGET}" "$PBXPROJ" || true)"

  if [[ -n "$bad_targets" ]]; then
    echo "  ✗ UNEXPECTED values found in project.pbxproj (expected all to be $EXPECTED_IOS_TARGET):" >&2
    echo "$bad_targets" | sed 's/^/    - /' >&2
    echo "    Fix: update all IPHONEOS_DEPLOYMENT_TARGET entries in Xcode project settings" >&2
    failed=1
  elif [[ "$count_good" -eq 0 ]]; then
    echo "  ✗ No IPHONEOS_DEPLOYMENT_TARGET = $EXPECTED_IOS_TARGET found in $PBXPROJ" >&2
    echo "    Fix: set iOS Deployment Target to $EXPECTED_IOS_TARGET in Xcode project settings" >&2
    failed=1
  else
    echo "  ✓ IPHONEOS_DEPLOYMENT_TARGET = $EXPECTED_IOS_TARGET ($count_good occurrences)"
  fi
fi

# ── 3. Info.plist: no armv7 in UIRequiredDeviceCapabilities ───────────────
echo ""
echo "Check 3/3: Info.plist → UIRequiredDeviceCapabilities does not contain armv7"
if [[ ! -f "$PLIST" ]]; then
  echo "  ✗ MISSING: $PLIST not found" >&2
  failed=1
else
  # plutil -lint first
  if ! plutil -lint "$PLIST" >/dev/null 2>&1; then
    echo "  ✗ Info.plist is malformed (plutil -lint failed)" >&2
    plutil -lint "$PLIST" >&2 || true
    failed=1
  else
    # Check if the key exists at all
    caps_value="$(/usr/libexec/PlistBuddy -c "Print :UIRequiredDeviceCapabilities" "$PLIST" 2>/dev/null || true)"
    if echo "$caps_value" | grep -q "armv7"; then
      echo "  ✗ armv7 is present in UIRequiredDeviceCapabilities — this restricts the app" >&2
      echo "    to 32-bit devices deprecated since iOS 11." >&2
      echo "    Fix: remove UIRequiredDeviceCapabilities entirely (or remove the armv7 entry)." >&2
      echo "    Architecture requirements belong in Xcode build settings, not Info.plist." >&2
      failed=1
    elif [[ -z "$caps_value" ]]; then
      echo "  ✓ UIRequiredDeviceCapabilities is absent (no unnecessary hardware restrictions)"
    else
      echo "  ✓ UIRequiredDeviceCapabilities present but contains no armv7"
      echo "      Values: $(echo "$caps_value" | tr '\n' ' ')"
    fi
  fi
fi

# ── Summary ────────────────────────────────────────────────────────────────
echo ""
if [[ "$failed" -ne 0 ]]; then
  echo "FAILED: one or more App Store baseline checks failed." >&2
  exit 1
fi

echo "✓ All App Store baseline checks passed."
