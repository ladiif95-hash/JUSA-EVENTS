import type { UserRole } from '../types/user.types';

export function roleRedirect(role: UserRole): string {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return '/admin/dashboard';
  if (role === 'STAFF') return '/admin/check-in';
  if (role === 'ORGANIZER') return '/organizer/dashboard';
  return '/';
}
