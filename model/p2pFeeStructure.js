const mongoose = require('mongoose');

const P2PFeeSchema = new mongoose.Schema({
    tierOptions: { type: String, enum: ['Standard', 'Gold', 'Platinum'], default: 'Standard' },
    standardTier: { type: Number, default: 0.1 },
    goldTierPercentage: { type: Number, default: 0.5 },
    platinumTier: { type: Number, default: 0.3 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const P2PFeeStructure = mongoose.model('P2PFeeStructure', P2PFeeSchema);
module.exports = { P2PFeeStructure }; 

