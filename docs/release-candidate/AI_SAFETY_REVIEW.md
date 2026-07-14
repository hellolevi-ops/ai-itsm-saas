# AI Safety Review

## Current AI Boundary

- All implemented AI assistance goes through the AI module and mock provider.
- AI output is a suggestion only.
- AI does not send replies, assign users, close tickets, delete data, change permissions, charge money or run bulk updates.
- AI run audit records provider, model, prompt version, confidence, risk level and latency.

## Current Evidence

- `src/modules/ai/**`
- `docs/contracts/AI_TICKET_ASSIST_API.md`
- Playwright E2E verifies human-review messaging.

## Production Hold

Real model provider use requires:

- explicit provider approval
- production secret handling
- data processing review
- prompt-injection evaluation
- cross-tenant retrieval tests
- cost and token budget monitoring

No real model key is required or used for this RC preparation package.
