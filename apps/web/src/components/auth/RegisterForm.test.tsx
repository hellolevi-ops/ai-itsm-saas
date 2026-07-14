import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

vi.mock('@/lib/api', () => ({
  authApi: {
    register: vi.fn(),
  },
  extractApiError: (error: { response?: { data?: { error?: { message?: string } } } }) =>
    error?.response?.data?.error?.message || '请求失败',
}));

import { authApi } from '@/lib/api';

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Storage.prototype.setItem = vi.fn();
  });

  it('renders registration form correctly', () => {
    render(<RegisterForm />);
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
    expect(screen.getByLabelText(/姓名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^密码/)).toBeInTheDocument();
    expect(screen.getByLabelText(/确认密码/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /创建账号/ })).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/邮箱/);
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('邮箱-error')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^密码/);
    await user.type(passwordInput, 'short');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('密码-error')).toHaveTextContent(/至少需要8个字符/);
    });
  });

  it('shows validation error for mismatched passwords', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^密码/);
    const confirmPasswordInput = screen.getByLabelText(/确认密码/);

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different456');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('确认密码-error')).toHaveTextContent(/不一致/);
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockRegister = authApi.register as Mock;
    mockRegister.mockResolvedValue({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          created_at: '2024-01-01T00:00:00Z',
        },
        token: {
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          expires_in: 3600,
        },
      },
      request_id: 'req_123',
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
    await user.type(screen.getByLabelText(/姓名/), 'Test User');
    await user.type(screen.getByLabelText(/^密码/), 'password123');
    await user.type(screen.getByLabelText(/确认密码/), 'password123');

    await user.click(screen.getByRole('button', { name: /创建账号/ }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'mock_access_token');
    expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'mock_refresh_token');
    expect(mockPush).toHaveBeenCalledWith('/workspaces/create');
  });

  it('shows error message on registration failure', async () => {
    const user = userEvent.setup();
    const mockRegister = authApi.register as Mock;
    mockRegister.mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: '该邮箱已被注册',
          },
        },
      },
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/邮箱/), 'existing@example.com');
    await user.type(screen.getByLabelText(/^密码/), 'password123');
    await user.type(screen.getByLabelText(/确认密码/), 'password123');

    await user.click(screen.getByRole('button', { name: /创建账号/ }));

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toHaveTextContent(/该邮箱已被注册/);
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const mockRegister = authApi.register as Mock;
    mockRegister.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
    await user.type(screen.getByLabelText(/^密码/), 'password123');
    await user.type(screen.getByLabelText(/确认密码/), 'password123');

    await user.click(screen.getByRole('button', { name: /创建账号/ }));

    expect(screen.getByRole('button', { name: /注册中/ })).toBeDisabled();
  });
});
