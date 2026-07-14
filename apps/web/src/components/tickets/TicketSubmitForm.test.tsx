import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketSubmitForm } from './TicketSubmitForm';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
      refresh: vi.fn(),
    };
  },
}));

vi.mock('@/lib/api', () => ({
  ticketApi: {
    create: vi.fn(),
  },
  extractApiError: () => 'Request failed',
}));

import { ticketApi } from '@/lib/api';

describe('TicketSubmitForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a ticket and redirects to its detail page', async () => {
    const user = userEvent.setup();
    const mockCreate = ticketApi.create as Mock;
    mockCreate.mockResolvedValue({
      data: {
        ticket: {
          id: 'ticket-1',
        },
      },
      request_id: 'req-1',
    });

    render(<TicketSubmitForm workspaceId="ws-1" />);

    await user.type(screen.getByLabelText(/Title/), 'VPN is down');
    await user.type(screen.getByLabelText(/Description/), 'Remote users cannot connect.');
    await user.selectOptions(screen.getByLabelText(/Priority/), 'P2');
    await user.type(screen.getByLabelText(/Category/), 'network');
    await user.click(screen.getByRole('button', { name: /Submit ticket/ }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith('ws-1', {
        title: 'VPN is down',
        description: 'Remote users cannot connect.',
        priority: 'P2',
        category: 'network',
        request_template_id: undefined,
      });
    });
    expect(mockPush).toHaveBeenCalledWith('/workspaces/ws-1/tickets/ticket-1');
  });

  it('prefills and submits a selected request template', async () => {
    const user = userEvent.setup();
    const mockCreate = ticketApi.create as Mock;
    mockCreate.mockResolvedValue({
      data: {
        ticket: {
          id: 'ticket-1',
        },
      },
      request_id: 'req-1',
    });

    render(
      <TicketSubmitForm
        workspaceId="ws-1"
        requestTemplates={[
          {
            id: 'tpl-1',
            workspace_id: 'ws-1',
            service_catalog_item_id: 'svc-1',
            name: 'Reset payroll access',
            description: null,
            default_title: 'Payroll access reset',
            default_description: 'Please include affected user and error message.',
            default_priority: 'P2',
            default_category: 'access',
            status: 'ACTIVE',
            service_catalog_item: {
              id: 'svc-1',
              workspace_id: 'ws-1',
              name: 'Account access',
              description: 'Access requests',
              category: 'access',
              default_priority: 'P3',
              response_target_minutes: 60,
              resolution_target_minutes: 480,
              status: 'ACTIVE',
              created_at: '2026-07-15T00:00:00.000Z',
              updated_at: '2026-07-15T00:00:00.000Z',
            },
            created_at: '2026-07-15T00:00:00.000Z',
            updated_at: '2026-07-15T00:00:00.000Z',
          },
        ]}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/Request template/), 'tpl-1');
    expect(screen.getByLabelText(/Title/)).toHaveValue('Payroll access reset');
    expect(screen.getByLabelText(/Description/)).toHaveValue(
      'Please include affected user and error message.',
    );
    await user.click(screen.getByRole('button', { name: /Submit ticket/ }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        'ws-1',
        expect.objectContaining({
          request_template_id: 'tpl-1',
          priority: 'P2',
          category: 'access',
        }),
      );
    });
  });

  it('shows validation feedback for missing title and description', async () => {
    const user = userEvent.setup();

    render(<TicketSubmitForm workspaceId="ws-1" />);

    await user.click(screen.getByRole('button', { name: /Submit ticket/ }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(await screen.findByText('Description is required')).toBeInTheDocument();
  });
});
