import { Request, Response, NextFunction } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from './user.service';
import { AppError } from '../../utils/error';
import logger from '../../utils/logger';

export const getUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const role = req.query.role as string;

    const result = await getUsers(role);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in getUsersController:', error);
    next(error instanceof AppError ? error : new AppError('Failed to get users', 500));
  }
};

export const createUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createUser(req.body);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in createUserController:', error);
    next(error instanceof AppError ? error : new AppError('Failed to create user', 500));
  }
};

export const updateUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError('Invalid user ID', 400);
    }

    const result = await updateUser(id, req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in updateUserController:', error);
    next(error instanceof AppError ? error : new AppError('Failed to update user', 500));
  }
};

export const deleteUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError('Invalid user ID', 400);
    }

    await deleteUser(id);
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteUserController:', error);
    next(error instanceof AppError ? error : new AppError('Failed to delete user', 500));
  }
}; 