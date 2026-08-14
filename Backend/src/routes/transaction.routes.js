const express=require('express')
const authMiddleware=require('../middleware/auth.middleware')
const transactionController=require('../controller/transaction.controller')
const router=express.Router()
const {transactionLimiter}=require('../middleware/ratelimit.middleware')

/**
 * - POST /api/transactions
 * - Create a transaction
 */
router.post('/',authMiddleware.authMiddleware,transactionLimiter,transactionController.createTransaction)

/**
 * - POST /api/transactions/system/intial-funds
 * - Create intial funds transaction from system user
 */
router.post('/system/intial-funds',authMiddleware.authsystemuserMiddleware,transactionController.createIntialFundTransaction)

/**
 * - GET /api/transactions/history
 * - Gives the history of transaction by user
 */
router.get('/history',authMiddleware.authMiddleware,transactionController.historyTransaction)

/**
 * - POST /api/transactions/retry
 * - Retry the pending payment in transaction history
 */
router.post('/retry',authMiddleware.authMiddleware,transactionController.retryPending)

module.exports=router