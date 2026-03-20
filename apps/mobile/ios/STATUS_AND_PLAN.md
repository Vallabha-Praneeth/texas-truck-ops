# iOS Mobile Status & Forward Plan

## Current State (as of 2026-03-06)
- Expo dev-client app (`apps/mobile`) targeting iOS; Metro pinned to port `8082` via `.xcode.env` and `AppDelegate.mm`.
- Navigation + roles in place (operator/broker/driver tabs) with React Query hooks wired to real API endpoints (`src/lib/api.ts`) and auth context handling OTP, token refresh, and session bootstrap.
- UI and unit tests exist and are grouped by lanes through the shared test plan `LEDBillboardMarketplace.xctestplan`:
  - **FastRegression**: phone normalization unit test + auth entry smoke + OTP bypass happy path.
  - **LocalAuthE2E**: real OTP entry, relaunch persistence, logout, dashboard retry/error toggles.
  - **Accessibility**: auth screen + dashboard accessibility audit (iOS 17+).
- Xcode schemes: `LEDBillboardMarketplace` (default), `LEDBillboardMarketplace-LocalAuthE2E`, `LEDBillboardMarketplace-Accessibility`.
- Recent native finding: unattended launch still hits the iOS “Open in LED Billboard Marketplace?” prompt when Metro is started from CLI; build itself passes (`xcodebuild build` on simulator) but automated runtime needs this prompt bypassed.

## Gaps / Pending Items
- Dev-client runtime still needs a deterministic handoff to the JS bundle (no human tap). The prompt is currently the top blocker for unattended UITest runs.
- UITest coverage is focused on auth/operator; broker/driver flows and error cases outside auth are not covered.
- Backend/fixture stability is assumed live; no dedicated mock/stub layer for UITests, so runs may be flaky without seeded data.
- No CI wiring yet for the new lanes/schemes; existing GitHub Actions workflow files are present but not confirmed running.

## Action Plan (all verification via Xcode, no manual taps)
1) **Build for testing (simulator)**  
   ```bash
   xcodebuild \
     -workspace apps/mobile/ios/LEDBillboardMarketplace.xcworkspace \
     -scheme LEDBillboardMarketplace \
     -configuration Debug \
     -destination "platform=iOS Simulator,name=iPhone 16 Pro" \
     -derivedDataPath /tmp/DerivedData \
     build-for-testing
   ```
2) **Run FastRegression lane (unit + light UI)**  
   ```bash
   xcodebuild \
     -workspace apps/mobile/ios/LEDBillboardMarketplace.xcworkspace \
     -scheme LEDBillboardMarketplace \
     -testPlan LEDBillboardMarketplace \
     -destination "platform=iOS Simulator,name=iPhone 16 Pro" \
     -derivedDataPath /tmp/DerivedData \
     -only-test-configuration FastRegression \
     test
   ```
3) **Run LocalAuthE2E lane** (full auth + dashboard smoke)  
   Same command as above with `-only-test-configuration LocalAuthE2E`. Requires backend test phone to be accepted server-side; ensure API seeding before run.
4) **Run Accessibility lane** (iOS 17+ simulator)  
   Same command with `-only-test-configuration Accessibility`; pick an iOS 17 simulator for `performAccessibilityAudit`.
5) **Remove “Open in …” prompt for unattended runs**  
   - Set `EXPO_DEV_SERVER_URL` and `RCT_METRO_PORT=8082` directly in the `LEDBillboardMarketplace` scheme run environment so the dev-client launches straight to the bundle without the universal-link confirmation.  
   - If prompt persists, switch UITests to a pre-bundled JS artifact: `pnpm --filter @led-billboard/mobile export --platform ios --output-dir dist-export` and point the scheme to the static bundle URL via `RCT_NO_LAUNCH_PACKAGER=1` and `RCT_PACKAGER_HOST=localhost:8082` (served by `npx serve dist-export`). This avoids system prompts while keeping UITests in Xcode.
6) **Stabilize test data**  
   Add a lightweight fixture loader (e.g., API seed script) that runs before UITests to ensure phone `+18625918688` and dashboard data exist; call it from a `pre-action` in the scheme so Xcode orchestrates it.
7) **Expand UITest coverage**  
   Add UITests for broker (requests/marketplace) and driver (runs/proof/location) tabs; keep lane gating with `XCODE_TEST_LANE` to control duration.
8) **CI hook**  
   Wire steps 1–4 into `.github/workflows/ios-accessibility.yml` (or a new job) so GitHub Actions runs `build-for-testing` + selected lanes on macOS runners; artifacts: XCTest logs + coverage.

## Ready-to-run commands (MCP/Xcode)
- FastRegression: step 2 command above.
- LocalAuthE2E: step 3 command above.
- Accessibility: step 4 command above.
- All lanes: omit `-only-test-configuration` to execute the full test plan in one run.

## Definition of Done for iOS readiness
- All three lanes are green in unattended Xcode runs on simulator (no human prompts).
- UITest coverage includes auth, operator KPIs, broker request list, driver location toggle, and error/retry paths.
- CI job publishes logs and coverage, and failures block merges.
