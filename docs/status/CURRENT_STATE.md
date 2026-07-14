# Current State

## Basic Information

| Item | Value |
|---|---|
| Repository | `hellolevi-ops/ai-itsm-saas` |
| Base Branch | `develop` |
| Base Commit | `3b20d49bd68c836ba059e50426ec07b371b04c40` |
| Codex Branch | `codex/m0-takeover-baseline` |
| Codex Commit | PR branch `codex/m0-takeover-baseline`; M5 validation recorded in this snapshot |
| Draft PR | `https://github.com/hellolevi-ops/ai-itsm-saas/pull/2` |
| Database | PostgreSQL |
| Build Status | PASS |

## Active Services

| Service | Port | Status |
|---|---:|---|
| API Server | 3000 | Not started in this checkpoint |
| Web UI | 3001 | Started by Playwright during E2E, then test runner stopped it |
| PostgreSQL local service | 5432 | Present, not used for validation |
| Temporary PostgreSQL | 55438 | Reserved for M5 migration validation, then stopped and removed after validation |
| Redis | 6379 | Not verified |

## Migration Status

Latest migration: `20260715033000_add_wecom_channel`

Validation:

- Empty temporary PostgreSQL 18 database migration: PASS for six migrations through M5
- `prisma migrate deploy`: PASS
- `prisma migrate status`: PASS, schema up to date
- Tables created include: `_prisma_migrations`, `roles`, `tenants`, `users`, `workspace_members`, `workspaces`, `tickets`, `ticket_messages`, `ticket_events`, `ai_runs`, `knowledge_articles`, `service_catalog_items`, `request_templates`, `workspace_working_hours`, `channel_connections`, `channel_inbound_messages`

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
- Knowledge article model with ticket source, draft/published/archive status and requester/internal visibility
- Staff-only knowledge draft generation from resolved or closed tickets
- Staff knowledge publish API
- Requester-safe knowledge list/detail API that only exposes published requester-visible articles
- Web ticket detail knowledge draft and publish controls
- Web knowledge list/search page for self-service articles
- Service catalog Lite with staff-managed service items and request templates
- Working-hours Lite for SLA target calculation
- Ticket creation from request templates with service catalog linkage and response/resolution due timestamps
- Web service catalog page for item/template creation
- Web ticket submit template selector with title, description, priority and category prefill
- Web ticket detail service target panel
- WeCom mock channel connection management
- Public WeCom mock inbound webhook with token verification and idempotent external message handling
- Channel inbound audit records linked to WECOM tickets
- Web channels page for creating a mock connection and simulating inbound messages

## Quality Baseline

- Root typecheck: PASS
- Root lint: PASS
- Root Jest tests: PASS, 120/120
- Root build: PASS
- Web typecheck: PASS
- Web lint: PASS
- Web Vitest tests: PASS, 69/69
- Web Playwright E2E: PASS, 1/1
- Web build: PASS
- Total automated tests: PASS, 190/190 including Playwright E2E
- M1 backend ticket module: PASS, 88/88 backend tests
- M1/M2 web ticket components: PASS, 66/66 frontend tests

## Key Modules

- `src/modules/auth/` - Authentication module
- `src/modules/workspace/` - Workspace and tenant management
- `apps/web/` - Next.js frontend application
- `prisma/` - Database schema and migrations
- `docs/contracts/TICKET_API.md` - M1 ticket API and permission contract
- `docs/contracts/SERVICE_CATALOG_API.md` - M4 service catalog, request template and SLA target contract
- `docs/contracts/CHANNEL_API.md` - M5 WeCom mock channel and inbound webhook contract

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

## M3 Progress

- Contract: `docs/contracts/KNOWLEDGE_API.md`.
- Task file: `docs/tasks/M3-knowledge-self-service.md`.
- Prisma model: `KnowledgeArticle` plus `KnowledgeStatus`, `KnowledgeVisibility` and `KnowledgeSourceType`.
- Migration: `20260715013000_add_knowledge_articles`.
- Backend: `src/modules/knowledge/**` with repository, service, controller and module wiring.
- Endpoints:
  - `POST /api/v1/workspaces/:workspaceId/tickets/:ticketId/knowledge-drafts`
  - `GET /api/v1/workspaces/:workspaceId/knowledge`
  - `GET /api/v1/workspaces/:workspaceId/knowledge/:articleId`
  - `POST /api/v1/workspaces/:workspaceId/knowledge/:articleId/publish`
- Safety: requester access is forced to published requester-visible articles; internal ticket notes are excluded from draft generation.
- Tests: service tests for role/status/visibility rules and repository tests for workspace-scoped reads/publish.
- Web: ticket detail can create and publish a knowledge draft; `/knowledge` lists/searches requester-visible published articles.
- Browser E2E: registration, workspace creation, ticket, AI suggestion, message, resolve, knowledge draft, publish and self-service search all pass.

## M4 Progress

- Contract: `docs/contracts/SERVICE_CATALOG_API.md`.
- Task file: `docs/tasks/M4-service-management-basics.md`.
- Prisma models: `ServiceCatalogItem`, `RequestTemplate`, `WorkspaceWorkingHours`.
- Migration: `20260715021500_add_service_catalog`.
- Ticket additions: `service_catalog_item_id`, `request_template_id`, `response_due_at`, `resolution_due_at`.
- Backend: `src/modules/service-catalog/**` with repository, service, controller and module wiring.
- Endpoints:
  - `GET /api/v1/workspaces/:workspaceId/service-catalog`
  - `POST /api/v1/workspaces/:workspaceId/service-catalog/items`
  - `POST /api/v1/workspaces/:workspaceId/service-catalog/templates`
  - Existing `POST /api/v1/workspaces/:workspaceId/tickets` accepts `request_template_id`.
- Safety: staff-only catalog/template writes; active same-workspace template validation; requester-safe catalog read.
- Tests: service/repository tests for staff restrictions, same-workspace validation and SLA target calculation; ticket service test for template-driven ticket creation.
- Web: `/service-catalog` creates items/templates; `/tickets/new` applies templates; ticket detail shows service targets.
- Browser E2E: registration, workspace creation, service item, request template, templated ticket, AI suggestion, message, resolve, knowledge draft, publish and self-service search all pass.

## M5 Progress

- Contract: `docs/contracts/CHANNEL_API.md`.
- Task file: `docs/tasks/M5-first-china-channel.md`.
- Prisma models: `ChannelConnection`, `ChannelInboundMessage`.
- Migration: `20260715033000_add_wecom_channel`.
- Ticket source enum now includes `WECOM`.
- Backend: `src/modules/channel/**` with JWT-protected management API and public mock webhook.
- Endpoints:
  - `GET /api/v1/workspaces/:workspaceId/channels`
  - `POST /api/v1/workspaces/:workspaceId/channels/wecom`
  - `POST /api/v1/channels/wecom/:connectionId/messages`
- Safety: staff-only channel creation; webhook token verification; workspace derived from connection id; duplicate external messages return the existing ticket.
- Tests: channel service covers staff-only management, invalid tokens, inbound ticket creation, duplicate handling and missing connections.
- Web: `/channels` creates a WeCom mock channel and simulates inbound messages.
- Browser E2E: registration, workspace creation, WeCom mock channel, inbound WECOM ticket, service item, request template, templated ticket, AI suggestion, message, resolve, knowledge draft, publish and self-service search all pass.

## Known Security/Audit Notes

- Web `npm audit --audit-level=moderate`: 2 moderate findings from Next's transitive PostCSS dependency.
- `npm audit fix --force` proposes a breaking downgrade to Next 9.3.3, so it was not applied automatically.
- Secret scan after M4 found no committed GitHub token; matches were dependency/document URL false positives.
- M5 still uses only mock channel tokens; no real WeCom or production secret is required.

## Tech Stack

- Backend: NestJS + TypeScript
- Frontend: Next.js 16 + React 19
- Database: PostgreSQL + Prisma ORM
- Authentication: JWT
- Testing: Jest (backend), Vitest (frontend)
- Linting: ESLint + Prettier
