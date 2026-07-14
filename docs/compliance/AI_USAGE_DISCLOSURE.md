# AI Usage Disclosure

Status: DRAFT_FOR_PROFESSIONAL_REVIEW

## Current AI Behavior

The current implementation uses a deterministic mock provider for ticket suggestions. It does not call a real model provider and does not transfer production data to an external model service.

## User-Facing Boundaries

- AI suggestions are draft-only.
- Human review is required before operational action.
- AI does not autonomously assign tickets, close tickets, send replies, change permissions, delete data or create payment actions.
- AI run metadata is recorded for audit.

## Future Provider Review

Before connecting a real model provider, review data categories, retention, training usage, region, subprocessors, security controls, model output labeling, fallback behavior and customer notification.

## Disclaimer Draft

AI-generated suggestions may be incomplete or inaccurate. Users must verify outputs against their actual IT environment and policies before use.
