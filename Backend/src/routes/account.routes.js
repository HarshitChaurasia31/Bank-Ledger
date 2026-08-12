const express=require('express')
const authMiddleware=require('../middleware/auth.middleware')
const accountController=require('../controller/account.controller')
const router=express.Router()


/**
 * - POST /api/accounts/
 * - Create a new account
 * - Protected Route
 */
router.post('/',authMiddleware.authMiddleware,accountController.createAccountController)

/**
 * - GET /api/accounts
 * - Get all accounts of the logged-in user
 * - Protected Route
 */
router.get('/',authMiddleware.authMiddleware,accountController.getUserAccountController)

/**
 * - GET api/accounts/search?q=<accountId>&limit=5
 */
router.get('/search',authMiddleware.authMiddleware,accountController.searchAccounts)

/**
 * - GET api/accounts/balance/:accountId
 */
router.get('/balance/:accountId',authMiddleware.authMiddleware,accountController.getAccountBalance)

module.exports=router