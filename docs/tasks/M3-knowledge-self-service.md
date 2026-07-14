# M3 - Knowledge and Self-Service

Status: ACCEPTED_LOCALLY

## User Value

Resolved tickets become reusable knowledge drafts, and requesters can later self-serve from reviewed, published answers.

## Scope

- Add `KnowledgeArticle` data model and migration.
- Add staff-only draft generation from resolved or closed tickets.
- Add article list, detail and publish APIs.
- Add requester visibility rules for published knowledge.
- Add web ticket-detail action to create an internal knowledge draft.
- Extend M1/M2 browser E2E to cover draft creation.

## Non-Scope

- No paid model provider.
- No external vector database.
- No bulk document import.
- No complex CMS workflow.
- No production publication.

## Acceptance Criteria

- Requesters cannot create knowledge drafts.
- Requesters cannot read drafts or internal-only articles.
- Requester list queries are forced to published requester-visible articles.
- Draft generation rejects unresolved tickets.
- Draft generation uses workspace-scoped source tickets.
- Draft generation does not copy internal notes into the draft.
- Migration validates from an empty database.
- Root and web lint, typecheck, tests, build and E2E pass.

## Files

- `docs/contracts/KNOWLEDGE_API.md`
- `prisma/schema.prisma`
- `prisma/migrations/20260715013000_add_knowledge_articles/migration.sql`
- `src/modules/knowledge/**`
- `src/app.module.ts`
- `apps/web/src/components/tickets/TicketDetail.tsx`
- `apps/web/src/lib/api.ts`
- `apps/web/src/types/api.ts`
- `apps/web/src/mocks/handlers.ts`
- `apps/web/e2e/ticket-loop.spec.ts`

## Risks

- Full RAG citation quality is not implemented in this milestone.
- Self-service search is simple database text search, not semantic retrieval.
- Full article management screens remain follow-up work after the backend contract is proven; M3 provides ticket-detail draft/publish and self-service list/search.

## Validation Evidence

- `npm run prisma:generate`: PASS
- `npm exec prisma -- validate`: PASS
- Empty PostgreSQL 18 migration validation through `20260715013000_add_knowledge_articles`: PASS
- `npm run typecheck`: PASS
- `npm run lint:check`: PASS
- `npm test -- --runInBand`: PASS, 104/104
- `npm run build`: PASS
- `cd apps/web; npm run typecheck`: PASS
- `cd apps/web; npm run lint`: PASS
- `cd apps/web; npm test`: PASS, 68/68
- `cd apps/web; npm run build`: PASS
- `cd apps/web; npm run test:e2e`: PASS, 1/1
