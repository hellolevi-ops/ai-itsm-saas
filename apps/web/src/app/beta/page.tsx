'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { betaApi, extractApiError } from '@/lib/api';
import { useCurrentWorkspace } from '@/lib/workspace-store';
import type {
  BetaFeedbackSeverity,
  BetaFeedbackType,
  BetaWorkspaceReadinessResponse,
  Workspace,
} from '@/types/api';

export default function BetaPage() {
  const workspace: Workspace | null = useCurrentWorkspace();
  const [readiness, setReadiness] = useState<BetaWorkspaceReadinessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingFlagKey, setUpdatingFlagKey] = useState<string | null>(null);

  const loadReadiness = async () => {
    if (!workspace) return;
    const response = await betaApi.readiness(workspace.id);
    setReadiness(response.data);
  };

  useEffect(() => {
    if (!workspace) return;
    betaApi
      .readiness(workspace.id)
      .then((response) => setReadiness(response.data))
      .catch((err) => setError(extractApiError(err)));
  }, [workspace]);

  const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspace) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      await betaApi.createFeedback(workspace.id, {
        type: String(data.get('type') || 'FEEDBACK') as BetaFeedbackType,
        severity: String(data.get('severity') || 'MEDIUM') as BetaFeedbackSeverity,
        title: String(data.get('title') || ''),
        description: String(data.get('description') || ''),
      });
      await loadReadiness();
      form.reset();
      setSuccess('Beta feedback captured.');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFlag = async (key: string, enabled: boolean) => {
    if (!workspace) return;
    setError(null);
    setSuccess(null);
    setUpdatingFlagKey(key);
    try {
      await betaApi.updateFeatureFlag(workspace.id, key, enabled);
      await loadReadiness();
      setSuccess('Feature flag updated.');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setUpdatingFlagKey(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Beta Readiness</h1>
            <p className="mt-1 text-sm text-gray-500">
              Pre-release workspace controls, feedback intake and exit criteria.
            </p>
          </div>
          <Link className="text-sm font-medium text-blue-700" href="/tickets">
            Queue
          </Link>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}
        {!workspace && (
          <div className="border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Create or select a workspace before opening beta controls.
          </div>
        )}

        {workspace && readiness && (
          <div className="space-y-6" data-testid="beta-readiness">
            <section className="grid gap-4 md:grid-cols-4">
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">Environment</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {readiness.environment}
                </div>
                <div className="mt-2 text-sm text-gray-600">{readiness.status}</div>
              </div>
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">Production</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {readiness.production_release ? 'Allowed' : 'Blocked'}
                </div>
                <div className="mt-2 text-sm text-gray-600">release gate remains closed</div>
              </div>
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">Open feedback</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {readiness.feedback_summary.open}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {readiness.feedback_summary.high_or_critical} high or critical
                </div>
              </div>
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">Seed workspace</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {readiness.seed_workspace.recommended_slug}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {readiness.seed_workspace.default_timezone}
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <form
                onSubmit={submitFeedback}
                className="border border-gray-200 bg-white p-5"
                data-testid="beta-feedback-form"
              >
                <h2 className="text-sm font-semibold text-gray-900">Feedback intake</h2>
                <div className="mt-4 space-y-3">
                  <select
                    name="type"
                    defaultValue="FEEDBACK"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    aria-label="Feedback type"
                  >
                    <option value="FEEDBACK">Feedback</option>
                    <option value="BUG">Bug</option>
                    <option value="INTERVIEW_NOTE">Interview note</option>
                  </select>
                  <select
                    name="severity"
                    defaultValue="MEDIUM"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    aria-label="Severity"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                  <input
                    name="title"
                    placeholder="Short title"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                  <textarea
                    name="description"
                    placeholder="What happened and what should change"
                    rows={5}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                  <Button type="submit" loading={isSubmitting} className="w-full">
                    Submit feedback
                  </Button>
                </div>
              </form>

              <section className="space-y-6">
                <div className="border border-gray-200 bg-white p-5" data-testid="beta-flags">
                  <h2 className="text-sm font-semibold text-gray-900">Feature flags</h2>
                  <div className="mt-4 divide-y divide-gray-200">
                    {readiness.feature_flags.map((flag) => (
                      <div key={flag.key} className="flex items-center justify-between gap-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{flag.key}</div>
                          <div className="mt-1 text-sm text-gray-600">{flag.description}</div>
                        </div>
                        <Button
                          type="button"
                          variant={flag.enabled ? 'secondary' : 'primary'}
                          loading={updatingFlagKey === flag.key}
                          onClick={() => toggleFlag(flag.key, !flag.enabled)}
                        >
                          {flag.enabled ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-200 bg-white p-5" data-testid="beta-feedback">
                  <h2 className="text-sm font-semibold text-gray-900">Recent feedback</h2>
                  <div className="mt-4 space-y-3">
                    {readiness.feedback.length === 0 ? (
                      <p className="text-sm text-gray-500">No beta feedback yet.</p>
                    ) : (
                      readiness.feedback.map((item) => (
                        <article key={item.id} className="border border-gray-200 p-3 text-sm">
                          <div className="font-medium text-gray-900">{item.title}</div>
                          <div className="mt-1 text-gray-600">
                            {item.type} / {item.severity} / {item.status}
                          </div>
                          <p className="mt-2 text-gray-700">{item.description}</p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="border border-gray-200 bg-white p-5" data-testid="beta-documents">
                <h2 className="text-sm font-semibold text-gray-900">Beta documents</h2>
                <div className="mt-4 space-y-3">
                  {readiness.documents.map((doc) => (
                    <article key={doc.slug} className="text-sm">
                      <div className="font-medium text-gray-900">{doc.title}</div>
                      <div className="mt-1 text-gray-600">{doc.summary}</div>
                    </article>
                  ))}
                </div>
              </div>
              <div className="border border-gray-200 bg-white p-5" data-testid="beta-exit">
                <h2 className="text-sm font-semibold text-gray-900">Exit criteria</h2>
                <ol className="mt-4 space-y-2 text-sm text-gray-700">
                  {readiness.exit_criteria.map((criterion) => (
                    <li key={criterion}>{criterion}</li>
                  ))}
                </ol>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
