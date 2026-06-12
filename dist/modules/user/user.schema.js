"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const roleEnum = zod_1.z.enum([constants_1.ROLES.KEPALA_GUDANG, constants_1.ROLES.OPERASIONAL, constants_1.ROLES.ADMIN_LOGISTIK]);
exports.createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(1, 'Full name is required'),
        username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        role: roleEnum
    })
});
exports.updateUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().refine((val) => !isNaN(parseInt(val)), {
            message: 'User ID must be a number'
        })
    }),
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(1, 'Full name is required').optional(),
        username: zod_1.z.string().min(3, 'Username must be at least 3 characters').optional(),
        email: zod_1.z.string().email('Invalid email address').optional(),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters').optional(),
        role: roleEnum.optional()
    }).refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update'
    })
});
