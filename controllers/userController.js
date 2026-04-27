const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { uploadToCloudinary } = require('../config/cloudinary');

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

        if (req.file) {
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
                referralCode: user.referralCode
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
