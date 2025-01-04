import mongoose from "mongoose";
import { format } from "date-fns";

const sendSchema = new mongoose.Schema({
    sender: String,
    reciver: String,
    money: Number,
    notice: String,
    transactionTime: {
        type: String,
        default: () => format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    },
});

const Send = mongoose.model("send", sendSchema);

export default Send;
