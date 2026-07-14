import axios from 'axios';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  GetWorkspacesResponse,
  GetMeResponse,
  AddTicketMessageRequest,
  ApiResponse,
  ChangeTicketStatusRequest,
  CreateTicketRequest,
  CreateTicketResponse,
  ListTicketsResponse,
  TicketDetailResponse,
  TicketMessageResponse,
} from '@/types/api';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

let mockReadyPromise: Promise<void> | null = null;

async function ensureMockReady() {
  if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_ENABLE_MOCK !== 'true') {
    return;
  }

  if (!mockReadyPromise) {
    mockReadyPromise = import('@/mocks/browser').then(({ enableMocking }) => enableMocking());
  }

  await mockReadyPromise;
}

apiClient.interceptors.request.use(async (config) => {
  await ensureMockReady();

  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  async register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data;
  },

  async getMe(): Promise<ApiResponse<GetMeResponse>> {
    const response = await apiClient.get<ApiResponse<GetMeResponse>>('/auth/me');
    return response.data;
  },
};

export const workspaceApi = {
  async create(data: CreateWorkspaceRequest): Promise<ApiResponse<CreateWorkspaceResponse>> {
    const response = await apiClient.post<ApiResponse<CreateWorkspaceResponse>>(
      '/workspaces',
      data,
    );
    return response.data;
  },

  async list(): Promise<ApiResponse<GetWorkspacesResponse>> {
    const response = await apiClient.get<ApiResponse<GetWorkspacesResponse>>('/workspaces');
    return response.data;
  },
};

export const ticketApi = {
  async create(
    workspaceId: string,
    data: CreateTicketRequest,
  ): Promise<ApiResponse<CreateTicketResponse>> {
    const response = await apiClient.post<ApiResponse<CreateTicketResponse>>(
      `/workspaces/${workspaceId}/tickets`,
      data,
    );
    return response.data;
  },

  async list(workspaceId: string): Promise<ApiResponse<ListTicketsResponse>> {
    const response = await apiClient.get<ApiResponse<ListTicketsResponse>>(
      `/workspaces/${workspaceId}/tickets`,
    );
    return response.data;
  },

  async detail(workspaceId: string, ticketId: string): Promise<ApiResponse<TicketDetailResponse>> {
    const response = await apiClient.get<ApiResponse<TicketDetailResponse>>(
      `/workspaces/${workspaceId}/tickets/${ticketId}`,
    );
    return response.data;
  },

  async addMessage(
    workspaceId: string,
    ticketId: string,
    data: AddTicketMessageRequest,
  ): Promise<ApiResponse<TicketMessageResponse>> {
    const response = await apiClient.post<ApiResponse<TicketMessageResponse>>(
      `/workspaces/${workspaceId}/tickets/${ticketId}/messages`,
      data,
    );
    return response.data;
  },

  async changeStatus(
    workspaceId: string,
    ticketId: string,
    data: ChangeTicketStatusRequest,
  ): Promise<ApiResponse<CreateTicketResponse>> {
    const response = await apiClient.post<ApiResponse<CreateTicketResponse>>(
      `/workspaces/${workspaceId}/tickets/${ticketId}/status`,
      data,
    );
    return response.data;
  },
};

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error.message || '请求失败，请稍后重试';
  }
  return '网络错误，请稍后重试';
}
