const express = require('express');
const deleteNonActivatedDrivers = require('./tasks/delete non-activated drivers after 5 minutes');
const deleteNonActivatedPassengers = require('./tasks/delete non-activated passengers after 5 minutes');
const sendActivationRemindersForDrivers = require('./tasks/reminder for non-activated drivers');
const sendActivationRemindersForPassengers = require('./tasks/reminder for non-activated passengers');
const nodemailer = require('nodemailer');
const WebSocket = require('ws');
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
const wss = new WebSocket.Server({ server });
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

// Function to calculate distance between two coordinates in kilometers
// function calculateDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371; // Radius of the earth in km
//   const dLat = deg2rad(lat2 - lat1);
//   const dLon = deg2rad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
//     Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   const d = R * c; // Distance in km
//   return d;
// }

// // Function to calculate cost based on distance and service type
// function calculateCost(distance, serviceType) {
//   let costPerKm;
//   switch (serviceType) {
//     case 'MuteCar':
//       costPerKm = 5; // 5 EGP per kilometer
//       break;
//     case 'Comfort':
//       costPerKm = 7; // 7 EGP per kilometer
//       break;
//     case 'Black':
//       costPerKm = 10; // 10 EGP per kilometer
//       break;
//     default:
//       return 'Invalid service type';
//   }
//   return costPerKm * distance;
// }

// // Function to calculate estimated time based on distance
// function calculateEstimatedTime(distance) {
//   // Assuming an average speed of 60 km/h
//   return (distance / 60) * 60; // Convert hours to minutes
// }

// function deg2rad(deg) {
//   return deg * (Math.PI / 180);
// }

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
    const fullName =`${firstname }${lastname}`;

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

app.delete('/passengerdelete-email', async (req, res) => {
  const { email } = req.body;

  try {
    const result = await passengerUser.deleteOne({ email });
    if (result.deletedCount > 0) {
      res.json({ message: 'Email deleted successfully' });
    } else {
      res.status(404).json({ message: 'Email not found' });
    }
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.delete('/diverdelete-email', async (req, res) => {
  const { email } = req.body;

  try {
    const result = await driverUser.deleteOne({ email });
    if (result.deletedCount > 0) {
      res.json({ message: 'Email deleted successfully' });
    } else {
      res.status(404).json({ message: 'Email not found' });
    }
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/users/toggle', driverAuthenticateAndEncryptToken, (req, res) => {
  try {
      const { isOnline } = req.body;
      const user = req.user; // Get authenticated user from middleware

      // Update the user's online status
      user.isOnline = isOnline;

      return res.status(200).json({ message: 'User status updated successfully' });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
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
// // API endpoint to find the nearest driver, destination, and calculate distance, cost, and time
// app.get('/findNearestDriver', async (req, res) => {
//   const { startLat, startLon, destLat, destLon, serviceType } = req.query;
//   if (!startLat || !startLon || !destLat || !destLon || !serviceType) {
//     return res.status(400).json({ error: 'Missing parameters' });
//   }

//   // Query for the nearest driver
//   try {
//     const nearestDriver = await driverUser.findOne({
//       location: {
//         $near: {
//           $geometry: {
//             type: 'Point',
//             coordinates: [parseFloat(startLon), parseFloat(startLat)]
//           }
//         }
//       }
//     }).select('fullname location');

//     if (!nearestDriver) {
//       return res.status(404).json({ message: 'No drivers found' });
//     }

//     // Calculate distance between your location and driver's location
//     const distanceToDriver = calculateDistance(startLat, startLon, nearestDriver.location.coordinates[1], nearestDriver.location.coordinates[0]);
    
//     // Calculate distance between start and destination
//     const distanceToDestination = calculateDistance(startLat, startLon, destLat, destLon);

//     // Calculate cost based on service type and distance
//     const cost = calculateCost(distanceToDestination, serviceType);

//     // Calculate estimated time
//     const time = calculateEstimatedTime(distanceToDestination);

//     res.json({ 
//       driver: nearestDriver, 
//       distanceToDriver: distanceToDriver.toFixed(2), 
//       distanceToDestination: distanceToDestination.toFixed(2), 
//       cost: cost.toFixed(2), 
//       time: time.toFixed(0) 
//     });
//   } catch (error) {
//     console.error('Error finding nearest driver:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });


// Define the API endpoint to find the nearest driver, destination, and calculate distance, cost, and time
app.get('/findNearestDriver', passengerAuthenticateAndEncryptToken, async (req, res) => {
  // Retrieve query parameters from the request
  const { startLat, startLon, destLat, destLon, serviceType } = req.query;

  // Check if all required parameters are present
  if (!startLat || !startLon || !destLat || !destLon || !serviceType) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    // Query for the nearest driver within 15km of the user's current location
    const nearestDriver = await driverUser.findOne({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(startLon), parseFloat(startLat)]
          },
          $maxDistance: 15000 // 15km in meters
        }
      }
    }).select('location fullname email phone age cartype color model carnum cardescription isOnline');

    // If no driver is found within the specified distance, return a 404 error
    if (!nearestDriver) {
      return res.status(404).json({ message: 'No drivers found within 15km' });
    }

    // Calculate distance between user's location and driver's location
    const distanceToDriver = calculateDistance(startLat, startLon, nearestDriver.location.coordinates[1], nearestDriver.location.coordinates[0]);
    
    // Calculate estimated time for the driver to arrive at the user's location
    const estimatedTimeToArrive = calculateEstimatedTime(distanceToDriver);

    // Calculate distance between start and destination
    const distanceToDestination = calculateDistance(startLat, startLon, destLat, destLon);

    // Calculate estimated time to reach the destination
    const estimatedTimeToDestination = calculateEstimatedTime(distanceToDestination);

    // Calculate total estimated time (time to arrive + time to reach destination)
    const totalEstimatedTime = estimatedTimeToArrive + estimatedTimeToDestination;

    // Calculate cost based on service type and distance
    const cost = calculateCost(distanceToDestination, serviceType);

    // Send JSON response containing details about the nearest driver, distances, cost, and estimated time
    res.json({ 
      driver: nearestDriver, 
      distanceToDriver: distanceToDriver.toFixed(2), 
      distanceToDestination: distanceToDestination.toFixed(2), 
      cost: cost.toFixed(2), 
      estimatedTimeToArrive: estimatedTimeToArrive.toFixed(0),
      estimatedTimeToDestination: estimatedTimeToDestination.toFixed(0),
      totalEstimatedTime: totalEstimatedTime.toFixed(0)
    });
  } catch (error) {
    // Handle errors and send appropriate response
    console.error('Error finding nearest driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to calculate distance between two coordinates in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

// Function to calculate cost based on distance and service type
function calculateCost(distance, serviceType) {
  let costPerKm;
  switch (serviceType) {
    case 'economic':
      costPerKm = 5; // 5 EGP per kilometer
      break;
    case 'comfort':
      costPerKm = 7; // 7 EGP per kilometer
      break;
    case 'luxury':
      costPerKm = 10; // 10 EGP per kilometer
      break;
    default:
      return 'Invalid service type';
  }
  return costPerKm * distance;
}

// Function to calculate estimated time based on distance
function calculateEstimatedTime(distance) {
  // Assuming an average speed of 60 km/h
  return (distance / 60) * 60; // Convert hours to minutes
}

// Function to convert degrees to radians
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

  app.get("/",(req , res)=>{
    res.send("hello")
});
// app.use(jsonParser)


app.use('/api/v1/driver', driverauthRoute);
app.use('/api/v1/passenger', passengerauthRoute);

// Define the findNearbyDrivers function

// Socket.IO connection handler
// io.on('connection', async (socket) => {
//   console.log('Client connected');

//   // Extract driverId from the request headers
//   const driverId = socket.handshake.headers.driverid;

//   // Update isOnline status to true when a driver connects
//   await driverUser.findOneAndUpdate({ driverId }, { isOnline: true });

//   // Handle disconnection
//   socket.on('disconnect', async () => {
//     console.log('Client disconnected');
//     // Update isOnline status to false when a driver disconnects
//     await driverUser.findOneAndUpdate({ driverId }, { isOnline: false });
//   });
  



// });

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected');

  // Handle 'connectDriver' event
  socket.on('connectDriver', async ({ driverId }) => {
    console.log(`Driver with ID ${driverId} connected`);
    try {
      // Find the driver by ID
      const driver = await driverUser.findById(driverId);
      if (!driver) {
        console.error('Driver not found');
        return;
      }
      // Update isOnline status to true
      driver.isOnline = true;
      // Save the updated driver
      await driver.save();
      console.log('Driver is now online:', driver.isOnline);
    } catch (err) {
      console.error('Error updating driver status:', err);
    }
  });

  // Handle 'disconnectDriver' event
  socket.on('disconnectDriver', async ({ driverId }) => {
    console.log(`Driver with ID ${driverId} disconnected`);
    try {
      // Find the driver by ID
      const driver = await driverUser.findById(driverId);
      if (!driver) {
        console.error('Driver not found');
        return;
      }
      // Update isOnline status to false
      driver.isOnline = false;
      // Save the updated driver
      await driver.save();
      console.log('Driver is now offline:', driver.isOnline);
    } catch (err) {
      console.error('Error updating driver status:', err);
    }
  });


//   socket.on('updateLocation', async ({ driverId, location }) => {
//     try {
//       // Find the driver by ID
//       const driver = await driverUser.findById(driverId);
//       if (!driver) {
//         console.error('Driver not found');
//         return;
//       }
      
//       // Check if the driver is online
//       if (!driver.isOnline) {
//         console.log('Driver is not online');
//         return;
//       }

//       // Update the driver's location
//       driver.location = location;
//       // Save the updated driver
//       await driver.save();
//       console.log('Driver location updated:', driver.location);
//     } catch (err) {
//       console.error('Error updating driver location:', err);
//     }
// });

  // Handle disconnection
  
  // Handle 'updateLocation' event for drivers
socket.on('updateLocation', async ({ driverId, location }) => {
  try {
      // Find the driver by ID
      const driver = await driverUser.findById(driverId);
      if (!driver) {
          console.error('Driver not found');
          return;
      }

      // Check if the driver is online
      if (!driver.isOnline) {
          console.log('Driver is not online');
          return;
      }

      // Update the driver's location
      driver.location = location;
      // Save the updated driver
      await driver.save();
      console.log('Driver location updated:', driver.location);

      // Broadcast driver's location to connected passengers
      
    socket.broadcast.emit('driverLocationUpdated', { driverId, location });
    
  } catch (err) {
      console.error('Error updating driver location:', err);
  }
});

  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
wss.on('connection', function connection(ws) {
  console.log('WebSocket client connected');

  ws.on('message', function incoming(message) {
    console.log('Received video frame:', message);
    // Handle video frames (e.g., save to disk, perform analysis)
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