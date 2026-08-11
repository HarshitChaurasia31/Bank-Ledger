const transactionModel = require('../models/transaction.model')
const ledgerModel = require('../models/ledger.model')
const accountModel = require('../models/account.model')
const emailService = require('../services/email.service')
const mongoose = require('mongoose')
const crypto=require('crypto')

async function createTransaction(req, res) {

    const { fromAccount, toAccount, amount, idempotencyKey } = req.body
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount , toAccount, amount and idempotencyKey is required"
        })
    }
    const fromUserAccount = await accountModel.findOne({ _id: fromAccount })
    const toUserAccount = await accountModel.findOne({ _id: toAccount })
    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid account credentials"
        })
    }

    const isTransactionExist = await transactionModel.findOne({ idempotencyKey: idempotencyKey })

    if (isTransactionExist) {
        if (isTransactionExist.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionExist
            })
        }
        if (isTransactionExist.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is being processed"
            })
        }
        if (isTransactionExist.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction failed,please retry"
            })
        }
        if (isTransactionExist.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction reversed,please retry"
            })
        }
    }

    if (fromUserAccount.status !== "Active" || toUserAccount.status !== "Active") {
        return res.status(500).json({
            message: "Transaction cannot be completed as either account is not active"
        })
    }

    const balance = await fromUserAccount.getBalance()
    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance.Current Balance is ${balance}.Requested amount is ${amount}`
        })
    }
    let [transaction] = await transactionModel.create([{
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }]);
    const session = await mongoose.startSession();
try {
    session.startTransaction();

    console.log("1. Creating transaction");
    

    console.log("2. Creating debit ledger");
    await ledgerModel.create([{
        account: fromAccount,
        amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session });
    console.log("3. Creating credit ledger");
    await ledgerModel.create([{
        account: toAccount,
        amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session });

    console.log("4. Updating transaction");
    transaction.status = "COMPLETED";
    await transaction.save({ session });

    console.log("5. Committing");
    await session.commitTransaction();
    if(transaction.status==="COMPLETED"){
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)
}
    return res.status(201).json({
        message: "Transaction completed successfullly",
        transaction: transaction
    })
} catch (err) {
    await session.abortTransaction();
     if (transaction) {
        transaction.status = "FAILED";
        await transaction.save();
        if(transaction.status==="FAILED"){
    await emailService.sendTransactionFailureEmail(req.user.email, req.user.name, amount, toAccount)
}
    }
    
    return res.status(500).json({
        message: "Transaction failed",
        error: err.message
    });
    
} finally {
    await session.endSession();
}


    
}

async function createIntialFundTransaction(req, res) {
    const { toAccount} = req.body
    const idempotencyKey=crypto.randomUUID()
    const amount=10000
    if (!toAccount) {
        return res.status(400).json({
            message: "toAccount are required"
        })
    }

    const toUserAccount = await accountModel.findById(toAccount)
    if (!toUserAccount) {
        return res.status(400).json({ message: "Invalid toAccount" })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })
    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }
    const isIntialFundDone=await transactionModel.findOne({
        toAccount:toAccount,
        type:"INITIAL_FUND",
        status:"COMPLETED"
    })
    if(isIntialFundDone){
        return res.status(409).json({
            message:"Intial Fund Already Processed"
        })
    }
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING",
            type:"INITIAL_FUND"
        })

        await transaction.save({ session }) // ✅ IMPORTANT

        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })

        await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        transaction.status = "COMPLETED"
        await transaction.save({ session }) // ✅ update status

        await session.commitTransaction() // ✅ await

        return res.status(201).json({
            message: "Initial Transaction funds completed",
            transaction
        })

    } catch (err) {
        await session.abortTransaction() // ❌ rollback
        return res.status(500).json({
            message: "Transaction failed",
            error: err.message
        })
    } finally {
        session.endSession() // 🧹 always
    }
}

async function historyTransaction(req,res){
    const account=await accountModel.findOne({
        user:req.user._id
    })
    const transactions=await transactionModel.find({
        $or:[
            {fromAccount:account._id},
            {toAccount:account._id}
        ]
    }).populate("fromAccount").populate('toAccount').sort({createdAt:-1})
}
module.exports = { createTransaction, createIntialFundTransaction,historyTransaction }
