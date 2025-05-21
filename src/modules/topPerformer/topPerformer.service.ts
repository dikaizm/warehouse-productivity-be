import { PrismaClient } from '@prisma/client';
import { TopPerformer } from './topPerformer.type';
import { PRODUCTIVITY } from '../../config/constants';
import logger from '../../utils/logger';
import { startOfMonth, endOfMonth, eachMonthOfInterval, format } from 'date-fns';

const prisma = new PrismaClient();

export const getTopPerformers = async (search: string): Promise<TopPerformer[]> => {
  try {
    // First, get all operational users
    const operationalUsers = await prisma.user.findMany({
      where: {
        role: {
          name: 'operasional'
        },
        ...(search && {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } }
          ]
        })
      },
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });

    // Initialize metrics for all operational users
    const operatorMetrics = new Map(
      operationalUsers.map(user => [
        user.id,
        {
          operatorId: user.id,
          operatorName: user.fullName || user.email || 'Unknown',
          dailyProductivities: [] as number[], // Track daily productivity values
          monthlyWorkdays: new Map<string, number>(), // Track workdays per month
          totalItems: 0
        }
      ])
    );

    // Get all daily logs with attendance
    const logs = await prisma.dailyLog.findMany({
      include: {
        attendance: {
          where: {
            present: true,
            operatorId: {
              in: Array.from(operatorMetrics.keys())
            }
          },
          include: {
            operator: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        logDate: 'asc'
      }
    });

    // Process logs to calculate daily productivity
    logs.forEach(log => {
      const presentWorkers = log.attendance.length;
      if (presentWorkers === 0) return;

      const totalItems = log.totalItems || 0;
      const dailyProductivity = totalItems / presentWorkers;
      const monthKey = format(log.logDate, 'yyyy-MM');

      // Update metrics for each present operator
      log.attendance.forEach(attendance => {
        const operator = attendance.operator;
        const metrics = operatorMetrics.get(operator.id)!;
        
        // Add daily productivity
        metrics.dailyProductivities.push(dailyProductivity);
        metrics.totalItems += totalItems;

        // Update monthly workdays
        const currentWorkdays = metrics.monthlyWorkdays.get(monthKey) || 0;
        metrics.monthlyWorkdays.set(monthKey, currentWorkdays + 1);
      });
    });

    // Calculate averages and format results for all operators
    const topPerformers: TopPerformer[] = Array.from(operatorMetrics.values())
      .map(metrics => {
        // Calculate average monthly workdays
        const monthlyWorkdaysArray = Array.from(metrics.monthlyWorkdays.values());
        const avgMonthlyWorkdays = monthlyWorkdaysArray.length > 0
          ? monthlyWorkdaysArray.reduce((sum, days) => sum + days, 0) / monthlyWorkdaysArray.length
          : 0;

        // Calculate average productivity from daily values
        const avgMonthlyProductivity = metrics.dailyProductivities.length > 0
          ? metrics.dailyProductivities.reduce((sum, val) => sum + val, 0) / metrics.dailyProductivities.length
          : 0;

        const productivity = {
          avgActual: Math.round(avgMonthlyProductivity),
          target: PRODUCTIVITY.TARGET
        };

        return {
          operatorId: metrics.operatorId,
          operatorName: metrics.operatorName,
          avgMonthlyProductivity: Math.round(avgMonthlyProductivity),
          avgMonthlyWorkdays: Math.round(avgMonthlyWorkdays),
          productivity
        };
      })
      .sort((a, b) => b.productivity.avgActual - a.productivity.avgActual);

    return topPerformers;
  } catch (error) {
    logger.error('Error in getTopPerformers:', error);
    throw error;
  }
}; 