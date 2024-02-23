const mongoose = require('mongoose');

const CryptoJS = require('crypto-js');

const driverSchema = new mongoose.Schema({
    fullname: {
        type: String,
      
      },
      age: {
        type: String,
      },
      CardNumber: String,
    ExpiryDate:String,
    profileImg: {type: String,required:true,default:"360_F_353110097_nbpmfn9iHlxef4EDIhXB1tdTD0lcWhG9.jpg"},
    carImg: {type: String,required:true,default:"hgjhjgjhgjhhhghgjghjjhgjhgjhgghdfsdvdsf.jpg"},
    CVV:String,
    email: String,
    verificationCodeEncrypted: String,
    password: String,
    cartype:{
        type: String,
      
     
    },
    color:{
        type: String,
      
      
    },
    model:{
        type: String,
      
      
    },
    carnum:{
        type: String,
      
        
    },

    cardescription:{
        type: String,
      
    },
    phone:{
      type: String,
      
        
    },
    isActive: { type: Boolean, default: false },
    loginStatus: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    tokenEncrypted: String,
    longitude: Number, // Add longitude field
    latitude: Number,  // Add latitude field
    nodeMCUIP:{type:String,default:null},
    createdAt: { type: Date, default: Date.now },
    verificationCodeExpiry:Date,
    isAvailable: { type: Boolean, default: true } // Added isAvailable field with default value true

});
// Encrypt sensitive data before saving to the database
driverSchema.pre('save', function (next) {
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
driverSchema.post('init', function (doc) {
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
      const profileImgUrl =` ${process.env.BASE_URL}/drivers/${doc.profileImg}`;
      doc.profileImg = profileImgUrl;
    }
  };
  const setcarImgURL = (doc) => {
    if (doc.carImg) {
      const carImgUrl = `${process.env.BASE_URL}/drivers/${doc.carImg}`;
      doc.carImg = carImgUrl;
    }
  };
  // findOne, findAll and update
  driverSchema.post('init', (doc) => {
    setprofileImgURL(doc);
    setcarImgURL(doc)
  });
  
  // create
  driverSchema.post('save', (doc) => {
    setprofileImgURL(doc);
    setcarImgURL(doc) ;
  });
const driver = mongoose.model('driver', driverSchema);
module.exports=driver;

////////////////////////////////



