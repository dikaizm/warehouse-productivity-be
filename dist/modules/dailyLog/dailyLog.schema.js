"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyLogStatsSchema = exports.getUserDailyLogsSchema = exports.deleteDailyLogSchema = exports.getDailyLogByIdSchema = exports.getDailyLogsSchema = exports.updateDailyLogSchema = exports.createDailyLogSchema = void 0;
const zod_1 = require("zod");
exports.createDailyLogSchema = zod_1.z.object({
    body: zod_1.z.object({
        logDate: zod_1.z.string({
            required_error: 'logDate is required',
            invalid_type_error: 'logDate must be a valid date string (YYYY-MM-DD)',
        })
            .transform((str) => new Date(str))
            .refine((date) => !isNaN(date.getTime()), {
            message: 'Invalid date format. Please use YYYY-MM-DD',
        }),
        workerPresents: zod_1.z.array(zod_1.z.number({
            required_error: 'Worker ID is required',
            invalid_type_error: 'Worker ID must be a number',
        })
            .int('Worker ID must be an integer')
            .positive('Worker ID must be a positive number')).min(1, 'At least one worker must be present'),
        workNotes: zod_1.z.string().optional(),
        binningSmallType: zod_1.z.number({
            invalid_type_error: 'binningSmallType must be a number',
        })
            .min(0, 'binningSmallType must be a non-negative number')
            .default(0),
        binningFloorType: zod_1.z.number({
            invalid_type_error: 'binningFloorType must be a number',
        })
            .min(0, 'binningFloorType must be a non-negative number')
            .default(0),
        binningHeavyDutyType: zod_1.z.number({
            invalid_type_error: 'binningHeavyDutyType must be a number',
        })
            .min(0, 'binningHeavyDutyType must be a non-negative number')
            .default(0),
        binningCabinetType: zod_1.z.number({
            invalid_type_error: 'binningCabinetType must be a number',
        })
            .min(0, 'binningCabinetType must be a non-negative number')
            .default(0),
        pickingSmallType: zod_1.z.number({
            invalid_type_error: 'pickingSmallType must be a number',
        })
            .min(0, 'pickingSmallType must be a non-negative number')
            .default(0),
        pickingFloorType: zod_1.z.number({
            invalid_type_error: 'pickingFloorType must be a number',
        })
            .min(0, 'pickingFloorType must be a non-negative number')
            .default(0),
        pickingHeavyDutyType: zod_1.z.number({
            invalid_type_error: 'pickingHeavyDutyType must be a number',
        })
            .min(0, 'pickingHeavyDutyType must be a non-negative number')
            .default(0),
        pickingCabinetType: zod_1.z.number({
            invalid_type_error: 'pickingCabinetType must be a number',
        })
            .min(0, 'pickingCabinetType must be a non-negative number')
            .default(0),
    }).refine((data) => {
        const binningTotal = data.binningSmallType + data.binningFloorType + data.binningHeavyDutyType + data.binningCabinetType;
        const pickingTotal = data.pickingSmallType + data.pickingFloorType + data.pickingHeavyDutyType + data.pickingCabinetType;
        return binningTotal > 0 || pickingTotal > 0;
    }, {
        message: 'At least one item type must have a count greater than 0',
        path: ['binningSmallType'],
    }),
});
exports.updateDailyLogSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({
            required_error: 'id is required',
            invalid_type_error: 'id must be a number',
        })
            .transform(Number)
            .pipe(zod_1.z.number().int('id must be an integer').positive('id must be a positive number')),
    }),
    body: zod_1.z.object({
        binningSmallType: zod_1.z.number({
            invalid_type_error: 'binningSmallType must be a number',
        })
            .min(0, 'binningSmallType must be a non-negative number')
            .optional(),
        binningFloorType: zod_1.z.number({
            invalid_type_error: 'binningFloorType must be a number',
        })
            .min(0, 'binningFloorType must be a non-negative number')
            .optional(),
        binningHeavyDutyType: zod_1.z.number({
            invalid_type_error: 'binningHeavyDutyType must be a number',
        })
            .min(0, 'binningHeavyDutyType must be a non-negative number')
            .optional(),
        binningCabinetType: zod_1.z.number({
            invalid_type_error: 'binningCabinetType must be a number',
        })
            .min(0, 'binningCabinetType must be a non-negative number')
            .optional(),
        pickingSmallType: zod_1.z.number({
            invalid_type_error: 'pickingSmallType must be a number',
        })
            .min(0, 'pickingSmallType must be a non-negative number')
            .optional(),
        pickingFloorType: zod_1.z.number({
            invalid_type_error: 'pickingFloorType must be a number',
        })
            .min(0, 'pickingFloorType must be a non-negative number')
            .optional(),
        pickingHeavyDutyType: zod_1.z.number({
            invalid_type_error: 'pickingHeavyDutyType must be a number',
        })
            .min(0, 'pickingHeavyDutyType must be a non-negative number')
            .optional(),
        pickingCabinetType: zod_1.z.number({
            invalid_type_error: 'pickingCabinetType must be a number',
        })
            .min(0, 'pickingCabinetType must be a non-negative number')
            .optional(),
        workerPresents: zod_1.z.array(zod_1.z.number({
            required_error: 'Worker ID is required',
            invalid_type_error: 'Worker ID must be a number',
        })
            .int('Worker ID must be an integer')
            .positive('Worker ID must be a positive number')).min(0, 'At least one worker must be present'),
        workNotes: zod_1.z.string().optional(),
    }),
});
exports.getDailyLogsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string({
            invalid_type_error: 'page must be a number',
        })
            .transform(Number)
            .pipe(zod_1.z.number().min(1, 'page must be at least 1'))
            .default('1'),
        limit: zod_1.z.string({
            invalid_type_error: 'limit must be a number',
        })
            .transform(Number)
            .pipe(zod_1.z.number().min(1, 'limit must be at least 1').max(100, 'limit cannot exceed 100'))
            .default('10'),
        startDate: zod_1.z.string({
            invalid_type_error: 'startDate must be a valid date string (YYYY-MM-DD)',
        })
            .transform((str) => new Date(str))
            .refine((date) => !isNaN(date.getTime()), {
            message: 'Invalid startDate format. Please use YYYY-MM-DD',
        })
            .optional(),
        endDate: zod_1.z.string({
            invalid_type_error: 'endDate must be a valid date string (YYYY-MM-DD)',
        })
            .transform((str) => new Date(str))
            .refine((date) => !isNaN(date.getTime()), {
            message: 'Invalid endDate format. Please use YYYY-MM-DD',
        })
            .optional(),
        userId: zod_1.z.string({
            invalid_type_error: 'userId must be a number',
        })
            .transform(Number)
            .pipe(zod_1.z.number().int('userId must be an integer'))
            .optional(),
        search: zod_1.z.string().optional(),
        sort: zod_1.z.string().optional(),
        direction: zod_1.z.string().optional(),
    }).optional().refine((data) => {
        if (data?.startDate && data?.endDate) {
            return data.startDate <= data.endDate;
        }
        return true;
    }, {
        message: 'startDate must be before or equal to endDate',
        path: ['startDate'],
    }),
});
exports.getDailyLogByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({
            required_error: 'id is required',
            invalid_type_error: 'id must be a number',
        })
            .transform(Number)
            .pipe(zod_1.z.number().int('id must be an integer').positive('id must be a positive number')),
    }),
});
exports.deleteDailyLogSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({
            required_error: 'id is required',
            invalid_type_error: 'id must be a number',
        })
            .transform(Number)
            .pipe(zod_1.z.number().int('id must be an integer').positive('id must be a positive number')),
    }),
});
exports.getUserDailyLogsSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string({
            required_error: 'userId is required',
            invalid_type_error: 'userId must be a number',
        })
            .transform(Number)
            .pipe(zod_1.z.number().int('userId must be an integer').positive('userId must be a positive number')),
    }),
    query: zod_1.z.object({
        page: zod_1.z.string({
            invalid_type_error: 'page must be a number',
        })
            .transform(Number)
            .pipe(zod_1.z.number().min(1, 'page must be at least 1'))
            .default('1'),
        limit: zod_1.z.string({
            invalid_type_error: 'limit must be a number',
        })
            .transform(Number)
            .pipe(zod_1.z.number().min(1, 'limit must be at least 1').max(100, 'limit cannot exceed 100'))
            .default('10'),
        startDate: zod_1.z.string({
            invalid_type_error: 'startDate must be a valid date string (YYYY-MM-DD)',
        })
            .transform((str) => new Date(str))
            .refine((date) => !isNaN(date.getTime()), {
            message: 'Invalid startDate format. Please use YYYY-MM-DD',
        })
            .optional(),
        endDate: zod_1.z.string({
            invalid_type_error: 'endDate must be a valid date string (YYYY-MM-DD)',
        })
            .transform((str) => new Date(str))
            .refine((date) => !isNaN(date.getTime()), {
            message: 'Invalid endDate format. Please use YYYY-MM-DD',
        })
            .optional(),
    }).refine((data) => {
        if (data.startDate && data.endDate) {
            return data.startDate <= data.endDate;
        }
        return true;
    }, {
        message: 'startDate must be before or equal to endDate',
        path: ['startDate'],
    }),
});
exports.getDailyLogStatsSchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.string({
            required_error: 'startDate is required',
            invalid_type_error: 'startDate must be a valid date string (YYYY-MM-DD)',
        })
            .transform((str) => new Date(str))
            .refine((date) => !isNaN(date.getTime()), {
            message: 'Invalid startDate format. Please use YYYY-MM-DD',
        }),
        endDate: zod_1.z.string({
            required_error: 'endDate is required',
            invalid_type_error: 'endDate must be a valid date string (YYYY-MM-DD)',
        })
            .transform((str) => new Date(str))
            .refine((date) => !isNaN(date.getTime()), {
            message: 'Invalid endDate format. Please use YYYY-MM-DD',
        }),
        userId: zod_1.z.string({
            required_error: 'userId is required',
            invalid_type_error: 'userId must be a number',
        })
            .transform(Number)
            .pipe(zod_1.z.number().int('userId must be an integer').positive('userId must be a positive number')),
    }).refine((data) => data.startDate <= data.endDate, {
        message: 'startDate must be before or equal to endDate',
        path: ['startDate'],
    }),
});
