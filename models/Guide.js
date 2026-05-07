const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    menuKey: {
        type: String,
        required: true,
        enum: ['overview', 'referrals', 'wallet', 'deposit', 'withdraw', 'kyc', 'service', 'profile']
    },
    content: {
        type: String, // HTML string from editor
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Guide', guideSchema);
