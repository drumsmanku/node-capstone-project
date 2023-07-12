const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const jwt=require('jsonwebtoken')

const app = express();

dotenv.config();
app.use(bodyParser.urlencoded({ extended:true }));
app.use(express.static('./public'));
app.use(cors());

app.use((req, res, next)=>{
  const err=new Error("Not Found");
  err.status=404;
  next(err);
});

app.use((err, req, res, next)=>{
  res.status(err.status||500);
  res.send({status:err.status||500, message:err.message});
})

const User=mongoose.model('User', {
  name:String,
  email:String,
  mobile:Number,
  password:String,
})

app.get('/', (req, res)=>{
  res.send({message:'working perfectly'})
})

app.post("/register", async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.send({ message: "user already exists, please sign in" });
    } else {
      const encryptedPassword = await bcrypt.hash(password, 10);
      const newUsers = {
        name,
        email,
        mobile,
        password: encryptedPassword,
      };
      User.create(newUsers).then(() => {
        const jwtToken=jwt.sign(newUsers,process.env.JWT_SECRET_KEY, {expiresIn:60} )
        res.json({ status: "success"});
      });

    }
  } catch (err) {
    console.log(err);
  }
});

app.post('/login',async (req, res)=>{
  
  try{
    const {email, password} = req.body;
    const userInDB=await User.findOne({email});
    if(!userInDB){
      res.send({message:'user not found in database. PLease Sign up'});
      return
    }
    const existingUser=await bcrypt.compare(password, userInDB.password);
    if(existingUser){
      const jwtToken=jwt.sign(userInDB.toJSON(),process.env.JWT_SECRET_KEY, {expiresIn:60} )
      res.send({message:"user exists, Signed in successfully", token:jwtToken})
    }
    else{
      res.send({message:'invalid credentials'})
    }

  }
  catch(err){
    console.log(err)
    res.send({message:"FAILED"})
  }
  
})
app.listen(process.env.PORT, ()=>{
  mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log('listening on port ' + process.env.PORT)
  }).catch(err=>console.log(err))
})