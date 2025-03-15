let express = require('express');
let router = express.Router();
const { joinAd, releaseCoins, getTransactions, markPaymentSent, GetAllTransactions } = require('../controller/transaction');
const { tokenRequired } = require('../middleware/auth');

/**
 * @swagger
 * /api/transaction/join:
 *   post:
 *     summary: Join a P2P trading ad
 *     tags: [P2P Transaction]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adId:
 *                 type: string
 *                 example: "60d0fe4f5311236168a109ca"
 *               cryptoAmount:
 *                 type: number
 *                 example: 500
 *     responses:
 *       201:
 *         description: Joined ad successfully, amount held in escrow
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
 *                   example: "Joined ad successfully, amount held in escrow"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cc"
 *                     ad:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109ca"
 *                     buyer:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cb"
 *                     seller:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cd"
 *                     amount:
 *                       type: number
 *                       example: 500
 *                     fiatAmount:
 *                       type: number
 *                       example: 5000
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     escrow:
 *                       type: number
 *                       example: 500
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Ad not found or not open
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/transaction/release:
 *   post:
 *     summary: Release coins from escrow
 *     tags: [P2P Transaction]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *                 example: "60d0fe4f5311236168a109cc"
 *     responses:
 *       200:
 *         description: Coins released successfully
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
 *                   example: "Coins released successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cc"
 *                     ad:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109ca"
 *                     buyer:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cb"
 *                     seller:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cd"
 *                     amount:
 *                       type: number
 *                       example: 500
 *                     fiatAmount:
 *                       type: number
 *                       example: 5000
 *                     status:
 *                       type: string
 *                       example: "completed"
 *                     escrow:
 *                       type: number
 *                       example: 500
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Transaction not found or already completed
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/transaction:
 *   get:
 *     summary: Retrieve all transactions
 *     tags: [P2P Transaction]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
 *                   example: "Transactions retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60d0fe4f5311236168a109cc"
 *                       ad:
 *                         type: object
 *                         properties:
 *                           cryptoType:
 *                             type: string
 *                             example: "USDT"
 *                           price:
 *                             type: number
 *                             example: 1.0
 *                           type:
 *                             type: string
 *                             example: "sell"
 *                       buyer:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
 *                       seller:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Jane Doe"
 *                           email:
 *                             type: string
 *                             example: "jane@example.com"
 *                       amount:
 *                         type: number
 *                         example: 500
 *                       fiatAmount:
 *                         type: number
 *                         example: 5000
 *                       status:
 *                         type: string
 *                         example: "completed"
 *                       escrow:
 *                         type: number
 *                         example: 500
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

/**
 * @swagger
 * /api/transaction/payment-sent:
 *   post:
 *     summary: Mark payment as sent for a transaction
 *     tags: [P2P Transaction]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *                 example: "60d0fe4f5311236168a109cc"
 *     responses:
 *       200:
 *         description: Payment marked as sent
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
 *                   example: "Payment marked as sent"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cc"
 *                     status:
 *                       type: string
 *                       example: "payment_sent"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only the buyer can mark payment as sent
 *       404:
 *         description: Transaction not found or not in a state to mark payment as sent
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/transaction/history/all:
 *   get:
 *     summary: Retrieve all transactions
 *     description: Fetches all transactions from different categories including P2P, Crypto Withdrawals, Internal Transfers, Crypto Transactions, Naira Transactions, and Referral Transactions.
 *     tags:
 *       - Transactions
 *     responses:
 *       200:
 *         description: Successfully retrieved all transactions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p2p:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/P2PTransaction'
 *                 crypto_withdrawal:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CryptoWithdrawal'
 *                 internal_transfer:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InternalTransfer'
 *                 crypto_transaction:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CryptoTransaction'
 *                 naira_transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NairaTransaction'
 *                 referral_transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReferralTransaction'
 *       500:
 *         description: Server error while fetching transactions.
 */

router.post('/join', tokenRequired, joinAd);
router.post('/release', tokenRequired, releaseCoins);
router.get('/', tokenRequired, getTransactions);
router.post('/payment-sent', tokenRequired, markPaymentSent);
router.get('/history/all', tokenRequired, GetAllTransactions);
module.exports = router;