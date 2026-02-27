const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../prisma/client');

// Get all clients
router.get('/', authMiddleware, async (req, res) => {
    try {
        console.log('Fetching clients for user ID:', req.user?.id);
        const { name, responsibleId, limit = 20, offset = 0 } = req.query;
        console.log('Query params:', { name, responsibleId, limit, offset });
        const parsedLimit = parseInt(limit) || 20;
        const parsedOffset = parseInt(offset) || 0;
        console.log('Parsed pagination:', { parsedLimit, parsedOffset });
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
        
        // Get total count for pagination
        const totalCount = await prisma.client.count({ where: whereClause });
        
        const clients = await prisma.client.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: parsedLimit,
            skip: parsedOffset,
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
        console.log('Clients fetched:', clients.length, 'items, total:', totalCount);
        res.json({
            data: clients,
            total: totalCount,
            limit: parsedLimit,
            offset: parsedOffset
        });
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
                        bidType: true,
                    },
                },
                responsible: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                attributeValues: {
                    include: {
                        attribute: true,
                    },
                },
            },
        });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        console.log('Client data being returned:', {
            id: client.id,
            name: client.name
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

        const attributes = req.body.attributes || {};
        for (const [attrId, value] of Object.entries(attributes)) {
            if (value !== '' && value !== undefined) {
                await prisma.clientAttributeValue.create({
                    data: {
                        clientId: newClient.id,
                        attributeId: parseInt(attrId),
                        value: String(value),
                    },
                });
            }
        }

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
            include: {
                responsible: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        const attributes = req.body.attributes || {};
        for (const [attrId, value] of Object.entries(attributes)) {
            if (value !== '' && value !== undefined) {
                await prisma.clientAttributeValue.upsert({
                    where: {
                        clientId_attributeId: {
                            clientId: parseInt(req.params.id),
                            attributeId: parseInt(attrId),
                        },
                    },
                    update: {
                        value: String(value),
                    },
                    create: {
                        clientId: parseInt(req.params.id),
                        attributeId: parseInt(attrId),
                        value: String(value),
                    },
                });
            } else {
                await prisma.clientAttributeValue.deleteMany({
                    where: {
                        clientId: parseInt(req.params.id),
                        attributeId: parseInt(attrId),
                    },
                });
            }
        }

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
        const clientId = parseInt(req.params.id);
        
        // First, check if client exists
        const existingClient = await prisma.client.findUnique({
            where: { id: clientId },
            include: {
                _count: {
                    select: { bids: true, clientObjects: true }
                }
            }
        });

        if (!existingClient) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Check for related data and handle deletion
        const relatedData = {
            bidsCount: existingClient._count.bids,
            objectsCount: existingClient._count.clientObjects
        };

        // Delete related data in correct order (respecting foreign keys)
        // 1. Delete attribute values
        await prisma.clientAttributeValue.deleteMany({
            where: { clientId }
        });

        // 2. Delete client equipment
        await prisma.clientEquipment.deleteMany({
            where: { clientId }
        });

        // 3. Delete client objects (this will also handle bids through cascade if configured)
        await prisma.clientObject.deleteMany({
            where: { clientId }
        });

        // 4. Delete bids directly (in case they weren't cascade deleted)
        await prisma.bid.deleteMany({
            where: { clientId }
        });

        // Finally delete the client
        const deletedClient = await prisma.client.delete({
            where: { id: clientId },
        });

        res.json({ 
            message: 'Client deleted', 
            client: deletedClient,
            deletedRelated: relatedData
        });
    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Bulk upload clients
router.post('/bulk-upload', authMiddleware, async (req, res) => {
    try {
        const { clients } = req.body;

        if (!Array.isArray(clients) || clients.length === 0) {
            return res.status(400).json({ message: 'Clients array is required' });
        }

        const createdClients = [];
        const errors = [];

        for (let i = 0; i < clients.length; i++) {
            const clientData = clients[i];
            try {
                // Validate required fields
                if (!clientData.name) {
                    errors.push({ row: i + 1, error: 'Название is required' });
                    continue;
                }

                const newClient = await prisma.client.create({
                    data: {
                        name: clientData.name,
                        email: clientData.email || null,
                        phone: clientData.phone || null,
                        responsibleId: clientData.responsibleId ? parseInt(clientData.responsibleId) : null,
                        createdAt: clientData.createdAt ? new Date(clientData.createdAt) : new Date(),
                    },
                });
                createdClients.push(newClient);
            } catch (error) {
                console.error(`Error creating client at row ${i + 1}:`, error);
                errors.push({ row: i + 1, error: error.message });
            }
        }

        res.status(201).json({
            message: `Successfully created ${createdClients.length} clients`,
            created: createdClients.length,
            errors: errors.length,
            errorDetails: errors
        });
    } catch (error) {
        console.error('Bulk upload clients error:', error);
        res.status(500).json({ message: 'Server error during bulk upload' });
    }
});

// Bulk delete clients
router.post('/bulk-delete', authMiddleware, async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Client IDs array is required' });
        }

        const clientIds = ids.map(id => parseInt(id));
        const deletedClients = [];
        const errors = [];

        for (const clientId of clientIds) {
            try {
                // Check if client exists
                const existingClient = await prisma.client.findUnique({
                    where: { id: clientId },
                    include: {
                        _count: {
                            select: { bids: true, clientObjects: true }
                        }
                    }
                });

                if (!existingClient) {
                    errors.push({ id: clientId, error: 'Client not found' });
                    continue;
                }

                // Delete related data in correct order
                await prisma.clientAttributeValue.deleteMany({
                    where: { clientId }
                });

                await prisma.clientEquipment.deleteMany({
                    where: { clientId }
                });

                await prisma.clientObject.deleteMany({
                    where: { clientId }
                });

                await prisma.bid.deleteMany({
                    where: { clientId }
                });

                // Delete the client
                await prisma.client.delete({
                    where: { id: clientId },
                });

                deletedClients.push(clientId);
            } catch (error) {
                console.error(`Error deleting client ${clientId}:`, error);
                errors.push({ id: clientId, error: error.message });
            }
        }

        res.status(200).json({
            message: `Successfully deleted ${deletedClients.length} clients`,
            deleted: deletedClients.length,
            deletedIds: deletedClients,
            errors: errors.length,
            errorDetails: errors
        });
    } catch (error) {
        console.error('Bulk delete clients error:', error);
        res.status(500).json({ message: 'Server error during bulk delete' });
    }
});

module.exports = router;