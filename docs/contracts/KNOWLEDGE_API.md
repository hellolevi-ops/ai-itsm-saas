# Knowledge and Self-Service API Contract

Status: M3 frozen for implementation.

## Scope

M3 creates a minimal knowledge loop without paid external model, embedding, vector database or CMS dependencies:

- Staff can create an internal knowledge draft from a resolved or closed ticket.
- Staff can list, read and publish knowledge articles.
- Requesters can list and read only published requester-visible articles.
- All operations are scoped by authenticated workspace membership.

Out of scope for M3:

- Bulk document import.
- External vector database.
- Real embedding provider.
- Autonomous article publication.
- Complex CMS editing workflow.

## Data Model

`KnowledgeArticle`

- `id`
- `workspace_id`
- `source_ticket_id`
- `source_type`: `TICKET | MANUAL`
- `title`
- `problem`
- `resolution`
- `verification`
- `rollback`
- `status`: `DRAFT | PUBLISHED | ARCHIVED`
- `visibility`: `INTERNAL | REQUESTER`
- `created_by_id`
- `published_by_id`
- `published_at`
- timestamps

## Endpoints

### Create Draft From Ticket

`POST /api/v1/workspaces/:workspaceId/tickets/:ticketId/knowledge-drafts`

Allowed roles: `OWNER`, `ADMIN`, `AGENT`.

Rules:

- Source ticket must belong to `workspaceId`.
- Source ticket must be `RESOLVED` or `CLOSED`.
- Existing non-archived draft/article for the same source ticket is returned instead of creating duplicates.
- Draft starts as `DRAFT` and `INTERNAL`.
- Draft generation must not include internal ticket notes in requester-facing output.

Response:

```json
{
  "data": {
    "article": {
      "id": "article-id",
      "workspace_id": "workspace-id",
      "source_ticket_id": "ticket-id",
      "source_type": "TICKET",
      "title": "How to resolve: VPN connection failed",
      "problem": "User cannot connect to VPN.",
      "resolution": "Reset VPN profile.",
      "verification": "Confirm requester can complete the workflow.",
      "rollback": "Reopen the source ticket if needed.",
      "status": "DRAFT",
      "visibility": "INTERNAL",
      "created_by_id": "agent-id",
      "published_by_id": null,
      "published_at": null,
      "created_at": "2026-07-15T00:00:00.000Z",
      "updated_at": "2026-07-15T00:00:00.000Z"
    }
  },
  "request_id": "uuid"
}
```

### List Articles

`GET /api/v1/workspaces/:workspaceId/knowledge?status=&q=&page=&page_size=`

Allowed roles: `OWNER`, `ADMIN`, `AGENT`, `REQUESTER`.

Rules:

- Staff can list drafts and published articles.
- Requesters are forced to `status=PUBLISHED` and `visibility=REQUESTER` regardless of query parameters.
- `q` searches title, problem and resolution.

### Get Article

`GET /api/v1/workspaces/:workspaceId/knowledge/:articleId`

Rules:

- Staff can read workspace-scoped articles.
- Requesters receive 404 for drafts, archived articles and internal-only articles.

### Publish Article

`POST /api/v1/workspaces/:workspaceId/knowledge/:articleId/publish`

Allowed roles: `OWNER`, `ADMIN`, `AGENT`.

Request:

```json
{
  "visibility": "REQUESTER"
}
```

Rules:

- Archived articles cannot be published.
- Publishing sets `status=PUBLISHED`, `published_by_id` and `published_at`.
- Visibility defaults to the article's current visibility when omitted.

## Safety And Audit Notes

- M3 draft generation is deterministic and local.
- No high-risk action is executed automatically.
- Tenant isolation is enforced by workspace membership guards and repository queries containing `workspaceId`.
- Future RAG and AI citation work must go through the AI Gateway and record source article ids.
