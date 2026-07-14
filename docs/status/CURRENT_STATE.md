# Current State

## Basic Information

| Item | Value |
|---|---|
| Repository | `hellolevi-ops/ai-itsm-saas` |
| Base Branch | `develop` |
| Base Commit | `3b20d49bd68c836ba059e50426ec07b371b04c40` |
| Codex Branch | `codex/m0-takeover-baseline` |
| Codex Commit | PR branch `codex/m0-takeover-baseline`; M11 validation recorded in this snapshot |
| Draft PR | `https://github.com/hellolevi-ops/ai-itsm-saas/pull/2` |
| Database | PostgreSQL |
| Build Status | PASS |

## Active Services

| Service | Port | Status |
|---|---:|---|
| API Server | 3000 | Not started in this checkpoint |
| Web UI | 3001 | Started by Playwright during E2E, then test runner stopped it |
| PostgreSQL local service | 5432 | Present, not used for validation |
| Temporary PostgreSQL | 55444 | Reserved for M11 migration validation, then stopped and removed after validation |
| Redis | 6379 | Not verified |

## Migration Status

Latest migration: `20260715065000_add_beta_readiness`

Validation:

- Empty temporary PostgreSQL 18 database migration: PASS for nine migrations through M10
- `prisma migrate deploy`: PASS
- `prisma migrate status`: PASS, schema up to date
- Tables created include: `_prisma_migrations`, `roles`, `tenants`, `users`, `workspace_members`, `workspaces`, `tickets`, `ticket_messages`, `ticket_events`, `ai_runs`, `knowledge_articles`, `service_catalog_items`, `request_templates`, `workspace_working_hours`, `channel_connections`, `channel_inbound_messages`, `workspace_invitations`, `workspace_subscriptions`, `payment_orders`, `beta_feedback`, `workspace_feature_flags`

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
- Workspace invitation creation and listing for owners/admins
- Public invitation acceptance that creates the teammate in the target workspace tenant
- Invite tokens stored as hashes and never returned after creation
- Web team page for invite-link generation
- Web invite acceptance page for teammate self-serve onboarding
- Server-side billing plan catalog for Free, Team, Growth and Business
- Workspace subscription and manual payment order models
- Owner/admin billing overview, manual order creation and manual activation APIs
- Server-side monthly ticket quota enforcement before web and channel ticket creation
- Web billing page for plan, usage, order creation and activation
- Public liveness and readiness health endpoints
- Prisma-backed database readiness check
- Global `X-Request-Id` response header with inbound request id preservation
- Baseline browser security response headers on all routes
- Public compliance package metadata API
- Web compliance center at `/legal`
- China-market compliance drafts and review checklists marked as not effective and professional-review-required
- Public beta readiness package metadata API
- Workspace beta feature flags
- Workspace beta feedback, bug and interview-note intake
- Web beta readiness console at `/beta`
- Beta guide, release notes draft, support process, interview outline, reset runbook and exit criteria
- Public release-candidate readiness package metadata API
- Web release-candidate center at `/release-candidate`
- CI workflow definition for PR/push verification
- Local RC artifact check with `npm run rc:check`
- RC report, regression matrix, permission/tenant matrix, AI safety review, dependency review, performance baseline, backup/restore runbook, migration/rollback runbook, monitoring plan and production release hold list

## Quality Baseline

- Root typecheck: PASS
- Root lint: PASS
- Root Jest tests: PASS, 152/152
- Root build: PASS
- Web typecheck: PASS
- Web lint: PASS
- Web Vitest tests: PASS, 69/69
- Web Playwright E2E: PASS, 1/1
- Web build: PASS
- Temporary PostgreSQL migration validation: PASS, 9 migrations through M10
- Secret scan: PASS, no committed GitHub/OpenAI token found
- Total automated tests: PASS, 222/222 including Playwright E2E
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
- `docs/contracts/INVITATION_API.md` - M6 workspace invitation and team-spread contract
- `docs/contracts/BILLING_API.md` - M7 plan, entitlement and manual-order contract
- `docs/contracts/OPERATIONS_API.md` - M8 health, request correlation and security header contract
- `docs/contracts/COMPLIANCE_API.md` - M9 compliance package metadata contract
- `docs/contracts/BETA_API.md` - M10 beta readiness, feature flag and feedback contract
- `docs/contracts/RELEASE_CANDIDATE_API.md` - M11 release candidate readiness contract

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

## M6 Progress

- Contract: `docs/contracts/INVITATION_API.md`.
- Task file: `docs/tasks/M6-plg-team-spread.md`.
- Prisma model: `WorkspaceInvitation` plus `WorkspaceInvitationStatus`.
- Migration: `20260715043000_add_workspace_invitations`.
- Backend: `src/modules/invitation/**` with protected management API and public acceptance API.
- Endpoints:
  - `GET /api/v1/workspaces/:workspaceId/invitations`
  - `POST /api/v1/workspaces/:workspaceId/invitations`
  - `POST /api/v1/invitations/accept`
- Safety: owner/admin-only invitation management; invite roles restricted to `AGENT` and `REQUESTER`; token hashes are stored server-side; workspace/tenant are derived from the token on acceptance.
- Tests: invitation service tests cover staff-only creation, privilege-escalating role rejection, acceptance, missing invite, email mismatch and expiration.
- Web: `/team` creates invite links; `/invite/accept` registers the teammate into the invited workspace.
- Browser E2E: registration, workspace creation, invite creation, invite acceptance, WeCom mock channel, inbound WECOM ticket, service item, request template, templated ticket, AI suggestion, message, resolve, knowledge draft, publish and self-service search all pass.

## M7 Progress

- Contract: `docs/contracts/BILLING_API.md`.
- Task file: `docs/tasks/M7-plans-entitlements-commercial-flow.md`.
- Prisma models: `WorkspaceSubscription` and `PaymentOrder`.
- Migration: `20260715053000_add_billing_entitlements`.
- Backend: `src/modules/billing/**` with plan catalog, billing overview, manual order creation and manual activation.
- Endpoints:
  - `GET /api/v1/workspaces/:workspaceId/billing`
  - `POST /api/v1/workspaces/:workspaceId/billing/orders`
  - `POST /api/v1/workspaces/:workspaceId/billing/orders/:orderId/activate`
- Safety: owner/admin-only commercial writes; no real payment provider; ticket quota enforced server-side through `BillingService` before web and channel ticket creation.
- Tests: billing service tests cover default Free entitlements, manual order creation, requester rejection, Free order rejection, activation, missing orders and Free ticket-limit rejection.
- Web: `/billing` displays current plan, usage, plan catalog, manual order creation and activation.
- Browser E2E: registration, workspace creation, Free billing overview, Team manual order activation, invite creation, invite acceptance, WeCom mock channel, inbound WECOM ticket, service item, request template, templated ticket, AI suggestion, message, resolve, knowledge draft, publish and self-service search all pass.

## M8 Progress

- Contract: `docs/contracts/OPERATIONS_API.md`.
- Task file: `docs/tasks/M8-security-reliability-operations.md`.
- Backend: `src/modules/ops/**` with public liveness and readiness endpoints.
- Endpoints:
  - `GET /api/v1/health/live`
  - `GET /api/v1/health/ready`
- Operations hardening:
  - readiness checks PostgreSQL through Prisma `SELECT 1`
  - global `RequestIdMiddleware` preserves or generates `X-Request-Id`
  - global `SecurityHeadersMiddleware` adds baseline browser security headers
- Tests: ops service covers live status, ready success and ready failure; middleware tests cover request id and security headers.
- Web/MSW: mock health handlers support local browser verification.
- Browser E2E: main path now verifies live/ready probes before registration, billing, invite, channel, ticket, AI and knowledge flows.

## M9 Progress

- Contract: `docs/contracts/COMPLIANCE_API.md`.
- Task file: `docs/tasks/M9-china-compliance-preparation.md`.
- Draft package: `docs/compliance/**`.
- Backend: `src/modules/compliance/**` with public compliance metadata APIs.
- Endpoints:
  - `GET /api/v1/compliance/public`
  - `GET /api/v1/compliance/documents/:slug`
- Materials:
  - user agreement draft
  - privacy policy draft
  - personal information collection list
  - third-party service list
  - data retention, deletion and export policy
  - AI usage disclosure
  - model provider data review matrix
  - data processing agreement draft
  - security incident and complaint process
  - SLA statement draft
  - ICP, public security and MLPS applicability checklist
  - generative AI and content labeling checklist
- Safety: every material is marked review-required, not legally effective and not production-effective.
- Web: `/legal` renders the compliance center and review boundary.
- Browser E2E: main path now verifies the compliance center after knowledge self-service.
- Validation: root typecheck/lint/Jest/build, web typecheck/lint/Vitest/build/E2E, Prisma validate, temporary PostgreSQL migration validation and secret scan all pass.

## M10 Progress

- Contract: `docs/contracts/BETA_API.md`.
- Task file: `docs/tasks/M10-beta-readiness.md`.
- Beta docs: `docs/beta/**`.
- Prisma models: `BetaFeedback` and `WorkspaceFeatureFlag`.
- Migration: `20260715065000_add_beta_readiness`.
- Backend: `src/modules/beta/**` with public beta package and workspace beta controls.
- Endpoints:
  - `GET /api/v1/beta/public`
  - `GET /api/v1/workspaces/:workspaceId/beta`
  - `POST /api/v1/workspaces/:workspaceId/beta/feedback`
  - `POST /api/v1/workspaces/:workspaceId/beta/feature-flags/:key`
- Safety: beta package explicitly marks `production_release = false` and paid external resources as not required.
- Web: `/beta` renders beta status, feature flags, feedback intake, documents and exit criteria.
- Browser E2E: main path verifies beta readiness, flag toggle and feedback creation before the existing invite/channel/ticket/AI/knowledge/compliance flow.
- Validation: root typecheck/lint/Jest/build, web typecheck/lint/Vitest/build/E2E, Prisma validate, temporary PostgreSQL migration validation and secret scan all pass.

## M11 Progress

- Contract: `docs/contracts/RELEASE_CANDIDATE_API.md`.
- Task file: `docs/tasks/M11-release-candidate-preparation.md`.
- RC docs: `docs/release-candidate/**`.
- Backend: `src/modules/release-candidate/**` with public RC readiness metadata.
- Endpoint:
  - `GET /api/v1/release-candidate/public`
- Web: `/release-candidate` renders RC gate status, report paths and human production-release hold items.
- Release engineering: `.github/workflows/ci.yml`, `scripts/rc-check.mjs` and `npm run rc:check`.
- Safety: package explicitly marks `production_release = false`, `merge_to_main_approved = false` and `legal_final_judgment = false`.
- Validation: root prisma generate/validate, RC artifact check, typecheck/lint/Jest/build, web typecheck/lint/Vitest/build/E2E, temporary PostgreSQL migration validation, dependency audit and secret scan all ran; the only audit finding is the known web Next/PostCSS moderate advisory tracked as P1-SEC-002.

## Known Security/Audit Notes

- Web `npm audit --audit-level=moderate`: 2 moderate findings from Next's transitive PostCSS dependency.
- `npm audit fix --force` proposes a breaking downgrade to Next 9.3.3, so it was not applied automatically.
- Secret scan after M10 found no committed GitHub/OpenAI token.
- M5 still uses only mock channel tokens; no real WeCom or production secret is required.
- M6 invite links are displayed in-app for local PLG validation only; no real email provider or production onboarding system is used.
- M7 uses manual/mock commercial activation only; no real payment provider, invoice system, tax workflow or production commerce resource is connected.
- M8 adds local executable operations primitives only; no production monitoring provider, backup storage, alerting tool or deployment change is connected.
- M9 adds draft compliance materials only; no final legal judgment, filing, external legal resource or production release was performed.
- M9 also removes the external Google Fonts build dependency so the web production build no longer needs network font fetches.
- M10 is beta readiness only; real design partner recruiting, interviews and payment validation remain manual business work before RC approval.
- M11 prepares a local Release Candidate package only; production release is held pending human/external actions.

## Tech Stack

- Backend: NestJS + TypeScript
- Frontend: Next.js 16 + React 19
- Database: PostgreSQL + Prisma ORM
- Authentication: JWT
- Testing: Jest (backend), Vitest (frontend)
- Linting: ESLint + Prettier
