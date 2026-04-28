const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['deposit', 'withdrawal'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    method: {
        type: String,
        enum: ['bank', 'crypto'],
        required: true
    },
    details: {
        // For Bank Transfer
        bankName: String,
        fullName: String,
        accountNumber: String,
        routingNumber: String,
        // For Crypto Transfer
        network: String,
        walletAddress: String,
        // General
        transactionId: String // TRX ID for deposits
    },
    walletBalanceAfter: {
        type: Number, // Balance after deduction for withdrawals
    },
    proof: {
        type: String, // Cloudinary URL for deposits
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'completed', 'rejected'],
        default: 'pending'
    },
    adminNote: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
