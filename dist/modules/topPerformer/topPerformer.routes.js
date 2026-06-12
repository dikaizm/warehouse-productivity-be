"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const topPerformer_controller_1 = require("./topPerformer.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, topPerformer_controller_1.getTopPerformersController);
exports.default = router;
