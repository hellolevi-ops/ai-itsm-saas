import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateWorkspaceForm } from './CreateWorkspaceForm';

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
  workspaceApi: {
    create: vi.fn(),
  },
  extractApiError: (error: { response?: { data?: { error?: { message?: string } } } }) =>
    error?.response?.data?.error?.message || '请求失败',
}));

import { workspaceApi } from '@/lib/api';

describe('CreateWorkspaceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Storage.prototype.setItem = vi.fn();
  });

  it('renders create workspace form correctly', () => {
    render(<CreateWorkspaceForm />);
    expect(screen.getByTestId('create-workspace-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/工作区名称/)).toBeInTheDocument();
    expect(screen.getByLabelText(/工作区简称/)).toBeInTheDocument();
    expect(screen.getByTestId('timezone-select')).toBeInTheDocument();
    expect(screen.getByTestId('language-select')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /创建工作区/ })
    ).toBeInTheDocument();
  });

  it('has default timezone and language', () => {
    render(<CreateWorkspaceForm />);
    const timezoneSelect = screen.getByTestId('timezone-select') as HTMLSelectElement;
    const languageSelect = screen.getByTestId('language-select') as HTMLSelectElement;

    expect(timezoneSelect.value).toBe('Asia/Shanghai');
    expect(languageSelect.value).toBe('zh-CN');
  });

  it('shows validation error for empty name', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);

    const nameInput = screen.getByLabelText(/工作区名称/);
    await user.click(nameInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('工作区名称-error')).toHaveTextContent(/请输入工作区名称/);
    });
  });

  it('shows validation error for short slug', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);

    const slugInput = screen.getByLabelText(/工作区简称/);
    await user.type(slugInput, 'ab');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('工作区简称-error')).toHaveTextContent(/至少需要3个字符/);
    });
  });

  it('shows validation error for slug with uppercase letters', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);

    const slugInput = screen.getByLabelText(/工作区简称/);
    await user.type(slugInput, 'Test-Workspace');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('工作区简称-error')).toHaveTextContent(/小写英文字母/);
    });
  });

  it('auto-generates slug from name', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceForm />);

    const nameInput = screen.getByLabelText(/工作区名称/);
    await user.type(nameInput, 'My Test Workspace');

    const slugInput = screen.getByLabelText(/工作区简称/) as HTMLInputElement;
    expect(slugInput.value).toBe('my-test-workspace');
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockCreate = workspaceApi.create as Mock;
    mockCreate.mockResolvedValue({
      data: {
        workspace: {
          id: 'ws123',
          name: 'Test Workspace',
          slug: 'test-workspace',
          timezone: 'Asia/Shanghai',
          language: 'zh-CN',
          role: 'owner',
          created_at: '2024-01-01T00:00:00Z',
        },
      },
      request_id: 'req_123',
    });

    render(<CreateWorkspaceForm />);

    await user.type(screen.getByLabelText(/工作区名称/), 'Test Workspace');
    await user.clear(screen.getByLabelText(/工作区简称/));
    await user.type(screen.getByLabelText(/工作区简称/), 'test-workspace');

    await user.click(screen.getByRole('button', { name: /创建工作区/ }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Test Workspace',
        slug: 'test-workspace',
        timezone: 'Asia/Shanghai',
        language: 'zh-CN',
      });
    });

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('shows error message when slug already exists', async () => {
    const user = userEvent.setup();
    const mockCreate = workspaceApi.create as Mock;
    mockCreate.mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'SLUG_ALREADY_EXISTS',
            message: '该工作区简称已被占用',
          },
        },
      },
    });

    render(<CreateWorkspaceForm />);

    await user.type(screen.getByLabelText(/工作区名称/), 'Test Workspace');
    await user.clear(screen.getByLabelText(/工作区简称/));
    await user.type(screen.getByLabelText(/工作区简称/), 'taken-slug');

    await user.click(screen.getByRole('button', { name: /创建工作区/ }));

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toHaveTextContent(/该工作区简称已被占用/);
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const mockCreate = workspaceApi.create as Mock;
    mockCreate.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<CreateWorkspaceForm />);

    await user.type(screen.getByLabelText(/工作区名称/), 'Test Workspace');
    await user.clear(screen.getByLabelText(/工作区简称/));
    await user.type(screen.getByLabelText(/工作区简称/), 'test-workspace');

    await user.click(screen.getByRole('button', { name: /创建工作区/ }));

    expect(screen.getByRole('button', { name: /创建中/ })).toBeDisabled();
  });
});
