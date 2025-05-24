import { z } from 'zod';
import { ReportFilter, ExportFormat } from './report.type';

// Base validation schema for report filter
const baseReportFilterSchema = z.object({
  query: z.object({
    startDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .transform(str => new Date(str)),
    endDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
      .transform(str => new Date(str)),
    type: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    search: z.string().optional(),
    operatorIds: z.string()
      .transform(str => str.split(',').map(id => parseInt(id, 10)))
      .optional(),
    sortBy: z.enum(['time', 'operatorName', 'totalItems', 'productivity']).default('time'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
});

// Validation schema for report filter
export const reportFilterSchema = baseReportFilterSchema;

// Validation schema for report export
export const reportExportSchema = baseReportFilterSchema.extend({
  query: baseReportFilterSchema.shape.query.extend({
    fileFormat: z.enum(['csv', 'pdf']).default('csv'), 
    email: z.string().email()
  })
});

// Type for the parsed query parameters
export type ReportFilterQuery = z.infer<typeof reportFilterSchema>['query'];
export type ReportExportQuery = z.infer<typeof reportExportSchema>['query'];
