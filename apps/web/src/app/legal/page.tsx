'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { complianceApi, extractApiError } from '@/lib/api';
import type { CompliancePackageResponse } from '@/types/api';

const categoryLabels: Record<string, string> = {
  TERMS: 'Terms',
  PRIVACY: 'Privacy',
  DATA_RIGHTS: 'Data rights',
  AI: 'AI',
  SECURITY: 'Security',
  OPERATIONS: 'Operations',
  FILING: 'Filing',
};

export default function LegalPage() {
  const [compliancePackage, setCompliancePackage] = useState<CompliancePackageResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    complianceApi
      .publicPackage()
      .then((response) => setCompliancePackage(response.data))
      .catch((err) => setError(extractApiError(err)));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Compliance Center</h1>
            <p className="mt-1 text-sm text-gray-500">
              China-market legal, privacy, AI and filing materials prepared for professional
              review.
            </p>
          </div>
          <Link className="text-sm font-medium text-blue-700" href="/tickets">
            Queue
          </Link>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}

        {compliancePackage && (
          <div className="space-y-6" data-testid="compliance-center">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">Jurisdiction</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {compliancePackage.jurisdiction}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {compliancePackage.package_version}
                </div>
              </div>
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">Status</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">
                  Draft for review
                </div>
                <div className="mt-2 text-sm text-gray-600">Not production-effective</div>
              </div>
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">Documents</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {compliancePackage.documents.length}
                </div>
                <div className="mt-2 text-sm text-gray-600">professional review required</div>
              </div>
            </section>

            <section className="border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900">Review boundary</h2>
              <p className="mt-2 text-sm text-gray-600">
                These materials are implementation drafts and operational checklists. They do not
                represent final legal judgment, ICP completion, public security filing, MLPS
                certification or production release approval.
              </p>
            </section>

            <section className="grid gap-3 md:grid-cols-2" data-testid="compliance-documents">
              {compliancePackage.documents.map((document) => (
                <article key={document.slug} className="border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium uppercase text-gray-500">
                        {categoryLabels[document.category]}
                      </div>
                      <h2 className="mt-1 text-base font-semibold text-gray-900">
                        {document.title}
                      </h2>
                    </div>
                    <span className="whitespace-nowrap border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                      Review
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{document.summary}</p>
                  <div className="mt-3 text-xs text-gray-500">{document.repository_path}</div>
                </article>
              ))}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
