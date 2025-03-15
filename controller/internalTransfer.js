const { InternalTransfer } = require('../model/internalTransfer');
const Balance = require('../model/balance');
const User = require('../model/user');
const { getCoinList } = require('../utils/ccpayment'); // Assuming these functions exist in ccpayment
const { addNotifications } = require('../utils/notification');

async function transferCoins(req, res) {
    try {
        const { recipientUid, recipientEmail, coinId, amount } = req.body;
        const sender = req.user._id;

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                status: false,
                message: "Invalid amount",
            });
        }

        // Find recipient by UID or email
        const recipient = await User.findOne({
            $or: [{ uid: recipientUid }, { email: recipientEmail }]
        });

        if (!recipient) {
            return res.status(404).json({
                status: false,
                message: "Recipient not found",
            });
        }

        // Check sender's balance
        let senderBalance = await Balance.findOne({ user: sender, coinId });
        if (!senderBalance) {
            return res.status(400).json({
                status: false,
                message: "Sender does not have the specified coin",
            });
        }
        if (senderBalance.balance < amount) {
            return res.status(400).json({
                status: false,
                message: "Insufficient balance",
            });
        }

        // Update sender's balance
        senderBalance.balance -= amount;
        await senderBalance.save();

        // Check recipient's balance
        let recipientBalance = await Balance.findOne({ user: recipient._id, coinId });
        if (!recipientBalance && coinId !== 1111) {
            // Use ccpayment to get coin list and find the specific coin details
            const coinListResponse = await getCoinList();
            const { code, msg, data } = JSON.parse(coinListResponse);

            if (code !== 10000 || msg !== "success") {
                return res.status(500).json({
                    status: false,
                    message: "Failed to retrieve coin list",
                });
            }

            const coinDetails = data.coins.find(coin => coin.coinId === coinId);
            if (!coinDetails) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid coin ID",
                });
            }

            recipientBalance = new Balance({
                user: recipient._id,
                coinId,
                balance: 0,
                coinName: coinDetails.symbol,
                coinLogo: coinDetails.logoUrl
            });
        } else if (!recipientBalance && coinId === 111) {
            // Implement lenco
        }
        recipientBalance.balance += amount;
        await recipientBalance.save();

        // Record internal transfer
        const internalTransfer = new InternalTransfer({
            sender,
            recipient: recipient._id,
            coinId,
            amount,
        });

        await internalTransfer.save();

        const notifications = [
            {user: sender, content: `${coinDetails.coinName} was transferred to ${recipient.email}`, type: "INTERNAL_TRANSFER"},
            {user: recipient, content: `Received ${coinDetails.coinName} from ${sender.email}`, type: "INTERNAL_TRANSFER"},
        ]

        const notification_object = await addNotifications(notifications);
        if (notification_object) {
            console.log("Notifications added successfully:", notification_object);
        } else {
            console.error("Failed to add notifications.");
        }

        return res.status(200).json({
            status: true,
            message: "Transfer completed successfully",
            data: internalTransfer
        });
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}


module.exports = {
    transferCoins,
}; 