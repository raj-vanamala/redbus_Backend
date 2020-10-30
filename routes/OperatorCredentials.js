var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const MongoDb = require('mongodb');
var jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();

router.post('/operatorCredentials/signUp',async function(req,res){

    try {

      let salt = await bcrypt.genSalt(10);
      let hash = await bcrypt.hash(req.body.password,salt)
      req.body.password = hash

      let url = process.env.URL;
      let client = await MongoDb.connect(url);
      let db = await client.db("Redbus");

      let operatorEmailExist = await db.collection("BusOperators").find({"Email" : req.body.email}).toArray();
      let operatorNameExist = await db.collection("BusOperators").find({"TravelsName" : req.body.travelsName}).toArray();

      console.log(operatorEmailExist.length);
      console.log(operatorNameExist.length);

      if(operatorEmailExist.length !== 0) {

        res.json({
          "message" : "Email Already Exist",
          "status" : "unSuccessful"
        })

      }

      else if(operatorNameExist.length !== 0){

        res.json({
          "message" : "Travels Name Already Exist",
          "status" : "unSuccessful"
        })

      }
    
      else {
        let data = await db.collection("BusOperators").insertOne({

          "Name" : req.body.name,
          "Email" : req.body.email,
          "Mobile" : req.body.mobile,
          "TravelsName": req.body.travelsName,
          "Password" : req.body.password
        })
  
        let jwtToken = await jwt.sign({email : req.body.email,Name : req.body.name},process.env.JWT,{expiresIn : "1h"}) 
        await client.close();
        
        let operatorDetails  = {
          
          "Name" : req.body.name,
          "Email" : req.body.email,
          "Mobile" : req.body.mobile,
          "TravelsName" : req.body.travelName
        }
  
  
        res.json({
          "token" : jwtToken,
          "message" : "Registration Successful",
          "status" : "success",
          "userDetails" : operatorDetails
        })
      }
    
    } catch (error) {
      console.log(error);
    }
})

router.post('/operatorCredentials/signIn/',async function(req,res){

    try {
  
      let url = process.env.URL;
      let client = await MongoDb.connect(url);
      let db = await client.db("Redbus");
  
        let operator = await db.collection("BusOperators").findOne({Email : req.body.email})
  
        let result = await bcrypt.compare(req.body.password,operator.Password)
        if(result === true) {
          
          let jwtToken = await jwt.sign({Email : req.body.email,Name : operator.Name},process.env.JWT,{expiresIn : "1h"})
  
          res.json({
            "token" : jwtToken,
            "message" : "Authentication Successful",
            "status" : "success",
            "operatorDetails" : operator
          })
  
        } else {
  
          res.json({
            message : "Please Check Your Credentials",
            "status" : "Not Successful"
          })
  
        }
      await client.close();
  
    } catch (error) {
      console.log(error);
    }
  })

  module.exports = router;