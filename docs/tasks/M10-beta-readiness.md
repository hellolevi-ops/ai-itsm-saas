# M10 - Beta Readiness

Status: ACCEPTED_LOCALLY

## Scope

Prepare an internal/pre-release beta package that can be exercised by a workspace without production release.

Included:

- pre-release beta package metadata
- seed workspace recommendation
- invitation and whitelist guidance
- workspace feature flags
- feedback and bug report intake
- release notes draft
- beta guide
- support process
- interview outline
- beta exit criteria
- test-data reset runbook
- web beta readiness console

Excluded:

- production deployment
- real design partner recruiting
- paid external services
- real payment provider integration
- final legal judgment
- irreversible data migration

## Implementation

- Prisma models:
  - `BetaFeedback`
  - `WorkspaceFeatureFlag`
- Migration:
  - `20260715065000_add_beta_readiness`
- Backend:
  - `src/modules/beta/**`
  - `GET /api/v1/beta/public`
  - `GET /api/v1/workspaces/:workspaceId/beta`
  - `POST /api/v1/workspaces/:workspaceId/beta/feedback`
  - `POST /api/v1/workspaces/:workspaceId/beta/feature-flags/:key`
- Web:
  - `/beta`
  - beta API client and MSW handlers
  - Playwright coverage for beta console, flag toggle and feedback creation

## Acceptance Criteria

- Workspace members can view beta readiness state.
- Workspace members can submit feedback, bug reports and interview notes.
- Only owner/admin users can update beta feature flags.
- The beta package explicitly says `production_release = false`.
- The beta console exposes release notes, beta guide, support process and exit criteria.
- Automated validation passes locally.

## Result

Accepted locally after implementation and validation. PR review and CI remain required before merge.
