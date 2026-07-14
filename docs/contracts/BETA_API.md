# Beta Readiness API

M10 exposes a pre-release beta package and workspace-scoped beta controls. These APIs do not start production release, do not recruit real customers automatically, and do not require paid external resources.

## Public Package

`GET /api/v1/beta/public`

Returns:

- `package_version`
- `status = INTERNAL_BETA_READY`
- `environment = pre_release_test`
- `production_release = false`
- seed workspace recommendation
- invitation/whitelist guidance
- beta documents
- beta exit criteria

## Workspace Readiness

`GET /api/v1/workspaces/:workspaceId/beta`

Auth: workspace member.

Returns the public package plus:

- `workspace_id`
- `feature_flags`
- recent `feedback`
- `feedback_summary`

## Create Feedback

`POST /api/v1/workspaces/:workspaceId/beta/feedback`

Auth: workspace member.

Body:

```json
{
  "type": "BUG",
  "severity": "HIGH",
  "title": "Invite copy is unclear",
  "description": "The design partner could not tell whether the invite link was reusable."
}
```

`type`: `FEEDBACK`, `BUG`, `INTERVIEW_NOTE`

`severity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

Creates a persistent `BetaFeedback` record scoped to the workspace and reporter.

## Update Feature Flag

`POST /api/v1/workspaces/:workspaceId/beta/feature-flags/:key`

Auth: workspace owner or admin.

Body:

```json
{
  "enabled": true
}
```

Allowed keys:

- `beta_ticket_ai_suggestions`
- `beta_wecom_channel_mock`
- `beta_billing_manual_orders`
- `beta_feedback_intake`

Unknown flags fail closed.

## Safety Boundaries

- No production deployment is triggered.
- No real payment provider is connected.
- Real design partner recruitment, interviews and payment validation remain manual business work.
- Compliance/legal materials remain draft-only until professional review.
