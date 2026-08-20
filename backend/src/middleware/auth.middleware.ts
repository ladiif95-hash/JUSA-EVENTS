import type { NextFunction, Request, Response } from 'express';
import { verifyToken, type TokenUser } from '../utils/auth';

declare global { namespace Express { interface Request { user?: TokenUser; } } }
export function requireAuth(request: Request, response: Response, next: NextFunction) { try { const token = request.header('Authorization')?.replace('Bearer ', ''); if (!token) return response.status(401).json({ message: 'Authentication required' }); request.user = verifyToken(token); next(); } catch { return response.status(401).json({ message: 'Invalid or expired token' }); } }
export function optionalAuth(request: Request, _response: Response, next: NextFunction) {
  try {
    const token = request.header('Authorization')?.replace('Bearer ', '');
    if (token) request.user = verifyToken(token);
  } catch { /* guests can still view live results */ }
  next();
}
export const requireRole = (...roles: TokenUser['role'][]) => (request: Request, response: Response, next: NextFunction) => {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' });
  if (request.user.role === 'SUPER_ADMIN' || roles.includes(request.user.role)) return next();
  return response.status(403).json({ message: 'Insufficient permissions' });
};
