const User = require('../models/User');
const Payment = require('../models/Payment');
const bcrypt = require('bcryptjs');
const { uploadToCloudinary } = require('../config/cloudinary');
const { checkAndAwardReferralBonus } = require('./adminController');

// @desc    Update User Profile
// @route   PUT /api/user/profile
exports.updateProfile = async (req, res) => {
    try {
        const { fullName } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (fullName) user.fullName = fullName;

        if (req.body.profileImageUrl) {
            user.profileImage = req.body.profileImageUrl;
        } else if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, 'profiles');
            user.profileImage = result.secure_url;
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                kycStatus: user.kycStatus,
                profileImage: user.profileImage,
                termsAccepted: user.termsAccepted,
                tier: user.tier,
                walletBalance: user.walletBalance,
                referralCount: user.referralCount,
                referralCode: user.referralCode,
                isReferralCounted: user.isReferralCounted
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change Password
// @route   PUT /api/user/change-password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Apply Referral Code
// @route   POST /api/user/apply-referral
exports.applyReferralCode = async (req, res) => {
    try {
        const { referralCode } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.referredBy) {
            return res.status(400).json({ message: 'A referral code has already been applied to this account.' });
        }

        if (!referralCode || !referralCode.trim()) {
            return res.status(400).json({ message: 'Referral code cannot be empty.' });
        }

        const inputCode = referralCode.trim().toUpperCase();
        const inputNoPrefix = inputCode.replace('GSPS', '');
        
        // Super-Search: Match with/without prefix, case-insensitive
        const referrer = await User.findOne({
            referralCode: { $regex: new RegExp(`^(GSPS)?${inputNoPrefix}$`, 'i') }
        });

        if (!referrer) {
            return res.status(404).json({ message: `Code "${inputCode}" not found. Please ask your friend for their correct code.` });
        }

        if (referrer._id.toString() === user._id.toString()) {
            return res.status(400).json({ message: 'Nice try! You cannot refer yourself.' });
        }

        // Logic: Instant Mutual Rewards using updateOne to bypass schema validation errors on unrelated fields
        
        // 1. Link Referrer to User (No instant rewards anymore)
        await User.updateOne({ _id: user._id }, {
            $set: { 
                referredBy: referrer._id,
                isReferralCounted: false // Will be set to true after payment
            }
        });

        // Trigger check in case they already finished onboarding/payment
        await checkAndAwardReferralBonus(user._id);

        // Fetch updated user to return to frontend
        const updatedUser = await User.findById(user._id);

        res.json({ 
            message: 'Referral code applied! You will both receive a $50 bonus after you complete KYC and make your first payment.',
            user: {
                id: updatedUser._id,
                referredBy: updatedUser.referredBy,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                role: updatedUser.role,
                kycStatus: updatedUser.kycStatus,
                profileImage: updatedUser.profileImage,
                termsAccepted: updatedUser.termsAccepted,
                tier: updatedUser.tier,
                walletBalance: updatedUser.walletBalance,
                referralCount: updatedUser.referralCount,
                referralCode: updatedUser.referralCode,
                isReferralCounted: updatedUser.isReferralCounted
            }
        });
    } catch (error) {
        console.error('CRITICAL REFERRAL ERROR:', error);
        res.status(500).json({ message: 'Internal Server Error: ' + error.message });
    }
};
