// route/auth.js
let express = require('express');
let router = express.Router();
let { registerUser, loginUser, verifyOTP, resendOTP, verifyUID, contactUs, forgotPassword, resetPassword, verifyOtpLogin, verify2FaLogin } = require('../controller/auth');
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
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
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists or invalid data
 */
router.post('/register', registerUser);



/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and complete user registration
 *     tags: [User]
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
router.post('/verify-otp', verifyOTP);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Initiates user login process
 *     description: Validates user credentials and initiates a login session by sending an OTP
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Session initiated successfully
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
 *                   example: "Session initiated"
 *                 sessionId:
 *                   type: string
 *                   example: "60d5f8b8e1c6a01234567890"
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.post('/login',
      // trackActivity('LOGIN_ACTION'),
      loginUser);

/**
 * @swagger
 * /api/auth/login/verify-otp:
 *   post:
 *     summary: Initiates user login process
 *     description: Validates user credentials and initiates a login session by sending an OTP
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - otp
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: User's login session Id
 *               otp:
 *                 type: string
 *                 description: User's one time password generated from login session
 *     responses:
 *       200:
 *         description: Login Successful
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
 *                   example: "User logged in successfully"
 *                 user:
 *                   type: object
 *       206:
 *         description: Verified otp successfully means the otp has been verified but the 2fa auth is turned on and hasn't been verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Verified code Successfully"
 *                 status:
 *                   type: bool
 *                   example: true
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 *       404:
 *         description: Not found Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No session found or session expired, please initiate another login"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.post('/login/verify-otp', verifyOtpLogin);

/**
 * @swagger
 * /api/auth/login/verify-2fa:
 *   post:
 *     summary: Initiates user login process
 *     description: Validates user credentials and initiates a login session by sending an OTP
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - twoFactorCode
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: User's login session Id
 *               twoFactorCode:
 *                 type: string
 *                 description: User's Google Authenticator code
 *     responses:
 *       200:
 *         description: Login Successful
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
 *                   example: "User logged in successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123456"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *       206:
 *         description: OTP verified, but 2FA authentication is enabled and requires verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Verified code successfully"
 *                 status:
 *                   type: boolean  # Changed from bool to boolean
 *                   example: true
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 *       404:
 *         description: Not found Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No session found or session expired, please initiate another login"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.post('/login/verify-2fa', verify2FaLogin);



/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP to a user's email
 *     tags: [User]
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
router.post('/resend-otp', resendOTP);



/**
 * @swagger
 * /api/auth/verify-uid:
 *   post:
 *     summary: Verify UID
 *     tags: [VERIFY UID]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uid:
 *                 type: string
 *     responses:
 *       200:
 *         description: UID verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                   description: Indicates if the UID exists in the database
 *                 message:
 *                   type: string
 *                   description: Message describing the result
 *       400:
 *         description: Bad request, UID is required
 *       500:
 *         description: Server error
 */
router.post('/verify-uid', verifyUID);


/**
 * @swagger
 * /api/auth/contact-us:
 *   post:
 *     summary: Send contact us message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email address of the sender
 *               message:
 *                 type: string
 *                 description: Message content 
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number of the sender
 *             required:
 *               - email
 *               - message
 *               - phoneNumber
 *     responses:
 *       200:
 *         description: Message sent successfully
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
 *                   example: Your message has been sent successfully
 *       400:
 *         description: Invalid request - missing fields or invalid email
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
 *                   example: Email and message are required
 *       500:
 *         description: Server error
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
 *                   example: Server error
 */
router.post('/contact-us', contactUs);


/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send a password reset OTP to user's email
 *     description: Generates an OTP and sends it to the provided email for password reset.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
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
 *                   example: "OTP sent to your email. Purpose is to reset password."
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: user@example.com
 *       404:
 *         description: Email does not exist
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
 *                   example: "Email Does not exist"
 *       500:
 *         description: Server error
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
router.post('/forgot-password', forgotPassword)

  
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     description: Verifies the OTP and resets the password if valid.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "A1B2C3"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewSecurePassword123!"
 *     responses:
 *       200:
 *         description: Password successfully updated
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
 *                   example: "Password Successfully Updated"
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: user@example.com
 *       400:
 *         description: OTP expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "OTP expired"
 *       404:
 *         description: Invalid OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid code"
 *       500:
 *         description: Server error
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
router.post('reset-password', resetPassword);


module.exports = router;