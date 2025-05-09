import { z } from 'zod';

// TODO: Implement createOrUpdateDailyLogSchema
// - logDate: required date
// - isPresent: required boolean
// - binningCount: optional number, min 0
// - pickingCount: optional number, min 0

// TODO: Implement getDailyLogsSchema
// - page: optional number, min 1, default 1
// - limit: optional number, min 1, max 100, default 10
// - startDate: optional date
// - endDate: optional date
// - userId: optional number

// TODO: Implement getDailyLogByIdSchema
// - id: required number

// TODO: Implement deleteDailyLogSchema
// - id: required number

// TODO: Implement getUserDailyLogsSchema
// - userId: required number
// - page: optional number, min 1, default 1
// - limit: optional number, min 1, max 100, default 10
// - startDate: optional date
// - endDate: optional date 