'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { channelApi, extractApiError } from '@/lib/api';
import { useCurrentWorkspace } from '@/lib/workspace-store';
import type { ChannelConnection, Ticket, Workspace } from '@/types/api';
import type { FormEvent } from 'react';

const defaultToken = 'mock-wecom-token';

export default function ChannelsPage() {
  const workspace: Workspace | null = useCurrentWorkspace();
  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);
  const [token, setToken] = useState(defaultToken);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!workspace) return;

    channelApi
      .list(workspace.id)
      .then((response) => setChannels(response.data.channels))
      .catch((err) => setError(extractApiError(err)));
  }, [workspace]);

  const createChannel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspace) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const nextToken = String(data.get('token') || defaultToken);
    setError(null);
    setIsCreating(true);
    try {
      await channelApi.createWeCom(workspace.id, {
        name: String(data.get('name') || 'WeCom support'),
        token: nextToken,
      });
      setToken(nextToken);
      form.reset();
      const response = await channelApi.list(workspace.id);
      setChannels(response.data.channels);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsCreating(false);
    }
  };

  const sendInbound = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const channel = channels[0];
    if (!channel) return;
    const data = new FormData(event.currentTarget);
    setError(null);
    setIsSending(true);
    try {
      const response = await channelApi.receiveWeComMessage(channel, token, {
        external_message_id: `mock-${Date.now()}`,
        external_user_id: String(data.get('external_user_id') || 'wecom-user-001'),
        external_user_name: String(data.get('external_user_name') || 'WeCom User'),
        subject: String(data.get('subject') || ''),
        text: String(data.get('text') || ''),
      });
      setLastTicket(response.data.ticket);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Channels</h1>
            <p className="mt-1 text-sm text-gray-500">Manage the first China channel adapter.</p>
          </div>
          <Link className="text-sm font-medium text-blue-700" href="/tickets">
            Queue
          </Link>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}

        {!workspace && (
          <div className="border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Create or select a workspace before configuring channels.
          </div>
        )}

        {workspace && (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <section className="space-y-4">
              <form
                onSubmit={createChannel}
                className="border border-gray-200 bg-white p-5"
                data-testid="wecom-channel-form"
              >
                <h2 className="text-sm font-semibold text-gray-900">WeCom mock channel</h2>
                <div className="mt-4 space-y-3">
                  <input
                    name="name"
                    required
                    defaultValue="WeCom support"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Channel name"
                  />
                  <input
                    name="token"
                    required
                    defaultValue={defaultToken}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Mock token"
                  />
                  <Button type="submit" loading={isCreating} className="w-full">
                    Add WeCom channel
                  </Button>
                </div>
              </form>

              <form
                onSubmit={sendInbound}
                className="border border-gray-200 bg-white p-5"
                data-testid="wecom-inbound-form"
              >
                <h2 className="text-sm font-semibold text-gray-900">Simulate inbound</h2>
                <div className="mt-4 space-y-3">
                  <input
                    name="external_user_id"
                    required
                    defaultValue="wecom-user-001"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="External user ID"
                  />
                  <input
                    name="external_user_name"
                    defaultValue="Zhang San"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="External user name"
                  />
                  <input
                    name="subject"
                    required
                    defaultValue="Payroll VPN access failed"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Subject"
                  />
                  <textarea
                    name="text"
                    required
                    rows={4}
                    defaultValue="I cannot access the payroll system from the corporate VPN."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Message text"
                  />
                  <Button type="submit" loading={isSending} disabled={channels.length === 0} className="w-full">
                    Send mock message
                  </Button>
                </div>
              </form>
            </section>

            <section className="space-y-4">
              <div className="border border-gray-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-gray-900">Configured channels</h2>
                <div className="mt-4 space-y-3">
                  {channels.length === 0 ? (
                    <p className="text-sm text-gray-500">No channels yet.</p>
                  ) : (
                    channels.map((channel) => (
                      <div key={channel.id} className="border border-gray-200 p-3 text-sm">
                        <div className="font-medium text-gray-900">{channel.name}</div>
                        <div className="mt-1 text-gray-600">
                          {channel.type} / {channel.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {lastTicket && (
                <div className="border border-gray-200 bg-white p-5" data-testid="channel-ticket-result">
                  <h2 className="text-sm font-semibold text-gray-900">Created ticket</h2>
                  <div className="mt-3 text-sm">
                    <div className="font-medium text-gray-900">{lastTicket.title}</div>
                    <div className="mt-1 text-gray-600">
                      {lastTicket.number} / {lastTicket.source}
                    </div>
                    <Link
                      className="mt-3 inline-block text-sm font-medium text-blue-700"
                      href={`/workspaces/${workspace.id}/tickets/${lastTicket.id}`}
                    >
                      Open ticket
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
