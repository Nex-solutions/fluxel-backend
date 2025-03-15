// route/referrer.js
const express = require('express');
const router = express.Router();
const { tokenRequired } = require('../middleware/auth');
const { getMyReferrals, getReferralStats, withdrawEarnings } = require('../controller/referrer');

/**
 * @swagger
 * /api/referrer:
 *   get:
 *     summary: Get all referrals for the current user
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all referrals
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', tokenRequired, getMyReferrals);

/**
 * @swagger
 * /api/referrer/stats:
 *   get:
 *     summary: Get referral statistics
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral statistics
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', tokenRequired, getReferralStats);


/**
 * @swagger
 * /api/referrer/withdraw:
 *   post:
 *     summary: Withdraw referral earnings
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coinId:
 *                 type: string
 *                 description: ID of the coin to withdraw in
 *               amount:
 *                 type: number
 *                 description: Amount to withdraw
 *             required:
 *               - coinId
 *               - amount
 *     responses:
 *       200:
 *         description: Withdrawal initiated successfully
 *       400:
 *         description: Invalid request or insufficient balance
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/withdraw', tokenRequired, withdrawEarnings);


module.exports = router;