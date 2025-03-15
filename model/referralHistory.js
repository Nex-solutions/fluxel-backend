// model/referralHistory.js
const mongoose = require('mongoose');

const ReferralHistorySchema = new mongoose.Schema({
    referrerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    refereeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    commissionEarned: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'dormant', 'removed'],
        default: 'active'
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

ReferralHistorySchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const ReferralHistory = mongoose.model('ReferralHistory', ReferralHistorySchema);
module.exports = { ReferralHistory };