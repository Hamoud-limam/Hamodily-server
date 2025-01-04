import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import user from "./models/user.js";
import send from "./models/send.js";
import verifyNewUser from "./models/verifyNewUsers.js";
import nodemailer from "nodemailer";

dotenv.config();
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(
  session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DBURL }),
    cookie: { maxAge: 60000 * 7 },
  })
);


const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.email,
    pass: process.env.appPassword,
  },
});


mongoose.connect(process.env.DBURL)
  .then(() => console.log("Connected to database"))
  .catch((err) => console.error(err));


function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.status(401).json({ status: false, message: "Unauthorized User" });
}


function generateAuthCode() {
  return Math.floor(100000 + Math.random() * 900000);
}


app.get("/", isAuthenticated, (req, res) => {
  res.json({ status: true, message: "Authorized user" });
});


app.post("/sendOtp/newUser", async (req, res) => {
  try {
    const { email } = req.body;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      return res.json({ message: "Invalid email format.", sended: false });
    }

    const findUser = await user.findOne({ email });
    if (findUser) {
      return res.json({ message: "Account already exists. Please log in.", sended: false });
    }

    const findOtp = await verifyNewUser.findOne({ email });
    if (findOtp) {
      return res.json({ message: "OTP already sent. Check your email.", sended: true });
    }

    const otpCode = generateAuthCode();
    const mailOptions = {
      from: `"Hamodily" <${process.env.USER}>`,
      to: email,
      subject: "Verification Code",
      html: `<b>Your verification code is: ${otpCode}.</b>`
    };

    await transporter.sendMail(mailOptions);
    const sendOtp = new verifyNewUser({ otp: otpCode, email });
    await sendOtp.save();

    res.json({ message: "OTP sent successfully", sended: true });
  } catch (err) {
    console.error(err);
    res.json({ message: "Internal server error", sended: false });
  }
});


app.post("/checkOtp/newUser", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const findOtp = await verifyNewUser.findOne({ email, otp });

    if (findOtp) {
      return res.json({ message: "User verified successfully", verified: true });
    }

    res.json({ message: "Invalid OTP", verified: false });
  } catch (error) {
    console.error(error);
    res.json({ message: "Internal server error", verified: false });
  }
});


app.post("/signup", async (req, res) => {
  try {
    const { email, username, otp, password } = req.body;
    const existUser = await user.findOne({ email });
    const findOtp = await verifyNewUser.findOne({ email, otp });
    const hashPass = await bcrypt.hash(password, 10);

    if (existUser) {
      return res.json({ message: "User already exists", accept: false });
    }

    if (findOtp) {
      const register = new user({ username, email, password: hashPass });
      await register.save();
      return res.json({ message: "Signup successful", accept: true });
    }

    res.json({ message: "User not verified", accept: false });
  } catch (err) {
    console.error(err);
    res.json({ message: "Internal server error" });
  }
});


app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existUser = await user.findOne({ email });

    if (existUser && await bcrypt.compare(password, existUser.password)) {
      req.session.userId = existUser._id;
      req.session.email = existUser.email;
      return res.json({ message: "Login successful", authorized: true });
    }

    res.json({ message: "Invalid information", authorized: false });
  } catch (err) {
    console.error(err);
    res.json({ message: "Internal server error" });
  }
});

app.get("/userData", isAuthenticated, async (req, res) => {
  try {
    const findData = await user.findById(req.session.userId);

    if (findData) {
      return res.json(findData);
    }

    res.json({ message: "User not found" });
  } catch (err) {
    console.error(err);
    res.json({ message: "Internal server error" });
  }
});


app.post("/sendCheck", isAuthenticated, async (req, res) => {
  const { reciver, money } = req.body;
  const sender = req.session.email;

  try {
    const findSender = await user.findOne({ email: sender });
    const findReciver = await user.findOne({ email: reciver });

    if (!findSender || !findReciver || findReciver.email === findSender.email || money <= 0 || isNaN(money) || money > findSender.money) {
      return res.json({ message: "Invalid operation", checked: false });
    }

    res.json({ message: "Validation successful", checked: true });
  } catch (err) {
    console.error(err);
    res.json({ message: "Internal server error" });
  }
});


app.post("/send", isAuthenticated, async (req, res) => {
  const { reciver, money, notice, password } = req.body;
  const sender = req.session.email;

  try {
    const findSender = await user.findOne({ email: sender });
    const findReciver = await user.findOne({ email: reciver });

    if (!findSender || !findReciver || findReciver.email === findSender.email || money <= 0 || isNaN(money) || money > findSender.money) {
      return res.json({ message: "Invalid operation", sended: false });
    }

    if (await bcrypt.compare(password, findSender.password)) {
      await user.findOneAndUpdate({ email: reciver }, { $inc: { money: money } });
      await user.findOneAndUpdate({ email: sender }, { $inc: { money: -money } });

      const registerSend = new send({ sender, reciver, money, notice });
      await registerSend.save();

      return res.json({ message: "Send successful", sended: true, operation: registerSend });
    }

    res.json({ message: "Invalid password", sended: false });
  } catch (err) {
    console.error(err);
    res.json({ message: "Internal server error" });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
