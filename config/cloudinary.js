const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

/**
 * Uploads a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer from multer memory storage
 * @param {string} folder - Optional folder name in Cloudinary
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, folder = 'gsps_uploads') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

module.exports = { cloudinary, uploadToCloudinary };
