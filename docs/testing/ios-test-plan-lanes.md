# iOS Test Plan Lane Runbook

This repo uses a shared Xcode test plan:
- `LEDBillboardMarketplace.xctestplan`

The lane wrappers call `xcodebuild` with:
- `-testPlan LEDBillboardMarketplace`
- the matching `-only-test-configuration`

## Lane Commands

- `pnpm ios:test:fast`
  - Configuration: `FastRegression`
  - Coverage:
    - Unit tests in `LEDBillboardMarketplaceTests`
    - Fast auth-entry UI regression tests
  - Recommended for daily development.

- `pnpm ios:test:e2e-local-auth`
  - Configuration: `LocalAuthE2E`
  - Coverage:
    - Local OTP login flow, session persistence/logout, dashboard flows, forced-error and retry behavior tests.

- `pnpm ios:test:a11y`
  - Configuration: `Accessibility`
  - Coverage:
    - Automated accessibility audit tests for auth entry and dashboard states.

- `pnpm ios:test:state-recovery`
  - Configuration: `LocalAuthE2E`
  - Coverage:
    - Dashboard retry/error recovery subset:
      - `testLocalRealOtpDashboardRetryKeepsErrorVisibleWhenForcedByLaunchFlag`
      - `testLocalRealOtpDashboardRetryRecoversAfterForcedErrorOnce`

## Requirements / Environment

- Xcode CLI tools installed (`xcodebuild`, simulators available).
- By default commands target:
  - `platform=iOS Simulator,name=iPhone 17 Pro`
- Override destination when needed:
  - `IOS_DESTINATION='platform=iOS Simulator,name=iPhone 16' pnpm ios:test:fast`
- LocalAuth lanes require the local OTP test path to be available (the same environment used by existing LocalAuthE2E tests).

## Avoiding "No bundle URL present"

- iOS debug/dev-client runs require Metro on port `8082`.
- Use `pnpm ios:dev` to ensure Metro and launch iOS.
- Use `pnpm ios:test:fast` to ensure Metro and run FastRegression.
- If Metro is already on `8082`, the ensure step exits quickly with:
  - `Metro already running`

## Avoiding build.db lock issues

These commands use per-lane DerivedData isolation by default:
- `apps/mobile/ios/build/DerivedData/FastRegression`
- `apps/mobile/ios/build/DerivedData/LocalAuthE2E`
- `apps/mobile/ios/build/DerivedData/Accessibility`

This reduces lock contention between lanes. Even with isolation, avoid running multiple heavy lanes simultaneously on the same simulator/device.

Optional override:
- `IOS_DERIVED_DATA_ROOT=/tmp/ios-derived-data pnpm ios:test:e2e-local-auth`

## Useful overrides

- Dry-run command preview:
  - `IOS_TEST_DRY_RUN=1 pnpm ios:test:fast`
- Pass through extra `xcodebuild` args:
  - `pnpm ios:test:fast -- -only-testing:LEDBillboardMarketplaceTests/LEDBillboardMarketplaceTests/testNormalizeUSPhoneInputFormatsNationalNumber`

## CI lane mapping

- Default PR/main gate:
  - Workflow: `.github/workflows/ci.yml`
  - Job: `ios-fast-regression`
  - Lane: `FastRegression` via `pnpm ios:test:fast`

- Separate intentional accessibility run:
  - Workflow: `.github/workflows/ios-accessibility.yml`
  - Job: `accessibility`
  - Lane: `Accessibility` via `pnpm ios:test:a11y`
  - Triggers: manual (`workflow_dispatch`) and weekly schedule.

- LocalAuthE2E stays separate from default PR gate:
  - Reason: auth-dependent and slower/less deterministic than fast regression.
  - Local command remains intentional: `pnpm ios:test:e2e-local-auth`
  - Optional focused subset: `pnpm ios:test:state-recovery`

## CI vs local invocation

- Local:
  - `pnpm ios:test:fast`
  - `pnpm ios:test:a11y`
  - `pnpm ios:test:e2e-local-auth`

- CI:
  - FastRegression runs automatically on PRs and `main`.
  - Accessibility runs in a separate workflow (manual/scheduled).
  - LocalAuthE2E is not wired into default PR CI.

## CI lock avoidance

- CI iOS jobs use a shared GitHub Actions `concurrency` group: `ios-simulator-lanes`.
- This serializes iOS simulator lane jobs on self-hosted macOS runners to reduce `build.db` lock contention.
