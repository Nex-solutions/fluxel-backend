// route/auth.js
let express = require('express');
let router = express.Router();
let { getUserProfile, updateUserProfile, addBankAccount, withdrawRequest, getInstantBuyRate, confirmInstantBuy, getAllP2pCryptos, uploadNIN, uploadProofOfAddress, getAllPaymentMethods, addUserP2PPaymentMethod, getUserP2PPaymentMethods, uploadProfilePicture, submitNINVerification, verifyBVN, getKYCStatus, approveOrDenyMerchant, getAllNINSubmissions, updateUserSettings, getUserSettings, merchantRequest, getInstantTradeCoins, createDummyNotifications } = require('../controller/user');
const { tokenRequired, adminTokenRequired } = require('../middleware/auth');
const action = "USER_ACTION";
const { handleFileUpload } = require('../utils/fileUpload');

/**
 * @swagger
 * tags:
 *   name: KYC
 *   description: Know Your Customer verification endpoints
 */

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Retrieve user profile
 *     tags: [Profile]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/profile', tokenRequired, getUserProfile);



// /**
//  * @swagger
//  * /api/user/profile:
//  *   put:
//  *     summary: Update user profile
//  *     tags: [Profile]
//  *     security:
//  *       - fluxelAccessToken: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 description: User's name
//  *     responses:
//  *       200:
//  *         description: Profile updated successfully
//  *       401:
//  *         description: Unauthorized - Invalid or missing token
//  *       500:
//  *         description: Server error
//  */
// router.put('/profile', tokenRequired, updateUserProfile);


/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *               bvn:
 *                 type: string
 *                 description: User's Bank Verification Number (if applicable)
 *               profilePicture:
 *                 type: string
 *                 description: URL of the user's profile picture (if applicable)
 *               preferredLanguage:
 *                 type: string
 *                 description: Preferred language for the user
 *               socialLinks:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of user's social media links
 *               lastLogin:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp of the user's last login
 *               failedLoginAttempts:
 *                 type: integer
 *                 description: Number of failed login attempts
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.put('/profile', tokenRequired, updateUserProfile);





/**
 * @swagger
 * /api/user/add-bank-account:
 *   put:
 *     summary: Add bank account for withdrawal
 *     tags: [Virtual Account]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bankCode:
 *                 type: string
 *                 description: Bank code
 *               accountNumber:
 *                 type: string
 *                 description: Account number
 *               bankName:
 *                 type: string
 *                 description: Bank name
 *     responses:
 *       200:
 *         description: Bank account added successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.put('/add-bank-account', tokenRequired, addBankAccount);

/**
 * @swagger
 * /api/user/withdraw:
 *   post:
 *     summary: Request withdrawal to bank account
 *     tags: [Virtual Account]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to withdraw
 *               narration:
 *                 type: string
 *                 description: Description for the withdrawal (optional)
 *     responses:
 *       200:
 *         description: Withdrawal initiated successfully
 *       400:
 *         description: Invalid request or withdrawal account not found
 *       401:
 *         description: Unauthorized - Invalid or missing token  
 *       500:
 *         description: Server error
 */
router.post('/withdraw', tokenRequired, withdrawRequest);

/**
 * @swagger
 * /api/user/instant-sell-rate:
 *   post:
 *     summary: Instantly swap/sell one token for another
 *     tags: [Token Exchange]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount of tokens to swap/sell
 *                 default: 0.005
 *               from:
 *                 type: string
 *                 description: Symbol of token to swap from (e.g. BTC, ETH, USDT)
 *                 default: BSC
 *               to:
 *                 type: string
 *                 description: Symbol of token to swap to (e.g. BTC, ETH, USDT)
 *                 default: LTC
 *     responses:
 *       200:
 *         description: Token swap rate retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/instant-sell-rate', tokenRequired, getInstantBuyRate);



/**
 * @swagger
 * /api/user/confirm-instant-buy:
 *   post:
 *     summary: Confirm and execute a pending token swap
 *     tags: [Token Exchange]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tradeId
 *             properties:
 *               tradeId:
 *                 type: string
 *                 description: ID of the pending trade to confirm
 *     responses:
 *       200:
 *         description: Token swap executed successfully
 *       400:
 *         description: Invalid trade ID or trade cannot be confirmed
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Trade not found
 *       500:
 *         description: Server error
 */
router.post('/confirm-instant-buy', tokenRequired, confirmInstantBuy);




/**
 * @swagger
 * /api/user/p2pcrypto:
 *   get:
 *     summary: Get all P2P tradable cryptocurrencies
 *     tags: [User]
 *     responses:
 *       200:
 *         description: List of all P2P cryptos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "btc"
 *                       minPrice:
 *                         type: number
 *                         example: 10000
 *                       maxPrice:
 *                         type: number
 *                         example: 50000
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
router.get('/p2pcrypto', getAllP2pCryptos);

/**
 * @swagger
 * /api/user/upload-nin:
 *   post:
 *     summary: Upload NIN document for verification
 *     tags: [User Verification]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nin:
 *                 type: string
 *                 format: binary
 *                 description: NIN document file
 *     responses:
 *       200:
 *         description: NIN uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/upload-nin', tokenRequired, handleFileUpload('nin', {
     maxFiles: 1,
     destination: 'nin',
     maxSize: 5 * 1024 * 1024
}), uploadNIN);

/**
 * @swagger
 * /api/user/upload-proof-of-address:
 *   post:
 *     summary: Upload proof of address document for verification
 *     tags: [User Verification]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               proofOfAddress:
 *                 type: string
 *                 format: binary
 *                 description: Proof of address document file
 *     responses:
 *       200:
 *         description: Proof of address uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/upload-proof-of-address', tokenRequired, handleFileUpload('proofOfAddress', {
     maxFiles: 1,
     destination: 'proofOfAddress',
     maxSize: 5 * 1024 * 1024
}), uploadProofOfAddress);

/**
 * @swagger
 * /api/user/payment-methods:
 *   get:
 *     summary: Retrieve all payment methods
 *     tags: [User]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/payment-methods', tokenRequired, getAllPaymentMethods);

/**
 * @swagger
 * /api/user/p2p-payment-methods:
 *   post:
 *     summary: Add a P2P payment method for the user
 *     tags: [User]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *                 example: "674062ff77ff63942dc78eca"
 *               fields:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 example: 
 *                   BankAccountNumber: "1234567890"
 *                   BankBranch: "Main Branch"
 *                   BankName: "Example Bank"
 *     responses:
 *       200:
 *         description: P2P payment method added successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/p2p-payment-methods', tokenRequired, addUserP2PPaymentMethod);

/**
 * @swagger
 * /api/user/p2p-payment-methods:
 *   get:
 *     summary: Retrieve all P2P payment methods for the user
 *     tags: [User]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: User P2P payment methods retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/p2p-payment-methods', tokenRequired, getUserP2PPaymentMethods);

/**
 * @swagger
 * /api/user/upload-profile-picture:
 *   post:
 *     summary: Upload profile picture
 *     tags: [User]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file type
 *       500:
 *         description: Server error
 */
router.post('/upload-profile-picture', tokenRequired, handleFileUpload('profilePicture', {
     maxFiles: 1,
     destination: 'profilePictures',
     maxSize: 5 * 1024 * 1024
}), uploadProfilePicture);

/**
 * @swagger
 * /api/user/kyc/verify-nin:
 *   post:
 *     summary: Submit NIN for verification
 *     tags: [KYC]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ninNumber
 *               - dateOfBirth
 *               - gender
 *             properties:
 *               ninNumber:
 *                 type: string
 *                 description: National Identity Number
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth (YYYY-MM-DD)
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *                 description: User's gender
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *     responses:
 *       200:
 *         description: NIN verification successful
 *       400:
 *         description: Invalid input or verification failed
 *       500:
 *         description: Server error
 */
router.post('/kyc/verify-nin', tokenRequired, submitNINVerification);

/**
 * @swagger
 * /api/user/kyc/verify-bvn:
 *   post:
 *     summary: Submit BVN for verification
 *     tags: [KYC]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bvnNumber
 *               - dateOfBirth
 *               - gender
 *             properties:
 *               bvnNumber:
 *                 type: string
 *                 description: Bank Verification Number
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth (YYYY-MM-DD)
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *                 description: User's gender
 *     responses:
 *       200:
 *         description: BVN verification successful
 *       400:
 *         description: Invalid input or verification failed
 *       500:
 *         description: Server error
 */
router.post('/kyc/verify-bvn', tokenRequired, verifyBVN);

/**
 * @swagger
 * /api/user/kyc/status:
 *   get:
 *     summary: Get user's KYC status
 *     tags: [KYC]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: KYC status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     kycLevel:
 *                       type: number
 *                       description: "KYC level - 0 None, 1 Basic, 2 Full"
 *                     kycStatus:
 *                       type: string
 *                       enum: [none, pending, verified, rejected]
 *                       description: "Current KYC verification status"
 *                     verifications:
 *                       type: object
 *                       properties:
 *                         nin:
 *                           type: boolean
 *                           description: "NIN verification status"
 *                         bvn:
 *                           type: boolean
 *                           description: "BVN verification status"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/kyc/status', tokenRequired, getKYCStatus);

/**
 * @swagger
 * /api/user/kyc/merchant-approval:
 *   post:
 *     summary: Approve or deny a merchant
 *     tags: [KYC]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approval:
 *                 type: boolean
 *                 description: Approval status
 *     responses:
 *       200:
 *         description: Merchant approval status updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/kyc/merchant-approval', adminTokenRequired, approveOrDenyMerchant);

/**
 * @swagger
 * /api/user/kyc/nin-submissions:
 *   get:
 *     summary: Get all NIN submissions
 *     tags: [ADMIN PRIVILEGE]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: All NIN submissions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/kyc/nin-submissions',
     adminTokenRequired,
     getAllNINSubmissions);


/**
 * @swagger
 * /api/user/settings:
 *   post:
 *     summary: Update user settings
 *     tags: [User]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               toggleSettings:
 *                 type: object
 *                 properties:
 *                   enableAdExpiration:
 *                     type: boolean
 *                     description: Enable ad expiration
 *                   enable2fa:
 *                     type: boolean
 *                     description: Enable 2FA
 *                   googleAuthenticator:
 *                     type: boolean
 *                     description: Enable Google Authenticator
 *                   appLock:
 *                     type: boolean
 *                     description: Enable app lock
 *                   popup:
 *                     type: boolean
 *                     description: Enable popup notifications
 *                   promotionalEmail:
 *                     type: boolean
 *                     description: Enable promotional emails
 *                   eventPush:
 *                     type: boolean
 *                     description: Enable event push notifications
 *                   messages:
 *                     type: boolean
 *                     description: Enable message notifications
 *                   trades:
 *                     type: boolean
 *                     description: Enable trade notifications
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/settings', tokenRequired, updateUserSettings);

/**
 * @swagger
 * /api/user/settings:
 *   get:
 *     summary: Get user settings
 *     tags: [User]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: User settings retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/settings', tokenRequired, getUserSettings);
/**
 * @swagger
 * /api/user/merchant-request:
 *   post:
 *     summary: Submit a merchant request
 *     tags: [User]
 *     security:
 *       - fluxelAccessToken: []
 *     description: >
 *       This endpoint allows an authenticated user to submit a merchant request.
 *       It checks if the user is already a merchant, or if an existing request is
 *       accepted, pending, or failed. If an existing request has failed less than 48
 *       hours ago, an error is returned. Otherwise, a new merchant request is created.
 *     responses:
 *       200: 
 *        description: Merchant request saved successfully.
 * 
 *       406: 
 *        description: Not Acceptable. The user is already a merchant or a similar request exists.
 * 
 *       500: 
 *        description: Internal server error.
 */
router.post('/merchant-request', tokenRequired, merchantRequest);



/**
 * @swagger
 * /api/user/instant-trade-coins:
 *   get:
 *     summary: Get list of coins available for instant trade
 *     tags: [Trading]
 *     security:
 *       - fluxelAccessToken: []
 *     description: >
 *       Returns a filtered list of coins (USDT, BTC, ETH, USDC) with their current prices
 *       and metadata for instant trading functionality.
 *     responses:
 *       200:
 *         description: Coins retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Instant trade coins retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       symbol:
 *                         type: string
 *                         example: "BTC"
 *                       name:
 *                         type: string
 *                         example: "Bitcoin"
 *                       price:
 *                         type: number
 *                         example: 45000.50
 *                       logoUrl:
 *                         type: string
 *                         example: "https://example.com/btc-logo.png"
 *                       coinId:
 *                         type: number
 *                         example: 1
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get('/instant-trade-coins', tokenRequired, getInstantTradeCoins);

/**
 * @swagger
 * /api/user/notifications/dummy:
 *   post:
 *     summary: Create dummy notifications
 *     tags: [User]
 *     description: Creates 3 dummy notifications for the authenticated user
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       201:
 *         description: Dummy notifications created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: string
 *                       content:
 *                         type: string
 *                       type:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
router.post('/notifications/dummy', tokenRequired, createDummyNotifications);


module.exports = router;
