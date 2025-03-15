// controller/auth.js

let bcrypt = require('bcryptjs');
let User = require('../model/user');
let { MerchantRequest } = require('../model/merchantRequests');
let jwt = require("jsonwebtoken")
let { v4: uuidv4 } = require('uuid');
let { Mail } = require("../middleware/mail");
let mail = new Mail();
let OTP = require('../model/otp');
let crypto = require('crypto');
const { virtualAccount } = require('../model/virtualAccount');
const { default: axios } = require('axios');
require("dotenv").config();


const { handleFileUpload } = require('../utils/fileUpload');
const { Notification } = require('../model/notifications');


const { verifyNIN } = require('../utils/qoreId');

const qoreIdClient = require('../utils/qoreId');
const ninVerificationData = require('../model/ninVerificationData');
const { getCoinList, getNairaInUsd } = require('../utils/ccpayment');

// const getUserProfile = async (req, res) => {
//      try {
//           let user = req.user;
//           let bvn = await getBVN(user);
//           let bvnData = null;
//           let bankAccount = null;

//           if (!bvn.data) {
//                return res.status(400).json({ message: 'Bank account not found' });
//           }
//           bvnData = JSON.parse(SystemDecrypt(bvn.data?.config));
//           bankAccount = bvnData?.data?.bankAccount;

//           return res.status(200).json({
//                success: true,
//                message: 'Profile retrieved successfully',
//                data: {
//                     // bvn: bvnData,
//                     bankAccount
//                },
//           });
//      } catch (error) {
//           console.log("********* error", error);
//           return res.status(500).json({ message: 'Server error' });
//      }
// };

const getUserProfile = async (req, res) => {
     try {
          let user = req.user;

          // Construct the user profile object with new fields
          let userProfile = {
               name: user.name,
               email: user.email,
               phone: user.phone,
               isVerified: user.isVerified,
               createdAt: user.createdAt,
               isMerchant: user.isMerchant,
               profilePicture: user.profilePicture,
               ninVerified: user.ninVerified,
               proofOfAddressVerified: user.proofOfAddressVerified,
               isLocked: user.isLocked,
               // New fields
               preferredLanguage: user.preferredLanguage || 'en',
               socialLinks: user.socialLinks || [],
               lastLogin: user.lastLogin || null,
               failedLoginAttempts: user.failedLoginAttempts || 0,
               uid: user.uid || null,
          };

          return res.status(200).json({
               success: true,
               message: 'Profile retrieved successfully',
               data: userProfile,
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
               preferredLanguage,
               socialLinks,
          } = req.body;

          // Current user update logic (kept intact)
          const userUpdateFields = {};
          const virtualAccountUpdateFields = {};

          if (name) userUpdateFields.name = name;
          if (phone) userUpdateFields.phone = phone;

          if (bvn) virtualAccountUpdateFields.bvn = SystemEncrypt(bvn);

          // New fields update logic
          if (preferredLanguage && preferredLanguage !== user.preferredLanguage) {
               userUpdateFields.preferredLanguage = preferredLanguage;
          }
          if (socialLinks && Array.isArray(socialLinks)) {
               userUpdateFields.socialLinks = socialLinks;
          }

          // Update last login date if the user logs in
          if (!user.lastLogin) {
               userUpdateFields.lastLogin = new Date();
          }

          // Increment failed login attempts if applicable (you might want to handle this logic based on failed login attempts)
          if (req.body.failedLogin) {
               userUpdateFields.failedLoginAttempts = user.failedLoginAttempts + 1;
          }

          // Proceed to update the user model and virtual account if needed
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
                    preferredLanguage: preferredLanguage || user.preferredLanguage,
                    socialLinks: socialLinks || user.socialLinks,
               }
          });

     } catch (error) {
          console.log("Error updating profile:", error);
          return res.status(500).json({
               success: false,
               message: 'Error updating profile'
          });
     }


     // try {
     //      const user = req.user;
     //      const {
     //           name,
     //           phone,
     //           bvn,
     //      } = req.body;


     //      const userUpdateFields = {};
     //      const virtualAccountUpdateFields = {};


     //      if (name) userUpdateFields.name = name;
     //      if (phone) userUpdateFields.phone = phone;


     //      if (bvn) virtualAccountUpdateFields.bvn = SystemEncrypt(bvn);



     //      if (Object.keys(userUpdateFields).length > 0) {
     //           await User.findByIdAndUpdate(user._id, userUpdateFields);
     //      }

     //      if (Object.keys(virtualAccountUpdateFields).length > 0) {
     //           await virtualAccount.findOneAndUpdate(
     //                { user: user._id },
     //                virtualAccountUpdateFields
     //           );
     //      }

     //      return res.status(200).json({
     //           success: true,
     //           message: 'Update submitted successfully',
     //           data: {
     //                name: name || user.name,
     //                email: user.email,
     //                phone: phone || user.phone,
     //           }
     //      });

     // } catch (error) {
     //      console.log("Error updating profile:", error);
     //      return res.status(500).json({
     //           success: false,
     //           message: 'Error updating profile'
     //      });
     // }
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

const getInstantBuyRate = async (req, res) => {
     try {
          let { amount, from, to } = req.body;
          let user = req.user;

          let swap = await ExchangeToken(amount, from, to);

          let trade = new Trades({
               sendingSymbol: from,
               sending: amount,
               receivingSymbol: to,
               receiving: swap.receiving,
               userId: user._id,
          });

          await trade.save();

          return res.status(200).json({
               success: true,
               message: 'Instant swap rate retrieved successfully',
               data: swap,
               tradeId: trade._id
          });

     } catch (error) {
          console.log("********* error", error);
          return res.status(500).json({ message: 'Server error' });
     }
}

const confirmInstantBuy = async (req, res) => {
     try {
          const { tradeId } = req.body;
          const user = req.user;


          const trade = await Trades.findOne({ _id: tradeId, userId: user._id });
          if (!trade) {
               return res.status(404).json({
                    success: false,
                    message: 'Trade not found'
               });
          }

          // Only allow confirming pending trades
          // if (trade.status !== 'pending') {
          //      return res.status(400).json({
          //           success: false,
          //           message: 'Trade cannot be confirmed'
          //      });
          // }


          const swap = await ExchangeToken(trade.sending, trade.sendingSymbol, trade.receivingSymbol);


          trade.status = 'completed';
          trade.receiving = swap.receiving;
          trade.updatedAt = Date.now();


          let userReceivingAddress = await getUserAddress(trade.receivingSymbol, user);
          let adminReceivingAddress = await getAdminAddress(trade.sendingSymbol);

          let userSendingAddress = await getUserAddress(trade.sendingSymbol, user);
          let adminSendingAddress = await getAdminAddress(trade.receivingSymbol);

          if (!userReceivingAddress || !adminReceivingAddress || !userSendingAddress || !adminSendingAddress) {
               return res.status(400).json({
                    success: false,
                    message: 'Receiving or sending address not found'
               });
          }



          await trade.save();

          const resp1 = await sendTokenFromUserToAdmin(userSendingAddress, adminReceivingAddress, trade.sending, trade.sendingSymbol);

          // const resp2 = await sendTokenFromAdminToUser(adminSendingAddress, userReceivingAddress, trade.receiving, trade.receivingSymbol);

          // console.log("********* resp1", resp1);
          // console.log("********* resp2", resp2);

          return res.status(200).json({
               success: true,
               message: 'Trade confirmed successfully',
               data: trade
          });

     } catch (error) {
          console.log("********* error", error);
          return res.status(500).json({ message: 'Server error' });
     }
}


const getAllP2pCryptos = async (req, res) => {
     try {
          const cryptos = await p2pCrypto.find({}).sort({ createdAt: -1 });
          return res.status(200).json({
               success: true,
               message: "P2P Cryptos fetched successfully",
               data: cryptos
          });
     } catch (error) {
          console.error("Error fetching cryptos:", error);
          return res.status(500).json({
               success: false,
               message: "Server error while fetching cryptos",
               error: error.message
          });
     }
};

const uploadNIN = async (req, res) => {
     try {
          if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
               return res.status(400).json({ message: 'No file uploaded' });
          }
          // Save file URL to the user's profile
          await User.findByIdAndUpdate(req.user._id, { ninDocument: SystemEncrypt(req.uploadedFiles[0]) });
          return res.status(200).json({ message: 'NIN uploaded successfully' });
     } catch (error) {
          console.error('Error uploading NIN:', error);
          return res.status(500).json({ message: 'Server error' });
     }
};

const uploadProofOfAddress = async (req, res) => {
     try {
          if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
               return res.status(400).json({ message: 'No file uploaded' });
          }
          // Save file URL to the user's profile
          await User.findByIdAndUpdate(req.user._id, { proofOfAddress: SystemEncrypt(req.uploadedFiles[0]) });
          return res.status(200).json({ message: 'Proof of address uploaded successfully' });
     } catch (error) {
          console.error('Error uploading proof of address:', error);
          return res.status(500).json({ message: 'Server error' });
     }
};

const getAllPaymentMethods = async (req, res) => {
     try {
          const paymentMethods = await PaymentMethod.find({});
          return res.status(200).json({
               success: true,
               message: 'Payment methods retrieved successfully',
               data: paymentMethods
          });
     } catch (error) {
          console.error('Error fetching payment methods:', error);
          return res.status(500).json({ message: 'Server error' });
     }
};

const addUserP2PPaymentMethod = async (req, res) => {
     try {
          const { paymentMethodId, fields } = req.body;
          let userId = req.user._id;

          const paymentMethod = await PaymentMethod.findById(paymentMethodId);
          if (!paymentMethod) {
               return res.status(404).json({ message: 'Payment method not found' });
          }

          for (const field of paymentMethod.fields) {
               if (field.isRequired && !fields[field.fieldName]) {
                    return res.status(400).json({ message: `${field.fieldName} is required` });
               }
          }

          const newP2PPaymentMethod = new P2PPaymentMethod({
               user: userId,
               paymentMethodId,
               fields: [
                    ...Object.entries(fields).map(([fieldName, value]) => ({ fieldName, value })),
                    // { fieldName: "Name", value: req.user.name }
               ]
          });

          await newP2PPaymentMethod.save();

          return res.status(200).json({ message: 'P2P payment method added successfully' });
     } catch (error) {
          console.error('Error adding P2P payment method:', error);
          return res.status(500).json({ message: 'Server error' });
     }
};

const getUserP2PPaymentMethods = async (req, res) => {
     try {
          let userId = req.user._id;

          let userPaymentMethods = await P2PPaymentMethod.find({ user: userId })

          userPaymentMethods = userPaymentMethods.map(method => ({
               fields: [
                    ...method.fields,
                    { fieldName: "Name", value: req.user.name }
               ],
               paymentMethodId: method.paymentMethodId
          }));

          return res.status(200).json({
               success: true,
               message: 'User P2P payment methods retrieved successfully',
               data: userPaymentMethods
          });
     } catch (error) {
          console.error('Error fetching user P2P payment methods:', error);
          return res.status(500).json({ message: 'Server error' });
     }
};

const uploadProfilePicture = async (req, res) => {
     try {
          if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
               return res.status(400).json({ message: 'No file uploaded' });
          }

          // Save file URL to the user's profile
          await User.findByIdAndUpdate(req.user._id, { profilePicture: req.uploadedFiles[0] });

          return res.status(200).json({ message: 'Profile picture uploaded successfully', profilePicture: req.uploadedFiles[0] });
     } catch (error) {
          console.error('Error uploading profile picture:', error);
          return res.status(500).json({ message: 'Server error' });
     }
};

const verifyBVN = async (req, res) => {
     try {
          const { bvnNumber, dateOfBirth, gender } = req.body;
          const user = req.user;

          if (!bvnNumber || !dateOfBirth || !gender) {
               return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
               });
          }

          const verificationResult = await qoreIdClient.verifyBVN(bvnNumber, {
               firstname: user.name.split(' ')[0],
               lastname: user.name.split(' ').slice(1).join(' '),
               dob: dateOfBirth,
               phone: user.phone,
               email: user.email,
               gender
          });

          if (!verificationResult.success) {
               return res.status(400).json({
                    success: false,
                    message: verificationResult.error
               });
          }

          await User.findByIdAndUpdate(user._id, {
               bvnNumber,
               bvnVerified: true,
               bvnVerificationData: verificationResult.data,
               dateOfBirth,
               gender,
               kycLevel: 1,
               kycStatus: 'verified'
          });

          return res.status(200).json({
               success: true,
               message: 'BVN verification successful',
               data: verificationResult.data
          });
     } catch (error) {
          console.error('BVN verification error:', error);
          return res.status(500).json({
               success: false,
               message: 'Internal server error'
          });
     }
};

const getKYCStatus = async (req, res) => {
     try {
          const user = await User.findById(req.user._id).select('kycLevel kycStatus ninVerified bvnVerified');

          return res.status(200).json({
               success: true,
               data: {
                    kycLevel: user.kycLevel,
                    kycStatus: user.kycStatus,
                    verifications: {
                         nin: user.ninVerified,
                         bvn: user.bvnVerified
                    }
               }
          });
     } catch (error) {
          console.error('KYC status error:', error);
          return res.status(500).json({
               success: false,
               message: 'Internal server error'
          });
     }
};

const submitNINVerification = async (req, res) => {
     try {
          const { ninNumber, dateOfBirth, gender, firstName, lastName } = req.body;
          const user = req.user;

          // Check if user already has NIN verification
          if (user.ninVerified) {
               return res.status(201).json({
                    success: true,
                    message: 'NIN verification already completed for this user'
               });
          }

          if (!ninNumber || !dateOfBirth || !gender || !firstName || !lastName) {
               return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
               });
          }

          // Check if NIN has been used before
          const existingNIN = await ninVerificationData.findOne({
               'data.nin.nin': ninNumber
          });

          if (existingNIN) {
               return res.status(400).json({
                    success: false,
                    message: 'This NIN has already been registered'
               });
          }

          // Convert names to lowercase for comparison
          const userNameLower = user.name.toLowerCase();
          const firstNameLower = firstName.toLowerCase();
          const lastNameLower = lastName.toLowerCase();

          // Check if both firstName and lastName exist in user.name
          if (!userNameLower.includes(firstNameLower) || !userNameLower.includes(lastNameLower)) {
               return res.status(400).json({
                    success: false,
                    message: 'First name and last name must match your profile name'
               });
          }

          const verificationResult = await qoreIdClient.verifyNIN(ninNumber, {
               firstname: firstName.toUpperCase(),
               lastname: lastName.toUpperCase(),
               dob: dateOfBirth,
               phone: user.phone,
               email: user.email,
               gender
          });

          if (!verificationResult.success) {
               console.log(verificationResult);
               console.log(verificationResult.error);
               return res.status(400).json({
                    success: false,
                    message: verificationResult.error
               });
          }

          // Create NIN verification data record
          await ninVerificationData.create({
               userId: user._id,
               success: true,
               message: 'NIN verification successful',
               data: {
                    id: verificationResult.data.id,
                    applicant: {
                         firstname: verificationResult.data.applicant.firstname,
                         lastname: verificationResult.data.applicant.lastname
                    },
                    summary: {
                         nin_check: {
                              status: verificationResult.data.summary.nin_check.status,
                              fieldMatches: {
                                   firstname: verificationResult.data.summary.nin_check.fieldMatches.firstname,
                                   lastname: verificationResult.data.summary.nin_check.fieldMatches.lastname,
                                   gender: verificationResult.data.summary.nin_check.fieldMatches.gender,
                                   emailAddress: verificationResult.data.summary.nin_check.fieldMatches.emailAddress
                              }
                         }
                    },
                    status: {
                         state: verificationResult.data.status.state,
                         status: verificationResult.data.status.status
                    },
                    nin: {
                         nin: verificationResult.data.nin.nin,
                         firstname: verificationResult.data.nin.firstname,
                         lastname: verificationResult.data.nin.lastname,
                         middlename: verificationResult.data.nin.middlename,
                         phone: verificationResult.data.nin.phone,
                         gender: verificationResult.data.nin.gender,
                         birthdate: verificationResult.data.nin.birthdate,
                         photo: verificationResult.data.nin.photo
                    }
               }
          });

          await User.findByIdAndUpdate(user._id, {
               ninNumber,
               ninVerified: true,
               ninVerificationData: verificationResult.data,
               dateOfBirth,
               gender,
               kycLevel: Math.max(user.kycLevel, 1),
               kycStatus: 'pending'
          });

          return res.status(200).json({
               success: true,
               message: 'NIN verification successful',
               // data: verificationResult.data
          });
     } catch (error) {
          console.error('NIN verification error:', error);
          return res.status(500).json({
               success: false,
               message: 'Internal server error'
          });
     }
};

const approveOrDenyMerchant = async (req, res) => {
     try {
          const { userId, action } = req.body; // action can be 'approve' or 'deny'

          if (!userId || !['approve', 'deny'].includes(action)) {
               return res.status(400).json({
                    success: false,
                    message: 'Invalid request parameters',
               });
          }

          const user = await User.findById(userId);
          if (!user) {
               return res.status(404).json({
                    success: false,
                    message: 'User not found',
               });
          }

          if (action === 'approve') {
               user.isMerchant = true;
               user.kycStatus = 'verified';
          } else {
               user.isMerchant = false;
               user.kycStatus = 'rejected';
          }

          await user.save();

          return res.status(200).json({
               success: true,
               message: `Merchant status ${action}d successfully`,
          });
     } catch (error) {
          console.error('Error in merchant approval/denial:', error);
          return res.status(500).json({
               success: false,
               message: 'Internal server error',
          });
     }
};

const getAllNINSubmissions = async (req, res) => {
     try {
          const submissions = await ninVerificationData.find({});
          return res.status(200).json({
               success: true,
               message: 'NIN submissions retrieved successfully',
               data: submissions
          });
     } catch (error) {
          console.error('Error fetching NIN submissions:', error);
          return res.status(500).json({
               success: false,
               message: 'Internal server error'
          });
     }
};


const updateUserSettings = async (req, res) => {
     try {
          const user = req.user;
          const { toggleSettings } = req.body;

          // Update user settings in the database
          const updatedUser = await User.findByIdAndUpdate(
               user._id,
               {
                    settings: {
                         toggleSettings,
                    }
               },
               { new: true }
          ).select('settings lastLogin kycStatus profilePicture uid phone name email isMerchant isVerified createdAt');

          return res.status(200).json({
               success: true,
               message: 'Settings updated successfully',
               data: updatedUser
          });
     } catch (error) {
          console.error('Error updating settings:', error);
          return res.status(500).json({
               success: false,
               message: 'Internal server error'
          });
     }
};

const getUserSettings = async (req, res) => {
     try {
          const user = req.user;

          // Retrieve user settings from the database
          const userSettings = await User.findById(user._id).select('settings lastLogin kycStatus profilePicture uid phone name email isMerchant isVerified createdAt');

          return res.status(200).json({
               success: true,
               message: 'Settings retrieved successfully',
               data: userSettings
          });
     } catch (error) {
          console.error('Error retrieving settings:', error);
          return res.status(500).json({
               success: false,
               message: 'Internal server error'
          });
     }
};

const merchantRequest = async (req, res) => {
     try {
          const user = await User.findById(req.user);

          // Check if the user is already a merchant
          if (user.isMerchant) return res.status(406).json({ message: 'Already a merchant' });

          let existingRequest = MerchantRequest.find({ _id: user._id })

          if (existingRequest) {
               if (existingRequest.status === 'accepted') return res.status(406).json({ message: 'Already accepted' });
               else if (existingRequest.status === 'pending') return res.status(406).json({ message: 'Currently being reviwed' });
               else if (existingRequest.status === 'failed') {
                    // Calculate time difference in hours
                    const now = new Date();
                    const updatedAt = new Date(existingRequest.updatedAt);
                    const diffInHours = (now - updatedAt) / (1000 * 60 * 60);

                    if (diffInHours < 48) {
                         return res.status(406).json({ message: 'Request failed less than 48 hours ago. Please try later.' });
                    }
               }
          }

          let request = new MerchantRequest({
               user: user
          });

          await request.save();

          // TODO: Add notification to send to admins

          return res.status(200).json({
               success: true,
               message: 'Merchant Request saved'
          });

     } catch (error) {
          console.error('Error :', error);
          return res.status(500).json({
               success: false,
               message: 'Internal server error'
          });
     }
}


const getInstantTradeCoins = async (req, res) => {
     try {
          const selectedCoins = ["USDT", "BTC", "ETH", "USDC"];

          // Fetch the list of coins
          const coinListResponse = await getCoinList();
          const { code, msg, data } = JSON.parse(coinListResponse);

          if (code !== 10000 || msg !== "success") {
               return res.status(500).json({
                    success: false,
                    message: "Failed to retrieve coin list",
               });
          }


          const result = await getNairaInUsd();
          const dollarPerNaira = result.rates["USD"] || 0;

          const coins = data.coins;
          const filteredCoins = [
               {
                    symbol: "NGN",
                    name: "Naira",
                    price: dollarPerNaira,
                    logoUrl: "https://cdn-icons-png.flaticon.com/512/32/32974.png",
                    coinId: 1111
               }
          ];

          // Filter and format coins based on selectedCoins
          for (const coin of coins) {
               if (selectedCoins.includes(coin.symbol)) {
                    filteredCoins.push({
                         symbol: coin.symbol,
                         name: coin.name,
                         price: parseFloat(coin.price),
                         logoUrl: coin.logoUrl,
                         coinId: coin.coinId
                    });
               }
          }

          return res.status(200).json({
               success: true,
               message: 'Instant trade coins retrieved successfully',
               data: filteredCoins
          });
     } catch (error) {
          console.error('Error :', error);
          return res.status(500).json({
               success: false,
               message: 'Internal server error'
          });
     }
}

const createDummyNotifications = async (req, res) => {
     try {
          const user = await User.findById(req.user);// From tokenRequired middleware (assumes MongoDB ObjectId)

          const userId = user._id;
 
         const dummyNotifications = [
             {
                 user: userId,
                 content: "Welcome to the platform!",
                 type: "welcome",
                 timestamp: new Date(),
             },
             {
                 user: userId,
                 content: "Your profile has been viewed 5 times.",
                 type: "profile_view",
                 timestamp: new Date(),
             },
             {
                 user: userId,
                 content: "New feature available: Check it out!",
                 type: "update",
                 timestamp: new Date(),
             },
         ];
 
         const createdNotifications = await Notification.insertMany(dummyNotifications);
 
         res.status(201).json({
             status: true,
             message: "Dummy notifications created successfully",
             notifications: createdNotifications,
         });
     } catch (error) {
         console.error(error);
         res.status(500).json({
             status: false,
             error: error.message,
         });
     }
 };

module.exports = {
     getUserProfile,
     updateUserProfile,
     addBankAccount,
     withdrawRequest,
     getInstantBuyRate,
     confirmInstantBuy,
     getAllP2pCryptos,
     uploadNIN,
     uploadProofOfAddress,
     getAllPaymentMethods,
     addUserP2PPaymentMethod,
     getUserP2PPaymentMethods,
     uploadProfilePicture,
     verifyBVN,
     getKYCStatus,
     submitNINVerification,
     approveOrDenyMerchant,
     getAllNINSubmissions,
     updateUserSettings,
     getUserSettings,
     merchantRequest,
     getInstantTradeCoins,
     createDummyNotifications
};
