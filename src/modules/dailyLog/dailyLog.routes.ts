import { Router } from 'express';
import { validate } from '../../middleware/validation.middleware';
import {
  createDailyLogController,
  updateDailyLogController,
  getDailyLogsController,
  getDailyLogByIdController,
  deleteDailyLogController,
  getUserDailyLogsController,
  getDailyLogStatsController,
} from './dailyLog.controller';
import {
  createDailyLogSchema,
  updateDailyLogSchema,
  getDailyLogsSchema,
  getDailyLogByIdSchema,
  deleteDailyLogSchema,
  getUserDailyLogsSchema,
  getDailyLogStatsSchema,
} from './dailyLog.schema';
import { authenticateJWT } from '../../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Create daily log
router.post('/', validate(createDailyLogSchema), createDailyLogController);

// Update daily log
router.put('/:id', validate(updateDailyLogSchema), updateDailyLogController);

// Get all daily logs with pagination and filters
router.get('/', validate(getDailyLogsSchema), getDailyLogsController);

// Get daily log statistics
router.get('/stats', validate(getDailyLogStatsSchema), getDailyLogStatsController);

// Get user's daily logs
router.get('/user/:userId', validate(getUserDailyLogsSchema), getUserDailyLogsController);

// Get specific daily log
router.get('/:id', validate(getDailyLogByIdSchema), getDailyLogByIdController);

// Delete daily log
router.delete('/:id', validate(deleteDailyLogSchema), deleteDailyLogController);

export default router; 