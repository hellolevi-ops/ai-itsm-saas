# M11 - Release Candidate Preparation

Status: ACCEPTED_LOCALLY

## Scope

Prepare a local Release Candidate evidence package without production release.

Included:

- full regression matrix
- main flow E2E coverage update
- permission and tenant matrix
- AI safety review
- dependency security review
- performance baseline plan
- backup and restore runbook
- migration and rollback runbook
- monitoring and alerting plan
- commercial and compliance readiness summary
- production release hold list
- read-only RC readiness API
- web RC center
- CI workflow definition
- local RC artifact check

Excluded:

- production deployment
- merge to `main`
- production secrets
- paid external services
- real payment provider
- final legal judgment
- irreversible production migration

## Implementation

- Backend:
  - `src/modules/release-candidate/**`
  - `GET /api/v1/release-candidate/public`
- Web:
  - `/release-candidate`
  - API client, types and MSW handler
  - Playwright coverage
- Release engineering:
  - `.github/workflows/ci.yml`
  - `scripts/rc-check.mjs`
  - `npm run rc:check`
- Documentation:
  - `docs/contracts/RELEASE_CANDIDATE_API.md`
  - `docs/release-candidate/**`

## Result

Accepted locally after validation. Production release remains on hold pending human/external actions.
