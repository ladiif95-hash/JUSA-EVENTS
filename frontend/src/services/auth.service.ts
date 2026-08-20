import { api } from './api'; import { mockLogin } from './mock-auth.service'; import type { User } from '../types/user.types';
type LoginResponse = { user: User; token: string };
async function login(email: string, password: string): Promise<LoginResponse> {
  // Mock credentials create a fake token that the real API correctly rejects.
  // Only use them when mock mode has been deliberately enabled.
  if (import.meta.env.VITE_USE_MOCK_AUTH === 'true') return mockLogin(email, password);
  return api<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}
export const authService = { login, register: (fullName: string, email: string, password: string, phone: string) => api<LoginResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ fullName, email, password, phone }) }), me: () => api<{ user: User }>('/auth/me'), profile: () => api<{ data: User }>('/profile'), updateProfile: (data: Partial<User>) => api<{ data: User }>('/profile', { method: 'PATCH', body: JSON.stringify(data) }) };
