# Remaining Delivery Plan (Web-First Testing, Mobile Still In Scope)

Date: 2026-02-17
Owner: Engineering

## Clarified Scope Decision (2026-02-17)
- Mobile implementation is still part of the roadmap.
- Mobile automated and manual per-phase testing are deferred for now.
- Active gate cadence is web-first (Playwright + API), with mobile test gates applied at dedicated milestones.

## Web-First Execution Addendum (2026-02-21)
- Active web stabilization/security execution is defined in:
  - `docs/process/webstack-two-agent-plan.md`
  - `docs/process/web-functional-agent.md`
  - `docs/process/web-security-agent.md`
- This addendum does not remove mobile implementation scope.
- For the current cycle, web functional integrity and web security hardening are
  executed before mobile release checkpoint closure.

## Current Position
- API foundation is strong (auth, slots, offers, requests, bookings, drivers, realtime).
- Admin web has working auth + operator/broker dashboards, with remaining workflow hardening.
- Mobile now has auth/session bootstrap plus operator, broker, and driver role workflows implemented.
- Web E2E is stable in Docker with automated stack bring-up/wait/down scripts and CI enforcement.
- Mobile release checkpoints are re-enabled as explicit commands/workflows, gated by platform prerequisites (built app artifacts + device/simulator toolchains).
- Mobile runtime bootstrap config is corrected for Expo monorepo execution (`apps/mobile/index.js` entry + valid Babel preset wiring).
- Latest Android release checkpoint evidence (2026-02-28) is GREEN with 3 consecutive full audit passes (`3/3` specs each run).
- iOS release checkpoint is still pending host/runtime execution for final cross-platform closure.

## Phase Progress (Updated 2026-02-28)
- Phase 00: COMPLETE (reports available under `reports/phase-00/`).
- Phase 01: COMPLETE (reports available under `reports/phase-01/`).
- Phase 02: COMPLETE (reports available under `reports/phase-02/`).
- Phase 03: COMPLETE (reports available under `reports/phase-03/`).
- Phase 04: COMPLETE (reports available under `reports/phase-04/`).
- Phase 05: IN_PROGRESS (Android checkpoint green; iOS checkpoint pending decision/execution).

## Global Definition of Done (applies to every active phase)
1. Scope implementation for that phase is complete.
2. Required web/API tests for that phase pass.
3. `pnpm lint && pnpm typecheck` pass.
4. Phase report exists under `reports/phase-XX/`.
5. Self-critic report is completed using `docs/process/self-critic-agent.md`.

## One-Time Test Environment Setup

### Web (Primary Gate)
1. `docker compose up -d`
2. `pnpm test:e2e:web:docker`
3. `docker compose down`

### Mobile (Deferred Automated Gate, Keep Ready for Implementation)
1. Keep Appium and SDK setup documented and updated.
2. Continue implementing mobile features in Phases 03/04.
3. Run Appium suites at milestone checkpoints, not every phase.

## Phase 00 - Baseline Stabilization
### Goals
- Make current codebase testable and truthful.
- Remove drift between code, tests, and docs.

### Implementation
1. Fix failing API unit/integration specs.
2. Align stale status docs to actual repo state.
3. Define mandatory report structure under `reports/phase-00/`.

### Test Gate (must pass)
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:e2e:web:docker`

### Exit Criteria
- Baseline web/API/static gates pass.
- Required phase-00 reports exist.

## Phase 01 - API Contract Completion and Alignment
### Goals
- Close backend contract gaps and align `packages/shared`, `packages/api`, and `docs/spec`.

### Implementation
1. Complete missing endpoints/behaviors required by active web/mobile flows.
2. Standardize error format and role authorization rules.
3. Ensure shared schemas/types match API request/response shapes.
4. Remove or explicitly mark non-MVP endpoints in specs.

### Test Gate (must pass)
- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter @led-billboard/api test -- --runInBand`
- `pnpm playwright test tests/e2e-web/tests/api.spec.ts tests/e2e-web/tests/auth.spec.ts --config=playwright.docker.config.ts --project=chromium --workers=1`

### Exit Criteria
- No known contract mismatch between shared types, API controllers, and docs/spec.
- `reports/phase-01/*` completed.

## Phase 02 - Admin Web Completion (Operator + Broker)
### Goals
- Reach functional web MVP for operator and broker workflows.

### Implementation
1. Complete operator workflow: slot CRUD, offer actions, booking visibility.
2. Complete broker workflow: request CRUD, marketplace search, offer lifecycle.
3. Remove placeholder actions and ensure robust loading/error/empty states.
4. Ensure `data-testid` coverage for all critical user actions.

### Test Gate (must pass)
- `pnpm lint`
- `pnpm typecheck`
- `pnpm playwright test tests/e2e-web/tests/auth.spec.ts tests/e2e-web/tests/dashboard.spec.ts tests/e2e-web/tests/broker.spec.ts tests/e2e-web/tests/realtime-refresh.spec.ts --config=playwright.docker.config.ts --project=chromium --workers=1`
- `pnpm test:e2e:web:docker`

### Exit Criteria
- Web role-based flows pass end-to-end with no manual patch steps.
- `reports/phase-02/*` completed.

## Phase 03 - Mobile Foundation and Operator Parity
### Goals
- Move mobile from dashboard demo to real operator workflow.

### Implementation
1. Add mobile auth flow (phone + OTP) and session handling.
2. Add navigation shell and operator tabs/screens.
3. Implement operator slot and offer interactions with real API.
4. Replace hardcoded/placeholder values with backend-driven data.

### Test Gate (must pass for this phase)
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:e2e:web:docker`

### Mobile Validation (deferred in per-phase cadence)
1. Manual emulator walkthrough is deferred to dedicated mobile milestone checkpoints.
2. Keep API contract checks for newly used mobile endpoints documented in `reports/phase-03/tests.md`.

### Exit Criteria
- Operator mobile flow implemented end-to-end.
- `reports/phase-03/*` completed.

## Phase 04 - Mobile Broker and Driver Workflows
### Goals
- Deliver broker and driver mobile workflows to match MVP scope.

### Implementation
1. Broker mobile: create request, search slots, send/track offers.
2. Driver mobile: assigned runs, status progression, proof capture flow.
3. Booking detail role-specific actions and visibility.
4. Integrate realtime refresh where required for driver/broker experience.

### Test Gate (must pass for this phase)
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:e2e:web:docker`

### Mobile Validation (deferred in per-phase cadence)
1. Manual walkthrough for broker and driver critical paths is deferred to dedicated mobile milestones.
2. Keep API + realtime behavior checks documented in `reports/phase-04/tests.md`.

### Exit Criteria
- Mobile role flows (operator/broker/driver) implemented without placeholder behavior.
- `reports/phase-04/*` completed.

## Phase 05 - Hardening, CI Gates, and Release Readiness
### Goals
- Convert working MVP into release-ready system with strict quality gates.

### Implementation
1. Stabilize flaky tests and remove fragile waits.
2. Enforce CI gates for lint/typecheck/unit/web E2E.
3. Re-enable mobile Appium suite as release checkpoint.
4. Add release checklist, rollback plan, and monitoring baseline.

### Test Gate (must pass)
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e:web:docker`

### Release Checkpoint (mobile automated re-enabled)
- `pnpm test:e2e:mobile:android`
- `pnpm test:e2e:mobile:ios`

### Exit Criteria
- Green CI with required checks.
- Final self-critic verdict: no critical temporary fixes.
- `reports/phase-05/*` completed.

## Mandatory Phase Reporting
For each phase, create:
- `reports/phase-XX/implementation.md`
- `reports/phase-XX/tests.md`
- `reports/phase-XX/self-critic.md`

No phase is complete without all three files.
