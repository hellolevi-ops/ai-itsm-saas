'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ticketApi, extractApiError } from '@/lib/api';
import { useCurrentWorkspace } from '@/lib/workspace-store';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TicketQueue } from '@/components/tickets/TicketQueue';
import type { Ticket, Workspace } from '@/types/api';

export default function TicketsPage() {
  const workspace: Workspace | null = useCurrentWorkspace();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace) return;

    ticketApi
      .list(workspace.id)
      .then((response) => setTickets(response.data.tickets))
      .catch((err) => setError(extractApiError(err)))
  }, [workspace]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Ticket queue</h1>
            <p className="mt-1 text-sm text-gray-500">Track and resolve workspace requests.</p>
          </div>
          <Link href="/tickets/new">
            <Button type="button">New ticket</Button>
          </Link>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {!workspace && (
          <div className="border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Create or select a workspace to view tickets.
          </div>
        )}
        {workspace && tickets === null && (
          <div className="border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Loading tickets...
          </div>
        )}
        {workspace && tickets !== null && (
          <TicketQueue workspaceId={workspace.id} tickets={tickets} />
        )}
      </div>
    </main>
  );
}
