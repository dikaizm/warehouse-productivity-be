"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentLogs = exports.getTrend = exports.getBarProductivity = exports.getOverviewCounts = void 0;
const overview_service_1 = require("./overview.service");
const overviewService = new overview_service_1.OverviewService();
const getOverviewCounts = async (req, res) => {
    try {
        const data = await overviewService.getOverviewCounts();
        return res.json({
            success: true,
            message: 'Overview counts fetched successfully',
            data: data,
        });
    }
    catch (error) {
        console.error('Error getting overview counts:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.getOverviewCounts = getOverviewCounts;
const getBarProductivity = async (req, res) => {
    try {
        const data = await overviewService.getBarProductivity();
        return res.json({
            success: true,
            message: 'Bar productivity fetched successfully',
            data
        });
    }
    catch (error) {
        console.error('Error calculating bar productivity:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getBarProductivity = getBarProductivity;
const getTrend = async (req, res) => {
    try {
        const data = await overviewService.getTrend();
        return res.json({
            success: true,
            message: 'Trend fetched successfully',
            data: data,
        });
    }
    catch (error) {
        console.error('Error getting trend data:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.getTrend = getTrend;
const getRecentLogs = async (req, res) => {
    try {
        const { limit } = req.query;
        const data = await overviewService.getRecentLogs(Number(limit));
        return res.json({
            success: true,
            message: 'Recent logs fetched successfully',
            data: data,
        });
    }
    catch (error) {
        console.error('Error getting recent logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.getRecentLogs = getRecentLogs;
