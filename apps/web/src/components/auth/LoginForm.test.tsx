import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

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
    login: vi.fn(),
  },
  extractApiError: (error: { response?: { data?: { error?: { message?: string } } } }) =>
    error?.response?.data?.error?.message || '请求失败',
}));

import { authApi } from '@/lib/api';

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Storage.prototype.setItem = vi.fn();
  });

  it('renders login form correctly', () => {
    render(<LoginForm />);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^密码/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录/ })).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/邮箱/);
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('邮箱-error')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty password', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/^密码/);
    await user.click(passwordInput);
    await user.tab();
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('密码-error')).toHaveTextContent(/请输入密码/);
    });
  });

  it('submits form with valid data and redirects to home when workspaces exist', async () => {
    const user = userEvent.setup();
    const mockLogin = authApi.login as Mock;
    mockLogin.mockResolvedValue({
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
        workspaces: [
          {
            id: 'ws1',
            name: 'My Workspace',
            slug: 'my-workspace',
            role: 'owner',
          },
        ],
      },
      request_id: 'req_123',
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
    await user.type(screen.getByLabelText(/^密码/), 'password123');

    await user.click(screen.getByRole('button', { name: /登录/ }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'mock_access_token');
    expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'mock_refresh_token');
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('redirects to create workspace when no workspaces exist', async () => {
    const user = userEvent.setup();
    const mockLogin = authApi.login as Mock;
    mockLogin.mockResolvedValue({
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
        workspaces: [],
      },
      request_id: 'req_123',
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
    await user.type(screen.getByLabelText(/^密码/), 'password123');

    await user.click(screen.getByRole('button', { name: /登录/ }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/workspaces/create');
    });
  });

  it('shows error message on login failure', async () => {
    const user = userEvent.setup();
    const mockLogin = authApi.login as Mock;
    mockLogin.mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '邮箱或密码错误',
          },
        },
      },
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
    await user.type(screen.getByLabelText(/^密码/), 'wrongpassword');

    await user.click(screen.getByRole('button', { name: /登录/ }));

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toHaveTextContent(/邮箱或密码错误/);
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const mockLogin = authApi.login as Mock;
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
    await user.type(screen.getByLabelText(/^密码/), 'password123');

    await user.click(screen.getByRole('button', { name: /登录/ }));

    expect(screen.getByRole('button', { name: /登录中/ })).toBeDisabled();
  });
});
