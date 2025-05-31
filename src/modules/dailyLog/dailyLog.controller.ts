import { Request, Response } from 'express';
import {
  createDailyLog,
  updateDailyLog,
  getDailyLogs,
  getDailyLogById,
  deleteDailyLog,
  getUserDailyLogs,
  getDailyLogStats,
} from './dailyLog.service';
import { AppError } from '../../middleware/error.middleware';
import { PrismaClient } from '@prisma/client';
import { ROLES } from '../../config/constants';

const prisma = new PrismaClient();

export const createDailyLogController = async (req: Request, res: Response) => {
  try {
    const { 
      logDate, 
      workerPresents, 
      workNotes, 
      binningSmallType = 0,
      binningFloorType = 0,
      binningHeavyDutyType = 0,
      binningCabinetType = 0,
      pickingSmallType = 0,
      pickingFloorType = 0,
      pickingHeavyDutyType = 0,
      pickingCabinetType = 0
    } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Verify user has permission to create logs
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Only editors can create logs for multiple workers
    if (workerPresents.length > 1 && user.role.name !== ROLES.KEPALA_GUDANG) {
      throw new AppError(403, 'Only editors can create logs for multiple workers');
    }

    const dailyLog = await createDailyLog(
      new Date(logDate),
      workerPresents,
      workNotes,
      binningSmallType,
      binningFloorType,
      binningHeavyDutyType,
      binningCabinetType,
      pickingSmallType,
      pickingFloorType,
      pickingHeavyDutyType,
      pickingCabinetType
    );

    res.status(201).json({
      success: true,
      message: 'Daily log created successfully',
      data: dailyLog
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      console.error('Create daily log error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

export const updateDailyLogController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { binningSmallType = 0, binningFloorType = 0, binningHeavyDutyType = 0, binningCabinetType = 0, pickingSmallType = 0, pickingFloorType = 0, pickingHeavyDutyType = 0, pickingCabinetType = 0, workerPresents, workNotes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const logId = parseInt(id);
    if (isNaN(logId)) {
      throw new AppError(400, 'Invalid log ID');
    }

    const dailyLog = await updateDailyLog(
      logId,
      userId,
      binningSmallType,
      binningFloorType,
      binningHeavyDutyType,
      binningCabinetType,
      pickingSmallType,
      pickingFloorType,
      pickingHeavyDutyType,
      pickingCabinetType,
      workerPresents,
      workNotes
    );

    res.status(200).json({
      success: true,
      message: 'Daily log updated successfully',
      data: dailyLog
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

export const getDailyLogsController = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, startDate, endDate, search, sort, direction } = req.query;

  const logs = await getDailyLogs(
    Number(page),
    Number(limit),
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined,
    search as string,
    sort as 'logDate' | 'attendanceCount' | 'binningCount' | 'pickingCount' | 'totalItems' | 'productivity' | undefined,
    direction as 'asc' | 'desc' | undefined
  );

  res.json({
    success: true,
    data: logs
  });
};

export const getDailyLogByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const logId = parseInt(id);

    if (isNaN(logId)) {
      throw new AppError(400, 'Invalid log ID');
    }

    const dailyLog = await getDailyLogById(logId);
    res.status(200).json({
      success: true,
      data: dailyLog
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

export const deleteDailyLogController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const logId = parseInt(id);

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (isNaN(logId)) {
      throw new AppError(400, 'Invalid log ID');
    }

    const result = await deleteDailyLog(logId, userId);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

export const getUserDailyLogsController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '10', startDate, endDate } = req.query;

    // Validate user ID
    const targetUserId = parseInt(userId);
    if (isNaN(targetUserId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    // Validate pagination parameters
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      throw new AppError(400, 'Invalid pagination parameters');
    }

    // Validate date range if provided
    if ((startDate && !endDate) || (!startDate && endDate)) {
      throw new AppError(400, 'Both startDate and endDate must be provided for date filtering');
    }

    const result = await getUserDailyLogs(
      targetUserId,
      pageNum,
      limitNum,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

export const getDailyLogStatsController = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId } = req.query;

    if (!startDate || !endDate || !userId) {
      throw new AppError(400, 'startDate, endDate, and userId are required');
    }

    const stats = await getDailyLogStats(
      new Date(startDate as string),
      new Date(endDate as string),
      Number(userId)
    );

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}; 