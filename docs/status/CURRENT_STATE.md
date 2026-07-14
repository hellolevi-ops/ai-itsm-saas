# Current State

## Basic Information

| Item | Value |
|------|-------|
| Branch | develop |
| Latest Commit | `98f6e2c` |
| Pushed | Yes |
| Database | PostgreSQL 16 |
| Cache | Redis |
| Build Status | ✅ |

## Active Services

| Service | Port | Status |
|---------|------|--------|
| API Server | 3000 | Running |
| Web UI | 3001 | Running |
| PostgreSQL | 5432 | Running |
| Redis | 6379 | Running |

## Migration Status

Latest migration: `20260714113121_init`

## Available Features

- User registration with email/password
- User login with JWT tokens
- User session management with refresh tokens
- Multi-tenant architecture (tenant isolation)
- Workspace creation and management
- Workspace membership and role-based access control
- Protected API endpoints with JWT authentication

## Key Modules

- `src/modules/auth/` - Authentication module
- `src/modules/workspace/` - Workspace and tenant management
- `apps/web/` - Next.js frontend application
- `prisma/` - Database schema and migrations

## Tech Stack

- Backend: NestJS + TypeScript
- Frontend: Next.js 16 + React 19
- Database: PostgreSQL + Prisma ORM
- Authentication: JWT
- Cache: Redis
- Testing: Jest (backend), Vitest (frontend)
- Linting: ESLint + Prettier