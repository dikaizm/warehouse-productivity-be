import { ROLES } from '../../config/constants';

export type RoleName = keyof typeof ROLES;

export type CreateUserRequest = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: RoleName;
};

export type UpdateUserRequest = CreateUserRequest;

export type UserRole = {
  id: number;
  name: RoleName;
  editAccess: boolean;
  viewAccess: boolean;
  description: string | null;
};

export type UserResponse = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};