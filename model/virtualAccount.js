let { default: mongoose } = require("mongoose");

let virtualAccountSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        accountName: {
            type: String,
            required: true,
        },
        canFund: {
            type: Boolean,
            default: false
        },
        canWithdraw: {
            type: Boolean,
            default: false
        },
        accountNumber: {
            type: String,
        },
        bankName: {
            type: String,
        },
        transactionReference: {
            type: String,
            required: true
        },
        bvn: {
            type: String,
        },
        config: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now
        },

        // /////
        bankCode: {
            type: String,
        },
        recipientId: {
            type: String,
        },
    },
    { timestamps: true }
);

let virtualAccount = mongoose.model("VirtualAccount", virtualAccountSchema)
module.exports = { virtualAccount }
