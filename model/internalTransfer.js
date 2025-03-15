const mongoose = require('mongoose');

const InternalTransferSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coinId: { type: Number, required: true },
    amount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const InternalTransfer = mongoose.models.InternalTransfer || mongoose.model('InternalTransfer', InternalTransferSchema);
module.exports = { InternalTransfer }; 