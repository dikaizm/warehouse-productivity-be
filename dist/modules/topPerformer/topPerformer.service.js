"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopPerformers = void 0;
const client_1 = require("@prisma/client");
const constants_1 = require("../../config/constants");
const logger_1 = __importDefault(require("../../utils/logger"));
const prisma = new client_1.PrismaClient();
const getTopPerformers = async (search) => {
    try {
        // Ambil semua operator operasional
        const operationalUsers = await prisma.user.findMany({
            where: {
                role: { name: constants_1.ROLES.OPERASIONAL },
                ...(search && {
                    OR: [
                        { fullName: { contains: search } },
                        { email: { contains: search } },
                    ]
                })
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                subRole: {
                    select: {
                        name: true,
                        teamCategory: true,
                    }
                }
            }
        });
        const FIXED_MONTH_TARGET = 22 * 55; // 22 hari kerja × 55 items per hari
        // Inisialisasi performerMap dengan target tetap
        const performerMap = {};
        operationalUsers.forEach(u => {
            performerMap[u.id] = {
                operatorId: u.id,
                operatorName: u.fullName,
                currentMonthWorkdays: 0,
                currentMonthItems: {
                    actual: 0,
                    target: FIXED_MONTH_TARGET
                },
                operatorSubRole: u.subRole,
            };
        });
        // Rentang tanggal: awal & akhir bulan ini
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        // Ambil logs bulan ini untuk semua operator tsb
        const logs = await prisma.dailyLog.findMany({
            where: {
                logDate: { gte: firstOfMonth, lte: lastOfMonth }
            },
            include: {
                attendance: {
                    where: {
                        operatorId: { in: operationalUsers.map(u => u.id) }
                    },
                    include: {
                        operator: {
                            select: {
                                id: true,
                                subRole: { select: { teamCategory: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { logDate: 'asc' }
        });
        // Hitung actual
        for (const log of logs) {
            const binOps = log.attendance.filter(a => a.operator.subRole.teamCategory === constants_1.TEAM_CATEGORIES.BINNING).length;
            const pickOps = log.attendance.filter(a => a.operator.subRole.teamCategory === constants_1.TEAM_CATEGORIES.PICKING).length;
            const perBinning = binOps > 0 ? log.binningCount / binOps : 0;
            const perPicking = pickOps > 0 ? log.pickingCount / pickOps : 0;
            for (const att of log.attendance) {
                const perf = performerMap[att.operator.id];
                if (!perf)
                    continue;
                if (att.operator.subRole.teamCategory === constants_1.TEAM_CATEGORIES.BINNING) {
                    perf.currentMonthItems.actual += perBinning;
                }
                else {
                    perf.currentMonthItems.actual += perPicking;
                }
                perf.currentMonthWorkdays++;
            }
        }
        // Ubah map jadi array & sortir by actual desc
        return Object.values(performerMap)
            .sort((a, b) => b.currentMonthItems.actual - a.currentMonthItems.actual);
    }
    catch (error) {
        logger_1.default.error('Error in getTopPerformers:', error);
        throw error;
    }
};
exports.getTopPerformers = getTopPerformers;
