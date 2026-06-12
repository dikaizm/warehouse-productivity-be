"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const constants_1 = require("../../config/constants");
const user_controller_1 = require("./user.controller");
const user_schema_1 = require("./user.schema");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.authenticateJWT);
// Get users with optional role filter
// Only kepala_gudang can access this endpoint
router.get('/', (0, auth_middleware_1.authorizeRole)([constants_1.ROLES.KEPALA_GUDANG]), user_controller_1.getUsersController);
router.get('/me', auth_middleware_1.authenticateJWT, user_controller_1.getUserMeController);
// Create new user
// Only kepala_gudang can create users
router.post('/', (0, auth_middleware_1.authorizeRole)([constants_1.ROLES.KEPALA_GUDANG]), (0, validation_middleware_1.validate)(user_schema_1.createUserSchema), user_controller_1.createUserController);
// Update user
// Only kepala_gudang can update users
router.put('/:id', (0, auth_middleware_1.authorizeRole)([constants_1.ROLES.KEPALA_GUDANG]), (0, validation_middleware_1.validate)(user_schema_1.updateUserSchema), user_controller_1.updateUserController);
// Delete user
// Only kepala_gudang can delete users
router.delete('/:id', (0, auth_middleware_1.authorizeRole)([constants_1.ROLES.KEPALA_GUDANG]), user_controller_1.deleteUserController);
exports.default = router;
