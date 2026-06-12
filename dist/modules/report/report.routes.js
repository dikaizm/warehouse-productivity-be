"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const report_schema_1 = require("./report.schema");
const report_controller_1 = require("./report.controller");
const constants_1 = require("../../config/constants");
const router = (0, express_1.Router)();
// Get report filter data
router.get('/filter', auth_middleware_1.authenticateJWT, (0, validation_middleware_1.validate)(report_schema_1.reportFilterSchema), report_controller_1.getReportData);
// Export report data
router.get('/export', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)([constants_1.ROLES.KEPALA_GUDANG]), (0, validation_middleware_1.validate)(report_schema_1.reportExportSchema), report_controller_1.exportReportData);
exports.default = router;
