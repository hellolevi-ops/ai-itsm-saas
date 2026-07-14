'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { registerSchema, type RegisterFormData } from '@/lib/validation';
import { authApi, extractApiError } from '@/lib/api';

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      localStorage.setItem('access_token', response.data.token.access_token);
      localStorage.setItem('refresh_token', response.data.token.refresh_token);

      router.push('/workspaces/create');
    } catch (error) {
      setServerError(extractApiError(error));
    }
  };

  return (
    <AuthLayout
      title="创建账号"
      subtitle="开始您的 AI ITSM 之旅"
      footer={
        <>
          已有账号？{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            立即登录
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="register-form">
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
          label="姓名"
          type="text"
          placeholder="可选"
          error={errors.name?.message}
          {...register('name')}
        />

        <FormField
          label="密码"
          type="password"
          placeholder="至少8位，包含字母和数字"
          error={errors.password?.message}
          required
          {...register('password')}
        />

        <FormField
          label="确认密码"
          type="password"
          placeholder="再次输入密码"
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword')}
        />

        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? '注册中...' : '创建账号'}
        </Button>
      </form>
    </AuthLayout>
  );
}
