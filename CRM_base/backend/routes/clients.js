const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../prisma/client');

// Get all clients
router.get('/', authMiddleware, async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { bids: true },
                },
            },
        });
        res.json(clients);
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single client
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const client = await prisma.client.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                bids: true,
            },
        });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.json(client);
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create client
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, email, phone, company, status } = req.body;

        const newClient = await prisma.client.create({
            data: {
                name,
                email,
                phone,
                company,
                status: status || 'Pending',
            },
        });

        res.status(201).json(newClient);
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update client
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, email, phone, company, status } = req.body;

        const updatedClient = await prisma.client.update({
            where: { id: parseInt(req.params.id) },
            data: {
                name,
                email,
                phone,
                company,
                status,
            },
        });

        res.json(updatedClient);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Client not found' });
        }
        console.error('Update client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete client
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const deletedClient = await prisma.client.delete({
            where: { id: parseInt(req.params.id) },
        });

        res.json({ message: 'Client deleted', client: deletedClient });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Client not found' });
        }
        console.error('Delete client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;