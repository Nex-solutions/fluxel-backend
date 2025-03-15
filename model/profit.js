const mongoose = require('mongoose');

const ProfitSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true},
    reason: { type: String, required: true },
    type: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Profit = mongoose.model('ProfitSchema', ProfitSchema);
module.exports = { Profit }; 

