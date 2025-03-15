let express = require('express');
let router = express.Router();
const { calculateP2PFee } = require('../controller/p2pFee');
const { tokenRequired } = require('../middleware/auth'); // Ensure authentication middleware is used

/**
 * @swagger
 * /api/p2p/fee:
 *   post:
 *     summary: Calculate P2P fees for a transaction
 *     tags: [P2P]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: P2P fee calculated successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: P2P fee details not found for user
 *       500:
 *         description: Server error
 */
router.post('/fee', tokenRequired, calculateP2PFee);

module.exports = router; 