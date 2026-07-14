# Release Candidate API

M11 exposes a read-only release-candidate readiness package.

## Public RC Package

`GET /api/v1/release-candidate/public`

Returns:

- `package_version`
- `status = RELEASE_CANDIDATE_PREPARED`
- `production_release = false`
- `merge_to_main_approved = false`
- `legal_final_judgment = false`
- gate evidence for regression, permissions, AI safety, dependencies, performance, backup/restore, migration/rollback, monitoring, billing, compliance and beta evidence
- human actions required before production
- RC report paths

## Safety Boundary

This endpoint is evidence for RC preparation only. It does not approve production release, legal final judgment, paid external services, production secrets or merge to `main`.
