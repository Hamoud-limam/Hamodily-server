import mongoose from "mongoose";

const verifySchema = new mongoose.Schema({
    otp: String,
    email: String,
   
});

const verifyNewUser = mongoose.model("verifyNewUsers", verifySchema);

export default verifyNewUser;

