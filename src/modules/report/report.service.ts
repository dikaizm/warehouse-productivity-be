import { ReportData, ReportFilter, ReportDataPoint, ReportMeta, ReportExportFilter, ExportFormat } from "./report.type";
import { PrismaClient } from "@prisma/client";
import { startOfDay, endOfDay, format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import logger from "../../utils/logger";
import { ROLES } from "../../config/constants";
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

// Helper function to get report data (used by both filter and export)
const getReportDataInternal = async (filter: ReportFilter): Promise<ReportData> => {
    try {
        const { startDate, endDate, type, search } = filter;

        // Get all operational users (filtered by search if provided)
        const users = await prisma.user.findMany({
            where: {
                role: {
                    name: ROLES.OPERASIONAL
                },
                ...(search && {
                    OR: [
                        { fullName: { contains: search } }
                    ]
                })
            },
            select: {
                id: true,
                fullName: true,
                email: true
            }
        });

        // Get logs within date range
        const logs = await prisma.dailyLog.findMany({
            where: {
                logDate: {
                    gte: startOfDay(startDate),
                    lte: endOfDay(endDate)
                }
            },
            include: {
                attendance: {
                    where: {
                        operatorId: {
                            in: users.map(u => u.id)
                        }
                    },
                    include: {
                        operator: {
                            select: {
                                id: true,
                                fullName: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                logDate: 'asc'
            },
            take: 10
        });

        // Initialize data points based on report type
        const dataPoints = new Map<string, Map<number, ReportDataPoint>>();

        // Helper function to get time key based on report type
        const getTimeKey = (date: Date): string => {
            switch (type) {
                case 'daily':
                    return format(date, 'yyyy-MM-dd');
                case 'weekly':
                    return format(date, 'yyyy-\'W\'ww');
                case 'monthly':
                    return format(date, 'yyyy-MM');
                default:
                    return format(date, 'yyyy-MM-dd');
            }
        };

        // Process logs and aggregate data
        logs.forEach(log => {
            const timeKey = getTimeKey(log.logDate);
            if (!dataPoints.has(timeKey)) {
                dataPoints.set(timeKey, new Map());
            }

            const timePointData = dataPoints.get(timeKey)!;
            const presentWorkers = log.attendance.length;
            if (presentWorkers === 0) return;

            const totalItems = log.totalItems || 0;
            const dailyProductivity = totalItems / presentWorkers;

            // Update metrics for each present operator
            log.attendance.forEach(attendance => {
                const operator = attendance.operator;
                if (!timePointData.has(operator.id)) {
                    timePointData.set(operator.id, {
                        time: timeKey,
                        operatorId: operator.id,
                        operatorName: operator.fullName || 'Unknown',
                        binningCount: 0,
                        pickingCount: 0,
                        totalItems: 0,
                        productivity: 0,
                        workdays: 0,
                        attendanceCount: 0
                    });
                }

                const point = timePointData.get(operator.id)!;
                point.binningCount += log.binningCount || 0;
                point.pickingCount += log.pickingCount || 0;
                point.totalItems += totalItems;
                point.workdays++;
                point.attendanceCount++;
                point.productivity = dailyProductivity;
            });
        });

        const allDataPoints = Array.from(dataPoints.values()).flatMap(operatorData => Array.from(operatorData.values()));

        // Calculate meta information
        const totalOperators = users.length;
        const totalWorkdays = allDataPoints.reduce((sum, point) => sum + point.workdays, 0);
        const totalItems = allDataPoints.reduce((sum, point) => sum + point.totalItems, 0);

        const meta: ReportMeta = {
            filter,
            totalOperators,
            totalWorkdays,
            totalItems,
            generatedAt: new Date().toISOString()
        };

        return {
            meta,
            data: allDataPoints
        };
    } catch (error) {
        logger.error('Error in getReportDataInternal service:', error);
        throw error;
    }
};

/**
 * Get report data based on filter parameters
 * @param filter Report filter parameters
 * @returns Promise<ReportData> Report data with meta information
 */
export const getReportData = getReportDataInternal;

/**
 * Export report data to specified format
 * @param filter Report export filter parameters
 * @returns Promise<Buffer> Exported file buffer
 */
export const exportReportData = async (filter: ReportExportFilter): Promise<Buffer> => {
    try {
        const { fileFormat } = filter;
        const reportData = await getReportDataInternal(filter);

        switch (fileFormat) {
            case 'csv':
                return exportToCsv(reportData);
            case 'pdf':
                return exportToPdf(reportData);
            default:
                throw new Error(`Unsupported export format: ${fileFormat}`);
        }
    } catch (error) {
        logger.error('Error in exportReportData service:', error);
        throw error;
    }
};

/**
 * Export report data to CSV format
 * @param reportData Report data to export
 * @returns Promise<Buffer> CSV file buffer
 */
const exportToCsv = async (reportData: ReportData): Promise<Buffer> => {
    const fields = [
        'time',
        'operatorId',
        'operatorName',
        'binningCount',
        'pickingCount',
        'totalItems',
        'productivity',
        'workdays',
        'attendanceCount'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(reportData.data);
    return Buffer.from(csv);
};

/**
 * Export report data to PDF format
 * @param reportData Report data to export
 * @returns Promise<Buffer> PDF file buffer
 */
const exportToPdf = async (reportData: ReportData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const chunks: Buffer[] = [];
            const doc = new PDFDocument();

            // Handle PDF generation events
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Add title
            doc.fontSize(16).text('Report Data', { align: 'center' });
            doc.moveDown();

            // Add meta information
            doc.fontSize(12).text('Meta Information:');
            doc.fontSize(10).text(`Total Operators: ${reportData.meta.totalOperators}`);
            doc.text(`Total Workdays: ${reportData.meta.totalWorkdays}`);
            doc.text(`Total Items: ${reportData.meta.totalItems}`);
            doc.text(`Generated At: ${reportData.meta.generatedAt}`);
            doc.moveDown();

            // Add data table
            doc.fontSize(12).text('Report Data:');
            doc.moveDown();

            // Table headers
            const headers = ['Time', 'Operator', 'Binning', 'Picking', 'Total', 'Productivity', 'Workdays'];
            const columnWidths = [80, 100, 60, 60, 60, 60, 60];
            let x = 50;
            let y = doc.y;

            // Draw headers
            headers.forEach((header, i) => {
                doc.text(header, x, y, { width: columnWidths[i] });
                x += columnWidths[i];
            });

            // Draw data rows
            y += 20;
            reportData.data.forEach(row => {
                x = 50;
                doc.text(row.time, x, y, { width: columnWidths[0] });
                x += columnWidths[0];
                doc.text(row.operatorName, x, y, { width: columnWidths[1] });
                x += columnWidths[1];
                doc.text(row.binningCount.toString(), x, y, { width: columnWidths[2] });
                x += columnWidths[2];
                doc.text(row.pickingCount.toString(), x, y, { width: columnWidths[3] });
                x += columnWidths[3];
                doc.text(row.totalItems.toString(), x, y, { width: columnWidths[4] });
                x += columnWidths[4];
                doc.text(row.productivity.toFixed(2), x, y, { width: columnWidths[5] });
                x += columnWidths[5];
                doc.text(row.workdays.toString(), x, y, { width: columnWidths[6] });
                y += 20;

                // Add new page if needed
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }
            });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};