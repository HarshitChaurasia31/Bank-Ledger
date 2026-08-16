const userModel = require('../models/user.model')
const jwt = require('jsonwebtoken')
const tokenBlacklistModel = require('../models/blacklist.model')

async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access"
        })
    }
    const isBlacklisted = await tokenBlacklistModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized acccess,token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.userId)

        req.user = user

        return next()

    } catch (err) {
        console.error(err)
        return res.status(401).json({
            message: "Unauthorized access"
        })
    }
}

async function authsystemuserMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access"
        })
    }
    const isBlacklisted = await tokenBlacklistModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized acccess,token is invalid"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.userId).select("+systemUser")
        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access"
            })
        }
        req.user = user

        return next()

    } catch (err) {
        console.error(err)
        return res.status(401).json({
            message: "Unauthorized access"
        })
    }

}

async function adminDashboardMiddleware(req, res, next) {
    const token = req.cookies.adminToken || req.headers.authorization?.split(" ")[1]
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access"
        })
    }
    const isBlacklisted = await tokenBlacklistModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel
            .findById(decoded.userId)
            .select("+systemUser");

        if (!user || user.systemUser !== true) {
            return res.status(403).json({
                message: "Forbidden access"
            });
        }
        req.user = user
        return next()
    } catch (err) {
        console.error(err)
        return res.status(401).json({
            message: "Unauthorized access"
        })
    }
}
module.exports = { authMiddleware, authsystemuserMiddleware, adminDashboardMiddleware }