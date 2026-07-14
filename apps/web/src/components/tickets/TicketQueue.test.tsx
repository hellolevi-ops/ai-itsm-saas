import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TicketQueue } from './TicketQueue';
import type { Ticket } from '@/types/api';

const ticket: Ticket = {
  id: 'ticket-1',
  workspace_id: 'ws-1',
  number: 'TCK-000001',
  title: 'Laptop will not boot',
  description: 'Device is stuck on startup.',
  source: 'WEB',
  status: 'TRIAGE',
  priority: 'P2',
  category: 'device',
  requester_id: 'user-1',
  assignee_id: null,
  created_at: '2026-07-14T00:00:00.000Z',
  updated_at: '2026-07-14T01:00:00.000Z',
  resolved_at: null,
  closed_at: null,
  reopen_count: 0,
  service_catalog_item_id: null,
  request_template_id: null,
  response_due_at: null,
  resolution_due_at: null,
};

describe('TicketQueue', () => {
  it('renders empty state when there are no tickets', () => {
    render(<TicketQueue workspaceId="ws-1" tickets={[]} />);

    expect(screen.getByText('No tickets yet')).toBeInTheDocument();
  });

  it('renders ticket rows with detail links', () => {
    render(<TicketQueue workspaceId="ws-1" tickets={[ticket]} />);

    expect(screen.getByText('TCK-000001')).toBeInTheDocument();
    expect(screen.getByText('Triage')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Laptop will not boot' })).toHaveAttribute(
      'href',
      '/workspaces/ws-1/tickets/ticket-1',
    );
  });
});
