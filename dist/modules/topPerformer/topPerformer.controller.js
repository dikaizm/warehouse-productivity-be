"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopPerformersController = void 0;
const topPerformer_service_1 = require("./topPerformer.service");
const getTopPerformersController = async (req, res) => {
    const { search } = req.query;
    const topPerformers = await (0, topPerformer_service_1.getTopPerformers)(search);
    res.json({
        success: true,
        data: topPerformers
    });
};
exports.getTopPerformersController = getTopPerformersController;
