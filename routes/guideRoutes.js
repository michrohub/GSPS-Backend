const express = require('express');
const router = express.Router();
const { 
    getActiveGuides, 
    getGuideBySlug, 
    getAllGuidesAdmin, 
    createGuide, 
    updateGuide, 
    deleteGuide, 
    toggleGuideStatus 
} = require('../controllers/guideController');
const { protect, admin } = require('../middleware/authMiddleware');

// Student Routes (Protected but not admin required)
router.get('/', protect, getActiveGuides);
router.get('/:slug', protect, getGuideBySlug);

// Admin Routes
router.get('/admin/all', protect, admin, getAllGuidesAdmin);
router.post('/admin', protect, admin, createGuide);
router.put('/admin/:id', protect, admin, updateGuide);
router.delete('/admin/:id', protect, admin, deleteGuide);
router.patch('/admin/:id/status', protect, admin, toggleGuideStatus);

module.exports = router;
