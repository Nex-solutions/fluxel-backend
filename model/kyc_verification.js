let { default: mongoose } = require("mongoose");

let KycVerificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    documentType: { type: String, required: true }, // E.g., passport, ID card
    documentNumber: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewNotes: { type: String }
});

module.exports = mongoose.model("KycVerification", KycVerificationSchema)