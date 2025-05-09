import { z } from 'zod';

export const overviewQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "Start date must be before or equal to end date",
});

export const todayOverviewSchema = z.object({
  date: z.string().optional(),
});

export const productivityTrendsSchema = z.object({
  period: z.enum(['day', 'week', 'month']).default('day'),
});

export const productivityDetailsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(10),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}); 