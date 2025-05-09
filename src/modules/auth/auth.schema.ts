import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
  roleId: z.number().int().positive(),
});

export const loginSchema = z.object({
  usernameOrEmail: z.string(),
  password: z.string(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
}); 