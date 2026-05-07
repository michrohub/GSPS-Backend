const Guide = require('../models/Guide');

// @desc    Get all active guides (Student)
// @route   GET /api/guides
exports.getActiveGuides = async (req, res) => {
    try {
        const guides = await Guide.find({ isActive: true }).sort({ order: 1 });
        res.status(200).json({ success: true, data: guides });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Get single guide by slug (Student)
// @route   GET /api/guides/:slug
exports.getGuideBySlug = async (req, res) => {
    try {
        const guide = await Guide.findOne({ slug: req.params.slug, isActive: true });
        if (!guide) {
            return res.status(404).json({ success: false, message: 'Guide not found' });
        }
        res.status(200).json({ success: true, data: guide });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// Admin Controllers

// @desc    Get all guides (Admin)
// @route   GET /api/admin/guides
exports.getAllGuidesAdmin = async (req, res) => {
    try {
        const guides = await Guide.find().sort({ order: 1 });
        res.status(200).json({ success: true, data: guides });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Create a new guide
// @route   POST /api/admin/guides
exports.createGuide = async (req, res) => {
    try {
        console.log('Creating guide with body:', req.body);
        const { title, slug, menuKey, content, isActive, order } = req.body;
        
        // Basic validation
        if (!title || !slug || !menuKey || !content) {
            console.log('Validation failed:', { title, slug, menuKey, content: !!content });
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const guide = await Guide.create({ title, slug, menuKey, content, isActive, order });
        console.log('Guide created successfully:', guide._id);
        res.status(201).json({ success: true, data: guide });
    } catch (err) {
        console.error('Error creating guide:', err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Slug must be unique' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Update a guide
// @route   PUT /api/admin/guides/:id
exports.updateGuide = async (req, res) => {
    try {
        const guide = await Guide.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!guide) {
            return res.status(404).json({ success: false, message: 'Guide not found' });
        }
        res.status(200).json({ success: true, data: guide });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Delete a guide
// @route   DELETE /api/admin/guides/:id
exports.deleteGuide = async (req, res) => {
    try {
        const guide = await Guide.findByIdAndDelete(req.params.id);
        if (!guide) {
            return res.status(404).json({ success: false, message: 'Guide not found' });
        }
        res.status(200).json({ success: true, message: 'Guide deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Toggle guide status
// @route   PATCH /api/admin/guides/:id/status
exports.toggleGuideStatus = async (req, res) => {
    try {
        const guide = await Guide.findById(req.params.id);
        if (!guide) {
            return res.status(404).json({ success: false, message: 'Guide not found' });
        }
        guide.isActive = !guide.isActive;
        await guide.save();
        res.status(200).json({ success: true, data: guide });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};
