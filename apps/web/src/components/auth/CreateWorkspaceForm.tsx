'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  createWorkspaceSchema,
  type CreateWorkspaceFormData,
} from '@/lib/validation';
import { workspaceApi, extractApiError } from '@/lib/api';

const TIMEZONES = [
  { value: 'Asia/Shanghai', label: '中国标准时间 (Asia/Shanghai)' },
  { value: 'Asia/Hong_Kong', label: '香港时间 (Asia/Hong_Kong)' },
  { value: 'Asia/Taipei', label: '台北时间 (Asia/Taipei)' },
  { value: 'Asia/Singapore', label: '新加坡时间 (Asia/Singapore)' },
  { value: 'Asia/Tokyo', label: '东京时间 (Asia/Tokyo)' },
  { value: 'America/New_York', label: '纽约时间 (America/New_York)' },
  { value: 'America/Los_Angeles', label: '洛杉矶时间 (America/Los_Angeles)' },
  { value: 'Europe/London', label: '伦敦时间 (Europe/London)' },
];

const LANGUAGES = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema),
    mode: 'onBlur',
    defaultValues: {
      timezone: 'Asia/Shanghai',
      language: 'zh-CN',
      slug: '',
    },
  });

  const slugTouched = useMemo(() => false, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!slugTouched) {
      setValue('slug', slugify(value), {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  };

  const onSubmit = async (data: CreateWorkspaceFormData) => {
    setServerError(null);
    try {
      const response = await workspaceApi.create({
        name: data.name,
        slug: data.slug,
        timezone: data.timezone,
        language: data.language,
      });

      localStorage.setItem(
        'current_workspace',
        JSON.stringify(response.data.workspace)
      );

      router.push('/');
    } catch (error) {
      setServerError(extractApiError(error));
    }
  };

  return (
    <AuthLayout
      title="创建工作区"
      subtitle="为您的团队创建一个专属工作空间"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        data-testid="create-workspace-form"
      >
        {serverError && <Alert type="error" message={serverError} />}

        <FormField
          label="工作区名称"
          type="text"
          placeholder="例如：ACME 科技"
          error={errors.name?.message}
          required
          {...register('name', {
            onChange: handleNameChange,
          })}
        />

        <FormField
          label="工作区简称"
          type="text"
          placeholder="例如：acme-tech"
          error={errors.slug?.message}
          required
          hint="用于 URL 地址，只能包含小写字母、数字和短横线"
          {...register('slug')}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="timezone"
            className="block text-sm font-medium text-gray-700"
          >
            时区
          </label>
          <select
            id="timezone"
            data-testid="timezone-select"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            {...register('timezone')}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          {errors.timezone && (
            <p className="text-sm text-red-600">{errors.timezone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="language"
            className="block text-sm font-medium text-gray-700"
          >
            语言
          </label>
          <select
            id="language"
            data-testid="language-select"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            {...register('language')}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          {errors.language && (
            <p className="text-sm text-red-600">{errors.language.message}</p>
          )}
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? '创建中...' : '创建工作区'}
        </Button>
      </form>
    </AuthLayout>
  );
}
