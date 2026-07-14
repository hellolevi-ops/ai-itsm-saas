# M2 - AI-Assisted Tickets

## Scope

Implement the first controlled AI assistance loop for existing tickets:

- AI Gateway boundary.
- Mock provider.
- Prompt version and structured output.
- Ticket summary, category, priority and reply draft suggestions.
- Confidence, risk level and reasons.
- Per-run audit record.
- Safety and tenant-isolation tests.

## Out of Scope

- Real model provider calls.
- Paid model/API resources.
- Knowledge/RAG.
- Automatic ticket updates, assignment, messages or close actions.
- Tool execution.

## Local Acceptance Gates

- Root `npm run lint:check`
- Root `npm run typecheck`
- Root `npm test -- --runInBand`
- Root `npm run build`
- Prisma schema validation and migration validation
- Secret scan

## Status

IN_PROGRESS
