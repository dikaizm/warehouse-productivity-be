"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const overview_routes_1 = __importDefault(require("../modules/overview/overview.routes"));
const router = (0, express_1.Router)();
// Auth Routes
const registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    roleId: zod_1.z.number().int().positive()
});
const loginSchema = zod_1.z.object({
    username: zod_1.z.string(),
    password: zod_1.z.string()
});
router.post('/auth/register', (0, validation_1.validateRequest)(registerSchema));
router.post('/auth/login', (0, validation_1.validateRequest)(loginSchema));
router.post('/auth/refresh');
// Daily Log Routes
const dailyLogCreateSchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    binning: zod_1.z.number().int().min(0),
    picking: zod_1.z.number().int().min(0),
    presentOperatorIds: zod_1.z.array(zod_1.z.number().int().positive()),
    notes: zod_1.z.string().optional()
});
const dailyLogUpdateSchema = dailyLogCreateSchema.partial();
router.post('/daily-log', auth_1.authenticateJWT, (0, auth_1.authorizeRole)('edit'), (0, validation_1.validateRequest)(dailyLogCreateSchema));
router.get('/daily-log', auth_1.authenticateJWT, (0, validation_1.validateRequest)(zod_1.z.object({
    operator: zod_1.z.number().int().positive().optional(),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    search: zod_1.z.string().optional(),
    sort: zod_1.z.enum(['date', 'totalItems', 'binning', 'picking']).optional(),
    order: zod_1.z.enum(['asc', 'desc']).default('desc')
})));
router.patch('/daily-log/:id', auth_1.authenticateJWT, (0, auth_1.authorizeRole)(['editor']), (0, validation_1.validateRequest)(dailyLogUpdateSchema));
router.delete('/daily-log/:id', auth_1.authenticateJWT, (0, auth_1.authorizeRole)(['editor']));
// Insights Routes
router.get('/insights/attendance-pie', auth_1.authenticateJWT, (0, validation_1.validateRequest)(zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})));
router.get('/insights/binning-vs-picking', auth_1.authenticateJWT, (0, validation_1.validateRequest)(zod_1.z.object({
    from: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})));
router.get('/insights/operator-performance', auth_1.authenticateJWT, (0, validation_1.validateRequest)(zod_1.z.object({
    period: zod_1.z.enum(['weekly', 'monthly'])
})));
// Top Performers Route
router.get('/top-performers', auth_1.authenticateJWT, (0, validation_1.validateRequest)(zod_1.z.object({
    month: zod_1.z.string().regex(/^\d{4}-\d{2}$/)
})));
// Reports Routes
const reportGenerateSchema = zod_1.z.object({
    operatorId: zod_1.z.number().int().positive().optional(),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: zod_1.z.enum(['daily', 'weekly', 'monthly'])
});
router.post('/reports', auth_1.authenticateJWT, (0, validation_1.validateRequest)(reportGenerateSchema));
router.get('/reports/history', auth_1.authenticateJWT, (0, validation_1.validateRequest)(zod_1.z.object({
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(10)
})));
// Settings Routes
router.get('/settings', auth_1.authenticateJWT);
router.patch('/settings', auth_1.authenticateJWT, (0, auth_1.authorizeRole)(['editor']), (0, validation_1.validateRequest)(zod_1.z.object({
    workSchedule: zod_1.z.array(zod_1.z.object({
        dayOfWeek: zod_1.z.number().int().min(1).max(7),
        isWorkday: zod_1.z.boolean()
    })),
    productivityTarget: zod_1.z.number().int().positive()
})));
// User Management Routes
const userCreateSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    roleId: zod_1.z.number().int().positive(),
    isActive: zod_1.z.boolean().default(true)
});
const userUpdateSchema = userCreateSchema.partial().omit({ password: true });
router.post('/users', auth_1.authenticateJWT, (0, auth_1.authorizeRole)(['editor']), (0, validation_1.validateRequest)(userCreateSchema));
router.get('/users', auth_1.authenticateJWT, (0, validation_1.validateRequest)(zod_1.z.object({
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(10),
    role: zod_1.z.number().int().positive().optional(),
    isActive: zod_1.z.boolean().optional()
})));
router.patch('/users/:id', auth_1.authenticateJWT, (0, auth_1.authorizeRole)(['editor']), (0, validation_1.validateRequest)(userUpdateSchema));
router.delete('/users/:id', auth_1.authenticateJWT, (0, auth_1.authorizeRole)(['editor']));
// Overview Routes
router.use('/overview', overview_routes_1.default);
exports.default = router;
