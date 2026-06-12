"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recentLogsSchema = exports.trendSchema = void 0;
const zod_1 = require("zod");
// Validation Schemas
exports.trendSchema = zod_1.z.object({
    period: zod_1.z.enum(['daily', 'weekly', 'monthly']),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
exports.recentLogsSchema = zod_1.z.object({
    limit: zod_1.z.number().int().min(1).max(50).default(10)
});
