# Current State

## Basic Information

| Item | Value |
|---|---|
| Repository | `hellolevi-ops/ai-itsm-saas` |
| Base Branch | `develop` |
| Base Commit | `3b20d49bd68c836ba059e50426ec07b371b04c40` |
| Codex Branch | `codex/m0-takeover-baseline` |
| Codex Commit | `ca2ab7868b9605c8628bc7a28ff5f47721507958` |
| Draft PR | `https://github.com/hellolevi-ops/ai-itsm-saas/pull/2` |
| Database | PostgreSQL |
| Build Status | PASS |

## Active Services

| Service | Port | Status |
|---|---:|---|
| API Server | 3000 | Not started in this checkpoint |
| Web UI | 3001 | Not started in this checkpoint |
| PostgreSQL local service | 5432 | Present, not used for validation |
| Temporary PostgreSQL | 55432 | Started for migration validation, then stopped and removed |
| Redis | 6379 | Not verified |

## Migration Status

Latest migration: `20260714113121_init`

Validation:

- Empty temporary PostgreSQL 18 database migration: PASS
- `prisma migrate deploy`: PASS
- `prisma migrate status`: PASS, schema up to date
- Tables created: `_prisma_migrations`, `roles`, `tenants`, `users`, `workspace_members`, `workspaces`

## Available Features

- User registration with email/password
- User login with JWT tokens
- User session management with refresh tokens
- Multi-tenant architecture foundation
- Workspace creation and management
- Workspace membership and role-based access control
- Protected API endpoints with JWT authentication
- Runtime JWT secret now requires `JWT_SECRET`; no hardcoded fallback secret remains

## Quality Baseline

- Root typecheck: PASS
- Root lint: PASS
- Root Jest tests: PASS, 78/78
- Root build: PASS
- Web typecheck: PASS
- Web lint: PASS
- Web Vitest tests: PASS, 58/58
- Web build: PASS
- Total automated tests: PASS, 136/136

## Key Modules

- `src/modules/auth/` - Authentication module
- `src/modules/workspace/` - Workspace and tenant management
- `apps/web/` - Next.js frontend application
- `prisma/` - Database schema and migrations

## Tech Stack

- Backend: NestJS + TypeScript
- Frontend: Next.js 16 + React 19
- Database: PostgreSQL + Prisma ORM
- Authentication: JWT
- Testing: Jest (backend), Vitest (frontend)
- Linting: ESLint + Prettier
