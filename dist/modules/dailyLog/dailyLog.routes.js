"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const dailyLog_controller_1 = require("./dailyLog.controller");
const dailyLog_schema_1 = require("./dailyLog.schema");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticateJWT);
// Create daily log
router.post('/', (0, validation_middleware_1.validate)(dailyLog_schema_1.createDailyLogSchema), dailyLog_controller_1.createDailyLogController);
// Update daily log
router.put('/:id', (0, validation_middleware_1.validate)(dailyLog_schema_1.updateDailyLogSchema), dailyLog_controller_1.updateDailyLogController);
// Get specific daily log
router.get('/:id', (0, validation_middleware_1.validate)(dailyLog_schema_1.getDailyLogByIdSchema), dailyLog_controller_1.getDailyLogByIdController);
// Delete daily log
router.delete('/:id', (0, validation_middleware_1.validate)(dailyLog_schema_1.deleteDailyLogSchema), dailyLog_controller_1.deleteDailyLogController);
// Get all daily logs with pagination and filters
router.get('/', (0, validation_middleware_1.validate)(dailyLog_schema_1.getDailyLogsSchema), dailyLog_controller_1.getDailyLogsController);
// // Get user's daily logs
// router.get('/user/:userId', validate(getUserDailyLogsSchema), getUserDailyLogsController);
exports.default = router;
