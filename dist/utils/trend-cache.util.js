"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateAllTrendCaches = exports.getTrendData = exports.calculateTrendData = void 0;
const client_1 = require("@prisma/client");
const redis_1 = require("../config/redis");
const date_fns_1 = require("date-fns");
const logger_1 = __importDefault(require("./logger"));
const prisma = new client_1.PrismaClient();
/**
 * Calculate trend data for a given date range
 */
const calculateTrendData = async (startDate, endDate) => {
    // Get all logs within the date range
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
    return (0, date_fns_1.eachDayOfInterval)({ start: (0, date_fns_1.startOfDay)(startDate), end: (0, date_fns_1.endOfDay)(endDate) }).map(date => {
        const dateKey = (0, date_fns_1.format)(date, 'yyyy-MM-dd');
        const log = logMap.get(dateKey);
        return {
            date: dateKey,
            binningCount: log?.binningCount || 0,
            pickingCount: log?.pickingCount || 0,
            totalItems: log?.totalItems || 0
        };
    });
};
exports.calculateTrendData = calculateTrendData;
/**
 * Get trend data from cache or calculate and cache it
 */
const getTrendData = async (startDate, endDate) => {
    const redis = (0, redis_1.getRedisClient)();
    const cacheKey = `${redis_1.CACHE_KEYS.TREND_DATA}:${(0, date_fns_1.format)((0, date_fns_1.startOfDay)(startDate), 'yyyy-MM-dd')}:${(0, date_fns_1.format)((0, date_fns_1.endOfDay)(endDate), 'yyyy-MM-dd')}`;
    try {
        // Try to get from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            logger_1.default.info('Trend data retrieved from cache', { cacheKey });
            return parsedData;
        }
        logger_1.default.info('Trend data not found in cache, calculating...', { cacheKey });
        // If not in cache, calculate and store
        const trendData = await (0, exports.calculateTrendData)(startDate, endDate);
        const cacheData = {
            data: trendData,
            lastUpdated: new Date().toISOString(),
            period: {
                startDate: (0, date_fns_1.format)((0, date_fns_1.startOfDay)(startDate), 'yyyy-MM-dd'),
                endDate: (0, date_fns_1.format)((0, date_fns_1.endOfDay)(endDate), 'yyyy-MM-dd')
            }
        };
        // Store in Redis with expiration
        await redis.setex(cacheKey, redis_1.CACHE_TTL.TREND_DATA, JSON.stringify(cacheData));
        logger_1.default.info('Trend data cached', { cacheKey });
        return cacheData;
    }
    catch (error) {
        logger_1.default.error('Error in getTrendData:', error);
        throw error;
    }
};
exports.getTrendData = getTrendData;
/**
 * Invalidate all trend data caches
 */
const invalidateAllTrendCaches = async () => {
    const redis = (0, redis_1.getRedisClient)();
    const pattern = `${redis_1.CACHE_KEYS.TREND_DATA}:*`;
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            const deleted = await redis.del(...keys);
            logger_1.default.info('All trend caches invalidated', {
                pattern,
                keysFound: keys.length,
                keysDeleted: deleted,
                keys: keys // Log the actual keys for debugging
            });
        }
        else {
            logger_1.default.info('No trend caches found to invalidate', { pattern });
        }
    }
    catch (error) {
        logger_1.default.error('Error invalidating all trend caches:', error);
        throw error;
    }
};
exports.invalidateAllTrendCaches = invalidateAllTrendCaches;
