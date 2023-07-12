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

app.listen(process.env.PORT, ()=>{
  console.log('listening on port '+process.env.PORT)
})