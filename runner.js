let mongoose = require('mongoose');
const OTP = require('./model/otp');
const User = require('./model/user');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

const run = async () => {
     try {
        //   const otp =await OTP.find({});
        //   console.log("OTP:", otp);
        const user = await User.find({}).limit(10).sort({ createdAt: -1 });
        console.log("USERS", user);
     } catch (error) {
console.log("error...",error)
     }
}
run()
