export const BETA_PACKAGE_VERSION = 'm10-beta-readiness-2026-07-15';

export const BETA_FEATURE_FLAGS = [
  {
    key: 'beta_ticket_ai_suggestions',
    description: 'Enable mock AI ticket suggestions for beta workspaces.',
    default_enabled: true,
  },
  {
    key: 'beta_wecom_channel_mock',
    description: 'Enable the WeCom mock inbound channel for beta channel validation.',
    default_enabled: true,
  },
  {
    key: 'beta_billing_manual_orders',
    description: 'Enable manual order and activation flow for beta payment validation.',
    default_enabled: false,
  },
  {
    key: 'beta_feedback_intake',
    description: 'Enable workspace beta feedback and bug intake.',
    default_enabled: true,
  },
] as const;

export const BETA_DOCUMENTS = [
  {
    slug: 'beta-guide',
    title: 'Beta Guide',
    repository_path: 'docs/beta/BETA_GUIDE.md',
    summary: 'Workspace setup, invitation, feature scope and safe-use expectations.',
  },
  {
    slug: 'release-notes-draft',
    title: 'Release Notes Draft',
    repository_path: 'docs/beta/RELEASE_NOTES_DRAFT.md',
    summary: 'M0-M10 capabilities, known limits and non-production caveats.',
  },
  {
    slug: 'support-process',
    title: 'Customer Support Process',
    repository_path: 'docs/beta/SUPPORT_PROCESS.md',
    summary: 'Support intake, severity, response ownership and escalation path.',
  },
  {
    slug: 'interview-outline',
    title: 'Design Partner Interview Outline',
    repository_path: 'docs/beta/INTERVIEW_OUTLINE.md',
    summary: 'Interview questions for workflow fit, value, risk and willingness to pay.',
  },
  {
    slug: 'exit-criteria',
    title: 'Beta Exit Criteria',
    repository_path: 'docs/beta/EXIT_CRITERIA.md',
    summary: 'Objective gates before release-candidate work can begin.',
  },
  {
    slug: 'data-reset-runbook',
    title: 'Data Reset Runbook',
    repository_path: 'docs/beta/DATA_RESET_RUNBOOK.md',
    summary: 'Controlled reset steps for test data only; production release remains blocked.',
  },
] as const;

export function betaPublicPackage() {
  return {
    package_version: BETA_PACKAGE_VERSION,
    status: 'INTERNAL_BETA_READY' as const,
    environment: 'pre_release_test' as const,
    production_release: false as const,
    paid_external_resources_required: false as const,
    external_customer_recruiting_required: true as const,
    last_updated_at: '2026-07-15T06:50:00.000+08:00',
    seed_workspace: {
      recommended_name: 'Acme Ops Beta',
      recommended_slug: 'acme-ops-beta',
      default_timezone: 'Asia/Shanghai',
      recommended_roles: ['OWNER', 'ADMIN', 'AGENT', 'REQUESTER'],
    },
    invitation_controls: {
      mode: 'workspace_invitation_link',
      whitelist_required_for_real_design_partners: true,
      existing_endpoint: '/api/v1/workspaces/:workspaceId/invitations',
    },
    documents: BETA_DOCUMENTS,
    exit_criteria: [
      'At least 3 design partner workspaces complete ticket intake, AI suggestion review, knowledge publish and channel intake tests.',
      'All HIGH or CRITICAL beta bugs are triaged with owner, workaround and target milestone.',
      'Manual payment validation is documented without activating production billing automation.',
      'Legal/compliance drafts are professionally reviewed before any production release.',
      'Release candidate verification passes backend, web, E2E and PostgreSQL migration checks.',
    ],
  };
}
