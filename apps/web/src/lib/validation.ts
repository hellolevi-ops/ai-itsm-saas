import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('请输入有效的邮箱地址'),
    password: z
      .string()
      .min(8, '密码至少需要8个字符')
      .regex(/[a-zA-Z]/, '密码必须包含至少一个字母')
      .regex(/[0-9]/, '密码必须包含至少一个数字'),
    confirmPassword: z.string().min(1, '请确认密码'),
    name: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, '请输入工作区名称').max(100, '工作区名称不能超过100个字符'),
  slug: z
    .string()
    .min(3, '简称至少需要3个字符')
    .max(50, '简称不能超过50个字符')
    .regex(/^[a-z0-9-]+$/, '简称只能包含小写英文字母、数字和短横线')
    .regex(/^[a-z]/, '简称必须以字母开头')
    .regex(/[a-z0-9]$/, '简称必须以字母或数字结尾'),
  timezone: z.string(),
  language: z.string(),
});

export type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>;

export const ticketCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Title must be 120 characters or less'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(10000, 'Description must be 10000 characters or less'),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']),
  category: z.string().trim().max(80, 'Category must be 80 characters or less').optional(),
});

export type TicketCreateFormData = z.infer<typeof ticketCreateSchema>;
