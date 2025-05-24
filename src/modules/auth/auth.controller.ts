import { Request, Response } from 'express';
import { register, login, refreshToken, logout } from './auth.service';
import { AppError } from '../../middleware/error.middleware';

export const registerHandler = async (req: Request, res: Response) => {
  try {
    const { username, email, password, fullName, roleId, subRoleId } = req.body;

    const user = await register({
      username,
      email,
      password,
      fullName,
      roleId,
      subRoleId
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
      });
    }
    
    // For unexpected errors
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
    });
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;

    const result = await login(usernameOrEmail, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
      });
    }
    
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }``

    const result = await refreshToken(token);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
      });
    }
    
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during token refresh',
    });
  }
};

export const logoutHandler = async (req: Request, res: Response) => {
  try {
    await logout(Number(req.user!.id));

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
      });
    }
    
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout',
    });
  }
}; 