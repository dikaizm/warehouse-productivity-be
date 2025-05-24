import { PrismaClient } from '@prisma/client';
import { TopPerformer } from './topPerformer.type';
import { PRODUCTIVITY, ROLES, TEAM_CATEGORIES } from '../../config/constants';
import logger from '../../utils/logger';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export const getTopPerformers = async (search: string): Promise<TopPerformer[]> => {
  try {
    // Get operational users
    const operationalUsers = await prisma.user.findMany({
      where: {
        role: {
          name: ROLES.OPERASIONAL
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
        email: true,
        subRole: {
          select: {
            name: true,
            teamCategory: true
          }
        }
      }
    });

    const binningUsers = operationalUsers.filter(user => user.subRole?.teamCategory === TEAM_CATEGORIES.BINNING);
    const pickingUsers = operationalUsers.filter(user => user.subRole?.teamCategory === TEAM_CATEGORIES.PICKING);

    // Get all daily logs
    const logs = await prisma.dailyLog.findMany({
      include: {
        attendance: {
          where: {
            operatorId: {
              in: [...binningUsers.map(user => user.id), ...pickingUsers.map(user => user.id)]
            }
          },
          include: {
            operator: {
              select: {
                id: true,
                fullName: true,
                subRole: {
                  select: {
                    name: true,
                    teamCategory: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        logDate: 'asc'
      }
    });

    const topPerformers: TopPerformer[] = [];

    for (const user of operationalUsers) {
      const userLogs = logs.filter(log => log.attendance.some(attendance => attendance.operatorId === user.id));

      const performer: TopPerformer = {
        operatorId: user.id,
        operatorName: user.fullName ?? '',
        avgMonthlyProductivity: 0,
        avgMonthlyWorkdays: 0,
        productivity: {
          avgActual: 0,
          target: PRODUCTIVITY.TARGET * PRODUCTIVITY.WORKDAYS
        },
        operatorSubRole: {
          name: user.subRole?.name ?? '',
          teamCategory: user.subRole?.teamCategory ?? ''
        }
      }

      const monthlyProcessedItems: {
        monthYear: string;
        processedItems: number;
        workdays: number;
      }[] = [];

      for (const log of userLogs) {
        const monthYear = format(log.logDate, 'yyyy-MM');
        const existingItem = monthlyProcessedItems.find(item => item.monthYear === monthYear);
        if (!existingItem) {
          let workdays = 0;

          for (const attendance of log.attendance) {
            if (attendance.operatorId === user.id) {
              workdays++;
            }
          }

          if (performer.operatorSubRole.teamCategory === TEAM_CATEGORIES.BINNING) {
            monthlyProcessedItems.push({monthYear, processedItems: log.binningCount ?? 0, workdays})
          } else {
            monthlyProcessedItems.push({monthYear, processedItems: log.pickingCount ?? 0, workdays})
          }
        } else {
          if (performer.operatorSubRole.teamCategory === TEAM_CATEGORIES.BINNING) {
            existingItem.processedItems += log.binningCount ?? 0;
          } else {
            existingItem.processedItems += log.pickingCount ?? 0;
          }
        }
      }

      const monthlyProductivity: {
        monthYear: string;
        productivity: number;
      }[] = [];

      for (const item of monthlyProcessedItems) {
        const existingItem = monthlyProductivity.find(item => item.monthYear === item.monthYear);
        if (!existingItem) {
          monthlyProductivity.push({monthYear: item.monthYear, productivity: item.processedItems / item.workdays * PRODUCTIVITY.TARGET})
        } else {
          existingItem.productivity += item.processedItems / item.workdays * PRODUCTIVITY.TARGET;
        }
      }

      const monthlyProductivitySum = monthlyProductivity.reduce((acc, item) => acc + item.productivity, 0);
      const monthlyWorkdaysSum = monthlyProcessedItems.reduce((acc, item) => acc + item.workdays, 0);

      const avgMonthlyProductivity = monthlyProductivitySum / (monthlyProductivity.length * PRODUCTIVITY.TARGET);
      const avgMonthlyWorkdays = monthlyWorkdaysSum / monthlyProductivity.length;

      performer.avgMonthlyProductivity = avgMonthlyProductivity;
      performer.avgMonthlyWorkdays = avgMonthlyWorkdays;
      performer.productivity.avgActual = avgMonthlyProductivity;
      performer.productivity.target = PRODUCTIVITY.TARGET * PRODUCTIVITY.WORKDAYS;

      topPerformers.push(performer);
    }

    topPerformers.sort((a, b) => b.avgMonthlyProductivity - a.avgMonthlyProductivity);

    return topPerformers;
  } catch (error) {
    logger.error('Error in getTopPerformers:', error);
    throw error;
  }
}; 