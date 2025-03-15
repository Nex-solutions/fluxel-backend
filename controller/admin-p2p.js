let { Ad } = require('../model/ad');
let { Transaction } = require('../model/transaction');
let { SwapFee } = require('../model/swapFee');
let { P2PFeeStructure } = require('../model/p2pFeeStructure');
let { P2PFee } = require('../model/p2pFee');
require("dotenv").config();


/** Ads Admin */

// const CreateAd = async (req, res) => {
//     try {
//         // Get data
//         const { 
//             admin,
//             cryptoType,
//             coinId,
//             price,
//             type,
//             status
//         } = req.body;
//     } catch (error) {
//         console.error("Error fetching ads:", error);
//         return res.status(500).json({ success: false, message: 'Server error' });
//     }
// }

// Delete Ad
const DeleteAd = async (req, res) => {
    try {
        const allowedAdmins = ['super-admin', 'sub-admin']

        if (!allowedAdmins.includes(req.admin.role)) return res.status(401).json({success: false, message: 'Not Authorized'});

        const { id } = req.query;

        // Find ad by ID and delete
        
        const deletedAd = await Ad.findByIdAndDelete(id);
        // console.log(id)

        if (!deletedAd) {
            return res.status(404).json({ success: false, message: "Ad not found" });
        }

        return res.status(200).json({ success: true, message: "Ad deleted successfully" });

    } catch (error) {
        console.error("Error deleting ad:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const GetAds = async (req, res) => {
    try {
        const allowedAdmins = ['super-admin', 'sub-admin', 'admin']

        if (!allowedAdmins.includes(req.admin.role)) return res.status(401).json({success: false, message: 'Not Authorized'});

        // Extract query parameters
        const { page = 1, limit = 10, type, status } = req.query;

        // Convert page and limit to numbers
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        let filter = {};

        if (type) filter.type = type;
        
        if (status) filter.status = status;

        // Fetch all ads from the database
        const ads = await Ad.find(filter, {
            merchant: 1,
            cryptoType: 1,
            coinId: 1,
            price: 1,
            type: 1,
            status: 1,
            createdAt: 1
            }
        ).populate('merchant', 'name email')
        .skip(skip)
        .limit(limitNumber);

        // Calculate next page
        const totalAds = await Ad.countDocuments(filter);
        const hasNextPage = skip + ads.length < totalAds;
        const nextPage = hasNextPage ? pageNumber + 1 : null;

        return res.status(200).json({
            success: true,
            message: 'Ads retrieved successfully.',
            ads,
            currentPage: pageNumber,
            nextPage,
            totalPages: Math.ceil(totalAds / limitNumber)
        });
    } catch (error) {
        console.error("Error fetching ads:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const EditAd = async (req, res) => {
    try {
        const allowedAdmins = ['super-admin', 'sub-admin']

        if (!allowedAdmins.includes(req.admin.role)) return res.status(401).json({success: false, message: 'Not Authorized'});

        // Ads data
        const { id, status } = req.body;

        // Find the user to be updated
        if (!id || !status) {
            return res.status(400).json({ success: false, message: 'Required fields missing'});
           }

        const ad = await Ad.findById(id);

        if (!ad) {
            return res.status(404).json({ success: false, message: 'Ad not found'});
        }

        await Ad.findByIdAndUpdate(ad._id, {'status': status});

        return res.status(200).json({
            success: true,
            message: 'Ads editted successfully.'
        });
    } catch (error) {
        console.error("Error editing ads:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


/** P2P Orders */
const GetP2POrders = async (req, res) => {
    try{
        const allowedAdmins = ['super-admin', 'sub-admin', 'admin']

        if (!allowedAdmins.includes(req.admin.role)) return res.status(401).json({success: false, message: 'Not Authorized'});

        // Extract query parameters
        const { page = 1, limit = 10, status } = req.query;

        // Convert page and limit to numbers
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Define valid status options
        const statusOptions = ['pending', 'payment_sent', 'completed', 'cancelled'];

        // Validate status: If not valid, set it to an empty string (or remove it from the filter)
        const validStatus = statusOptions.includes(status) ? status : null;

        // Construct a filter object
        let filter = {};
        if (validStatus) filter.status = validStatus;

        const orders = await Transaction.find(filter, {
            _id: 1,
            ad: 1,
            buyer: 1,
            seller: 1,
            amount: 1,
            fiatAmount: 1,
            status: 1,
            createdAt: 1
        }).populate('ad', '_id')
        .populate('buyer', 'name email')
        .populate('seller', 'name email')
        .skip(skip)
        .limit(limitNumber);

        // Calculate next page
        const totalOrders = await Transaction.countDocuments(filter);
        const hasNextPage = skip + orders.length < totalOrders;
        const nextPage = hasNextPage ? pageNumber + 1 : null;

        return res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully.',
            orders,
            currentPage: pageNumber,
            nextPage,
            totalPages: Math.ceil(totalOrders / limitNumber)
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const GetSwapFees = async (req, res) => {
    try {
        const allowedAdmins = ['super-admin', 'sub-admin', 'admin']

        if (!allowedAdmins.includes(req.admin.role)) return res.status(401).json({success: false, message: 'Not Authorized'});
        
        let swaps = await SwapFee.find({}, {
                _id: 1,
                platformFeePercentage: 1,
                apiPaymentFeePercentage: 1,
                totalFeePercentage: 1,
                description: 1,
                createdAt: 1
            });
        return res.status({
            success: true,
            message: 'Successfully retrieved swapfee',
            swaps
        })
    } catch (error) {
        console.error("Error fetching fees:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const EditSwapFees = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') return res.status(401).json({success: false, message: 'Not Authorized'});

        const { id, platformFeePercentage } = req.body;

        swap = await SwapFee.findById(id);

        if (!swap) return res.status(404).json({'success': false, 'message': 'SwapFee Not found'});

        await SwapFee.findByIdAndUpdate(swap._id, {'platformFeePercentage': platformFeePercentage});

        return res.status({
            success: true,
            message: 'Succesfully editted'
        });
    } catch (error) {
        console.error("Error updating fees:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const GetP2PStructure = async (req, res) => {
    try {
        // Fetch all P2P fee structures
        const p2p = await P2PFeeStructure.find({}, {
            tierOptions: 1,
            standardTier: 1,
            goldTierPercentage: 1,
            platinumTier: 1
        });

        return res.status(200).json({
            success: true,
            message: 'P2P fee structure retrieved successfully.',
            data: p2p
        });
    } catch (error) {
        console.error("Error fetching P2P fees:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const EditP2PStructure = async (req, res) => {
    try {
        // Destructure the fields from the request body
        const { id, tierOptions, standardTier, goldTierPercentage, platinumTier } = req.body;
        
        // Ensure the structure id is provided
        if (!id) {
            return res.status(400).json({ success: false, message: "P2P fee structure ID is required" });
        }
        
        // Build update object. Only include fields that are provided.
        let updateFields = {};
        if (tierOptions) updateFields.tierOptions = tierOptions;
        if (typeof standardTier !== 'undefined') updateFields.standardTier = standardTier;
        if (typeof goldTierPercentage !== 'undefined') updateFields.goldTierPercentage = goldTierPercentage;
        if (typeof platinumTier !== 'undefined') updateFields.platinumTier = platinumTier;
        
        // Always update the updatedAt field
        updateFields.updatedAt = new Date();
        
        // Update the fee structure and return the updated document
        const updatedStructure = await P2PFeeStructure.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );
        
        if (!updatedStructure) {
            return res.status(404).json({ success: false, message: "P2P fee structure not found" });
        }
        
        return res.status(200).json({
            success: true,
            message: "P2P fee structure updated successfully",
            data: updatedStructure
        });
    } catch (error) {
        console.error("Error updating P2P fee structure:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const GetTopMerchants = async (req, res) => {
    try {
        // Use a query parameter for limit (default to 10)
        const limit = parseInt(req.query.limit, 10) || 10;

        // Fetch top merchants sorted by tradingVolume descending
        const topMerchants = await P2PFee.find({})
            .sort({ tradingVolume: -1 })
            .limit(limit)
            .populate('userId', 'name email'); // Populate merchant details from User collection

        return res.status(200).json({
            success: true,
            message: 'Top merchants retrieved successfully.',
            data: topMerchants
        });
    } catch (error) {
        console.error("Error fetching top merchants:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};




module.exports = {
    GetAds,
    EditAd,
    DeleteAd,
    GetP2POrders,
    GetSwapFees,
    EditSwapFees,
    GetP2PStructure,
    EditP2PStructure,
    GetTopMerchants
}



