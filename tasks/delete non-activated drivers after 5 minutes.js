const cron = require('node-cron');
const driverUser = require('../models/driverModel');


const deleteNonActivatedDrivers = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const nonActivatedUsers = await driverUser.find({ 
        isActive: false, 
        createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } 
      });

      for (const user of nonActivatedUsers) {
        await driverUser.deleteOne({ _id: user._id });
        console.log(`Deleted non-activated user with email: ${user.email}`);
      }
    } catch (error) {
      console.error(error);
    }
  });
};

module.exports =  deleteNonActivatedDrivers;