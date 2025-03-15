let User = require('../model/user');
let Admin = require('../model/admin');
let { MerchantRequest } = require('../model/merchantRequests');
mongoose = require('mongoose');
// let { Mail } = require("../middleware/mail");
// let mail = new Mail();
// let OTP = require('../model/otp');
// let crypto = require('crypto');
require("dotenv").config();


const GetUsers = async (req, res) => {
     try {
         // Extract query parameters
         const { page = 1, limit = 10, search, type, status, verified } = req.query;
 
         // Convert page and limit to numbers
         const pageNumber = parseInt(page, 10);
         const limitNumber = parseInt(limit, 10);
         const skip = (pageNumber - 1) * limitNumber;
 
         // Build query filters
         let filter = {};
 
         if (search) {
             filter.name = { $regex: search, $options: "i" }; // Case-insensitive search
         }
 
         if (type) {
             filter.isMerchant = type === 'merchant'; // Match exact role
         }
 
         if (status) {
             filter.isLocked = status === "true"; // Convert to boolean
         }
 
         if (verified) {
             filter.ninVerified = verified === "true"; // Convert to boolean
         }
 
         // Fetch users with filters and pagination
         const users = await User.find(filter, {
             name: 1,
             email: 1,
             phone: 1,
             createdAt: 1,
             isMerchant: 1,
             profilePicture: 1,
             role: 1,
             ninVerified: 1,
             proofOfAddressVerified: 1,
             isLocked: 1,
             preferredLanguage: 1,
             socialLinks: 1,
             lastLogin: 1,
             failedLoginAttempts: 1,
             uid: 1,
             _id: 1
         })
         .skip(skip)
         .limit(limitNumber);
 
         // Get total count of matching users
         const totalUsers = await User.countDocuments(filter);
 
         // Calculate next page
         const hasNextPage = skip + users.length < totalUsers;
         const nextPage = hasNextPage ? pageNumber + 1 : null;
 
         res.status(200).json({
             users,
             totalUsers,
             currentPage: pageNumber,
             nextPage,
             totalPages: Math.ceil(totalUsers / limitNumber)
         });
 
     } catch (err) {
         console.error("Error fetching users:", err);
         res.status(500).json({ error: "Internal Server Error" });
     }
 };
 
 

const UpdateUserProfile = async (req, res) => {

    try {
         const {
              id,
              name,
              phone,
              isMerchant,
              isLocked  
         } = req.body;

         // Find the user to be updated
         if (!id) {
          return res.status(400).json({ success: false, message: 'User id missing'});
         }

         const user = await User.findById(id);
        //  console.log("User exists:", userExists._id);
        console.log(req.body);

         if (!user) {
          return res.status(404).json({ success: false, message: 'User not found'});
         }

         // Current user update logic (kept intact)
         const userUpdateFields = {};

         if (name) userUpdateFields.name = name;
         if (phone) userUpdateFields.phone = phone;
         if (isMerchant) userUpdateFields.isMerchant = isMerchant;
         if (isLocked === true) {
            console.log("LOCKING USER");
            userUpdateFields.isLocked = true;
            userUpdateFields.lockedReason = 'ADMIN_ACTION';
        } else if (isLocked === false) {
            console.log("UNLOCKING USER");
            userUpdateFields.isLocked = false;
            userUpdateFields.lockedReason = null;
        }
        

         // Proceed to update the user model and virtual account if needed
         console.log(userUpdateFields);
         if (Object.keys(userUpdateFields).length > 0) {
              await User.findByIdAndUpdate(user._id, userUpdateFields);
         }

         return res.status(200).json({
              success: true,
              message: 'Update submitted successfully',
              data: userUpdateFields
         });

    } catch (error) {
         console.log("Error updating user:", error);
         return res.status(500).json({
              success: false,
              message: 'Error updating user'
         });
    }
};

const GetMerchantRequests = async (req, res) => {
    try {
      // Fetch all merchant requests and populate user details (name and email)
      const requests = await MerchantRequest.find({}).populate('user', 'name email');
      return res.status(200).json({
        success: true,
        message: 'Merchant requests retrieved successfully.',
        requests
      });
    } catch (error) {
      console.error("Error retrieving merchant requests:", error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  
  const UpdateMerchantRequest = async (req, res) => {
    try {
      const { id, status } = req.body;
      const validStatuses = ['accepted', 'declined'];
      if (!id || !status) {
        return res.status(400).json({ success: false, message: 'Request id and status are required' });
      }
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status provided' });
      }
      const updatedRequest = await MerchantRequest.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true }
      );
      if (!updatedRequest) {
        return res.status(404).json({ success: false, message: 'Merchant request not found' });
      }
      return res.status(200).json({
        success: true,
        message: 'Merchant request updated successfully.',
      });
    } catch (error) {
      console.error("Error updating merchant request:", error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }; 

const GetAdmins = async (req, res) => {
  try {
    // Retrieve all admins, excluding the password field
    const admins = await Admin.find({}).select('-password');
    return res.status(200).json({
      success: true,
      message: 'Admins retrieved successfully',
      admins
    });
  } catch (error) {
    console.error("Error retrieving admins:", error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};  

const UpdateAdminManagement = async (req, res) => {
  try {
    const { adminId, role, isActive } = req.body;

    console.log("Here")
    console.log(isActive);

    // Validate required fields
    if (!adminId) {
      return res.status(400).json({ success: false, message: 'adminId, role, and isActive are required' });
    }

    // Validate role value
    if (role) {
      const validRoles = ['sub-admin', 'admin', 'contact-support'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role specified' });
      }
  }

    console.log(isActive);
    let updateData = {}

    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = new Date();

    console.log(updateData);
    // Update the admin document
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      updateData,
      { new: true }
    );

    // console.log(updatedAdmin);

    if (!updatedAdmin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


module.exports = {
    GetUsers,
    GetAdmins,
    UpdateUserProfile,
    UpdateAdminManagement,
    GetMerchantRequests,
    UpdateMerchantRequest
}