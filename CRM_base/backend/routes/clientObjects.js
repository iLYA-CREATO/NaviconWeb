const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../prisma/client');

// Получение всех объектов клиентов
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { clientId } = req.query;
        const whereClause = {};
        if (clientId) {
            whereClause.clientId = parseInt(clientId);
        }
        const clientObjects = await prisma.clientObject.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                bids: {
                    select: {
                        id: true,
                        tema: true,
                        status: true,
                    },
                },
            },
        });
        res.json(clientObjects);
    } catch (error) {
        console.error('Get client objects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Получение одного объекта клиента
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const clientObject = await prisma.clientObject.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                bids: {
                    select: {
                        id: true,
                        tema: true,
                        status: true,
                        description: true,
                    },
                },
            },
        });

        if (!clientObject) {
            return res.status(404).json({ message: 'Client object not found' });
        }

        res.json(clientObject);
    } catch (error) {
        console.error('Get client object error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Создание объекта клиента
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { clientId, brandModel, stateNumber, equipment } = req.body;

        const newClientObject = await prisma.clientObject.create({
            data: {
                clientId: parseInt(clientId),
                brandModel,
                stateNumber,
                equipment,
            },
        });

        res.status(201).json(newClientObject);
    } catch (error) {
        console.error('Create client object error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Обновление объекта клиента
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { brandModel, stateNumber, equipment } = req.body;

        const updatedClientObject = await prisma.clientObject.update({
            where: { id: parseInt(req.params.id) },
            data: {
                brandModel,
                stateNumber,
                equipment,
            },
        });

        res.json(updatedClientObject);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Client object not found' });
        }
        console.error('Update client object error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Удаление объекта клиента
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const deletedClientObject = await prisma.clientObject.delete({
            where: { id: parseInt(req.params.id) },
        });

        res.json({ message: 'Client object deleted', clientObject: deletedClientObject });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Client object not found' });
        }
        console.error('Delete client object error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;