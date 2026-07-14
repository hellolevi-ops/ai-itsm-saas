# Current State

## Basic Information

| Item | Value |
|---|---|
| Repository | `hellolevi-ops/ai-itsm-saas` |
| Base Branch | `develop` |
| Base Commit | `3b20d49bd68c836ba059e50426ec07b371b04c40` |
| Codex Branch | `codex/m0-takeover-baseline` |
| Codex Commit | PR branch `codex/m0-takeover-baseline` includes M2 AI-assisted ticket implementation locally pending push |
| Draft PR | `https://github.com/hellolevi-ops/ai-itsm-saas/pull/2` |
| Database | PostgreSQL |
| Build Status | PASS |

## Active Services

| Service | Port | Status |
|---|---:|---|
| API Server | 3000 | Not started in this checkpoint |
| Web UI | 3001 | Started by Playwright during E2E, then test runner stopped it |
| PostgreSQL local service | 5432 | Present, not used for validation |
| Temporary PostgreSQL | 55435 | Started for M2 migration validation, then stopped and removed |
| Redis | 6379 | Not verified |

## Migration Status

Latest migration: `20260715004500_add_ai_runs`

Validation:

- Empty temporary PostgreSQL 18 database migration: PASS
- `prisma migrate deploy`: PASS
- `prisma migrate status`: PASS, schema up to date
- Tables created: `_prisma_migrations`, `roles`, `tenants`, `users`, `workspace_members`, `workspaces`, `tickets`, `ticket_messages`, `ticket_events`, `ai_runs`

## Available Features

- User registration with email/password
- User login with JWT tokens
- User session management with refresh tokens
- Multi-tenant architecture foundation
- Workspace creation and management
- Workspace membership and role-based access control
- Protected API endpoints with JWT authentication
- Runtime JWT secret now requires `JWT_SECRET`; no hardcoded fallback secret remains
- Ticket submit, queue, detail, public/internal message and status-change backend APIs
- Web ticket submit, queue and detail screens backed by the ticket API client and MSW development handlers
- Browser-level M1 mock E2E for register, workspace creation, ticket submission, queue, detail, message and status progression
- AI Gateway with deterministic mock provider for ticket summary, category, priority and reply-draft suggestions
- Audited AI run storage in `ai_runs`
- Web ticket detail AI suggestion panel that displays draft-only suggestions without changing ticket fields

## Quality Baseline

- Root typecheck: PASS
- Root lint: PASS
- Root Jest tests: PASS, 95/95
- Root build: PASS
- Web typecheck: PASS
- Web lint: PASS
- Web Vitest tests: PASS, 66/66
- Web Playwright E2E: PASS, 1/1
- Web build: PASS
- Total automated tests: PASS, 162/162
- M1 backend ticket module: PASS, 88/88 backend tests
- M1/M2 web ticket components: PASS, 66/66 frontend tests

## Key Modules

- `src/modules/auth/` - Authentication module
- `src/modules/workspace/` - Workspace and tenant management
- `apps/web/` - Next.js frontend application
- `prisma/` - Database schema and migrations
- `docs/contracts/TICKET_API.md` - M1 ticket API and permission contract

## M1 Progress

- Ticket contract: drafted and frozen for implementation.
- Ticket task file: created.
- Prisma models: `Ticket`, `TicketMessage`, `TicketEvent`.
- Migration: `20260714230500_add_ticket_loop`.
- Empty database migration validation: PASS for both migrations.
- Workspace context security: moved from middleware registration to guard-stage validation after JWT auth.
- Backend ticket API/service/repository: implemented.
- Ticket negative tests: requester cannot view another requester ticket, requester cannot create internal note, invalid transitions fail, assignee must be eligible same-workspace staff, repository reads/lists require `workspaceId`.
- Frontend ticket API client, MSW handlers, submit form, queue and detail UI: implemented.
- Frontend tests cover create redirect, validation, queue links, detail rendering, message add and status change.
- Browser E2E covers register, create workspace, submit ticket, queue visibility, detail view, message add and start-work status transition.
- Remaining hardening: optional controller/integration coverage and CI wiring.

## M2 Progress

- Contract: `docs/contracts/AI_TICKET_ASSIST_API.md`.
- Task file: `docs/tasks/M2-ai-assisted-tickets.md`.
- Prisma model: `AiRun`.
- Migration: `20260715004500_add_ai_runs`.
- Backend: `src/modules/ai/**` with gateway, mock provider, run repository, service and controller.
- Endpoint: `POST /api/v1/workspaces/:workspaceId/tickets/:ticketId/ai-suggestions`.
- Safety: suggestions are draft-only and do not update ticket fields, send replies, assign users or close tickets.
- Tests: provider structured output and risk handling; service membership, requester ownership, missing ticket and audit-write behavior.
- Web: ticket detail AI suggestion panel and MSW handler.
- Browser E2E: M1 ticket loop now also verifies AI suggestion generation and human-review messaging.

## Known Security/Audit Notes

- Web `npm audit --audit-level=moderate`: 2 moderate findings from Next's transitive PostCSS dependency.
- `npm audit fix --force` proposes a breaking downgrade to Next 9.3.3, so it was not applied automatically.

## Tech Stack

- Backend: NestJS + TypeScript
- Frontend: Next.js 16 + React 19
- Database: PostgreSQL + Prisma ORM
- Authentication: JWT
- Testing: Jest (backend), Vitest (frontend)
- Linting: ESLint + Prettier
