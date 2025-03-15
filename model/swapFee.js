const mongoose = require('mongoose');

const SwapFeeSchema = new mongoose.Schema({
    platformFeePercentage: { type: Number, required: true, default: 1.5 }, // Platform fee percentage
    apiPaymentFeePercentage: { type: Number, required: true, default: 0.5 }, // API payment fee percentage
    totalFeePercentage: { type: Number, required: true, default: 2.0 }, // Total fee percentage
    description: { type: String, default: 'Token Swap Fee Structure' }, // Description of the fee structure
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const SwapFee = mongoose.model('SwapFee', SwapFeeSchema);
module.exports = { SwapFee }; 