const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    note: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Notes = mongoose.model('Notes', NoteSchema);
module.exports = { Notes }; 