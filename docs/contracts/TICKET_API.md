# Ticket API Contract

Status: M1 draft frozen for implementation.

Base path: `/api/v1`

M1 goal: deliver the smallest tenant-safe ticket loop after signup and workspace creation:

`create request -> create ticket -> view queue -> assign -> reply/internal note -> move status -> requester sees reply -> close -> audit history`

## Scope

Included:

- Web-submitted tickets.
- Workspace-scoped ticket list and detail.
- Ticket number, title, description, source, requester, assignee, category, priority and status.
- Public replies and internal notes.
- Assignment to workspace members with `OWNER`, `ADMIN` or `AGENT` role.
- Status transitions for the M1 lifecycle.
- Immutable audit timeline for create, update, assignment, message and status events.
- Tenant/workspace isolation and negative cross-tenant tests.

Excluded from M1:

- AI suggestions.
- Knowledge base.
- Full SLA engine.
- Email, Feishu or other channel ingestion.
- Attachments.
- Merge/split tickets.
- Custom fields.
- Billing or quota enforcement.

## Data Model

### Ticket

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Required tenant isolation boundary |
| `number` | string | Human ticket number, unique per workspace |
| `title` | string | 1-120 chars |
| `description` | string | Required, original request text |
| `source` | enum | M1: `WEB` |
| `status` | enum | See status machine |
| `priority` | enum | `P1`, `P2`, `P3`, `P4`; default `P3` |
| `category` | string/null | Lightweight text category for M1 |
| `requester_id` | UUID | User who submitted the ticket |
| `assignee_id` | UUID/null | Workspace member user id |
| `created_by_id` | UUID | Actor who created the ticket |
| `updated_by_id` | UUID/null | Last modifying actor |
| `created_at` | timestamp | Server generated |
| `updated_at` | timestamp | Server generated |
| `resolved_at` | timestamp/null | Set on `RESOLVED` |
| `closed_at` | timestamp/null | Set on `CLOSED` |

### TicketMessage

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Required tenant isolation boundary |
| `ticket_id` | UUID | Parent ticket |
| `author_id` | UUID | Workspace user |
| `visibility` | enum | `PUBLIC`, `INTERNAL` |
| `body` | string | 1-10000 chars |
| `created_at` | timestamp | Server generated |

### TicketEvent

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Required tenant isolation boundary |
| `ticket_id` | UUID | Parent ticket |
| `actor_id` | UUID/null | Null only for system-created future events |
| `type` | enum | `CREATED`, `UPDATED`, `ASSIGNED`, `MESSAGE_ADDED`, `STATUS_CHANGED`, `CLOSED`, `REOPENED` |
| `from_value` | string/null | Previous value for status/assignee/field |
| `to_value` | string/null | New value for status/assignee/field |
| `metadata` | json | Non-sensitive structured details |
| `created_at` | timestamp | Server generated |

## Status Machine

| Status | Meaning | Allowed Next Status |
|---|---|---|
| `NEW` | Created but not triaged | `TRIAGE`, `IN_PROGRESS`, `CLOSED` |
| `TRIAGE` | Needs classification or assignment | `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `IN_PROGRESS` | Being handled by service team | `RESOLVED`, `CLOSED` |
| `RESOLVED` | Service team marked solved | `CLOSED`, `REOPENED` |
| `CLOSED` | Final closed state | `REOPENED` |
| `REOPENED` | Reopened after resolution/closure | `IN_PROGRESS`, `RESOLVED`, `CLOSED` |

Invalid transitions return `409 INVALID_STATUS_TRANSITION`.

`WAITING_REQUESTER` and other SLA-pausing states are deferred until M4, because their product value depends on SLA pause/resume semantics.

## Permissions

Role meanings follow `RoleType` in Prisma.

| Action | OWNER | ADMIN | AGENT | REQUESTER |
|---|---:|---:|---:|---:|
| Create own ticket | yes | yes | yes | yes |
| List all workspace tickets | yes | yes | yes | no |
| List own tickets | yes | yes | yes | yes |
| View any ticket | yes | yes | yes | no |
| View own ticket | yes | yes | yes | yes |
| Assign ticket | yes | yes | yes | no |
| Update category/priority/title/description | yes | yes | yes | own ticket only before assignment |
| Add public reply | yes | yes | yes | yes, own ticket only |
| Add internal note | yes | yes | yes | no |
| Change status | yes | yes | yes | own ticket only for reopen/close |
| Delete ticket | no | no | no | no |

All actions must verify authenticated workspace membership. Client-provided workspace IDs are never trusted without membership and role checks.

## Endpoints

### Create Ticket

`POST /api/v1/workspaces/{workspace_id}/tickets`

Body:

```json
{
  "title": "Cannot access VPN",
  "description": "I cannot connect after password reset.",
  "priority": "P3",
  "category": "account"
}
```

Response `201`:

```json
{
  "data": {
    "ticket": {
      "id": "uuid",
      "number": "TCK-000001",
      "title": "Cannot access VPN",
      "description": "I cannot connect after password reset.",
      "source": "WEB",
      "status": "NEW",
      "priority": "P3",
      "category": "account",
      "requester_id": "uuid",
      "assignee_id": null,
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  },
  "request_id": "string"
}
```

### List Tickets

`GET /api/v1/workspaces/{workspace_id}/tickets?status=NEW&assignee_id=uuid&mine=false&q=vpn&page=1&page_size=20`

Requester role receives only own tickets even when `mine=false`.

### Get Ticket Detail

`GET /api/v1/workspaces/{workspace_id}/tickets/{ticket_id}`

Includes ticket, messages visible to the current user, and event timeline.

### Update Ticket Fields

`PATCH /api/v1/workspaces/{workspace_id}/tickets/{ticket_id}`

Body:

```json
{
  "title": "Cannot access VPN",
  "description": "Updated details",
  "priority": "P2",
  "category": "network"
}
```

### Assign Ticket

`POST /api/v1/workspaces/{workspace_id}/tickets/{ticket_id}/assign`

Body:

```json
{
  "assignee_id": "uuid"
}
```

The assignee must be a member of the same workspace and have `OWNER`, `ADMIN` or `AGENT` role.

### Add Message

`POST /api/v1/workspaces/{workspace_id}/tickets/{ticket_id}/messages`

Body:

```json
{
  "visibility": "PUBLIC",
  "body": "We reset the VPN profile. Please retry."
}
```

Requester cannot create `INTERNAL` messages.

### Change Status

`POST /api/v1/workspaces/{workspace_id}/tickets/{ticket_id}/status`

Body:

```json
{
  "status": "RESOLVED",
  "reason": "VPN profile was reset."
}
```

### Close Ticket

`POST /api/v1/workspaces/{workspace_id}/tickets/{ticket_id}/close`

Shortcut for status `CLOSED`.

### Reopen Ticket

`POST /api/v1/workspaces/{workspace_id}/tickets/{ticket_id}/reopen`

Shortcut for status `REOPENED`.

## Error Codes

| Code | HTTP | Scenario |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Invalid body or query |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Not a member or insufficient role |
| `TICKET_NOT_FOUND` | 404 | Ticket missing in current workspace |
| `ASSIGNEE_NOT_FOUND` | 404 | Assignee is not an eligible same-workspace member |
| `INVALID_STATUS_TRANSITION` | 409 | Status move is not allowed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Acceptance Tests

Backend:

- Requester can create and view own ticket.
- Agent/admin/owner can list and view workspace tickets.
- Requester cannot list or view another user's ticket.
- Non-member cannot read, update, assign, message or close ticket.
- Cross-workspace and cross-tenant ticket IDs return not found/forbidden without leaking existence.
- Invalid status transitions fail with `409`.
- Internal notes are hidden from requesters.
- Assignee must belong to the same workspace and have an eligible role.
- Ticket events are written for create, update, assignment, message and status changes.
- Empty database can be rebuilt from migrations.

Frontend:

- Requester can submit a web ticket and see confirmation.
- Agent can scan queue, open detail, assign, reply, add internal note and close.
- Requester can see public reply but not internal note.
- Empty, loading, error and forbidden states are visible.

Security:

- Every ticket table includes `workspace_id`.
- All repositories require workspace filters.
- Tests include negative cross-tenant and non-member cases.
