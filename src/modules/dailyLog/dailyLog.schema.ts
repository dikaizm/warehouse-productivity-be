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
    ).min(1, 'At least one worker must be present'),
    workNotes: z.string().optional(),
    binningSmallType: z.number({
      invalid_type_error: 'binningSmallType must be a number',
    })
      .min(0, 'binningSmallType must be a non-negative number')
      .default(0),
    binningFloorType: z.number({
      invalid_type_error: 'binningFloorType must be a number',
    })
      .min(0, 'binningFloorType must be a non-negative number')
      .default(0),
    binningHeavyDutyType: z.number({
      invalid_type_error: 'binningHeavyDutyType must be a number',
    })
      .min(0, 'binningHeavyDutyType must be a non-negative number')
      .default(0),
    binningCabinetType: z.number({
      invalid_type_error: 'binningCabinetType must be a number',
    })
      .min(0, 'binningCabinetType must be a non-negative number')
      .default(0),
    pickingSmallType: z.number({
      invalid_type_error: 'pickingSmallType must be a number',
    })
      .min(0, 'pickingSmallType must be a non-negative number')
      .default(0),
    pickingFloorType: z.number({
      invalid_type_error: 'pickingFloorType must be a number',
    })
      .min(0, 'pickingFloorType must be a non-negative number')
      .default(0),
    pickingHeavyDutyType: z.number({
      invalid_type_error: 'pickingHeavyDutyType must be a number',
    })
      .min(0, 'pickingHeavyDutyType must be a non-negative number')
      .default(0),
    pickingCabinetType: z.number({
      invalid_type_error: 'pickingCabinetType must be a number',
    })
      .min(0, 'pickingCabinetType must be a non-negative number')
      .default(0),
  }).refine(
    (data) => {
      const binningTotal = data.binningSmallType + data.binningFloorType + data.binningHeavyDutyType + data.binningCabinetType;
      const pickingTotal = data.pickingSmallType + data.pickingFloorType + data.pickingHeavyDutyType + data.pickingCabinetType;
      return binningTotal > 0 || pickingTotal > 0;
    },
    {
      message: 'At least one item type must have a count greater than 0',
      path: ['binningSmallType'],
    }
  ),
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
    binningSmallType: z.number({
      invalid_type_error: 'binningSmallType must be a number',
    })
      .min(0, 'binningSmallType must be a non-negative number')
      .optional(),
    binningFloorType: z.number({
      invalid_type_error: 'binningFloorType must be a number',
    })
      .min(0, 'binningFloorType must be a non-negative number')
      .optional(),
    binningHeavyDutyType: z.number({
      invalid_type_error: 'binningHeavyDutyType must be a number',
    })
      .min(0, 'binningHeavyDutyType must be a non-negative number')
      .optional(),
    binningCabinetType: z.number({
      invalid_type_error: 'binningCabinetType must be a number',
    })
      .min(0, 'binningCabinetType must be a non-negative number')
      .optional(),
    pickingSmallType: z.number({
      invalid_type_error: 'pickingSmallType must be a number',
    })
      .min(0, 'pickingSmallType must be a non-negative number')
      .optional(),
    pickingFloorType: z.number({
      invalid_type_error: 'pickingFloorType must be a number',
    })
      .min(0, 'pickingFloorType must be a non-negative number')
      .optional(),
    pickingHeavyDutyType: z.number({
      invalid_type_error: 'pickingHeavyDutyType must be a number',
    })
      .min(0, 'pickingHeavyDutyType must be a non-negative number')
      .optional(),
    pickingCabinetType: z.number({
      invalid_type_error: 'pickingCabinetType must be a number',
    })
      .min(0, 'pickingCabinetType must be a non-negative number')
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