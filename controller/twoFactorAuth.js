
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../model/user');
require('dotenv').config();

const generate2FASecret = async (req, res) => {
     try {
          const secret = speakeasy.generateSecret({
               name: `${process.env.APP_NAME}:${process.env.APP_DESC}`
          });

          // Store temp secret
          await User.findByIdAndUpdate(req.user._id, {
               twoFactorTempSecret: secret.base32
          });

          // Generate QR code
          const qrCode = await QRCode.toDataURL(secret.otpauth_url);

          res.json({
               secret: secret.base32,
               qrCode
          });
     } catch (error) {
          res.status(500).json({ error: error.message });
     }
}

const verify2FACode = async (req, res) => {
     try {
          const { token } = req.body;
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

const disable2FACode = async (req, res) => {
     try {
          const { token } = req.body;
          const user = req.user;

          const verified = speakeasy.totp.verify({
               secret: user.twoFactorSecret,
               encoding: 'base32',
               token
          });

          if (!verified) {
               return res.status(400).json({ error: 'Invalid verification code' });
          }

          await User.findByIdAndUpdate(user._id, {
               twoFactorSecret: null,
               isTwoFactorEnabled: false
          });

          res.json({ message: '2FA disabled successfully' });
     } catch (error) {
          res.status(500).json({ error: error.message });
     }
}

module.exports = {
     generate2FASecret,
     verify2FACode,
     disable2FACode
}