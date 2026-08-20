import { api } from './api';
import type { User } from '../types/user.types';

export const adminUserService = {
  list: () => api<{ data: User[] }>('/admin/users'),
  create: (data: { fullName: string; email: string; password: string; role: 'STAFF' | 'ADMIN' | 'SUPER_ADMIN' }) =>
    api<{ data: User }>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { fullName?: string; role?: string }) =>
    api<{ data: User }>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => api<void>(`/admin/users/${id}`, { method: 'DELETE' }),
};

