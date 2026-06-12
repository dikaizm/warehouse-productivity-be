"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserController = exports.updateUserController = exports.createUserController = exports.getUserMeController = exports.getUsersController = void 0;
const user_service_1 = require("./user.service");
const error_1 = require("../../utils/error");
const logger_1 = __importDefault(require("../../utils/logger"));
const getUsersController = async (req, res, next) => {
    try {
        const role = req.query.role;
        const result = await (0, user_service_1.getUsers)(role);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Error in getUsersController:', error);
        next(error instanceof error_1.AppError ? error : new error_1.AppError('Failed to get users', 500));
    }
};
exports.getUsersController = getUsersController;
const getUserMeController = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            throw new error_1.AppError('User not found', 404);
        }
        const result = await (0, user_service_1.getUserById)(user.id);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Error in getUserMeController:', error);
        next(error instanceof error_1.AppError ? error : new error_1.AppError('Failed to get user me', 500));
    }
};
exports.getUserMeController = getUserMeController;
const createUserController = async (req, res, next) => {
    try {
        const result = await (0, user_service_1.createUser)(req.body);
        res.status(201).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Error in createUserController:', error);
        next(error instanceof error_1.AppError ? error : new error_1.AppError('Failed to create user', 500));
    }
};
exports.createUserController = createUserController;
const updateUserController = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new error_1.AppError('Invalid user ID', 400);
        }
        const result = await (0, user_service_1.updateUser)(id, req.body);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Error in updateUserController:', error);
        next(error instanceof error_1.AppError ? error : new error_1.AppError('Failed to update user', 500));
    }
};
exports.updateUserController = updateUserController;
const deleteUserController = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new error_1.AppError('Invalid user ID', 400);
        }
        await (0, user_service_1.deleteUser)(id);
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error in deleteUserController:', error);
        next(error instanceof error_1.AppError ? error : new error_1.AppError('Failed to delete user', 500));
    }
};
exports.deleteUserController = deleteUserController;
