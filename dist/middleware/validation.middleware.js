"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const error_middleware_1 = require("./error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const validate = (schema) => async (req, res, next) => {
    try {
        // If schema has body, params, or query properties, validate the entire request object
        // Otherwise, assume schema is for request body only
        if ('body' in schema.shape || 'params' in schema.shape || 'query' in schema.shape) {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
        }
        else {
            await schema.parseAsync(req.body);
        }
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            logger_1.default.warn('Validation failed', {
                errors: error.errors,
                path: req.path,
                method: req.method,
                body: req.body,
                params: req.params,
                query: req.query
            });
            const errorMessage = error.errors
                .map((err) => `${err.path.join('.')}: ${err.message}`)
                .join(', ');
            next(new error_middleware_1.AppError(400, `Validation error: ${errorMessage}`));
        }
        else {
            next(error);
        }
    }
};
exports.validate = validate;
