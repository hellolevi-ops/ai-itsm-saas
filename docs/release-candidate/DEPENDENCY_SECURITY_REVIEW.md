# Dependency Security Review

## Current Status

- Root dependency audit reports no vulnerabilities.
- Web dependency audit has a known moderate advisory in Next's transitive PostCSS dependency path.
- `npm audit fix --force` proposes a destructive downgrade to Next 9.3.3 and must not be applied automatically.

## RC Decision

The advisory remains tracked as `P1-SEC-002`. It blocks production readiness until a framework-safe upgrade or upstream remediation path is confirmed.

## Required Before Production

1. Re-run root and web `npm audit --audit-level=moderate`.
2. Review Next release notes and available patched versions.
3. Avoid forced downgrades that break the app or security posture.
4. Record final dependency decision in `docs/status/KNOWN_ISSUES.md`.
