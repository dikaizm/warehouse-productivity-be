"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkerPerformanceSchema = exports.getTrendItemSchema = void 0;
const zod_1 = require("zod");
const date_fns_1 = require("date-fns");
exports.getTrendItemSchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
            .transform(str => (0, date_fns_1.startOfDay)(new Date(str)))
            .default(() => (0, date_fns_1.format)((0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(new Date(), 30)), 'yyyy-MM-dd')),
        endDate: zod_1.z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
            .transform(str => (0, date_fns_1.endOfDay)(new Date(str)))
            .default(() => (0, date_fns_1.format)((0, date_fns_1.endOfDay)(new Date()), 'yyyy-MM-dd'))
    })
});
exports.getWorkerPerformanceSchema = zod_1.z.object({
    query: zod_1.z.object({
        type: zod_1.z.enum(['weekly', 'monthly']),
        year: zod_1.z.string()
            .transform((val) => {
            const num = parseInt(val, 10);
            if (isNaN(num)) {
                throw new Error('Year must be a valid number');
            }
            const currentYear = new Date().getFullYear();
            if (num < 2020 || num > currentYear) {
                throw new Error(`Year must be between 2020 and ${currentYear}`);
            }
            return num;
        })
    })
});
