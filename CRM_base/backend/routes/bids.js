const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../prisma/client');

// Get all bids
router.get('/', authMiddleware, async (req, res) => {
    try {
        const bids = await prisma.bid.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                    },
                },
            },
        });

        // Format response to match frontend expectations
        const formattedBids = bids.map(bid => ({
            id: bid.id,
            clientId: bid.clientId,
            clientName: bid.client.name,
            title: bid.title,
            amount: parseFloat(bid.amount),
            status: bid.status,
            description: bid.description,
            createdAt: bid.createdAt,
            updatedAt: bid.updatedAt,
        }));

        res.json(formattedBids);
    } catch (error) {
        console.error('Get bids error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single bid
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const bid = await prisma.bid.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                client: true,
            },
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        res.json({
            ...bid,
            clientName: bid.client.name,
            amount: parseFloat(bid.amount),
        });
    } catch (error) {
        console.error('Get bid error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create bid
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { clientId, title, amount, status, description } = req.body;

        // Check if client exists
        const client = await prisma.client.findUnique({
            where: { id: parseInt(clientId) },
        });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const newBid = await prisma.bid.create({
            data: {
                clientId: parseInt(clientId),
                title,
                amount: parseFloat(amount),
                status: status || 'Pending',
                description,
            },
            include: {
                client: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        res.status(201).json({
            ...newBid,
            clientName: newBid.client.name,
            amount: parseFloat(newBid.amount),
        });
    } catch (error) {
        console.error('Create bid error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update bid
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { clientId, title, amount, status, description } = req.body;

        // If clientId is being changed, verify new client exists
        if (clientId) {
            const client = await prisma.client.findUnique({
                where: { id: parseInt(clientId) },
            });

            if (!client) {
                return res.status(404).json({ message: 'Client not found' });
            }
        }

        const updatedBid = await prisma.bid.update({
            where: { id: parseInt(req.params.id) },
            data: {
                ...(clientId && { clientId: parseInt(clientId) }),
                ...(title && { title }),
                ...(amount && { amount: parseFloat(amount) }),
                ...(status && { status }),
                ...(description !== undefined && { description }),
            },
            include: {
                client: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        res.json({
            ...updatedBid,
            clientName: updatedBid.client.name,
            amount: parseFloat(updatedBid.amount),
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Bid not found' });
        }
        console.error('Update bid error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete bid
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const deletedBid = await prisma.bid.delete({
            where: { id: parseInt(req.params.id) },
        });

        res.json({
            message: 'Bid deleted',
            bid: {
                ...deletedBid,
                amount: parseFloat(deletedBid.amount),
            },
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Bid not found' });
        }
        console.error('Delete bid error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;