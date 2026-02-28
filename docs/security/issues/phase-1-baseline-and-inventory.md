## Objective
Establish security baseline and inventory mapped to OWASP ASVS L2, API Top 10 (2023), and MASVS-L1.

## Scope
- `apps/admin`
- `apps/mobile`
- `packages/api`
- `packages/shared`
- `packages/db`

## Tasks
- Build endpoint inventory from Nest controllers (`packages/api/src/**/\*.controller.ts`).
- Document auth/session flows for admin and API JWT guards.
- Create data classification list (PII, secrets, audit data) and storage/transit map.
- Assign control owners for each domain module.
- Validate and update `docs/security/owasp-control-matrix.md` statuses.

## Acceptance Criteria
- Endpoint inventory committed under `docs/security/`.
- Auth/session diagrams and trust boundaries documented.
- Each control row has owner + status (`pass`, `partial`, `gap`).
- Risk register created with severity and target fix dates.

## Deliverables
- `docs/security/owasp-control-matrix.md` (updated)
- `docs/security/risks-register.md`
- `docs/security/api-endpoint-inventory.md`
