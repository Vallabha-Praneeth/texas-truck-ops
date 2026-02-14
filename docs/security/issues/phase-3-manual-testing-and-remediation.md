## Objective
Execute manual OWASP-guided security testing and remediate high-risk findings.

## Tasks
- Run WSTG checks for auth/session/access control in `apps/admin`.
- Run API Top 10 abuse scenarios (BOLA, broken auth, mass assignment, rate limits) on `packages/api` endpoints.
- Run MASVS/MASTG checks on mobile auth token storage, TLS handling, and runtime hardening basics.
- File remediation tickets per finding with severity and owner.
- Re-test fixed items and attach evidence.

## Acceptance Criteria
- Test evidence stored under `docs/security/test-evidence/`.
- All critical findings fixed before release.
- High findings either fixed or have approved temporary exceptions with expiry.
- Updated OWASP matrix reflects post-remediation status.

## Deliverables
- `docs/security/test-evidence/manual-test-report.md`
- linked remediation issues per finding
