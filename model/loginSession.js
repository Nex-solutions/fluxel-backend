const mongoose = require('mongoose');

const LoginSessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    otp: { type: String, required: true },
    verify2fa: { type: Boolean, default: false },
    verifyCode: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true},
    expiresAt: { type: Date }
});

const LoginSession = mongoose.model('LoginSession', LoginSessionSchema);
module.exports = { LoginSession };
