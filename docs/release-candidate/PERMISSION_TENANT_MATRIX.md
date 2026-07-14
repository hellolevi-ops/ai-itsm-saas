# Permission and Tenant Matrix

## Current Evidence

| Area | Boundary | Evidence |
|---|---|---|
| Workspace guard | authenticated member and role validation | `workspace-role.guard.spec.ts` |
| Ticket | requester ownership, staff actions, workspace scoped reads | `ticket.service.spec.ts`, repository tests |
| AI suggestions | member access and requester ownership | `ai-ticket-assist.service.spec.ts` |
| Knowledge | staff draft/publish and requester-safe visibility | `knowledge.service.spec.ts` |
| Service catalog | staff-only writes and same-workspace templates | `service-catalog.service.spec.ts` |
| Channel | staff-only connection management and token-verified webhook | `channel.service.spec.ts` |
| Invitations | owner/admin-only invite creation and safe role limits | `invitation.service.spec.ts` |
| Billing | owner/admin-only commercial writes | `billing.service.spec.ts` |
| Beta | member feedback and owner/admin feature flags | `beta.service.spec.ts` |

## RC Requirement

The current matrix is sufficient for local RC preparation. Before production release, add controller-level tests that exercise HTTP guards for each protected module and include non-member and cross-tenant requests for read and write endpoints.

## Release Blockers

- Any cross-tenant data exposure is P0 and blocks release.
- Any unauthenticated protected write is P0 and blocks release.
- Any owner/admin-only operation available to requester/agent roles is P1 and blocks release.
