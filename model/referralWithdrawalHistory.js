const mongoose = require('mongoose');
// //
const ReferralWithdrawalHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coinId: {
        type: Number,
        required: true
    },
    coinSymbol: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    balanceBefore: {
        type: Number,
        required: true
    },
    balanceAfter: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    transactionHash: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const ReferralWithdrawalHistory = mongoose.models.ReferralWithdrawalHistory || mongoose.model('ReferralWithdrawalHistory', ReferralWithdrawalHistorySchema);
module.exports = { ReferralWithdrawalHistory }; 