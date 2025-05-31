import { PrismaClient, DailyLog } from '@prisma/client';
import { getRedisClient, CACHE_KEYS, CACHE_TTL } from '../config/redis';
import { startOfDay, endOfDay, format, parseISO, eachDayOfInterval } from 'date-fns';
import logger from './logger';

const prisma = new PrismaClient();

export type TrendDataPoint = {
  date: string;
  binningCount: number;
  pickingCount: number;
  totalItems: number;
};

export type TrendCacheData = {
  data: TrendDataPoint[];
  lastUpdated: string;
  period: {
    startDate: string;
    endDate: string;
  };
};

type LogData = Pick<DailyLog, 'logDate' | 'binningCount' | 'pickingCount'>;

/**
 * Calculate trend data for a given date range
 */
export const calculateTrendData = async (
  startDate: Date,
  endDate: Date
): Promise<TrendDataPoint[]> => {
  // Get all logs within the date range
  const logs = await prisma.dailyLog.findMany({
    where: {
      logDate: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate)
      }
    },
    select: {
      logDate: true,
      binningCount: true,
      pickingCount: true
    },
    orderBy: {
      logDate: 'asc'
    }
  }) as LogData[];

  // Create a map of logs for easy lookup by date
  const logMap = new Map(
    logs.map(log => [
      format(log.logDate, 'yyyy-MM-dd'),
      {
        binningCount: log.binningCount || 0,
        pickingCount: log.pickingCount || 0
      }
    ])
  );

  // Create data points for each day in the range
  return eachDayOfInterval({ start: startOfDay(startDate), end: endOfDay(endDate) }).map(date => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const log = logMap.get(dateKey);

    return {
      date: dateKey,
      binningCount: log?.binningCount ?? 0,
      pickingCount: log?.pickingCount ?? 0,
      totalItems: (log?.binningCount ?? 0) + (log?.pickingCount ?? 0)
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
  const cacheKey = `${CACHE_KEYS.TREND_DATA}:${format(startOfDay(startDate), 'yyyy-MM-dd')}:${format(endOfDay(endDate), 'yyyy-MM-dd')}`;

  try {
    // Try to get from cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData) as TrendCacheData;
      logger.info('Trend data retrieved from cache', { cacheKey });
      return parsedData;
    }

    logger.info('Trend data not found in cache, calculating...', { cacheKey });
    // If not in cache, calculate and store
    const trendData = await calculateTrendData(startDate, endDate);
    const cacheData: TrendCacheData = {
      data: trendData,
      lastUpdated: new Date().toISOString(),
      period: {
        startDate: format(startOfDay(startDate), 'yyyy-MM-dd'),
        endDate: format(endOfDay(endDate), 'yyyy-MM-dd')
      }
    };

    // Store in Redis with expiration
    await redis.setex(cacheKey, CACHE_TTL.TREND_DATA, JSON.stringify(cacheData));
    logger.info('Trend data cached', { cacheKey });

    return cacheData;
  } catch (error) {
    logger.error('Error in getTrendData:', error);
    throw error;
  }
};

/**
 * Invalidate all trend data caches
 */
export const invalidateAllTrendCaches = async (): Promise<void> => {
  const redis = getRedisClient();
  const pattern = `${CACHE_KEYS.TREND_DATA}:*`;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      const deleted = await redis.del(...keys);
      logger.info('All trend caches invalidated', { 
        pattern,
        keysFound: keys.length,
        keysDeleted: deleted,
        keys: keys // Log the actual keys for debugging
      });
    } else {
      logger.info('No trend caches found to invalidate', { pattern });
    }
  } catch (error) {
    logger.error('Error invalidating all trend caches:', error);
    throw error;
  }
}; 