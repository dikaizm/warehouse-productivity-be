import { ROLES, SUB_ROLES } from '../../config/constants';

export type RoleName = keyof typeof ROLES;
export type SubRoleName = keyof typeof SUB_ROLES;

export type CreateUserRequest = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: RoleName;
  subRole?: SubRoleName;
};

export type UpdateUserRequest = CreateUserRequest;

export type UserRole = {
  id: number;
  name: RoleName;
  editAccess: boolean;
  viewAccess: boolean;
  description: string | null;
};

export type UserSubRole = {
  id: number;
  name: SubRoleName;
};

export type UserResponse = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  subRole?: UserSubRole;
  createdAt: Date;
  updatedAt: Date;
};