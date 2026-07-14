'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { extractApiError, serviceCatalogApi } from '@/lib/api';
import { useCurrentWorkspace } from '@/lib/workspace-store';
import type { FormEvent } from 'react';
import type { RequestTemplate, ServiceCatalogItem, TicketPriority, Workspace } from '@/types/api';

export default function ServiceCatalogPage() {
  const workspace: Workspace | null = useCurrentWorkspace();
  const [items, setItems] = useState<ServiceCatalogItem[]>([]);
  const [templates, setTemplates] = useState<RequestTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  const loadCatalog = async () => {
    if (!workspace) return;
    const response = await serviceCatalogApi.list(workspace.id);
    setItems(response.data.service_catalog_items);
    setTemplates(response.data.request_templates);
  };

  useEffect(() => {
    if (!workspace) return;

    serviceCatalogApi
      .list(workspace.id)
      .then((response) => {
        setItems(response.data.service_catalog_items);
        setTemplates(response.data.request_templates);
      })
      .catch((err) => setError(extractApiError(err)));
  }, [workspace]);

  const createItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspace) return;
    const form = event.currentTarget;
    setError(null);
    setIsCreatingItem(true);
    const data = new FormData(form);
    try {
      await serviceCatalogApi.createItem(workspace.id, {
        name: String(data.get('name') || ''),
        description: String(data.get('description') || ''),
        category: String(data.get('category') || '') || undefined,
        default_priority: String(data.get('default_priority') || 'P3') as TicketPriority,
        response_target_minutes: Number(data.get('response_target_minutes') || 240),
        resolution_target_minutes: Number(data.get('resolution_target_minutes') || 1440),
      });
      form.reset();
      await loadCatalog();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsCreatingItem(false);
    }
  };

  const createTemplate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspace) return;
    const form = event.currentTarget;
    setError(null);
    setIsCreatingTemplate(true);
    const data = new FormData(form);
    try {
      await serviceCatalogApi.createTemplate(workspace.id, {
        service_catalog_item_id: String(data.get('service_catalog_item_id') || ''),
        name: String(data.get('name') || ''),
        description: String(data.get('description') || '') || undefined,
        default_title: String(data.get('default_title') || ''),
        default_description: String(data.get('default_description') || ''),
        default_priority: String(data.get('default_priority') || 'P3') as TicketPriority,
        default_category: String(data.get('default_category') || '') || undefined,
      });
      form.reset();
      await loadCatalog();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Service catalog</h1>
            <p className="mt-1 text-sm text-gray-500">
              Maintain request templates and service targets.
            </p>
          </div>
          <Link className="text-sm font-medium text-blue-700" href="/tickets/new">
            Submit ticket
          </Link>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {!workspace && (
          <div className="border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Create or select a workspace to manage the service catalog.
          </div>
        )}

        {workspace && (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <section className="space-y-4">
              <form
                onSubmit={createItem}
                className="border border-gray-200 bg-white p-5"
                data-testid="service-item-form"
              >
                <h2 className="text-sm font-semibold text-gray-900">Service item</h2>
                <div className="mt-4 space-y-3">
                  <input
                    name="name"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Service name"
                  />
                  <input
                    name="category"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Category"
                  />
                  <textarea
                    name="description"
                    required
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Description"
                  />
                  <select
                    name="default_priority"
                    defaultValue="P3"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                    <option value="P3">P3</option>
                    <option value="P4">P4</option>
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      name="response_target_minutes"
                      type="number"
                      min="15"
                      defaultValue="60"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      aria-label="Response target minutes"
                    />
                    <input
                      name="resolution_target_minutes"
                      type="number"
                      min="15"
                      defaultValue="480"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      aria-label="Resolution target minutes"
                    />
                  </div>
                  <Button type="submit" loading={isCreatingItem} className="w-full">
                    Add service
                  </Button>
                </div>
              </form>

              <form
                onSubmit={createTemplate}
                className="border border-gray-200 bg-white p-5"
                data-testid="request-template-form"
              >
                <h2 className="text-sm font-semibold text-gray-900">Request template</h2>
                <div className="mt-4 space-y-3">
                  <select
                    name="service_catalog_item_id"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select service</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="name"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Template name"
                  />
                  <input
                    name="default_title"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Default title"
                  />
                  <input
                    name="default_category"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Default category"
                  />
                  <textarea
                    name="default_description"
                    required
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Default description"
                  />
                  <textarea
                    name="description"
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Template notes"
                  />
                  <select
                    name="default_priority"
                    defaultValue="P3"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                    <option value="P3">P3</option>
                    <option value="P4">P4</option>
                  </select>
                  <Button type="submit" loading={isCreatingTemplate} className="w-full">
                    Add template
                  </Button>
                </div>
              </form>
            </section>

            <section className="space-y-3">
              {items.length === 0 && (
                <div className="border border-gray-200 bg-white p-6 text-sm text-gray-600">
                  No service catalog items yet.
                </div>
              )}
              {items.map((item) => (
                <article key={item.id} className="border border-gray-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium uppercase text-gray-500">
                        {item.category || 'general'} / {item.default_priority}
                      </div>
                      <h2 className="mt-1 text-base font-semibold text-gray-900">{item.name}</h2>
                      <p className="mt-2 text-sm text-gray-700">{item.description}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>{item.response_target_minutes}m response</div>
                      <div>{item.resolution_target_minutes}m resolution</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {templates
                      .filter((template) => template.service_catalog_item_id === item.id)
                      .map((template) => (
                        <div key={template.id} className="border border-gray-200 p-3 text-sm">
                          <div className="font-medium text-gray-900">{template.name}</div>
                          <div className="mt-1 text-gray-600">{template.default_title}</div>
                        </div>
                      ))}
                  </div>
                </article>
              ))}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
