const KYC = require('../models/KYC');
const User = require('../models/User');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Submit KYC
// @route   POST /api/kyc/submit
exports.submitKYC = async (req, res) => {
    try {
        const { studentName, whatsappNumber } = req.body;
        
        const existingKYC = await KYC.findOne({ user: req.user.id });
        if (existingKYC && existingKYC.status !== 'rejected') {
            return res.status(400).json({ message: 'KYC already submitted or approved' });
        }

        const documents = {};
        const fileFields = ['studentPhoto', 'passportFile', 'visaFile', 'universityDocument', 'gobDocument'];

        for (const field of fileFields) {
            // Check if URL was sent in body (direct frontend upload)
            if (req.body[field] && typeof req.body[field] === 'string' && req.body[field].startsWith('http')) {
                documents[field] = req.body[field];
            } 
            // Check if file was uploaded via multer
            else if (req.files && req.files[field] && req.files[field][0]) {
                const result = await uploadToCloudinary(req.files[field][0].buffer, 'kyc');
                documents[field] = result.secure_url;
            } 
            // Fallback to existing or null
            else {
                documents[field] = existingKYC ? existingKYC.documents[field] : null;
            }
        }

        const kycData = {
            user: req.user.id,
            studentName,
            whatsappNumber,
            documents
        };

        let kyc;
        if (existingKYC) {
            // Update rejected KYC
            kyc = await KYC.findByIdAndUpdate(existingKYC._id, kycData, { new: true });
        } else {
            kyc = await KYC.create(kycData);
        }

        // Update user KYC status
        await User.findByIdAndUpdate(req.user.id, { 
            kycStatus: 'pending',
            kycData: kyc._id 
        });

        res.status(201).json({
            message: 'KYC submitted successfully',
            kyc
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get User KYC Status
// @route   GET /api/kyc/status
exports.getKYCStatus = async (req, res) => {
    try {
        const kyc = await KYC.findOne({ user: req.user.id });
        if (!kyc) {
            return res.json({ status: 'none' });
        }
        res.json(kyc);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
