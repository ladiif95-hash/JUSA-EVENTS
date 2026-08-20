import type { NextFunction, Request, Response } from 'express';
export const asyncHandler = (handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>) => (request: Request, response: Response, next: NextFunction) => Promise.resolve(handler(request, response, next)).catch(next);
export function errorHandler(error: Error, _request: Request, response: Response, _next: NextFunction) { console.error(error); response.status(500).json({ message: 'Something went wrong. Please try again.' }); }
