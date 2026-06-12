"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyLogStats = exports.getUserDailyLogs = exports.deleteDailyLog = exports.getDailyLogById = exports.getDailyLogs = exports.updateDailyLog = exports.createDailyLog = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../../middleware/error.middleware");
const redis_1 = require("../../config/redis");
const constants_1 = require("../../config/constants");
const logger_1 = __importDefault(require("../../utils/logger"));
const trend_cache_util_1 = require("../../utils/trend-cache.util");
const prisma = new client_1.PrismaClient();
const createDailyLog = async (logDate, workerPresentIds, workNotes, binningSmallType = 0, binningFloorType = 0, binningHeavyDutyType = 0, binningCabinetType = 0, pickingSmallType = 0, pickingFloorType = 0, pickingHeavyDutyType = 0, pickingCabinetType = 0) => {
    // Validate date is not in the future
    if (logDate > new Date()) {
        throw new error_middleware_1.AppError(400, 'Cannot create log for future dates');
    }
    // Check if log already exists for this date
    const existingLog = await prisma.dailyLog.findUnique({
        where: { logDate },
        include: {
            attendance: true
        }
    });
    if (existingLog) {
        throw new error_middleware_1.AppError(409, 'Daily log already exists for this date');
    }
    // Verify all workers exist and have appropriate roles
    const workers = await prisma.user.findMany({
        where: {
            id: { in: workerPresentIds },
            role: {
                name: { in: [constants_1.ROLES.OPERASIONAL] }
            }
        },
        include: {
            role: true,
            subRole: true
        }
    });
    if (workers.length !== workerPresentIds.length) {
        throw new error_middleware_1.AppError(400, 'One or more workers not found or do not have appropriate roles');
    }
    const binningCount = binningSmallType + binningFloorType + binningHeavyDutyType + binningCabinetType;
    const pickingCount = pickingSmallType + pickingFloorType + pickingHeavyDutyType + pickingCabinetType;
    const totalItems = binningCount + pickingCount;
    // Create daily log and attendance records in a transaction
    const dailyLog = await prisma.$transaction(async (tx) => {
        // Create the daily log first
        const log = await tx.dailyLog.create({
            data: {
                logDate,
                binningCount,
                pickingCount,
                binningSmallType,
                binningFloorType,
                binningHeavyDutyType,
                binningCabinetType,
                pickingSmallType,
                pickingFloorType,
                pickingHeavyDutyType,
                pickingCabinetType,
                totalItems,
                issueNotes: workNotes
            }
        });
        // Create attendance records for all present workers
        await Promise.all(workerPresentIds.map(operatorId => tx.attendance.create({
            data: {
                dailyLogId: log.id,
                operatorId,
            }
        })));
        // Fetch the complete log with attendance and operator details
        const completeLog = await tx.dailyLog.findUnique({
            where: { id: log.id },
            include: {
                attendance: {
                    include: {
                        operator: {
                            select: {
                                id: true,
                                fullName: true,
                                role: true,
                                subRole: true
                            }
                        }
                    }
                }
            }
        });
        if (!completeLog) {
            throw new error_middleware_1.AppError(500, 'Failed to create daily log');
        }
        return completeLog;
    });
    // Invalidate relevant cache keys
    const redis = (0, redis_1.getRedisClient)();
    const cacheKeys = await redis.keys('daily_logs*');
    if (cacheKeys.length > 0) {
        await redis.del(cacheKeys);
    }
    logger_1.default.info('Cache invalidated after daily log creation', { id: dailyLog.id, cacheKeysCount: cacheKeys.length });
    await (0, trend_cache_util_1.invalidateAllTrendCaches)();
    logger_1.default.info('All trend caches invalidated after daily log creation', { id: dailyLog.id });
    return dailyLog;
};
exports.createDailyLog = createDailyLog;
const updateDailyLog = async (logId, userId, binningSmallType, binningFloorType, binningHeavyDutyType, binningCabinetType, pickingSmallType, pickingFloorType, pickingHeavyDutyType, pickingCabinetType, workerPresentIds, workNotes) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true, subRole: true },
    });
    if (!user) {
        throw new error_middleware_1.AppError(404, 'User not found');
    }
    // Allow only kepala gudang to update daily logs
    if (user.role.name !== constants_1.ROLES.KEPALA_GUDANG) {
        throw new error_middleware_1.AppError(403, 'Only kepala gudang can update daily logs');
    }
    const existingLog = await prisma.dailyLog.findUnique({
        where: { id: logId },
        include: {
            attendance: {
                include: {
                    operator: {
                        select: {
                            id: true,
                            role: true,
                            subRole: true
                        }
                    }
                }
            }
        }
    });
    if (!existingLog) {
        throw new error_middleware_1.AppError(404, 'Daily log not found');
    }
    // Verify all workers exist and have appropriate roles
    const workers = await prisma.user.findMany({
        where: {
            id: { in: workerPresentIds },
            role: { name: constants_1.ROLES.OPERASIONAL }
        },
        select: {
            id: true
        }
    });
    if (workers.length !== workerPresentIds.length) {
        throw new error_middleware_1.AppError(400, 'One or more workers not found or do not have appropriate roles');
    }
    const binningCount = binningSmallType + binningFloorType + binningHeavyDutyType + binningCabinetType;
    const pickingCount = pickingSmallType + pickingFloorType + pickingHeavyDutyType + pickingCabinetType;
    const totalItems = binningCount + pickingCount;
    // Update daily log and attendance in a transaction
    const dailyLog = await prisma.$transaction(async (tx) => {
        // Update daily log
        await tx.dailyLog.update({
            where: { id: logId },
            data: {
                binningCount,
                pickingCount,
                binningSmallType,
                binningFloorType,
                binningHeavyDutyType,
                binningCabinetType,
                pickingSmallType,
                pickingFloorType,
                pickingHeavyDutyType,
                pickingCabinetType,
                totalItems,
                issueNotes: workNotes
            }
        });
        // Get current attendance records
        const currentAttendance = existingLog.attendance;
        const currentOperatorIds = currentAttendance.map(a => a.operatorId);
        const newOperatorIds = workerPresentIds;
        // Delete attendance for operators no longer present
        const operatorsToRemove = currentOperatorIds.filter(id => !newOperatorIds.includes(id));
        if (operatorsToRemove.length > 0) {
            await tx.attendance.deleteMany({
                where: {
                    dailyLogId: logId,
                    operatorId: { in: operatorsToRemove }
                }
            });
        }
        // Create attendance for new operators
        const operatorsToAdd = newOperatorIds.filter(id => !currentOperatorIds.includes(id));
        if (operatorsToAdd.length > 0) {
            await tx.attendance.createMany({
                data: operatorsToAdd.map(operatorId => ({
                    dailyLogId: logId,
                    operatorId,
                }))
            });
        }
        // Update existing attendance records
        const operatorsToUpdate = newOperatorIds.filter(id => currentOperatorIds.includes(id));
        if (operatorsToUpdate.length > 0) {
            await tx.attendance.updateMany({
                where: {
                    dailyLogId: logId,
                    operatorId: { in: operatorsToUpdate }
                },
                data: {}
            });
        }
        // Fetch the complete updated log
        const completeLog = await tx.dailyLog.findUnique({
            where: { id: logId },
            include: {
                attendance: {
                    include: {
                        operator: {
                            select: {
                                id: true,
                                fullName: true,
                                role: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!completeLog) {
            throw new error_middleware_1.AppError(500, 'Failed to update daily log');
        }
        return completeLog;
    });
    // Invalidate relevant cache keys
    const redis = (0, redis_1.getRedisClient)();
    const cacheKeys = await redis.keys('daily_logs*');
    if (cacheKeys.length > 0) {
        await redis.del(cacheKeys);
    }
    logger_1.default.info('Cache invalidated after daily log update', { id: logId, cacheKeysCount: cacheKeys.length });
    await (0, trend_cache_util_1.invalidateAllTrendCaches)();
    logger_1.default.info('All trend caches invalidated after daily log update', { id: dailyLog.id });
    return dailyLog;
};
exports.updateDailyLog = updateDailyLog;
// Helper function to calculate productivity according to specification
const calculateProductivity = (log) => {
    // Count operators by sub-role
    const binningOperators = log.attendance.filter((a) => a.operator.subRole.teamCategory === constants_1.TEAM_CATEGORIES.BINNING).length;
    const pickingOperators = log.attendance.filter((a) => a.operator.subRole.teamCategory === constants_1.TEAM_CATEGORIES.PICKING).length;
    // Calculate per-worker productivity by team
    const prodItemIncoming = binningOperators > 0 ? log.binningCount / binningOperators : 0;
    const prodItemOutgoing = pickingOperators > 0 ? log.pickingCount / pickingOperators : 0;
    const productivity = log.totalItems / (8 * constants_1.PRODUCTIVITY.TARGET) * 100;
    logger_1.default.info('productivity', { productivity });
    return {
        id: log.id,
        logDate: log.logDate,
        binningCount: log.binningCount,
        pickingCount: log.pickingCount,
        binningSmallType: log.binningSmallType,
        binningFloorType: log.binningFloorType,
        binningHeavyDutyType: log.binningHeavyDutyType,
        binningCabinetType: log.binningCabinetType,
        pickingSmallType: log.pickingSmallType,
        pickingFloorType: log.pickingFloorType,
        pickingHeavyDutyType: log.pickingHeavyDutyType,
        pickingCabinetType: log.pickingCabinetType,
        totalItems: log.totalItems || 0,
        productivity,
        prodItemIncoming,
        prodItemOutgoing,
        attendance: log.attendance.map((a) => ({
            operatorId: a.operatorId,
            operatorName: a.operator.fullName,
            operatorRole: a.operator.role.name,
            operatorSubRole: a.operator.subRole.name
        }))
    };
};
// Helper function to get cache key
const getCacheKey = (sortBy, sortOrder, startDate, endDate, search) => {
    if (search) {
        return redis_1.CACHE_KEYS.DAILY_LOGS_SEARCH(search);
    }
    if (startDate || endDate) {
        return redis_1.CACHE_KEYS.DAILY_LOGS_PERIOD(startDate?.toISOString() || '', endDate?.toISOString() || '');
    }
    if (sortBy) {
        return redis_1.CACHE_KEYS.DAILY_LOGS_SORTED(sortBy, sortOrder || 'desc');
    }
    return redis_1.CACHE_KEYS.DAILY_LOGS;
};
const getDailyLogs = async (page, limit, startDate, endDate, operatorName, sortBy, sortOrder = 'desc') => {
    // Validate parameters
    if (startDate && endDate && startDate > endDate) {
        throw new error_middleware_1.AppError(400, 'startDate must be before or equal to endDate');
    }
    if (page < 1) {
        throw new error_middleware_1.AppError(400, 'page must be at least 1');
    }
    if (limit < 1 || limit > 100) {
        throw new error_middleware_1.AppError(400, 'limit must be between 1 and 100');
    }
    if (sortBy && !['logDate', 'binningCount', 'pickingCount', 'totalItems', 'productivity', 'attendanceCount'].includes(sortBy)) {
        throw new error_middleware_1.AppError(400, 'Invalid sort field');
    }
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
        throw new error_middleware_1.AppError(400, 'Sort order must be either asc or desc');
    }
    logger_1.default.info('sortBy', { sortBy });
    logger_1.default.info('sortOrder', { sortOrder });
    logger_1.default.info('startDate', { startDate });
    logger_1.default.info('endDate', { endDate });
    logger_1.default.info('operatorName', { operatorName });
    const redis = (0, redis_1.getRedisClient)();
    const cacheKey = getCacheKey(sortBy, sortOrder, startDate, endDate, operatorName);
    logger_1.default.info('cacheKey', { cacheKey });
    try {
        // Try to get from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            logger_1.default.info('Using cached data');
            const parsedData = JSON.parse(cachedData);
            let processedLogs = parsedData.logs;
            if (sortBy) {
                processedLogs.sort((a, b) => {
                    let aVal, bVal;
                    switch (sortBy) {
                        case 'logDate':
                            aVal = new Date(a.logDate).getTime();
                            bVal = new Date(b.logDate).getTime();
                            break;
                        case 'attendanceCount':
                            aVal = a.attendance.length;
                            bVal = b.attendance.length;
                            break;
                        case 'productivity':
                            aVal = a.productivity;
                            bVal = b.productivity;
                            break;
                        default:
                            aVal = Number(a[sortBy] || 0);
                            bVal = Number(b[sortBy] || 0);
                    }
                    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
                });
            }
            const start = (page - 1) * limit;
            const end = start + limit;
            return {
                logs: processedLogs.slice(start, end),
                total: parsedData.total,
                page,
                limit,
                totalPages: Math.ceil(parsedData.total / limit)
            };
        }
        logger_1.default.info('Fetching data from database');
        // If not in cache, get from database
        const where = {
            ...(startDate && endDate && {
                logDate: {
                    gte: startDate,
                    lte: endDate,
                },
            }),
            ...(operatorName && {
                attendance: {
                    some: {
                        operator: {
                            fullName: {
                                contains: operatorName
                            }
                        }
                    }
                }
            }),
        };
        // For productivity sorting, we need to calculate it after fetching the data
        const [total, logs] = await Promise.all([
            prisma.dailyLog.count({ where }),
            prisma.dailyLog.findMany({
                where,
                include: {
                    attendance: {
                        include: {
                            operator: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true,
                                    role: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                    subRole: {
                                        select: {
                                            name: true,
                                            teamCategory: true
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                // Only apply database sorting for non-productivity fields
                orderBy: sortBy && sortBy !== 'productivity' && sortBy !== 'attendanceCount'
                    ? { [sortBy]: sortOrder }
                    : { logDate: 'desc' },
            }),
        ]);
        // Process logs and calculate productivity
        let processedLogs = logs.map(log => calculateProductivity(log));
        // Sort by productivity if needed
        if (sortBy === 'productivity') {
            processedLogs.sort((a, b) => sortOrder === 'asc'
                ? a.productivity - b.productivity
                : b.productivity - a.productivity);
        }
        if (sortBy === 'attendanceCount') {
            processedLogs.sort((a, b) => sortOrder === 'asc'
                ? a.attendance.length - b.attendance.length
                : b.attendance.length - a.attendance.length);
        }
        // Cache the full result set
        const cacheData = {
            logs: processedLogs,
            total
        };
        await redis.setex(cacheKey, redis_1.CACHE_TTL.DAILY_LOGS, JSON.stringify(cacheData));
        // Return paginated results
        const start = (page - 1) * limit;
        const end = start + limit;
        return {
            logs: processedLogs.slice(start, end),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    catch (error) {
        console.error('Error in getDailyLogs:', error);
        // Fallback to database query if Redis fails
        const where = {
            ...(startDate && endDate && {
                logDate: {
                    gte: startDate,
                    lte: endDate,
                },
            }),
            ...(operatorName && {
                attendance: {
                    some: {
                        operator: {
                            fullName: operatorName
                        }
                    }
                }
            }),
        };
        const [total, logs] = await Promise.all([
            prisma.dailyLog.count({ where }),
            prisma.dailyLog.findMany({
                where,
                include: {
                    attendance: {
                        include: {
                            operator: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true,
                                    role: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                    subRole: {
                                        select: {
                                            name: true,
                                            teamCategory: true
                                        }
                                    },
                                },
                            },
                        },
                    },
                },
                // Only apply database sorting for non-productivity fields
                orderBy: sortBy && sortBy !== 'productivity'
                    ? { [sortBy]: sortOrder }
                    : { logDate: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        const processedLogs = logs.map(calculateProductivity);
        if (sortBy === 'productivity') {
            processedLogs.sort((a, b) => sortOrder === 'asc'
                ? a.productivity - b.productivity
                : b.productivity - a.productivity);
        }
        return {
            logs: processedLogs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
};
exports.getDailyLogs = getDailyLogs;
const getDailyLogById = async (id) => {
    if (!id || id < 1) {
        throw new error_middleware_1.AppError(400, 'Invalid log ID');
    }
    const log = await prisma.dailyLog.findUnique({
        where: { id },
        include: {
            attendance: {
                include: {
                    operator: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: {
                                select: {
                                    name: true,
                                },
                            },
                            subRole: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!log) {
        throw new error_middleware_1.AppError(404, 'Daily log not found');
    }
    const dailyLogDetail = {
        id: log.id,
        logDate: log.logDate,
        binningCount: log.binningCount,
        pickingCount: log.pickingCount,
        binningSmallType: log.binningSmallType,
        binningFloorType: log.binningFloorType,
        binningHeavyDutyType: log.binningHeavyDutyType,
        binningCabinetType: log.binningCabinetType,
        pickingSmallType: log.pickingSmallType,
        pickingFloorType: log.pickingFloorType,
        pickingHeavyDutyType: log.pickingHeavyDutyType,
        pickingCabinetType: log.pickingCabinetType,
        totalItems: log.totalItems || 0,
        productivity: calculateProductivity(log).productivity,
        attendance: log.attendance.map((a) => ({
            operatorId: a.operatorId,
            operatorName: a.operator.fullName,
            operatorRole: a.operator.role.name,
            operatorSubRole: a.operator.subRole.name
        })),
        workNotes: log.issueNotes || '',
        createdAt: log.createdAt,
        updatedAt: log.updatedAt
    };
    return dailyLogDetail;
};
exports.getDailyLogById = getDailyLogById;
const deleteDailyLog = async (id, userId) => {
    if (!id || id < 1) {
        throw new error_middleware_1.AppError(400, 'Invalid log ID');
    }
    const log = await prisma.dailyLog.findUnique({
        where: { id },
        include: {
            attendance: {
                where: { operatorId: userId },
                include: {
                    operator: {
                        include: {
                            role: true,
                        },
                    },
                },
            },
        },
    });
    if (!log) {
        throw new error_middleware_1.AppError(404, 'Daily log not found');
    }
    // Only allow deletion by the log owner or admin
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
    });
    if (!user) {
        throw new error_middleware_1.AppError(404, 'User not found');
    }
    const userAttendance = log.attendance[0];
    if (!userAttendance && user.role.name !== constants_1.ROLES.KEPALA_GUDANG) {
        throw new error_middleware_1.AppError(403, 'Not authorized to delete this log');
    }
    await prisma.$transaction([
        prisma.attendance.deleteMany({ where: { dailyLogId: id } }),
        prisma.dailyLog.delete({ where: { id } }),
    ]);
    // Invalidate all daily logs cache
    const redis = (0, redis_1.getRedisClient)();
    const cacheKeys = await redis.keys('daily_logs*');
    if (cacheKeys.length > 0) {
        await redis.del(cacheKeys);
    }
    logger_1.default.info('Cache invalidated after daily log deletion', { id, cacheKeysCount: cacheKeys.length });
    await (0, trend_cache_util_1.invalidateAllTrendCaches)();
    logger_1.default.info('All trend caches invalidated after daily log deletion', { id });
    return { message: 'Daily log deleted successfully' };
};
exports.deleteDailyLog = deleteDailyLog;
const getUserDailyLogs = async (userId, page, limit, startDate, endDate) => {
    // Validate user exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new error_middleware_1.AppError(404, 'User not found');
    }
    // Validate date range
    if (startDate && endDate && startDate > endDate) {
        throw new error_middleware_1.AppError(400, 'startDate must be before or equal to endDate');
    }
    // Validate pagination
    if (page < 1) {
        throw new error_middleware_1.AppError(400, 'page must be at least 1');
    }
    if (limit < 1 || limit > 100) {
        throw new error_middleware_1.AppError(400, 'limit must be between 1 and 100');
    }
    const where = {
        attendance: {
            some: {
                operatorId: userId
            }
        },
        ...(startDate && endDate && {
            logDate: {
                gte: startDate,
                lte: endDate,
            },
        }),
    };
    const [total, logs] = await Promise.all([
        prisma.dailyLog.count({ where }),
        prisma.dailyLog.findMany({
            where,
            include: {
                attendance: {
                    include: {
                        operator: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                role: {
                                    select: {
                                        name: true,
                                    },
                                },
                                subRole: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { logDate: 'desc' },
        }),
    ]);
    return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};
exports.getUserDailyLogs = getUserDailyLogs;
const getDailyLogStats = async (startDate, endDate, userId) => {
    // Validate date range
    if (!startDate || !endDate) {
        throw new error_middleware_1.AppError(400, 'startDate and endDate are required');
    }
    if (startDate > endDate) {
        throw new error_middleware_1.AppError(400, 'startDate must be before or equal to endDate');
    }
    // Validate user exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new error_middleware_1.AppError(404, 'User not found');
    }
    const logs = await prisma.dailyLog.findMany({
        where: {
            logDate: {
                gte: startDate,
                lte: endDate,
            },
            attendance: {
                some: {
                    operatorId: userId
                }
            }
        },
        include: {
            attendance: {
                where: {
                    operatorId: userId
                }
            }
        }
    });
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const presentDays = logs.filter(log => log.attendance[0]).length;
    const totalBinning = logs.reduce((sum, log) => sum + (log.binningCount || 0), 0);
    const totalPicking = logs.reduce((sum, log) => sum + (log.pickingCount || 0), 0);
    const totalItems = totalBinning + totalPicking;
    return {
        totalBinning,
        totalPicking,
        totalItems,
        averageItemsPerDay: presentDays > 0 ? totalItems / presentDays : 0,
        presentDays,
        totalDays,
        attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
    };
};
exports.getDailyLogStats = getDailyLogStats;
