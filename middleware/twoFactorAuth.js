const speakeasy = require('speakeasy');
const User = require('../model/user');

const require2FA = async (req, res, next) => {
     try {
          let user = req.user;

          // Skip 2FA check if not enabled
          if (!user.isTwoFactorEnabled) {
               return next();
          }

          const { twoFactorCode } = req.body;

          if (!twoFactorCode) {
               return res.status(403).json({
                    error: 'Two-factor authentication code required'
               });
          }

          const verified = speakeasy.totp.verify({
               secret: user.twoFactorSecret,
               encoding: 'base32',
               token: twoFactorCode
          });

          if (!verified) {
               return res.status(403).json({
                    error: 'Invalid two-factor authentication code'
               });
          }

          next();
     } catch (error) {
          res.status(500).json({ error: error.message });
     }
};

const checkUserSecuritySettings = async (req, res, next) => {
     try {
          const user = await User.findById(req.user._id).select('settings');

          if (!user) {
               return res.status(404).json({
                    success: false,
                    message: 'User not found',
               });
          }

          const { enable2fa, googleAuthenticator, appLock } = user.settings.toggleSettings;

          if (enable2fa || googleAuthenticator || appLock) {
               // Perform additional checks or actions if needed
               console.log('User has enabled additional security settings.');
          }

          next();
     } catch (error) {
          console.error('Error checking user security settings:', error);
          return res.status(500).json({
               success: false,
               message: 'Internal server error',
          });
     }
};

module.exports = { require2FA, checkUserSecuritySettings }; 