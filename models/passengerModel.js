const mongoose = require('mongoose');


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
    ExpiryDate:String,

    CVV:String,
    profileImg: {type: String,required:true,default:"360_F_353110097_nbpmfn9iHlxef4EDIhXB1tdTD0lcWhG9.jpg"},

    password: {
      type: String,
      
    },
   
    gender: {
      type: String,
      enum: ['male', 'female'],
      
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
    createdAt: { type: Date, default: Date.now },
    verificationCodeExpiry:Date,
    verificationCodeEncrypted: String,
    ExpiryDate:String,
  },
  
);


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