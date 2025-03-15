const mongoose = require('mongoose');

const NairaAccountSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: String, required: true, unique: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankCode: { type: String, required: true },
    bankName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const NairaAccount = mongoose.model('NairaAccount', NairaAccountSchema);
module.exports = { NairaAccount }; 