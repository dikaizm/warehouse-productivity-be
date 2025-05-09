import { Request, Response } from 'express';
import { register, login, refreshToken, logout } from './auth.service';
import { AppError } from '../../middlewares/error.middleware';

export const registerHandler = async (req: Request, res: Response) => {
  const { username, email, password, fullName, roleId } = req.body;

  const user = await register({
    username,
    email,
    password,
    fullName,
    roleId,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: user,
  });
};

export const loginHandler = async (req: Request, res: Response) => {
  const { usernameOrEmail, password } = req.body;

  const result = await login(usernameOrEmail, password);

  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError(400, 'Refresh token is required');
  }

  const result = await refreshToken(refreshToken);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: result,
  });
};

export const logoutHandler = async (req: Request, res: Response) => {
  await logout(Number(req.user!.id));

  res.json({
    success: true,
    message: 'Logout successful',
  });
}; 