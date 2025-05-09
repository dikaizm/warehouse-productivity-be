import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './error.middleware';
import logger from '../utils/logger';

export const validate = (schema: AnyZodObject) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // If schema has body property, validate the entire request object
    // Otherwise, assume schema is for request body only
    if ('body' in schema.shape) {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
    } else {
      await schema.parseAsync(req.body);
    }
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error('Validation error', {
        errors: error.errors,
        body: req.body,
      });
      
      const errorMessage = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      
      next(new AppError(400, `Validation error: ${errorMessage}`));
    } else {
      next(error);
    }
  }
}; 