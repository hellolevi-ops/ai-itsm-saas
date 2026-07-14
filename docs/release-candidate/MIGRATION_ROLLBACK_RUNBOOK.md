# Migration and Rollback Runbook

## Migration Evidence

Migrations have been validated against an empty temporary PostgreSQL database through `20260715065000_add_beta_readiness`.

## Forward Migration Process

1. Run `npm exec prisma -- validate`.
2. Run `npm exec prisma -- migrate deploy` in a staging-like database.
3. Run `npm exec prisma -- migrate status`.
4. Run API and web smoke checks.

## Rollback Policy

Prisma migrations are treated as forward-only once applied to shared environments. Rollback means:

- application rollback to previous deploy artifact when schema remains compatible
- forward fix migration when schema needs correction
- restore from backup only with explicit approval because it can destroy data

## Production Hold

No irreversible production migration has been executed. Production migration and rollback rehearsal require human approval and production resource readiness.
