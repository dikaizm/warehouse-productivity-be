"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_TTL = exports.CACHE_KEYS = exports.getRedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const error_middleware_1 = require("../middleware/error.middleware");
const redisClient = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});
redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});
redisClient.on('connect', () => {
    console.log('Redis Client Connected');
});
const getRedisClient = () => {
    if (redisClient.status !== 'ready') {
        throw new error_middleware_1.AppError(500, 'Redis client is not ready');
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
exports.CACHE_KEYS = {
    DAILY_LOGS: 'daily_logs',
    DAILY_LOGS_SORTED: (sortBy, sortOrder) => `daily_logs:sorted:${sortBy}:${sortOrder}`,
    DAILY_LOGS_PERIOD: (startDate, endDate) => `daily_logs:period:${startDate}:${endDate}`,
    DAILY_LOGS_SEARCH: (search) => `daily_logs:search:${search}`,
    TREND_DATA: 'trend_data'
};
exports.CACHE_TTL = {
    DAILY_LOGS: 3600, // 1 hour
    DAILY_LOGS_SORTED: 3600, // 1 hour
    DAILY_LOGS_PERIOD: 3600, // 1 hour
    DAILY_LOGS_SEARCH: 1800, // 30 minutes
    TREND_DATA: 300 // 5 minutes
};
exports.default = redisClient;
