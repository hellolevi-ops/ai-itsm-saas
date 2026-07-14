'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { authApi, extractApiError } from '@/lib/api';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const registered = searchParams.get('registered');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });

      localStorage.setItem('access_token', response.data.token.access_token);
      localStorage.setItem('refresh_token', response.data.token.refresh_token);

      const workspaces = response.data.workspaces;
      if (workspaces && workspaces.length > 0) {
        router.push('/');
      } else {
        router.push('/workspaces/create');
      }
    } catch (error) {
      setServerError(extractApiError(error));
    }
  };

  return (
    <AuthLayout
      title="欢迎回来"
      subtitle="登录您的账号继续"
      footer={
        <>
          还没有账号？{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            免费注册
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="login-form">
        {registered && (
          <Alert type="success" message="注册成功！请使用您的邮箱和密码登录。" />
        )}

        {serverError && <Alert type="error" message={serverError} />}

        <FormField
          label="邮箱"
          type="email"
          placeholder="your@company.com"
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <FormField
          label="密码"
          type="password"
          placeholder="请输入密码"
          error={errors.password?.message}
          required
          {...register('password')}
        />

        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? '登录中...' : '登录'}
        </Button>
      </form>
    </AuthLayout>
  );
}
