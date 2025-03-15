const mongoose = require('mongoose');

const BalanceTxHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coinId: { type: Number, required: true },
    amount: { type: Number, required: true },
    recordId: { type: String, required: true, unique: true }, // Unique identifier for the transaction
    createdAt: { type: Date, default: Date.now }
});

const BalanceTxHistory = mongoose.models.BalanceTxHistory || mongoose.model('BalanceTxHistory', BalanceTxHistorySchema);
module.exports = { BalanceTxHistory }; 