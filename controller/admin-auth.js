let bcrypt = require('bcryptjs');
let User = require('../model/user');
let Admin = require('../model/admin');
let jwt = require("jsonwebtoken");
let { v4: uuidv4 } = require('uuid');
let { Mail } = require("../middleware/mail");
const { generateUniqueUID } = require('../utils/helper');
let mail = new Mail();
let OTP = require('../model/otp');
let crypto = require('crypto');
require("dotenv").config();


const registerAdminUser = async (req, res) => {
    let { name, email, password, role } = req.body;

    try {

        // Validate the email and check if it already exists
        const validRoles = ['sub-admin', 'admin', 'customer-support'];

        if (!(validRoles.includes(role))) {
            return res.status(401).json({
                 status: false,
                 message: "Invalid admin credentials.",
                 error: "NOT PERMITTED"
            });
       }

        let lowerCaseEmail = email.toLowerCase().trim();

        let existingUser = await User.findOne({ email: lowerCaseEmail });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let existingAdminUser = await Admin.findOne({ email: lowerCaseEmail });

        if (existingAdminUser) {
            console.log(existingAdminUser);
            return res.status(400).json({ message: 'User already exists' });
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
            role: role
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

const verifyAdminOTP = async (req, res) => {
    let { email, otp } = req.body;

    try {
        let otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        await OTP.deleteOne({ _id: otpRecord._id });

        let { password, name, role } = otpRecord;
        const uid = await generateUniqueUID();

        // Create the admin
        let newUser = new Admin({
            name: name,
            email: email,
            password: password,
            role: role,
            uid: uid
        });

        let result = await newUser.save();


        await mail.welcomeEmail(result);

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            },
        });
    } catch (error) {
        console.log("*********00 error", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const resendAdminOTP = async (req, res) => {
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

const loginAdminUser = async (req, res) => {
    let { email, password, twoFactorCode } = req.body;

    try {
        let lowerCaseEmail = email.toLowerCase().trim();
        let user = await Admin.findOne({ email: lowerCaseEmail });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        let isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

        let adminData = {
            admin: {
                id: user._id,
                role: user.role
            }
            // email: user.email,
        };
        token = await jwt.sign(adminData, process.env.SECRET_KEY, {
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
                role: user.role
            },
            token
        });
    } catch (error) {
        console.log("********* error", error)
        return res.status(500).json({ message: 'Server error' });
    }
};

const GetAdminProfile = async (req, res) => {
    try {
        // Assuming req.user contains the authenticated admin's details, including _id
        const adminId = req.admin;
        console.log(adminId);
        
        // Find the admin profile by ID
        const adminProfile = await Admin.findById(adminId).select('-password'); // Exclude password field
        
        if (!adminProfile) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Admin profile retrieved successfully',
            data: adminProfile
        });
    } catch (error) {
        console.error("Error retrieving admin profile:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


module.exports = {
    registerAdminUser,
    verifyAdminOTP,
    resendAdminOTP,
    loginAdminUser,
    GetAdminProfile
}



