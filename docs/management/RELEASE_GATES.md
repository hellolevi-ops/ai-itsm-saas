# Release Gates

## M0 Gate

Criteria:

- Authoritative repository recovered.
- `develop` baseline and Trae handoff commit relationship verified.
- No P0 issues.
- No blocking P1 issues.
- Typecheck, lint, tests, builds, migration validation, E2E and tenant-isolation checks run or explicitly marked unavailable with evidence.

Current result: PASS_WITH_RISK.

Evidence:

- Authoritative repository `hellolevi-ops/ai-itsm-saas` recovered from `develop`.
- Trae handoff commit `98f6e2c2fe7eb67a755d7d03c2f981f5daff8a15` is present in `develop` history.
- Draft PR #2 preserves Codex takeover changes.
- Root typecheck, lint, Jest tests and build passed.
- Web typecheck, lint, Vitest tests and build passed.
- Empty temporary PostgreSQL migration validation passed.
- Existing tenant/workspace negative unit tests passed.

Residual risks:

- Local workspace still lacks `.git`, so future local Git operations require Git installation or API workflow.
- CI workflow is now defined, but remote CI result still depends on GitHub Actions execution.
- Browser-level E2E is automated locally and in the CI workflow definition.

## Release Candidate Gate

Criteria:

- M0-M10 accepted locally.
- Root and web regression gates pass.
- Main browser E2E path passes.
- Empty PostgreSQL migration validation passes.
- RC artifact check passes.
- Production release hold items are listed.

Current result: PASS_WITH_HUMAN_ACTIONS_REQUIRED.

Evidence:

- `docs/release-candidate/RELEASE_CANDIDATE_REPORT.md`
- `docs/release-candidate/REGRESSION_MATRIX.md`
- `docs/release-candidate/PERMISSION_TENANT_MATRIX.md`
- `docs/release-candidate/AI_SAFETY_REVIEW.md`
- `docs/release-candidate/PRODUCTION_RELEASE_HOLD.md`
- `GET /api/v1/release-candidate/public`
- `/release-candidate`
- `.github/workflows/ci.yml`
- `npm run rc:check`

Residual risks:

- Real design partner beta evidence is not yet available.
- Legal/compliance materials need professional final review.
- Real model, email, payment and production infrastructure are not configured.
- Backup/restore, rollback and monitoring are documented but not production-drilled.

## Production Gate

Production release requires human approval and is outside autonomous execution.
