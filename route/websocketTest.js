// route/websocketTest.js
const express = require('express');
const router = express.Router();
const WebSocketTestController = require('../controller/websocket');
const { tokenRequired } = require('../middleware/auth');

/**
 * @swagger
 * /api/websocket/test:
 *   get:
 *     summary: Test WebSocket connection and return token
 *     tags: [WebSocket]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Successful WebSocket connection test with token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 url:
 *                   type: string
 *                   description: WebSocket connection URL
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 message:
 *                   type: string
 *                   example: Socket.IO connection established
 *       500:
 *         description: WebSocket connection test failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 */
router.get('/test', tokenRequired, async (req, res) => {
    try {
        const result = await WebSocketTestController.testWebSocketConnection(req.user._id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'WebSocket connection test failed',
            error: error.toString()
        });
    }
});

/**
 * @swagger
 * /api/websocket/test-url:
 *   get:
 *     summary: Generate WebSocket test URL
 *     tags: [WebSocket]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Generated WebSocket connection URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: WebSocket connection URL
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 */
router.get('/test-url', tokenRequired, (req, res) => {
    const { url, token } = WebSocketTestController.generateWebSocketTestUrl(req.user._id); // Changed to _id
    res.status(200).json({ url, token });
});

module.exports = router;