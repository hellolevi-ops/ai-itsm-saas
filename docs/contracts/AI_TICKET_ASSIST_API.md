# AI Ticket Assist API

M2 introduces controlled AI-assisted ticket suggestions. This contract is intentionally provider-neutral and uses the AI Gateway even when the active provider is a deterministic mock.

## Principles

- Suggestions only: M2 must not autonomously update ticket fields, assign users, send messages, close tickets or call external tools.
- Workspace isolation: every AI run is scoped by `workspace_id` and `ticket_id`.
- Auditability: every run records provider, model, prompt version, structured output, confidence, latency and usage placeholders.
- Structured output: callers receive a validated object, not free-form model text.
- Safe fallback: low-confidence output remains a draft for humans.

## Endpoint

`POST /api/v1/workspaces/:workspaceId/tickets/:ticketId/ai-suggestions`

Roles:

- `OWNER`, `ADMIN`, `AGENT`: can generate suggestions for any workspace ticket.
- `REQUESTER`: can generate suggestions only for their own ticket.

Response:

```json
{
  "data": {
    "ai_run": {
      "id": "uuid",
      "action": "TICKET_TRIAGE",
      "provider": "mock",
      "model": "rules-v1",
      "prompt_version": "ticket-triage-v1",
      "status": "SUCCEEDED",
      "confidence": 0.82,
      "latency_ms": 4,
      "risk_level": "LOW",
      "created_at": "2026-07-15T00:00:00.000Z"
    },
    "suggestion": {
      "summary": "Requester cannot connect to VPN from Windows laptops.",
      "category": "network",
      "priority": "P2",
      "reply_draft": "Thanks for the details. Please share the VPN client version, error message, and whether other networks work.",
      "confidence": 0.82,
      "risk_level": "LOW",
      "reasons": [
        "Matched VPN/network terms",
        "Requester is blocked from completing work"
      ],
      "requires_human_review": true
    }
  },
  "request_id": "uuid"
}
```

## Current Provider

M2 starts with a deterministic `mock` provider. It is not a production model and does not make network calls. This lets the product validate contracts, permissions, audit storage and UX before paid or regulated model usage.

## Acceptance

- Cross-workspace access is denied.
- Requesters cannot generate suggestions for another requester's ticket.
- Every generation creates exactly one `ai_runs` record.
- The ticket itself is unchanged by suggestion generation.
- Low-confidence and medium-risk outputs are explicitly marked for human review.
