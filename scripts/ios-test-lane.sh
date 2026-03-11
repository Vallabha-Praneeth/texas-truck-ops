#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <fast|local-auth|a11y|state-recovery> [xcodebuild args...]"
  exit 1
fi

lane="$1"
shift

ensure_metro_script="${IOS_ENSURE_METRO_SCRIPT:-scripts/ios/ensure-metro-8082.sh}"
ensure_api_script="${IOS_ENSURE_API_SCRIPT:-scripts/ios/ensure-api-8081.sh}"

if [[ -x "$ensure_api_script" ]]; then
  "$ensure_api_script"
elif [[ -f "$ensure_api_script" ]]; then
  bash "$ensure_api_script"
else
  echo "[ios:test:lane] Warning: API ensure script not found at $ensure_api_script"
fi

if [[ -x "$ensure_metro_script" ]]; then
  METRO_FORCE_RESTART=1 "$ensure_metro_script"
elif [[ -f "$ensure_metro_script" ]]; then
  METRO_FORCE_RESTART=1 bash "$ensure_metro_script"
else
  echo "[ios:test:lane] Warning: Metro ensure script not found at $ensure_metro_script"
fi

workspace="${IOS_WORKSPACE:-apps/mobile/ios/LEDBillboardMarketplace.xcworkspace}"
scheme="${IOS_SCHEME:-LEDBillboardMarketplace}"
test_plan="${IOS_TEST_PLAN:-LEDBillboardMarketplace}"
destination="${IOS_DESTINATION:-platform=iOS Simulator,name=iPhone 17 Pro}"
derived_data_root="${IOS_DERIVED_DATA_ROOT:-apps/mobile/ios/build/DerivedData}"

configuration=""
extra_args=()

case "$lane" in
  fast)
    configuration="FastRegression"
    ;;
  local-auth)
    configuration="LocalAuthE2E"
    ;;
  a11y)
    configuration="Accessibility"
    ;;
  state-recovery)
    configuration="LocalAuthE2E"
    extra_args+=(
      "-only-testing:LEDBillboardMarketplaceUITests/LEDBillboardMarketplaceUITests/testLocalRealOtpDashboardRetryKeepsErrorVisibleWhenForcedByLaunchFlag"
      "-only-testing:LEDBillboardMarketplaceUITests/LEDBillboardMarketplaceUITests/testLocalRealOtpDashboardRetryRecoversAfterForcedErrorOnce"
    )
    ;;
  *)
    echo "Unknown lane: $lane"
    echo "Expected one of: fast, local-auth, a11y, state-recovery"
    exit 1
    ;;
esac

derived_data_path="${derived_data_root}/${configuration}"
mkdir -p "$derived_data_path"

cmd=(
  xcodebuild test
  -workspace "$workspace"
  -scheme "$scheme"
  -testPlan "$test_plan"
  -only-test-configuration "$configuration"
  -destination "$destination"
  -derivedDataPath "$derived_data_path"
)

if [[ ${#extra_args[@]} -gt 0 ]]; then
  cmd+=("${extra_args[@]}")
fi

if [[ $# -gt 0 ]]; then
  cmd+=("$@")
fi

if [[ "${IOS_TEST_DRY_RUN:-0}" == "1" ]]; then
  printf '[dry-run] '
  printf '%q ' "${cmd[@]}"
  printf '\n'
  exit 0
fi

printf 'Running lane=%s config=%s\n' "$lane" "$configuration"
printf 'DerivedData=%s\n' "$derived_data_path"
exec "${cmd[@]}"
