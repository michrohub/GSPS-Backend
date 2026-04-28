const express = require('express');
const router = express.Router();
const { 
    applyFee, 
    getStudentApplications, 
    getAllApplications, 
    updateStatus, 
    getFeeTypes, 
    createFeeType,
    updateFeeType,
    deleteFeeType
} = require('../controllers/feeApplicationController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer config for invoice uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `invoice-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Public/Student Routes
router.get('/fee-types', getFeeTypes);
router.post('/apply', protect, applyFee);
router.get('/my', protect, getStudentApplications);

// Admin Routes
router.post('/fee-types', protect, admin, createFeeType);
router.put('/fee-types/:id', protect, admin, updateFeeType);
router.delete('/fee-types/:id', protect, admin, deleteFeeType);
router.get('/all', protect, admin, getAllApplications);
router.put('/:id/status', protect, admin, upload.single('invoice'), updateStatus);

module.exports = router;
