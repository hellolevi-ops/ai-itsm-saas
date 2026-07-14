export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  language: string;
  role: 'owner' | 'admin' | 'agent' | 'requester';
  created_at: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface ApiResponse<T> {
  data: T;
  request_id: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  request_id: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface RegisterResponse {
  user: User;
  token: Token;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: Token;
  workspaces: Workspace[];
}

export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
  timezone?: string;
  language?: string;
}

export interface CreateWorkspaceResponse {
  workspace: Workspace;
}

export interface GetWorkspacesResponse {
  workspaces: Workspace[];
}

export interface GetMeResponse {
  user: User;
  workspaces: Workspace[];
}
