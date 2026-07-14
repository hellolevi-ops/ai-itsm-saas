# M8 - Security, Reliability and Operations

Status: ACCEPTED_LOCALLY

## Goal

Deliver the first executable operations hardening layer: health probes, request correlation and default security headers that can be verified locally and reused by later CI/staging/production work.

## Implemented

- Backend `src/modules/ops/**` module.
- Public `GET /api/v1/health/live` liveness endpoint.
- Public `GET /api/v1/health/ready` readiness endpoint with Prisma database check.
- Global `RequestIdMiddleware` that preserves or generates `X-Request-Id`.
- Global `SecurityHeadersMiddleware` that adds baseline browser security headers.
- MSW health handlers for local browser verification.
- Playwright coverage for live/ready probes before the main product path.

## Acceptance Evidence

- Targeted ops/middleware tests: PASS, 6/6
- Root typecheck: PASS
- Root lint: PASS
- Root Jest: PASS, 141/141
- Root build: PASS
- Web typecheck: PASS
- Web lint: PASS
- Web Vitest: PASS, 69/69
- Web build: PASS
- Web Playwright E2E: PASS, 1/1 after health probe coverage
- Temporary PostgreSQL migration validation: PASS, 8 migrations through M8
- Secret scan: PASS, no committed GitHub/OpenAI token found

## Explicitly Deferred

- Paid or production monitoring providers
- Production alerting
- Rate limiting
- Structured log shipping
- Backup/restore drill
- CI/CD workflow
- Rollback rehearsal
- Production deployment
