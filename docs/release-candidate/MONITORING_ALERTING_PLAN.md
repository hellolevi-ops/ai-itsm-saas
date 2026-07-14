# Monitoring and Alerting Plan

## Current Local Signals

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `X-Request-Id` propagation
- baseline security response headers

## Required Production Signals

- API error rate
- API latency percentiles
- database readiness and latency
- failed login rate
- ticket creation failures
- channel webhook failures
- AI provider failures and latency
- payment/order workflow anomalies
- background job failures once jobs exist

## Alert Routing

Production alerting requires an approved provider and on-call destination. No paid alerting service is connected in M11.

## Release Boundary

Current monitoring is sufficient for local RC preparation, not production operations.
