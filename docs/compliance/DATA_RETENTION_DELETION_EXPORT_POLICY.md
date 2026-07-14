# Data Retention, Deletion and Export Policy

Status: DRAFT_FOR_PROFESSIONAL_REVIEW

## Retention Classes

| Data Class | Draft Retention | Reason | Review Required |
|---|---|---|---|
| Account and workspace records | Account/workspace lifetime plus reviewed legal period | Authentication and tenant operations | Yes |
| Tickets and messages | Workspace lifetime plus reviewed legal period | Service history and audit | Yes |
| Knowledge articles | Until archived or workspace deletion | Self-service operations | Yes |
| AI run audit | Limited operational audit period | Traceability and safety | Yes |
| Billing orders | Reviewed accounting/tax period | Commercial recordkeeping | Yes |
| Security logs | Reviewed security retention period | Incident investigation | Yes |

## Export

M9 records the process requirement only. Automated export is not yet implemented. Manual export requests must be authenticated, workspace-scoped and logged before production.

## Deletion

Deletion must distinguish account cancellation, workspace deletion, ticket redaction and legal hold. Production deletion is deferred until requirements are reviewed.

## Exceptions

Retention may be extended for security incidents, disputes, legal obligations or abuse investigation after professional review.
