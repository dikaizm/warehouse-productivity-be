import { Router } from 'express';
import { validate } from '../../middlewares/validation.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import {
  getTodayOverviewHandler,
  getProductivityTrendsHandler,
  getProductivityDetailsHandler,
  getSevenDayTrendHandler,
} from './overview.controller';
import {
  todayOverviewSchema,
  productivityTrendsSchema,
  productivityDetailsSchema,
} from './overview.schema';

const router = Router();

// All routes require authentication
router.use(requireAuth());

// Dashboard endpoints
router.get('/today', validate(todayOverviewSchema), getTodayOverviewHandler);
router.get('/trends', validate(productivityTrendsSchema), getProductivityTrendsHandler);
router.get('/details', validate(productivityDetailsSchema), getProductivityDetailsHandler);
router.get('/seven-day-trend', getSevenDayTrendHandler);

export default router; 