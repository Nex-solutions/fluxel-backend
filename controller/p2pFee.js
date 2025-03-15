const { P2PFee } = require('../model/p2pFee');

async function calculateP2PFee(req, res) {
    try {
        const user = req.user; // Assuming user is attached to the request
        const { transactionAmount } = req.body;

        // Retrieve the user's P2P fee details
        const p2pFeeDetails = await P2PFee.findOne({ userId: user._id });

        if (!p2pFeeDetails) {
            return res.status(404).json({
                status: false,
                message: "P2P fee details not found for user",
            });
        }

        const currentDate = new Date();
        let feePercentage = 0;

        // Determine fee based on user status
        if (currentDate - p2pFeeDetails.registrationDate <= 30 * 24 * 60 * 60 * 1000) {
            // Zero fees for new traders within the first 30 days
            feePercentage = 0;
        } else if (p2pFeeDetails.merchantTier === 'Gold') {
            feePercentage = 0.1;
        } else if (p2pFeeDetails.merchantTier === 'Platinum' && transactionAmount > 1000000) {
            feePercentage = 0;
        } else {
            // Performance-based fees for takers
            if (p2pFeeDetails.tradingVolume <= 500000) {
                feePercentage = 0.5;
            } else if (p2pFeeDetails.tradingVolume <= 2000000) {
                feePercentage = 0.3;
            } else {
                feePercentage = 0.1;
            }
        }

        const feeAmount = (transactionAmount * feePercentage) / 100;
        const netAmount = transactionAmount - feeAmount;

        return res.status(200).json({
            status: true,
            message: "P2P fee calculated successfully",
            data: { feeAmount, netAmount }
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
    calculateP2PFee,
}; 