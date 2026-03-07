#!/usr/bin/env bash
# scripts/ios/check-info-plist-permissions.sh
#
# Verifies that all required iOS privacy-usage-description keys are present and
# non-empty in the committed Info.plist.  Run before xcodebuild so failures are
# fast and obvious rather than surfacing as App Store rejections or runtime crashes.
#
# Usage:
#   bash scripts/ios/check-info-plist-permissions.sh
#   (exits 0 = all present, exits 1 = one or more missing/empty)
#
# Required keys rationale:
#   NSLocationWhenInUseUsageDescription  — matches Android ACCESS_FINE/COARSE_LOCATION;
#                                          needed by DriverLocationScreen (foreground GPS).
#   NSCameraUsageDescription             — matches Android CAMERA;
#                                          needed by DriverProofCaptureScreen (photo proof).
#
# Source docs:
#   [D1] https://developer.apple.com/documentation/bundleresources/information-property-list/nslocationwheninuseusagedescription
#   [D2] https://developer.apple.com/documentation/BundleResources/Information-Property-List/NSCameraUsageDescription
#   [D3] https://docs.expo.dev/guides/permissions/  (app.json ios.infoPlist approach)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

PLIST="$ROOT_DIR/apps/mobile/ios/LEDBillboardMarketplace/Info.plist"

# ── Required keys ──────────────────────────────────────────────────────────
REQUIRED_KEYS=(
  "NSLocationWhenInUseUsageDescription"
  "NSCameraUsageDescription"
)
# ──────────────────────────────────────────────────────────────────────────

echo "── check-info-plist-permissions ──"
echo "[plist] $PLIST"
echo ""

if [[ ! -f "$PLIST" ]]; then
  echo "ERROR: Info.plist not found at $PLIST" >&2
  exit 1
fi

# plutil -lint first: catches malformed XML before key checks
if ! plutil -lint "$PLIST" >/dev/null 2>&1; then
  echo "ERROR: Info.plist is malformed (plutil -lint failed)" >&2
  plutil -lint "$PLIST" >&2 || true
  exit 1
fi

failed=0

for key in "${REQUIRED_KEYS[@]}"; do
  # /usr/libexec/PlistBuddy is always available on macOS
  value="$(/usr/libexec/PlistBuddy -c "Print :${key}" "$PLIST" 2>/dev/null || true)"
  if [[ -z "$value" ]]; then
    echo "  ✗ MISSING or EMPTY: $key" >&2
    failed=1
  else
    # Truncate for readability — full string is in the file
    short="${value:0:80}$([ ${#value} -gt 80 ] && echo '…' || true)"
    echo "  ✓ $key"
    echo "      \"$short\""
  fi
done

echo ""

if [[ "$failed" -ne 0 ]]; then
  echo "FAILED: one or more required permission usage strings are missing." >&2
  echo "" >&2
  echo "Fix: add the missing keys to BOTH of the following files:" >&2
  echo "  1. apps/mobile/ios/LEDBillboardMarketplace/Info.plist" >&2
  echo "       (used directly by Xcode — must exist for the app to build and run)" >&2
  echo "  2. apps/mobile/app.json  → expo.ios.infoPlist" >&2
  echo "       (source of truth — survives 'expo prebuild' regeneration)" >&2
  echo "" >&2
  echo "See: https://docs.expo.dev/guides/permissions/" >&2
  exit 1
fi

echo "✓ All required permission usage strings are present."
