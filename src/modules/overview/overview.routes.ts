import { Router } from 'express';
import { z } from 'zod';
import { authenticateJWT } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { getOverviewCounts, getBarProductivity, getTrend, getRecentLogs } from './overview.controller';

const router = Router();

router.get('/counts',
  authenticateJWT,
  getOverviewCounts
);

router.get('/bar-productivity',
  authenticateJWT,
  getBarProductivity
);

router.get('/trend',
  authenticateJWT,
  getTrend
);

router.get('/recent-logs',
  authenticateJWT,
  validate(z.object({
    limit: z.number().int().min(1).max(50).default(10)
  })),
  getRecentLogs
);

export default router; 