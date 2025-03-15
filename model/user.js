const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['merchant', 'buyer'], default: 'buyer' }, // Role admin
    fiatBalance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    name: {
        type: String,
        required: true,
        default: "Anonymous"
    },
    phone: {
        type: String,
    },
    isMerchant: {
        type: Boolean,
        required: true,
        default: false,
    },
    isVerified: { type: Boolean, default: false },
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DepositAddr' }],

    // Two factor authentication
    twoFactorSecret: {
        type: String,
        default: null
    },
    isTwoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorTempSecret: {
        type: String,
        default: null
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    lockedReason: {
        type: String,
        enum: ['NEW_IP_DETECTED', 'SUSPICIOUS_ACTIVITY', 'ADMIN_ACTION'],
        default: null
    },
    uid: {
        type: String,
        default: "",
    },
    ninDocument: { type: String },
    proofOfAddress: { type: String },
    ninVerified: { type: Boolean, default: false },
    proofOfAddressVerified: { type: Boolean, default: false },
    profilePicture: { type: String },

    // KYC Fields
    ninNumber: { type: String },
    ninVerificationData: { type: mongoose.Schema.Types.Mixed },

    bvnNumber: { type: String },
    bvnVerified: { type: Boolean, default: false },
    bvnVerificationData: { type: mongoose.Schema.Types.Mixed },

    kycLevel: { type: Number, default: 0 }, // 0: None, 1: Basic, 2: Full
    kycStatus: {
        type: String,
        enum: ['none', 'pending', 'verified', 'rejected'],
        default: 'none'
    },
    kycRejectionReason: { type: String },

    // Additional user data
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female'] },

    // New fields
    preferredLanguage: { type: String, default: 'en' }, // For user preferred language
    socialLinks: { type: [String], default: [] }, // Store social media links
    lastLogin: { type: Date }, // Last login date
    failedLoginAttempts: { type: Number, default: 0 }, // To track failed login attempts

    // Settings field
    settings: {
        toggleSettings: {
            enableAdExpiration: { type: Boolean, default: false },
            enable2fa: { type: Boolean, default: false },
            googleAuthenticator: { type: Boolean, default: false },
            appLock: { type: Boolean, default: false },
            popup: { type: Boolean, default: false },
            promotionalEmail: { type: Boolean, default: false },
            eventPush: { type: Boolean, default: false },
            messages: { type: Boolean, default: false },
            trades: { type: Boolean, default: false },
        },
    },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referralEarnings: { type: Number, default: 0 },
});

module.exports = mongoose.model('User', UserSchema);









// //model/user.js

// let mongoose = require('mongoose');

// let userSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//         default: "Anonymous"
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true,
//     },
//     phone: {
//         type: String,
//     },
//     password: {
//         type: String,
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     },
//     isMerchant: {
//         type: Boolean,
//         required: true,
//         default: false,
//     },
//     isVerified: { type: Boolean, default: false },
//     addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DepositAddr' }],

//     // Two factor authentication
//     twoFactorSecret: {
//         type: String,
//         default: null
//     },
//     isTwoFactorEnabled: {
//         type: Boolean,
//         default: false
//     },
//     twoFactorTempSecret: {
//         type: String,
//         default: null
//     },
//     isLocked: {
//         type: Boolean,
//         default: false
//     },
//     lockedReason: {
//         type: String,
//         enum: ['NEW_IP_DETECTED', 'SUSPICIOUS_ACTIVITY', 'ADMIN_ACTION'],
//         default: null
//     },
//     uid: {
//         type: String,
//         default: "",
//     },
//     ninDocument: { type: String },
//     proofOfAddress: { type: String },
//     ninVerified: { type: Boolean, default: false },
//     proofOfAddressVerified: { type: Boolean, default: false },
//     profilePicture: { type: String },

//     // KYC Fields
//     ninNumber: { type: String },
//     ninVerificationData: { type: mongoose.Schema.Types.Mixed },

//     bvnNumber: { type: String },
//     bvnVerified: { type: Boolean, default: false },
//     bvnVerificationData: { type: mongoose.Schema.Types.Mixed },

//     kycLevel: { type: Number, default: 0 }, // 0: None, 1: Basic, 2: Full
//     kycStatus: {
//         type: String,
//         enum: ['none', 'pending', 'verified', 'rejected'],
//         default: 'none'
//     },
//     kycRejectionReason: { type: String },

//     // Additional user data
//     dateOfBirth: { type: Date },
//     gender: { type: String, enum: ['male', 'female'] }
// });

// module.exports = mongoose.model('User', userSchema);
