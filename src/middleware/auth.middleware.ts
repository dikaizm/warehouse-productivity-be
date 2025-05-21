import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import env from '../config/env';
import logger from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface UserJwt {
  id: number;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserJwt;
    }
  }
}

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as UserJwt;
      
      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          role: true
        }
      });

      if (!user) {
        logger.warn('Authentication failed: User not found', { userId: decoded.id });
        throw new AppError(401, 'User not found');
      }

      // Set req.user with required properties
      req.user = {
        id: user.id,
        username: user.username,
        role: user.role.name
      };
      
      next();
    } catch (error) {
      logger.warn('Authentication failed: Invalid token', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new AppError(401, 'Invalid token');
    }
  } catch (error) {
    next(error);
  }
};

export const authorizeRole = (allowedRoles: string[] | 'edit' | 'view') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }

      const role = await prisma.role.findFirst({
        where: { name: req.user.role }
      });

      if (!role) {
        logger.warn('Authorization failed: Role not found', { role: req.user.role });
        throw new AppError(403, 'Role not found');
      }

      // Handle new access type check
      if (allowedRoles === 'edit') {
        // After migration, we'll check the editAccess field
        // For now, just check if the role is 'editor'
        if (role.name !== 'editor') {
          logger.warn('Authorization failed: Insufficient permissions for edit access', { 
            userRole: role.name,
            requiredAccess: 'edit'
          });
          throw new AppError(403, 'Insufficient permissions for edit access');
        }
      } else if (allowedRoles === 'view') {
        // After migration, we'll check the viewAccess field
        // For now, allow any authenticated user
        // No additional checks needed
      } else {
        // Handle legacy array of roles check
        if (!allowedRoles.includes(role.name)) {
          logger.warn('Authorization failed: Insufficient permissions', { 
            userRole: role.name,
            allowedRoles
          });
          throw new AppError(403, 'Insufficient permissions');
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}; 