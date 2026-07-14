'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ticketApi, extractApiError } from '@/lib/api';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import type { Ticket, TicketEvent, TicketMessage, TicketStatus } from '@/types/api';

interface TicketDetailProps {
  workspaceId: string;
  ticket: Ticket;
  messages: TicketMessage[];
  events: TicketEvent[];
}

export function TicketDetail({ workspaceId, ticket, messages, events }: TicketDetailProps) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'INTERNAL'>('PUBLIC');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const addMessage = async () => {
    if (!body.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await ticketApi.addMessage(workspaceId, ticket.id, {
        visibility,
        body,
      });
      setBody('');
      router.refresh();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeStatus = async (status: TicketStatus) => {
    setError(null);
    setIsChangingStatus(true);
    try {
      await ticketApi.changeStatus(workspaceId, ticket.id, { status });
      router.refresh();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-4">
        {error && <Alert type="error" message={error} />}
        <div className="border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-gray-500">{ticket.number}</p>
              <h1 className="mt-1 text-xl font-semibold text-gray-900">{ticket.title}</h1>
            </div>
            <span className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700">
              {ticket.status}
            </span>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">{ticket.description}</p>
        </div>

        <div className="border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Conversation</h2>
          <div className="mt-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500">No replies yet.</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{message.visibility === 'INTERNAL' ? 'Internal note' : 'Public reply'}</span>
                    <span>{new Date(message.created_at).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{message.body}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 space-y-3">
            <textarea
              rows={4}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write a reply or internal note"
            />
            <div className="flex items-center justify-between gap-3">
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as 'PUBLIC' | 'INTERNAL')}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="PUBLIC">Public reply</option>
                <option value="INTERNAL">Internal note</option>
              </select>
              <Button type="button" onClick={addMessage} loading={isSubmitting}>
                Add message
              </Button>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Actions</h2>
          <div className="mt-4 grid gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => changeStatus('IN_PROGRESS')}
              disabled={isChangingStatus}
            >
              Start work
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => changeStatus('RESOLVED')}
              disabled={isChangingStatus}
            >
              Resolve
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => changeStatus('CLOSED')}
              disabled={isChangingStatus}
            >
              Close
            </Button>
          </div>
        </div>
        <div className="border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <div key={event.id} className="text-sm">
                <div className="font-medium text-gray-900">{event.type}</div>
                <div className="text-xs text-gray-500">
                  {new Date(event.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
