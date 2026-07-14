# Regression Matrix

## Backend

| Area | Command/Evidence | Status |
|---|---|---|
| Prisma client | `npm run prisma:generate` | REQUIRED |
| Prisma schema | `npm exec prisma -- validate` | REQUIRED |
| TypeScript | `npm run typecheck` | REQUIRED |
| Lint | `npm run lint:check` | REQUIRED |
| Unit/integration tests | `npm test -- --runInBand` | REQUIRED |
| Production build | `npm run build` | REQUIRED |
| Migrations | `npm exec prisma -- migrate deploy` against empty PostgreSQL | REQUIRED |
| RC artifacts | `npm run rc:check` | REQUIRED |

## Web

| Area | Command/Evidence | Status |
|---|---|---|
| TypeScript | `npm run typecheck` in `apps/web` | REQUIRED |
| Lint | `npm run lint` in `apps/web` | REQUIRED |
| Unit tests | `npm test` in `apps/web` | REQUIRED |
| Production build | `npm run build` in `apps/web` | REQUIRED |
| E2E | `npm run test:e2e` in `apps/web` | REQUIRED |

## Main Flow Coverage

The Playwright path must cover:

- health live/ready probes
- registration
- workspace creation
- billing overview and manual order activation
- beta readiness, feature flag toggle and feedback intake
- invitation creation and acceptance
- mock WeCom channel and inbound ticket
- service catalog item and request template
- ticket creation, detail, queue and status progress
- AI suggestion
- knowledge draft, publish and search
- compliance center
- release candidate center

## Release Rule

All required checks must pass before the RC can be considered locally accepted. Passing checks does not authorize production release.
