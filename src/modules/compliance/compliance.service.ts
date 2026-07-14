import { Injectable, NotFoundException } from '@nestjs/common';
import { complianceDocuments } from './compliance.documents';

@Injectable()
export class ComplianceService {
  listPublicPackage() {
    return {
      data: {
        package_version: 'm9-draft-2026-07-15',
        jurisdiction: 'CN',
        status: 'DRAFT_FOR_PROFESSIONAL_REVIEW',
        professional_review_required: true,
        legal_final_judgment: false,
        production_effective: false,
        last_updated_at: '2026-07-15T03:45:00.000+08:00',
        documents: complianceDocuments,
      },
    };
  }

  getDocument(slug: string) {
    const document = complianceDocuments.find((candidate) => candidate.slug === slug);
    if (!document) {
      throw new NotFoundException({
        code: 'COMPLIANCE_DOCUMENT_NOT_FOUND',
        message: 'Compliance document not found',
        details: { slug },
      });
    }

    return {
      data: {
        document,
        professional_review_required: true,
        legal_final_judgment: false,
        production_effective: false,
      },
    };
  }
}
