const express=require('express')
const cookieParser=require('cookie-parser')
const cors = require("cors")

const app=express()


app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))
/**
 * - Routes required
 */
const authRouter=require('./routes/auth.routes')
const accountRouter=require('./routes/account.routes')
const transactionRouter=require('./routes/transaction.routes')

/**
 * - Use Routes
 */
app.use('/api/auth',authRouter)
app.use('/api/accounts',accountRouter)
app.use('/api/transactions',transactionRouter)



module.exports=app