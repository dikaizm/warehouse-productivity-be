"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_schema_1 = require("./auth.schema");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', (0, validation_middleware_1.validate)(auth_schema_1.registerSchema), auth_controller_1.registerHandler);
router.post('/login', (0, validation_middleware_1.validate)(auth_schema_1.loginSchema), auth_controller_1.loginHandler);
router.post('/refresh-token', (0, validation_middleware_1.validate)(auth_schema_1.refreshTokenSchema), auth_controller_1.refreshTokenHandler);
// Protected routes
router.post('/logout', auth_middleware_1.authenticateJWT, auth_controller_1.logoutHandler);
exports.default = router;
