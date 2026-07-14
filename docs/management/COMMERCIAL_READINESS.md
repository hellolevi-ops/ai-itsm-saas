# Commercial Readiness

Only `VERIFIED` counts as technically complete.

| Dimension | Status | Completion Criteria | Evidence | Risk | Blocking |
|---|---|---|---|---|---|
| Core ITSM | PARTIAL | Minimal ticket loop plus service catalog Lite verified. | M1 ticket loop and M4 service catalog/request template/SLA target E2E pass. | Attachments, batch actions, automations and advanced SLA lifecycle pending. | Yes |
| AI assistance | PARTIAL | AI Gateway and safe suggestions verified. | M2 AI Gateway, mock provider, audited suggestions and E2E pass. | Real provider, evaluation set and advanced citation pending. | Yes |
| Knowledge self-service | PARTIAL | Tenant-filtered knowledge and RAG verified. | M3 knowledge article, draft, publish, requester-safe list/search and E2E pass. | Semantic retrieval, bulk import and citation quality pending. | Yes |
| PLG activation | PARTIAL | Signup to first value path verified. | Register/login/create workspace, service template, ticket submit, AI suggestion and knowledge draft path verified by E2E. | Invite/member activation loop pending. | Yes |
| Team expansion | NOT_STARTED | Invite and role flow verified. | Membership foundation exists; invitation flow missing. | Team spread incomplete. | Yes |
| Entitlements | NOT_STARTED | Plan, quota and usage rules verified. | None. | Commercial control not implemented. | Yes |
| Commercial orders | NOT_STARTED | Mock/manual order flow verified. | None. | No order domain yet. | Yes |
| Multi-tenant security | PARTIAL | Negative cross-tenant tests pass. | Workspace guard tests plus ticket/AI/knowledge/service-catalog workspace-scoped repository and service tests pass. | Full controller/integration permission matrix pending. | Yes |
| Authentication and authorization | PARTIAL | Auth and permission tests pass. | Existing auth/workspace tests pass; JWT fallback secret removed. | Broader permission matrix pending. | Yes |
| Data security | PARTIAL | Secret, export, deletion and storage checks pass. | Secret scan found no committed GitHub token; JWT fallback removed. | Export/deletion/storage flows not built. | Yes |
| Observability | NOT_STARTED | Logs, metrics, traces and health checks verified. | None. | No operational telemetry baseline. | Yes |
| Backup and restore | NOT_STARTED | Restore drill verified. | None. | No backup/restore drill. | Yes |
| Performance capacity | NOT_STARTED | Baseline load test recorded. | None. | Capacity unknown. | No |
| CI/CD | NOT_STARTED | Reproducible CI passes. | No workflow found in recovered tree. | CI must be added before release readiness. | Yes |
| Rollback | NOT_STARTED | Rollback path rehearsed. | None. | No rollback evidence. | Yes |
| Compliance materials | NOT_STARTED | Draft materials marked for professional review. | None. | Legal final review external. | No |
| Customer support operations | NOT_STARTED | Support workflow and feedback loop ready. | None. | Not needed before core loop. | No |
| Beta evidence | NOT_STARTED | Beta usage and feedback recorded. | None. | Requires product first. | Yes |
