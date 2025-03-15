const mongoose = require('mongoose');

const AdvertisementSchema = new mongoose.Schema({
    merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['buy', 'sell'], required: true },
    coinId: { type: String, required: true },
    paymentMethod: { type: String, enum: ['in-app'], default: 'in-app', required: true },
    price: { type: Number, required: true }, // in USD
    minAmount: { type: Number, required: true }, // in USD
    maxAmount: { type: Number, required: true }, // in USD
    terms: { type: String, required: true },
    instantTrade: { type: Boolean, default: false },
    availableAmount: { type: Number, required: true }, // in USD
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    responseTime: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    disputedOrders: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 }, // Percentage of successful orders
    isDeleted: { type: Boolean, default: false }
});

const Advertisement = mongoose.model('Advertisement', AdvertisementSchema);
module.exports = Advertisement;
