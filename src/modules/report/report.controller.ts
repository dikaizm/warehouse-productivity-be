import { Request, Response, NextFunction } from 'express';
import { getReportData as getReportDataService, exportReportData as exportReportDataService } from './report.service';
import { AppError } from '../../middleware/error.middleware';
import logger from '../../utils/logger';
import { ReportFilterQuery, ReportExportQuery } from './report.schema';
import { format } from 'date-fns';
import path from 'path';
import fs from 'fs';
import { CreateEmailResponseSuccess, Resend } from 'resend';

const resend = new Resend(process.env.MAIL_RESEND_API_KEY);

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
        const contentType = parsedQuery.fileFormat === 'csv' ? 'text/csv' : 'application/pdf';
        const fileExtension = parsedQuery.fileFormat;
        const fileName = `report_${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.${fileExtension}`;

        // Ensure reports directory exists
        const reportsDir = path.join(__dirname, '..', '..', '..', 'public', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        const filePath = path.join(reportsDir, fileName);
        // Save file
        fs.writeFileSync(filePath, fileBuffer);
        logger.info(`Report exported to ${filePath}`);

        // Send email
        if (parsedQuery.email) await sendReportEmail(parsedQuery.email, filePath);

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(fileBuffer);
    } catch (error) {
        logger.error('Error in exportReportData controller:', error);
        next(error);
    }
};

export const sendReportEmail = async (email: string, filePath: string): Promise<CreateEmailResponseSuccess> => {
    const fileContent = fs.readFileSync(filePath); // Read file as buffer

    const { data, error } = await resend.emails.send({
        from: 'Produktivitas Gudang <info@stelarhub.com>',
        to: email,
        subject: 'Laporan Produktivitas Gudang - ' + format(new Date(), 'dd MMMM yyyy'),
        text: 'Laporan Produktivitas Gudang',
        attachments: [
            {
                filename: filePath.split('/').pop()!, // just the file name
                content: fileContent
            }
        ]
    });

    if (error) {
        logger.error('Error in sendReportEmail:', error);
        throw new AppError(500, 'Failed to send report email');
    }

    if (!data) throw new AppError(500, 'Failed to send report email');
    logger.info(`Report email sent to ${email}`);

    return data;
}