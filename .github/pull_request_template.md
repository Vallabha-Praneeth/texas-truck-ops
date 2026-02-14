## Summary
- What changed:
- Why:

## Linked Work
- Issue(s):

## Validation
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] Relevant E2E tests (if UI/auth/API behavior changed)

## Security Checklist (OWASP-Aligned)
- [ ] Auth/session impact reviewed (ASVS V2/V3).
- [ ] Access control impact reviewed, including object-level authorization (API1:2023 BOLA).
- [ ] Input validation and output handling reviewed (ASVS V5, API3:2023).
- [ ] Sensitive data handling reviewed (logs, secrets, storage, transport).
- [ ] Rate limits/resource controls reviewed for new/changed endpoints (API4:2023).
- [ ] Security tests added/updated for changed behavior.
- [ ] No new high/critical findings in CI security workflows, or exception linked.

## Deployment Notes
- Env/config changes:
- DB migration impact (`packages/db`):
- Rollback notes:

## Evidence
- Test output and/or screenshots/videos:
- Security scan references (workflow run links):
