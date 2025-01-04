import mongoose from "mongoose"

const verifySchema = new mongoose.Schema({
    otp:String,
    email:String
})

const verify = new mongoose.model("verify",verifySchema)


export default verify