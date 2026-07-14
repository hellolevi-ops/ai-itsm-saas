'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';
import { knowledgeApi, extractApiError } from '@/lib/api';
import { useCurrentWorkspace } from '@/lib/workspace-store';
import type { KnowledgeArticle, Workspace } from '@/types/api';

export default function KnowledgePage() {
  const workspace: Workspace | null = useCurrentWorkspace();
  const [articles, setArticles] = useState<KnowledgeArticle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!workspace) return;

    knowledgeApi
      .list(workspace.id, query.trim() || undefined)
      .then((response) => setArticles(response.data.articles))
      .catch((err) => setError(extractApiError(err)));
  }, [query, workspace]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Knowledge</h1>
            <p className="mt-1 text-sm text-gray-500">Find reviewed answers for common requests.</p>
          </div>
          <Link className="text-sm font-medium text-blue-700" href="/tickets">
            Ticket queue
          </Link>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {workspace && (
          <div className="mb-4 border border-gray-200 bg-white p-4">
            <label className="text-sm font-medium text-gray-700" htmlFor="knowledge-search">
              Search
            </label>
            <input
              id="knowledge-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search knowledge"
            />
          </div>
        )}
        {!workspace && (
          <div className="border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Create or select a workspace to view knowledge.
          </div>
        )}
        {workspace && articles === null && (
          <div className="border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Loading knowledge...
          </div>
        )}
        {workspace && articles !== null && articles.length === 0 && (
          <div className="border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No published knowledge yet.
          </div>
        )}
        {workspace && articles !== null && articles.length > 0 && (
          <div className="space-y-3">
            {articles.map((article) => (
              <article key={article.id} className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">
                  {article.status} / {article.visibility}
                </div>
                <h2 className="mt-1 text-base font-semibold text-gray-900">{article.title}</h2>
                <p className="mt-2 text-sm text-gray-700">{article.problem}</p>
                <p className="mt-3 text-sm text-gray-800">{article.resolution}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
