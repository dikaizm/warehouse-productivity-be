import { Router } from 'express';
import { registerHandler, loginHandler, refreshTokenHandler, logoutHandler } from './auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema';
import { authenticateJWT } from '../../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), registerHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.post('/refresh-token', validate(refreshTokenSchema), refreshTokenHandler);

// Protected routes
router.post('/logout', authenticateJWT, logoutHandler);

export default router; 