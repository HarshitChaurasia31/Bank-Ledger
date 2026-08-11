const express = require('express')
const authController = require('../controller/auth.controller')
const router = express.Router()
const {
    authLimiter
} = require("../middleware/rateLimit.middleware");


router.post('/register',authLimiter, authController.userRegisterController)


router.post('/login',authLimiter, authController.userLoginController)

router.post('/logout', authController.userLogoutController)
module.exports = router