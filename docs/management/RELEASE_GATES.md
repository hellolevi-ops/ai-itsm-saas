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
- No CI workflow is present yet.
- Browser-level E2E flow was not automated in this checkpoint.

## Production Gate

Production release requires human approval and is outside autonomous execution.
