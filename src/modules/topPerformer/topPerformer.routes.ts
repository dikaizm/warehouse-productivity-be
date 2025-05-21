import { Router } from 'express';
import { getTopPerformersController } from './topPerformer.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getTopPerformersController);

export default router;