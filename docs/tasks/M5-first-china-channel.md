# M5 - First China Channel

Status: ACCEPTED_LOCALLY

## Goal

Deliver the first China-market channel adapter with a safe mock WeCom inbound webhook that can create tickets from external messages and preserve channel audit evidence.

## Implemented

- Prisma `TicketSource.WECOM`.
- Prisma `ChannelConnection` and `ChannelInboundMessage` models.
- Migration `20260715033000_add_wecom_channel`.
- Backend `src/modules/channel/**` with management API and public mock webhook.
- Staff-only WeCom channel creation.
- Token-hash based webhook verification.
- Idempotency by `connection_id + external_message_id`.
- Channel requester user/member creation for mock external users.
- Ticket creation through `TicketService.createFromChannel`, preserving ticket-domain numbering and event creation.
- Web `/channels` page to create a WeCom mock connection and simulate inbound messages.
- MSW channel handlers and Playwright coverage.

## Acceptance Evidence

- Root typecheck: PASS
- Root lint: PASS
- Root Jest: PASS, 120/120
- Root build: PASS
- Web typecheck: PASS
- Web lint: PASS
- Web Vitest: PASS, 69/69
- Web build: PASS
- Web Playwright E2E: PASS, 1/1

## Explicitly Deferred

- Real WeCom production integration
- Real channel secrets
- Real WeCom callback encryption
- Outbound replies
- File/media inbound handling
- DingTalk, Feishu and WeChat Official Account
- Production deployment
