const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
    merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cryptoType: { type: String, enum: ['USDC', 'USDT', 'ETH', 'BTC'], required: true },
    coinId: { type: Number, required: true },
    price: { type: Number, required: true },
    type: { type: String, enum: ['buy', 'sell'], required: true },
    tradeCount: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
});

const Ad = mongoose.model('Ad', AdSchema);
module.exports = { Ad }; 