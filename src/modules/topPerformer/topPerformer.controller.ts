import { Request, Response } from 'express';
import { getTopPerformers } from './topPerformer.service';

export const getTopPerformersController = async (req: Request, res: Response) => {
  const { search } = req.query;

  const topPerformers = await getTopPerformers(search as string);
  
  res.json({
    success: true,
    data: topPerformers
  });
}; 