import mongoose from "mongoose"

const verifySchema = new mongoose.Schema({
    otp:Number,
    email:String
})

const verify = new mongoose.model(verifySchema,"verify")


export default verify