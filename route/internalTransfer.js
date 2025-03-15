let express = require('express');
let router = express.Router();
const { transferCoins } = require('../controller/internalTransfer');
const { tokenRequired } = require('../middleware/auth');
const { onlyDev } = require('../middleware/onlyDev');

/**
 * @swagger
 * /api/internalTransfer:
 *   post:
 *     summary: Transfer coins internally between users
 *     tags: [Internal Transfer]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientUid:
 *                 type: string
 *                 example: "user123"
 *               recipientEmail:
 *                 type: string
 *                 example: "user@example.com"
 *               coinId:
 *                 type: number
 *                 example: 1
 *               amount:
 *                 type: number
 *                 example: 100
 *     responses:
 *       200:
 *         description: Transfer completed successfully
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
 *                   example: "Transfer completed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cc"
 *                     sender:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cb"
 *                     recipient:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cd"
 *                     coinId:
 *                       type: number
 *                       example: 1
 *                     amount:
 *                       type: number
 *                       example: 100
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Recipient not found
 *       500:
 *         description: Internal server error
 */
router.post('/', tokenRequired, onlyDev , transferCoins);

module.exports = router;