const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');


const passengerSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
    },
    lastname: {
      type: String,
    },
    email: {
      type: String,
    },
    CardNumber: String,
    ExpiryDate: String,
    CVV: String,
    profileImg: { type: String, required: true, default: "360_F_353110097_nbpmfn9iHlxef4EDIhXB1tdTD0lcWhG9.jpg" },
    password: {
      type: String,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    phone: {
      type: String,
    },
    isActive: { type: Boolean, default: false },
    loginStatus: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    tokenEncrypted: String,
    longitude: Number,
    latitude: Number,
    createdAt: { type: Date, default: Date.now },
    verificationCodeExpiry: Date,
    verificationCodeEncrypted: String,
  }
);
// Encrypt sensitive data before saving to the database
passengerSchema.pre('save', function (next) {
  const secretKey = 'your-secret-key'; // Replace with your secret key
  const encryptedCardNumber = CryptoJS.AES.encrypt(this.CardNumber, secretKey).toString();
  const encryptedCVV = CryptoJS.AES.encrypt(this.CVV, secretKey).toString();
  const encryptedExpiryDate = CryptoJS.AES.encrypt(this.ExpiryDate, secretKey).toString();

  this.CardNumber = encryptedCardNumber;
  this.CVV = encryptedCVV;
  this.ExpiryDate = encryptedExpiryDate;

  next();
});

// Decrypt sensitive data after retrieving from the database
passengerSchema.post('init', function (doc) {
  const secretKey = 'your-secret-key'; // Replace with your secret key
  const decryptedCardNumber = CryptoJS.AES.decrypt(doc.CardNumber, secretKey).toString(CryptoJS.enc.Utf8);
  const decryptedCVV = CryptoJS.AES.decrypt(doc.CVV, secretKey).toString(CryptoJS.enc.Utf8);
  const decryptedExpiryDate = CryptoJS.AES.decrypt(doc.ExpiryDate, secretKey).toString(CryptoJS.enc.Utf8);

  doc.CardNumber = decryptedCardNumber;
  doc.CVV = decryptedCVV;
  doc.ExpiryDate = decryptedExpiryDate;
});


const setprofileImgURL = (doc) => {
  if (doc.profileImg) {
    const profileImgUrl = `${process.env.BASE_URL}/passengers/${doc.profileImg}`;
    doc.profileImg = profileImgUrl;
  }
};
// findOne, findAll and update
passengerSchema.post('init', (doc) => {
  setprofileImgURL(doc);
});

// create
passengerSchema.post('save', (doc) => {
  setprofileImgURL(doc);
});

const passenger = mongoose.model('passenger', passengerSchema);

module.exports = passenger;
