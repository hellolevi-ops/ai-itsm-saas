# Operations API Contract

M8 scope is the first executable security, reliability and operations hardening layer. It provides health probes, request correlation and browser security headers without connecting production monitoring, backup or deployment systems.

Out of scope for this M8 slice: paid monitoring services, production alerting, production deployment, real backup storage, destructive restore drills, external incident tooling and legal/security certification.

## Endpoints

### `GET /api/v1/health/live`

Public liveness probe. It must not depend on external systems.

Response:

```json
{
  "data": {
    "status": "ok",
    "service": "lingxi-service-desk-api",
    "timestamp": "2026-07-15T03:30:00.000Z",
    "uptime_seconds": 123,
    "started_at": "2026-07-15T03:00:00.000Z"
  }
}
```

### `GET /api/v1/health/ready`

Public readiness probe. It checks dependencies required to serve traffic.

M8 readiness checks:

- PostgreSQL through Prisma `SELECT 1`

Response:

```json
{
  "data": {
    "status": "ok",
    "service": "lingxi-service-desk-api",
    "timestamp": "2026-07-15T03:30:00.000Z",
    "checks": {
      "database": {
        "status": "ok",
        "latency_ms": 3
      }
    }
  }
}
```

If the database check fails, `data.status` and `checks.database.status` return `error` with a failure message.

## Request Correlation

All routes receive a response `X-Request-Id` header.

- If the client sends `X-Request-Id`, the server reuses it.
- Otherwise the server generates `req_<uuid>`.

## Security Headers

All routes receive baseline security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Deferred Hardening

- Structured JSON logging with request id propagation into log lines.
- Metrics endpoint and dashboards.
- Rate limiting for auth and public webhooks.
- Backup and restore scripts plus non-destructive restore verification.
- CI workflow for root and web gates.
- Rollback runbook and rehearsal.
- Production monitoring and alerting.
