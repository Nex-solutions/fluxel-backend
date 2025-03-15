const mongoose = require('mongoose');

const ActivityLogs = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true},
    status: { type: String, required: true},
    details: { type: String, required: true},
    updatedAt: { type: Date, default: Date.now }
});

const Activity = mongoose.model('activitylogs', ActivityLogs);
module.exports = { Activity };