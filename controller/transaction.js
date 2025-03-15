const { Transaction } = require('../model/transaction');
const { Ad } = require('../model/ad');
const Balance = require('../model/balance');
const User = require('../model/user');
const { CryptoWithdrawalHistory } = require('../model/cryptoWithdrawalHistory');
const { InternalTransfer } = require('../model/internalTransfer');
const { BalanceTxHistory } = require('../model/balanceTxHistory');
const { NairaTxHistory } = require('../model/nairaTxHistory');
const { ReferralWithdrawalHistory } = require('../model/referralWithdrawalHistory');
const { addNotifications } = require('../utils/notification');


async function joinAd(req, res) {
    try {
        const { adId, cryptoAmount } = req.body;
        const user = req.user._id;
        // Ensure cryptoAmount is a valid number
        if (isNaN(cryptoAmount) || cryptoAmount <= 0) {
            return res.status(400).json({
                status: false,
                message: "Invalid cryptocurrency amount",
            });
        }

        const ad = await Ad.findById(adId).populate('merchant');
        if (!ad || ad.status !== 'open') {
            return res.status(404).json({
                status: false,
                message: "Ad not found or not open",
            });
        }

        // Calculate the fiat amount based on the crypto amount and the ad's price
        const fiatAmount = cryptoAmount * ad.price;

        // Determine roles based on ad type
        let buyer, seller;
        if (ad.type === 'sell') {
            buyer = user;
            seller = ad.merchant._id;
        } else {
            buyer = ad.merchant._id;
            seller = user;
        }

        // Check the buyer's fiat balance if the ad type is 'buy'
        if (ad.type === 'buy') {
            const buyerFiatBalance = await Balance.findOne({ user: buyer, coinId: 1111 });
            if (!buyerFiatBalance || buyerFiatBalance.balance < fiatAmount) {
                return res.status(400).json({
                    status: false,
                    message: "Buyer does not have enough fiat balance",
                });
            }
        }

        // Check the seller's balance for the specified coin
        const sellerBalance = await Balance.findOne({ user: seller, coinId: ad.coinId });
        if (!sellerBalance || sellerBalance.balance < cryptoAmount) {
            return res.status(400).json({
                status: false,
                message: "Seller does not have enough balance",
            });
        }

        // Transfer the cryptocurrency instantly
        sellerBalance.balance -= cryptoAmount;
        await sellerBalance.save();

        const buyerBalance = await Balance.findOneAndUpdate(
            { user: buyer, coinId: ad.coinId },
            { $inc: { balance: cryptoAmount } },
            { new: true, upsert: true }
        );

        // Update fiat balances instantly
        if (ad.type === 'sell') {
            const sellerUser = await User.findById(seller);
            const sellerFiatBalance = await Balance.findOneAndUpdate(
                { user: seller, coinId: 1111 },
                { $inc: { balance: fiatAmount } },
                { new: true, upsert: true }
            );
            await sellerFiatBalance.save();
        } else {
            const buyerUser = await User.findById(buyer);
            const buyerFiatBalance = await Balance.findOneAndUpdate(
                { user: buyer, coinId: 1111 },
                { $inc: { balance: fiatAmount } },
                { new: true, upsert: true }
            );
            await buyerFiatBalance.save();
        }

        const transaction = new Transaction({
            ad: ad._id,
            buyer,
            seller,
            amount: cryptoAmount,
            fiatAmount,
            status: 'completed',
        });

        await transaction.save();

        return res.status(201).json({
            status: true,
            message: "Joined ad successfully, transaction completed instantly",
            data: transaction
        });
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

async function releaseCoins(req, res) {
    try {
        const { transactionId } = req.body;
        let user = req.user._id;

        const transaction = await Transaction.findById(transactionId).populate('ad');
        if (!transaction || transaction.status !== 'payment_sent') {
            return res.status(404).json({
                status: false,
                message: "Transaction not found or not in a state to release coins",
            });
        }

        const ad = transaction.ad;
        const buyerBalance = await Balance.findOne({ user: transaction.buyer, coinId: ad.coinId });
        const sellerBalance = await Balance.findOne({ user: transaction.seller, coinId: ad.coinId });

        if (!buyerBalance || !sellerBalance) {
            return res.status(400).json({
                status: false,
                message: "Balance information not found for buyer or seller",
            });
        }

        const buyer = await User.findById(transaction.buyer);
        const seller = await User.findById(transaction.seller);

        if (ad.type === 'sell') {
            // Release coins from seller to buyer
            if (sellerBalance.lockedBalance < transaction.amount) {
                return res.status(400).json({
                    status: false,
                    message: "Insufficient locked balance to release",
                });
            }
            sellerBalance.lockedBalance -= transaction.amount;
            buyerBalance.balance += transaction.amount;

            // Update fiat balance
            seller.fiatBalance += transaction.fiatAmount;
        } else {
            // Release coins from buyer to seller
            if (buyerBalance.lockedBalance < transaction.amount) {
                return res.status(400).json({
                    status: false,
                    message: "Insufficient locked balance to release",
                });
            }
            buyerBalance.lockedBalance -= transaction.amount;
            sellerBalance.balance += transaction.amount;

            // Update fiat balance
            buyer.fiatBalance += transaction.fiatAmount;
        }

        await buyerBalance.save();
        await sellerBalance.save();
        await buyer.save();
        await seller.save();

        // Update transaction status
        transaction.status = 'completed';
        await transaction.save();

        // Add Notifications
        const notifications = [
            { user: seller._id, content: `${transaction.amount} ${ad.cryptoType} was released to ${buyer.email}`, type: 'P2P' },
            { user: buyer._id, content: `Seller ${seller.email} released ${transaction.amount} ${ad.cryptoType}`, type: 'P2P' }
        ];

        const notification_object = await addNotifications(notifications);
        if (notification_object) {
            console.log("Notifications added successfully:", notification_object);
        } else {
            console.error("Failed to add notifications.");
        }

        // Response for success
        return res.status(200).json({
            status: true,
            message: "Coins released successfully",
            data: transaction
        });
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

async function getTransactions(req, res) {
    try {
        const transactions = await Transaction.find()
            .populate('buyer', 'name email')
            .populate('seller', 'name email')
            .populate('ad', 'cryptoType price type');

        return res.status(200).json({
            status: true,
            message: "Transactions retrieved successfully",
            data: transactions
        });
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

async function markPaymentSent(req, res) {
    try {
        const { transactionId } = req.body;
        const user = req.user._id;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction || transaction.status !== 'pending') {
            return res.status(404).json({
                status: false,
                message: "Transaction not found or not in a state to mark payment as sent",
            });
        }

        if (transaction.buyer.toString() !== user.toString()) {
            return res.status(403).json({
                status: false,
                message: "Only the buyer can mark the payment as sent",
            });
        }

        transaction.status = 'payment_sent';
        await transaction.save();

        return res.status(200).json({
            status: true,
            message: "Payment marked as sent",
            data: transaction
        });
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}


async function GetAllTransactions(req, res) {
    try {
        const userId = req.user._id;

        const [
            p2p,
            crypto_withdrawal,
            internal_transfer,
            crypto_transaction,
            naira_transactions,
            referral_transactions
        ] = await Promise.all([
            Transaction.find({ $or: [{ buyer: userId }, { seller: userId }] }), // Fetch where user is buyer or seller
            CryptoWithdrawalHistory.find({ user: userId }),
            InternalTransfer.find({ $or: [{ sender: userId }, { recipient: userId }] }), // User can be sender or recipient
            BalanceTxHistory.find({ user: userId }),
            NairaTxHistory.find({ user: userId }),
            ReferralWithdrawalHistory.find({ user: userId })
        ]);

        res.status(200).json({
            p2p,
            crypto_withdrawal,
            internal_transfer,
            crypto_transaction,
            naira_transactions,
            referral_transactions
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    joinAd,
    releaseCoins,
    getTransactions,
    markPaymentSent,
    GetAllTransactions
}; 