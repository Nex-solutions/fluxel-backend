const Order = require('../model/order');
const Advertisement = require('../model/advertisement');
const User = require('../model/user');

/**
 * Create a new P2P order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createOrder = async (req, res) => {
    try {
        const { advertisementId, amount } = req.body;
        const buyer = req.user;

        // Find advertisement
        const advertisement = await Advertisement.findById(advertisementId);
        if (!advertisement) {
            return res.status(404).json({
                status: false,
                message: 'Advertisement not found'
            });
        }

        // Validate amount is within min/max range
        if (amount < advertisement.minAmount || amount > advertisement.maxAmount) {
            return res.status(400).json({
                status: false,
                message: `Amount must be between ${advertisement.minAmount} and ${advertisement.maxAmount} USD`
            });
        }

        // Check if advertisement has sufficient available amount
        if (amount > advertisement.availableAmount) {
            return res.status(400).json({
                status: false,
                message: 'Insufficient available amount in advertisement'
            });
        }

        // Calculate crypto amount based on price
        const cryptoAmount = amount / advertisement.price;

        // Set buyer/seller based on advertisement type
        const seller = advertisement.type === 'sell' ? advertisement.merchant : buyer._id;
        const orderBuyer = advertisement.type === 'buy' ? advertisement.merchant : buyer._id;


        // Calculate expiry time based on response time
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + advertisement.responseTime);

        // Create new order
        const order = new Order({
            advertisement: advertisementId,
            buyer: orderBuyer,
            seller,
            amount,
            cryptoAmount,
            coinId: advertisement.coinId,
            price: advertisement.price,
            terms: advertisement.terms,
            expiresAt
        });

        await order.save();

        // Update advertisement stats
        advertisement.orders.push(order._id);
        advertisement.totalOrders += 1;
        advertisement.availableAmount -= amount;
        await advertisement.save();

        return res.status(201).json({
            status: true,
            message: 'Order created successfully',
            data: order
        });

    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Get order by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const order = await Order.findById(id)
            .populate('advertisement')
            .populate('buyer', 'username email')
            .populate('seller', 'username email');

        if (!order) {
            return res.status(404).json({
                status: false,
                message: 'Order not found'
            });
        }

        // Verify user is buyer or seller
        if (order.buyer._id.toString() !== user._id.toString() &&
            order.seller._id.toString() !== user._id.toString()) {
            return res.status(403).json({
                status: false,
                message: 'Not authorized to view this order'
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Order retrieved successfully',
            data: order
        });

    } catch (error) {
        console.error('Error getting order:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
};


const getAllOrders = async (req, res) => {
    try {
        let user = req.user;



        const orders = await Order.find({
            $or: [
                { buyer: user._id },
                { seller: user._id }
            ]
        })
            .populate('advertisement')
            .populate('buyer', 'username email')
            .populate('seller', 'username email');


        if (!orders) {
            return res.status(404).json({
                status: true,
                message: 'Order not found',
                data: []
            });
        }

        const filteredOrders = orders.filter(order => {
            return order.buyer?._id?.toString() === user?._id?.toString() ||
                order.seller?._id?.toString() === user?._id?.toString();
        });

        return res.status(200).json({
            status: true,
            message: 'Order retrieved successfully',
            data: filteredOrders
        });

    } catch (error) {
        console.error('Error getting order:', error.message);
        return res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Update order status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, disputeReason } = req.body;
        const user = req.user;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                status: false,
                message: 'Order not found'
            });
        }

        // Verify user is buyer or seller
        if (order.buyer.toString() !== user._id.toString() &&
            order.seller.toString() !== user._id.toString()) {
            return res.status(403).json({
                status: false,
                message: 'Not authorized to update this order'
            });
        }

        // Update status and related timestamps
        order.status = status;
        if (status === 'processing') order.processingAt = Date.now();
        if (status === 'completed') order.completedAt = Date.now();
        if (status === 'cancelled') order.cancelledAt = Date.now();
        if (status === 'disputed') {
            order.disputedAt = Date.now();
            order.disputeReason = disputeReason;
        }

        await order.save();

        // Update advertisement stats if order is completed/cancelled/disputed
        if (['completed', 'cancelled', 'disputed'].includes(status)) {
            const advertisement = await Advertisement.findById(order.advertisement);
            if (status === 'completed') advertisement.completedOrders += 1;
            if (status === 'cancelled') advertisement.cancelledOrders += 1;
            if (status === 'disputed') advertisement.disputedOrders += 1;

            // Update success rate
            advertisement.successRate = (advertisement.completedOrders / advertisement.totalOrders) * 100;
            await advertisement.save();
        }

        return res.status(200).json({
            status: true,
            message: 'Order status updated successfully',
            data: order
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Add chat message to order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addChatMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const user = req.user;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                status: false,
                message: 'Order not found'
            });
        }

        // Verify user is buyer or seller
        if (order.buyer.toString() !== user._id.toString() &&
            order.seller.toString() !== user._id.toString()) {
            return res.status(403).json({
                status: false,
                message: 'Not authorized to chat in this order'
            });
        }

        // Add chat message
        order.chatMessages.push({
            sender: user._id,
            message
        });

        await order.save();

        return res.status(200).json({
            status: true,
            message: 'Chat message added successfully',
            data: order.chatMessages[order.chatMessages.length - 1]
        });

    } catch (error) {
        console.error('Error adding chat message:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    createOrder,
    getOrder,
    updateOrderStatus,
    addChatMessage,
    getAllOrders,
};
