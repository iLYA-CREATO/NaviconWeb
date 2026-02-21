const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../prisma/client');

// Get all bid attributes
router.get('/', authMiddleware, async (req, res) => {
    try {
        const attributes = await prisma.bidAttribute.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(attributes);
    } catch (error) {
        console.error('Get bid attributes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get enabled bid attributes
router.get('/enabled', authMiddleware, async (req, res) => {
    try {
        const attributes = await prisma.bidAttribute.findMany({
            where: { isEnabled: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(attributes);
    } catch (error) {
        console.error('Get enabled bid attributes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new bid attribute
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, type, options, isEnabled } = req.body;

        if (!name || !type) {
            return res.status(400).json({ message: 'Name and type are required' });
        }

        if (!['string', 'number', 'boolean', 'select', 'multiselect', 'image'].includes(type)) {
            return res.status(400).json({ message: 'Invalid type' });
        }

        if ((type === 'select' || type === 'multiselect') && (!Array.isArray(options))) {
            return res.status(400).json({ message: 'Options must be an array for select/multiselect type' });
        }

        const attribute = await prisma.bidAttribute.create({
            data: {
                name,
                type,
                options: (type === 'select' || type === 'multiselect') && options.length > 0 ? options : null,
                isEnabled: isEnabled !== undefined ? isEnabled : true,
            },
        });

        res.status(201).json(attribute);
    } catch (error) {
        console.error('Create bid attribute error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update bid attribute
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, options, isEnabled } = req.body;

        if (type && !['string', 'number', 'boolean', 'select', 'multiselect', 'image'].includes(type)) {
            return res.status(400).json({ message: 'Invalid type' });
        }

        if ((type === 'select' || type === 'multiselect') && options !== undefined && !Array.isArray(options)) {
            return res.status(400).json({ message: 'Options must be an array for select/multiselect type' });
        }

        const attribute = await prisma.bidAttribute.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(type && { type }),
                ...(options !== undefined && { options: Array.isArray(options) && options.length > 0 ? options : null }),
                ...(isEnabled !== undefined && { isEnabled }),
            },
        });

        res.json(attribute);
    } catch (error) {
        console.error('Update bid attribute error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Attribute not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete bid attribute
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Delete associated values first
        await prisma.bidAttributeValue.deleteMany({
            where: { attributeId: parseInt(id) },
        });

        await prisma.bidAttribute.delete({
            where: { id: parseInt(id) },
        });

        res.json({ message: 'Attribute deleted successfully' });
    } catch (error) {
        console.error('Delete bid attribute error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Attribute not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
