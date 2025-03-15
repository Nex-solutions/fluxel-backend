// model/message.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = { Notification };


// user: {name, email}
// content: 
// type : 