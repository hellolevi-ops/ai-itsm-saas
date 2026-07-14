# Compliance API

Status: DRAFT_FOR_REVIEW

All M9 compliance materials are implementation drafts for professional review. This API must not be presented as proof of legal compliance, ICP completion, public security filing, MLPS certification or production release approval.

## GET /api/v1/compliance/public

Public endpoint for the current China-market compliance preparation package.

Response:

```json
{
  "data": {
    "package_version": "m9-draft-2026-07-15",
    "jurisdiction": "CN",
    "status": "DRAFT_FOR_PROFESSIONAL_REVIEW",
    "professional_review_required": true,
    "legal_final_judgment": false,
    "production_effective": false,
    "last_updated_at": "2026-07-15T03:45:00.000+08:00",
    "documents": []
  }
}
```

Every document item includes:

- `slug`
- `title`
- `category`
- `status`
- `owner`
- `review_required`
- `effective_status`
- `repository_path`
- `summary`

## GET /api/v1/compliance/documents/:slug

Returns one document metadata record.

Unknown slugs return `COMPLIANCE_DOCUMENT_NOT_FOUND`.

## Security

- Public read-only metadata only.
- No customer data, workspace data, secrets, model credentials or legal approvals are exposed.
- The API intentionally serves metadata, not legally effective documents.

## Acceptance

- Public package returns 12 required M9 materials.
- All returned documents are marked `review_required: true`.
- All returned documents are marked `effective_status: NOT_EFFECTIVE`.
- Package marks `legal_final_judgment: false` and `production_effective: false`.
