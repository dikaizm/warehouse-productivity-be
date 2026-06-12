"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutHandler = exports.refreshTokenHandler = exports.loginHandler = exports.registerHandler = void 0;
const auth_service_1 = require("./auth.service");
const error_middleware_1 = require("../../middleware/error.middleware");
const registerHandler = async (req, res) => {
    try {
        const { username, email, password, fullName, roleId, subRoleId } = req.body;
        const user = await (0, auth_service_1.register)({
            username,
            email,
            password,
            fullName,
            roleId,
            subRoleId
        });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: user,
        });
    }
    catch (error) {
        if (error instanceof error_middleware_1.AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }
        // For unexpected errors
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during registration',
        });
    }
};
exports.registerHandler = registerHandler;
const loginHandler = async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;
        const result = await (0, auth_service_1.login)(usernameOrEmail, password);
        res.json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    }
    catch (error) {
        if (error instanceof error_middleware_1.AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login',
        });
    }
};
exports.loginHandler = loginHandler;
const refreshTokenHandler = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required',
            });
        }
        ``;
        const result = await (0, auth_service_1.refreshToken)(token);
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: result,
        });
    }
    catch (error) {
        if (error instanceof error_middleware_1.AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during token refresh',
        });
    }
};
exports.refreshTokenHandler = refreshTokenHandler;
const logoutHandler = async (req, res) => {
    try {
        await (0, auth_service_1.logout)(Number(req.user.id));
        res.json({
            success: true,
            message: 'Logout successful',
        });
    }
    catch (error) {
        if (error instanceof error_middleware_1.AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during logout',
        });
    }
};
exports.logoutHandler = logoutHandler;
