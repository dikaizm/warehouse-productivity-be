import { Router } from 'express';
import { validate } from '../../middleware/validation.middleware';
import { authorizeRole, authenticateJWT } from '../../middleware/auth.middleware';
import { reportFilterSchema, reportExportSchema } from './report.schema';
import { getReportData, exportReportData } from './report.controller';
import { ROLES } from '../../config/constants';

const router = Router();

// Get report filter data
router.get(
  '/filter',
  authenticateJWT,
  authorizeRole([ROLES.KEPALA_GUDANG]),
  validate(reportFilterSchema),
  getReportData
);

// Export report data
router.get(
  '/export',
  authenticateJWT,
  authorizeRole([ROLES.KEPALA_GUDANG]),
  validate(reportExportSchema),
  exportReportData
);

export default router;