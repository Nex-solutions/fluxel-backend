// controller/referrer.js
const { ReferralHistory } = require('../model/referralHistory');
const User = require('../model/user');
const { updateBalance, updateBlc_NTR, getCoinList } = require('../utils/ccpayment');
const { ReferralWithdrawalHistory } = require('../model/referralWithdrawalHistory');

// Get all referrals for the current user
const getMyReferrals = async (req, res) => {
    try {
        const referrerId = req.user._id;

        const referrals = await ReferralHistory.find({ referrerId })
            .populate('refereeId', 'name email uid createdAt')
            .sort({ createdAt: -1 });

        // Calculate total commission earned
        const totalCommission = referrals.reduce((sum, referral) => sum + referral.commissionEarned, 0);

        // Get active referrals count
        const activeReferrals = referrals.filter(ref => ref.status === 'active').length;

        return res.status(200).json({
            success: true,
            message: 'Referrals retrieved successfully',
            data: {
                referrals,
                stats: {
                    totalReferrals: referrals.length,
                    activeReferrals,
                    totalCommission
                }
            }
        });
    } catch (error) {
        console.error('Error fetching referrals:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get referral statistics
const getReferralStats = async (req, res) => {
    try {
        const referrerId = req.user._id;

        // Get user's available referral balance
        const referrer = await User.findById(referrerId).select('referralEarnings');

        const stats = await ReferralHistory.aggregate([
            { $match: { referrerId: referrerId } },
            {
                $group: {
                    _id: null,
                    totalReferrals: { $sum: 1 },
                    totalCommission: { $sum: '$commissionEarned' },
                    activeReferrals: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                        }
                    }
                }
            }
        ]);


        // Get recent referrals
        const recentReferrals = await ReferralHistory.find({ referrerId })
            .populate('refereeId', 'name email uid createdAt')
            .sort({ createdAt: -1 })
            .limit(5);


        const resData = {
            stats: {
                ...(stats[0] || {
                    totalReferrals: 0,
                    totalCommission: 0,
                    activeReferrals: 0
                }),
                minimumWithdrawal: 20,
                availableBalance: referrer?.referralEarnings || 0
            },
            recentReferrals
        }

        return res.status(200).json({
            success: true,
            message: 'Referral statistics retrieved successfully',
            data: resData
        });
    } catch (error) {
        console.error('Error fetching referral stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


const withdrawEarnings = async (req, res) => {
    try {
        const { coinId, amount } = req.body;
        const userId = req.user._id;
        // Get user and validate balance
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.referralEarnings < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient referral earnings balance'
            });
        }

        if (amount < 20) { // Minimum withdrawal amount check
            return res.status(400).json({
                success: false,
                message: 'Minimum withdrawal amount is 20 USD'
            });
        }

        // Get coin details from CCPayment API
        const coinListResponse = await getCoinList();
        const { code, msg, data } = JSON.parse(coinListResponse);

        if (code !== 10000 || msg !== "success") {
            throw new Error("Failed to retrieve coin details");
        }

        const coin = data.coins.find(c => c.coinId === Number(coinId));
        if (!coin) {
            throw new Error("Invalid coin ID");
        }

        // Calculate crypto amount based on USD amount and coin price
        const cryptoAmount = amount / coin.price;

        // Create withdrawal history record
        const withdrawalHistory = new ReferralWithdrawalHistory({
            user: userId,
            coinId: coinId,
            coinSymbol: coin.symbol,
            amount: amount, // USD amount
            balanceBefore: user.referralEarnings,
            balanceAfter: user.referralEarnings - amount,
            status: 'pending'
        });

        // Deduct from user's referral earnings
        user.referralEarnings -= amount;

        try {
            // Update balance using existing function with crypto amount
            await updateBlc_NTR(userId, coinId, coin.symbol, cryptoAmount, coin.logoUrl);

            // Update withdrawal history status to completed
            withdrawalHistory.status = 'completed';
            await withdrawalHistory.save();
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Withdrawal initiated successfully',
                data: {
                    usdAmount: amount,
                    cryptoAmount: cryptoAmount,
                    coinSymbol: coin.symbol,
                    remainingBalance: user.referralEarnings,
                    transactionId: withdrawalHistory._id
                }
            });
        } catch (error) {
            // If balance update fails, mark withdrawal as failed
            withdrawalHistory.status = 'failed';
            await withdrawalHistory.save();
            throw error;
        }

    } catch (error) {
        console.error('Error processing referral earnings withdrawal:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};





module.exports = {
    getMyReferrals,
    getReferralStats,
    withdrawEarnings
};