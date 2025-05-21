import { z } from 'zod';
import { ROLES } from '../../config/constants';

const roleEnum = z.enum([ROLES.KEPALA_GUDANG, ROLES.OPERASIONAL, ROLES.ADMIN_LOGISTIK]);

export const createUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: roleEnum
  })
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => !isNaN(parseInt(val)), {
      message: 'User ID must be a number'
    })
  }),
  body: z.object({
    fullName: z.string().min(1, 'Full name is required').optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    role: roleEnum.optional()
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  })
}); 