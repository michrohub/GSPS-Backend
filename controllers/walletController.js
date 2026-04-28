const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');

// @desc    Request withdrawal
// @route   POST /api/wallet/withdraw
// @access  Private
exports.requestWithdrawal = async (req, res) => {
    try {
        const { amount, method, details } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }

        if (user.walletBalance < amount) {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }

        // Immediately update walletBalance
        user.walletBalance -= amount;
        await user.save();

        const transaction = await WalletTransaction.create({
            user: req.user.id,
            type: 'withdrawal',
            amount,
            method,
            details,
            walletBalanceAfter: user.walletBalance,
            status: 'pending'
        });

        res.status(201).json({ 
            transaction,
            newBalance: user.walletBalance,
            message: 'Withdrawal request submitted. Balance deducted.' 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Request deposit
// @route   POST /api/wallet/deposit
// @access  Private
exports.requestDeposit = async (req, res) => {
    try {
        const { amount, method, proof, transactionId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        const transaction = await WalletTransaction.create({
            user: req.user.id,
            type: 'deposit',
            amount,
            method: method || 'bank',
            proof,
            details: {
                transactionId
            },
            status: 'pending'
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's transactions
// @route   GET /api/wallet/my-transactions
// @access  Private
exports.getMyTransactions = async (req, res) => {
    try {
        const transactions = await WalletTransaction.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin: Get all transactions
// @route   GET /api/admin/wallet/transactions
// @access  Admin
exports.adminGetAllTransactions = async (req, res) => {
    try {
        const transactions = await WalletTransaction.find()
            .populate('user', 'fullName email')
            .sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin: Update transaction status
// @route   PUT /api/admin/wallet/transactions/:id/status
// @access  Admin
exports.adminUpdateTransactionStatus = async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        const transaction = await WalletTransaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Prevent updating if already in a final state
        if (transaction.status === 'completed' || transaction.status === 'rejected' || (transaction.type === 'deposit' && transaction.status === 'approved')) {
            return res.status(400).json({ message: 'Transaction is already processed and cannot be changed' });
        }

        // Ensure only pending -> completed/rejected (withdrawal) or approved/rejected (deposit)
        if (transaction.status !== 'pending') {
             // Exception: approved withdrawal can go to completed
             if (!(transaction.type === 'withdrawal' && transaction.status === 'approved' && status === 'completed')) {
                return res.status(400).json({ message: 'Invalid status transition' });
             }
        }

        const user = await User.findById(transaction.user);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // DEPOSIT LOGIC
        if (transaction.type === 'deposit') {
            if (status === 'approved') {
                user.walletBalance += transaction.amount;
                await user.save();
            }
            // If rejected, nothing happens to balance
        }

        // WITHDRAWAL LOGIC
        if (transaction.type === 'withdrawal') {
            if (status === 'rejected') {
                // Refund balance since it was deducted instantly on request
                user.walletBalance += transaction.amount;
                await user.save();
            } else if (status === 'completed') {
                // Balance already deducted, nothing more to do
            } else if (status === 'approved') {
                // Just status update for now (intermediate state if used)
            }
        }

        transaction.status = status;
        transaction.adminNote = adminNote || transaction.adminNote;
        await transaction.save();

        res.json({ transaction, userBalance: user.walletBalance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
