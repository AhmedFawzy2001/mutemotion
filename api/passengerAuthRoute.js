const express = require('express');
// const {
//   signupValidator,
//   loginValidator,
// } = require('../utils/validators/driverauthValidator');

const {
  confirmResetPassword,login,logout,requestAnotherVerificationCode,resetPassword,signup,updateLocation,updateStatus,verify
} = require('../services/passengerAuthService');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify', verify);
router.post('/logout', logout);
router.post('/resetpassword',resetPassword );
router.post('/changepassword',  confirmResetPassword);
router.post('/sendagain', requestAnotherVerificationCode );
router.post('/updatestatus',updateStatus);

module.exports = router;