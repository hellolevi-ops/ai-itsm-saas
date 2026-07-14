# Data Reset Runbook

This runbook applies only to pre-release test data.

## Allowed Scope

- Local development databases
- Temporary PostgreSQL validation clusters
- Explicitly labeled beta test workspaces

## Not Allowed

- Production customer data
- Irreversible production migrations
- Real payment records
- Compliance/legal records that are required for audit retention

## Reset Steps

1. Confirm the target is not production.
2. Export or snapshot the test database if the test owner wants reproducibility.
3. Record the reset reason.
4. Delete test workspace data through a controlled script or database reset command.
5. Recreate the seed workspace.
6. Re-run smoke tests.
7. Record reset completion and any anomalies.

## Evidence

Each reset should record:

- operator
- timestamp
- target environment
- reset reason
- validation result

Production reset or destructive migration requires explicit human approval.
