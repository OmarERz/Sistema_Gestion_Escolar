import apiClient from './client';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    fullName: string;
  };
}

interface UserResponse {
  id: number;
  username: string;
  fullName: string;
  isActive: boolean;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<{ success: boolean; data: LoginResponse }>(
    '/auth/login',
    { username, password },
  );
  return data.data;
}

export async function getMe(): Promise<UserResponse> {
  const { data } = await apiClient.get<{ success: boolean; data: UserResponse }>('/auth/me');
  return data.data;
}
