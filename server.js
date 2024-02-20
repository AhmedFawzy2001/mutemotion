const express = require('express');
const deleteNonActivatedDrivers = require('./tasks/delete non-activated drivers after 5 minutes');
const deleteNonActivatedPassengers = require('./tasks/delete non-activated passengers after 5 minutes');
const sendActivationRemindersForDrivers = require('./tasks/reminder for non-activated drivers');
const sendActivationRemindersForPassengers = require('./tasks/reminder for non-activated passengers');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require("path")
// const multer = require('multer');
const morgan = require("morgan");
require("dotenv").config();
const bodyParser = require('body-parser');

const dbConnection= require("./config/database")

const driverauthRoute = require('./api/driverAuthRoute');
const passengerauthRoute = require('./api/passengerAuthRoute');






dbConnection();
deleteNonActivatedDrivers();
sendActivationRemindersForDrivers();
sendActivationRemindersForPassengers();
deleteNonActivatedPassengers();


const app = express();
// Enable other domains to access your application
app.use(cors());
app.options('*', cors());
// Set up multer middleware to parse multipart/form-data
// const upload = multer();
// Parse application/json
app.use(bodyParser.json());

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/",(req , res)=>{
    res.send("hello")
});
// app.use(jsonParser)


app.use('/api/v1/driver', driverauthRoute);
app.use('/api/v1/passenger', passengerauthRoute);



const PORT = process.env.PORT;
const server =  app.listen(PORT || 3000,()=>{
    console.log('app running') ; 
});

process.on('unhandledRejection', (err)=>{
    console.error(`Unhandeled Rejection Errors : ${err.name}| ${err.message}`)
    
    server.close(()=>{
       console.error(`shutting down ................`);
        process.exit(1);
    })
    
})