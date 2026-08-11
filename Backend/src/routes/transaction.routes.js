const express=require('express')
const authMiddleware=require('../middleware/auth.middleware')
const transactionController=require('../controller/transaction.controller')
const router=express.Router()

/**
 * - POST /api/transactions
 * - Create a transaction
 */
router.post('/',authMiddleware.authMiddleware,transactionController.createTransaction)

/**
 * - POST /api/transactions/system/intial-funds
 * - Create intial funds transaction from system user
 */
router.post('/system/intial-funds',authMiddleware.authsystemuserMiddleware,transactionController.createIntialFundTransaction)

router.get('/history',authMiddleware.authMiddleware,transactionController.historyTransaction)

module.exports=router