'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { invitationApi, extractApiError } from '@/lib/api';
import { setCurrentWorkspace } from '@/lib/workspace-store';
import type { FormEvent } from 'react';

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const acceptInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await invitationApi.accept({
        token,
        email: String(data.get('email') || ''),
        password: String(data.get('password') || ''),
        name: String(data.get('name') || '') || undefined,
      });
      localStorage.setItem('access_token', response.data.token.access_token);
      localStorage.setItem('refresh_token', response.data.token.refresh_token);
      setCurrentWorkspace(response.data.workspace);
      router.push('/tickets');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Accept invitation</h1>
        {error && <Alert type="error" message={error} className="mt-4" />}
        <form onSubmit={acceptInvite} className="mt-5 space-y-4" data-testid="accept-invite-form">
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="teammate@example.com"
          />
          <input
            name="name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Name"
          />
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Password"
          />
          <Button type="submit" loading={isSubmitting} disabled={!token} className="w-full">
            Join workspace
          </Button>
        </form>
      </div>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}
