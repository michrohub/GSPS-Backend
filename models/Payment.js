const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentType: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    purpose: String,
    invoiceDocument: String, // Path to file
    transactionId: String,
    screenshot: String, // Cloudinary URL
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeApplication'
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Rejected', 'Pending Verification'],
        default: 'Pending'
    },
    savingsAmount: {
        type: Number,
        default: 0
    },
    adminNote: String
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
