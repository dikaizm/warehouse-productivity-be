import Redis from 'ioredis';
import { AppError } from '../middleware/error.middleware';

const redisClient = new Redis({
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

export const getRedisClient = () => {
  if (redisClient.status !== 'ready') {
    throw new AppError(500, 'Redis client is not ready');
  }
  return redisClient;
};

export const CACHE_KEYS = {
  DAILY_LOGS: 'daily_logs',
  DAILY_LOGS_SORTED: (sortBy: string, sortOrder: string) => 
    `daily_logs:sorted:${sortBy}:${sortOrder}`,
  DAILY_LOGS_PERIOD: (startDate: string, endDate: string) =>
    `daily_logs:period:${startDate}:${endDate}`,
  DAILY_LOGS_SEARCH: (search: string) =>
    `daily_logs:search:${search}`,
  TREND_DATA: 'trend_data'
} as const;

export const CACHE_TTL = {
  DAILY_LOGS: 3600, // 1 hour
  DAILY_LOGS_SORTED: 3600, // 1 hour
  DAILY_LOGS_PERIOD: 3600, // 1 hour
  DAILY_LOGS_SEARCH: 1800, // 30 minutes
  TREND_DATA: 7200 // 2 hours
} as const;

export default redisClient; 