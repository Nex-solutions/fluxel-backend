let express = require('express');
let router = express.Router();
const {
    getCoinListHandler,
    getFiatListHandler,
    checkWithdrawalAddressValidityHandler,
    getWithdrawFeeHandler,
    getSwapCoinListHandler,
    getChainListHandler,
    getAppCoinAssetListHandler,
    getAppCoinAssetHandler,
    getOrCreateAppDepositAddressHandler,
    getAppDepositRecordListHandler,
    applyAppWithdrawToNetworkHandler,
    getWithdrawRecordHandler,
    applyAppWithdrawToCwalletHandler,
    swapCoinsHandler,
    getSwapRecordHandler,
    getSwapRecordListHandler,
    createWallets,
    getUserDeposits,
    handleDepositWebhook,
    getUserBalances,
    assignDummyBalance,
    getTotalBalanceInUsd,
    getUserTopCryptoHoldingsHandler,
} = require('../controller/ccpayment');
const { tokenRequired, transactionTokenRequired } = require('../middleware/auth');
const { onlyDev } = require('../middleware/onlyDev');

/**
 * @swagger
 * /api/ccpayment/coins:
 *   get:
 *     summary: Get list of supported coins from CCPayment
 *     tags: [CCPayment]
 *     responses:
 *       200:
 *         description: List of coins retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/coins', getCoinListHandler);

/**
 * @swagger
 * /api/ccpayment/fiat:
 *   get:
 *     summary: Get list of supported fiat currencies from CCPayment
 *     tags: [CCPayment]
 *     responses:
 *       200:
 *         description: List of fiat currencies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/fiat', getFiatListHandler);

/**
 * @swagger
 * /api/ccpayment/check-withdrawal-address:
 *   post:
 *     summary: Check if a withdrawal address is valid for a given chain
 *     tags: [CCPayment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chain:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Address validity check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/check-withdrawal-address', checkWithdrawalAddressValidityHandler);

/**
 * @swagger
 * /api/ccpayment/withdraw-fee:
 *   post:
 *     summary: Get withdrawal fee for a given coin and chain
 *     tags: [CCPayment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coinId:
 *                 type: number
 *               chain:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal fee retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/withdraw-fee', getWithdrawFeeHandler);

/**
 * @swagger
 * /api/ccpayment/swap-coins:
 *   get:
 *     summary: Get list of supported swap coins from CCPayment
 *     tags: [CCPayment]
 *     responses:
 *       200:
 *         description: List of swap coins retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/swap-coins',
    // onlyDev, 
    getSwapCoinListHandler);

/**
 * @swagger
 * /api/ccpayment/chains:
 *   post:
 *     summary: Get chain list for given chains
 *     tags: [CCPayment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chains:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Chain list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/chains', getChainListHandler);

/**
 * @swagger
 * /api/ccpayment/app-coin-assets:
 *   get:
 *     summary: Get list of app coin assets from CCPayment
 *     tags: [CCPayment]
 *     responses:
 *       200:
 *         description: List of app coin assets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/app-coin-assets', getAppCoinAssetListHandler);

/**
 * @swagger
 * /api/ccpayment/app-coin-asset:
 *   post:
 *     summary: Get details of a specific app coin asset
 *     tags: [CCPayment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               coinId:
 *                 type: number
 *     responses:
 *       200:
 *         description: App coin asset details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/app-coin-asset', getAppCoinAssetHandler);

/**
 * @swagger
 * /api/ccpayment/get-or-create-app-deposit-address:
 *   post:
 *     summary: Get or create an app deposit address
 *     tags: [CCPayment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               chain:
 *                 type: string
 *     responses:
 *       200:
 *         description: App deposit address retrieved or created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/get-or-create-app-deposit-address', tokenRequired, getOrCreateAppDepositAddressHandler);

/**
 * @swagger
 * /api/ccpayment/app-deposit-record-list:
 *   get:
 *     summary: Get list of app deposit records
 *     tags: [CCPayment]
 *     responses:
 *       200:
 *         description: List of app deposit records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/app-deposit-record-list', getAppDepositRecordListHandler);

/**
 * @swagger
 * /api/ccpayment/apply-app-withdraw-to-network:
 *   post:
 *     summary: Apply for app withdrawal to network
 *     tags: [CCPayment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coinId:
 *                 type: number
 *               address:
 *                 type: string
 *               amount:
 *                 type: number
 *               chain:
 *                 type: string
 *               memo:
 *                 type: string
 *     responses:
 *       200:
 *         description: App withdrawal applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/apply-app-withdraw-to-network',
    // onlyDev, 
    transactionTokenRequired, applyAppWithdrawToNetworkHandler);

/**
 * @swagger
 * /api/ccpayment/withdraw-record:
 *   post:
 *     summary: Get withdrawal record details
 *     tags: [CCPayment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal record details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/withdraw-record', getWithdrawRecordHandler);

/**
 * @swagger
 * /api/ccpayment/apply-app-withdraw-to-cwallet:
 *   post:
 *     summary: Apply for app withdrawal to cwallet
 *     tags: [CCPayment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coinId:
 *                 type: number
 *               cwalletUser:
 *                 type: string
 *               amount:
 *                 type: string
 *     responses:
 *       200:
 *         description: App withdrawal to cwallet applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/apply-app-withdraw-to-cwallet',
    // onlyDev, 
    applyAppWithdrawToCwalletHandler);

/**
 * @swagger
 * /api/ccpayment/swap:
 *   post:
 *     summary: Swap coins between supported currencies
 *     tags: [CCPayment]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coinIdIn:
 *                 type: number
 *               amountIn:
 *                 type: string
 *               coinIdOut:
 *                 type: number
 *     responses:
 *       200:
 *         description: Coins swapped successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/swap', tokenRequired,
    // onlyDev, 
    swapCoinsHandler);

/**
 * @swagger
 * /api/ccpayment/get-swap-record:
 *   post:
 *     summary: Get details of a swap transaction
 *     tags: [CCPayment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recordId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Swap record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/get-swap-record', getSwapRecordHandler);

/**
 * @swagger
 * /api/ccpayment/get-swap-record-list:
 *   get:
 *     summary: Get list of swap transactions
 *     tags: [CCPayment]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Swap record list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/get-swap-record-list', tokenRequired, getSwapRecordListHandler);

/**
 * @swagger
 * /api/ccpayment/create-wallets:
 *   post:
 *     summary: Create a new wallet for the user
 *     tags: [CCPayment]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Wallet created successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/create-wallets', tokenRequired, createWallets);

/**
 * @swagger
 * /api/ccpayment/user-deposits:
 *   get:
 *     summary: Retrieve all deposit addresses for the user
 *     tags: [CCPayment]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: User deposits retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/user-deposits', tokenRequired, getUserDeposits);

/**
 * @swagger
 * /api/ccpayment/withdraw:
 *   post:
 *     summary: Apply for a withdrawal to the network
 *     tags: [CCPayment]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coinId:
 *                 type: number
 *               address:
 *                 type: string
 *               amount:
 *                 type: number
 *               chain:
 *                 type: string
 *               memo:
 *                 type: string
 *               sessionId:
 *                 type: string
 *                 description: This is the session ID initiated for the withdrawal
 *               otp:
 *                 type: string
 *                 description: This is the otp for the withdrawal attempt
 *     responses:
 *       200:
 *         description: Withdrawal applied successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       402:
 *         description: Not found - No session found or session expired, please initiate another session
 *       403:
 *         description: Unauthorized - Invalid OTP Code
 *       500:
 *         description: Server error
 */
router.post('/withdraw', transactionTokenRequired,
    // onlyDev,
    applyAppWithdrawToNetworkHandler);

/**
 * @swagger
 * /api/ccpayment/deposit-webhook:
 *   post:
 *     summary: Handle deposit webhook from CCPayment
 *     tags: [CCPayment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               chain:
 *                 type: string
 *               address:
 *                 type: string
 *               amount:
 *                 type: number
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Deposit processed successfully
 *       400:
 *         description: Invalid webhook data
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.post('/deposit-webhook', handleDepositWebhook);

/**
 * @swagger
 * /api/ccpayment/user-balances:
 *   get:
 *     summary: Retrieve all balances for the user
 *     tags: [CCPayment]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: User balances retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/user-balances', tokenRequired, getUserBalances);

/**
 * @swagger
 * /api/ccpayment/assign-dummy-balance:
 *   post:
 *     summary: Assign dummy balances to the user if they have no balances
 *     tags: [CCPayment - development]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Dummy balances assigned successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/assign-dummy-balance', tokenRequired, assignDummyBalance);

/**
 * @swagger
 * /api/ccpayment/total-balance-usd:
 *   get:
 *     summary: Retrieve the total balance in USD for the user
 *     tags: [CCPayment]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Total balance in USD retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/total-balance-usd', tokenRequired, getTotalBalanceInUsd);

/**
 * @swagger
 * /api/ccpayment/user-top-crypto-holdings:
 *   get:
 *     summary: Retrieve the user's top cryptocurrency holdings in USD
 *     tags: [CCPayment]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: User top cryptocurrency holdings retrieved successfully in USD
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/user-top-crypto-holdings', tokenRequired, getUserTopCryptoHoldingsHandler);

module.exports = router;