# M6 - PLG Activation and Team Spread

Status: ACCEPTED_LOCALLY

## Goal

Deliver the first team-spread loop: an owner/admin can invite a teammate, the teammate can accept the link, join the same workspace and continue the core ITSM workflow.

## Implemented

- Prisma `WorkspaceInvitationStatus` enum.
- Prisma `WorkspaceInvitation` model.
- Migration `20260715043000_add_workspace_invitations`.
- Backend `src/modules/invitation/**` with protected management API and public acceptance API.
- Staff-only invite creation/listing for `OWNER` and `ADMIN`.
- Invite role restriction to `AGENT` and `REQUESTER`.
- Token-hash storage with one-time acceptance semantics.
- Target-tenant user creation and workspace membership assignment during invite acceptance.
- Web `/team` page for invitation creation and link display.
- Web `/invite/accept` page for teammate self-serve registration.
- MSW invitation handlers and Playwright coverage.

## Acceptance Evidence

- Root typecheck: PASS
- Root lint: PASS
- Root Jest: PASS, 127/127
- Root build: PASS
- Web typecheck: PASS
- Web lint: PASS
- Web Vitest: PASS, 69/69
- Web build: PASS
- Web Playwright E2E: PASS, 1/1

## Explicitly Deferred

- Real email delivery
- Invite revocation UI
- Existing-user invitation acceptance
- SSO/SCIM
- Onboarding analytics
- Production deployment
