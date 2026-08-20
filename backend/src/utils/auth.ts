import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export type TokenUser = { id: string; role: 'STUDENT' | 'ADMIN' | 'STAFF' | 'SUPER_ADMIN' };
export const hashToken = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
export const createQrToken = () => crypto.randomBytes(32).toString('base64url');
export const signToken = (user: TokenUser) => jwt.sign(user, process.env.JWT_SECRET || 'development-only-change-me', { expiresIn: '7d' });
export const verifyToken = (token: string) => jwt.verify(token, process.env.JWT_SECRET || 'development-only-change-me') as TokenUser;
