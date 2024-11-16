import mongoose from "mongoose"
import moment from "moment"

const sendShema = new mongoose.Schema({
    sender:String,
    reciver:String,
    money:Number,
    notice:String,
    transactionTime: {
        type: String,
        default: moment().format('YYYY-MM-DD HH:mm:ss')
      }
    
})

const send = new mongoose.model("send",sendShema)

export default send 