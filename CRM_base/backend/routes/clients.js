const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../prisma/client');

// Get all clients
router.get('/', authMiddleware, async (req, res) => {
    try {
        console.log('Fetching clients for user ID:', req.user?.id);
        const { name, responsibleId } = req.query;
        const whereClause = {};
        if (name) {
            whereClause.name = {
                contains: name,
                mode: 'insensitive'
            };
        }
        if (responsibleId) {
            whereClause.responsibleId = parseInt(responsibleId);
        }
        const clients = await prisma.client.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { bids: true, clientObjects: true },
                },
                responsible: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
        console.log('Clients fetched:', clients.length, 'items');
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
                bids: {
                    include: {
                        equipmentItems: {
                            include: {
                                equipment: true,
                            },
                        },
                    },
                },
                equipmentItems: {
                    include: {
                        equipment: true,
                        bid: {
                            select: {
                                id: true,
                                tema: true,
                            },
                        },
                    },
                },
                responsible: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        console.log('Client data being returned:', {
            id: client.id,
            name: client.name,
            equipmentItemsCount: client.equipmentItems?.length || 0,
            equipmentItems: client.equipmentItems
        });
        res.json(client);
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create client
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, email, phone, responsibleId } = req.body;

        const newClient = await prisma.client.create({
            data: {
                name,
                email,
                phone,
                responsibleId: responsibleId ? parseInt(responsibleId) : null,
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
        const { name, email, phone, responsibleId } = req.body;

        const updatedClient = await prisma.client.update({
            where: { id: parseInt(req.params.id) },
            data: {
                name,
                email,
                phone,
                responsibleId: responsibleId ? parseInt(responsibleId) : null,
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