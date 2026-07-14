import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createWorkspaceSchema,
} from './validation';

describe('registerSchema', () => {
  it('validates correct registration data', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      name: 'Test User',
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const data = {
      email: 'invalid-email',
      password: 'password123',
      confirmPassword: 'password123',
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('email');
    }
  });

  it('rejects short password', () => {
    const data = {
      email: 'test@example.com',
      password: 'short',
      confirmPassword: 'short',
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('password');
    }
  });

  it('rejects password without letters', () => {
    const data = {
      email: 'test@example.com',
      password: '12345678',
      confirmPassword: '12345678',
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects password without numbers', () => {
    const data = {
      email: 'test@example.com',
      password: 'password',
      confirmPassword: 'password',
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different456',
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('confirmPassword');
    }
  });

  it('accepts optional name field', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('validates correct login data', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
    };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const data = {
      email: 'invalid',
      password: 'password123',
    };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const data = {
      email: 'test@example.com',
      password: '',
    };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('createWorkspaceSchema', () => {
  it('validates correct workspace data', () => {
    const data = {
      name: 'Test Workspace',
      slug: 'test-workspace',
      timezone: 'Asia/Shanghai',
      language: 'zh-CN',
    };
    const result = createWorkspaceSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const data = {
      name: '',
      slug: 'test-workspace',
    };
    const result = createWorkspaceSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('name');
    }
  });

  it('rejects name longer than 100 characters', () => {
    const data = {
      name: 'a'.repeat(101),
      slug: 'test-workspace',
    };
    const result = createWorkspaceSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects slug shorter than 3 characters', () => {
    const data = {
      name: 'Test',
      slug: 'ab',
    };
    const result = createWorkspaceSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('slug');
    }
  });

  it('rejects slug longer than 50 characters', () => {
    const data = {
      name: 'Test',
      slug: 'a'.repeat(51),
    };
    const result = createWorkspaceSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase letters', () => {
    const data = {
      name: 'Test',
      slug: 'Test-Workspace',
    };
    const result = createWorkspaceSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects slug with special characters', () => {
    const data = {
      name: 'Test',
      slug: 'test_workspace!',
    };
    const result = createWorkspaceSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects slug starting with number', () => {
    const data = {
      name: 'Test',
      slug: '1test-workspace',
    };
    const result = createWorkspaceSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects slug starting with dash', () => {
    const data = {
      name: 'Test',
      slug: '-test-workspace',
    };
    const result = createWorkspaceSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects slug ending with dash', () => {
    const data = {
      name: 'Test',
      slug: 'test-workspace-',
    };
    const result = createWorkspaceSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accepts valid slug with numbers and dashes', () => {
    const data = {
      name: 'Test',
      slug: 'test-workspace-123',
      timezone: 'Asia/Shanghai',
      language: 'zh-CN',
    };
    const result = createWorkspaceSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('requires timezone and language', () => {
    const data = {
      name: 'Test',
      slug: 'test-workspace',
      timezone: 'Asia/Shanghai',
      language: 'zh-CN',
    };
    const result = createWorkspaceSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timezone).toBe('Asia/Shanghai');
      expect(result.data.language).toBe('zh-CN');
    }
  });
});
