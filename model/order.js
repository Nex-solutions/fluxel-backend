const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    advertisement: { type: mongoose.Schema.Types.ObjectId, ref: 'Advertisement', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true }, // in USD
    cryptoAmount: { type: Number, required: true }, // Amount in selected crypto
    coinId: { type: String, required: true },
    price: { type: Number, required: true }, // Price at time of order
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'cancelled', 'disputed'],
        default: 'pending'
    },
    disputeReason: { type: String },
    disputeResolution: { type: String },
    processingAt: { type: Date, default: null }, // When payment is being processed
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    disputedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }, // Based on response time from advertisement
    terms: { type: String, required: true }, // Copy of terms from advertisement at time of order
    chatMessages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
    }]
});

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;
