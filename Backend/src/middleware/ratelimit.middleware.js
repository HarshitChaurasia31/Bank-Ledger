const { rateLimit } = require("express-rate-limit");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        message: "Too many authentication attempts. Please try again later."
    }
});

const transactionLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        message: "Too many transaction requests. Please try again later."
    }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        message: "Too many requests. Please try again later."
    }
});

module.exports = {
    authLimiter,
    transactionLimiter,
    apiLimiter
};  