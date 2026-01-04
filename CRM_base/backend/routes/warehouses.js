const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../prisma/client');

// Get all warehouses
router.get('/', authMiddleware, async (req, res) => {
    try {
        const warehouses = await prisma.warehouse.findMany({
            orderBy: { createdAt: 'desc' },
        });

        res.json(warehouses);
    } catch (error) {
        console.error('Get warehouses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single warehouse
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const warehouse = await prisma.warehouse.findUnique({
            where: { id: parseInt(req.params.id) },
        });

        if (!warehouse) {
            return res.status(404).json({ message: 'Warehouse not found' });
        }

        res.json(warehouse);
    } catch (error) {
        console.error('Get warehouse error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create warehouse
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if warehouse with this name already exists
        const existingWarehouse = await prisma.warehouse.findFirst({
            where: { name: name }
        });

        if (existingWarehouse) {
            return res.status(400).json({ message: 'Склад с таким названием уже существует' });
        }

        const newWarehouse = await prisma.warehouse.create({
            data: {
                name,
                description,
            },
        });

        res.status(201).json(newWarehouse);
    } catch (error) {
        console.error('Create warehouse error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update warehouse
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if another warehouse with this name already exists
        if (name !== undefined) {
            const existingWarehouse = await prisma.warehouse.findFirst({
                where: { name: name, id: { not: parseInt(req.params.id) } }
            });

            if (existingWarehouse) {
                return res.status(400).json({ message: 'Склад с таким названием уже существует' });
            }
        }

        const updatedWarehouse = await prisma.warehouse.update({
            where: { id: parseInt(req.params.id) },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
            },
        });

        res.json(updatedWarehouse);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Warehouse not found' });
        }
        console.error('Update warehouse error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete warehouse
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const deletedWarehouse = await prisma.warehouse.delete({
            where: { id: parseInt(req.params.id) },
        });

        res.json({
            message: 'Warehouse deleted',
            warehouse: deletedWarehouse,
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Warehouse not found' });
        }
        console.error('Delete warehouse error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;