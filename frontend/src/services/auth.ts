import { api } from '@/lib/api';
import type { User, AuthTokens, LoginCredentials, RegisterData } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const tokens = await api.post<AuthTokens>('/users/login/', credentials);
    api.setAccessToken(tokens.access);
    return tokens;
  },
  
  async register(data: RegisterData): Promise<{ user: User }> {
    return api.post<{ user: User }>('/users/register/', {
      email: data.email,
      username: data.username,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
      firstName: data.firstName,
      lastName: data.lastName,
    });
  },
  
  async refreshToken(refresh: string): Promise<AuthTokens> {
    const tokens = await api.post<AuthTokens>('/users/token/refresh/', { refresh });
    api.setAccessToken(tokens.access);
    return tokens;
  },
  
  async getProfile(): Promise<User> {
    return api.get<User>('/users/profile/');
  },
  
  async updateProfile(data: Partial<User>): Promise<User> {
    return api.patch<User>('/users/profile/', data);
  },
  
  logout() {
    api.setAccessToken(null);
  },
};
