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
                    },
                },
                clientObject: {
                    select: {
                        id: true,
                        brandModel: true,
                        stateNumber: true,
                        equipment: true,
                    },
                },
                equipmentItems: {
                    include: {
                        equipment: {
                            select: {
                                name: true,
                            },
                        },
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
            clientObject: bid.clientObject,
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
                clientObject: true,
                equipmentItems: {
                    include: {
                        equipment: true,
                    },
                },
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
        const { clientId, title, amount, status, description, clientObjectId } = req.body;

        // Check if client exists
        const client = await prisma.client.findUnique({
            where: { id: parseInt(clientId) },
        });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // If clientObjectId provided, check it belongs to the client and is not already assigned
        if (clientObjectId) {
            const clientObject = await prisma.clientObject.findUnique({
                where: { id: parseInt(clientObjectId) },
            });

            if (!clientObject || clientObject.clientId !== parseInt(clientId)) {
                return res.status(400).json({ message: 'Client object does not belong to this client' });
            }

            if (clientObject.bidId) {
                return res.status(400).json({ message: 'Client object is already assigned to another bid' });
            }
        }

        const newBid = await prisma.bid.create({
            data: {
                clientId: parseInt(clientId),
                title,
                amount: parseFloat(amount || 0),
                status: status || 'Pending',
                description,
                clientObjectId: clientObjectId ? parseInt(clientObjectId) : null,
            },
            include: {
                client: {
                    select: {
                        name: true,
                    },
                },
                clientObject: true,
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
        const { clientId, title, amount, status, description, clientObjectId } = req.body;

        // If clientId is being changed, verify new client exists
        if (clientId) {
            const client = await prisma.client.findUnique({
                where: { id: parseInt(clientId) },
            });

            if (!client) {
                return res.status(404).json({ message: 'Client not found' });
            }
        }

        // Get current bid to check client
        const currentBid = await prisma.bid.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { client: true },
        });

        if (!currentBid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        const targetClientId = clientId ? parseInt(clientId) : currentBid.clientId;

        // If clientObjectId provided, check it belongs to the target client and is not already assigned to another bid
        if (clientObjectId) {
            const clientObject = await prisma.clientObject.findUnique({
                where: { id: parseInt(clientObjectId) },
            });

            if (!clientObject || clientObject.clientId !== targetClientId) {
                return res.status(400).json({ message: 'Client object does not belong to the target client' });
            }

            if (clientObject.bidId && clientObject.bidId !== parseInt(req.params.id)) {
                return res.status(400).json({ message: 'Client object is already assigned to another bid' });
            }
        }

        const updatedBid = await prisma.bid.update({
            where: { id: parseInt(req.params.id) },
            data: {
                ...(clientId && { clientId: parseInt(clientId) }),
                ...(title && { title }),
                ...(amount !== undefined && { amount: parseFloat(amount) }),
                ...(status && { status }),
                ...(description !== undefined && { description }),
                clientObjectId: clientObjectId ? parseInt(clientObjectId) : null,
            },
            include: {
                client: {
                    select: {
                        name: true,
                    },
                },
                clientObject: true,
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

// Assign equipment to bid
router.post('/:id/equipment', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);
        const { equipmentItemIds } = req.body;

        // Check if bid exists
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Check if equipment items exist and are not already assigned
        const items = await prisma.equipmentItem.findMany({
            where: {
                id: { in: equipmentItemIds },
                bidId: null, // Only assign unassigned items
            },
        });

        if (items.length !== equipmentItemIds.length) {
            return res.status(400).json({ message: 'Some equipment items not found or already assigned' });
        }

        // Assign items to bid
        await prisma.equipmentItem.updateMany({
            where: { id: { in: equipmentItemIds } },
            data: { bidId },
        });

        res.json({ message: `${items.length} equipment items assigned to bid` });
    } catch (error) {
        console.error('Assign equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Return equipment from bid
router.post('/:id/equipment/return', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);
        const { equipmentItemIds } = req.body;

        // Check if bid exists
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Check if equipment items are assigned to this bid
        const items = await prisma.equipmentItem.findMany({
            where: {
                id: { in: equipmentItemIds },
                bidId: bidId,
            },
        });

        if (items.length !== equipmentItemIds.length) {
            return res.status(400).json({ message: 'Some equipment items not found or not assigned to this bid' });
        }

        // Return items (set bidId to null)
        await prisma.equipmentItem.updateMany({
            where: { id: { in: equipmentItemIds } },
            data: { bidId: null },
        });

        res.json({ message: `${items.length} equipment items returned from bid` });
    } catch (error) {
        console.error('Return equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;