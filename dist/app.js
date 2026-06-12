"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const path_1 = __importDefault(require("path"));
const error_middleware_1 = require("./middleware/error.middleware");
const logging_middleware_1 = require("./middleware/logging.middleware");
// Import routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const overview_routes_1 = __importDefault(require("./modules/overview/overview.routes"));
const dailyLog_routes_1 = __importDefault(require("./modules/dailyLog/dailyLog.routes"));
const user_routes_1 = __importDefault(require("./modules/user/user.routes"));
const topPerformer_routes_1 = __importDefault(require("./modules/topPerformer/topPerformer.routes"));
const insight_routes_1 = __importDefault(require("./modules/insight/insight.routes"));
const report_routes_1 = __importDefault(require("./modules/report/report.routes"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration: allow origins dynamically and handle preflight
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like curl, server-to-server)
        if (!origin)
            return callback(null, true);
        // In production you might restrict to an allow-list from env
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 204,
};
app.use((0, cors_1.default)(corsOptions));
// Explicitly handle preflight for all routes
app.options('*', (0, cors_1.default)(corsOptions));
// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);
// Logging middleware
app.use(logging_middleware_1.httpLogger);
app.use(logging_middleware_1.requestLogger);
// Body parsing middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// API Documentation
if (process.env.NODE_ENV !== 'production') {
    // Load Swagger document
    const swaggerDocument = yamljs_1.default.load(path_1.default.join(__dirname, '../swagger.yaml'));
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument, {
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
app.use('/api/auth', auth_routes_1.default);
app.use('/api/overview', overview_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/daily-logs', dailyLog_routes_1.default);
app.use('/api/top-performers', topPerformer_routes_1.default);
app.use('/api/insights', insight_routes_1.default);
app.use('/api/reports', report_routes_1.default);
// Error handling
app.use(logging_middleware_1.errorLogger);
app.use(error_middleware_1.errorHandler);
exports.default = app;
