const express = require('express');
const router = express.Router();
const { updateProfile, changePassword, applyReferralCode } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.put('/profile', protect, upload.single('profileImage'), updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/apply-referral', protect, applyReferralCode);

module.exports = router;
