const User = require('../model/user');
const { ReferralHistory } = require('../model/referralHistory');




/**
 * Increments the referral earnings for a user's referrer
 * @param {string} userId - The ID of the user whose referrer should receive earnings
 * @param {number} amount - The transaction amount from which to calculate commission
 * @returns {Promise<Object>} - Result of the operation
 */
const incrementReferralEarnings = async (userId, amount) => {
    try {
        // Find the user and their referrer
        const user = await User.findById(userId).populate('referredBy');

        if (!user || !user.referredBy) {
            console.log("user not found: incrementReferralEarnings");
            return
        }

        // Calculate commission (10% of the transaction amount)
        const commissionRate = 0.10;
        const commissionAmount = Number(amount) * commissionRate;

        // Get the referrer
        const referrer = user.referredBy;

        // Update or create referral history record
        await ReferralHistory.findOneAndUpdate(
            {
                referrerId: referrer._id,
                refereeId: userId
            },
            {
                $inc: { commissionEarned: commissionAmount },
                status: 'active',
                updatedAt: Date.now()
            },
            {
                upsert: true,
                new: true
            }
        );

        // Update referrer's earnings
        await User.findByIdAndUpdate(
            referrer._id,
            {
                $inc: { referralEarnings: commissionAmount }
            },
            { new: true }
        );
        return;

    } catch (error) {
        console.error('Error incrementing referral earnings:', error);
        return {
            success: false,
            message: 'Failed to update referral earnings',
            error: error.message
        };
    }
};

/**
 * Gets the total referral earnings for a user
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object>} - Result of the operation
 */
const getReferralEarnings = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        // Get all referral history for this referrer
        const referralHistory = await ReferralHistory.find({
            referrerId: userId,
            status: 'active'
        });

        const totalEarnings = user.referralEarnings;
        const totalReferrals = referralHistory.length;

        return {
            success: true,
            data: {
                totalEarnings,
                totalReferrals,
                referralHistory
            }
        };

    } catch (error) {
        console.error('Error getting referral earnings:', error);
        return {
            success: false,
            message: 'Failed to get referral earnings',
            error: error.message
        };
    }
};

module.exports = {
    incrementReferralEarnings,
    getReferralEarnings
}; 