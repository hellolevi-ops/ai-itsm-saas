import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketDetail } from './TicketDetail';
import type { Ticket, TicketEvent, TicketMessage } from '@/types/api';

const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      refresh: mockRefresh,
    };
  },
}));

vi.mock('@/lib/api', () => ({
  ticketApi: {
    addMessage: vi.fn(),
    changeStatus: vi.fn(),
    generateSuggestions: vi.fn(),
  },
  extractApiError: () => 'Request failed',
}));

import { ticketApi } from '@/lib/api';

const ticket: Ticket = {
  id: 'ticket-1',
  workspace_id: 'ws-1',
  number: 'TCK-000001',
  title: 'Payroll access issue',
  description: 'Unable to access payroll portal.',
  source: 'WEB',
  status: 'NEW',
  priority: 'P3',
  category: 'access',
  requester_id: 'user-1',
  assignee_id: null,
  created_at: '2026-07-14T00:00:00.000Z',
  updated_at: '2026-07-14T01:00:00.000Z',
  resolved_at: null,
  closed_at: null,
  reopen_count: 0,
};

const messages: TicketMessage[] = [
  {
    id: 'message-1',
    ticket_id: 'ticket-1',
    author_id: 'user-1',
    visibility: 'PUBLIC',
    body: 'Please help.',
    created_at: '2026-07-14T00:05:00.000Z',
  },
];

const events: TicketEvent[] = [
  {
    id: 'event-1',
    type: 'CREATED',
    actor_id: 'user-1',
    from_value: null,
    to_value: 'NEW',
    created_at: '2026-07-14T00:00:00.000Z',
  },
];

describe('TicketDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ticket conversation and timeline', () => {
    render(
      <TicketDetail workspaceId="ws-1" ticket={ticket} messages={messages} events={events} />,
    );

    expect(screen.getByText('Payroll access issue')).toBeInTheDocument();
    expect(screen.getByText('Please help.')).toBeInTheDocument();
    expect(screen.getByText('CREATED')).toBeInTheDocument();
  });

  it('adds a message and refreshes the route', async () => {
    const user = userEvent.setup();
    const mockAddMessage = ticketApi.addMessage as Mock;
    mockAddMessage.mockResolvedValue({
      data: { message: messages[0] },
      request_id: 'req-1',
    });

    render(
      <TicketDetail workspaceId="ws-1" ticket={ticket} messages={messages} events={events} />,
    );

    await user.type(screen.getByPlaceholderText(/Write a reply/), 'I am checking this now.');
    await user.click(screen.getByRole('button', { name: /Add message/ }));

    await waitFor(() => {
      expect(mockAddMessage).toHaveBeenCalledWith('ws-1', 'ticket-1', {
        visibility: 'PUBLIC',
        body: 'I am checking this now.',
      });
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('changes status and refreshes the route', async () => {
    const user = userEvent.setup();
    const mockChangeStatus = ticketApi.changeStatus as Mock;
    mockChangeStatus.mockResolvedValue({
      data: { ticket: { ...ticket, status: 'IN_PROGRESS' } },
      request_id: 'req-1',
    });

    render(
      <TicketDetail workspaceId="ws-1" ticket={ticket} messages={messages} events={events} />,
    );

    await user.click(screen.getByRole('button', { name: /Start work/ }));

    await waitFor(() => {
      expect(mockChangeStatus).toHaveBeenCalledWith('ws-1', 'ticket-1', {
        status: 'IN_PROGRESS',
      });
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('generates AI suggestions without changing ticket fields', async () => {
    const user = userEvent.setup();
    const mockGenerateSuggestions = ticketApi.generateSuggestions as Mock;
    mockGenerateSuggestions.mockResolvedValue({
      data: {
        ai_run: {
          id: 'run-1',
          action: 'TICKET_TRIAGE',
          provider: 'mock',
          model: 'rules-v1',
          prompt_version: 'ticket-triage-v1',
          status: 'SUCCEEDED',
          confidence: 0.82,
          latency_ms: 3,
          risk_level: 'LOW',
          created_at: '2026-07-15T00:00:00.000Z',
        },
        suggestion: {
          summary: 'Unable to access payroll portal.',
          category: 'access',
          priority: 'P2',
          reply_draft: 'Please confirm the affected application.',
          confidence: 0.82,
          risk_level: 'LOW',
          reasons: ['Matched access request pattern'],
          requires_human_review: true,
        },
      },
      request_id: 'req-1',
    });

    render(
      <TicketDetail workspaceId="ws-1" ticket={ticket} messages={messages} events={events} />,
    );

    await user.click(screen.getByRole('button', { name: /Generate suggestion/ }));

    await waitFor(() => {
      expect(mockGenerateSuggestions).toHaveBeenCalledWith('ws-1', 'ticket-1');
    });
    expect(screen.getByText('Please confirm the affected application.')).toBeInTheDocument();
    expect(screen.getByText('P2')).toBeInTheDocument();
    expect(screen.getByText(/Human review required/)).toBeInTheDocument();
  });
});
