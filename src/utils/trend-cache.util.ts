import { PrismaClient } from '@prisma/client';
import { getRedisClient, CACHE_KEYS, CACHE_TTL } from '../config/redis';
import { startOfDay, endOfDay, format, parseISO } from 'date-fns';
import logger from './logger';

const prisma = new PrismaClient();

export type CompoundedTrendData = {
  date: string;
  binningCount: number;
  pickingCount: number;
  totalItems: number;
  compoundedBinning: number;
  compoundedPicking: number;
  compoundedTotal: number;
};

export type TrendCacheData = {
  data: CompoundedTrendData[];
  lastUpdated: string;
  period: {
    startDate: string;
    endDate: string;
  };
};

/**
 * Calculate compounded trend data for a given date range
 */
export const calculateCompoundedTrend = async (
  startDate: Date,
  endDate: Date
): Promise<CompoundedTrendData[]> => {
  // Get all logs within the date range
  const logs = await prisma.dailyLog.findMany({
    where: {
      logDate: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate)
      }
    },
    orderBy: {
      logDate: 'asc'
    }
  });

  // Initialize variables for compounding
  let compoundedBinning = 0;
  let compoundedPicking = 0;
  let compoundedTotal = 0;

  // Calculate compounded values for each day
  return logs.map(log => {
    const binningCount = log.binningCount || 0;
    const pickingCount = log.pickingCount || 0;
    const totalItems = binningCount + pickingCount;

    // Add to compounded totals
    compoundedBinning += binningCount;
    compoundedPicking += pickingCount;
    compoundedTotal += totalItems;

    return {
      date: format(log.logDate, 'yyyy-MM-dd'),
      binningCount,
      pickingCount,
      totalItems,
      compoundedBinning,
      compoundedPicking,
      compoundedTotal
    };
  });
};

/**
 * Get trend data from cache or calculate and cache it
 */
export const getTrendData = async (
  startDate: Date,
  endDate: Date
): Promise<TrendCacheData> => {
  const redis = getRedisClient();
  const cacheKey = `${CACHE_KEYS.TREND_DATA}:${format(startDate, 'yyyy-MM-dd')}:${format(endDate, 'yyyy-MM-dd')}`;

  try {
    // Try to get from cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData) as TrendCacheData;
    }

    // If not in cache, calculate and store
    const trendData = await calculateCompoundedTrend(startDate, endDate);
    const cacheData: TrendCacheData = {
      data: trendData,
      lastUpdated: new Date().toISOString(),
      period: {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      }
    };

    // Store in Redis with expiration
    await redis.setex(cacheKey, CACHE_TTL.TREND_DATA, JSON.stringify(cacheData));

    return cacheData;
  } catch (error) {
    logger.error('Error in getTrendData:', error);
    throw error;
  }
};

/**
 * Invalidate trend data cache for a specific date range
 */
export const invalidateTrendCache = async (
  startDate: Date,
  endDate: Date
): Promise<void> => {
  const redis = getRedisClient();
  const cacheKey = `${CACHE_KEYS.TREND_DATA}:${format(startDate, 'yyyy-MM-dd')}:${format(endDate, 'yyyy-MM-dd')}`;

  try {
    await redis.del(cacheKey);
    logger.info('Trend cache invalidated', { cacheKey });
  } catch (error) {
    logger.error('Error invalidating trend cache:', error);
    throw error;
  }
};

/**
 * Invalidate all trend data caches
 */
export const invalidateAllTrendCaches = async (): Promise<void> => {
  const redis = getRedisClient();
  
  try {
    const keys = await redis.keys(`${CACHE_KEYS.TREND_DATA}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info('All trend caches invalidated', { count: keys.length });
    }
  } catch (error) {
    logger.error('Error invalidating all trend caches:', error);
    throw error;
  }
}; 