# Security Testing Guide

This folder tracks OWASP-aligned security work for `texas-truck-ops`.

## Standards in Scope
- OWASP ASVS (target L2 for web/admin + API)
- OWASP API Security Top 10 (2023)
- OWASP MASVS-L1 (mobile)

## Key Files
- `docs/security/owasp-control-matrix.md`: control mapping and status.
- `docs/security/issues/`: phase issue definitions.
- `docs/security/test-evidence/`: scan and manual test artifacts.
- `docs/security/exceptions.md`: approved risk exceptions with expiry.

## Required GitHub Secrets
- `ZAP_TARGET_ADMIN_URL`: staging URL for admin app scan.
- `ZAP_TARGET_API_URL`: staging URL for API scan.
- `SEMGREP_APP_TOKEN`: optional Semgrep App integration token.

## CI Workflows
- `.github/workflows/security-sast.yml`: CodeQL + Semgrep.
- `.github/workflows/security-sca.yml`: dependency audit + Trivy.
- `.github/workflows/security-zap.yml`: ZAP baseline scans.

## Local Security Commands
```bash
# baseline quality
pnpm lint && pnpm typecheck && pnpm test

# dependency vulnerability check
pnpm audit --audit-level high

# web e2e safety regression
pnpm test:e2e:web
```

## Triage Flow
1. Validate finding reproducibility and affected surface (`apps/admin`, `packages/api`, `apps/mobile`).
2. Classify severity and map to OWASP category.
3. Open or link remediation issue with owner and target date.
4. Fix and add regression tests where possible.
5. Re-run relevant scans/tests and attach evidence.
6. Close finding or add time-bound exception in `docs/security/exceptions.md`.

## Merge Policy
- High/critical unresolved findings should block merge unless a documented exception is approved.
