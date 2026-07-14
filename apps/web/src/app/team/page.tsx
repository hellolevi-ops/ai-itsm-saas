'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { extractApiError, invitationApi } from '@/lib/api';
import { useCurrentWorkspace } from '@/lib/workspace-store';
import type { Workspace, WorkspaceInvitation } from '@/types/api';
import type { FormEvent } from 'react';

export default function TeamPage() {
  const workspace: Workspace | null = useCurrentWorkspace();
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const loadInvitations = async () => {
    if (!workspace) return;
    const response = await invitationApi.list(workspace.id);
    setInvitations(response.data.invitations);
  };

  useEffect(() => {
    if (!workspace) return;
    invitationApi
      .list(workspace.id)
      .then((response) => setInvitations(response.data.invitations))
      .catch((err) => setError(extractApiError(err)));
  }, [workspace]);

  const createInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspace) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    setIsCreating(true);
    try {
      const response = await invitationApi.create(workspace.id, {
        email: String(data.get('email') || '') || undefined,
        role_type: String(data.get('role_type') || 'REQUESTER') as 'AGENT' | 'REQUESTER',
      });
      setInviteUrl(`${window.location.origin}/invite/accept?token=${response.data.token}`);
      form.reset();
      await loadInvitations();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Team</h1>
            <p className="mt-1 text-sm text-gray-500">Invite teammates into this workspace.</p>
          </div>
          <Link className="text-sm font-medium text-blue-700" href="/tickets">
            Queue
          </Link>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}

        {!workspace && (
          <div className="border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Create or select a workspace before inviting teammates.
          </div>
        )}

        {workspace && (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <form
              onSubmit={createInvitation}
              className="border border-gray-200 bg-white p-5"
              data-testid="team-invite-form"
            >
              <h2 className="text-sm font-semibold text-gray-900">Create invitation</h2>
              <div className="mt-4 space-y-3">
                <input
                  name="email"
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="teammate@example.com"
                />
                <select
                  name="role_type"
                  defaultValue="REQUESTER"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  aria-label="Role"
                >
                  <option value="REQUESTER">Requester</option>
                  <option value="AGENT">Agent</option>
                </select>
                <Button type="submit" loading={isCreating} className="w-full">
                  Create invite
                </Button>
              </div>
            </form>

            <section className="space-y-4">
              {inviteUrl && (
                <div className="border border-green-200 bg-green-50 p-5" data-testid="invite-link">
                  <h2 className="text-sm font-semibold text-green-900">Invite link</h2>
                  <p className="mt-2 break-all text-sm text-green-800">{inviteUrl}</p>
                </div>
              )}

              <div className="border border-gray-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-gray-900">Invitations</h2>
                <div className="mt-4 space-y-3">
                  {invitations.length === 0 ? (
                    <p className="text-sm text-gray-500">No invitations yet.</p>
                  ) : (
                    invitations.map((invitation) => (
                      <div key={invitation.id} className="border border-gray-200 p-3 text-sm">
                        <div className="font-medium text-gray-900">
                          {invitation.email || 'Open invite'}
                        </div>
                        <div className="mt-1 text-gray-600">
                          {invitation.role_type} / {invitation.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
