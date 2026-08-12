const accountModel = require('../models/account.model')
const transactionModel = require('../models/transaction.model')
const ledgerModel = require('../models/ledger.model')
const crypto = require('crypto')
async function initializeFund(toAccountId, session) {
    const fromAccount = await accountModel.findById(process.env.SYSTEM_ACCOUNT_ID).session(session)
    const toUserAccount = await accountModel.findById(toAccountId).session(session)
    const idempotencyKey = crypto.randomUUID()
    const amount = 10000
    if (!fromAccount) {
        throw new Error("System account not found");
    }

    if (!toUserAccount) {
        throw new Error("Destination account not found");
    }
    const isInitialFundDone = await transactionModel.findOne({
        toAccount: toAccountId,
        type: "INITIAL_FUND",
        status: "COMPLETED"
    }).session(session)
    if (isInitialFundDone) {
        throw new Error("Initial funds already processed");
    }
    const transaction = new transactionModel({
        fromAccount: fromAccount._id,
        toAccount: toAccountId,
        status: "PENDING",
        amount,
        idempotencyKey,
        type: "INITIAL_FUND"
    })

    await transaction.save({ session })

    await ledgerModel.create([{
        account: fromAccount._id,
        amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session })

    await ledgerModel.create([{
        account: toAccountId,
        amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    return transaction

}

module.exports = { initializeFund }