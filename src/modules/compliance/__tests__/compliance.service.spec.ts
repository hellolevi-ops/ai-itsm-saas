import { NotFoundException } from '@nestjs/common';
import { ComplianceService } from '../compliance.service';

describe('ComplianceService', () => {
  let service: ComplianceService;

  beforeEach(() => {
    service = new ComplianceService();
  });

  it('returns the public M9 compliance package as draft-only material', () => {
    const result = service.listPublicPackage();

    expect(result.data.status).toBe('DRAFT_FOR_PROFESSIONAL_REVIEW');
    expect(result.data.professional_review_required).toBe(true);
    expect(result.data.legal_final_judgment).toBe(false);
    expect(result.data.production_effective).toBe(false);
    expect(result.data.documents).toHaveLength(12);
    expect(result.data.documents.every((document) => document.review_required)).toBe(true);
    expect(
      result.data.documents.every((document) => document.effective_status === 'NOT_EFFECTIVE'),
    ).toBe(true);
  });

  it('returns document metadata by slug', () => {
    const result = service.getDocument('privacy-policy');

    expect(result.data.document.title).toBe('Privacy Policy Draft');
    expect(result.data.document.repository_path).toBe('docs/compliance/PRIVACY_POLICY_DRAFT.md');
    expect(result.data.professional_review_required).toBe(true);
  });

  it('fails closed for unknown document slugs', () => {
    expect(() => service.getDocument('missing')).toThrow(NotFoundException);
  });
});
