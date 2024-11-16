import mongoose from "mongoose"

const transferSchema = new mongoose.Schema({
    from:String,
    to:String,
    date:String,
    money:Number
})

const transferInfromation =  new mongoose.model(transferSchema,"transInfo")

export default  transferInfromation