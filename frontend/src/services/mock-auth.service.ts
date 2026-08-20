import type { User } from '../types/user.types';

const testUsers: Record<string, User> = {
  'student@jusa.test': { id: 'mock-student', fullName: 'JUSA Student', email: 'student@jusa.test', role: 'STUDENT' },
  'organizer@jusa.test': { id: 'mock-organizer', fullName: 'JUSA Organizer', email: 'organizer@jusa.test', role: 'ORGANIZER' },
  'admin@jusa.test': { id: 'mock-admin', fullName: 'JUSA Administrator', email: 'admin@jusa.test', role: 'ADMIN' },
};

export async function mockLogin(email: string, password: string): Promise<{ user: User; token: string }> {
  const user = testUsers[email.toLowerCase()];
  if (!user || password !== 'password123') throw new Error('Invalid email or password. Use a JUSA test account and password123.');
  return { user, token: `mock-token-${user.role.toLowerCase()}` };
}

export const mockCredentials = 'student@jusa.test, organizer@jusa.test, or admin@jusa.test — password123';
