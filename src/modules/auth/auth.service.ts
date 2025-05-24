import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../middleware/error.middleware';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prismaClient = new PrismaClient();

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
  roleId: z.number().int().positive(),
  subRoleId: z.number().int().positive()
});

export const register = async (data: z.infer<typeof registerSchema>) => {
  // Check if username already exists
  const existingUser = await prismaClient.user.findFirst({
    where: {
      OR: [
        { username: data.username },
        { email: data.email }
      ]
    },
  });

  if (existingUser) {
    throw new AppError(409, 'Username or email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const role = await prismaClient.role.findUnique({
    where: {
      id: data.roleId
    }
  });

  if (!role) {
    throw new AppError(404, 'Role not found');
  }

  // Create user with role
  const user = await prismaClient.user.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash: hashedPassword,
      fullName: data.fullName,
      roleId: data.roleId,
      subRoleId: data.subRoleId,
      isActive: true,
    },
    include: {
      role: true,
      subRole: true
    }
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role.name,
    subRole: user.subRole.name
  };
};

export const login = async (usernameOrEmail: string, password: string) => {
  // Find user by username or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    },
    include: {
      role: true
    },
  });

  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    id: user.id,
    username: user.username,
    role: user.role.name
  });
  const refreshToken = generateRefreshToken({
    id: user.id,
    username: user.username
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshToken = async (token: string) => {
  try {
    // Verify refresh token
    const payload = await verifyRefreshToken(token);

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        role: true
      },
    });

    if (!user) {
      throw new AppError(401, 'Invalid refresh token');
    }

    // Generate new tokens
    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      role: user.role.name
    });
    const newRefreshToken = generateRefreshToken({ id: user.id, username: user.username });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw new AppError(401, 'Invalid refresh token');
  }
};

export const logout = async (userId: number) => {
  // In a real application, you might want to invalidate the refresh token
  // or add it to a blacklist. For now, we'll just return success.
  return true;
}; 