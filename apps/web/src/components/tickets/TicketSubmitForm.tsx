'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ticketCreateSchema, type TicketCreateFormData } from '@/lib/validation';
import { ticketApi, extractApiError } from '@/lib/api';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import type { RequestTemplate, TicketPriority } from '@/types/api';

interface TicketSubmitFormProps {
  workspaceId: string;
  requestTemplates?: RequestTemplate[];
}

export function TicketSubmitForm({ workspaceId, requestTemplates = [] }: TicketSubmitFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TicketCreateFormData>({
    resolver: zodResolver(ticketCreateSchema),
    defaultValues: { priority: 'P3' },
  });

  const applyTemplate = (templateId: string) => {
    const template = requestTemplates.find((candidate) => candidate.id === templateId);
    setValue('request_template_id', templateId);
    if (!template) return;
    setValue('title', template.default_title, { shouldValidate: true });
    setValue('description', template.default_description, { shouldValidate: true });
    setValue('priority', template.default_priority, { shouldValidate: true });
    setValue('category', template.default_category ?? '', { shouldValidate: true });
  };

  const onSubmit = async (data: TicketCreateFormData) => {
    setServerError(null);
    try {
      const response = await ticketApi.create(workspaceId, {
        title: data.title,
        description: data.description,
        priority: data.priority as TicketPriority,
        category: data.category || undefined,
        request_template_id: data.request_template_id || undefined,
      });
      router.push(`/workspaces/${workspaceId}/tickets/${response.data.ticket.id}`);
    } catch (error) {
      setServerError(extractApiError(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="ticket-submit-form">
      {serverError && <Alert type="error" message={serverError} />}
      {requestTemplates.length > 0 && (
        <div className="space-y-1.5">
          <label htmlFor="request_template_id" className="block text-sm font-medium text-gray-700">
            Request template
          </label>
          <select
            id="request_template_id"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('request_template_id')}
            onChange={(event) => applyTemplate(event.target.value)}
          >
            <option value="">Custom request</option>
            {requestTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.service_catalog_item.name} / {template.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <FormField
        label="Title"
        placeholder="Short summary"
        error={errors.title?.message}
        required
        {...register('title')}
      />
      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          rows={6}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What happened, who is affected, and what changed?"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            Priority
          </label>
          <select
            id="priority"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('priority')}
          >
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
            <option value="P4">P4</option>
          </select>
        </div>
        <FormField label="Category" placeholder="network, access, device" {...register('category')} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          Submit ticket
        </Button>
      </div>
    </form>
  );
}
