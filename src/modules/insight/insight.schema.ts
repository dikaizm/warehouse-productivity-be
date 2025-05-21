import { z } from 'zod';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export const getTrendItemSchema = z.object({
  query: z.object({
    startDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .transform(str => startOfDay(new Date(str)))
      .default(() => format(startOfDay(subDays(new Date(), 30)), 'yyyy-MM-dd')),
    endDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
      .transform(str => endOfDay(new Date(str)))
      .default(() => format(endOfDay(new Date()), 'yyyy-MM-dd'))
  })
});

export const getWorkerPerformanceSchema = z.object({
  query: z.object({
    type: z.enum(['weekly', 'monthly']),
    year: z.string()
      .transform((val) => {
        const num = parseInt(val, 10);
        if (isNaN(num)) {
          throw new Error('Year must be a valid number');
        }
        const currentYear = new Date().getFullYear();
        if (num < 2020 || num > currentYear) {
          throw new Error(`Year must be between 2020 and ${currentYear}`);
        }
        return num;
      })
  })
});