const { S3Client, PutObjectCommand, DeleteObjectCommand  } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config();

const s3Client = new S3Client({
     region: process.env.AWS_REGION,
     credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
     }
});

const createError = (statusCode, message) => {
     const error = new Error(message);
     error.status = statusCode;
     return error;
 };
 

/**
 * Uploads a file to AWS S3
 * @param {Object} file - The file object from multer
 * @param {string} folder - The folder path in S3 bucket (e.g., 'appeals/evidence')
 * @returns {Promise<string>} - Returns the URL of the uploaded file
 */
const uploadToS3 = async (file, folder = '') => {
     try {
          if (!file) {
               throw createError(400, 'No file provided');
          }

          const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;

          const command = new PutObjectCommand({
               Bucket: process.env.AWS_S3_BUCKET_NAME,
               Key: fileName,
               Body: file.buffer,
               ContentType: file.mimetype,
               //   ACL: 'public-read'
          });

          try {
               await s3Client.send(command);
               return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
          } catch (s3Error) {
               console.error('S3 Upload Details:', {
                    bucket: process.env.AWS_S3_BUCKET_NAME,
                    key: fileName,
                    error: s3Error.message,
                    code: s3Error.code
               });
               throw createError(500, `S3 Upload Failed: ${s3Error.message}`);
          }

     } catch (error) {
          console.error('S3 Upload Error:', error);
          throw createError(500, 'Failed to upload file to S3');
     }
};

/**
 * Deletes a file from AWS S3
 * @param {string} fileUrl - The complete URL of the file to delete
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (fileUrl) => {
     try {
          if (!fileUrl) {
               throw createError(400, 'No file URL provided');
          }
          const key = fileUrl.split('.com/')[1];

          const params = {
               Bucket: process.env.AWS_S3_BUCKET_NAME,
               Key: key
          };

          await s3Client.send(new DeleteObjectCommand(params));

     } catch (error) {
          console.error('S3 Delete Error:', error);
          throw createError(500, 'Failed to delete file from S3');
     }
};

/**
 * Validates file type and size
 * @param {Object} file - The file object from multer
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {boolean}
 */
const validateFile = (file, allowedTypes, maxSize) => {
     if (!allowedTypes.includes(file.mimetype)) {
          throw createError(400, 'Invalid file type');
     }

     if (file.size > maxSize) {
          throw createError(400, `File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
     }

     return true;
};

module.exports = {
     uploadToS3,
     deleteFromS3,
     validateFile
}; 