const moongoose = require("mongoose");

const dbConnection =()=>{
    // connect with db 
moongoose.connect(process.env.MONGO_URL).then((conn)=>{
    console.log(`Database Connected `);
}).catch((err)=>{
    console.error(`Database Error : ${err}`);
    process.exit(1);
});
}
module.exports = dbConnection;