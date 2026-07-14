# GitHub Access Check

- Checked at: 2026-07-14 22:13:22 Asia/Shanghai
- Repository: `hellolevi-ops/ai-itsm-saas`
- Result: PASS
- Token stored in this repository: No

## Access

The provided GitHub token successfully accessed `hellolevi-ops/ai-itsm-saas` through the GitHub REST API.

Observed repository permissions:

- `admin`: true
- `maintain`: true
- `push`: true
- `triage`: true
- `pull`: true

## Repository Baseline

- Visibility: public
- Default branch: `main`
- `main` HEAD: `83da3cbcdda8e332ebc64fc7d6ba6a7cab7a397e`
- `develop` HEAD: `3b20d49bd68c836ba059e50426ec07b371b04c40`
- Tags: none returned by API

Branches returned by API:

| Branch | HEAD |
|---|---|
| `develop` | `3b20d49bd68c836ba059e50426ec07b371b04c40` |
| `feat/T-001-tenant-workspace-model` | `fb03ab13eafb5f0c11360bb930a18b76cf7ceb56` |
| `feat/T-002-auth-workspace-api` | `5444732f7183d818462ddecf5e0bfac5ae3c9646` |
| `feat/T-003-auth-workspace-web` | `515360d566a217a901dc4ecc7d0804e649d02ce3` |
| `main` | `83da3cbcdda8e332ebc64fc7d6ba6a7cab7a397e` |
| `trae/agent-QwTdrf` | `7194a194e452a5a0eac02d0e44fa71825b661979` |
| `trae/agent-ZYLOt3` | `d23276e2ae2835a522da3f37d8b70b83214c13eb` |
| `trae/agent-qi6XSv` | `6302111b4803f14137f636cc637bc7fa638f7ebc` |

## Trae Handoff Commit

- Expected prefix: `98f6e2c`
- API result: PASS
- Full SHA: `98f6e2c2fe7eb67a755d7d03c2f981f5daff8a15`
- Commit message: `merge: integration fixes from trae/agent-qi6XSv into develop`

This commit is present in the latest `develop` history. `develop` is later than the handoff commit.

## Key Paths on `develop`

The recursive tree for `develop` contains:

- `package.json`
- `package-lock.json`
- `prisma/schema.prisma`
- `apps`
- `src`
- `docs`
- `README.md`
- `AI_ITSM_SaaS_PLG_产品需求说明书_PRD_中国区_V1.0.md`
- `AI_ITSM_SaaS_PLG_商业计划书_中国区_V1.0.md`

## Local Recovery and Validation

- Local source recovery: PASS via GitHub `develop` zipball archive.
- Local `.git` metadata: not present. Git CLI is also unavailable in PATH, so commit, branch and remote checks remain unavailable locally.
- Dependency install:
  - Root `npm ci`: PASS
  - `apps/web` `npm ci`: PASS. Initial tool wait timed out, but npm log ended with `exit 0` and scripts run successfully.
- Quality gate success rate: 10/10 executable gates passed.
- Automated test success rate: 136/136 tests passed.

Executable gates run after recovery:

| Gate | Result |
|---|---|
| `npm run prisma:generate` | PASS |
| `npm exec prisma -- validate` with local `DATABASE_URL` | PASS |
| Root `npm run typecheck` | PASS |
| Root `npm run lint:check` | PASS |
| Root `npm test -- --runInBand` | PASS, 78/78 tests |
| Root `npm run build` | PASS |
| Web `npm run typecheck` | PASS |
| Web `npm run lint` | PASS |
| Web `npm test` | PASS, 58/58 tests |
| Web `npm run build` | PASS |

## Latest PR Branch Update

- Checked at: 2026-07-15 02:29 Asia/Shanghai
- Draft PR: `https://github.com/hellolevi-ops/ai-itsm-saas/pull/2`
- Branch: `codex/m0-takeover-baseline`
- Latest M5 commit pushed by GitHub REST API: `244cc42502710be6fc6d1a515d58dcb12bb6dc63`
- PR head verification: PASS
- Token stored in this repository: No

Latest validation evidence after M5:

| Gate | Result |
|---|---|
| `npm run prisma:generate` | PASS |
| `npm exec prisma -- validate` with local `DATABASE_URL` | PASS |
| Root `npm run typecheck` | PASS |
| Root `npm run lint:check` | PASS |
| Root `npm test -- --runInBand` | PASS, 120/120 tests |
| Root `npm run build` | PASS |
| Web `npm run typecheck` | PASS |
| Web `npm run lint` | PASS |
| Web `npm test` | PASS, 69/69 tests |
| Web `npm run build` | PASS |
| Web `npm run test:e2e` | PASS, 1/1 |
| Temporary PostgreSQL migration validation | PASS, 6 migrations through `20260715033000_add_wecom_channel` |
| Secret scan | PASS, no committed GitHub/OpenAI token found |

Security note:

- The provided GitHub token was not written to repository files.
- A runtime JWT fallback secret was found and removed. Runtime now requires `JWT_SECRET`.
- `.env.example` was added for required local configuration.
- M5 secret scan matched only dependency/document URLs, not secrets.

Remaining limitations:

- Temporary PostgreSQL migration validation has passed through M4; staging/production migration remains future release work.
- Production release was not attempted.
