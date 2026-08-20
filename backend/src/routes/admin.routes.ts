import { Router } from 'express';
import * as controller from '../controllers/admin.controller';
import * as votes from '../controllers/vote.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

export const adminRouter = Router();

// Staff, Admin, and Super Admin can enter the admin portal
adminRouter.use(requireAuth, requireRole('ADMIN', 'STAFF'));

// Check-in endpoints accessible by STAFF, ADMIN, and SUPER_ADMIN
adminRouter.post('/check-in/qr', asyncHandler(controller.checkIn));
adminRouter.post('/check-in/manual', asyncHandler(controller.checkIn));
adminRouter.get('/seminars', asyncHandler(controller.listSeminars));

// Admin & Super Admin only endpoints (STAFF is blocked)
adminRouter.get('/dashboard', requireRole('ADMIN'), asyncHandler(controller.dashboard));
adminRouter.post('/seminars', requireRole('ADMIN'), asyncHandler(controller.createSeminar));
adminRouter.patch('/seminars/:id', requireRole('ADMIN'), asyncHandler(controller.updateSeminar));
adminRouter.get('/seminars/:id/participants', requireRole('ADMIN'), asyncHandler(controller.participants));
adminRouter.get('/seminars/:id/export', requireRole('ADMIN'), asyncHandler(controller.exportParticipants));
adminRouter.get('/reports/:seminarId', requireRole('ADMIN'), asyncHandler(controller.report));

adminRouter.get('/votes', requireRole('ADMIN'), asyncHandler(votes.listPolls));
adminRouter.post('/votes', requireRole('ADMIN'), asyncHandler(votes.createPoll));
adminRouter.patch('/votes/:id', requireRole('ADMIN'), asyncHandler(votes.updatePoll));
adminRouter.delete('/votes/:id', requireRole('ADMIN'), asyncHandler(votes.deletePoll));
adminRouter.get('/votes/:id/export', requireRole('ADMIN'), asyncHandler(votes.exportVoteReport));

// Users — ADMIN manages Staff; SUPER_ADMIN manages Admin + Staff
adminRouter.get('/users', requireRole('ADMIN'), asyncHandler(controller.users));
adminRouter.post('/users', requireRole('ADMIN'), asyncHandler(controller.createUser));
adminRouter.patch('/users/:id', requireRole('ADMIN'), asyncHandler(controller.updateUser));
adminRouter.delete('/users/:id', requireRole('ADMIN'), asyncHandler(controller.deleteUser));
