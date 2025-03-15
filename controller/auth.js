// controller/auth.js

let bcrypt = require('bcryptjs');
let User = require('../model/user');
let jwt = require("jsonwebtoken")
let { v4: uuidv4 } = require('uuid');
let { Mail } = require("../middleware/mail");
let mail = new Mail();
let OTP = require('../model/otp');
let Reset_OTP = require('../model/reset-password-otp');
let crypto = require('crypto');
const { virtualAccount } = require('../model/virtualAccount');
const { default: axios } = require('axios');
require("dotenv").config();
const { generateUniqueUID } = require('../utils/helper');
const { ReferralHistory } = require('../model/referralHistory');
const { LoginSession } = require('../model/loginSession');



const registerUser = async (req, res) => {
    let { name, email, password, referralCode } = req.body;


    try {
        // if (!validateEmail(email)) {
        //     return res.status(400).json({ message: 'Invalid email address' });
        // }

        let lowerCaseEmail = email.toLowerCase().trim();

        let existingUser = await User.findOne({ email: lowerCaseEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        if (referralCode) {
            let referralExist = await User.findOne({ uid: referralCode })
            if (!referralExist) {
                return res.status(400).json({ message: 'Invalid referral code provided' });
            }
        }

        let salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(password, salt);

        let otp = crypto.randomBytes(3).toString('hex').toUpperCase();
        console.log("otp---------------", otp);
        let newOTP = new OTP({
            email: lowerCaseEmail,
            otp: otp,
            password: hashedPassword,
            name: name,
            referralCode,
        });

        await newOTP.save();

        await mail.sendOTPEmail({ name, email: lowerCaseEmail, otp });

        return res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Please verify to complete registration.',
            email: lowerCaseEmail
        });
    } catch (error) {
        console.log("********* error", error);
        return res.status(500).json({ message: 'Server error' });
    }
};


const verifyOTP = async (req, res) => {
    let { email, otp } = req.body;

    try {
        let otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        await OTP.deleteOne({ _id: otpRecord._id });

        let { password, name, referralCode } = otpRecord;
        const uid = await generateUniqueUID();


        let referredBy = null;
        if (referralCode) {
            let referralExist = await User.findOne({ uid: referralCode })
            if (!referralExist) {
                return res.status(400).json({ message: 'Invalid referral code provided' });
            }
            referredBy = referralExist._id;
        }

        let newUser = new User({
            name: name,
            email: email,
            password,
            uid,
            username: name,
            referredBy: referredBy,
        });

        if (referredBy) {
            let referralHistory = new ReferralHistory({
                referrerId: referredBy,
                refereeId: newUser._id,
                commissionEarned: 0,
            });
            await referralHistory.save();
        };

        let result = await newUser.save();


        await mail.welcomeEmail(result);

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.log("*********00 error", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email });

        // Check if user exists
        if (user) return res.status(404).json({ success: false, message: 'Email Does not exist' });

        // Create OTP
        let otp = crypto.randomBytes(3).toString('hex').toUpperCase();
        console.log("otp---------------", otp);

        let newOTP = new Reset_OTP({
            email: email,
            otp: otp
        });

        // Update otp
        await newOTP.save();

        await mail.sendResetPassOTP({ email: email, otp });

        return res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Purpose is to reset password.',
            email: email
        });
    } catch (error) {
        console.log("*********00 error", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { otp, email, newPassword } = req.body;

        let reset_otp = (await Reset_OTP.find({ email: email, otp: otp }));

        if (!reset_otp.length) return res.status(404).json({ status: false, message: 'Invalid code' });

        const current_reset_otp = reset_otp[0];

        const otpExpirationTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        const createdAt = new Date(current_reset_otp.createdAt);
        const now = new Date();

        if (now.getTime() - createdAt.getTime() > otpExpirationTime) {
            return res.status(400).json({ status: false, message: 'OTP expired' });
        }

        let salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.updateOne({ email: email }, { password: hashedPassword });

        await Reset_OTP.deleteMany({ email: email });

        return res.status(200).json({
            success: true,
            message: 'Password Successfully Updated',
            email: email
        });

    } catch (error) {
        console.log("*********00 error", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const resendOTP = async (req, res) => {
    let { email } = req.body;

    try {
        let lowerCaseEmail = email.toLowerCase().trim();
        let otpRecord = await OTP.findOne({ email: lowerCaseEmail });

        if (!otpRecord) {
            return res.status(400).json({ message: 'No OTP found for this email' });
        }

        let otp = crypto.randomBytes(3).toString('hex').toUpperCase();
        otpRecord.otp = otp;
        await otpRecord.save();

        await mail.sendOTPEmail({ name: otpRecord.name, email: lowerCaseEmail, otp });

        return res.status(200).json({
            success: true,
            message: 'OTP resent to your email. Please verify to complete registration.',
            email: lowerCaseEmail
        });
    } catch (error) {
        console.log("Error resending OTP:", error);
        return res.status(500).json({ message: 'Server error' });
    }
};


const contactUs = async (req, res) => {
    const { email, message, phoneNumber } = req.body;

    try {
        if (!email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Email and message are required'
            });
        }

        // if (!validateEmail(email)) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Invalid email address'
        //     });
        // }

        // Send email to admin
        await mail.sendContactUsEmail({
            userEmail: email,
            message: message,
            phoneNumber: phoneNumber
        });

        return res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully'
        });

    } catch (error) {
        console.error("Error sending contact us email:", error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};


const loginUser = async (req, res) => {
    let { email, password } = req.body;

    try {
        let lowerCaseEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: lowerCaseEmail });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        let isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        let otp = crypto.randomBytes(3).toString('hex').toUpperCase();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

        await mail.sendLoginOTPEmail({ email: email, otp: otp, createdAt: now });

        const session = await LoginSession.create({
            user: user._id,
            otp: otp,
            expiresAt: expiresAt,
            isActive: true,
            verifyCode: false,
            verify2fa: false
        });

        return res.status(200).json({
            success: true,
            message: 'Session initiated',
            sessionId: session._id
        });
    } catch (error) {
        console.log("********* error", error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const verifyOtpLogin = async (req, res) => {
    try {
        let { sessionId, otp } = req.body;

        if (!sessionId) return res.status(400).json({ message: 'Invalid credentials' });

        const session = await LoginSession.findOne({
            _id: sessionId,
            isActive: true
        });

        const now = new Date();

        if (!session || now > session.expiresAt) {
            return res.status(404).json({
                message: "No session found or session expired, please initiate another login"
            });
        }

        const user = await User.findOne({ _id: session.user })
        if (!user) {
            return res.status(400).json({
                message: 'Invalid credentials'
            });
        }

        if (!otp) {
            return res.status(400).json({
                message: 'Invalid credentials'
            });
        }

        if (session.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP Code' });
        }

        if (!user.isTwoFactorEnabled) {
            await LoginSession.findByIdAndUpdate(session._id, {
                verifyCode: true,
                isActive: false
            });

            try {
                let userData = {
                    _id: user._id
                };

                const token = await jwt.sign(userData, process.env.SECRET_KEY, {
                    algorithm: "HS256",
                });

                return res.status(200).json({
                    success: true,
                    message: 'User logged in successfully',
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        uid: user.uid,
                    },
                    token
                });
            } catch (jwtError) {
                return res.status(500).json({ message: 'Error generating token' });
            }
        } else {
            await LoginSession.findByIdAndUpdate(session._id, { verifyCode: true });

            return res.status(206).json({
                success: true,
                message: 'Verified Code Successfully'
            });
        }
    } catch (error) {
        console.log("********* error", error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const verify2FaLogin = async (req, res) => {
    try {
        let { sessionId, twoFactorCode } = req.body;


        if (!sessionId) return res.status(400).json({ message: 'Invalid credentials' });

        const session = await LoginSession.findOne({
            _id: sessionId,
            isActive: true
        });

        const now = new Date();

        if (!session || now > session.expiresAt) {
            return res.status(404).json({
                message: "No session found or session expired, please initiate another login"
            });
        }

        const user = await User.findOne({ _id: session.user })
        if (!user) {
            return res.status(400).json({
                message: 'Invalid credentials'
            });
        }
        // Skip 2FA check if not enabled
        if (!user.isTwoFactorEnabled) {
            return res.status(400).json({ message: 'Two-factor is not enabled' });
        }

        if (!twoFactorCode) {
            return res.status(400).json({
                message: 'Two-factor authentication code required'
            });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: twoFactorCode
        });

        if (!verified) {
            return res.status(400).json({
                message: 'Invalid credentials'
            });
        }

        if (session.verifyCode) {
            await LoginSession.findByIdAndUpdate(session._id, {
                verify2fa: true,
                isActive: false
            });

            try {
                let userData = {
                    _id: user._id
                };

                const token = await jwt.sign(userData, process.env.SECRET_KEY, {
                    algorithm: "HS256",
                });

                return res.status(200).json({
                    success: true,
                    message: 'User logged in successfully',
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        uid: user.uid,
                    },
                    token
                });
            } catch (jwtError) {
                return res.status(500).json({ message: 'Error generating token' });
            }
        } else {
            await LoginSession.findByIdAndUpdate(session._id, { verify2fa: true });

            return res.status(206).json({
                success: true,
                message: 'Verified 2fa'
            });
        }
    } catch (error) {
        console.log("********* error", error);
        return res.status(500).json({ message: 'Server error' });
    }
};


const googleLogin = async (req, res) => {
    const profile = req.user
    const userEmail = profile.emails[0]?.value?.toLowerCase()?.trim()

    const user = await User.findOne({ email: userEmail })

    if (!user) {
        // Redirect to frontend with error message
        return res.redirect(`${process.env.WEB_BASE_URL}/auth/signup?error=user_not_registered`)
    }

    const userData = {
        _id: user._id,
    }

    const token = await jwt.sign(userData, process.env.SECRET_KEY, {
        algorithm: "HS256",
        expiresIn: "7d",
    })

    // Option 1: Set HTTP-only cookie (more secure)
    res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    })

    // Redirect to frontend without exposing token in URL
    res.redirect(process.env.WEB_BASE_URL)
}
// 
const getUserProfile = async (req, res) => {
    try {
        let user = req.user;
        let bvn = await getBVN(user);
        let bvnData = null;
        let bankAccount = null;

        if (!bvn.data) {
            return res.status(400).json({ message: 'Bank account not found' });
        }
        bvnData = JSON.parse(SystemDecrypt(bvn.data?.config));
        bankAccount = bvnData?.data?.bankAccount;

        return res.status(200).json({
            success: true,
            message: 'Profile retrieved successfully',
            data: {
                // bvn: bvnData,
                bankAccount
            },
        });
    } catch (error) {
        console.log("********* error", error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const user = req.user;
        const {
            name,
            phone,
            bvn,
        } = req.body;

        const userUpdateFields = {};
        const virtualAccountUpdateFields = {};

        if (name) userUpdateFields.name = name;
        if (phone) userUpdateFields.phone = phone;

        if (bvn) virtualAccountUpdateFields.bvn = SystemEncrypt(bvn);

        if (Object.keys(userUpdateFields).length > 0) {
            await User.findByIdAndUpdate(user._id, userUpdateFields);
        }

        if (Object.keys(virtualAccountUpdateFields).length > 0) {
            await virtualAccount.findOneAndUpdate(
                { user: user._id },
                virtualAccountUpdateFields
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Update submitted successfully',
            data: {
                name: name || user.name,
                email: user.email,
                phone: phone || user.phone,
            }
        });

    } catch (error) {
        console.log("Error updating profile:", error);
        return res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
};

const addBankAccount = async (req, res) => {
    try {
        const { bankCode, accountNumber, bankName } = req.body;
        const user = req.user;

        const resp = await verifyAccountDetails(accountNumber, bankCode);

        if (!resp.status) {
            return res.status(400).json({
                success: false,
                message: resp.error
            });
        }

        if (!bankCode || !accountNumber || !bankName) {
            return res.status(400).json({
                success: false,
                message: 'Bank code, account number and bank name are required'
            });
        }


        const recipient = await getRecipients(accountNumber, bankCode);

        if (!recipient.status) {
            return res.status(400).json({
                success: false,
                message: "Failed to create recipient, try using another b"
            });
        }

        await virtualAccount.findOneAndUpdate(
            { user: user._id },
            {
                bankCode: SystemEncrypt(bankCode),
                accountNumber: SystemEncrypt(accountNumber),
                bankName: SystemEncrypt(bankName),
                recipientId: recipient?.data?.id,
                canWithdraw: true,
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Bank account added successfully',
        });

    } catch (error) {
        console.log("Error adding bank account:", error);
        return res.status(500).json({
            success: false,
            message: 'Error adding bank account'
        });
    }
}

const withdrawRequest = async (req, res) => {
    try {
        const { amount, narration } = req.body;
        let user = req.user;
        let referenceId = uuidv4();

        if (!amount) {
            return res.status(400).json({
                success: false,
                message: 'Amount is required'
            });
        }

        const userVirtualAccount = await virtualAccount.findOne({ user: user._id });

        if (!userVirtualAccount || !userVirtualAccount.canWithdraw) {
            return res.status(400).json({
                success: false,
                message: 'No withdrawal account found. Please add a bank account first.'
            });
        }

        if (!userVirtualAccount.recipientId) {
            return res.status(400).json({
                success: false,
                message: 'No recipient ID found. Please add a bank account first.'
            });
        }

        let recipientId = userVirtualAccount.recipientId;

        const options = {
            method: 'POST',
            url: `${process.env.LENCO_API_BASE_URL}/transactions`,
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                Authorization: `Bearer ${process.env.LENCO_API_KEY}`
            },

            data: {
                accountId: process.env.LENCO_ACCOUNT_UUID,
                recipientId: recipientId,
                amount,
                narration,
                reference: referenceId,
                senderName: process.env.APP_NAME,
            }
        };

        const response = await axios.request(options);

        if (response?.data?.status) {
            return res.status(200).json({
                success: true,
                message: 'Withdrawal initiated successfully',
                data: response.data
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Withdrawal failed',
                error: response?.data?.message
            });
        }

    } catch (error) {
        console.log("********* error", error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const verifyUID = async (req, res) => {
    const { uid } = req.body;

    if (!uid) {
        return res.status(400).json({ error: 'UID is required' });
    }

    try {
        const existingUser = await User.findOne({ uid });

        if (existingUser) {
            return res.status(200).json({ exists: true, message: 'UID exists in the database.' });
        }

        return res.status(200).json({ exists: false, message: 'UID does not exist in the database.' });
    } catch (error) {
        console.error('Error verifying UID:', error);
        return res.status(500).json({ error: 'An error occurred while verifying the UID.' });
    }
};

module.exports = {
    registerUser,
    verifyOTP,
    loginUser,
    googleLogin,
    getUserProfile,
    updateUserProfile,
    addBankAccount,
    withdrawRequest,
    resendOTP,
    verifyUID,
    contactUs,
    resetPassword,
    forgotPassword,
    verify2FaLogin,
    verifyOtpLogin
};