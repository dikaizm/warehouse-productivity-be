import prisma from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { DailyLog, User } from '@prisma/client';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

interface ProductivityMetrics {
  totalBinning: number;
  totalPicking: number;
  totalItems: number;
  averageItemsPerDay: number;
  presentDays: number;
  totalDays: number;
  attendanceRate: number;
}

interface UserProductivity {
  userId: number;
  username: string;
  fullName: string | null;
  totalBinning: number;
  totalPicking: number;
  totalItems: number;
  averageItemsPerDay: number;
  presentDays: number;
  attendanceRate: number;
}

interface UserWithDailyLogs extends User {
  dailyLogs: DailyLog[];
}

interface DailyLogWithUser {
  id: number;
  logDate: Date;
  isPresent: boolean;
  binningCount: number | null;
  pickingCount: number | null;
  user: {
    id: number;
    username: string;
    fullName: string;
  };
}

interface DailyLog {
  binningCount: number | null;
  pickingCount: number | null;
}

const prismaClient = new PrismaClient();

export const getProductivityMetrics = async (
  startDate: Date,
  endDate: Date
): Promise<ProductivityMetrics> => {
  const dailyLogs = await prisma.dailyLog.findMany({
    where: {
      logDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  if (dailyLogs.length === 0) {
    throw new AppError(404, 'No data found for the specified date range');
  }

  const totalBinning = dailyLogs.reduce((sum: number, log: DailyLog) => sum + log.binningCount, 0);
  const totalPicking = dailyLogs.reduce((sum: number, log: DailyLog) => sum + log.pickingCount, 0);
  const totalItems = totalBinning + totalPicking;
  const presentDays = dailyLogs.filter((log: DailyLog) => log.isPresent).length;
  const totalDays = dailyLogs.length;

  return {
    totalBinning,
    totalPicking,
    totalItems,
    averageItemsPerDay: totalItems / presentDays,
    presentDays,
    totalDays,
    attendanceRate: (presentDays / totalDays) * 100,
  };
};

export const getUserProductivity = async (
  startDate: Date,
  endDate: Date
): Promise<UserProductivity[]> => {
  const users = await prisma.user.findMany({
    include: {
      dailyLogs: {
        where: {
          logDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  }) as UserWithDailyLogs[];

  if (users.length === 0) {
    throw new AppError(404, 'No users found');
  }

  return users.map((user: UserWithDailyLogs) => {
    const totalBinning = user.dailyLogs.reduce((sum: number, log: DailyLog) => sum + log.binningCount, 0);
    const totalPicking = user.dailyLogs.reduce((sum: number, log: DailyLog) => sum + log.pickingCount, 0);
    const totalItems = totalBinning + totalPicking;
    const presentDays = user.dailyLogs.filter((log: DailyLog) => log.isPresent).length;
    const totalDays = user.dailyLogs.length;

    return {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      totalBinning,
      totalPicking,
      totalItems,
      averageItemsPerDay: presentDays > 0 ? totalItems / presentDays : 0,
      presentDays,
      attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
    };
  });
};

export const getDailyProductivity = async (
  startDate: Date,
  endDate: Date
) => {
  const dailyLogs = await prisma.dailyLog.findMany({
    where: {
      logDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: {
        select: {
          username: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      logDate: 'asc',
    },
  });

  if (dailyLogs.length === 0) {
    throw new AppError(404, 'No data found for the specified date range');
  }

  return dailyLogs.map((log) => ({
    date: log.logDate,
    username: log.user.username,
    fullName: log.user.fullName,
    isPresent: log.isPresent,
    binningCount: log.binningCount,
    pickingCount: log.pickingCount,
    totalItems: log.binningCount + log.pickingCount,
  }));
};

export const getTodayOverview = async (date?: string) => {
  const targetDate = date ? new Date(date) : new Date();
  const start = startOfDay(targetDate);
  const end = endOfDay(targetDate);

  // Get today's logs
  const todayLogs = await prisma.dailyLog.findMany({
    where: {
      logDate: {
        gte: start,
        lte: end,
      },
    },
    include: {
      user: true,
    },
  });

  // Calculate metrics
  const itemsProcessed = todayLogs.reduce((sum: number, log: DailyLogWithUser) => 
    sum + (log.binningCount || 0) + (log.pickingCount || 0), 0);
  const workersPresent = todayLogs.filter(log => log.isPresent).length;
  const totalWorkers = await prisma.user.count({
    where: {
      role: {
        name: 'operator',
      },
    },
  });

  // Get target (you might want to store this in a settings table)
  const target = 55;

  return {
    itemsProcessed,
    workersPresent,
    totalWorkers,
    target,
    actual: itemsProcessed,
  };
};

export const getProductivityTrends = async () => {
  const today = new Date();
  const dayStart = startOfDay(today);
  const weekStart = startOfWeek(today);
  const monthStart = startOfMonth(today);

  // Get daily average
  const dailyLogs = await prismaClient.dailyLog.findMany({
    where: {
      logDate: {
        gte: dayStart,
      },
    },
    select: {
      binningCount: true,
      pickingCount: true,
    },
  });

  const dailyTotal = dailyLogs.reduce((sum, log: DailyLog) => sum + (log.binningCount || 0) + (log.pickingCount || 0), 0);
  const dailyAverage = dailyLogs.length > 0 ? Math.round(dailyTotal / dailyLogs.length) : 0;

  // Get weekly average
  const weeklyLogs = await prismaClient.dailyLog.findMany({
    where: {
      logDate: {
        gte: weekStart,
      },
    },
    select: {
      binningCount: true,
      pickingCount: true,
    },
  });

  const weeklyTotal = weeklyLogs.reduce((sum, log: DailyLog) => sum + (log.binningCount || 0) + (log.pickingCount || 0), 0);
  const weeklyAverage = weeklyLogs.length > 0 ? Math.round(weeklyTotal / weeklyLogs.length) : 0;

  // Get monthly average
  const monthlyLogs = await prismaClient.dailyLog.findMany({
    where: {
      logDate: {
        gte: monthStart,
      },
    },
    select: {
      binningCount: true,
      pickingCount: true,
    },
  });

  const monthlyTotal = monthlyLogs.reduce((sum, log: DailyLog) => sum + (log.binningCount || 0) + (log.pickingCount || 0), 0);
  const monthlyAverage = monthlyLogs.length > 0 ? Math.round(monthlyTotal / monthlyLogs.length) : 0;

  return {
    daily: dailyAverage,
    weekly: weeklyAverage,
    monthly: monthlyAverage,
  };
};

export const getProductivityDetails = async (page: number, limit: number, startDate?: string, endDate?: string) => {
  const skip = (page - 1) * limit;
  
  const where: Prisma.DailyLogWhereInput = {
    ...(startDate && endDate ? {
      logDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.dailyLog.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        logDate: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.dailyLog.count({ where }),
  ]);

  const totalWorkers = await prisma.user.count({
    where: {
      role: {
        name: 'operator',
      },
    },
  });

  return {
    data: logs.map(log => ({
      date: log.logDate.toISOString().split('T')[0],
      binning: log.binningCount || 0,
      picking: log.pickingCount || 0,
      totalWorkers,
      workersPresent: log.isPresent ? 1 : 0,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSevenDayTrend = async () => {
  const end = new Date();
  const start = subDays(end, 6);

  const logs = await prisma.dailyLog.findMany({
    where: {
      logDate: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      logDate: 'asc',
    },
  });

  // Create a map of dates to ensure we have all 7 days
  const dateMap = new Map<string, { date: string; items: number }>();
  for (let i = 0; i < 7; i++) {
    const date = subDays(end, i);
    dateMap.set(date.toISOString().split('T')[0], {
      date: date.toISOString().split('T')[0],
      items: 0,
    });
  }

  // Fill in the actual data
  logs.forEach(log => {
    const date = log.logDate.toISOString().split('T')[0];
    const items = (log.binningCount || 0) + (log.pickingCount || 0);
    dateMap.set(date, {
      date,
      items,
    });
  });

  return Array.from(dateMap.values()).reverse();
}; 