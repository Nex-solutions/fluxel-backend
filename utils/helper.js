const User = require('../model/user');
const Admin = require('../model/admin');
const Referral = require('../model/referralHistory');
const { NairaTxHistory } = require('../model/nairaTxHistory');
const crypto = require('crypto');


const generateUniqueUID = async () => {
    const characters = '0123456789';
    let uid;
    let isUnique = false;

    while (!isUnique) {
        uid = '';
        for (let i = 0; i < 6; i++) {
            uid += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Check if UID already exists in database
        const existingUser = await User.findOne({ uid });
        if (!existingUser) {
            isUnique = true;
        }
        const existingAdminUser = await Admin.findOne({ uid });
        if (!existingAdminUser) {
            isUnique = true;
        }
    }

    return uid;
};

function generateTransactionId() {
    const timestamp = Date.now().toString(36); // Convert current timestamp to base36
    const randomPart = crypto.randomBytes(4).toString('hex'); // Generate 8 hex characters (4 bytes)
    return `${timestamp}-${randomPart}`;
}

async function generateUniqueTransactionId() {
    let txId;
    let exists = true;

    // Loop until we get an ID that doesn't exist
    while (exists) {
        txId = generateTransactionId();
        // Check if a transaction with this ID already exists
        exists = await NairaTxHistory.findOne({ transactionId: txId });
    }

    return txId;
}


function generateReferralCode(userId) {
    return `FLX-${userId}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

async function calculateCommission(trade) {
    const referee = await User.findById(trade.userId);
    if (referee.referredBy) {
        const referrer = await User.findById(referee.referredBy);
        const commission = trade.fee * 0.10;
        referrer.referralEarnings += commission;
        await referrer.save();

        const referral = await Referral.findOne({ referrerId: referrer._id, refereeId: referee._id });
        referral.commissionEarned += commission;
        referral.lastTradeDate = new Date();
        await referral.save();
    }
}

async function getReferralDashboard(userId) {
    const referrals = await Referral.find({ referrerId: userId }).populate('refereeId');
    const totalEarnings = referrals.reduce((sum, ref) => sum + ref.commissionEarned, 0);
    return {
        totalReferrals: referrals.length,
        totalEarnings,
        referrals,
    };
}

module.exports = { generateUniqueUID, generateReferralCode, calculateCommission, getReferralDashboard, generateUniqueTransactionId };
