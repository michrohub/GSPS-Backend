const Payment = require('../models/Payment');
const User = require('../models/User');
const FeeApplication = require('../models/FeeApplication');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Create Payment Request
// @route   POST /api/payments/request
exports.createPaymentRequest = async (req, res) => {
    try {
        const { paymentType, amount, currency, purpose, applicationId, transactionId } = req.body;
        const user = await User.findById(req.user.id);

        let discountRate = 0.20; // Default Silver (20%)
        if (user.tier === 'Gold') discountRate = 0.25; // Gold (25%)
        if (user.tier === 'Diamond') discountRate = 0.30; // Diamond/Premium (30%)

        const savingsAmount = (amount * discountRate).toFixed(2);

        let invoiceUrl = null;
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, 'payments');
            invoiceUrl = result.secure_url;
        }

        const payment = await Payment.create({
            user: req.user.id,
            paymentType,
            amount,
            currency,
            purpose,
            savingsAmount,
            invoiceDocument: invoiceUrl,
            screenshot: invoiceUrl,
            transactionId,
            application: applicationId || null,
            status: applicationId ? 'Pending Verification' : 'Pending'
        });

        // If it's a payment for a fee application, link it
        if (applicationId) {
            await FeeApplication.findByIdAndUpdate(applicationId, {
                payment: payment._id
            });
        }

        res.status(201).json({
            message: 'Payment request submitted successfully',
            payment
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get User Payment History
// @route   GET /api/payments/my
exports.getMyPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user.id }).sort('-createdAt');
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
