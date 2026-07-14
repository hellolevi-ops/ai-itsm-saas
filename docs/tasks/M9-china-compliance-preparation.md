# M9 - China Compliance Preparation

Status: ACCEPTED_LOCALLY

## Goal

Prepare China-market compliance drafts and product-visible engineering mechanisms for professional review without claiming final legal compliance or performing production release.

## Implemented

- Compliance API contract: `docs/contracts/COMPLIANCE_API.md`.
- Compliance draft package under `docs/compliance/**`.
- Public backend module `src/modules/compliance/**`.
- Public endpoints:
  - `GET /api/v1/compliance/public`
  - `GET /api/v1/compliance/documents/:slug`
- Web `/legal` compliance center.
- MSW handler for the compliance package.
- Playwright E2E coverage for the compliance center.

## Draft Materials

- User agreement draft
- Privacy policy draft
- Personal information collection list
- Third-party service list
- Data retention, deletion and export policy
- AI usage disclosure
- Model provider data review matrix
- Data processing agreement draft
- Security incident and complaint process
- SLA statement draft
- ICP, public security and MLPS applicability checklist
- Generative AI and content labeling checklist

## Explicit Boundaries

- No final legal judgment.
- No production release.
- No real ICP, public security filing or MLPS submission.
- No paid external legal, model, monitoring, filing or security resource.
- No real customer data processing change.

## Acceptance Evidence

- Backend compliance service tests cover draft-only package, document lookup and unknown slug failure: PASS, 3/3.
- API response marks all materials as review-required and not effective.
- Web `/legal` renders compliance package status and required materials.
- E2E verifies the compliance center after the existing product path.
- Root typecheck: PASS
- Root lint: PASS
- Root Jest: PASS, 144/144
- Root build: PASS
- Web typecheck: PASS
- Web lint: PASS
- Web Vitest: PASS, 69/69
- Web build: PASS
- Web Playwright E2E: PASS, 1/1
- Prisma schema validate: PASS
- Temporary PostgreSQL migration validation: PASS, 8 migrations through M9
- Secret scan: PASS, no committed GitHub/OpenAI token found

## Deferred

- Professional legal review.
- ICP and public security filing decisions.
- MLPS applicability decision and assessment.
- Production customer-facing legal copy approval.
- Customer data export/deletion automation.
