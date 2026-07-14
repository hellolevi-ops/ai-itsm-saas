# M1: Minimal Ticket Loop

Status: PLANNING

## User Value

After signup and workspace creation, a team can receive a web request, turn it into a tracked ticket, assign it, reply, close it and retain an audit trail.

## Scope

Implement the contract in `docs/contracts/TICKET_API.md`.

Included:

- Ticket, message and event data model.
- Workspace-scoped backend ticket APIs.
- Tenant and role enforcement.
- Ticket queue, detail and requester submit flows in the web app.
- Backend and frontend tests for happy paths, denied paths and cross-tenant isolation.

Excluded:

- AI suggestions.
- Knowledge base.
- Full SLA.
- Email/Feishu/channel ingestion.
- Attachments.
- Billing quota enforcement.

## File Ownership

Backend owner:

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `src/modules/ticket/**`
- `src/app.module.ts`

Frontend owner:

- `apps/web/src/app/tickets/**`
- `apps/web/src/app/workspaces/[workspaceId]/**`
- `apps/web/src/components/tickets/**`
- `apps/web/src/lib/api.ts`
- `apps/web/src/types/api.ts`
- `apps/web/src/mocks/handlers.ts`

QA/security owner:

- `src/modules/ticket/**/*.spec.ts`
- `apps/web/src/components/tickets/**/*.test.tsx`
- M1 validation notes in `docs/status/`

Shared/high-conflict files require serialized edits:

- `prisma/schema.prisma`
- `src/app.module.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/types/api.ts`

## Backend Tasks

- Add Prisma enums: `TicketSource`, `TicketStatus`, `TicketPriority`, `TicketMessageVisibility`, `TicketEventType`.
- Add models: `Ticket`, `TicketMessage`, `TicketEvent`.
- Add repository layer with mandatory `workspaceId` filters.
- Add service layer for create, list, detail, update, assign, message, status, close and reopen.
- Add controllers under `/api/v1/workspaces/:workspaceId/tickets`.
- Enforce workspace membership and role permissions.
- Generate deterministic workspace-local ticket numbers.
- Write audit events in the same transaction as state changes.

## Frontend Tasks

- Add API client methods and shared types.
- Add requester ticket submission page.
- Add agent ticket queue page.
- Add ticket detail page with public messages, internal notes, assignment and status controls.
- Add empty/loading/error/forbidden states.
- Extend MSW handlers and tests.

## QA Tasks

- Backend unit tests for permissions, status transitions and event writing.
- Backend negative tests for cross-tenant/cross-workspace access.
- Frontend tests for submit, queue, detail, public reply/internal note visibility and forbidden states.
- Migration validation against empty PostgreSQL.
- Full gate run: root typecheck/lint/test/build, web typecheck/lint/test/build.

## Open Contract Decisions

- M1 uses the reduced PRD-compatible state machine `NEW -> TRIAGE -> IN_PROGRESS -> RESOLVED -> CLOSED`, plus `RESOLVED/CLOSED -> REOPENED -> IN_PROGRESS`.
- SLA-pausing states such as `WAITING_REQUESTER` are deferred until SLA work.
- `REQUESTER` remains an explicit workspace role in Prisma and must be seeded/usable for ticket permissions.

## Acceptance Gate

M1 can move to ACCEPTED only when:

- Contract implemented without scope creep.
- No P0 issues.
- No blocking P1 issues.
- All quality gates pass.
- Empty DB migration validation passes.
- Tenant isolation negative tests pass for ticket reads, writes, lists, messages and status changes.
- Draft PR is updated with M1 evidence.
