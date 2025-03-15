const mongoose = require('mongoose');

const LencoFundAccountSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accountId: { type: String, required: true, unique: true },
    accountReference: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankCode: { type: String, required: true },
    bankName: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    currency: { type: String, required: true },
    meta: {
        transactionReference: { type: String },
        bvn: { type: String },
        isStatic: { type: Boolean }
    }
});

const LencoFundAccount = mongoose.model('LencoFundAccount', LencoFundAccountSchema);
module.exports = { LencoFundAccount }; 