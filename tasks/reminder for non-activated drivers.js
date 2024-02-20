
const cron = require('node-cron');
const driverUser = require("../models/driverModel"); // Import the User model
const nodemailer = require('nodemailer');

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mutemotion2024@gmail.com',
    pass: 'oghw shhm oiwm votw',
  },
});

// Define the cron job function
const sendActivationRemindersForDrivers = () => {
  cron.schedule('*/3 * * * *', async () => {
    try {
      const nonActivatedUsers = await driverUser.find({ isActive: false, createdAt: { $lt: new Date(Date.now() - 3 * 60 * 1000) } });

      for (const user of nonActivatedUsers) {
        const mailOptions = {
          from: 'mutemotion2024@gmail.com',
          to: user.email,
          subject: 'Activate Your Account',
          html: `
            <!DOCTYPE html>
            <html lang="en">
            
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Account Activation Reminder</title>
              <!-- Add your email reminder styles here -->
            </head>
            
            <body>
              <div>
                <h2>Activate Your Account</h2>
                <p>Dear ${user.fullname},</p>
                <p>This is a reminder to activate your account. If you don't activate your account within the next 2 minutes, your profile will be deleted.</p>
                <p>Thank you!</p>
              </div>
            </body>
            
            </html>
          `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(error);
            // Handle error while sending reminder email
          } else {
            console.log(`Reminder email sent to: ${user.email}`);
          }
        });
      }
    } catch (error) {
      console.error(error);
    }
  });
};

// Export the function
module.exports =  sendActivationRemindersForDrivers;
