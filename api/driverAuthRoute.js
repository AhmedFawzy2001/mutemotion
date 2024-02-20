const express = require('express');
// const {
//   signupValidator,
//   loginValidator,
// } = require('../utils/validators/driverauthValidator');

const {
  confirmResetPassword,login,logout,requestAnotherVerificationCode,resetPassword,signup,updateLocation,updateStatus,verify
} = require('../services/driverAuthService');
const multer = require('multer');
const router = express.Router();
const upload=multer({dest:"uploads/drivers"})
router.post('/signup',upload.single("image"),(req,res,next)=>{
  console.log(req.file);
  next();
} ,signup);
router.post('/login', login);
router.post('/verify', verify);
router.post('/logout', logout);
router.post('/resetpassword',resetPassword );
router.post('/changepassword',  confirmResetPassword);
router.post('/sendagain', requestAnotherVerificationCode );
router.post('/updatestatus',updateStatus);

module.exports = router;