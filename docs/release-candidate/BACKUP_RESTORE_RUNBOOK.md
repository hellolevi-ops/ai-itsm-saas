# Backup and Restore Runbook

This runbook is for non-production rehearsal until production resources are approved.

## Backup

1. Confirm the target database is not production unless production approval exists.
2. Record database URL host, database name and timestamp.
3. Run `pg_dump` to an encrypted or access-controlled location.
4. Record checksum and file size.
5. Store retention metadata.

## Restore Rehearsal

1. Create an empty throwaway PostgreSQL database.
2. Restore the dump with `pg_restore` or `psql`, depending on dump format.
3. Run `npm exec prisma -- migrate status`.
4. Run smoke checks against health, auth and ticket list flows.
5. Destroy the throwaway database.

## Production Hold

Production backup storage, retention, encryption keys and destructive restore drills require explicit infrastructure and release approval.
