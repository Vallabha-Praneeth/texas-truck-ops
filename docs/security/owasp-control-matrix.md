# OWASP Security Plan and Control Matrix

## Scope and Target Levels
- Web/Admin (`apps/admin`) + API (`packages/api`): target **OWASP ASVS v5.0.0 Level 2**.
- API threat model (`packages/api`): cover all **OWASP API Security Top 10 (2023)** risks.
- Mobile (`apps/mobile`): target **OWASP MASVS-L1** with testing via MASTG.

## Phase Plan
### Phase 1 (Week 1): Baseline and Inventory
- Freeze auth and access-control architecture for review.
- Build endpoint inventory from Nest controllers.
- Add `docs/security/risks-register.md` and assign owners.

### Phase 2 (Week 2-3): Automated Security Gates
- Add SAST + dependency scanning in CI.
- Add DAST baseline scan (OWASP ZAP) against staging admin/API.
- Add policy gates: block merge on critical/high findings.

### Phase 3 (Week 3-4): Deep Manual Testing
- Execute WSTG tests for auth/session/access control against admin app.
- Execute API Top 10 abuse cases against API endpoints.
- Execute MASTG checks for token storage, TLS, and reverse-engineering basics.

### Phase 4 (Ongoing): Governance
- PR checklist requires security impact + test evidence.
- Quarterly re-test and annual external penetration test.
- Track KPIs: control coverage, open high/critical issues, MTTR.

## Control Mapping (Initial Draft)
| Standard control area | Repo surface | Initial status | Required testing |
|---|---|---|---|
| ASVS V2 Authentication | `packages/api/src/auth`, `apps/admin/lib/auth` | Partial | JWT lifetime/rotation tests, OTP brute-force/rate-limit checks |
| ASVS V3 Session Management | `apps/admin` cookies/session handling | Partial | Session fixation, logout invalidation, timeout checks |
| ASVS V4 Access Control | `packages/api/src/*` domain modules | Gap risk | IDOR/BOLA tests across `bookings`, `slots`, `offers`, `requests` |
| ASVS V5 Validation/Sanitization | `packages/shared/src/schemas`, API DTOs | Partial | Fuzz and negative tests for all write endpoints |
| ASVS V8 Data Protection | API/mobile/admin env + transport | Partial | Secret handling review, TLS-only checks, sensitive log redaction |
| API1:2023 BOLA | Object-based endpoints in API modules | Gap risk | Cross-tenant object access attempts |
| API2:2023 Broken Auth | Auth flows and JWT guards | Partial | Token tampering/replay/expiry enforcement tests |
| API3:2023 Property Auth | Update/create payloads | Gap risk | Mass-assignment and over-posting tests |
| API4:2023 Resource Consumption | Search/listing endpoints | Gap risk | Rate-limit, pagination limits, timeout tests |
| API8:2023 Misconfiguration | Next/Nest deployment + headers | Gap risk | Security headers, debug endpoint, CORS and error leakage checks |
| MASVS Storage/Auth/Network | `apps/mobile/src/lib/api.ts`, auth state | Gap risk | Verify no sensitive plaintext storage; TLS and cert validation checks |

## CI Integration Checklist
- `pnpm lint && pnpm typecheck && pnpm test` as baseline quality gate.
- Add SCA/SAST workflow for monorepo paths (`apps/*`, `packages/*`).
- Add nightly ZAP baseline for admin + API staging routes.
- Publish security test artifacts with severity trend report.

## Evidence Artifacts to Add
- `docs/security/owasp-control-matrix.md` (this file).
- `docs/security/test-evidence/` for scan outputs and pentest notes.
- `docs/security/exceptions.md` for accepted risks with expiry dates.
