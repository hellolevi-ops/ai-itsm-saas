# Beta Guide

## Purpose

Validate whether a small IT/service team can move from request intake to resolution, AI-assisted triage, knowledge reuse and team collaboration in one workspace.

## Environment

- Use a pre-release test environment.
- Do not connect production customer data.
- Do not treat compliance drafts as legally effective.
- Do not activate real payment providers.

## Recommended Flow

1. Create the seed workspace.
2. Invite one agent and one requester.
3. Create or import a small service catalog.
4. Submit a ticket through web form.
5. Generate an AI suggestion and review it manually.
6. Resolve the ticket and publish a knowledge article.
7. Create a mock WeCom channel and submit an inbound test message.
8. Record feedback, bugs and interview notes in `/beta`.

## Feature Flags

- `beta_ticket_ai_suggestions`
- `beta_wecom_channel_mock`
- `beta_billing_manual_orders`
- `beta_feedback_intake`

Owner/admin users may change flags from `/beta`.

## Hard Stops

- Production release requires explicit human approval.
- Paid external resources require explicit human approval.
- Legal final judgment requires qualified professional review.
