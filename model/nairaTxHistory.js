const mongoose = require('mongoose');

const NairaTxHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    fee: { type: Number, required: true },
    narration: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, required: true },
    accountId: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankCode: { type: String, required: true },
    bankName: { type: String, required: true },
    clientReference: { type: String, required: true },
    transactionReference: { type: String, required: true },
    initiatedAt: { type: Date },
    completedAt: { type: Date },
    failedAt: { type: Date },
    reasonForFailure: { type: String },
    createdAt: { type: Date, default: Date.now }
});
const NairaTxHistory = mongoose.models.NairaTxHistory || mongoose.model('NairaTxHistory', NairaTxHistorySchema);
module.exports = { NairaTxHistory }; 