const mongoose = require('mongoose');

const P2PFeeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registrationDate: { type: Date, required: true },
    tradingVolume: { type: Number, default: 0 },
    merchantTier: { type: String, enum: ['Standard', 'Gold', 'Platinum'], default: 'Standard' },
    subscriptionEndDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const P2PFee = mongoose.model('P2PFee', P2PFeeSchema);
module.exports = { P2PFee }; 