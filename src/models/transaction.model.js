const mongoose=require('mongoose')

const transactionSchema=new mongoose.Schema({

    fromAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Transaction must be associated from a account"],
        index:true
    },
    toAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Transaction must be send to a account"],
        index:true
    },
    status:{
        type:"String",
        enum:{
            values:["PENDING","FAILED","COMPLETED","REVERSED"],
            message:"Status can either be pending,failed,completed or reversed"
        },
        default:"PENDING"
    },
    amount:{
        type:Number,
        required:[true,"Amount is needed to perform transaction"],
        min:[0,"Transaction amount cannot be negative"]
    },
    type:{
        type:String,
        enum:{
            values:["INITIAL_FUND","TRANSFER"],
            message:"The type should only have INTIAL_FUND from user or TRANSFER"
        },
        default:"TRANSFER"
    },
    idempotencyKey:{
        type:String,
        required:[true,"Idempotency Key is required for creating a transaction"],
        index:true,
        unique:true,
    }
},{
    timestamps:true
})

const transactionModel=mongoose.model('transaction',transactionSchema)

module.exports=transactionModel