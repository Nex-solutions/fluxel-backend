let mongoose = require('mongoose');

let otpSchema = new mongoose.Schema({
     email: {
          type: String,
          required: true
     },
     otp: {
          type: String,
          required: true
     },
     password: {
          type: String,
     },
     name: {
          type: String,
     },
     role: {
          type: String,
          required: false
     },
     createdAt: {
          type: Date,
          default: Date.now,
          expires: 300
     },
     referralCode: {
          type: String,
     }
});

module.exports = mongoose.model('OTP', otpSchema);
