import { z } from 'zod';

export const createDailyLogSchema = z.object({
  body: z.object({
    logDate: z.string({
      required_error: 'logDate is required',
      invalid_type_error: 'logDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid date format. Please use YYYY-MM-DD',
      }),
    workerPresents: z.array(
      z.number({
        required_error: 'Worker ID is required',
        invalid_type_error: 'Worker ID must be a number',
      })
      .int('Worker ID must be an integer')
      .positive('Worker ID must be a positive number')
    ).min(0, 'At least one worker must be present'),
    workNotes: z.string().optional(),
    binningCount: z.number({
      invalid_type_error: 'binningCount must be a number',
    })
      .min(0, 'binningCount must be a non-negative number')
      .optional(),
    pickingCount: z.number({
      invalid_type_error: 'pickingCount must be a number',
    })
      .min(0, 'pickingCount must be a non-negative number')
      .optional(),
  }),
});

export const updateDailyLogSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: 'id is required',
      invalid_type_error: 'id must be a number',
    })
      .transform(Number)
      .pipe(z.number().int('id must be an integer').positive('id must be a positive number')),
  }),
  body: z.object({
    binningCount: z.number({
      invalid_type_error: 'binningCount must be a number',
    })
      .min(0, 'binningCount must be a non-negative number')
      .optional(),
    pickingCount: z.number({
      invalid_type_error: 'pickingCount must be a number',
    })
      .min(0, 'pickingCount must be a non-negative number')
      .optional(),
    totalItems: z.number({
      invalid_type_error: 'totalItems must be a number',
    })
      .min(0, 'totalItems must be a non-negative number')
      .optional(),
    workerPresents: z.array(
      z.number({
        required_error: 'Worker ID is required',
        invalid_type_error: 'Worker ID must be a number',
      })
      .int('Worker ID must be an integer')
      .positive('Worker ID must be a positive number')
    ).min(0, 'At least one worker must be present'),
    workNotes: z.string().optional(),
  }),
});

export const getDailyLogsSchema = z.object({
  query: z.object({
    page: z.string({
      invalid_type_error: 'page must be a number',
    })
      .transform(Number)
      .pipe(z.number().min(1, 'page must be at least 1'))
      .default('1'),
    limit: z.string({
      invalid_type_error: 'limit must be a number',
    })
      .transform(Number)
      .pipe(z.number().min(1, 'limit must be at least 1').max(100, 'limit cannot exceed 100'))
      .default('10'),
    startDate: z.string({
      invalid_type_error: 'startDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid startDate format. Please use YYYY-MM-DD',
      })
      .optional(),
    endDate: z.string({
      invalid_type_error: 'endDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid endDate format. Please use YYYY-MM-DD',
      })
      .optional(),
    userId: z.string({
      invalid_type_error: 'userId must be a number',
    })
      .transform(Number)
      .pipe(z.number().int('userId must be an integer'))
      .optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
    direction: z.string().optional(),
  }).optional().refine(
    (data) => {
      if (data?.startDate && data?.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: 'startDate must be before or equal to endDate',
      path: ['startDate'],
    }
  ),
});

export const getDailyLogByIdSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: 'id is required',
      invalid_type_error: 'id must be a number',
    })
      .transform(Number)
      .pipe(z.number().int('id must be an integer').positive('id must be a positive number')),
  }),
});

export const deleteDailyLogSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: 'id is required',
      invalid_type_error: 'id must be a number',
    })
      .transform(Number)
      .pipe(z.number().int('id must be an integer').positive('id must be a positive number')),
  }),
});

export const getUserDailyLogsSchema = z.object({
  params: z.object({
    userId: z.string({
      required_error: 'userId is required',
      invalid_type_error: 'userId must be a number',
    })
      .transform(Number)
      .pipe(z.number().int('userId must be an integer').positive('userId must be a positive number')),
  }),
  query: z.object({
    page: z.string({
      invalid_type_error: 'page must be a number',
    })
      .transform(Number)
      .pipe(z.number().min(1, 'page must be at least 1'))
      .default('1'),
    limit: z.string({
      invalid_type_error: 'limit must be a number',
    })
      .transform(Number)
      .pipe(z.number().min(1, 'limit must be at least 1').max(100, 'limit cannot exceed 100'))
      .default('10'),
    startDate: z.string({
      invalid_type_error: 'startDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid startDate format. Please use YYYY-MM-DD',
      })
      .optional(),
    endDate: z.string({
      invalid_type_error: 'endDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid endDate format. Please use YYYY-MM-DD',
      })
      .optional(),
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: 'startDate must be before or equal to endDate',
      path: ['startDate'],
    }
  ),
});

export const getDailyLogStatsSchema = z.object({
  query: z.object({
    startDate: z.string({
      required_error: 'startDate is required',
      invalid_type_error: 'startDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid startDate format. Please use YYYY-MM-DD',
      }),
    endDate: z.string({
      required_error: 'endDate is required',
      invalid_type_error: 'endDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid endDate format. Please use YYYY-MM-DD',
      }),
    userId: z.string({
      required_error: 'userId is required',
      invalid_type_error: 'userId must be a number',
    })
      .transform(Number)
      .pipe(z.number().int('userId must be an integer').positive('userId must be a positive number')),
  }).refine(
    (data) => data.startDate <= data.endDate,
    {
      message: 'startDate must be before or equal to endDate',
      path: ['startDate'],
    }
  ),
});