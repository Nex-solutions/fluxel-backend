let express = require('express');
let router = express.Router();
const { getAccountBalanceHandler, getBanksListHandler, createRecipientHandler, getUserNairaAccountsHandler, createTransactionHandler, createVirtualAccountHandler, handleWebhook, getTempAccount } = require('../controller/lenco');
const { tokenRequired, transactionTokenRequired } = require('../middleware/auth'); // Assuming you have an authentication middleware
const { validateWebhook } = require('../middleware/lenco');
const { onlyDev } = require('../middleware/onlyDev');
/**
 * @swagger
 * /api/lenco/admin-balance:
 *   get:
 *     summary: Retrieve account balance from Lenco
 *     tags: [Lenco]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Account balance retrieved successfully
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
 *                   example: "Account balance retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       example: 1000.00
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/admin-balance',
    tokenRequired,
    getAccountBalanceHandler);

/**
 * @swagger
 * /api/lenco/banks:
 *   get:
 *     summary: Retrieve list of banks and financial institutions
 *     tags: [Lenco]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Banks list retrieved successfully
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
 *                   example: "Banks list retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       bankName:
 *                         type: string
 *                         example: "Bank of Example"
 *                       bankCode:
 *                         type: string
 *                         example: "123"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/banks',
    tokenRequired,
    getBanksListHandler);


/**
 * @swagger
 * /api/lenco/recipient:
 *   post:
 *     summary: Add withdrawal account for naira
 *     tags: [Lenco]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: "0473035834"
 *               bankCode:
 *                 type: string
 *                 example: "000013"
 *     responses:
 *       201:
 *         description: Recipient created successfully
 *       400:
 *         description: Bad request - Missing parameters
 *       500:
 *         description: Internal server error
 */
router.post('/recipient',
    tokenRequired,
    createRecipientHandler);

/**
 * @swagger
 * /api/lenco/naira-accounts:
 *   get:
 *     summary: Retrieve user's Naira account numbers for withdrawal
 *     tags: [Lenco]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Naira accounts retrieved successfully
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
 *                   example: "Naira accounts retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       recipientId:
 *                         type: string
 *                         example: "88633f16-1f48-4dd6-a691-0052aabdd144"
 *                       accountName:
 *                         type: string
 *                         example: "ADEMOLA KEHINDE PELUMI"
 *                       accountNumber:
 *                         type: string
 *                         example: "0473035834"
 *                       bankCode:
 *                         type: string
 *                         example: "000013"
 *                       bankName:
 *                         type: string
 *                         example: "GUARANTY TRUST BANK"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/naira-accounts', tokenRequired, getUserNairaAccountsHandler);

/**
 * @swagger
 * /api/lenco/transaction:
 *   post:
 *     summary: Initiate a withdrawal transaction
 *     tags: [Lenco]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientId:
 *                 type: string
 *                 example: "88633f16-1f48-4dd6-a691-0052aabdd144"
 *               amount:
 *                 type: number
 *                 example: 1000
 *               sessionId:
 *                 type: string
 *                 example: "8570633f16-1t48-4dd6-a691-00l093dd144"
 *               otp:
 *                 type: string
 *                 example: "89UDB2"
 *     responses:
 *       200:
 *         description: Transaction initiated successfully
 *       400:
 *         description: Bad request - Missing parameters
 *       402:
 *         description: Not found - No session found or session expired, please initiate another session
 *       403:
 *         description: Unauthorized - Invalid OTP Code
 *       404:
 *         description: Recipient not found
 *       500:
 *         description: Internal server error
 */
router.post('/transaction', transactionTokenRequired,
    // onlyDev , 
    createTransactionHandler);

/**
 * @swagger
 * /api/lenco/funding-account:
 *   post:
 *     summary: Create a virtual funding account with BVN verification
 *     tags: [Lenco]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bvn:
 *                 type: string
 *                 example: "22222222222"
 *                 description: Bank Verification Number (BVN)
 *     responses:
 *       201:
 *         description: Virtual account created successfully
 *       400:
 *         description: Bad request - Invalid or missing BVN
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/funding-account', tokenRequired, createVirtualAccountHandler);

// Using Express

// // Define webhook route
// router.post("/",
//     validateWebhook,
//     handleWebhook);


/**
 * @swagger
 * /api/lenco/temp-account:
 *   get:
 *     summary: Get a temporary virtual funding account
 *     tags: [Lenco]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       201:
 *         description: Temporary virtual account created successfully
 *       400:
 *         description: Bad request - Missing account name
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/temp-account', tokenRequired, getTempAccount);


module.exports = router; 