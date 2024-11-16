import mongoose from "mongoose"

const retraitSchema = new mongoose.Schema({
    code:String,
    user:String,
    ammount:Number
})
const retrait = new mongoose.model(retraitSchema,"retrait")

export default retrait 