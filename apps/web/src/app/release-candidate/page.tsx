'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { extractApiError, releaseCandidateApi } from '@/lib/api';
import type { ReleaseCandidatePackageResponse } from '@/types/api';

export default function ReleaseCandidatePage() {
  const [rcPackage, setRcPackage] = useState<ReleaseCandidatePackageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    releaseCandidateApi
      .publicPackage()
      .then((response) => setRcPackage(response.data))
      .catch((err) => setError(extractApiError(err)));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Release Candidate</h1>
            <p className="mt-1 text-sm text-gray-500">
              RC gates, evidence and production hold items.
            </p>
          </div>
          <Link className="text-sm font-medium text-blue-700" href="/beta">
            Beta
          </Link>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}

        {rcPackage && (
          <div className="space-y-6" data-testid="rc-center">
            <section className="grid gap-4 md:grid-cols-4">
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">Status</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{rcPackage.status}</div>
                <div className="mt-2 text-sm text-gray-600">{rcPackage.package_version}</div>
              </div>
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">Production</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {rcPackage.production_release ? 'Allowed' : 'Blocked'}
                </div>
                <div className="mt-2 text-sm text-gray-600">release approval required</div>
              </div>
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">Main merge</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {rcPackage.merge_to_main_approved ? 'Approved' : 'Held'}
                </div>
                <div className="mt-2 text-sm text-gray-600">develop remains integration</div>
              </div>
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">Gates</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {rcPackage.gates.length}
                </div>
                <div className="mt-2 text-sm text-gray-600">tracked RC checks</div>
              </div>
            </section>

            <section className="border border-gray-200 bg-white p-5" data-testid="rc-gates">
              <h2 className="text-sm font-semibold text-gray-900">RC gates</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {rcPackage.gates.map((gate) => (
                  <article key={gate.key} className="border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-sm font-semibold text-gray-900">{gate.title}</h3>
                      <span className="border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                        {gate.status}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-gray-600">
                      {gate.evidence.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="border border-gray-200 bg-white p-5" data-testid="rc-reports">
                <h2 className="text-sm font-semibold text-gray-900">Reports</h2>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  {rcPackage.reports.map((report) => (
                    <div key={report}>{report}</div>
                  ))}
                </div>
              </div>
              <div className="border border-gray-200 bg-white p-5" data-testid="rc-human-actions">
                <h2 className="text-sm font-semibold text-gray-900">Human actions required</h2>
                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  {rcPackage.human_actions_required.map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
