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

const driverUser = require('./models/driverModel');
const passengerUser = require('./models/passengerModel');
const mongoose = require('mongoose');

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
///////////////////////////////////////////////////////////////////////////////////////
const transportSchema = new mongoose.Schema({
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'passenger' }, // Reference to the Passenger model
    location: String,
    destination: String,
    dateAndtime: String,
    expectedCost: String,
    paymentMethod: { type: String},
    isTaken: { type: Boolean, default: false },
    driver:{ type: mongoose.Schema.Types.ObjectId, ref: 'driver' ,default:null},
  });
  
  const cityToCityRideSchema = new mongoose.Schema({
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'passenger' }, // Reference to the Passenger model
    location: String,
    destination: String,
    dateAndtime: String,
    noOfPassenger: String,
    noOfBags: String,
    expectedCost: String,
    paymentMethod:   String,
    isTaken: { type: Boolean, default: false },
    driver:{ type: mongoose.Schema.Types.ObjectId, ref: 'driver',default:null },
  });

  
  const messageSchema = new mongoose.Schema({
      passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'passenger' },
      driver: { type: mongoose.Schema.Types.ObjectId, ref: 'driver' },
      text: String,
      date: { type: Date, default: Date.now },
      ride: { type: mongoose.Schema.Types.ObjectId, refPath: 'rideModel' }, // New field to reference ride
      rideModel: String, // Field to specify the model the ride belongs to (Transport or CityToCityRide)
    });
  
  // Define Models
  const Transport = mongoose.model('Transport', transportSchema);
  const CityToCityRide = mongoose.model('CityToCityRide', cityToCityRideSchema);
  const Message = mongoose.model('Message', messageSchema);
  //////////////////////////////////////////////////////////////////////////////////////////////////////
app.use(bodyParser.json());

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
///////////////////////////////////////////////////////////////////////////////////////////////////////
// app.post('/api/passengers/:passengerId/transports', async (req, res) => {
//     try {
//       const passengerId = req.params.passengerId;
//       const transportData = { ...req.body, passenger: passengerId };
//       const transport = new Transport(transportData);
//       await transport.save();
//       res.status(201).json({ message: 'Transport added successfully' });
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to add transport' });
//     }
//   });
//   app.post('/api/passengers/:passengerId/city-to-city-rides', async (req, res) => {
//     try {
//       const passengerId = req.params.passengerId;
//       const cityToCityRideData = { ...req.body, passenger: passengerId };
//       const cityToCityRide = new CityToCityRide(cityToCityRideData);
//       await cityToCityRide.save();
//       res.status(201).json({ message: 'City to city ride added successfully' });
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to add city to city ride' });
//     }
//   });
// app.post('/api/passengers/:passengerId/transports', async (req, res) => {
//     try {
//         const passengerId = req.params.passengerId;
        
//         // Check if the passenger exists
//         const passenger = await passengerUser.findById(passengerId);
//         if (!passenger) {
//             return res.status(404).json({ error: 'Passenger not found' });
//         }

//         const transportData = { ...req.body, passenger: passengerId };
//         const transport = new Transport(transportData);
//         await transport.save();
//         res.status(201).json({ message: 'Transport added successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to add transport' });
//     }
// });

app.post('/api/transports', async (req, res) => {
    try {
        const {passengerId,driver,location,destination,dateAndtime,expectedCost,paymentMethod} = req.body;
        
        // Check if the passenger exists
        const passenger = await passengerUser.findById(passengerId);
        if (!passenger) {
            return res.status(404).json({ error: 'Passenger not found' });
        }

        const transport = new Transport({ passenger:passengerId, driver,location,destination,dateAndtime,expectedCost,paymentMethod });
        await transport.save();
        res.status(201).json({ message: 'Transport added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add transport' });
    }
});

// app.post('/api/passengers/:passengerId/city-to-city-rides', async (req, res) => {
//     try {
//         const passengerId = req.params.passengerId;
        
//         // Check if the passenger exists
//         const passenger = await passengerUser.findById(passengerId);
//         if (!passenger) {
//             return res.status(404).json({ error: 'Passenger not found' });
//         }

//         const cityToCityRideData = { ...req.body, passenger: passengerId };
//         const cityToCityRide = new CityToCityRide(cityToCityRideData);
//         await cityToCityRide.save();
//         res.status(201).json({ message: 'City to city ride added successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to add city to city ride' });
//     }
// });
app.post('/api/city-to-city-rides', async (req, res) => {
    try {
        const { passengerId,driver,location,destination,dateAndtime,expectedCost,noOfPassenger,noOfBags,paymentMethod} = req.body;
        
        // Check if the passenger exists
        const passenger = await passengerUser.findById(passengerId);
        if (!passenger) {
            return res.status(404).json({ error: 'Passenger not found' });
        }

        const cityToCityRide = new CityToCityRide({ driver,location,destination,dateAndtime ,expectedCost,noOfPassenger,noOfBags,paymentMethod,passenger:passengerId});
        await cityToCityRide.save();
        res.status(201).json({ message: 'City to city ride added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add city to city ride' });
    }
});  

app.post('/api/take-it/:rideId', async (req, res) => {
    try {
      const rideId = req.params.rideId;
  
      // Extract ride model (Transport or CityToCityRide) from the request body
      const rideModel = req.body.rideModel;
  
      // Check if the ride exists in transport or cityToCityRide
      let ride;
      if (rideModel === 'Transport') {
        ride = await Transport.findById(rideId);
      } else if (rideModel === 'CityToCityRide') {
        ride = await CityToCityRide.findById(rideId);
      }
  
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }
  
      // Check if the ride is already taken
      if (ride.isTaken) {
        return res.status(409).json({ error: 'This ride is already taken' });
      }
  
      // Update the ride with the driver info
      const driverId = req.body.driverId; // Assuming driverId is provided in the request body
      const driver = await driverUser.findById(driverId);
  
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }
  
      // Check if the driver is available
      if (!driver.isAvailable) {
        return res.status(409).json({ error: 'Driver is not available' });
      }
  
      // Construct the message text
      const driverName = driver.fullname; // Access the driver's name
      const messageText = `${driverName} got your order. Hurry up, accept driver's request and get in contact.`;
  
      // Add a message to the Message schema with the rideId and rideModel
      const currentDate = new Date();
      const message = new Message({
        passenger: ride.passenger,
        driver: driverId,
        text: messageText,
        date: currentDate,
        ride: rideId,
        rideModel: rideModel,
      });
      await message.save();
  
     
      ride.driver = driverId;
      await ride.save();
  
    
  
      res.status(200).json({ message: 'Ride request sent successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  app.get('/api/all-rides', async (req, res) => {
    try {
      const cityToCityRides = await CityToCityRide.find().populate('passenger driver');
      const transports = await Transport.find().populate('passenger driver');
      res.json({
        cityToCityRides: cityToCityRides.map(ride => ({ ...ride.toObject(), type: 'city to city ride' })),
        transports: transports.map(transport => ({ ...transport.toObject(), type: 'transport' }))
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch rides and transports' });
    }
  });
  app.get('/api/passengers/:passengerId/messages', async (req, res) => {
    try {
      const passengerId = req.params.passengerId;
  
      // Find all messages where the passengerId matches and populate the driver and ride fields
      const messages = await Message.find({ passenger: passengerId })
        //.populate('driver', 'fullname email')
        .populate('driver')
        .populate({
          path: 'ride',
          select: '_id location destination dateTime expectedCost' // Include _id field along with other fields

        });
  
      res.status(200).json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  ///////////////////////////////////////////////////////////////////////////////////////////////////////
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