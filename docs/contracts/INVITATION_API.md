# Invitation API Contract

M6 scope is the PLG team-spread loop: a workspace owner or admin can create a one-time invitation, share the generated link, and the invited teammate can join the same workspace with an agent or requester role.

Out of scope for M6: real email delivery, paid messaging providers, invite revocation UI, SSO/SCIM, production onboarding analytics, legal terms acceptance and production release.

## Data Model

### WorkspaceInvitation

- `id`
- `workspace_id`
- `email`
- `role_type`: `AGENT` or `REQUESTER`
- `token_hash`
- `status`: `PENDING`, `ACCEPTED`, `REVOKED` or `EXPIRED`
- `invited_by_id`
- `accepted_by_id`
- `expires_at`
- `accepted_at`
- `created_at`
- `updated_at`

The API never returns `token_hash`.

## Endpoints

### `GET /api/v1/workspaces/:workspaceId/invitations`

Lists invitations for a workspace. Requires JWT, workspace membership and `OWNER` or `ADMIN` role.

### `POST /api/v1/workspaces/:workspaceId/invitations`

Creates a pending invitation. Requires JWT, workspace membership and `OWNER` or `ADMIN` role.

Request:

```json
{
  "email": "teammate@example.com",
  "role_type": "AGENT"
}
```

Response:

```json
{
  "data": {
    "invitation": {},
    "token": "one-time-token"
  },
  "request_id": "uuid"
}
```

`role_type` defaults to `REQUESTER`. Only `AGENT` and `REQUESTER` can be invited.

### `POST /api/v1/invitations/accept`

Public invitation acceptance endpoint. It validates the one-time token, optional email binding and expiration, then creates the user in the invited workspace tenant and adds the workspace membership.

Request:

```json
{
  "token": "one-time-token",
  "email": "teammate@example.com",
  "password": "Password123",
  "name": "Team Mate"
}
```

Response:

```json
{
  "data": {
    "user": {},
    "token": {
      "access_token": "jwt",
      "refresh_token": "jwt",
      "expires_in": 3600
    },
    "workspace": {},
    "invitation": {}
  },
  "request_id": "uuid"
}
```

## Security Rules

- Invitation management requires JWT and workspace membership.
- Only workspace `OWNER` and `ADMIN` can create/list invitations.
- Invitation acceptance does not trust a client-provided workspace id; workspace and tenant are derived from the token.
- Invitation tokens are stored as SHA-256 hashes.
- Invitation responses never include `token_hash`.
- Email-bound invitations can only be accepted by the bound email.
- Expired invitations are marked `EXPIRED` before rejection.
- Invite creation cannot grant `OWNER` or `ADMIN`.

## Deferred Hardening

- Real email delivery and invite resend flow.
- Invite revoke endpoint and UI.
- Existing-user invite acceptance for cross-workspace membership.
- Admin-facing member list and role-change UI.
- Onboarding analytics such as invite created/accepted events.
