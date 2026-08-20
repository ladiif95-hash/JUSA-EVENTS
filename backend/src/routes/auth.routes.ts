import { Router } from 'express';
import * as controller from '../controllers/auth.controller';
import { asyncHandler } from '../middleware/error.middleware';
import { requireAuth } from '../middleware/auth.middleware';
export const authRouter = Router();
authRouter.post('/register', asyncHandler(controller.register)); authRouter.post('/login', asyncHandler(controller.login)); authRouter.get('/google', controller.googleStart); authRouter.get('/google/callback', asyncHandler(controller.googleCallback)); authRouter.post('/forgot-password', asyncHandler(controller.forgotPassword)); authRouter.post('/reset-password', asyncHandler(controller.resetPassword)); authRouter.get('/me', requireAuth, asyncHandler(controller.me));
