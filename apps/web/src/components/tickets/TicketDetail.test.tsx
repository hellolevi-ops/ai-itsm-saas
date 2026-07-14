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
  knowledgeApi: {
    publish: vi.fn(),
  },
  ticketApi: {
    addMessage: vi.fn(),
    changeStatus: vi.fn(),
    generateSuggestions: vi.fn(),
    createKnowledgeDraft: vi.fn(),
  },
  extractApiError: () => 'Request failed',
}));

import { knowledgeApi, ticketApi } from '@/lib/api';

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
  service_catalog_item_id: null,
  request_template_id: null,
  response_due_at: null,
  resolution_due_at: null,
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

  it('creates a knowledge draft from the ticket', async () => {
    const user = userEvent.setup();
    const mockCreateKnowledgeDraft = ticketApi.createKnowledgeDraft as Mock;
    const resolvedTicket = { ...ticket, status: 'RESOLVED' as const };
    mockCreateKnowledgeDraft.mockResolvedValue({
      data: {
        article: {
          id: 'article-1',
          workspace_id: 'ws-1',
          source_ticket_id: 'ticket-1',
          source_type: 'TICKET',
          title: 'How to resolve: Payroll access issue',
          problem: 'Unable to access payroll portal.',
          resolution: 'Reset access and confirm the requester can sign in.',
          verification: 'Confirm the requester can complete the affected workflow.',
          rollback: 'Reopen the source ticket if needed.',
          status: 'DRAFT',
          visibility: 'INTERNAL',
          created_by_id: 'agent-1',
          published_by_id: null,
          published_at: null,
          created_at: '2026-07-15T00:00:00.000Z',
          updated_at: '2026-07-15T00:00:00.000Z',
        },
      },
      request_id: 'req-1',
    });

    render(
      <TicketDetail
        workspaceId="ws-1"
        ticket={resolvedTicket}
        messages={messages}
        events={events}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Create draft/ }));

    await waitFor(() => {
      expect(mockCreateKnowledgeDraft).toHaveBeenCalledWith('ws-1', 'ticket-1');
    });
    expect(screen.getByText('How to resolve: Payroll access issue')).toBeInTheDocument();
    expect(screen.getByText('Reset access and confirm the requester can sign in.')).toBeInTheDocument();
  });

  it('publishes a generated knowledge draft', async () => {
    const user = userEvent.setup();
    const mockCreateKnowledgeDraft = ticketApi.createKnowledgeDraft as Mock;
    const mockPublish = knowledgeApi.publish as Mock;
    const resolvedTicket = { ...ticket, status: 'RESOLVED' as const };
    const article = {
      id: 'article-1',
      workspace_id: 'ws-1',
      source_ticket_id: 'ticket-1',
      source_type: 'TICKET',
      title: 'How to resolve: Payroll access issue',
      problem: 'Unable to access payroll portal.',
      resolution: 'Reset access and confirm the requester can sign in.',
      verification: 'Confirm the requester can complete the affected workflow.',
      rollback: 'Reopen the source ticket if needed.',
      status: 'DRAFT',
      visibility: 'INTERNAL',
      created_by_id: 'agent-1',
      published_by_id: null,
      published_at: null,
      created_at: '2026-07-15T00:00:00.000Z',
      updated_at: '2026-07-15T00:00:00.000Z',
    };
    mockCreateKnowledgeDraft.mockResolvedValue({
      data: { article },
      request_id: 'req-1',
    });
    mockPublish.mockResolvedValue({
      data: {
        article: {
          ...article,
          status: 'PUBLISHED',
          visibility: 'REQUESTER',
          published_by_id: 'agent-1',
          published_at: '2026-07-15T00:05:00.000Z',
        },
      },
      request_id: 'req-2',
    });

    render(
      <TicketDetail
        workspaceId="ws-1"
        ticket={resolvedTicket}
        messages={messages}
        events={events}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Create draft/ }));
    await user.click(await screen.findByRole('button', { name: /Publish/ }));

    await waitFor(() => {
      expect(mockPublish).toHaveBeenCalledWith('ws-1', 'article-1');
    });
    expect(screen.getByTestId('knowledge-draft-status')).toHaveTextContent('PUBLISHED / REQUESTER');
  });
});
