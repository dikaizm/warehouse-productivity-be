"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const jwt_1 = require("../../utils/jwt");
const error_middleware_1 = require("../../middleware/error.middleware");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prismaClient = new client_1.PrismaClient();
const registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    fullName: zod_1.z.string().min(2).max(100),
    roleId: zod_1.z.number().int().positive(),
    subRoleId: zod_1.z.number().int().positive()
});
const register = async (data) => {
    // Check if username already exists
    const existingUser = await prismaClient.user.findFirst({
        where: {
            OR: [
                { username: data.username },
                { email: data.email }
            ]
        },
    });
    if (existingUser) {
        throw new error_middleware_1.AppError(409, 'Username or email already exists');
    }
    // Hash password
    const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
    const role = await prismaClient.role.findUnique({
        where: {
            id: data.roleId
        }
    });
    if (!role) {
        throw new error_middleware_1.AppError(404, 'Role not found');
    }
    // Create user with role
    const user = await prismaClient.user.create({
        data: {
            username: data.username,
            email: data.email,
            passwordHash: hashedPassword,
            fullName: data.fullName,
            roleId: data.roleId,
            subRoleId: data.subRoleId,
            isActive: true,
        },
        include: {
            role: true,
            subRole: true
        }
    });
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role.name,
        subRole: user.subRole.name
    };
};
exports.register = register;
const login = async (usernameOrEmail, password) => {
    // Find user by username or email
    const user = await prisma_1.default.user.findFirst({
        where: {
            OR: [
                { username: usernameOrEmail },
                { email: usernameOrEmail }
            ]
        },
        include: {
            role: true
        },
    });
    if (!user) {
        throw new error_middleware_1.AppError(401, 'Invalid credentials');
    }
    // Verify password
    const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isValidPassword) {
        throw new error_middleware_1.AppError(401, 'Invalid credentials');
    }
    // Generate tokens
    const accessToken = (0, jwt_1.generateAccessToken)({
        id: user.id,
        username: user.username,
        role: user.role.name
    });
    const refreshToken = (0, jwt_1.generateRefreshToken)({
        id: user.id,
        username: user.username
    });
    return {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role.name,
        },
        accessToken,
        refreshToken,
    };
};
exports.login = login;
const refreshToken = async (token) => {
    try {
        // Verify refresh token
        const payload = await (0, jwt_1.verifyRefreshToken)(token);
        // Find user
        const user = await prisma_1.default.user.findUnique({
            where: { id: payload.id },
            include: {
                role: true
            },
        });
        if (!user) {
            throw new error_middleware_1.AppError(401, 'Invalid refresh token');
        }
        // Generate new tokens
        const accessToken = (0, jwt_1.generateAccessToken)({
            id: user.id,
            username: user.username,
            role: user.role.name
        });
        const newRefreshToken = (0, jwt_1.generateRefreshToken)({ id: user.id, username: user.username });
        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }
    catch (error) {
        throw new error_middleware_1.AppError(401, 'Invalid refresh token');
    }
};
exports.refreshToken = refreshToken;
const logout = async (userId) => {
    // In a real application, you might want to invalidate the refresh token
    // or add it to a blacklist. For now, we'll just return success.
    return true;
};
exports.logout = logout;
