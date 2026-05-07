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
const upload = require('../middleware/uploadMiddleware');

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
