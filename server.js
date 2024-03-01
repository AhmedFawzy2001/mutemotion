const express = require('express');
const deleteNonActivatedDrivers = require('./tasks/delete non-activated drivers after 5 minutes');
const deleteNonActivatedPassengers = require('./tasks/delete non-activated passengers after 5 minutes');
const sendActivationRemindersForDrivers = require('./tasks/reminder for non-activated drivers');
const sendActivationRemindersForPassengers = require('./tasks/reminder for non-activated passengers');
const nodemailer = require('nodemailer');
// const cors = require('cors');
const cors = require('cors'); // Import cors module
const crypto = require('crypto');
const http = require('http');
const socketIo = require('socket.io');

const path = require("path")
// const multer = require('multer');
const morgan = require("morgan");
require("dotenv").config();
const bodyParser = require('body-parser');

const dbConnection= require("./config/database")

const driverauthRoute = require('./api/driverAuthRoute');
const passengerauthRoute = require('./api/passengerAuthRoute');

const driverUser = require('./models/driverModel');
const passengerUser = require('./models/passengerModel');
const mongoose = require('mongoose');

dbConnection();
deleteNonActivatedDrivers();
sendActivationRemindersForDrivers();
sendActivationRemindersForPassengers();
deleteNonActivatedPassengers();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// app.use(cors());
app.use(cors());
app.options('*', cors());
// Set up multer middleware to parse multipart/form-data
// const upload = multer();
// Parse application/json
///////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////////////////////////////
app.use(bodyParser.json());

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));



const ENCRYPTION_KEY = 'your-encryption-key'; // Must be kept secret

// Function to encrypt a token using AES encryption
const encryptToken = (token) => {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// Middleware function for authentication and encryption
const passengerAuthenticateAndEncryptToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    //const providedToken = req.header('Authorization').replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    // Encrypt the token
    const encryptedToken = encryptToken(token);
    console.log(encryptedToken)
    // Retrieve user from database based on the encrypted token
    const user = await passengerUser.findOne({ tokenEncrypted: encryptedToken });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    // Attach the user object to the request for further processing
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Middleware function for authentication and encryption
const driverAuthenticateAndEncryptToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    // Encrypt the token
    const encryptedToken = encryptToken(token);

    // Retrieve user from database based on the encrypted token
    const user = await driverUser.findOne({ tokenEncrypted: encryptedToken });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    // Attach the user object to the request for further processing
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Endpoint to get driver information based on the token
app.get('/api/driverInfo', driverAuthenticateAndEncryptToken, async (req, res) => {
  try {
    // Extract user object from request
    const user = req.user;

    // Extract personal information from the user object
    const { fullname, email, password,age,carnum,color,model,cartype,phone,cardescription ,carImg,profileImg } = user;

    // Construct a response object with the user's personal information
    const userInfo = {
      fullname, email, password,age,carnum,color,model,cartype,phone,cardescription ,carImg,profileImg
      // Add more fields as needed
    };

    // Send the user's personal information in the response
    res.status(200).json(userInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get passenger information based on the token
app.get('/api/passengerInfo', passengerAuthenticateAndEncryptToken, async (req, res) => {
  try {
    // Extract user object from request
    const user = req.user;

    // Extract personal information from the user object
    const { firstname, lastname, email, phone, gender } = user;

    // Concatenate first name and last name
    const fullName =`${firstname}${lastname}`;

    // Construct a response object with the user's personal information
    const userInfo = {
      fullName,
      email,
      phone,
      gender
      // Add more fields as needed
    };

    // Send the user's personal information in the response
    res.status(200).json(userInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Socket.IO connection handler
io.on('connection', async (socket) => {
  console.log('Client connected');

  // Extract driverId from the socket parameters
  const driverId = socket.handshake.query.driverId;

  // Update isOnline status to true when a driver connects
  await driverUser.findOneAndUpdate({ driverId }, { isOnline: true });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('Client disconnected');
    // Update isOnline status to false when a driver disconnects
    await driverUser.findOneAndUpdate({ driverId }, { isOnline: false });
  });
});



  app.get("/",(req , res)=>{
    res.send("hello")
});
// app.use(jsonParser)


app.use('/api/v1/driver', driverauthRoute);
app.use('/api/v1/passenger', passengerauthRoute);

// Socket.IO connection handler
io.on('connection', async (socket) => {
  console.log('Client connected');

  // Extract driverId from the request headers
  const driverId = socket.handshake.headers.driverid;

  // Update isOnline status to true when a driver connects
  await driverUser.findOneAndUpdate({ driverId }, { isOnline: true });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('Client disconnected');
    // Update isOnline status to false when a driver disconnects
    await driverUser.findOneAndUpdate({ driverId }, { isOnline: false });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

process.on('unhandledRejection', (err)=>{
    console.error(`Unhandeled Rejection Errors : ${err.name}| ${err.message}`)
    
    server.close(()=>{
       console.error(`shutting down ................`);
        process.exit(1);
    })
    
})