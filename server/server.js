import express from "express"
import dotenv from "dotenv"
import session from'express-session' 
import MongoStore  from 'connect-mongo' 
import mongoose from "mongoose"
import cors from "cors"
import bcrypt from "bcrypt"
import user from "./models/user.js"
import send from "./models/send.js"

dotenv.config()
const app = express();
const port = process.env.PORT;

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors())

app.use(session({
    secret: process.env.secret, 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DBURL,
    }), 
    cookie: {
      maxAge: 60000*60*24, 
    },
  }));
  
const db = mongoose.connect(process.env.DBURL)
db.then(()=>{
    console.log("db connected")
})
db.catch((err)=>{
    console.log(err)
})

function isAuthenticated(req, res, next) {
    if (req.session.userId) {
      return next();
    } 
    res.status(401).json({status:false, message:"unauthorized user"});
  }


app.get("/",isAuthenticated, async (req,res)=>{
    res.status(200).json({status:true, message:"authrized user"})
})


app.post('/signup', async (req,res)=>{
try{
    const {email,username,password} =req.body; 
    const solde=0;
    const existUser = await user.findOne({email})
    const hashPass = await bcrypt.hash(password,10)

    if(existUser){
        return res.json({message: '5oye gayam machi 4e maho lak ',color:"red"});
    }
    const register = await new user({username,email ,password:hashPass,solde});
    register.save()
   res.json({message: "signup secessful",color:"green"})
   console.log("signup")
}
catch(err){ 
    console.log(err)
}
})
app.post('/login', async (req,res)=>{
    try{
        const {email,password} =req.body; 
        const existUser = await user.findOne({email})
        if(existUser &&   await bcrypt.compare(password, existUser.password) ){
            req.session.userId = existUser._id;
            
            return res.json({message:'login secsessful',color:"green"});
            
        }
        else{ 
            return res.json({message: 'invalid information',color:"red"});
        }
       
    }
    catch(err){
        console.log(err)
    }
    })

    app.get("/userData",async(req,res)=>{
        try{

            const findData = await  user.findById(req.session.userId);
            res.status(200).json(findData)
        }
        catch(err){
            console.log(err)
        }
    })

    app.post("/send",isAuthenticated,async (req,res)=>{
     const {email,money,notice,password } = req.body;

     try{
        if (!money || isNaN(money) || money <= 0) {
            return res.json({ message: "invalid mony" });
        }
        const sender = await  user.findById(req.session.userId);
        const reciver = await user.findOne({email})

        if(!reciver){
            console.log("invalid sender or invalid reciver")
            return res.json({ message: "invalid sender or invalid reciver"});
        }
       if(sender.solde< money){
        console.log("invalid solde")
        return res.json({message:"invalid solde"})
       }
       const comparePass = await bcrypt.compare(password,sender.password)
       if(!comparePass){
        console.log("incorrect password")
        return res.json({message:"incorrect password"})
       }
       const registerSend = await new send({sender:sender.email,notice:notice,reciver:email,money:money})
       registerSend.save()
        await user.findOneAndUpdate(
           { email: email },                   
           { $inc: { solde: money } },       
           { new: true }                     
         )
         await user.findOneAndUpdate(
           { email: sender.email },                   
           { $inc: { solde: -money } },       
           { new: true }                     
         );
          res.json({message:"sended secsessful"})
     }
     catch(err){
        console.log(err)
     }
    })

app.listen(port,()=>{
    console.log(`I am listening at port ${port}`)
}
) 