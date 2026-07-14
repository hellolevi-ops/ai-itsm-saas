# Billing API Contract

M7 scope is a verifiable commercial-control loop: plan catalog, workspace entitlements, manual payment orders and server-side quota enforcement. It does not connect real payment providers or issue invoices.

Out of scope for M7: real WeChat Pay/Alipay/payment gateways, payment callbacks, automatic renewal, refunds, reconciliation, real invoicing, tax/legal final judgment, coupons, reseller channels, production release and paid external services.

## Plan Catalog

Plans are configured server-side:

| Plan | Monthly | Agents | Tickets/month | AI actions/month | Channels |
|---|---:|---:|---:|---:|---:|
| Free | CNY 0 | 3 | 100 | 100 | 1 |
| Team | CNY 299 | 5 | 1,000 | 1,500 | 2 |
| Growth | CNY 899 | 15 | 5,000 | 8,000 | 4 |
| Business | CNY 2,499 | 30 | 20,000 | 30,000 | 8 |

The PRD/MVP documents still contain a naming difference around `Pro` versus `Team/Growth/Business`; M7 follows the business-plan pricing table and schema enum while keeping naming confirmation as a product follow-up.

## Data Model

### WorkspaceSubscription

- `id`
- `workspace_id`
- `plan_code`: `FREE`, `TEAM`, `GROWTH`, `BUSINESS`
- `billing_cycle`: `MONTHLY` or `YEARLY`
- `status`: `ACTIVE`, `CANCELED` or `EXPIRED`
- `started_at`
- `current_period_start`
- `current_period_end`
- `canceled_at`
- `created_by_id`
- `created_at`
- `updated_at`

### PaymentOrder

- `id`
- `workspace_id`
- `subscription_id`
- `plan_code`
- `billing_cycle`
- `amount_cents`
- `currency`: `CNY`
- `status`: `PENDING`, `ACTIVATED` or `CANCELED`
- `requested_by_id`
- `activated_by_id`
- `activated_at`
- `created_at`
- `updated_at`

## Endpoints

### `GET /api/v1/workspaces/:workspaceId/billing`

Returns plans, current subscription, current plan, entitlements, usage and recent orders.

Workspace members can read the current entitlement state. Order history is returned to owners/admins.

### `POST /api/v1/workspaces/:workspaceId/billing/orders`

Creates a pending manual payment order. Requires `OWNER` or `ADMIN`.

Request:

```json
{
  "plan_code": "TEAM",
  "billing_cycle": "MONTHLY"
}
```

`FREE` is rejected because it does not require an order.

### `POST /api/v1/workspaces/:workspaceId/billing/orders/:orderId/activate`

Activates a pending manual order. Requires `OWNER` or `ADMIN`.

Activation cancels existing active subscriptions, creates a new active subscription for the order plan and links the order to that subscription.

## Entitlement Enforcement

The backend `BillingService` is the entitlement authority.

M7 enforces monthly ticket quota before ticket creation from both web and channel paths:

- `TicketService.create`
- `TicketService.createFromChannel`

Free workspaces are limited to 100 tickets/month. Paid plan activation immediately raises the limit according to the selected plan.

## Deferred Hardening

- Immutable usage ledger with idempotency keys and reversal entries.
- AI action quota charging after successful provider calls.
- 14-day Growth trial lifecycle.
- Existing subscription downgrade behavior and over-limit grace rules.
- Real payment provider integration.
- Real invoice/tax workflow.
- Unified error response filter with stable `PLAN_LIMIT_REACHED` error code.
