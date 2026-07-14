# AI ITSM SaaS Repository Instructions

## Mission

Build an AI-native, multi-tenant ITSM SaaS for the China market using a Product-Led Growth model. Prefer pragmatic, standardized and maintainable solutions suitable for a small independent studio.

## Source of truth

Before substantial work, read relevant product, architecture, contract, status, task, management, schema, migration and test files. Repository files and Git history are the source of truth; chat history is not.

The current workspace was created during Codex takeover on 2026-07-14. If application code or Git metadata is absent, treat that as a takeover blocker and recover the authoritative repository before feature work.

## Orchestration

For substantial work:

1. Inspect repository state.
2. Create a dependency-aware plan.
3. Delegate independent work to specialized subagents.
4. Wait for all delegated work.
5. Consolidate results in the parent thread.
6. Integrate changes.
7. Run all applicable quality gates.
8. Repair failures within scope.
9. Update project status.
10. Return one consolidated report.

The user must not copy messages between agents.

Use no more than three concurrent write agents. Parallel write work requires isolated worktrees/branches or strictly non-overlapping files. Otherwise serialize writes.

## Architecture

Preserve the actual existing stack, package manager and repository layout unless an ADR proves a migration is necessary.

Maintain a modular monolith during MVP.

Do not introduce microservices, Kubernetes, service mesh, full CMDB, full ITIL, complex low-code workflow, AIOps correlation, multiple channels simultaneously, enterprise private-deployment framework or complex finance infrastructure during MVP.

Shared API contracts must have one authority. Controllers must not own database logic. AI providers go through an AI Gateway. External channels use adapters.

## Multi-tenancy

Cross-tenant exposure is release-blocking. All reads, writes, lists, updates, deletes, exports, caches, jobs, files, vectors and AI retrieval must enforce tenant isolation.

Never trust a client-provided tenant or workspace ID without authenticated membership and authorization.

Every tenant-owned feature requires negative cross-tenant tests.

## Authentication and authorization

Authentication and authorization fail closed. Guard ordering must not create implicit access. Protected routes must explicitly prove authentication and permission.

## AI safety

All model calls use the AI Gateway. Version prompts and output schemas. Validate structured output. Low-confidence output falls back to humans. AI must not autonomously execute deletion, permission, payment, bulk-update or other high-risk actions. Record model, prompt version, latency, tokens and cost. Prevent prompt injection and cross-tenant retrieval.

## Quality gates

Run applicable type checking, lint, unit tests, integration tests, E2E, frontend build, backend build, migration validation, tenant-isolation tests and security review.

Do not weaken or delete important assertions merely to make tests pass.

## Git

`develop` is integration; `main` is production. Do not force push, rewrite published history, automatically merge to main, deploy production, commit secrets or overwrite unrelated user changes.

## Autonomy

Proceed on routine implementation decisions. Ask only for major product changes, paid services, production secrets, destructive migrations, final legal judgments or production release approval.

## Commercial release

Passing tests does not equal commercial readiness. Release requires core ITSM, controlled AI, PLG activation, commercial entitlements, security, operations, backup, performance, compliance preparation, beta evidence and human approval.
