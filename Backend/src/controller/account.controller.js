const accountModel = require('../models/account.model')
const userModel = require('../models/user.model')
const intializeFund = require('../services/transaction.service')
const mongoose = require('mongoose')
async function createAccountController(req, res) {
    const session = await mongoose.startSession()
    try {
        session.startTransaction()
        const user = req.user
        const [account] = await accountModel.create([{
            user: user._id
        }], { session })

        await intializeFund.initializeFund(account._id, session)
        await session.commitTransaction()
        return res.status(201).json({
            account
        })
    } catch (err) {
        await session.abortTransaction()
        return res.status(500).json({
            message: err.message
        })
    } finally {
        await session.endSession()
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
    return res.status(200).json({
        accountId: account._id,
        balance
    })
}

async function searchAccounts(req, res) {
    try {
        const { q = "", limit = 5 } = req.query;
        const search = q.trim()
        const systemAccountId = new mongoose.Types.ObjectId(
            process.env.SYSTEM_ACCOUNT_ID
        );
        const safeLimit = Math.min(Math.max(parseInt(limit) || 5, 1), 5);
        if (
            search &&
            !/^[0-9a-fA-F]{1,24}$/.test(search)
        ) {
            return res.status(400).json({
                message: "Invalid account ID search"
            });
        }
        const pipeline = [{
            $match: {
                status: "Active",
                _id: {
                    $ne: systemAccountId
                }
            }
        },
        {
            $addFields: {
                accountIdString: {
                    $toString: "$_id"
                }
            }
        },{
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
            }
        },{
            $unwind: "$user"
        }
        ]
        if (search) {
            pipeline.push({
                $match: {
                    accountIdString: {
                        $regex: `^${search}`,
                        $options: "i"
                    }
                }
            })
        }

        pipeline.push({
            $project: {
                _id: 1,
                currency: 1,
                status: 1,
                "user.name": 1
            }
        }, {
            $limit: safeLimit
        })
        const accounts = await accountModel.aggregate(pipeline);
        return res.status(200).json({
            accounts
        })
    } catch (err) {
        console.error("SEARCH ACCOUNTS ERROR:", err);

        return res.status(500).json({
            message: "Failed to search accounts",
            error: err.message
        });
    }
}

async function getAllAccounts(req , res) {
    const user= await userModel.findById(req.user._id).select("+systemUser");
    if(user.systemUser!== true){
        return res.status(403).json({
            message:"Unauthorized Access"
        })
    }
    const accounts = await accountModel.find({
        _id : {
            $ne : process.env.SYSTEM_ACCOUNT_ID
        }
    }).populate("user" , "name email")
    return res.status(200).json({
        accounts
    })
}

async function changeAccountStatus(req, res) {
    const { accountId } = req.params;
    const { status } = req.body;

    const account = await accountModel.findOne({
        _id: accountId
    });

    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        });
    }

    if (status !== "Active" && status !== "Frozen") {
        return res.status(400).json({
            message: "Invalid status"
        });
    }

    if (account._id.toString() === process.env.SYSTEM_ACCOUNT_ID) {
        return res.status(403).json({
            message: "Changes not allowed"
        });
    }

    account.status = status;
    await account.save();

    return res.status(200).json({
        message: "Status changed",
        account
    });
}
module.exports = { createAccountController, getUserAccountController, getAccountBalance, searchAccounts , getAllAccounts , changeAccountStatus}