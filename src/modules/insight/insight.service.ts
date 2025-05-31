import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, eachDayOfInterval, format, startOfYear, endOfYear, getWeekOfMonth } from 'date-fns';
import { WorkerPresentResponse, TrendItemResponse, TrendItemDataPoint, WorkerComparisonDataset, TimePointPerformance, WorkerPerformancePoint } from './insight.type';
import { ROLES } from '../../config/constants';
import logger from '../../utils/logger';
import { getTrendData, TrendDataPoint } from '../../utils/trend-cache.util';
import { parseISO } from 'date-fns';

const prisma = new PrismaClient();

export const getWorkerPresent = async (): Promise<WorkerPresentResponse> => {
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
        name: ROLES.OPERASIONAL
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

export const getTrendItem = async (startDate: Date, endDate: Date): Promise<TrendItemResponse> => {
  try {
    // Try to get from cache first
    let trendData: TrendItemDataPoint[];
    let lastUpdated: string;

    try {
      const cachedTrendData = await getTrendData(startDate, endDate);
      trendData = cachedTrendData.data.map(point => ({
        date: new Date(point.date), // Convert ISO string to Date
        binningCount: point.binningCount,
        pickingCount: point.pickingCount,
        totalItems: point.totalItems
      }));
      lastUpdated = cachedTrendData.lastUpdated;
    } catch (cacheError) {
      logger.warn('Cache unavailable, falling back to database:', cacheError);

      // Get logs from database
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
          pickingCount: true,
          totalItems: true
        },
        orderBy: {
          logDate: 'asc'
        }
      });

      // Create a map of logs for easy lookup by date
      const logMap = new Map(
        logs.map(log => [
          format(log.logDate, 'yyyy-MM-dd'),
          {
            binningCount: log.binningCount || 0,
            pickingCount: log.pickingCount || 0,
            totalItems: log.totalItems || 0
          }
        ])
      );

      // Create data points for each day in the range
      trendData = eachDayOfInterval({ start: startOfDay(startDate), end: endOfDay(endDate) }).map(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const log = logMap.get(dateKey) as { binningCount: number; pickingCount: number; totalItems: number };

        return {
          date, // Use the Date object directly
          binningCount: log?.binningCount || 0,
          pickingCount: log?.pickingCount || 0,
          totalItems: log?.totalItems || 0
        } as TrendItemDataPoint;
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
  } catch (error) {
    logger.error('Error in getTrendItem:', error);
    throw error;
  }
};

export const getWorkerPerformance = async (
  type: 'weekly' | 'monthly',
  year: number
): Promise<WorkerComparisonDataset> => {
  const startDate = startOfYear(new Date(year));
  const endDate = endOfYear(new Date(year));

  // First, get all operational users
  const operationalUsers = await prisma.user.findMany({
    where: {
      role: {
        name: ROLES.OPERASIONAL
      }
    },
    select: {
      id: true,
      fullName: true
    }
  });

  // Create a map of all operational users for easy lookup
  const allOperators = new Map(
    operationalUsers.map(user => [
      user.id,
      {
        operatorId: user.id,
        operatorName: user.fullName || 'Unknown'
      }
    ])
  );

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
  const timePointGroups = new Map<string, typeof logs>();

  logs.forEach(log => {
    let timePoint: string;
    if (type === 'weekly') {
      const weekNum = getWeekOfMonth(log.logDate);
      const monthName = format(log.logDate, 'MMM');
      timePoint = `${monthName} W${weekNum}`;
    } else {
      timePoint = format(log.logDate, 'MMM');
    }

    if (!timePointGroups.has(timePoint)) {
      timePointGroups.set(timePoint, []);
    }
    timePointGroups.get(timePoint)!.push(log);
  });

  // Calculate metrics for each time point
  const metrics: TimePointPerformance[] = Array.from(timePointGroups.entries()).map(([timePoint, timePointLogs]) => {
    // Group logs by operator for this time point
    const operatorMetrics = new Map<number, {
      operatorId: number;
      operatorName: string;
      dailyProductivities: number[];
    }>();

    // Initialize metrics for all operators with empty productivity arrays
    allOperators.forEach((operator: { operatorId: number; operatorName: string }) => {
      operatorMetrics.set(operator.operatorId, {
        operatorId: operator.operatorId,
        operatorName: operator.operatorName,
        dailyProductivities: []
      });
    });

    // Calculate daily productivity for each log in this time point
    timePointLogs.forEach(log => {
      const presentWorkers = log.attendance.length;
      if (presentWorkers === 0) return;

      const totalItems = log.totalItems ?? 0;
      const dailyProductivity = totalItems / presentWorkers;

      // Update metrics for each present operator
      log.attendance.forEach(attendance => {
        const operator = attendance.operator as { id: number; fullName: string };
        const operatorMetric = operatorMetrics.get(operator.id);
        if (operatorMetric) {
          operatorMetric.dailyProductivities.push(dailyProductivity);
        }
      });
    });

    // Calculate average productivity for each operator in this time point
    const data: WorkerPerformancePoint[] = Array.from(operatorMetrics.values())
      .map((metric: { operatorId: number, operatorName: string, dailyProductivities: number[] }) => ({
        operatorId: metric.operatorId,
        operatorName: metric.operatorName,
        value: metric.dailyProductivities.length > 0
          ? Math.round(
            metric.dailyProductivities.reduce((sum: number, val: number) => sum + val, 0) /
            metric.dailyProductivities.length
          )
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
    if (monthDiff !== 0) return monthDiff;

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