import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { errorHandler } from './middleware/error.middleware';
import { httpLogger, requestLogger, errorLogger } from './middleware/logging.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import overviewRoutes from './modules/overview/overview.routes';
import dailyLogRoutes from './modules/dailyLog/dailyLog.routes';
import userRoutes from './modules/user/user.routes';
import topPerformersRoutes from './modules/topPerformer/topPerformer.routes';
import insightRoutes from './modules/insight/insight.routes';
import reportRoutes from './modules/report/report.routes';
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration: allow origins dynamically and handle preflight
const corsOptions = {
  origin: (origin: any, callback: any) => {
    // Allow requests with no origin (like curl, server-to-server)
    if (!origin) return callback(null, true);
    // In production you might restrict to an allow-list from env
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Explicitly handle preflight for all routes
app.options('*', cors(corsOptions));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// Logging middleware
app.use(httpLogger);
app.use(requestLogger);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Documentation
if (process.env.NODE_ENV !== 'production') {
  // Load Swagger document
  const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Warehouse Productivity API Documentation",
    customfavIcon: "/favicon.ico",
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showCommonExtensions: true,
    }
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/top-performers', topPerformersRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/reports', reportRoutes);

// Error handling
app.use(errorLogger);
app.use(errorHandler);

export default app; 