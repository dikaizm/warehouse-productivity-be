"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const overview_controller_1 = require("./overview.controller");
const router = (0, express_1.Router)();
router.get('/counts', auth_middleware_1.authenticateJWT, overview_controller_1.getOverviewCounts);
router.get('/bar-productivity', auth_middleware_1.authenticateJWT, overview_controller_1.getBarProductivity);
router.get('/trend', auth_middleware_1.authenticateJWT, overview_controller_1.getTrend);
router.get('/recent-logs', auth_middleware_1.authenticateJWT, (0, validation_middleware_1.validate)(zod_1.z.object({
    limit: zod_1.z.number().int().min(1).max(50).default(10)
})), overview_controller_1.getRecentLogs);
exports.default = router;
