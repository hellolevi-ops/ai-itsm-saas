'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ticketApi, extractApiError } from '@/lib/api';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TicketQueue } from '@/components/tickets/TicketQueue';
import type { Ticket, Workspace } from '@/types/api';

function readCurrentWorkspace(): Workspace | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('current_workspace');
  return raw ? (JSON.parse(raw) as Workspace) : null;
}

export default function TicketsPage() {
  const [workspace] = useState<Workspace | null>(() => readCurrentWorkspace());
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(workspace));

  useEffect(() => {
    if (!workspace) return;

    ticketApi
      .list(workspace.id)
      .then((response) => setTickets(response.data.tickets))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setIsLoading(false));
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
        {workspace && isLoading && (
          <div className="border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Loading tickets...
          </div>
        )}
        {workspace && !isLoading && <TicketQueue workspaceId={workspace.id} tickets={tickets} />}
      </div>
    </main>
  );
}
