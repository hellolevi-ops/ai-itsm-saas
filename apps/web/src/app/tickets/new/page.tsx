'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TicketSubmitForm } from '@/components/tickets/TicketSubmitForm';
import type { Workspace } from '@/types/api';

function readCurrentWorkspace(): Workspace | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('current_workspace');
  return raw ? (JSON.parse(raw) as Workspace) : null;
}

export default function NewTicketPage() {
  const [workspace] = useState<Workspace | null>(() => readCurrentWorkspace());

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Submit ticket</h1>
            <p className="mt-1 text-sm text-gray-500">Create a tracked service request.</p>
          </div>
          <Link className="text-sm font-medium text-blue-700" href="/tickets">
            Queue
          </Link>
        </div>
        <div className="border border-gray-200 bg-white p-6">
          {workspace ? (
            <TicketSubmitForm workspaceId={workspace.id} />
          ) : (
            <div className="text-sm text-gray-600">
              Create or select a workspace before submitting tickets.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
