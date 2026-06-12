"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverviewService = void 0;
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const constants_1 = require("../../config/constants");
const prisma = new client_1.PrismaClient();
class OverviewService {
    async getOverviewCounts() {
        const today = new Date();
        const startOfToday = (0, date_fns_1.startOfDay)(today);
        const endOfToday = (0, date_fns_1.endOfDay)(today);
        const dailyLog = await prisma.dailyLog.findFirst({
            where: {
                logDate: {
                    gte: startOfToday,
                    lte: endOfToday
                }
            },
            include: {
                attendance: {
                    include: {
                        operator: {
                            select: {
                                id: true,
                                fullName: true,
                                subRole: {
                                    select: {
                                        name: true,
                                        teamCategory: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!dailyLog) {
            return {
                totalItemsToday: 0,
                presentWorkers: 0,
                productivityTarget: constants_1.PRODUCTIVITY.TARGET,
                productivityActual: 0
            };
        }
        let binningAttendance = 0;
        let pickingAttendance = 0;
        dailyLog.attendance.forEach(attendance => {
            const operator = attendance.operator;
            if (operator.subRole.teamCategory === constants_1.TEAM_CATEGORIES.BINNING) {
                binningAttendance++;
            }
            else if (operator.subRole.teamCategory === constants_1.TEAM_CATEGORIES.PICKING) {
                pickingAttendance++;
            }
        });
        const binningProd = binningAttendance > 0 ? dailyLog.binningCount / binningAttendance : 0;
        const pickingProd = pickingAttendance > 0 ? dailyLog.pickingCount / pickingAttendance : 0;
        const productivityActual = (binningProd + pickingProd) / 2;
        return {
            totalItemsToday: dailyLog.totalItems ?? 0,
            presentWorkers: dailyLog.attendance.length,
            productivityTarget: constants_1.PRODUCTIVITY.TARGET,
            productivityActual: Math.round(productivityActual)
        };
    }
    async getBarProductivity() {
        // Calculate the date range for the last 7 days
        const end = (0, date_fns_1.endOfDay)(new Date());
        const start = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(end, 7 - 1));
        const dailyLogs = await prisma.dailyLog.findMany({
            where: {
                logDate: {
                    gte: start,
                    lte: end
                }
            },
            select: {
                logDate: true,
                binningCount: true,
                pickingCount: true,
                attendance: {
                    select: {
                        operatorId: true,
                        operator: {
                            select: {
                                id: true,
                                subRole: {
                                    select: {
                                        name: true,
                                        teamCategory: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                logDate: 'asc'
            }
        });
        // Calculate productivity for each day
        const productivityData = dailyLogs.map(log => {
            let binningAttendance = 0;
            let pickingAttendance = 0;
            log.attendance.forEach(attendance => {
                const operator = attendance.operator;
                if (operator?.subRole?.teamCategory === constants_1.TEAM_CATEGORIES.BINNING) {
                    binningAttendance++;
                }
                else if (operator?.subRole?.teamCategory === constants_1.TEAM_CATEGORIES.PICKING) {
                    pickingAttendance++;
                }
            });
            const binningProd = binningAttendance > 0 ? log.binningCount / binningAttendance : 0;
            const pickingProd = pickingAttendance > 0 ? log.pickingCount / pickingAttendance : 0;
            const productivity = (binningProd + pickingProd) / 2;
            return {
                date: log.logDate,
                count: Math.round(productivity)
            };
        });
        // Fill in missing days with zero productivity
        const allDays = Array.from({ length: 7 }, (_, i) => {
            const date = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(end, 7 - 1 - i));
            return date;
        });
        const filledData = allDays.map(date => {
            const existingData = productivityData.find(d => d.date.getTime() === date.getTime());
            return existingData || { date, count: 0 };
        });
        return {
            productivity: filledData,
            target: constants_1.PRODUCTIVITY.TARGET
        };
    }
    async getTrend() {
        // Fetch all logs without date restriction
        const logs = await prisma.dailyLog.findMany({
            select: {
                binningCount: true,
                pickingCount: true,
                logDate: true,
                attendance: {
                    select: {
                        operatorId: true
                    }
                }
            },
            orderBy: {
                logDate: 'asc'
            }
        });
        // Calculate daily productivity for each day
        const dailyProductivities = logs.map(log => {
            const totalItems = (log.binningCount || 0) + (log.pickingCount || 0);
            const operatorCount = log.attendance.length;
            return operatorCount > 0 ? Math.round(totalItems / operatorCount) : 0;
        });
        // Calculate weekly averages
        const weeklyGroups = new Map();
        logs.forEach(log => {
            const weekStart = (0, date_fns_1.startOfWeek)(log.logDate);
            const weekKey = weekStart.toISOString();
            const group = weeklyGroups.get(weekKey) || { items: 0, operators: 0, count: 0 };
            group.items += (log.binningCount || 0) + (log.pickingCount || 0);
            group.operators += log.attendance.length;
            group.count += 1;
            weeklyGroups.set(weekKey, group);
        });
        const weeklyProductivities = Array.from(weeklyGroups.values()).map(group => {
            const avgItems = group.items / group.count;
            const avgOperators = group.operators / group.count;
            return avgOperators > 0 ? Math.round(avgItems / avgOperators) : 0;
        });
        // Calculate monthly averages
        const monthlyGroups = new Map();
        logs.forEach(log => {
            const monthStart = (0, date_fns_1.startOfMonth)(log.logDate);
            const monthKey = monthStart.toISOString();
            const group = monthlyGroups.get(monthKey) || { items: 0, operators: 0, count: 0 };
            group.items += (log.binningCount || 0) + (log.pickingCount || 0);
            group.operators += log.attendance.length;
            group.count += 1;
            monthlyGroups.set(monthKey, group);
        });
        const monthlyProductivities = Array.from(monthlyGroups.values()).map(group => {
            const avgItems = group.items / group.count;
            const avgOperators = group.operators / group.count;
            return avgOperators > 0 ? Math.round(avgItems / avgOperators) : 0;
        });
        // Calculate final averages
        const calculateAverage = (numbers) => {
            if (numbers.length === 0)
                return 0;
            const sum = numbers.reduce((a, b) => a + b, 0);
            return Math.round(sum / numbers.length);
        };
        return {
            daily_average: calculateAverage(dailyProductivities),
            weekly_average: calculateAverage(weeklyProductivities),
            monthly_average: calculateAverage(monthlyProductivities)
        };
    }
    async getRecentLogs(limit) {
        // Find total worker that role is operasional
        const totalWorkers = await prisma.user.count({
            where: {
                role: {
                    name: 'operasional'
                }
            }
        });
        const recentLogs = await prisma.dailyLog.findMany({
            take: limit,
            orderBy: {
                logDate: 'desc'
            },
            include: {
                attendance: {
                    include: {
                        operator: {
                            select: {
                                id: true,
                                username: true
                            }
                        }
                    }
                }
            }
        });
        return recentLogs.map(log => ({
            ...log,
            totalWorkers
        }));
    }
}
exports.OverviewService = OverviewService;
