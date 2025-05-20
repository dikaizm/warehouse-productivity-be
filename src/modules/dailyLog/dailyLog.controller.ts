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

export const createDailyLogController = async (req: Request, res: Response) => {
  try {
    const { logDate, isPresent, binningCount, pickingCount } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const dailyLog = await createDailyLog(
      userId,
      new Date(logDate),
      isPresent,
      binningCount,
      pickingCount
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
    const { isPresent, binningCount, pickingCount } = req.body;
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
      isPresent,
      binningCount,
      pickingCount
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
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;

    // Validate pagination parameters
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
      throw new AppError(400, 'Invalid pagination parameters');
    }

    // Validate date range if provided
    if ((startDate && !endDate) || (!startDate && endDate)) {
      throw new AppError(400, 'Both startDate and endDate must be provided for date filtering');
    }

    const result = await getDailyLogs(
      page,
      limit,
      startDate,
      endDate,
      userId
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