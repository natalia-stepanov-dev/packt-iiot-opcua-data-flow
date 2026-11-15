"use strict";
const pino = require("pino");

// Not in config.js. Config errors need a logger too
const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    // Words and ISO time, not numbers. Raw docker logs stay readable
    formatters: { level: (label) => ({ level: label }) },
    timestamp: pino.stdTimeFunctions.isoTime,
});

module.exports = { logger };
