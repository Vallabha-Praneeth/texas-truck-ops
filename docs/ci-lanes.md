# CI Lanes

## Branch protection on `main`

- Required check: `ios-fast-regression`
- Strict mode: `true`
- Enforce admins: `true`

## `ios-fast-regression` in this repo

- The required check comes from workflow job `ios-fast-regression` in
  `.github/workflows/ci.yml`.
- That job runs `pnpm ios:test:fast`.
- `pnpm ios:test:fast` runs
  `tests/e2e-mobile/scripts/run-ios-fast-regression.sh`.
- This repo currently has no iOS project at `apps/mobile/ios`, so the script
  prints:
  `SKIP: no iOS project in this repo (expected apps/mobile/ios)`
  and exits `0`.

## Upgrade to real iOS testing later

1. Add the iOS project under `apps/mobile/ios` (or update the expected path in
   the script).
2. Ensure the Xcode workspace/project and test plan exist.
3. Ensure `pnpm ios:test:fast` runs `xcodebuild` with the
   `FastRegression` test-plan configuration.

## Run lanes locally

```sh
pnpm ios:test:fast
pnpm ios:test:a11y
pnpm ios:test:e2e-local-auth   # if present
pnpm ios:test:state-recovery   # if present
```

## Why security checks are non-blocking

- Branch protection currently requires only `ios-fast-regression`.
- Security workflows (CodeQL/Semgrep/Trivy/ZAP and related jobs) still run and
  report, but do not gate merges unless added to branch protection later.
