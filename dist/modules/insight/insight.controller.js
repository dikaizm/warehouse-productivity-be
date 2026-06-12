"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkerPerformanceController = exports.getTrendItemController = exports.getWorkerPresentController = void 0;
const insight_service_1 = require("./insight.service");
const error_middleware_1 = require("../../middleware/error.middleware");
const logger_1 = __importDefault(require("../../utils/logger"));
const getWorkerPresentController = async (req, res, next) => {
    try {
        const result = await (0, insight_service_1.getWorkerPresent)();
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Error in getWorkerPresentController:', error);
        next(error instanceof error_middleware_1.AppError ? error : new error_middleware_1.AppError(500, 'Failed to get worker present data'));
    }
};
exports.getWorkerPresentController = getWorkerPresentController;
const getTrendItemController = async (req, res, next) => {
    try {
        // The dates are already transformed by the validation middleware
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            throw new error_middleware_1.AppError(400, 'Start date and end date are required');
        }
        const result = await (0, insight_service_1.getTrendItem)(new Date(startDate), new Date(endDate));
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Error in getTrendItemController:', error);
        next(error instanceof error_middleware_1.AppError ? error : new error_middleware_1.AppError(500, 'Failed to get trend item data'));
    }
};
exports.getTrendItemController = getTrendItemController;
const getWorkerPerformanceController = async (req, res, next) => {
    try {
        const type = req.query.type;
        const year = req.query.year;
        const result = await (0, insight_service_1.getWorkerPerformance)(type, year);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Error in getWorkerPerformanceController:', error);
        next(error instanceof error_middleware_1.AppError ? error : new error_middleware_1.AppError(500, 'Failed to get worker performance data'));
    }
};
exports.getWorkerPerformanceController = getWorkerPerformanceController;
