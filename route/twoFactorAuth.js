const express = require('express');
const router = express.Router();
const { tokenRequired } = require('../middleware/auth');
const { generate2FASecret, verify2FACode, disable2FACode } = require('../controller/twoFactorAuth');
const action = "TWO_FACTOR_AUTH_ACTION";

/**
 * @swagger
 * /api/2fa/generate:
 *   post:
 *     summary: Generate 2FA secret and QR code
 *     tags: [Two Factor Authentication]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: 2FA generation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                   description: Base32 encoded secret key
 *                 qrCode:
 *                   type: string
 *                   description: Data URL of QR code image
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/generate', tokenRequired, generate2FASecret);


/**
 * @swagger
 * /api/2fa/verify:
 *   post:
 *     summary: Verify and enable 2FA for user
 *     tags: [Two Factor Authentication]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Verification code from authenticator app
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 2FA enabled successfully
 *       400:
 *         description: Invalid verification code
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/verify', tokenRequired, verify2FACode);

/**
 * @swagger
 * /api/2fa/disable:
 *   post:
 *     summary: Disable 2FA for user
 *     tags: [Two Factor Authentication]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Verification code from authenticator app
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 2FA disabled successfully
 *       400:
 *         description: Invalid verification code
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/disable', tokenRequired, disable2FACode);

module.exports = router;