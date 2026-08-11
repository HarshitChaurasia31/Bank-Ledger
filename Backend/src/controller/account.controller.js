const accountModel = require('../models/account.model')
const intializeFund = require('../services/transaction.service')
const mongoose=require('mongoose')
async function createAccountController(req, res) {
    const session=await mongoose.startSession()
    try {
        session.startTransaction()
        const user = req.user
        const [account] = await accountModel.create([{
            user: user._id
        }],{session})

        await intializeFund.initializeFund(account._id,session)
        await session.commitTransaction()
        return res.status(201).json({
            account
        })
    } catch (err) {
        await session.abortTransaction()
        return res.status(500).json({
            message: err.message
        })
    }finally{
        session.endSession()
    }

}


async function getUserAccountController(req, res) {

    const accounts = await accountModel.find({
        user: req.user._id
    })
    res.status(200).json({
        accounts
    })
}

async function getAccountBalance(req, res) {
    const { accountId } = req.params

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    })
    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        })
    }

    let balance = await account.getBalance()
    if (balance < 0) {
        balance = 0;
    }
    res.status(200).json({
        accountId: account._id,
        balance: balance
    })
}
module.exports = { createAccountController, getUserAccountController, getAccountBalance }