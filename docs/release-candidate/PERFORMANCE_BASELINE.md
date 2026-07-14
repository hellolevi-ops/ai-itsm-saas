# Performance Baseline

## Current Local Baseline

The current automated E2E path completes the full mock product flow in a local browser run. This is useful smoke evidence, not a capacity test.

## Initial Capacity Assumption

For the first pre-production target, size the system for:

- 3 to 10 beta workspaces
- 1 to 5 agents per workspace
- 100 to 1,000 tickets per workspace per month
- mock AI suggestions only unless a real provider is approved

## Required Before Production

- API load test for ticket create/list/detail and health readiness.
- Web Lighthouse or equivalent page-performance baseline for main pages.
- Database query inspection for ticket list, knowledge search and billing usage.
- Capacity target documented with CPU, memory, database and connection assumptions.

## Release Boundary

No production capacity claim is made by M11.
