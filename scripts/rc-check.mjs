import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const requiredFiles = [
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
  'docs/contracts/RELEASE_CANDIDATE_API.md',
  '.github/workflows/ci.yml',
];

const requiredText = [
  ['docs/release-candidate/RELEASE_CANDIDATE_REPORT.md', 'production_release: false'],
  ['docs/release-candidate/PRODUCTION_RELEASE_HOLD.md', 'Formal production release approval'],
  ['src/modules/release-candidate/rc.package.ts', 'production_release: false'],
];

let failed = false;

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    console.error(`Missing required RC artifact: ${file}`);
    failed = true;
  }
}

for (const [file, text] of requiredText) {
  const path = join(root, file);
  if (!existsSync(path)) {
    continue;
  }
  const content = readFileSync(path, 'utf8');
  if (!content.includes(text)) {
    console.error(`RC artifact ${file} does not contain required text: ${text}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('RC artifact check passed.');
