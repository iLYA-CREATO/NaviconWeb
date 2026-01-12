const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all bid types
router.get('/', auth, async (req, res) => {
    try {
        const bidTypes = await prisma.bidType.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(bidTypes);
    } catch (error) {
        console.error('Error fetching bid types:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new bid type
router.post('/', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        const bidType = await prisma.bidType.create({
            data: { name, description }
        });
        res.status(201).json(bidType);
    } catch (error) {
        console.error('Error creating bid type:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Bid type with this name already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Update a bid type
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const bidType = await prisma.bidType.update({
            where: { id: parseInt(id) },
            data: { name, description }
        });
        res.json(bidType);
    } catch (error) {
        console.error('Error updating bid type:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Bid type not found' });
        } else if (error.code === 'P2002') {
            res.status(400).json({ error: 'Bid type with this name already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Delete a bid type
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.bidType.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting bid type:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Bid type not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

module.exports = router;