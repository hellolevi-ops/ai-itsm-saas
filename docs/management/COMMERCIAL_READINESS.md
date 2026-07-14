# Commercial Readiness

Only `VERIFIED` counts as technically complete.

| Dimension | Status | Completion Criteria | Evidence | Risk | Blocking |
|---|---|---|---|---|---|
| Core ITSM | PARTIAL | Minimal ticket loop plus service catalog Lite verified. | M1 ticket loop and M4 service catalog/request template/SLA target E2E pass. | Attachments, batch actions, automations and advanced SLA lifecycle pending. | Yes |
| AI assistance | PARTIAL | AI Gateway and safe suggestions verified. | M2 AI Gateway, mock provider, audited suggestions and E2E pass. | Real provider, evaluation set and advanced citation pending. | Yes |
| Knowledge self-service | PARTIAL | Tenant-filtered knowledge and RAG verified. | M3 knowledge article, draft, publish, requester-safe list/search and E2E pass. | Semantic retrieval, bulk import and citation quality pending. | Yes |
| PLG activation | PARTIAL | Signup to first value path verified. | Register/login/create workspace, invite teammate, accept invite, service template, WeCom mock inbound, ticket submit, AI suggestion and knowledge draft path verified by E2E. | Invite email delivery and analytics pending. | Yes |
| China channel | PARTIAL | First China channel mock path verified. | M5 WeCom mock inbound creates WECOM tickets with token verification and idempotent audit. | Real WeCom callback cryptography, outbound replies and production channel setup pending. | Yes |
| Team expansion | PARTIAL | Invite and role flow verified. | M6 workspace invitation creation and public acceptance flow pass unit tests and E2E. | Member management UI, invite revocation and existing-user acceptance pending. | Yes |
| Entitlements | PARTIAL | Plan, quota and usage rules verified. | M7 plan catalog, billing overview and monthly ticket quota enforcement pass unit tests and E2E. | Immutable usage ledger, AI action charging and trial lifecycle pending. | Yes |
| Commercial orders | PARTIAL | Mock/manual order flow verified. | M7 manual payment order creation and activation into workspace subscription pass unit tests and E2E. | Real payment provider, reconciliation, refunds and invoicing pending. | Yes |
| Multi-tenant security | PARTIAL | Negative cross-tenant tests pass. | Workspace guard tests plus ticket/AI/knowledge/service-catalog/channel workspace-scoped service tests pass. | Full controller/integration permission matrix pending. | Yes |
| Authentication and authorization | PARTIAL | Auth and permission tests pass. | Existing auth/workspace tests pass; JWT fallback secret removed. | Broader permission matrix pending. | Yes |
| Data security | PARTIAL | Secret, export, deletion and storage checks pass. | Secret scan found no committed GitHub token; JWT fallback removed. | Export/deletion/storage flows not built. | Yes |
| Observability | PARTIAL | Logs, metrics, traces and health checks verified. | M8 liveness/readiness endpoints, database readiness check and request id headers pass unit tests and E2E. | Structured logs, metrics, traces, dashboards and alerting pending. | Yes |
| Backup and restore | NOT_STARTED | Restore drill verified. | None. | No backup/restore drill. | Yes |
| Performance capacity | NOT_STARTED | Baseline load test recorded. | None. | Capacity unknown. | No |
| CI/CD | NOT_STARTED | Reproducible CI passes. | No workflow found in recovered tree. | CI must be added before release readiness. | Yes |
| Rollback | NOT_STARTED | Rollback path rehearsed. | None. | No rollback evidence; M8 records health checks but no rollback rehearsal. | Yes |
| Compliance materials | NOT_STARTED | Draft materials marked for professional review. | None. | Legal final review external. | No |
| Customer support operations | NOT_STARTED | Support workflow and feedback loop ready. | None. | Not needed before core loop. | No |
| Beta evidence | NOT_STARTED | Beta usage and feedback recorded. | None. | Requires product first. | Yes |
