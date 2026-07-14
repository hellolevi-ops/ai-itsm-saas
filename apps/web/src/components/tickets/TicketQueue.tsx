'use client';

import Link from 'next/link';
import type { Ticket } from '@/types/api';

interface TicketQueueProps {
  workspaceId: string;
  tickets: Ticket[];
}

const statusLabel: Record<Ticket['status'], string> = {
  NEW: 'New',
  TRIAGE: 'Triage',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
};

export function TicketQueue({ workspaceId, tickets }: TicketQueueProps) {
  if (tickets.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-sm font-medium text-gray-900">No tickets yet</p>
        <p className="mt-1 text-sm text-gray-500">New web requests will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Number</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{ticket.number}</td>
              <td className="px-4 py-3">
                <Link
                  className="font-medium text-blue-700 hover:text-blue-900"
                  href={`/workspaces/${workspaceId}/tickets/${ticket.id}`}
                >
                  {ticket.title}
                </Link>
                {ticket.category && (
                  <div className="mt-1 text-xs text-gray-500">{ticket.category}</div>
                )}
              </td>
              <td className="px-4 py-3">{statusLabel[ticket.status]}</td>
              <td className="px-4 py-3">{ticket.priority}</td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(ticket.updated_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
