'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TicketSubmitForm } from '@/components/tickets/TicketSubmitForm';
import { Alert } from '@/components/ui/Alert';
import { extractApiError, serviceCatalogApi } from '@/lib/api';
import { useCurrentWorkspace } from '@/lib/workspace-store';
import type { RequestTemplate } from '@/types/api';

export default function NewTicketPage() {
  const workspace = useCurrentWorkspace();
  const [requestTemplates, setRequestTemplates] = useState<RequestTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace) return;

    serviceCatalogApi
      .list(workspace.id)
      .then((response) => setRequestTemplates(response.data.request_templates))
      .catch((err) => setError(extractApiError(err)));
  }, [workspace]);

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
        {error && <Alert type="error" message={error} className="mb-4" />}
        <div className="border border-gray-200 bg-white p-6">
          {workspace ? (
            <TicketSubmitForm workspaceId={workspace.id} requestTemplates={requestTemplates} />
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
