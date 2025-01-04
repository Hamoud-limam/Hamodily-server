import mongoose from "mongoose";
import { format } from "date-fns";

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  money: { type: Number, default: 0 },
  createdAt: {
    type: String,
    default: () => format(new Date(), "yyyy-MM-dd HH:mm:ss"),
  },
});

const user = new mongoose.model("users", userSchema);

export default user;
