import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';

const prisma = new PrismaClient();

export const createDailyLog = async (
  userId: number,
  logDate: Date,
  isPresent: boolean,
  binningCount?: number,
  pickingCount?: number
) => {
  // Validate date is not in the future
  if (logDate > new Date()) {
    throw new AppError(400, 'Cannot create log for future dates');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Allow both operators and editors to create daily logs
  if (user.role.name !== 'operator' && user.role.name !== 'editor') {
    throw new AppError(403, 'Only operators and editors can create daily logs');
  }

  // Check if log already exists for this date
  const existingLog = await prisma.dailyLog.findUnique({
    where: { logDate },
    include: {
      attendance: {
        where: { operatorId: userId }
      }
    }
  });

  if (existingLog?.attendance.length) {
    throw new AppError(409, 'Daily log already exists for this date');
  }

  const totalItems = (binningCount || 0) + (pickingCount || 0);

  // Create daily log and attendance in a transaction
  const dailyLog = await prisma.$transaction(async (tx) => {
    const log = await tx.dailyLog.create({
      data: {
        logDate,
        binningCount: binningCount || 0,
        pickingCount: pickingCount || 0,
        totalItems,
        attendance: {
          create: {
            operatorId: userId,
            present: isPresent
          }
        }
      },
      include: {
        attendance: {
          include: {
            operator: {
              select: {
                id: true,
                username: true,
                role: true
              }
            }
          }
        }
      }
    });

    return log;
  });

  return dailyLog;
};

export const updateDailyLog = async (
  logId: number,
  userId: number,
  isPresent: boolean,
  binningCount?: number,
  pickingCount?: number
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Allow both operators and editors to update daily logs
  if (user.role.name !== 'operator' && user.role.name !== 'editor') {
    throw new AppError(403, 'Only operators and editors can update daily logs');
  }

  const existingLog = await prisma.dailyLog.findUnique({
    where: { id: logId },
    include: {
      attendance: {
        where: { operatorId: userId },
        include: {
          operator: {
            select: {
              id: true,
              role: true
            }
          }
        }
      }
    }
  });

  if (!existingLog) {
    throw new AppError(404, 'Daily log not found');
  }

  // Only allow update by the log owner or editor
  const userAttendance = existingLog.attendance[0];
  if (!userAttendance && user.role.name !== 'editor') {
    throw new AppError(403, 'Not authorized to update this log');
  }

  const totalItems = (binningCount || 0) + (pickingCount || 0);

  // Update daily log and attendance in a transaction
  const dailyLog = await prisma.$transaction(async (tx) => {
    // Update or create attendance
    if (userAttendance) {
      await tx.attendance.update({
        where: { id: userAttendance.id },
        data: { present: isPresent }
      });
    } else {
      await tx.attendance.create({
        data: {
          dailyLogId: logId,
          operatorId: userId,
          present: isPresent
        }
      });
    }

    // Update daily log
    const log = await tx.dailyLog.update({
      where: { id: logId },
      data: {
        binningCount: binningCount || 0,
        pickingCount: pickingCount || 0,
        totalItems
      },
      include: {
        attendance: {
          include: {
            operator: {
              select: {
                id: true,
                username: true,
                role: true
              }
            }
          }
        }
      }
    });

    return log;
  });

  return dailyLog;
};

export const getDailyLogs = async (
  page: number,
  limit: number,
  startDate?: Date,
  endDate?: Date,
  userId?: number
) => {
  // Validate date range
  if (startDate && endDate && startDate > endDate) {
    throw new AppError(400, 'startDate must be before or equal to endDate');
  }

  // Validate pagination
  if (page < 1) {
    throw new AppError(400, 'page must be at least 1');
  }
  if (limit < 1 || limit > 100) {
    throw new AppError(400, 'limit must be between 1 and 100');
  }

  const where = {
    ...(startDate && endDate && {
      logDate: {
        gte: startDate,
        lte: endDate,
      },
    }),
    ...(userId && {
      attendance: {
        some: {
          operatorId: userId
        }
      }
    }),
  };

  const [total, logs] = await Promise.all([
    prisma.dailyLog.count({ where }),
    prisma.dailyLog.findMany({
      where,
      include: {
        attendance: {
          include: {
            operator: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { logDate: 'desc' },
    }),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getDailyLogById = async (id: number) => {
  if (!id || id < 1) {
    throw new AppError(400, 'Invalid log ID');
  }

  const log = await prisma.dailyLog.findUnique({
    where: { id },
    include: {
      attendance: {
        include: {
          operator: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!log) {
    throw new AppError(404, 'Daily log not found');
  }

  return log;
};

export const deleteDailyLog = async (id: number, userId: number) => {
  if (!id || id < 1) {
    throw new AppError(400, 'Invalid log ID');
  }

  const log = await prisma.dailyLog.findUnique({
    where: { id },
    include: {
      attendance: {
        where: { operatorId: userId },
        include: {
          operator: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });

  if (!log) {
    throw new AppError(404, 'Daily log not found');
  }

  // Only allow deletion by the log owner or admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const userAttendance = log.attendance[0];
  if (!userAttendance && user.role.name !== 'admin') {
    throw new AppError(403, 'Not authorized to delete this log');
  }

  await prisma.dailyLog.delete({ where: { id } });

  return { message: 'Daily log deleted successfully' };
};

export const getUserDailyLogs = async (
  userId: number,
  page: number,
  limit: number,
  startDate?: Date,
  endDate?: Date
) => {
  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Validate date range
  if (startDate && endDate && startDate > endDate) {
    throw new AppError(400, 'startDate must be before or equal to endDate');
  }

  // Validate pagination
  if (page < 1) {
    throw new AppError(400, 'page must be at least 1');
  }
  if (limit < 1 || limit > 100) {
    throw new AppError(400, 'limit must be between 1 and 100');
  }

  const where = {
    attendance: {
      some: {
        operatorId: userId
      }
    },
    ...(startDate && endDate && {
      logDate: {
        gte: startDate,
        lte: endDate,
      },
    }),
  };

  const [total, logs] = await Promise.all([
    prisma.dailyLog.count({ where }),
    prisma.dailyLog.findMany({
      where,
      include: {
        attendance: {
          include: {
            operator: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { logDate: 'desc' },
    }),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getDailyLogStats = async (startDate: Date, endDate: Date, userId: number) => {
  // Validate date range
  if (!startDate || !endDate) {
    throw new AppError(400, 'startDate and endDate are required');
  }

  if (startDate > endDate) {
    throw new AppError(400, 'startDate must be before or equal to endDate');
  }

  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const logs = await prisma.dailyLog.findMany({
    where: {
      logDate: {
        gte: startDate,
        lte: endDate,
      },
      attendance: {
        some: {
          operatorId: userId
        }
      }
    },
    include: {
      attendance: {
        where: {
          operatorId: userId
        }
      }
    }
  });

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const presentDays = logs.filter(log => log.attendance[0]?.present).length;
  const totalBinning = logs.reduce((sum, log) => sum + (log.binningCount || 0), 0);
  const totalPicking = logs.reduce((sum, log) => sum + (log.pickingCount || 0), 0);
  const totalItems = totalBinning + totalPicking;

  return {
    totalBinning,
    totalPicking,
    totalItems,
    averageItemsPerDay: presentDays > 0 ? totalItems / presentDays : 0,
    presentDays,
    totalDays,
    attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
  };
}; 