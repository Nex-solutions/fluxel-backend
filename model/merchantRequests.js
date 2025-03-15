const mongoose = require('mongoose');

const MerchantRequestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['accepted', 'declined', 'pending'], default: 'pending'},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = {
    MerchantRequest: mongoose.model('MerchantRequest', MerchantRequestSchema)
  };
