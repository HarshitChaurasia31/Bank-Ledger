const userModel = require('../models/user.model')
const jwt = require('jsonwebtoken')
const emailService = require('../services/email.service')
const tokenBlacklistModel = require('../models/blacklist.model')
/**
 * - user register controller
 * - POST /api/auth/register
 */
async function userRegisterController(req, res) {
    try {
        const { email, name, password } = req.body

        const isExits = await userModel.findOne({ email })

        if (isExits) {
            return res.status(422).json({
                message: "User Already exist with same email",
                status: "Failed"
            })
        }

        const user = await userModel.create({
            email,
            password,
            name
        })

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        )

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 3 * 24 * 60 * 60 * 1000
        })

        res.status(201).json({
            message: "User Registration Done",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            },
            token
        })
        await emailService.sendRegistrationEmail(user.email, user.name)
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

/**
 * - user login controller
 * - POST /api/auth/login
 */

async function userLoginController(req, res) {

    const { email, password } = req.body

    const user = await userModel.findOne({
        email
    }).select("+password")

    if (!user) {
        return res.status(401).json({
            message: "Email/Password is invalid",
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
        return res.status(401).json({
            message: "Password is invalid",
        })
    }
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "3d" }
    )

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 3 * 24 * 60 * 60 * 1000
    })  

    res.status(200).json({
        message: "User Loggedin",
        user: {
            _id: user._id,
            name: user.name,
            email: user.email
        },
        token
    })


}

async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(200).json({
            message: "User Logged Out Successfully"
        })
    }

    await tokenBlacklistModel.create({
        token: token
    })
    res.clearCookie("token")
    return res.status(200).json({
        message: "User Logged Out Successfully"
    })
}

module.exports = { userRegisterController, userLoginController, userLogoutController }