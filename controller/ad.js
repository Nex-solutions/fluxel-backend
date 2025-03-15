const { Ad } = require('../model/ad');
const { getCoinList } = require('../utils/ccpayment'); // Assuming this utility function exists

async function createAd(req, res) {
    try {
        const { cryptoType, price, type } = req.body;
        const merchant = req.user._id;

        // Fetch the list of coins to verify cryptoType
        const coinListResponse = await getCoinList();
        const { code, msg, data } = JSON.parse(coinListResponse);

        if (code !== 10000 || msg !== "success") {
            return res.status(500).json({
                status: false,
                message: "Failed to retrieve coin list",
            });
        }

        const coins = data.coins;
        const coin = coins.find(c => c.symbol === cryptoType);

        if (!coin) {
            return res.status(400).json({
                status: false,
                message: "Invalid crypto type",
            });
        }

        const ad = new Ad({
            merchant,
            cryptoType,
            coinId: coin.coinId, // Store the coinId
            price,
            type, // Buy or Sell
            tradeCount: 0
        });

        await ad.save();

        return res.status(201).json({
            status: true,
            message: "Ad created successfully",
            data: ad
        });
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

async function getAllAds(req, res) {
    try {
        const ads = await Ad.find().populate('merchant', 'name email');
        return res.status(200).json({
            status: true,
            message: "Ads retrieved successfully",
            data: ads
        });
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

async function executeTrade(advertisementId, userId, amount) {
    try {
        const advertisement = await Ad.findById(advertisementId);
        if (!advertisement) {
            throw new Error('Advertisement not found');
        }

        // Increment the trade count
        advertisement.tradeCount += 1;
        await advertisement.save();

        // Process the transaction instantly
        // Transfer cryptocurrency to the user
        await transferCrypto(advertisement.merchantId, userId, advertisement.coinId, amount);

        // Transfer fiat currency to the merchant
        await transferFiat(userId, advertisement.merchantId, amount);

        return {
            success: true,
            message: 'Trade executed successfully',
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
        };
    }
}

async function transferCrypto(fromUserId, toUserId, coinId, amount) {
    // Logic to transfer cryptocurrency instantly
}

async function transferFiat(fromUserId, toUserId, amount) {
    // Logic to transfer fiat currency instantly
}

module.exports = {
    createAd,
    getAllAds,
    executeTrade,
}; 