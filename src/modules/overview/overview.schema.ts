import { z } from 'zod';

// Validation Schemas
export const trendSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const recentLogsSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10)
});

// Response Types
export interface OverviewCountsResponse {
  totalItemsToday: number;
  presentWorkers: number;
  productivityTarget: number;
  productivityActual: number;
}

export interface BarProductivityResponse {
  productivity: Array<{
    date: Date;
    count: number;
  }>;
  target: number;
}

export interface TrendDataPoint {
  date: Date;
  productivity: number;
  totalItems: number;
}

export interface RecentLogResponse {
  id: number;
  logDate: Date;
  binningCount: number;
  pickingCount: number;
  totalItems: number | null;
  issueNotes: string | null;
  totalWorkers: number;
  attendance: {
    operator: {
      id: number;
      username: string;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
} 

export interface TrendResponse {
  daily_average: number;
  weekly_average: number;
  monthly_average: number;
}