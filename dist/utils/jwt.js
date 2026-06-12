"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const generateAccessToken = (payload) => {
    const options = {
        expiresIn: env_1.default.JWT_ACCESS_EXPIRES_IN,
    };
    return jsonwebtoken_1.default.sign(payload, env_1.default.JWT_ACCESS_SECRET, options);
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    const options = {
        expiresIn: env_1.default.JWT_REFRESH_EXPIRES_IN,
    };
    return jsonwebtoken_1.default.sign(payload, env_1.default.JWT_REFRESH_SECRET, options);
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.default.JWT_ACCESS_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = async (token) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.default.JWT_REFRESH_SECRET);
        return payload;
    }
    catch (error) {
        throw new Error('Invalid refresh token');
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
