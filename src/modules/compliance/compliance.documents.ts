export type ComplianceDocumentStatus = 'DRAFT_FOR_REVIEW' | 'EXTERNAL_REVIEW_REQUIRED';

export type ComplianceDocumentCategory =
  'TERMS' | 'PRIVACY' | 'DATA_RIGHTS' | 'AI' | 'SECURITY' | 'OPERATIONS' | 'FILING';

export type ComplianceDocument = {
  slug: string;
  title: string;
  category: ComplianceDocumentCategory;
  status: ComplianceDocumentStatus;
  owner: string;
  review_required: true;
  effective_status: 'NOT_EFFECTIVE';
  repository_path: string;
  summary: string;
};

export const complianceDocuments: ComplianceDocument[] = [
  {
    slug: 'user-agreement',
    title: 'User Agreement Draft',
    category: 'TERMS',
    status: 'DRAFT_FOR_REVIEW',
    owner: 'product',
    review_required: true,
    effective_status: 'NOT_EFFECTIVE',
    repository_path: 'docs/compliance/USER_AGREEMENT_DRAFT.md',
    summary: 'Draft service terms for account, workspace, acceptable use and termination rules.',
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy Draft',
    category: 'PRIVACY',
    status: 'DRAFT_FOR_REVIEW',
    owner: 'product',
    review_required: true,
    effective_status: 'NOT_EFFECTIVE',
    repository_path: 'docs/compliance/PRIVACY_POLICY_DRAFT.md',
    summary: 'Draft personal information processing notice for China-market SaaS use.',
  },
  {
    slug: 'personal-information-collection-list',
    title: 'Personal Information Collection List',
    category: 'PRIVACY',
    status: 'DRAFT_FOR_REVIEW',
    owner: 'security',
    review_required: true,
    effective_status: 'NOT_EFFECTIVE',
    repository_path: 'docs/compliance/PERSONAL_INFORMATION_COLLECTION_LIST.md',
    summary: 'Field-level personal information inventory mapped to product modules.',
  },
  {
    slug: 'third-party-services',
    title: 'Third-Party Service List',
    category: 'PRIVACY',
    status: 'DRAFT_FOR_REVIEW',
    owner: 'operations',
    review_required: true,
    effective_status: 'NOT_EFFECTIVE',
    repository_path: 'docs/compliance/THIRD_PARTY_SERVICE_LIST.md',
    summary: 'Current and future third-party processors, all marked review-required.',
  },
  {
    slug: 'data-retention-deletion-export',
    title: 'Data Retention, Deletion and Export Policy',
    category: 'DATA_RIGHTS',
    status: 'DRAFT_FOR_REVIEW',
    owner: 'security',
    review_required: true,
    effective_status: 'NOT_EFFECTIVE',
    repository_path: 'docs/compliance/DATA_RETENTION_DELETION_EXPORT_POLICY.md',
    summary: 'Operational draft for retention classes, export requests and deletion workflow.',
  },
  {
    slug: 'ai-usage-disclosure',
    title: 'AI Usage Disclosure',
    category: 'AI',
    status: 'DRAFT_FOR_REVIEW',
    owner: 'ai',
    review_required: true,
    effective_status: 'NOT_EFFECTIVE',
    repository_path: 'docs/compliance/AI_USAGE_DISCLOSURE.md',
    summary: 'Draft disclosure for AI suggestions, human review, audit and limitations.',
  },
  {
    slug: 'model-provider-data-review',
    title: 'Model Provider Data Review Matrix',
    category: 'AI',
    status: 'DRAFT_FOR_REVIEW',
    owner: 'ai',
    review_required: true,
    effective_status: 'NOT_EFFECTIVE',
    repository_path: 'docs/compliance/MODEL_PROVIDER_DATA_REVIEW_MATRIX.md',
    summary: 'Checklist for future model providers before production data transfer.',
  },
  {
    slug: 'data-processing-agreement',
    title: 'Data Processing Agreement Draft',
    category: 'DATA_RIGHTS',
    status: 'DRAFT_FOR_REVIEW',
    owner: 'legal',
    review_required: true,
    effective_status: 'NOT_EFFECTIVE',
    repository_path: 'docs/compliance/DATA_PROCESSING_AGREEMENT_DRAFT.md',
    summary: 'Draft customer-facing data processing terms for professional review.',
  },
  {
    slug: 'security-incident-complaint-process',
    title: 'Security Incident and Complaint Process',
    category: 'SECURITY',
    status: 'DRAFT_FOR_REVIEW',
    owner: 'security',
    review_required: true,
    effective_status: 'NOT_EFFECTIVE',
    repository_path: 'docs/compliance/SECURITY_INCIDENT_AND_COMPLAINT_PROCESS.md',
    summary: 'Intake, triage, response and customer communication workflow draft.',
  },
  {
    slug: 'sla-statement',
    title: 'SLA Statement Draft',
    category: 'OPERATIONS',
    status: 'DRAFT_FOR_REVIEW',
    owner: 'operations',
    review_required: true,
    effective_status: 'NOT_EFFECTIVE',
    repository_path: 'docs/compliance/SLA_STATEMENT_DRAFT.md',
    summary: 'Service availability and support response draft, not yet customer-effective.',
  },
  {
    slug: 'icp-public-security-mlps',
    title: 'ICP, Public Security and MLPS Applicability Checklist',
    category: 'FILING',
    status: 'EXTERNAL_REVIEW_REQUIRED',
    owner: 'operations',
    review_required: true,
    effective_status: 'NOT_EFFECTIVE',
    repository_path: 'docs/compliance/ICP_PUBLIC_SECURITY_MLPS_CHECKLIST.md',
    summary: 'Filing and classification checklist that must be finalized by specialists.',
  },
  {
    slug: 'generative-ai-content-labeling',
    title: 'Generative AI and Content Labeling Checklist',
    category: 'AI',
    status: 'EXTERNAL_REVIEW_REQUIRED',
    owner: 'ai',
    review_required: true,
    effective_status: 'NOT_EFFECTIVE',
    repository_path: 'docs/compliance/GENERATIVE_AI_CONTENT_LABELING_CHECKLIST.md',
    summary: 'Checklist for AI-generated content labeling and China-specific AI review.',
  },
];
