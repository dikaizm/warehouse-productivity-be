"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const env_1 = __importDefault(require("../config/env"));
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_ACCESS_SECRET);
        // Verify user still exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
                role: true
            }
        });
        if (!user) {
            logger_1.default.warn('Authentication failed: User not found', { userId: decoded.id });
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        // Set req.user with required properties
        req.user = {
            id: user.id,
            username: user.username,
            fullName: user.fullName || '',
            role: user.role.name
        };
        next();
    }
    catch (error) {
        logger_1.default.warn('Authentication failed: Invalid token', { error: error instanceof Error ? error.message : 'Unknown error' });
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};
exports.authenticateJWT = authenticateJWT;
// For backward compatibility
const authorizeRole = (allowedRoles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }
        const role = await prisma.role.findFirst({
            where: { name: req.user.role }
        });
        if (!role) {
            logger_1.default.warn('Authorization failed: Role not found', { role: req.user.role });
            return res.status(403).json({
                success: false,
                message: 'Role not found'
            });
        }
        // Handle new access type check
        if (allowedRoles === 'edit') {
            // After migration, we'll check the editAccess field
            // For now, just check if the role is 'editor'
            if (role.name !== 'editor') {
                logger_1.default.warn('Authorization failed: Insufficient permissions for edit access', {
                    userRole: role.name,
                    requiredAccess: 'edit'
                });
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions for edit access'
                });
            }
        }
        else if (allowedRoles === 'view') {
            // After migration, we'll check the viewAccess field
            // For now, allow any authenticated user
            // No additional checks needed
        }
        else {
            // Handle legacy array of roles check
            if (!allowedRoles.includes(role.name)) {
                logger_1.default.warn('Authorization failed: Insufficient permissions', {
                    userRole: role.name,
                    allowedRoles
                });
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
            }
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
