import { Request, Response, NextFunction } from 'express';
import { getWorkerPresent, getTrendItem, getWorkerPerformance } from './insight.service';
import { AppError } from '../../middleware/error.middleware';
import logger from '../../utils/logger';

export const getWorkerPresentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getWorkerPresent();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in getWorkerPresentController:', error);
    next(error instanceof AppError ? error : new AppError(500, 'Failed to get worker present data'));
  }
};

export const getTrendItemController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // The dates are already transformed by the validation middleware
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      throw new AppError(400, 'Start date and end date are required');
    }

    const result = await getTrendItem(
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in getTrendItemController:', error);
    next(error instanceof AppError ? error : new AppError(500, 'Failed to get trend item data'));
  }
};

export const getWorkerPerformanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const type = req.query.type as 'weekly' | 'monthly';
    const year = req.query.year as unknown as number;

    const result = await getWorkerPerformance(type, year);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in getWorkerPerformanceController:', error);
    next(error instanceof AppError ? error : new AppError(500, 'Failed to get worker performance data'));
  }
}; 