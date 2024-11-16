import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    username:String,
    email:String,
    password:String,
    solde:Number
})

const user = new mongoose.model("users",userSchema);

export default user 