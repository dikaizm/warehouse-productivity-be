import { PrismaClient } from '@prisma/client';
import { TopPerformer } from './topPerformer.type';
import { PRODUCTIVITY, ROLES, TEAM_CATEGORIES } from '../../config/constants';
import logger from '../../utils/logger';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export const getTopPerformers = async (search: string): Promise<TopPerformer[]> => {
  try {
    // Ambil semua operator operasional
    const operationalUsers = await prisma.user.findMany({
      where: {
        role: { name: ROLES.OPERASIONAL },
        ...(search && {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } },
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
            teamCategory: true,
          }
        }
      }
    });

    const FIXED_MONTH_TARGET = 22 * 55; // 22 hari kerja × 55 items per hari

    // Inisialisasi performerMap dengan target tetap
    const performerMap: Record<string, TopPerformer> = {};
    operationalUsers.forEach(u => {
      performerMap[u.id] = {
        operatorId: u.id,
        operatorName: u.fullName,
        currentMonthWorkdays: 0,
        currentMonthItems: {
          actual: 0,
          target: FIXED_MONTH_TARGET
        },
        operatorSubRole: u.subRole,
      };
    });

    // Rentang tanggal: awal & akhir bulan ini
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Ambil logs bulan ini untuk semua operator tsb
    const logs = await prisma.dailyLog.findMany({
      where: {
        logDate: { gte: firstOfMonth, lte: lastOfMonth }
      },
      include: {
        attendance: {
          where: {
            operatorId: { in: operationalUsers.map(u => u.id) }
          },
          include: {
            operator: {
              select: {
                id: true,
                subRole: { select: { teamCategory: true } }
              }
            }
          }
        }
      },
      orderBy: { logDate: 'asc' }
    });

    // Hitung actual
    for (const log of logs) {
      const binOps = log.attendance.filter(a => a.operator.subRole.teamCategory === TEAM_CATEGORIES.BINNING).length;
      const pickOps = log.attendance.filter(a => a.operator.subRole.teamCategory === TEAM_CATEGORIES.PICKING).length;

      const perBinning = binOps > 0 ? log.binningCount / binOps : 0;
      const perPicking = pickOps > 0 ? log.pickingCount / pickOps : 0;

      for (const att of log.attendance) {
        const perf = performerMap[att.operator.id];
        if (!perf) continue;

        if (att.operator.subRole.teamCategory === TEAM_CATEGORIES.BINNING) {
          perf.currentMonthItems.actual += perBinning;
        } else {
          perf.currentMonthItems.actual += perPicking;
        }

        perf.currentMonthWorkdays++;
      }
    }

    // Ubah map jadi array & sortir by actual desc
    return Object.values(performerMap)
      .sort((a, b) => b.currentMonthItems.actual - a.currentMonthItems.actual);

  } catch (error) {
    logger.error('Error in getTopPerformers:', error);
    throw error;
  }
};