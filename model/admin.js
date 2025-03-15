const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['super-admin', 'sub-admin', 'admin', 'customer-support']}, // Role admin
    uid: { type: String, default: "" },
    isActive: { type: Boolean, default: true},
    lockdown: { type: Boolean, default: false},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

});
module.exports = mongoose.model('Admin', AdminSchema);
