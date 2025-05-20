import { Router } from 'express';
import { z } from 'zod';
import { authenticateJWT, authorizeRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import overviewRoutes from '../modules/overview/overview.routes';

const router = Router();

// Auth Routes
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  roleId: z.number().int().positive()
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

router.post('/auth/register', validateRequest(registerSchema), /* register handler */);
router.post('/auth/login', validateRequest(loginSchema), /* login handler */);
router.post('/auth/refresh', /* refresh token handler */);

// Daily Log Routes
const dailyLogCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  binning: z.number().int().min(0),
  picking: z.number().int().min(0),
  presentOperatorIds: z.array(z.number().int().positive()),
  notes: z.string().optional()
});

const dailyLogUpdateSchema = dailyLogCreateSchema.partial();

router.post('/daily-log',
  authenticateJWT,
  authorizeRole('edit'),
  validateRequest(dailyLogCreateSchema),
  /* create daily log handler */
);

router.get('/daily-log',
  authenticateJWT,
  validateRequest(z.object({
    operator: z.number().int().positive().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    search: z.string().optional(),
    sort: z.enum(['date', 'totalItems', 'binning', 'picking']).optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  })),
  /* get daily logs handler */
);

router.patch('/daily-log/:id',
  authenticateJWT,
  authorizeRole(['editor']),
  validateRequest(dailyLogUpdateSchema),
  /* update daily log handler */
);

router.delete('/daily-log/:id',
  authenticateJWT,
  authorizeRole(['editor']),
  /* delete daily log handler */
);

// Insights Routes
router.get('/insights/attendance-pie',
  authenticateJWT,
  validateRequest(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  })),
  /* get attendance pie data handler */
);

router.get('/insights/binning-vs-picking',
  authenticateJWT,
  validateRequest(z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  })),
  /* get binning vs picking data handler */
);

router.get('/insights/operator-performance',
  authenticateJWT,
  validateRequest(z.object({
    period: z.enum(['weekly', 'monthly'])
  })),
  /* get operator performance data handler */
);

// Top Performers Route
router.get('/top-performers',
  authenticateJWT,
  validateRequest(z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/)
  })),
  /* get top performers handler */
);

// Reports Routes
const reportGenerateSchema = z.object({
  operatorId: z.number().int().positive().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['daily', 'weekly', 'monthly'])
});

router.post('/reports',
  authenticateJWT,
  validateRequest(reportGenerateSchema),
  /* generate report handler */
);

router.get('/reports/history',
  authenticateJWT,
  validateRequest(z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10)
  })),
  /* get report history handler */
);

// Settings Routes
router.get('/settings',
  authenticateJWT,
  /* get settings handler */
);

router.patch('/settings',
  authenticateJWT,
  authorizeRole(['editor']),
  validateRequest(z.object({
    workSchedule: z.array(z.object({
      dayOfWeek: z.number().int().min(1).max(7),
      isWorkday: z.boolean()
    })),
    productivityTarget: z.number().int().positive()
  })),
  /* update settings handler */
);

// User Management Routes
const userCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  roleId: z.number().int().positive(),
  isActive: z.boolean().default(true)
});

const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

router.post('/users',
  authenticateJWT,
  authorizeRole(['editor']),
  validateRequest(userCreateSchema),
  /* create user handler */
);

router.get('/users',
  authenticateJWT,
  validateRequest(z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
    role: z.number().int().positive().optional(),
    isActive: z.boolean().optional()
  })),
  /* get users handler */
);

router.patch('/users/:id',
  authenticateJWT,
  authorizeRole(['editor']),
  validateRequest(userUpdateSchema),
  /* update user handler */
);

router.delete('/users/:id',
  authenticateJWT,
  authorizeRole(['editor']),
  /* delete user handler */
);

// Overview Routes
router.use('/overview', overviewRoutes);

export default router; 