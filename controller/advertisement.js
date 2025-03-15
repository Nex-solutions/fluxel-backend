const Advertisement = require('../model/advertisement');
const User = require('../model/user');
const { getCoinList } = require('../utils/ccpayment');
// const { validateCreateAdvertisement } = require('../validation/advertisement');

/**
 * Create a new P2P merchant advertisement
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object 
 */
const createAdvertisement = async (req, res) => {
    try {

        let merchant = req.user;

        const {
            type,
            coinId,
            price,
            minAmount,
            maxAmount,
            terms,
            instantTrade,
            availableAmount,
            responseTime,
        } = req.body;

        console.log("--req.body--", req.body);



        // Get merchant user from token
        if (!merchant) {
            return res.status(404).json({
                status: false,
                message: 'Merchant not found'
            });
        }

        // Verify coinId exists
        const coinListResponse = await getCoinList();
        const { code, msg, data } = JSON.parse(coinListResponse);


        if (code !== 10000 || msg !== "success") {
            return res.status(500).json({
                status: false,
                message: "Failed to retrieve coin list"
            });
        }

        const coins = data.coins;
        const coin = coins.find(c => c.coinId === coinId);

        if (!coin) {
            return res.status(400).json({
                status: false,
                message: "Invalid coin ID"
            });
        }

        // Create new advertisement
        const advertisement = new Advertisement({
            merchant: merchant._id,
            type,
            coinId,
            price,
            minAmount,
            maxAmount,
            terms,
            instantTrade,
            availableAmount,
            responseTime
        });

        await advertisement.save();

        return res.status(201).json({
            status: true,
            message: 'Advertisement created successfully',
            data: advertisement
        });

    } catch (error) {
        console.error('Error creating advertisement:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Get all advertisements
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAdvertisements = async (req, res) => {
    try {
        const { type, coinId, status } = req.query;

        const filter = {};
        if (type) filter.type = type;
        if (coinId) filter.coinId = coinId;
        if (status) filter.status = status;

        const advertisements = await Advertisement.find(filter)
            .populate('merchant', 'username email')
            .sort('-createdAt');

        return res.status(200).json({
            status: true,
            message: 'Advertisements retrieved successfully',
            data: advertisements
        });
    } catch (error) {
        console.error('Error getting advertisements:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Get merchant's advertisements
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMerchantAdvertisements = async (req, res) => {
    try {
        let merchant = req.user;
        const advertisements = await Advertisement.find({ merchant: merchant._id })
            .sort('-createdAt');

        return res.status(200).json({
            status: true,
            message: 'Merchant advertisements retrieved successfully',
            data: advertisements
        });
    } catch (error) {
        console.error('Error getting merchant advertisements:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Update advertisement
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateAdvertisement = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const advertisement = await Advertisement.findOne({
            _id: id,
            merchant: req.user._id
        });

        if (!advertisement) {
            return res.status(404).json({
                status: false,
                message: 'Advertisement not found'
            });
        }

        // Update only allowed fields
        const allowedUpdates = [
            'price',
            'minAmount',
            'maxAmount',
            'terms',
            'instantTrade',
            'availableAmount',
            'responseTime'
        ];

        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                advertisement[field] = updates[field];
            }
        });

        await advertisement.save();

        return res.status(200).json({
            status: true,
            message: 'Advertisement updated successfully',
            data: advertisement
        });
    } catch (error) {
        console.error('Error updating advertisement:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Delete advertisement
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteAdvertisement = async (req, res) => {
    try {
        const { id } = req.params;

        const advertisement = await Advertisement.findOneAndDelete({
            _id: id,
            merchant: req.user._id
        });

        if (!advertisement) {
            return res.status(404).json({
                status: false,
                message: 'Advertisement not found'
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Advertisement deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting advertisement:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    createAdvertisement,
    getAdvertisements,
    getMerchantAdvertisements,
    updateAdvertisement,
    deleteAdvertisement
};
