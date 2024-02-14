const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const driverUser = require('../models/driverModel');
const nodemailer = require('nodemailer');

/////////////
const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };
const generateExpiryVerificationCode = () => {
  const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const expiryTimestamp = Date.now() + 300000; // Current time + 5 minutes
  return { verificationCode, expiryTimestamp };
};
///////
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mutemotion2024@gmail.com',
      pass: 'oghw shhm oiwm votw',
    },
  });
  const ENCRYPTION_KEY = 'your-encryption-key'; // Must be kept secret
  
  const encryptData = (text) => {
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  };
  
  const decryptData = (text) => {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  };
  
  // Middleware to verify the JWT token
  // const verifyToken = async (req, res, next) => {
  //   const token = req.header('Authorization');
  
  //   if (!token) {
  //     return res.status(401).json({ error: 'Unauthorized: No token provided' });
  //   }
  
  //   try {
  //     const decoded = jwt.verify(token.replace('Bearer ', ''), 'the-secret-key-jwt-in');
  //     req.user = decoded;
  
  //     // Check if the token is blacklisted
  //     const isTokenBlacklisted = await BlacklistedToken.exists({ token });
  //     if (isTokenBlacklisted) {
  //       return res.status(401).json({ error: 'Unauthorized: Token is blacklisted' });
  //     }
  
  //     next();
  //   } catch (error) {
  //     return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  //   }
  // };
  /////////////////
exports.signup = asyncHandler(async (req, res, next) => {
    const { fullname, email, password } = req.body;
  
    const existingUser = await driverUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const encryptedVerificationCode = encryptData(verificationCode);
  
    const newUser = new driverUser({
      fullname,
      email,
      verificationCodeEncrypted: encryptedVerificationCode,
      password: hashedPassword,
      tokenEncrypted: null, // Set tokenEncrypted to null initially
    });
  
    await newUser.save();
  
    const mailOptions = {
      from: 'your-gmail-account@gmail.com',
      to: email,
      subject: 'Verify Your Account',
      html:  `
      <!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
      
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
      
          h2 {
            color: #333;
          }
      
          p {
            color: #666;
          }
      
          .verification-code {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
            margin-top: 10px;
          }
      
          .logo {
            text-align: left;
          }
      
          .logo img {
            max-width: 100px;
            height: auto;
          }
      
          .cta-button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #3498db;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
          }
      
          .cta-button:hover {
            background-color: #2980b9;
          }
        </style>
      </head>
      
      <body>
        <div class="container">
          <div class="logo">
           <img src="https://i.ibb.co/6sYnqTP/logo-4k.png">
          </div>
          <h2>Email Verification</h2>
          <p>Thank you for registering! To complete your registration, please verify your email address by entering the
            following code:</p>
          <div class="verification-code">Your Verification Code:<strong>${verificationCode}</strong></div>
          <p>If you didn't request this verification, you can safely ignore this email.</p>
          
        </div>
      </body>
      
      </html>
      `,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'Error sending verification email' });
      } else {
        console.log(`Email sent: ${info.response}`);
        res.status(201).json({ message: 'User registered successfully', user: newUser });
      }
    });
  });
  /////////////////////////////////
  exports.verify = asyncHandler(async (req, res, next) => {
    const { email, verificationCode } = req.body;
  
    const user = await driverUser.findOne({ email });
  
    if (!user) {
      return res.status(404).json({ error: 'User not found or invalid verification code' });
    }
  
    const decryptedVerificationCode = decryptData(user.verificationCodeEncrypted);
    if (decryptedVerificationCode !== verificationCode) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }
  
    user.isActive = true;
    user.isOnline = true;
    user.loginStatus=true;
    await user.save();
  
    // Generate the token after the email verification
    const token = jwt.sign({ userId: user._id }, "the-secret-key-jwt-in", { expiresIn: '1h' });
    const encryptedToken = encryptData(token);
    user.tokenEncrypted = encryptedToken;
    await user.save();
  
    
  
    res.json({ message: 'User verified successfully', user, token });
  });
  ////////////////////////
  exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
  
    const user = await driverUser.findOne({ email });
  
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  
    if (!user.isActive) {
      return res.status(401).json({ error: 'User is not activated' });
    }
  
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Wrong password' });
    }
    
    
  
    user.loginStatus = true;
    user.isOnline = true; // Set user's online status to true
  
    
  
    const token = jwt.sign({ userId: user._id }, "the-secret-key-jwt-in", { expiresIn: '1h' });
    const encryptedToken = encryptData(token);
  
    user.tokenEncrypted = encryptedToken;
    await user.save();
  
    res.json({ message: 'Login successful', user, token });
  });
  ///////////////////////////////
  exports.logout = asyncHandler(async (req, res, next) => {
    try {
      const { userId } = req.body;
      const providedToken = req.header('Authorization').replace('Bearer ', '');
  
      const user = await driverUser.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Encrypt the provided token for comparison
      const encryptedProvidedToken = encryptData(providedToken);
  
      // Compare the encrypted provided token with the encrypted token stored in the user's record
      if (encryptedProvidedToken !== user.tokenEncrypted) {
        return res.status(401).json({ error: 'Unauthorized: Token does not belong to the user' });
      }
  
      // Clear user's login status, online status, and token
      user.loginStatus = false;
      user.isOnline = false;
      user.tokenEncrypted = null;
  
      // Broadcast the online status to all connected clients
      
  
      await user.save();
  
      // Add the token to the blacklist in the database
      // await BlacklistedToken.create({ token: encryptedProvidedToken });
  
      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  ///////////////
  // exports.resetPassword = asyncHandler(async (req, res, next) => {
  //   try {
  //     const { email } = req.body;
  
  //     // Check if the user exists
  //     const user = await driverUser.findOne({ email });
  //     if (!user) {
  //       return res.status(404).json({ error: 'User not found' });
  //     }
  
  //     // Generate a verification code
  //     const verificationCode = generateVerificationCode();
  //     const encryptedVerificationCode = encryptData(verificationCode);
  
  //     // Store the verification code in the user's document
  //     user.verificationCodeEncrypted = encryptedVerificationCode;
  //     await user.save();
  
  //     // Send email with the verification code
  //     const mailOptions = {
  //       from: 'your-gmail-account@gmail.com',
  //       to: email,
  //       subject: 'Password Reset Verification Code',
  //       html: `
  //         <!DOCTYPE html>
  //         <html lang="en">
  //         <head>
  //           <meta charset="UTF-8">
  //           <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //           <title>Password Reset Verification Code</title>
  //         </head>
  //         <body>
  //           <p>Your verification code is: <strong>${verificationCode}</strong></p>
  //         </body>
  //         </html>
  //       `,
  //     };
  
  //     transporter.sendMail(mailOptions, (error, info) => {
  //       if (error) {
  //         console.error(error);
  //         return res.status(500).json({ error: 'Error sending verification code' });
  //       } else {
  //         console.log(`Verification code sent to: ${email}`);
  //         return res.status(200).json({ message: 'Verification code sent successfully' });
  //       }
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ error: 'Internal Server Error' });
  //   }
  // });
  //////////////////////////////////////////
  // exports.confirmResetPassword = asyncHandler(async (req, res, next) => {
  //   try {
  //     const { email, verificationCode, newPassword } = req.body;
  
  //     // Find the user by email
  //     const user = await driverUser.findOne({ email });
  //     if (!user) {
  //       return res.status(404).json({ error: 'User not found' });
  //     }
  
  //     // Decrypt and verify the verification code
  //     const decryptedVerificationCode = decryptData(user.verificationCodeEncrypted);
  //     if (decryptedVerificationCode !== verificationCode) {
  //       return res.status(401).json({ error: 'Invalid verification code' });
  //     }
  
  //     // Hash the new password
  //     const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  //     // Update the user's password in the database
  //     user.password = hashedPassword;
  //     await user.save();
  
  //     // Clear the verification code
  //     // user.verificationCodeEncrypted = null;
  //     // await user.save();
  
  //     // Blacklist the existing JWT token associated with the user
  //     // await BlacklistedToken.create({ token: user.tokenEncrypted });
  
  //     // Clear the token from the user document
  //     user.tokenEncrypted = null;
  //     await user.save();
  
  //     // Update the loginStatus to false
  //     user.loginStatus = false;
  //     await user.save();
  
  //     // Return response message to inform the user to log in again
  //     return res.status(200).json({ message: 'Password reset successfully. Please log in again.' });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ error: 'Internal Server Error' });
  //   }
  // });
  //////////////////////////////

  exports.resetPassword = asyncHandler(async (req, res, next) => {
    try {
        const { email } = req.body;

        // Check if the user exists
        const user = await driverUser.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate verification code and expiry timestamp
        const { verificationCode, expiryTimestamp } = generateExpiryVerificationCode();

        // Store the verification code and expiry timestamp in the user's document
        user.verificationCodeEncrypted = encryptData(verificationCode);
        user.verificationCodeExpiry = expiryTimestamp;
        await user.save();

        // Send email with the verification code
        const mailOptions = {
            from: 'your-gmail-account@gmail.com',
            to: email,
            subject: 'Password Reset Verification Code',
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset Verification Code</title>
                </head>
                <body>
                    <p>Your verification code is: <strong>${verificationCode}</strong></p>
                </body>
                </html>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ error: 'Error sending verification code' });
            } else {
                console.log(`Verification code sent to: ${email}`);
                return res.status(200).json({ message: 'Verification code sent successfully' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

exports.confirmResetPassword = asyncHandler(async (req, res, next) => {
    try {
        const { email, verificationCode, newPassword } = req.body;

        // Find the user by email
        const user = await driverUser.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the verification code has expired
        if (user.verificationCodeExpiry < Date.now()) {
            return res.status(401).json({ error: 'Verification code has expired' });
        }

        // Decrypt and verify the verification code
        const decryptedVerificationCode = decryptData(user.verificationCodeEncrypted);
        if (decryptedVerificationCode !== verificationCode) {
            return res.status(401).json({ error: 'Invalid verification code' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the database
        user.password = hashedPassword;
        await user.save();

        // Clear the verification code and expiry timestamp
        user.verificationCodeEncrypted = null;
        user.verificationCodeExpiry = null;
        user.tokenEncrypted=null;
        user.loginStatus=false;
        await user.save();

        // Return response message to inform the user to log in again
        return res.status(200).json({ message: 'Password reset successfully. Please log in again.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
  exports.requestAnotherVerificationCode = asyncHandler(async (req, res, next) => {
    try {
      const { email } = req.body;
  
      // Find the user by email
      const user = await driverUser.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
   // Generate verification code and expiry timestamp
   const { verificationCode, expiryTimestamp } = generateExpiryVerificationCode();

   // Store the verification code and expiry timestamp in the user's document
   user.verificationCodeEncrypted = encryptData(verificationCode);
   user.verificationCodeExpiry = expiryTimestamp;
   
      // // Generate a new verification code
      // const verificationCode = generateVerificationCode();
      const encryptedVerificationCode = encryptData(verificationCode);
  
      // Update the user's verification code in the database
      user.verificationCodeEncrypted = encryptedVerificationCode;
      await user.save();
  
      // Send email with the new verification code
      const mailOptions = {
        from: 'your-gmail-account@gmail.com',
        to: email,
        subject: 'New Verification Code Request',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Verification Code Request</title>
          </head>
          <body>
            <p>Your new verification code is: <strong>${verificationCode}</strong></p>
          </body>
          </html>
        `,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ error: 'Error sending verification code' });
        } else {
          console.log(`New verification code sent to: ${email}`);
          return res.status(200).json({ message: 'New verification code sent successfully' });
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  ////////////////////
  exports.updateStatus = asyncHandler(async (req, res,next) => {
    try {
      const { userId, isOnline } = req.body;
  
      // Find the user by userId
      const user = await driverUser.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Update the user's online status
      user.isOnline = isOnline;
      await user.save();
  
      return res.status(200).json({ message: 'User status updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  