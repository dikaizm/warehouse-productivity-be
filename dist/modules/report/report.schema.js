"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportExportSchema = exports.reportFilterSchema = void 0;
const zod_1 = require("zod");
// Base validation schema for report filter
const baseReportFilterSchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
            .transform(str => new Date(str)),
        endDate: zod_1.z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
            .transform(str => new Date(str)),
        type: zod_1.z.enum(['daily', 'weekly', 'monthly']).default('daily'),
        search: zod_1.z.string().optional(),
        operatorIds: zod_1.z.string()
            .transform(str => str.split(',').map(id => parseInt(id, 10)))
            .optional(),
        sortBy: zod_1.z.enum(['time', 'operatorName', 'totalItems', 'productivity']).default('time'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
    })
});
// Validation schema for report filter
exports.reportFilterSchema = baseReportFilterSchema;
// Validation schema for report export
exports.reportExportSchema = baseReportFilterSchema.extend({
    query: baseReportFilterSchema.shape.query.extend({
        fileFormat: zod_1.z.enum(['csv', 'pdf']).default('csv'),
        email: zod_1.z.string().email()
    })
});
