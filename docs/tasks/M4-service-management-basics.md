# M4 - Service Management Basics

Status: ACCEPTED_LOCALLY

## Goal

Deliver a minimal service management loop that lets staff define catalog items and request templates, then lets requesters submit tickets from those templates with SLA target timestamps visible in the ticket detail.

## Implemented

- Prisma models and migration for `service_catalog_items`, `request_templates` and `workspace_working_hours`.
- Ticket fields for `service_catalog_item_id`, `request_template_id`, `response_due_at` and `resolution_due_at`.
- Backend service catalog module with workspace-scoped repository, service and controller.
- Staff-only management for service catalog item and request template creation.
- Member-safe listing of active catalog items/templates.
- Ticket creation from same-workspace active request templates.
- Default working-hours Lite and deterministic response/resolution due date calculation.
- Web `/service-catalog` page for creating service items and request templates.
- Web ticket submit form template selector with title, description, priority and category prefill.
- Web ticket detail service target panel.
- MSW support and Playwright E2E coverage from catalog creation to templated ticket submission.

## Acceptance Evidence

- Root typecheck: PASS
- Root lint: PASS
- Root Jest: PASS, 114/114
- Root build: PASS
- Web typecheck: PASS
- Web lint: PASS
- Web Vitest: PASS, 69/69
- Web build: PASS
- Web Playwright E2E: PASS, 1/1

## Explicitly Deferred

- BPMN/workflow engine
- CMDB
- Full ITIL process modeling
- Low-code dynamic form builder
- SLA pause/resume and escalation reminders
- Batch operations, attachments and automation Lite
- Production deployment
