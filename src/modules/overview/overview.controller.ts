import { Request, Response } from 'express';
import { OverviewService } from './overview.service';

const overviewService = new OverviewService();

export const getOverviewCounts = async (req: Request, res: Response) => {
  try {
    const data = await overviewService.getOverviewCounts();
    return res.json({
      success: true,
      message: 'Overview counts fetched successfully',
      data: data,
    });
  } catch (error) {
    console.error('Error getting overview counts:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getBarProductivity = async (req: Request, res: Response) => {
  try {
    const data = await overviewService.getBarProductivity();
    return res.json({
      success: true,
      message: 'Bar productivity fetched successfully',
      data
    });
  } catch (error) {
    console.error('Error calculating bar productivity:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getTrend = async (req: Request, res: Response) => {
  try {
    const data = await overviewService.getTrend();
    return res.json({
      success: true,
      message: 'Trend fetched successfully',
      data: data,
    });
  } catch (error) {
    console.error('Error getting trend data:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getRecentLogs = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const data = await overviewService.getRecentLogs(Number(limit));
    return res.json({
      success: true,
      message: 'Recent logs fetched successfully',
      data: data,
    });
  } catch (error) {
    console.error('Error getting recent logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};