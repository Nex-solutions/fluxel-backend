// route/auth.js
let express = require('express');
let router = express.Router();
let { registerAdminUser, loginAdminUser, verifyAdminOTP, resendAdminOTP, 
      GetAdminProfile } = require('../controller/admin-auth');
let { GetUsers, UpdateUserProfile, GetMerchantRequests, UpdateMerchantRequest, UpdateAdminManagement, GetAdmins } = require('../controller/admin-user-control');
let { GetAds, EditAd, DeleteAd, GetP2POrders, EditSwapFees, EditP2PStructure,
      GetP2PStructure, GetSwapFees, GetTopMerchants,  } = require('../controller/admin-p2p');
let { CreateNote, UpdateNote, GetAllNotes, GetNoteById, DeleteNote } = require('../controller/admin-support');
let { GetAllBalances, GetNairaTransactions, GetCryptoTransactions, UpdateFunds } = require('../controller/admin-transaction');
const { adminTokenRequired, superAdminTokenRequired, 
      customerSupportTokenRequired, subAdminTokenRequired } = require('../middleware/auth');
// const admin = require('../model/admin');

/**
 * @swagger
 * /api/admin/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists or invalid data
 */
router.post('/auth/register', registerAdminUser);

/**
 * @swagger
 * /api/admin/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and complete user registration
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object   
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid OTP
 *       500:
 *         description: Server error
 */
router.post('/auth/verify-otp', verifyAdminOTP);

/**
 * @swagger
 * /api/admin/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Invalid credentials
 */
router.post('/auth/login',
      // trackActivity('LOGIN_ACTION'),
      loginAdminUser);

/**
 * @swagger
 * /api/admin/auth/resend-otp:
 *   post:
 *     summary: Resend OTP to a user's email
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: No OTP found for this email
 *       500:
 *         description: Server error
 */
router.post('/auth/resend-otp', resendAdminOTP);


/**
 * @swagger
 * /api/admin/profile:
 *   get:
 *     summary: Retrieve the profile of the logged-in admin
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully.
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
 *                   example: "Admin profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60a7f6c2c6a1a2c3d4e5f678"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "admin@example.com"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                     uid:
 *                       type: string
 *                       example: "unique-admin-id"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Admin not found.
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
 *                   example: "Admin not found"
 *       500:
 *         description: Server error.
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
 *                   example: "Server error"
 */
router.get('/profile', adminTokenRequired, GetAdminProfile);


/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Retrieve All users
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of users to return per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name (case-insensitive)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter users by type (e.g., "merchant", "user")
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter users by suspension status (true = suspended, false = active)
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter users by verification status (true = verified, false = not verified)
 *     responses:
 *       200:
 *         description: All Users profile retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/users', adminTokenRequired, GetUsers);



/**
 * @swagger
 * /api/admin/users:
 *   put:
 *     summary: Update user profile
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                id:
 *                  type: string
 *                name:
 *                  type: string
 *                phone:
 *                  type: string
 *                isMerchant:
 *                  type: boolean
 *                  description: Use only after a user applied to be a Merchant and has passed all checks and now successfully qualifies to be a merchant
 *                isLocked:
 *                  type: boolean
 *                  description: This is used when an admin wants to suspend a user indefinetely for some malicious activities
 *               
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
 *                     phone:
 *                       type: string
 *                     isMerchant:
 *                       type: boolean
 *                       description: Use only after a user applied to be a Merchant and has passed all checks and now successfully qualifies to be a merchant
 *                     isLocked:
 *                       type: boolean
 *                       description: This is used when an admin wants to suspend a user indefinetely for some malicious activities
 *       400:
 *         description: Missing the user id in the body
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User was not found
 *       500:
 *         description: Server error
 */
router.put('/users', adminTokenRequired, UpdateUserProfile);

/**
 * @swagger
 * /api/admin/p2p/ads:
 *   get:
 *     summary: Retrieve all ads
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Page number for pagination (default: 1)."
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Number of ads per page (default: 10)."
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: "Filter by ad type (buy or sell)."
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: "Filter by ad status (open or close)."
 *     responses:
 *       200:
 *         description: Ads retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 ads:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       merchant:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       cryptoType:
 *                         type: string
 *                       coinId:
 *                         type: integer
 *                       price:
 *                         type: number
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *       500:
 *         description: Server error.
 */

router.get('/p2p/ads', adminTokenRequired, GetAds);


/**
 * @swagger
 * /api/admin/p2p/ads:
 *   put:
 *     summary: Edit an ad
 *     description: Update the status of an ad.
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID of the ad.
 *               status:
 *                 type: string
 *                 description: The new status of the ad (open or close).
 *     responses:
 *       200:
 *         description: Ad edited successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Required fields missing.
 *       404:
 *         description: Ad not found.
 *       500:
 *         description: Server error.
 */
router.put('/p2p/ads', adminTokenRequired, EditAd);

/**
 * @swagger
 * /api/admin/p2p/ads:
 *   delete:
 *     summary: Delete an ad
 *     description: Remove an ad by its ID.
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the ad to delete.
 *     responses:
 *       200:
 *         description: Ad deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Ad not found.
 *       500:
 *         description: Server error.
 */

router.delete('/p2p/ads', adminTokenRequired, DeleteAd);

/**
 * @swagger
 * /api/admin/p2p/orders:
 *   get:
 *     summary: Retrieve all p2p orders
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Page number for pagination (default: 1)."
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "Number of orders per page (default: 10)."
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: "Filter by orders status (pending, payment_sent, completed or cancelled)."
 *     responses:
 *       200:
 *         description: Orders retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       ad:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                       buyer:
 *                         type: object
 *                         properties:
 *                           _id:
 *                              type: string
 *                           name:
 *                              type: string
 *                           email:
 *                              type: string
 *                       seller:
 *                         type: object
 *                         properties:
 *                           _id:
 *                              type: string
 *                           name:
 *                              type: string
 *                           email:
 *                              type: string
 *                       amount:
 *                         type: integer
 *                       fiatAmount:
 *                         type: number
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: datetime
 *       500:
 *         description: Server error.
 */

router.get('/p2p/orders', adminTokenRequired, GetP2POrders);


/**
 * @swagger
 * /api/admin/p2p/swapfees:
 *   get:
 *     summary: Retrieve swap fee details
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Successfully retrieved swap fee details.
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
 *                   example: Successfully retrieved swapfee
 *                 swaps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       platformFeePercentage:
 *                         type: number
 *                       apiPaymentFeePercentage:
 *                         type: number
 *                       totalFeePercentage:
 *                         type: number
 *                       description:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Not Authorized.
 *       500:
 *         description: Server error.
 */
router.get('/p2p/swapfees', adminTokenRequired, GetSwapFees);

/**
 * @swagger
 * /api/admin/p2p/swapfees:
 *   put:
 *     summary: Edit swap fee details
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: SwapFee document ID.
 *               platformFeePercentage:
 *                 type: number
 *                 description: New platform fee percentage.
 *     responses:
 *       200:
 *         description: Successfully edited swap fee details.
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
 *                   example: Succesfully editted
 *       401:
 *         description: Not Authorized.
 *       404:
 *         description: SwapFee not found.
 *       500:
 *         description: Server error.
 */
router.get('/p2p/swapfees', adminTokenRequired, EditSwapFees);


/**
 * @swagger
 * /api/admin/p2p/fee-structure:
 *   get:
 *     summary: Retrieve P2P fee structure
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: P2P fee structure retrieved successfully.
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
 *                   example: P2P fee structure retrieved successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       tierOptions:
 *                         type: string
 *                       standardTier:
 *                         type: number
 *                       goldTierPercentage:
 *                         type: number
 *                       platinumTier:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error.
 */
router.get('/p2p/fee-structure', adminTokenRequired, GetP2PStructure);


/**
 * @swagger
 * /api/admin/p2p/fee-structure:
 *   put:
 *     summary: Edit P2P fee structure
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID of the P2P fee structure document.
 *               tierOptions:
 *                 type: string
 *                 description: Tier options (Standard, Gold, Platinum).
 *               standardTier:
 *                 type: number
 *                 description: Standard tier fee percentage.
 *               goldTierPercentage:
 *                 type: number
 *                 description: Gold tier fee percentage.
 *               platinumTier:
 *                 type: number
 *                 description: Platinum tier fee percentage.
 *     responses:
 *       200:
 *         description: P2P fee structure updated successfully.
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
 *                   example: P2P fee structure updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     tierOptions:
 *                       type: string
 *                     standardTier:
 *                       type: number
 *                     goldTierPercentage:
 *                       type: number
 *                     platinumTier:
 *                       type: number
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: P2P fee structure ID is required.
 *       404:
 *         description: P2P fee structure not found.
 *       500:
 *         description: Server error.
 */
router.get('/p2p/fee-structure', adminTokenRequired, EditP2PStructure);


/**
 * @swagger
 * /api/admin/p2p/top-merchants:
 *   get:
 *     summary: Retrieve top merchants by trading volume
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Number of top merchants to retrieve.
 *     responses:
 *       200:
 *         description: Top merchants retrieved successfully.
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
 *                   example: Top merchants retrieved successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       tradingVolume:
 *                         type: number
 *                       merchantTier:
 *                         type: string
 *                       userId:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *       500:
 *         description: Server error.
 */
router.get('/p2p/top-merchants', adminTokenRequired, GetTopMerchants);


/**
 * @swagger
 * /api/admin/transactions/balance:
 *   get:
 *     summary: Retrieve all balance records
 *     tags: [Admin]
 *     description: Fetches all balance records, including user details (name and email).
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Page number for pagination (default: 1)."
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "Number of orders per page (default: 10)."
 *       - in: query
 *         name: coinId
 *         schema:
 *           type: string
*       - in: query
 *         name: coinName
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Balances retrieved successfully.
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
 *                   example: Balances retrieved successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60a7f6c2c6a1a2c3d4e5f678"
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60a7f6c2c6a1a2c3d4e5f679"
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
 *                       coinId:
 *                         type: number
 *                         example: 1
 *                       coinName:
 *                         type: string
 *                         example: "Bitcoin"
 *                       balance:
 *                         type: number
 *                         example: 100.5
 *                       lockedBalance:
 *                         type: number
 *                         example: 25.0
 *                       logoUrl:
 *                         type: string
 *                         example: "https://example.com/logo.png"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-03-01T12:34:56.789Z"
 *       500:
 *         description: Server error.
 */
router.get('/transactions/balance', adminTokenRequired, GetAllBalances);

/**
 * @swagger
 * /api/admin/transactions/balance/naira:
 *   get:
 *     summary: Retrieve all Naira transactions
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     description: Fetches all naira transaction records and populates the user details (name and email).
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Page number for pagination (default: 1)."
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "Number of orders per page (default: 10)."
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: "Example ('debit')"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: "Example ('pending', 'success', 'failed')"
 *       - in: query
 *         name: bankCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: bankName
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Naira transactions retrieved successfully.
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
 *                   example: "Naira transactions retrieved successfully."
 *                 nairaTrx:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60a7f6c2c6a1a2c3d4e5f679"
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
 *                       coinId:
 *                         type: number
 *                         example: 1
 *                       coinName:
 *                         type: string
 *                         example: "Naira"
 *                       balance:
 *                         type: number
 *                         example: 1000
 *                       lockedBalance:
 *                         type: number
 *                         example: 100
 *                       logoUrl:
 *                         type: string
 *                         example: "https://example.com/logo.png"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-03-01T12:34:56.789Z"
 *       500:
 *         description: Server error.
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
 *                   example: "Server error"
 */

router.get('/transactions/balance/naira', adminTokenRequired, GetNairaTransactions);


/**
 * @swagger
 * /api/admin/transactions/balance/crypto:
 *   get:
 *     summary: Retrieve all crypto transactions
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     description: Fetches all crypto withdrawal transaction records and populates the user details (name and email).
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Page number for pagination (default: 1)."
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "Number of orders per page (default: 10)."
 *       - in: query
 *         name: coinId
 *         schema:
 *           type: string
 *           default: 1111
 *       - in: query
 *         name: chain
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Crypto transactions retrieved successfully.
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
 *                   example: "Crypto transactions retrieved successfully."
 *                 cryptoTrx:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60a7f6c2c6a1a2c3d4e5f679"
 *                           name:
 *                             type: string
 *                             example: "Jane Doe"
 *                           email:
 *                             type: string
 *                             example: "jane@example.com"
 *       500:
 *         description: Server error.
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
 *                   example: "Server error"
 */
router.get('/transactions/balance/crypto', adminTokenRequired, GetCryptoTransactions);

/**
 * @swagger
 * /api/admin/merchant-requests:
 *   get:
 *     summary: Retrieve all merchant requests
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     description: Admin endpoint to retrieve all merchant requests. This returns the list of requests with populated user details (name and email).
 *     responses:
 *       200:
 *         description: Merchant requests retrieved successfully.
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
 *                   example: "Merchant requests retrieved successfully."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "6123456789abcdef01234567"
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60a7f6c2c6a1a2c3d4e5f679"
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
 *                       status:
 *                         type: string
 *                         example: "pending"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error.
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
 *                   example: "Server error"
 */
router.get('/merchant-requests', adminTokenRequired, GetMerchantRequests);

/**
 * @swagger
 * /api/admin/merchant-requests:
 *   put:
 *     summary: Update a merchant request status
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     description: Admin endpoint to update the status of a merchant request and update its updatedAt field.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Merchant request ID.
 *               status:
 *                 type: string
 *                 enum: [accepted, declined, pending]
 *                 description: New status for the merchant request.
 *             example:
 *               id: "6123456789abcdef01234567"
 *               status: "accepted"
 *     responses:
 *       200:
 *         description: Merchant request updated successfully.
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
 *                   example: "Merchant request updated successfully."
 *       400:
 *         description: Bad Request. Missing or invalid parameters.
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
 *                   example: "Request id and status are required"
 *       404:
 *         description: Merchant request not found.
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
 *                   example: "Merchant request not found"
 *       500:
 *         description: Server error.
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
 *                   example: "Server error"
 */
router.put('/merchant-requests', adminTokenRequired, UpdateMerchantRequest);


/**
 * @swagger
 * /api/admin/notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Customer Support]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *             example:
 *               note: "This is a note by the admin."
 *     responses:
 *       201:
 *         description: Note created successfully.
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
 *                   example: "Note created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     admin:
 *                       type: string
 *                     note:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request, missing note text.
 *       500:
 *         description: Server error.
 */
router.post('/notes', customerSupportTokenRequired, CreateNote);


/**
 * @swagger
 * /api/admin/notes:
 *   get:
 *     summary: Get all notes
 *     tags: [Customer Support]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: Notes retrieved successfully
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
 *                   example: "Notes retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     admin:
 *                       type: string
 *                     note:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request, missing note text.
 *       500:
 *         description: Server error.
 */
router.get('/notes', customerSupportTokenRequired, GetAllNotes);


/**
 * @swagger
 * /api/admin/notes/{id}:
 *   get:
 *     summary: Retrieve a single note by ID
 *     tags: [Customer Support]
 *     security:
 *       - fluxelAccessToken: []
 *     description: Returns the note with the specified ID if it belongs to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The note ID.
 *     responses:
 *       200:
 *         description: Note retrieved successfully.
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
 *                   example: "Note retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     admin:
 *                       type: string
 *                     note:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Note not found.
 *       500:
 *         description: Server error.
 */
router.get('/notes/:id', customerSupportTokenRequired, GetNoteById);


/**
 * @swagger
 * /api/admin/notes/{id}:
 *   put:
 *     summary: Update a note by ID
 *     tags: [Customer Support]
 *     security:
 *       - fluxelAccessToken: []
 *     description: Updates the note text and refreshes the updatedAt field.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The note ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *             example:
 *               note: "Updated note content."
 *     responses:
 *       200:
 *         description: Note updated successfully.
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
 *                   example: "Note updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     admin:
 *                       type: string
 *                     note:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request, missing note text.
 *       404:
 *         description: Note not found.
 *       500:
 *         description: Server error.
 */
router.put('/notes/:id', customerSupportTokenRequired, UpdateNote);


/**
 * @swagger
 * /api/admin/notes/{id}:
 *   delete:
 *     summary: Delete a note by ID
 *     tags: [Customer Support]
 *     security:
 *       - fluxelAccessToken: []
 *     description: Deletes the note with the specified ID if it belongs to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The note ID.
 *     responses:
 *       200:
 *         description: Note deleted successfully.
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
 *                   example: "Note deleted successfully"
 *       404:
 *         description: Note not found.
 *       500:
 *         description: Server error.
 */
router.delete('/notes/:id', customerSupportTokenRequired, DeleteNote);

// /**
//  * @swagger
//  * /api/admin/update-funds:
//  *   post:
//  *     summary: Update user funds for a specified coin wallet
//  *     tags: [Admin]
//  *     security:
//  *       - fluxelAccessToken: []
//  *     description: >
//  *       Updates the balance of a user’s wallet for a specified coin.
//  *       The coinId must be either 1111 (Naira) or 1280 (Crypto).
//  *       The endpoint updates the user's balance and records the transaction history.
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               coinId:
//  *                 type: number
//  *                 description: "Coin ID. Must be either 1111 for Naira or 1280 for Crypto."
//  *                 example: 1111
//  *               userId:
//  *                 type: string
//  *                 description: "The ID of the user whose funds are being updated."
//  *                 example: "60a7f6c2c6a1a2c3d4e5f679"
//  *               amount:
//  *                 type: number
//  *                 description: "The new total amount to set for the user's balance."
//  *                 example: 1500.75
//  *     responses:
//  *       '200':
//  *         description: "Funds updated successfully."
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: "Funds updated successfully"
//  *                 updatedBalance:
//  *                   type: object
//  *                   properties:
//  *                     _id:
//  *                       type: string
//  *                     user:
//  *                       type: string
//  *                     coinId:
//  *                       type: number
//  *                     balance:
//  *                       type: number
//  *                     updatedAt:
//  *                       type: string
//  *                       format: date-time
//  *       '400':
//  *         description: "Required fields missing or invalid coin Id."
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: "Required fields missing or invalid coin Id"
//  *       '404':
//  *         description: "User or Balance not found."
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: "User with given Id does not exist"
//  *       '500':
//  *         description: "Server error."
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: "Server error"
//  */
// router.post('/update-funds', superAdminTokenRequired, UpdateFunds);


/**
 * @swagger
 * /api/admin/admins:
 *   put:
 *     summary: Update an admin's role and active status
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     description: "Updates an admin's role and active status. Use this endpoint to change an admin's role or to deactivate/activate an admin account. Requires adminId, role, and isActive in the request body."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: "The ID of the admin to update."
 *                 example: "60a7f6c2c6a1a2c3d4e5f679"
 *               role:
 *                 type: string
 *                 enum: ["super-admin", "sub-admin", "admin", "contact-support"]
 *                 description: "The new role for the admin."
 *                 example: "admin"
 *               isActive:
 *                 type: boolean
 *                 description: "The active status of the admin (true for active, false for deactivated)."
 *                 example: true
 *     responses:
 *       '200':
 *         description: "Admin updated successfully."
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
 *                   example: "Admin updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       '400':
 *         description: "Bad Request. Missing required fields or invalid role."
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
 *                   example: "adminId, role, and isActive are required"
 *       '404':
 *         description: "Admin not found."
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
 *                   example: "Admin not found"
 *       '500':
 *         description: "Server error."
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
 *                   example: "Server error"
 */
router.put('/admins', superAdminTokenRequired, UpdateAdminManagement);


/**
 * @swagger
 * /api/admin/admins:
 *   get:
 *     summary: Retrieve all admin users
 *     tags: [Admin]
 *     security:
 *       - fluxelAccessToken: []
 *     description: Retrieves a list of all admin users. Sensitive fields such as passwords are excluded.
 *     responses:
 *       '200':
 *         description: "Admins retrieved successfully."
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
 *                   example: "Admins retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60a7f6c2c6a1a2c3d4e5f679"
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                       email:
 *                         type: string
 *                         example: "john@example.com"
 *                       role:
 *                         type: string
 *                         example: "admin"
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-02-26T12:34:56.789Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-03-01T08:00:00.000Z"
 *       '500':
 *         description: "Server error."
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
 *                   example: "Server error"
 */
router.get('/admins', superAdminTokenRequired, GetAdmins);


module.exports = router;