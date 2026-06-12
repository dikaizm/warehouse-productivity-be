"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkerPerformance = exports.getTrendItem = exports.getWorkerPresent = void 0;
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const constants_1 = require("../../config/constants");
const logger_1 = __importDefault(require("../../utils/logger"));
const trend_cache_util_1 = require("../../utils/trend-cache.util");
const prisma = new client_1.PrismaClient();
const getWorkerPresent = async () => {
    const dailyLog = await prisma.dailyLog.findMany({
        include: {
            attendance: true
        }
    });
    if (!dailyLog) {
        return {
            present: 0,
            absent: 0,
            total: 0,
            presentPercentage: 0,
            absentPercentage: 0
        };
    }
    const totalWorkers = await prisma.user.count({
        where: {
            role: {
                name: constants_1.ROLES.OPERASIONAL
            }
        }
    });
    let present = 0;
    let absent = 0;
    for (const log of dailyLog) {
        const presentCount = log.attendance.length;
        const absentCount = totalWorkers - presentCount;
        present += presentCount;
        absent += absentCount;
    }
    const totalAttendance = present + absent;
    return {
        present,
        absent,
        total: totalAttendance,
        presentPercentage: (present / totalAttendance) * 100,
        absentPercentage: (absent / totalAttendance) * 100
    };
};
exports.getWorkerPresent = getWorkerPresent;
const getTrendItem = async (startDate, endDate) => {
    try {
        // Try to get from cache first
        let trendData;
        let lastUpdated;
        try {
            const cachedTrendData = await (0, trend_cache_util_1.getTrendData)(startDate, endDate);
            trendData = cachedTrendData.data.map(point => ({
                date: new Date(point.date), // Convert ISO string to Date
                binningCount: point.binningCount,
                pickingCount: point.pickingCount,
                totalItems: point.totalItems
            }));
            lastUpdated = cachedTrendData.lastUpdated;
        }
        catch (cacheError) {
            logger_1.default.warn('Cache unavailable, falling back to database:', cacheError);
            // Get logs from database
            const logs = await prisma.dailyLog.findMany({
                where: {
                    logDate: {
                        gte: (0, date_fns_1.startOfDay)(startDate),
                        lte: (0, date_fns_1.endOfDay)(endDate)
                    }
                },
                select: {
                    logDate: true,
                    binningCount: true,
                    pickingCount: true,
                    totalItems: true
                },
                orderBy: {
                    logDate: 'asc'
                }
            });
            // Create a map of logs for easy lookup by date
            const logMap = new Map(logs.map(log => [
                (0, date_fns_1.format)(log.logDate, 'yyyy-MM-dd'),
                {
                    binningCount: log.binningCount || 0,
                    pickingCount: log.pickingCount || 0,
                    totalItems: log.totalItems || 0
                }
            ]));
            // Create data points for each day in the range
            trendData = (0, date_fns_1.eachDayOfInterval)({ start: (0, date_fns_1.startOfDay)(startDate), end: (0, date_fns_1.endOfDay)(endDate) }).map(date => {
                const dateKey = (0, date_fns_1.format)(date, 'yyyy-MM-dd');
                const log = logMap.get(dateKey);
                return {
                    date, // Use the Date object directly
                    binningCount: log?.binningCount || 0,
                    pickingCount: log?.pickingCount || 0,
                    totalItems: log?.totalItems || 0
                };
            });
            lastUpdated = new Date().toISOString();
        }
        return {
            data: trendData,
            period: {
                startDate,
                endDate
            },
            lastUpdated
        };
    }
    catch (error) {
        logger_1.default.error('Error in getTrendItem:', error);
        throw error;
    }
};
exports.getTrendItem = getTrendItem;
const getWorkerPerformance = async (type, year) => {
    const startDate = (0, date_fns_1.startOfYear)(new Date(year));
    const endDate = (0, date_fns_1.endOfYear)(new Date(year));
    // First, get all operational users
    const operationalUsers = await prisma.user.findMany({
        where: {
            role: {
                name: constants_1.ROLES.OPERASIONAL
            }
        },
        select: {
            id: true,
            fullName: true
        }
    });
    // Create a map of all operational users for easy lookup
    const allOperators = new Map(operationalUsers.map(user => [
        user.id,
        {
            operatorId: user.id,
            operatorName: user.fullName || 'Unknown'
        }
    ]));
    const logs = await prisma.dailyLog.findMany({
        where: {
            logDate: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            attendance: {
                include: {
                    operator: {
                        select: {
                            id: true,
                            fullName: true
                        }
                    }
                }
            }
        },
        orderBy: {
            logDate: 'asc'
        }
    });
    // Group logs by time point (week or month)
    const timePointGroups = new Map();
    logs.forEach(log => {
        let timePoint;
        if (type === 'weekly') {
            const weekNum = (0, date_fns_1.getWeekOfMonth)(log.logDate);
            const monthName = (0, date_fns_1.format)(log.logDate, 'MMM');
            timePoint = `${monthName} W${weekNum}`;
        }
        else {
            timePoint = (0, date_fns_1.format)(log.logDate, 'MMM');
        }
        if (!timePointGroups.has(timePoint)) {
            timePointGroups.set(timePoint, []);
        }
        timePointGroups.get(timePoint).push(log);
    });
    // Calculate metrics for each time point
    const metrics = Array.from(timePointGroups.entries()).map(([timePoint, timePointLogs]) => {
        // Group logs by operator for this time point
        const operatorMetrics = new Map();
        // Initialize metrics for all operators with empty productivity arrays
        allOperators.forEach((operator) => {
            operatorMetrics.set(operator.operatorId, {
                operatorId: operator.operatorId,
                operatorName: operator.operatorName,
                dailyProductivities: []
            });
        });
        // Calculate daily productivity for each log in this time point
        timePointLogs.forEach(log => {
            const presentWorkers = log.attendance.length;
            if (presentWorkers === 0)
                return;
            const totalItems = log.totalItems ?? 0;
            const dailyProductivity = totalItems / presentWorkers;
            // Update metrics for each present operator
            log.attendance.forEach(attendance => {
                const operator = attendance.operator;
                const operatorMetric = operatorMetrics.get(operator.id);
                if (operatorMetric) {
                    operatorMetric.dailyProductivities.push(dailyProductivity);
                }
            });
        });
        // Calculate average productivity for each operator in this time point
        const data = Array.from(operatorMetrics.values())
            .map((metric) => ({
            operatorId: metric.operatorId,
            operatorName: metric.operatorName,
            value: metric.dailyProductivities.length > 0
                ? Math.round(metric.dailyProductivities.reduce((sum, val) => sum + val, 0) /
                    metric.dailyProductivities.length)
                : 0 // Zero productivity for operators with no attendance
        }))
            .sort((a, b) => b.value - a.value); // Sort by productivity descending
        return {
            timePoint,
            data
        };
    });
    // Sort time points chronologically
    metrics.sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const [aMonth, aWeek] = a.timePoint.split(' ');
        const [bMonth, bWeek] = b.timePoint.split(' ');
        const monthDiff = months.indexOf(aMonth) - months.indexOf(bMonth);
        if (monthDiff !== 0)
            return monthDiff;
        if (type === 'weekly') {
            return parseInt(aWeek.slice(1)) - parseInt(bWeek.slice(1));
        }
        return 0;
    });
    return {
        year,
        type,
        metrics
    };
};
exports.getWorkerPerformance = getWorkerPerformance;
