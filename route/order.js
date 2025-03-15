const express = require('express');
const router = express.Router();
const { tokenRequired } = require('../middleware/auth');
const { createOrder, getOrder, updateOrderStatus, addChatMessage, getAllOrders } = require('../controller/order');

/**
 * @swagger
 * /api/order/createorder:
 *   post:
 *     summary: Create a new P2P order
 *     tags: [Order]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               advertisementId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid amount or insufficient available amount
 *       404:
 *         description: Advertisement not found
 *       500:
 *         description: Server error
 */
router.post('/createorder', tokenRequired, createOrder);

/**
 * @swagger
 * /api/order/getorder/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Order]
 *     security:
 *       - fluxelAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       403:
 *         description: Not authorized to view this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/getorder/:id', tokenRequired, getOrder);

/**
 * @swagger
 * /api/order/updateorderstatus/{id}:
 *   put:
 *     summary: Update order status
 *     tags: [Order]
 *     security:
 *       - fluxelAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, completed, cancelled, disputed]
 *               disputeReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       403:
 *         description: Not authorized to update this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.put('/updateorderstatus/:id', tokenRequired, updateOrderStatus);

/**
 * @swagger
 * /api/order/addchatmessage/{id}:
 *   post:
 *     summary: Add chat message to order
 *     tags: [Order]
 *     security:
 *       - fluxelAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat message added successfully
 *       403:
 *         description: Not authorized to chat in this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/addchatmessage/:id', tokenRequired, addChatMessage);


/**
 * @swagger
 * /api/order/allmyorders:
 *   get:
 *     summary: Get all orders for authenticated user
 *     tags: [Order]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       403:
 *         description: Not authorized to view orders
 *       404:
 *         description: Orders not found
 *       500:
 *         description: Server error
 */
router.get('/allmyorders', tokenRequired, getAllOrders);


module.exports = router;
