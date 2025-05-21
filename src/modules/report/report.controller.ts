import { Request, Response, NextFunction } from 'express';
import { getReportData as getReportDataService, exportReportData as exportReportDataService } from './report.service';
import { AppError } from '../../middleware/error.middleware';
import logger from '../../utils/logger';
import { ReportFilterQuery, ReportExportQuery } from './report.schema';
import { format } from 'date-fns';
import path from 'path';
import fs from 'fs';

/**
 * Get report data based on filter parameters
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const getReportData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsedQuery = req.query as unknown as ReportFilterQuery;

        // Validate date range
        if (parsedQuery.startDate > parsedQuery.endDate) {
            throw new AppError(400, 'Start date must be before or equal to end date');
        }

        const reportData = await getReportDataService(parsedQuery);
        res.json({
            success: true,
            data: reportData
        });
    } catch (error) {
        logger.error('Error in getReportData controller:', error);
        next(error);
    }
};

/**
 * Export report data to specified format
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const exportReportData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsedQuery = req.query as unknown as ReportExportQuery;

        // Validate date range
        if (parsedQuery.startDate > parsedQuery.endDate) {
            throw new AppError(400, 'Start date must be before or equal to end date');
        }

        const fileBuffer = await exportReportDataService(parsedQuery);

        // Set appropriate headers based on format
        const contentType = parsedQuery.fileFormat === 'csv' ? 'text/csv' : 'application/pdf';
        const fileExtension = parsedQuery.fileFormat;
        const fileName = `report-${format(new Date(), 'yyyy-MM-dd')}.${fileExtension}`;

        // Save file to local directory
        const reportsDir = path.join(__dirname, '..', '..', '..', 'public', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        const filePath = path.join(reportsDir, fileName);
        fs.writeFileSync(filePath, fileBuffer);

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(fileBuffer);
    } catch (error) {
        logger.error('Error in exportReportData controller:', error);
        next(error);
    }
};
