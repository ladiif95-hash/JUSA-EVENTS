export type UserRole = 'STUDENT' | 'ORGANIZER' | 'ADMIN' | 'STAFF' | 'SUPER_ADMIN';
export interface User { id: string; fullName: string; email: string; phone?: string; faculty?: string; department?: string; semester?: string; gender?: string; profilePhoto?: string; role: UserRole; profileComplete?: boolean; }
