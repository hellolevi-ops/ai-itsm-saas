# Known Issues

| ID | Severity | Status | Issue | Evidence | Next Action |
|---|---|---|---|---|---|
| P0-TAKEOVER-001 | P0 | RESOLVED | Local authoritative source was recovered from GitHub. | `develop` archive was expanded into the workspace and executable gates passed. | Use a real Git working tree or GitHub API workflow for commits. |
| P1-ENV-001 | P1 | OPEN | Git CLI is unavailable in PATH. | `git` command returns `CommandNotFoundException`. | Locate/install Git or use GitHub connector once repo is known. |
| P1-ENV-002 | P1 | RESOLVED | GitHub repository owner/name was unknown. | User provided `hellolevi-ops/ai-itsm-saas`; REST API access succeeded. | Continue using this repository as authoritative. |
| P1-ENV-003 | P1 | PARTIAL | Local workspace is a source snapshot, not a Git working tree. | `.git` directory is absent after archive recovery; GitHub API branch `codex/m0-takeover-baseline` and draft PR #2 now preserve changes. | Prefer installing Git for future local branch operations. |
| P1-DB-001 | P1 | RESOLVED | Live migration application was verified. | Temporary PostgreSQL 18 cluster applied migration `20260714113121_init`; `migrate status` reported schema up to date. | Continue to run migrations in CI/staging later. |
| P1-GH-001 | P1 | RESOLVED | Current GitHub connector had no repository access. | User provided repository URL and token; REST API access to `hellolevi-ops/ai-itsm-saas` succeeds with admin/maintain/push/pull permissions. | Do not store the token in repository files. |
| P2-DOC-001 | P2 | RESOLVED | Product documents were recovered from a side directory and checked against repository recovery. | Repository product docs were present during `develop` archive merge and matched the local recovered files. | Treat repository versions as canonical. |
| BLOCKED-AUDIT-001 | P0 | RESOLVED | Same blocking condition repeated for three consecutive goal turns. | User provided authoritative repository URL and token; API validation passed. | Continue Phase 0 from upstream `develop`. |
| P1-SEC-001 | P1 | RESOLVED | JWT auth used a hardcoded fallback runtime secret. | `auth.module.ts` and `jwt.strategy.ts` used a default placeholder secret. | Removed fallback; runtime now requires `JWT_SECRET`. |
| P1-SEC-002 | P1 | OPEN | Web dependency audit reports moderate Next transitive PostCSS advisory. | `npm audit --audit-level=moderate` in `apps/web` reported 2 moderate findings; forced fix proposes a breaking Next downgrade. | Review framework-safe upgrade path instead of applying `npm audit fix --force`. |
| P2-QA-001 | P2 | OPEN | Jest config emits an ESM warning even though tests pass. | `npm test -- --runInBand` passes 127/127 but warns about loading `jest.config.ts` as ESM. | Rename config to `.mjs`/`.cjs` or set package module semantics deliberately. |
