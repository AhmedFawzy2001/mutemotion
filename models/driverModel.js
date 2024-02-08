const mongoose = require('mongoose');


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
    verificationCodeExpiry:Date

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



