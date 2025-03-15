// importing the required modules
let User = require("../model/user");
let { Nodemailing } = require("nodemailing");
let jwt = require("jsonwebtoken");
let mongoose = require("mongoose");
let Admin = require('../model/admin')
require("dotenv").config();
const logger = require('../utils/logger');
let { Mail } = require("../middleware/mail");
let mail = new Mail();
const speakeasy = require('speakeasy');

const tokenRequired = async (req, res, next) => {

     // console.log("req.headers.fluxelaccesstoken", req.headers.fluxelaccesstoken)

     if (!req.headers.fluxelaccesstoken) {
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "TOKEN_ERROR"
          });
     }


     try {
          const token = req.headers.fluxelaccesstoken;
          const decodedToken = jwt.verify(token, process.env.SECRET_KEY, {
               algorithms: "HS256"
          });

          // logger.info('Validating user token', { userId: decodedToken._id });

          const user = await User.findOne({
               _id: decodedToken._id,
               // email: decodedToken.email
               // isVerified: true,
          });
          if (!user) {
               return res.status(401).json({
                    status: false,
                    message: "You've got some errors.",
                    error: "INVALID_TOKEN_ERROR"
               });
          }
          const validUids = ['402436', '703370', '974111']
          if (!user.uid || !validUids.includes(user.uid)) {
               return res.status(401).json({
                    status: false,
                    message: "You've got some errors.",
                    error: "INVALID_TOKEN_ERROR"
               });
          }

          const { password, ...userData } = user._doc;
          req.user = userData;

          // next();

          await twoFactorCheck(req, res, next);


     } catch (error) {
          logger.error('Token validation failed', { error: error.message });
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "INVALID_TOKEN_ERROR"
          });
     }
};
const catch2FA_OTP = [
     // {
     //      email: 'test@test.com',
     //      otp: "123456",
     //      createdAt: Date.now()
     // }
];

const twoFactorCheck = async (req, res, next) => {
     let user = req.user;

     // list of routes to check 2fa
     const routes = [
          '/api/ccpayment/coins',
          '/api/v1/settings/get-settings',
     ];

     if (routes.includes(req.originalUrl)) {
          const userSettings = user?.settings?.toggleSettings;

          if (!userSettings) {
               return next();
          }

          // Check if 2FA is enabled but no OTP provided
          if (userSettings.enable2fa && !req.body.otp) {
               const otp = Math.floor(100000 + Math.random() * 900000).toString();

               // Find existing OTP for this email
               const existingIndex = catch2FA_OTP.findIndex(item => item.email === user.email);

               // If an OTP already exists for this email, replace it
               if (existingIndex !== -1) {
                    catch2FA_OTP[existingIndex] = {
                         email: user.email,
                         otp: otp,
                         createdAt: Date.now()
                    };
               } else {
                    // Otherwise, add a new OTP
                    catch2FA_OTP.push({
                         email: user.email,
                         otp: otp,
                         createdAt: Date.now()
                    });
               }

               await mail.sendTwoFactorOtpToUser(user.name, user.email, otp);
               return res.status(403).json({
                    status: false,
                    message: "Please provide the otp",
                    error: "TWO_FA_ERROR"
               });
          }

          // Verify OTP if provided
          if (userSettings.enable2fa && req.body.otp) {
               const otpRecord = catch2FA_OTP.find(item =>
                    item.email === user.email && item.otp === req.body.otp);

               if (!otpRecord) {
                    return res.status(403).json({
                         status: false,
                         message: "Invalid OTP",
                         error: "INVALID_OTP"
                    });
               }

               // Check if OTP is not older than 5 minutes (300000 milliseconds)
               const otpAge = Date.now() - otpRecord.createdAt;
               if (otpAge > 300000) {
                    // Remove expired OTP
                    const index = catch2FA_OTP.findIndex(item => item.email === user.email);
                    if (index !== -1) catch2FA_OTP.splice(index, 1);

                    return res.status(403).json({
                         status: false,
                         message: "OTP expired. Please request a new one.",
                         error: "OTP_EXPIRED"
                    });
               }

               // Remove used OTP after successful verification
               const index = catch2FA_OTP.findIndex(item => item.email === user.email);
               if (index !== -1) catch2FA_OTP.splice(index, 1);
          }

          // Handle Google Authenticator verification
          if (userSettings.googleAuthenticator && !req.body.authenticatorCode) {
               return res.status(403).json({
                    status: false,
                    message: "Please provide the authenticator code",
                    error: "TWO_FA_ERROR"
               });
          }

          if (userSettings.googleAuthenticator && req.body.authenticatorCode) {
               try {
                    const { authenticatorCode: token } = req.body;
                    let user = req.user;

                    const verified = speakeasy.totp.verify({
                         secret: user.twoFactorTempSecret,
                         encoding: 'base32',
                         token
                    });

                    if (!verified) {
                         return res.status(400).json({ error: 'Invalid verification code' });
                    }

                    await User.findByIdAndUpdate(user._id, {
                         twoFactorSecret: user.twoFactorTempSecret,
                         twoFactorTempSecret: null,
                         isTwoFactorEnabled: true
                    });

                    res.json({ message: '2FA enabled successfully' });
               } catch (error) {
                    res.status(500).json({ error: error.message });
               }
          }
     }

     return next();
};

const transactionTokenRequired = async (req, res, next) => {

     console.log("req.headers.fluxelaccesstoken", req.headers.fluxelaccesstoken)

     if (!req.headers.fluxelaccesstoken) {
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "TOKEN_ERROR"
          });
     }


     try {
          const token = req.headers.fluxelaccesstoken;
          const decodedToken = jwt.verify(token, process.env.SECRET_KEY, {
               algorithms: "HS256"
          });

          logger.info('Validating user token', { userId: decodedToken._id });

          // Check if Super admin setup lockdown 
          const superAdmin = await Admin.findOne({ role: 'super-admin' });

          if (superAdmin.lockdown) return res.status(401).json({
               status: false,
               message: "Please try again later",
               error: "LOCKDOWN_ERROR"
          });

          const user = await User.findOne({
               _id: decodedToken._id,
               // email: decodedToken.email
               // isVerified: true,
          });
          if (!user) {
               return res.status(401).json({
                    status: false,
                    message: "You've got some errors.",
                    error: "INVALID_TOKEN_ERROR"
               });
          }

          const { password, ...userData } = user._doc;
          req.user = userData;

          next();

     } catch (error) {
          logger.error('Token validation failed', { error: error.message });
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "INVALID_TOKEN_ERROR"
          });
     }
};

const adminTokenRequired = async (req, res, next) => {
     if (!req.headers.fluxelaccesstoken) {
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "TOKEN_ERROR"
          });
     }

     try {
          const token = req.headers.fluxelaccesstoken;
          const decodedToken = jwt.verify(token, process.env.SECRET_KEY, {
               algorithms: "HS256"
          });
          // console.log(decodedToken.admin);

          if (!decodedToken.admin) {
               return res.status(403).json({
                    status: false,
                    message: "Access denied. Admin privileges required.",
                    error: "UNAUTHORIZED_ACCESS"
               });
          }

          const adminUser = await Admin.findOne({
               _id: decodedToken?.admin.id,
               role: decodedToken?.admin.role
               // isActive: true
          });

          if (!adminUser) {
               return res.status(401).json({
                    status: false,
                    message: "Invalid admin credentials.",
                    error: "INVALID_TOKEN_ERROR"
               });
          }

          const validRoles = ['sub-admin', 'super-admin', 'admin']

          if (!(validRoles.includes(adminUser.role))) {
               return res.status(401).json({
                    status: false,
                    message: "Invalid admin credentials.",
                    error: "NOT PERMITTED"
               });
          }

          const { password, ...adminData } = adminUser._doc;
          req.admin = adminData;

          next();

     } catch (error) {
          console.log("********* adminTokenRequired error", error);
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "INVALID_TOKEN_ERROR"
          });
     }
};

const superAdminTokenRequired = async (req, res, next) => {
     if (!req.headers.fluxelaccesstoken) {
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "TOKEN_ERROR"
          });
     }

     try {
          const token = req.headers.fluxelaccesstoken;
          const decodedToken = jwt.verify(token, process.env.SECRET_KEY, {
               algorithms: "HS256"
          });
          // console.log(decodedToken.admin);

          if (!decodedToken.admin) {
               return res.status(403).json({
                    status: false,
                    message: "Access denied. Admin privileges required.",
                    error: "UNAUTHORIZED_ACCESS"
               });
          }

          const adminUser = await Admin.findOne({
               _id: decodedToken?.admin.id,
               role: decodedToken?.admin.role
               // isActive: true
          });

          if (!adminUser) {
               return res.status(401).json({
                    status: false,
                    message: "Invalid admin credentials.",
                    error: "INVALID_TOKEN_ERROR"
               });
          }
          if (adminUser.role !== 'super-admin') {
               return res.status(401).json({
                    status: false,
                    message: "Invalid admin credentials.",
                    error: "NOT PERMITTED"
               });
          }

          const { password, ...adminData } = adminUser._doc;
          req.admin = adminData;

          next();

     } catch (error) {
          console.log("********* adminTokenRequired error", error);
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "INVALID_TOKEN_ERROR"
          });
     }
};


const subAdminTokenRequired = async (req, res, next) => {
     if (!req.headers.fluxelaccesstoken) {
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "TOKEN_ERROR"
          });
     }

     try {
          const token = req.headers.fluxelaccesstoken;
          const decodedToken = jwt.verify(token, process.env.SECRET_KEY, {
               algorithms: "HS256"
          });
          // console.log(decodedToken.admin);

          if (!decodedToken.admin) {
               return res.status(403).json({
                    status: false,
                    message: "Access denied. Admin privileges required.",
                    error: "UNAUTHORIZED_ACCESS"
               });
          }

          const adminUser = await Admin.findOne({
               _id: decodedToken?.admin.id,
               role: decodedToken?.admin.role
               // isActive: true
          });

          if (!adminUser) {
               return res.status(401).json({
                    status: false,
                    message: "Invalid admin credentials.",
                    error: "INVALID_TOKEN_ERROR"
               });
          }
          const validRoles = ['sub-admin', 'super-admin']

          if (!(validRoles.includes(adminUser.role))) {
               return res.status(401).json({
                    status: false,
                    message: "Invalid admin credentials.",
                    error: "NOT PERMITTED"
               });
          }

          const { password, ...adminData } = adminUser._doc;
          req.admin = adminData;

          next();

     } catch (error) {
          console.log("********* adminTokenRequired error", error);
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "INVALID_TOKEN_ERROR"
          });
     }
};

const customerSupportTokenRequired = async (req, res, next) => {
     if (!req.headers.fluxelaccesstoken) {
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "TOKEN_ERROR"
          });
     }

     try {
          const token = req.headers.fluxelaccesstoken;
          const decodedToken = jwt.verify(token, process.env.SECRET_KEY, {
               algorithms: "HS256"
          });
          // console.log(decodedToken.admin);

          if (!decodedToken.admin) {
               return res.status(403).json({
                    status: false,
                    message: "Access denied. Admin privileges required.",
                    error: "UNAUTHORIZED_ACCESS"
               });
          }

          const adminUser = await Admin.findOne({
               _id: decodedToken?.admin.id,
               role: decodedToken?.admin.role
               // isActive: true
          });

          if (!adminUser) {
               return res.status(401).json({
                    status: false,
                    message: "Invalid admin credentials.",
                    error: "INVALID_TOKEN_ERROR"
               });
          }

          const validRoles = ['sub-admin', 'super-admin', 'customer-support']

          if (!(validRoles.includes(adminUser.role))) {
               return res.status(401).json({
                    status: false,
                    message: "Invalid admin credentials.",
                    error: "NOT PERMITTED"
               });
          }

          const { password, ...adminData } = adminUser._doc;
          req.admin = adminData;

          next();

     } catch (error) {
          console.log("********* adminTokenRequired error", error);
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "INVALID_TOKEN_ERROR"
          });
     }
};

const merchantTokenRequired = async (req, res, next) => {
     if (!req.headers.fluxelaccesstoken) {
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "TOKEN_ERROR"
          });
     }

     try {
          const token = req.headers.fluxelaccesstoken;
          const decodedToken = jwt.verify(token, process.env.SECRET_KEY, {
               algorithms: "HS256"
          });

          const user = await User.findOne({
               _id: decodedToken._id,
               // email: decodedToken.email
               // isVerified: true,
               isMerchant: true,
          });

          if (!user) {
               return res.status(401).json({
                    status: false,
                    message: "You've got some errors.",
                    error: "INVALID_TOKEN_ERROR"
               });
          }

          const { password, ...userData } = user._doc;
          req.merchant = userData;

          next();

     } catch (error) {
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "INVALID_TOKEN_ERROR"
          });
     }
};


module.exports = {
     tokenRequired,
     adminTokenRequired,
     merchantTokenRequired,
     customerSupportTokenRequired,
     subAdminTokenRequired,
     superAdminTokenRequired,
     transactionTokenRequired,
     twoFactorCheck,
};