# M7 - Plans, Entitlements and Commercial Flow

Status: ACCEPTED_LOCALLY

## Goal

Deliver the first commercial-control loop: expose workspace plans and usage, create a manual payment order, activate it into a subscription and enforce at least one server-side quota on core usage.

## Implemented

- Prisma billing enums: `BillingPlanCode`, `BillingCycle`, `WorkspaceSubscriptionStatus`, `PaymentOrderStatus`.
- Prisma `WorkspaceSubscription` and `PaymentOrder` models.
- Migration `20260715053000_add_billing_entitlements`.
- Backend `src/modules/billing/**` with plan catalog, entitlement overview, manual order creation and activation.
- Owner/admin-only commercial writes.
- Ticket quota enforcement in `TicketService.create` and `TicketService.createFromChannel`.
- Web `/billing` page for plan, usage, order creation and manual activation.
- MSW billing handlers and quota enforcement.
- Playwright happy path now includes Free overview, Team manual order and activation before the existing activation/team/channel/ticket/AI/knowledge loop.

## Acceptance Evidence

- Root typecheck: PASS
- Root lint: PASS
- Root Jest: PASS, 135/135
- Root build: PASS
- Web typecheck: PASS
- Web lint: PASS
- Web Vitest: PASS, 69/69
- Web build: PASS
- Web Playwright E2E: PASS, 1/1
- Temporary PostgreSQL migration validation: PASS, 8 migrations through M7
- Secret scan: PASS, no committed GitHub/OpenAI token found

## Explicitly Deferred

- Real payment providers
- Payment callbacks and reconciliation
- Automatic renewal, refunds and coupons
- Real invoice/tax workflow
- Immutable usage ledger
- AI action charging
- 14-day Growth trial lifecycle
- Production deployment
