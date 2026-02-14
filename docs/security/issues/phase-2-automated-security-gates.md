## Objective
Introduce CI-enforced automated security checks (SAST, SCA, DAST baseline).

## Tasks
- Add SAST workflow (`.github/workflows/security-sast.yml`) for CodeQL + Semgrep.
- Add SCA workflow (`.github/workflows/security-sca.yml`) for dependency audit + Trivy FS scan.
- Add ZAP baseline workflow (`.github/workflows/security-zap.yml`) against staging admin/API URLs.
- Define merge-block policy for critical/high severity findings.
- Store artifacts for triage (SARIF, HTML/JSON reports).

## Acceptance Criteria
- Workflows trigger on PR + schedule.
- Results visible in GitHub Security/Actions.
- High/critical findings fail the job (or create explicit tracked exceptions).
- Readme section added describing how to run and interpret scans.

## Dependencies
- Staging URLs available via repository secrets.
- Baseline suppressions reviewed by security owner.
