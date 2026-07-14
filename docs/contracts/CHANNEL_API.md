# Channel API Contract

M5 scope is the first China channel adapter: WeCom mock inbound webhook. It proves the adapter boundary, token verification, idempotent inbound intake, ticket creation and audit linkage without using paid external resources or production secrets.

Out of scope for M5: real WeCom callback cryptography, live enterprise app setup, outbound replies, file/media messages, DingTalk/Feishu/WeChat Official Account, production release and paid channel services.

## Data Model

### ChannelConnection

- `id`
- `workspace_id`
- `type`: `WECOM`
- `name`
- `token_hash`
- `status`: `ACTIVE` or `INACTIVE`
- `created_by_id`
- `created_at`
- `updated_at`

The API never returns `token_hash`.

### ChannelInboundMessage

- `id`
- `workspace_id`
- `connection_id`
- `ticket_id`
- `external_message_id`
- `external_user_id`
- `external_user_name`
- `subject`
- `body`
- `payload`
- `status`: `RECEIVED`, `TICKET_CREATED`, `DUPLICATE`, `REJECTED`
- `received_at`

`connection_id + external_message_id` is unique for idempotency.

### Ticket addition

`TicketSource` now includes `WECOM`.

## Endpoints

### `GET /api/v1/workspaces/:workspaceId/channels`

Lists channel connections for workspace members.

### `POST /api/v1/workspaces/:workspaceId/channels/wecom`

Creates an active WeCom mock connection. Staff only: `OWNER`, `ADMIN`, `AGENT`.

Request:

```json
{
  "name": "WeCom support",
  "token": "mock-wecom-token"
}
```

Response omits the token and token hash.

### `POST /api/v1/channels/wecom/:connectionId/messages`

Public mock inbound webhook. It validates `X-Channel-Token` against the stored token hash, resolves the connection workspace, creates or reuses a channel requester user, records the inbound message and creates a `WECOM` ticket through the ticket domain service.

Request headers:

```text
X-Channel-Token: mock-wecom-token
```

Request body:

```json
{
  "external_message_id": "msg-001",
  "external_user_id": "wecom-user-001",
  "external_user_name": "Zhang San",
  "subject": "Payroll VPN access failed",
  "text": "I cannot access the payroll system from the corporate VPN."
}
```

Response:

```json
{
  "data": {
    "duplicate": false,
    "inbound_message": {},
    "ticket": {}
  },
  "request_id": "uuid"
}
```

Duplicate `external_message_id` returns `duplicate: true` and the existing ticket when available.

## Security Rules

- Management APIs require JWT and workspace membership.
- Channel creation is staff-only.
- Webhook does not trust a client-provided workspace id; workspace is derived from `connectionId`.
- Webhook token verification fails closed.
- Token hash is stored server-side; the API response never returns it.
- Raw inbound payload is stored for audit.

## Deferred Hardening

- Real WeCom URL verification and AES callback encryption.
- Retry/replay queue for `RECEIVED` messages if ticket creation fails after inbound audit creation.
- Outbound reply sync and delivery receipts.
- Channel user mapping management UI.
