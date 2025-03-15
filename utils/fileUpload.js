const multer = require('multer');
const { uploadToS3 } = require('./s3Upload');

const createError = (statusCode, message) => {
     const error = new Error(message);
     error.status = statusCode;
     return error;
 };

const storage = multer.memoryStorage();
const upload = multer({
     storage,
     limits: {
          fileSize: 5 * 1024 * 1024 // 5MB limit
     },
     fileFilter: (req, file, cb) => {
          const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
          if (!allowedTypes.includes(file.mimetype)) {
               cb(createError(400, 'Invalid file type'), false);
          }
          cb(null, true);
     }
});

/**
 * Validates file size
 * @param {Object} file - The file object
 * @param {Object} options - Validation options
 * @returns {Promise<void>}
 */
const validateFile = async (file, options = {}) => {
     const {
          maxSize = 5 * 1024 * 1024, // 5MB default
     } = options;

     if (file.size > maxSize) {
          throw createError(400, `File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
     }
};

/**
 * Handles multiple file uploads with validation
 * @param {string} fieldName - Form field name for files
 * @param {Object} options - Upload options
 * @returns {Function} Express middleware
 */
const handleFileUpload = (fieldName, options = {}) => {
     const {
          maxFiles = 5,
          destination = 'uploads',
          ...validationOptions
     } = options;

     const uploadMiddleware = upload.array(fieldName, maxFiles);

     return async (req, res, next) => {
          try {
               await new Promise((resolve, reject) => {
                    uploadMiddleware(req, res, (err) => {
                         if (err instanceof multer.MulterError) {
                              reject(createError(400, err.message));
                         } else if (err) {
                              reject(createError(500, 'File upload failed'));
                         }
                         resolve();
                    });
               });

               if (!req.files || req.files.length === 0) {
                    return next();
               }

               const uploadPromises = req.files.map(async (file) => {
                    await validateFile(file, validationOptions);

                    // Upload to S3
                    const fileUrl = await uploadToS3(file, destination);
                    return fileUrl;
               });

               const uploadedUrls = await Promise.all(uploadPromises);

               req.uploadedFiles = uploadedUrls;

               next();
          } catch (error) {
               next(error);
          }
     };
};

module.exports = {
     handleFileUpload
}; 