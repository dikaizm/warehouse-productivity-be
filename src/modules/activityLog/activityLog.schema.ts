import { z } from 'zod';

// TODO: Implement createActivityLogSchema
// - userId: required number
// - dataType: required string, enum ['binning', 'picking', 'attendance']
// - status: required string, enum ['success', 'failure']
// - changeHistory: optional object

// TODO: Implement getActivityLogsSchema
// - page: optional number, min 1, default 1
// - limit: optional number, min 1, max 100, default 10
// - startDate: optional date
// - endDate: optional date
// - userId: optional number
// - dataType: optional string, enum ['binning', 'picking', 'attendance']
// - status: optional string, enum ['success', 'failure']

// TODO: Implement getActivityLogByIdSchema
// - id: required number

// TODO: Implement getUserActivityLogsSchema
// - userId: required number
// - page: optional number, min 1, default 1
// - limit: optional number, min 1, max 100, default 10
// - startDate: optional date
// - endDate: optional date
// - dataType: optional string, enum ['binning', 'picking', 'attendance']
// - status: optional string, enum ['success', 'failure']

// TODO: Implement getActivityStatsSchema
// - startDate: optional date
// - endDate: optional date
// - dataType: optional string, enum ['binning', 'picking', 'attendance'] 