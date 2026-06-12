"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyLogStatsController = exports.getUserDailyLogsController = exports.deleteDailyLogController = exports.getDailyLogByIdController = exports.getDailyLogsController = exports.updateDailyLogController = exports.createDailyLogController = void 0;
const dailyLog_service_1 = require("./dailyLog.service");
const error_middleware_1 = require("../../middleware/error.middleware");
const client_1 = require("@prisma/client");
const constants_1 = require("../../config/constants");
const prisma = new client_1.PrismaClient();
const createDailyLogController = async (req, res) => {
    try {
        const { logDate, workerPresents, workNotes, binningSmallType = 0, binningFloorType = 0, binningHeavyDutyType = 0, binningCabinetType = 0, pickingSmallType = 0, pickingFloorType = 0, pickingHeavyDutyType = 0, pickingCabinetType = 0 } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            throw new error_middleware_1.AppError(401, 'Unauthorized');
        }
        // Verify user has permission to create logs
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });
        if (!user) {
            throw new error_middleware_1.AppError(404, 'User not found');
        }
        // Only editors can create logs for multiple workers
        if (workerPresents.length > 1 && user.role.name !== constants_1.ROLES.KEPALA_GUDANG) {
            throw new error_middleware_1.AppError(403, 'Only editors can create logs for multiple workers');
        }
        const dailyLog = await (0, dailyLog_service_1.createDailyLog)(new Date(logDate), workerPresents, workNotes, binningSmallType, binningFloorType, binningHeavyDutyType, binningCabinetType, pickingSmallType, pickingFloorType, pickingHeavyDutyType, pickingCabinetType);
        res.status(201).json({
            success: true,
            message: 'Daily log created successfully',
            data: dailyLog
        });
    }
    catch (error) {
        if (error instanceof error_middleware_1.AppError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        else {
            console.error('Create daily log error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};
exports.createDailyLogController = createDailyLogController;
const updateDailyLogController = async (req, res) => {
    try {
        const { id } = req.params;
        const { binningSmallType = 0, binningFloorType = 0, binningHeavyDutyType = 0, binningCabinetType = 0, pickingSmallType = 0, pickingFloorType = 0, pickingHeavyDutyType = 0, pickingCabinetType = 0, workerPresents, workNotes } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            throw new error_middleware_1.AppError(401, 'Unauthorized');
        }
        const logId = parseInt(id);
        if (isNaN(logId)) {
            throw new error_middleware_1.AppError(400, 'Invalid log ID');
        }
        const dailyLog = await (0, dailyLog_service_1.updateDailyLog)(logId, userId, binningSmallType, binningFloorType, binningHeavyDutyType, binningCabinetType, pickingSmallType, pickingFloorType, pickingHeavyDutyType, pickingCabinetType, workerPresents, workNotes);
        res.status(200).json({
            success: true,
            message: 'Daily log updated successfully',
            data: dailyLog
        });
    }
    catch (error) {
        if (error instanceof error_middleware_1.AppError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};
exports.updateDailyLogController = updateDailyLogController;
const getDailyLogsController = async (req, res) => {
    const { page = 1, limit = 10, startDate, endDate, search, sort, direction } = req.query;
    const logs = await (0, dailyLog_service_1.getDailyLogs)(Number(page), Number(limit), startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, search, sort, direction);
    res.json({
        success: true,
        data: logs
    });
};
exports.getDailyLogsController = getDailyLogsController;
const getDailyLogByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const logId = parseInt(id);
        if (isNaN(logId)) {
            throw new error_middleware_1.AppError(400, 'Invalid log ID');
        }
        const dailyLog = await (0, dailyLog_service_1.getDailyLogById)(logId);
        res.status(200).json({
            success: true,
            data: dailyLog
        });
    }
    catch (error) {
        if (error instanceof error_middleware_1.AppError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};
exports.getDailyLogByIdController = getDailyLogByIdController;
const deleteDailyLogController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const logId = parseInt(id);
        if (!userId) {
            throw new error_middleware_1.AppError(401, 'Unauthorized');
        }
        if (isNaN(logId)) {
            throw new error_middleware_1.AppError(400, 'Invalid log ID');
        }
        const result = await (0, dailyLog_service_1.deleteDailyLog)(logId, userId);
        res.status(200).json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        if (error instanceof error_middleware_1.AppError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};
exports.deleteDailyLogController = deleteDailyLogController;
const getUserDailyLogsController = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = '1', limit = '10', startDate, endDate } = req.query;
        // Validate user ID
        const targetUserId = parseInt(userId);
        if (isNaN(targetUserId)) {
            throw new error_middleware_1.AppError(400, 'Invalid user ID');
        }
        // Validate pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
            throw new error_middleware_1.AppError(400, 'Invalid pagination parameters');
        }
        // Validate date range if provided
        if ((startDate && !endDate) || (!startDate && endDate)) {
            throw new error_middleware_1.AppError(400, 'Both startDate and endDate must be provided for date filtering');
        }
        const result = await (0, dailyLog_service_1.getUserDailyLogs)(targetUserId, pageNum, limitNum, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        if (error instanceof error_middleware_1.AppError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};
exports.getUserDailyLogsController = getUserDailyLogsController;
const getDailyLogStatsController = async (req, res) => {
    try {
        const { startDate, endDate, userId } = req.query;
        if (!startDate || !endDate || !userId) {
            throw new error_middleware_1.AppError(400, 'startDate, endDate, and userId are required');
        }
        const stats = await (0, dailyLog_service_1.getDailyLogStats)(new Date(startDate), new Date(endDate), Number(userId));
        res.status(200).json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        if (error instanceof error_middleware_1.AppError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};
exports.getDailyLogStatsController = getDailyLogStatsController;
