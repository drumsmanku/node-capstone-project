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
app.use(bodyParser.json());
app.use(express.static('./public'));
app.use(cors());

const AuthenticateUser=(req, res, next)=>{
  try{
    const user=jwt.verify(req.headers.token, process.env.JWT_SECRET_KEY);
    req.user=user;
    next()
  }
  catch(err){
    res.send({message:'please login first'})
  }
}
const User=mongoose.model('User', {
  name:String,
  email:String,
  mobile:Number,
  password:String,
});

const CreateJob=mongoose.model('Job', {
  companyName: String,
  logoURL: String,
  jobPosition: String,
  monthlySalary:String,
  jobType: String,
  remoteOrOffice: String,
  location:String,
  jobDesc: String,
  aboutComp:String,
  skills:[String],
  additionalInfo:String,
})

app.get('/', (req, res)=>{
  res.send({message:'working perfectly'})
})

app.post("/register", async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
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
        res.json({ status: "success", jwtToken, name: newUsers.name });
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
      const jwtToken=jwt.sign(userInDB.toJSON(),process.env.JWT_SECRET_KEY, {expiresIn:'1hr'} )
      res.send({message:"user exists, Signed in successfully",jwtToken, name: userInDB.name })
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

app.post('/create-job', AuthenticateUser,(req,res)=>{
  const {companyName,logoURL, jobPosition, monthlySalary, jobType, remoteOrOffice, location, jobDesc, aboutComp, skills, additionalInfo}=req.body 
  const newJob={companyName,logoURL, jobPosition, monthlySalary, jobType, remoteOrOffice, location, jobDesc, aboutComp, skills, additionalInfo}
  CreateJob.create(newJob).then(()=>{
    res.json({status:'success', message:'Job created successfully'})
  }).catch(err=>{console.log(err)});
  
});

app.patch('/edit-job/:id', (req, res)=>{
  const {id}=req.params;
  const updateData=req.body
  CreateJob.findByIdAndUpdate(id, updateData).then(()=>{
    res.send({status:'success', message:'customer updated successfully'})
  }).catch(err => {
    console.log(err);
    res.status(500).send({status:'failure', message:'An error occurred while updating the job'});
  })
})


app.get('/get-jobs', async(req, res) => {
  try {
    const { skills, jobPosition } = req.query;
    let query = {};

    if (skills) {
      query.skills = { $in: skills.split(',') };
    }

    if (jobPosition) {
      query.jobPosition = { $in: jobPosition.split(',') };
    }

    const jobs = await CreateJob.find(query);

    res.send({ status: 'success', jobs });
  } catch (err) {
    console.log(err);
    res.send({ status: 'failed', message: 'Something went wrong' });
  }
});

app.get('/get-jobs-desc/:id', async(req, res) => {
  try {
    const { id } = req.params;

    const job = await CreateJob.findById(id);

    if (job) {
      res.send({ status: 'success', job });
    } else {
      res.send({ status: 'failed', message: 'No job found with the provided ID' });
    }
  } catch (err) {
    console.log(err);
    res.send({ status: 'failed', message: 'Something went wrong' });
  }
});



app.listen(process.env.PORT, ()=>{
  mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log('listening on port ' + process.env.PORT)
  }).catch(err=>console.log(err))
})