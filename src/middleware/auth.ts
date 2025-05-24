import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import env from '../config/env';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface UserJwt {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserJwt | undefined;
    }
  }
}

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      id: number;
      username: string;
      role: string;
    };
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: true
      }
    });

    if (!user) {
      logger.warn('Authentication failed: User not found', { userId: decoded.id });
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Set req.user with required properties
    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName || '',
      role: user.role.name
    };
    
    next();
  } catch (error) {
    logger.warn('Authentication failed: Invalid token', { error: error instanceof Error ? error.message : 'Unknown error' });
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// For backward compatibility
export const authorizeRole = (allowedRoles: string[] | 'edit' | 'view') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const role = await prisma.role.findFirst({
      where: { name: req.user.role }
    });

    if (!role) {
      logger.warn('Authorization failed: Role not found', { role: req.user.role });
      return res.status(403).json({
        success: false,
        message: 'Role not found'
      });
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
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions for edit access'
        });
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
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }
    }

    next();
  };
}; 