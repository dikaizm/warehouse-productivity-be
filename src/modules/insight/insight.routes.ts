import { Router } from 'express';
import { validate } from '../../middleware/validation.middleware';
import { authenticateJWT } from '../../middleware/auth.middleware';
import {
  getWorkerPresentController,
  getTrendItemController,
  getWorkerPerformanceController
} from './insight.controller';
import {
  getTrendItemSchema,
  getWorkerPerformanceSchema
} from './insight.schema';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.get('/worker-present', getWorkerPresentController);
router.get('/trend-item', validate(getTrendItemSchema), getTrendItemController);
router.get('/worker-performance', validate(getWorkerPerformanceSchema), getWorkerPerformanceController);

export default router;