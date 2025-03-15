const mongoose = require('mongoose');

const WithdrawalSessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    otp: { type: String, required: true },
    verifyCode: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true},
    reason: { type: String, required: true },
    expiresAt: { type: Date }
});

const WithdrawalSession = mongoose.model('WithdrawalSession', WithdrawalSessionSchema);
module.exports = { WithdrawalSession };
