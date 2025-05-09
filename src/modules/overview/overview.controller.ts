import { Request, Response } from 'express';
import {
  getTodayOverview,
  getProductivityTrends,
  getProductivityDetails,
  getSevenDayTrend,
} from './overview.service';

export const getTodayOverviewHandler = async (req: Request, res: Response) => {
  const { date } = req.query;
  const overview = await getTodayOverview(date as string);
  
  res.json({
    success: true,
    message: 'Today\'s overview retrieved successfully',
    data: overview,
  });
};

export const getProductivityTrendsHandler = async (req: Request, res: Response) => {
  const { period } = req.query;
  const trends = await getProductivityTrends(period as 'day' | 'week' | 'month');
  
  res.json({
    success: true,
    message: 'Productivity trends retrieved successfully',
    data: trends,
  });
};

export const getProductivityDetailsHandler = async (req: Request, res: Response) => {
  const { page, limit, startDate, endDate } = req.query;
  const details = await getProductivityDetails(
    Number(page) || 1,
    Number(limit) || 10,
    startDate as string,
    endDate as string
  );
  
  res.json({
    success: true,
    message: 'Productivity details retrieved successfully',
    data: details,
  });
};

export const getSevenDayTrendHandler = async (req: Request, res: Response) => {
  const trend = await getSevenDayTrend();
  
  res.json({
    success: true,
    message: 'Seven day trend retrieved successfully',
    data: trend,
  });
}; 