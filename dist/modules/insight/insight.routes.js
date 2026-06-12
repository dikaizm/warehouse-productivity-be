"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const insight_controller_1 = require("./insight.controller");
const insight_schema_1 = require("./insight.schema");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticateJWT);
router.get('/worker-present', insight_controller_1.getWorkerPresentController);
router.get('/trend-item', (0, validation_middleware_1.validate)(insight_schema_1.getTrendItemSchema), insight_controller_1.getTrendItemController);
router.get('/worker-performance', (0, validation_middleware_1.validate)(insight_schema_1.getWorkerPerformanceSchema), insight_controller_1.getWorkerPerformanceController);
exports.default = router;
