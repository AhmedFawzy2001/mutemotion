const cron = require('node-cron');
const passengerUser = require('../models/passengerModel');


const deleteNonActivatedPassengers = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const nonActivatedUsers = await passengerUser.find({ 
        isActive: false, 
        createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } 
      });

      for (const user of nonActivatedUsers) {
        await passengerUser.deleteOne({ _id: user._id });
        console.log(`Deleted non-activated user with email: ${user.email}`);
      }
    } catch (error) {
      console.error(error);
    }
  });
};

module.exports =  deleteNonActivatedPassengers;