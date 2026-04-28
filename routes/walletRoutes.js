const express = require('express');
const router = express.Router();
const { 
    requestWithdrawal, 
    requestDeposit, 
    getMyTransactions, 
    adminGetAllTransactions, 
    adminUpdateTransactionStatus 
} = require('../controllers/walletController');
const { protect, admin } = require('../middleware/authMiddleware');

// Student routes
router.post('/withdraw', protect, requestWithdrawal);
router.post('/deposit', protect, requestDeposit);
router.get('/my-transactions', protect, getMyTransactions);

// Admin routes
router.get('/admin/transactions', protect, admin, adminGetAllTransactions);
router.put('/admin/transactions/:id/status', protect, admin, adminUpdateTransactionStatus);

module.exports = router;
