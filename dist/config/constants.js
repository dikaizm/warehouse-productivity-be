"use strict";
/**
 * Application constants and configuration values
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreviousWorkDay = exports.getNextWorkDay = exports.isWorkDay = exports.CACHE = exports.PAGINATION = exports.VALIDATION = exports.TIME = exports.PRODUCTIVITY = exports.WORK_SCHEDULE = exports.ACCESS_LEVEL = exports.TEAM_CATEGORIES = exports.SUB_ROLES = exports.ROLES = void 0;
// Role configuration
exports.ROLES = {
    KEPALA_GUDANG: 'kepala_gudang',
    OPERASIONAL: 'operasional',
    ADMIN_LOGISTIK: 'admin_logistik',
};
exports.SUB_ROLES = {
    LEADER_INCOMING: 'leader_incoming',
    GOOD_RECEIVE: 'good_receive',
    QUALITY_INSPECTION: 'quality_inspection',
    BINNING: 'binning',
    LEADER_OUTGOING: 'leader_outgoing',
    PICKING: 'picking',
    QUALITY_CONTROL: 'quality_control',
};
exports.TEAM_CATEGORIES = {
    BINNING: 'binning',
    PICKING: 'picking',
};
exports.ACCESS_LEVEL = {
    EDITOR: 'editor',
    VIEWER: 'viewer'
};
// Work schedule configuration
exports.WORK_SCHEDULE = {
    // 1 = Monday, 7 = Sunday
    WORK_DAYS: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    WEEKEND_DAYS: [7], // Sunday
    DAYS_OF_WEEK: {
        MONDAY: 1,
        TUESDAY: 2,
        WEDNESDAY: 3,
        THURSDAY: 4,
        FRIDAY: 5,
        SATURDAY: 6,
        SUNDAY: 7
    },
    DAY_NAMES: {
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
        7: 'Sunday'
    }
};
// Productivity configuration
exports.PRODUCTIVITY = {
    TARGET: 55, // Items per day
    WORKDAYS: 22, // 22 workdays per month
    UNITS: {
        BINNING: 'items/day',
        PICKING: 'items/day'
    },
};
// Time configuration
exports.TIME = {
    WORK_HOURS: {
        START: 8, // 8 AM
        END: 17, // 5 PM
        LUNCH_BREAK: {
            START: 12, // 12 PM
            END: 13 // 1 PM
        }
    },
    DATE_FORMAT: 'YYYY-MM-DD',
    TIME_FORMAT: 'HH:mm:ss',
    DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss'
};
// Validation constants
exports.VALIDATION = {
    PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 50,
        REQUIRE_SPECIAL_CHAR: true,
        REQUIRE_NUMBER: true,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true
    },
    USERNAME: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 50,
        ALLOWED_CHARS: /^[a-zA-Z0-9_-]+$/
    }
};
// Pagination defaults
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};
// Cache configuration
exports.CACHE = {
    TTL: {
        SHORT: 60, // 1 minute
        MEDIUM: 300, // 5 minutes
        LONG: 3600, // 1 hour
        VERY_LONG: 86400 // 24 hours
    }
};
// Helper function to check if a day is a work day
const isWorkDay = (dayOfWeek) => {
    return exports.WORK_SCHEDULE.WORK_DAYS.includes(dayOfWeek);
};
exports.isWorkDay = isWorkDay;
// Helper function to get the next work day
const getNextWorkDay = (date) => {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    while (!(0, exports.isWorkDay)(nextDay.getDay() || 7)) {
        nextDay.setDate(nextDay.getDate() + 1);
    }
    return nextDay;
};
exports.getNextWorkDay = getNextWorkDay;
// Helper function to get the previous work day
const getPreviousWorkDay = (date) => {
    const prevDay = new Date(date);
    prevDay.setDate(date.getDate() - 1);
    while (!(0, exports.isWorkDay)(prevDay.getDay() || 7)) {
        prevDay.setDate(prevDay.getDate() - 1);
    }
    return prevDay;
};
exports.getPreviousWorkDay = getPreviousWorkDay;
