# Service Catalog API Contract

M4 scope is service catalog Lite: service items, request templates and deterministic SLA target timestamps for tickets created from templates.

Out of scope for M4: BPMN/workflow engine, CMDB, full ITIL process modeling, low-code form builder, paid channel integration and production release.

## Data Model

### ServiceCatalogItem

- `id`
- `workspace_id`
- `name`
- `description`
- `category`
- `default_priority`
- `response_target_minutes`
- `resolution_target_minutes`
- `status`
- `created_at`
- `updated_at`

### RequestTemplate

- `id`
- `workspace_id`
- `service_catalog_item_id`
- `name`
- `description`
- `default_title`
- `default_description`
- `default_priority`
- `default_category`
- `status`
- `service_catalog_item`
- `created_at`
- `updated_at`

### Ticket additions

- `service_catalog_item_id`
- `request_template_id`
- `response_due_at`
- `resolution_due_at`

## Endpoints

### `GET /api/v1/workspaces/:workspaceId/service-catalog`

Returns active service catalog items and active request templates for workspace members.

### `POST /api/v1/workspaces/:workspaceId/service-catalog/items`

Creates a service catalog item. Staff only: `OWNER`, `ADMIN`, `AGENT`.

Request:

```json
{
  "name": "Access requests",
  "description": "Access requests for business applications.",
  "category": "access",
  "default_priority": "P3",
  "response_target_minutes": 60,
  "resolution_target_minutes": 480
}
```

### `POST /api/v1/workspaces/:workspaceId/service-catalog/templates`

Creates a request template under an active service catalog item in the same workspace. Staff only: `OWNER`, `ADMIN`, `AGENT`.

Request:

```json
{
  "service_catalog_item_id": "uuid",
  "name": "VPN access request",
  "description": "Template notes",
  "default_title": "VPN access is unavailable",
  "default_description": "Remote users cannot connect to the VPN.",
  "default_priority": "P2",
  "default_category": "network"
}
```

### `POST /api/v1/workspaces/:workspaceId/tickets`

Existing ticket create endpoint now accepts optional `request_template_id`. When supplied, the backend validates that the template is active, same-workspace and attached to an active service item, then applies default priority/category and calculates `response_due_at` and `resolution_due_at`.

Request:

```json
{
  "request_template_id": "uuid",
  "title": "VPN access is unavailable",
  "description": "Remote users cannot connect to the VPN.",
  "priority": "P2",
  "category": "network"
}
```

## Permission Rules

- Any workspace member can list active service catalog items and templates.
- Only staff can create service catalog items or request templates.
- Ticket creation remains available to workspace members.
- Cross-workspace or inactive templates are rejected.

## SLA Rules

- M4 calculates deterministic target timestamps at ticket creation.
- Default working hours are provisioned per workspace when missing: Asia/Shanghai, Monday-Friday, 09:00-18:00.
- Pause/resume and breach escalation are not implemented in M4.
