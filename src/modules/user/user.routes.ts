import { Router } from 'express';
import { validate } from '../../middleware/validation.middleware';
import { authenticateJWT, authorizeRole } from '../../middleware/auth.middleware';
import { ROLES } from '../../config/constants';
import {
  getUsersController,
  createUserController,
  updateUserController,
  deleteUserController,
  getUserMeController
} from './user.controller';
import { createUserSchema, updateUserSchema } from './user.schema';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Get users with optional role filter
// Only kepala_gudang can access this endpoint
router.get(
  '/',
  authorizeRole([ROLES.KEPALA_GUDANG]),
  getUsersController
);

router.get(
  '/me',
  authenticateJWT,
  getUserMeController
);

// Create new user
// Only kepala_gudang can create users
router.post(
  '/',
  authorizeRole([ROLES.KEPALA_GUDANG]),
  validate(createUserSchema),
  createUserController
);

// Update user
// Only kepala_gudang can update users
router.put(
  '/:id',
  authorizeRole([ROLES.KEPALA_GUDANG]),
  validate(updateUserSchema),
  updateUserController
);

// Delete user
// Only kepala_gudang can delete users
router.delete(
  '/:id',
  authorizeRole([ROLES.KEPALA_GUDANG]),
  deleteUserController
);

export default router;