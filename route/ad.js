let express = require('express');
let router = express.Router();
const { createAd, getAllAds } = require('../controller/ad');
const { tokenRequired } = require('../middleware/auth');

/**
 * @swagger
 * /api/ad/create:
 *   post:
 *     summary: Create a new P2P trading ad
 *     tags: [P2P Ad]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cryptoType:
 *                 type: string
 *                 example: "USDT"
 *               price:
 *                 type: number
 *                 example: 1.0
 *               type:
 *                 type: string
 *                 example: "sell"
 *     responses:
 *       201:
 *         description: Ad created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ad created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109ca"
 *                     merchant:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cb"
 *                     cryptoType:
 *                       type: string
 *                       example: "USDT"
 *                     amount:
 *                       type: number
 *                       example: 1000
 *                     price:
 *                       type: number
 *                       example: 1.0
 *                     type:
 *                       type: string
 *                       example: "sell"
 *                     status:
 *                       type: string
 *                       example: "open"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/create', tokenRequired, createAd);

/**
 * @swagger
 * /api/ad:
 *   get:
 *     summary: Retrieve all P2P trading ads
 *     tags: [P2P Ad]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Ads retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ads retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60d0fe4f5311236168a109ca"
 *                       merchant:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                             example: "merchant123"
 *                           email:
 *                             type: string
 *                             example: "merchant@example.com"
 *                       cryptoType:
 *                         type: string
 *                         example: "USDT"
 *                       price:
 *                         type: number
 *                         example: 1.0
 *                       type:
 *                         type: string
 *                         example: "sell"
 *                       status:
 *                         type: string
 *                         example: "open"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/', tokenRequired, getAllAds);

module.exports = router; 