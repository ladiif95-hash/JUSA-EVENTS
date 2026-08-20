import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import * as controller from '../controllers/vote.controller';

export const voteRouter = Router();
voteRouter.get('/current', optionalAuth, asyncHandler(controller.currentPoll));
voteRouter.post('/:pollId/cast', requireAuth, asyncHandler(controller.castVote));
