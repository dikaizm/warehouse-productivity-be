"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReportEmail = exports.exportReportData = exports.getReportData = void 0;
const report_service_1 = require("./report.service");
const error_middleware_1 = require("../../middleware/error.middleware");
const logger_1 = __importDefault(require("../../utils/logger"));
const date_fns_1 = require("date-fns");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.MAIL_RESEND_API_KEY);
/**
 * Get report data based on filter parameters
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
const getReportData = async (req, res, next) => {
    try {
        const { startDate, endDate, type, search, sortBy, sortOrder, operatorIds } = req.query;
        if (!startDate || !endDate || !type) {
            throw new error_middleware_1.AppError(400, 'startDate, endDate, and type are required');
        }
        const filter = {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            type,
            search,
            sortBy,
            sortOrder,
            operatorIds
        };
        const reportData = await (0, report_service_1.getReportData)(filter);
        res.json({
            success: true,
            data: reportData
        });
    }
    catch (error) {
        logger_1.default.error('Error in getReportData controller:', error);
        next(error);
    }
};
exports.getReportData = getReportData;
/**
 * Export report data to specified format
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
const exportReportData = async (req, res, next) => {
    try {
        const { startDate, endDate, type, search, sortBy, sortOrder, operatorIds, fileFormat, email } = req.query;
        if (!startDate || !endDate || !type || !fileFormat) {
            throw new error_middleware_1.AppError(400, 'startDate, endDate, type, and fileFormat are required');
        }
        const filter = {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            type,
            search,
            sortBy,
            sortOrder,
            operatorIds,
            fileFormat,
            email
        };
        const fileBuffer = await (0, report_service_1.exportReportData)(filter);
        const contentType = fileFormat === 'csv' ? 'text/csv' : 'application/pdf';
        const fileExtension = fileFormat;
        const fileName = `report_${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.${fileExtension}`;
        const reportsDir = path_1.default.join(__dirname, '..', '..', '..', 'public', 'reports');
        if (!fs_1.default.existsSync(reportsDir)) {
            fs_1.default.mkdirSync(reportsDir, { recursive: true });
        }
        const filePath = path_1.default.join(reportsDir, fileName);
        fs_1.default.writeFileSync(filePath, fileBuffer);
        logger_1.default.info(`Report exported to ${filePath}`);
        if (email)
            await (0, exports.sendReportEmail)(email, filePath);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(fileBuffer);
    }
    catch (error) {
        logger_1.default.error('Error in exportReportData controller:', error);
        next(error);
    }
};
exports.exportReportData = exportReportData;
const sendReportEmail = async (email, filePath) => {
    const fileContent = fs_1.default.readFileSync(filePath); // Read file as buffer
    const { data, error } = await resend.emails.send({
        from: 'Produktivitas Gudang <info@stelarhub.com>',
        to: email,
        subject: 'Laporan Produktivitas Gudang - ' + (0, date_fns_1.format)(new Date(), 'dd MMMM yyyy'),
        text: 'Laporan Produktivitas Gudang',
        attachments: [
            {
                filename: filePath.split('/').pop(), // just the file name
                content: fileContent
            }
        ]
    });
    if (error) {
        logger_1.default.error('Error in sendReportEmail:', error);
        throw new error_middleware_1.AppError(500, 'Failed to send report email');
    }
    if (!data)
        throw new error_middleware_1.AppError(500, 'Failed to send report email');
    logger_1.default.info(`Report email sent to ${email}`);
    return data;
};
exports.sendReportEmail = sendReportEmail;
