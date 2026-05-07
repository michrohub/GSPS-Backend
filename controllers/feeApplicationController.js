const FeeApplication = require('../models/FeeApplication');
const FeeType = require('../models/FeeType');
const Payment = require('../models/Payment');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Get all fee types
// @route   GET /api/fee-applications/fee-types
exports.getFeeTypes = async (req, res) => {
    try {
        const types = await FeeType.find().sort({ name: 1 });
        res.json(types);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create fee type (Admin only)
// @route   POST /api/fee-applications/fee-types
exports.createFeeType = async (req, res) => {
    try {
        const { name, description } = req.body;
        const typeExists = await FeeType.findOne({ name });
        if (typeExists) {
            return res.status(400).json({ message: 'Fee type already exists' });
        }
        const type = await FeeType.create({ name, description });
        res.status(201).json(type);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Apply for a fee
// @route   POST /api/fee-applications/apply
exports.applyFee = async (req, res) => {
    try {
        const { feeTypeId, country, paymentLink, portalAccess, initialAmount } = req.body;

        const feeType = await FeeType.findById(feeTypeId);
        if (!feeType) {
            return res.status(404).json({ message: 'Fee type not found' });
        }

        const application = await FeeApplication.create({
            user: req.user._id,
            feeType: feeTypeId,
            feeTypeName: feeType.name,
            country,
            paymentLink,
            portalAccess,
            initialAmount,
            status: 'Pending'
        });

        res.status(201).json({
            message: 'Application submitted successfully',
            application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in student's applications
// @route   GET /api/fee-applications/my
exports.getStudentApplications = async (req, res) => {
    try {
        const applications = await FeeApplication.find({ user: req.user._id })
            .populate('payment')
            .sort({ createdAt: -1 });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all applications (Admin)
// @route   GET /api/fee-applications/all
exports.getAllApplications = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        
        const applications = await FeeApplication.find(filter)
            .populate('user', 'fullName email phone')
            .populate('payment')
            .sort({ createdAt: -1 });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update application status (Admin)
// @route   PUT /api/fee-applications/:id/status
exports.updateStatus = async (req, res) => {
    try {
        const { status, rejectionReason, finalAmount } = req.body;
        const application = await FeeApplication.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        application.status = status;

        if (status === 'Rejected') {
            if (!rejectionReason) {
                return res.status(400).json({ message: 'Rejection reason is required' });
            }
            application.rejectionReason = rejectionReason;
        }

        if (status === 'Completed') {
            if (!finalAmount) {
                return res.status(400).json({ message: 'Final payment amount is required to complete' });
            }
            application.finalAmount = finalAmount;
            
            // If file was uploaded
            if (req.file) {
                const result = await uploadToCloudinary(req.file.buffer, 'invoices');
                application.invoiceUrl = result.secure_url;
            }
        }

        await application.save();


        res.json({ message: `Application marked as ${status}`, application });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update fee type (Admin only)
// @route   PUT /api/fee-applications/fee-types/:id
exports.updateFeeType = async (req, res) => {
    try {
        const { name, description } = req.body;
        const type = await FeeType.findById(req.params.id);
        if (!type) {
            return res.status(404).json({ message: 'Fee type not found' });
        }
        type.name = name || type.name;
        type.description = description || type.description;
        await type.save();
        res.json(type);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete fee type (Admin only)
// @route   DELETE /api/fee-applications/fee-types/:id
exports.deleteFeeType = async (req, res) => {
    try {
        const type = await FeeType.findById(req.params.id);
        if (!type) {
            return res.status(404).json({ message: 'Fee type not found' });
        }
        await type.deleteOne();
        res.json({ message: 'Fee type removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
