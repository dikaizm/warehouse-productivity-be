import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { CreateUserRequest, UpdateUserRequest, UserResponse, RoleName, SubRoleName, UserMeResponse } from './user.type';
import { AppError } from '../../utils/error';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export const getUsers = async (role: string): Promise<UserResponse[]> => {
  const users = await prisma.user.findMany({
    ...(role ? {
      where: {
        role: {
          name: role
        }
      }
    } : {}),
    include: {
      role: true,
      subRole: true
    },
    orderBy: {
      fullName: 'asc'
    }
  });

  return users.map(user => ({
    id: user.id,
    fullName: user.fullName || '',
    username: user.username,
    email: user.email,
    role: {
      id: user.role.id,
      name: user.role.name as RoleName,
      editAccess: user.role.editAccess,
      viewAccess: user.role.viewAccess,
      description: user.role.description
    },
    subRole: {
      id: user.subRoleId,
      name: user.subRole.name as SubRoleName,
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }));
};

export const getUserById = async (id: number): Promise<UserMeResponse> => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      subRole: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
    id: user.id,
    fullName: user.fullName || '',
    username: user.username,
    email: user.email,
    role: user.role.name as RoleName
  };
};

export const createUser = async (data: CreateUserRequest): Promise<UserResponse> => {
  // Check if username or email already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: data.username },
        { email: data.email }
      ]
    }
  });

  if (existingUser) {
    throw new AppError(
      existingUser.username === data.username ? 'Username already exists' : 'Email already exists',
      400
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Get role
  const role = await prisma.role.findUnique({
    where: { name: data.role }
  });

  // Get sub role
  const subRole = await prisma.subRole.findUnique({
    where: { name: data.subRole }
  });

  if (!role) {
    throw new AppError('Invalid role', 400);
  }

  if (!subRole) {
    throw new AppError('Invalid sub role', 400);
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      passwordHash: hashedPassword,
      roleId: role.id,
      subRoleId: subRole.id
    },
    include: {
      role: true,
      subRole: true
    }
  });

  return {
    id: user.id,
    fullName: user.fullName || '',
    username: user.username,
    email: user.email,
    role: {
      id: user.role.id,
      name: user.role.name as RoleName,
      editAccess: user.role.editAccess,
      viewAccess: user.role.viewAccess,
      description: user.role.description
    },
    subRole: {
      id: user.subRoleId,
      name: user.subRole.name as SubRoleName,
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

export const updateUser = async (id: number, data: UpdateUserRequest): Promise<UserResponse> => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      subRole: true
    }
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  // Check if username or email is being changed and if it already exists
  if (data.username || data.email) {
    const duplicateUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              ...(data.username ? [{ username: data.username }] : []),
              ...(data.email ? [{ email: data.email }] : [])
            ]
          }
        ]
      }
    });

    if (duplicateUser) {
      throw new AppError(
        duplicateUser.username === data.username ? 'Username already exists' : 'Email already exists',
        400
      );
    }
  }

  // Get role if being updated
  let roleId = existingUser.roleId;
  if (data.role) {
    const role = await prisma.role.findUnique({
      where: { name: data.role }
    });

    if (!role) {
      throw new AppError('Invalid role', 400);
    }
    roleId = role.id;
  }

  // Hash password if being updated
  let passwordHash = existingUser.passwordHash;
  if (data.password) {
    passwordHash = await bcrypt.hash(data.password, 10);
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      passwordHash,
      roleId
    },
    include: {
      role: true,
      subRole: true
    }
  });

  return {
    id: updatedUser.id,
    fullName: updatedUser.fullName || '',
    username: updatedUser.username,
    email: updatedUser.email,
    role: {
      id: updatedUser.role.id,
      name: updatedUser.role.name as RoleName,
      editAccess: updatedUser.role.editAccess,
      viewAccess: updatedUser.role.viewAccess,
      description: updatedUser.role.description
    },
    subRole: {
      id: updatedUser.subRoleId,
      name: updatedUser.subRole.name as SubRoleName,
    },
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt
  };
};

export const deleteUser = async (id: number): Promise<void> => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Delete user
  await prisma.user.delete({
    where: { id }
  });
};