'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ticketApi, extractApiError } from '@/lib/api';
import { Alert } from '@/components/ui/Alert';
import { TicketDetail } from '@/components/tickets/TicketDetail';
import type { Ticket, TicketEvent, TicketMessage } from '@/types/api';

export default function TicketDetailPage() {
  const params = useParams<{ workspaceId: string; ticketId: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ticketApi
      .detail(params.workspaceId, params.ticketId)
      .then((response) => {
        setTicket(response.data.ticket);
        setMessages(response.data.messages);
        setEvents(response.data.events);
      })
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setIsLoading(false));
  }, [params.ticketId, params.workspaceId]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Ticket detail</h1>
            <p className="mt-1 text-sm text-gray-500">Reply, update status and review history.</p>
          </div>
          <Link className="text-sm font-medium text-blue-700" href="/tickets">
            Queue
          </Link>
        </div>

        {error && <Alert type="error" message={error} />}
        {isLoading && <div className="border border-gray-200 bg-white p-6">Loading ticket...</div>}
        {!isLoading && ticket && (
          <TicketDetail
            workspaceId={params.workspaceId}
            ticket={ticket}
            messages={messages}
            events={events}
          />
        )}
      </div>
    </main>
  );
}
