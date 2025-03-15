const mongoose = require('mongoose');

const FeeChargedSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coinId: { type: Number, required: true },
    amountTraded: { type: Number, required: true },
    transactionType: { type: String, enum: ['crypto', 'fiat'], required: true },
    action: { type: String, enum: ['deposit', 'withdrawal'], required: true },
    fee: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}); 

const FeeCharged = mongoose.models.FeeCharged || mongoose.model('FeeCharged', FeeChargedSchema);
module.exports = { FeeCharged }; 