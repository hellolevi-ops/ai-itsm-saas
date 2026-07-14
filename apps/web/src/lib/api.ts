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
  ApiResponse,
} from '@/types/api';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
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

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error.message || '请求失败，请稍后重试';
  }
  return '网络错误，请稍后重试';
}
