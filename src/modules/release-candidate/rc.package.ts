export const RC_PACKAGE_VERSION = 'm11-rc-preparation-2026-07-15';

export const rcRegressionGates = [
  {
    key: 'full_regression',
    title: 'Full regression',
    status: 'PASS_LOCAL',
    evidence: [
      'Root typecheck, lint, Jest and build pass locally.',
      'Web typecheck, lint, Vitest, build and Playwright E2E pass locally.',
    ],
  },
  {
    key: 'permission_tenant_matrix',
    title: 'Permission and tenant matrix',
    status: 'PASS_LOCAL_WITH_REVIEW_GAP',
    evidence: [
      'Workspace guard, ticket, AI, knowledge, service catalog, channel, invitation, billing and beta service tests cover workspace membership or role boundaries.',
      'Broader controller-level permission matrix remains a pre-production hardening item.',
    ],
  },
  {
    key: 'ai_safety',
    title: 'AI safety',
    status: 'PASS_LOCAL_WITH_MOCK_PROVIDER',
    evidence: [
      'AI Gateway uses deterministic mock provider.',
      'Suggestions are draft-only and require human review.',
      'No real model key or production data transfer is configured.',
    ],
  },
  {
    key: 'dependency_security',
    title: 'Dependency security',
    status: 'PASS_WITH_KNOWN_RISK',
    evidence: [
      'Root npm audit is clean after baseline install.',
      'Web audit has a known moderate Next transitive PostCSS advisory; forced fix would downgrade Next and is tracked as P1-SEC-002.',
    ],
  },
  {
    key: 'performance_baseline',
    title: 'Performance baseline',
    status: 'DOCUMENTED_NOT_LOAD_TESTED',
    evidence: [
      'E2E happy path completes in a local browser run.',
      'Dedicated load test and capacity target remain required before production release.',
    ],
  },
  {
    key: 'backup_restore',
    title: 'Backup and restore',
    status: 'RUNBOOK_READY_NOT_PRODUCTION_DRILLED',
    evidence: [
      'RC backup and restore runbook defines pg_dump/pg_restore rehearsal in non-production only.',
      'Production backup storage and destructive restore drill require human-approved infrastructure.',
    ],
  },
  {
    key: 'migration_rollback',
    title: 'Migration and rollback',
    status: 'PASS_LOCAL_WITH_RUNBOOK',
    evidence: [
      'Temporary PostgreSQL 18 empty database migration validation passed through M10.',
      'RC rollback runbook documents app rollback and forward-fix migration policy; no irreversible production migration was executed.',
    ],
  },
  {
    key: 'monitoring_alerting',
    title: 'Monitoring and alerting',
    status: 'PARTIAL_LOCAL',
    evidence: [
      'Liveness/readiness endpoints, request id propagation and baseline security headers are implemented.',
      'Production dashboards and alert routing require human-approved infrastructure.',
    ],
  },
  {
    key: 'billing_commercial',
    title: 'Plans and manual orders',
    status: 'PASS_LOCAL_MANUAL_ONLY',
    evidence: [
      'Plan catalog, quota enforcement, manual order creation and manual activation pass local tests.',
      'Real payment provider, invoices, refunds and tax workflows are not connected.',
    ],
  },
  {
    key: 'compliance',
    title: 'Compliance materials',
    status: 'DRAFT_READY_FOR_PROFESSIONAL_REVIEW',
    evidence: [
      'Compliance center and draft package are present and marked not legally effective.',
      'Final legal judgment, ICP/public-security/MLPS filings and production legal approval remain human/external actions.',
    ],
  },
  {
    key: 'beta_evidence',
    title: 'Beta evidence',
    status: 'TECHNICAL_LOOP_READY_EXTERNAL_EVIDENCE_REQUIRED',
    evidence: [
      'Beta feature flags and feedback intake are implemented.',
      'Real design partner recruiting, interviews and payment validation remain manual business work.',
    ],
  },
] as const;

export const rcHumanActions = [
  'Legal/privacy/security professional review and final judgment.',
  'ICP, public security filing and MLPS applicability handling where required.',
  'Real model, email, payment and production secret provisioning.',
  'Real design partner results and willingness-to-pay evidence.',
  'Production cloud resources, domain, certificate, backup storage and monitoring provider approval.',
  'Formal production release approval.',
] as const;

export function rcReadinessPackage() {
  return {
    package_version: RC_PACKAGE_VERSION,
    status: 'RELEASE_CANDIDATE_PREPARED' as const,
    production_release: false as const,
    merge_to_main_approved: false as const,
    legal_final_judgment: false as const,
    paid_external_resources_required: false as const,
    last_updated_at: '2026-07-15T04:40:00.000+08:00',
    gates: rcRegressionGates,
    human_actions_required: rcHumanActions,
    reports: [
      'docs/release-candidate/RELEASE_CANDIDATE_REPORT.md',
      'docs/release-candidate/REGRESSION_MATRIX.md',
      'docs/release-candidate/PERMISSION_TENANT_MATRIX.md',
      'docs/release-candidate/AI_SAFETY_REVIEW.md',
      'docs/release-candidate/DEPENDENCY_SECURITY_REVIEW.md',
      'docs/release-candidate/PERFORMANCE_BASELINE.md',
      'docs/release-candidate/BACKUP_RESTORE_RUNBOOK.md',
      'docs/release-candidate/MIGRATION_ROLLBACK_RUNBOOK.md',
      'docs/release-candidate/MONITORING_ALERTING_PLAN.md',
      'docs/release-candidate/PRODUCTION_RELEASE_HOLD.md',
    ],
  };
}
