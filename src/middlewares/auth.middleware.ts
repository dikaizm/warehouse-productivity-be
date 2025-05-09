import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { AppError } from './error.middleware';
import prisma from '../config/prisma';
import type { Prisma } from '@prisma/client';

interface UserRoleWithRole {
  role: {
    name: string;
  };
}

interface JwtPayload {
  id: number;
  username: string;
  role?: string;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: string;
      };
    }
  }
}

export const requireAuth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError(401, 'No token provided');
      }

      const token = authHeader.split(' ')[1];

      try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          include: {
            role: true,
          },
        });

        if (!user) {
          throw new AppError(401, 'User not found');
        }

        req.user = {
          id: user.id,
          username: user.username,
          role: user.role.name,
        };

        next();
      } catch (error) {
        throw new AppError(401, 'Invalid token');
      }
    } catch (error) {
      next(error);
    }
  };
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      if (!req.user.role || !roles.includes(req.user.role)) {
        throw new AppError(403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}; 