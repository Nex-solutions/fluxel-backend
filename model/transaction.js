const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    ad: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    fiatAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'payment_sent', 'completed', 'cancelled'], default: 'pending' },
    // escrow: { type: Number, required: true }, // Amount held in escrow
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
module.exports = { Transaction };