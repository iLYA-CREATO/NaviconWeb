const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../prisma/client');

// Get all equipment
router.get('/', authMiddleware, async (req, res) => {
    try {
        const equipment = await prisma.equipment.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Format response
        const formattedEquipment = equipment.map(item => {
            return {
                id: item.id,
                name: item.name,
                productCode: item.productCode,
                sellingPrice: item.sellingPrice ? parseFloat(item.sellingPrice) : null,
                purchasePrice: item.purchasePrice ? parseFloat(item.purchasePrice) : null
            };
        });

        res.json(formattedEquipment);
    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single equipment
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const equipment = await prisma.equipment.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }

        res.json({
            ...equipment,
            sellingPrice: equipment.sellingPrice ? parseFloat(equipment.sellingPrice) : null,
            purchasePrice: equipment.purchasePrice ? parseFloat(equipment.purchasePrice) : null
        });
    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create equipment
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, productCode, sellingPrice, purchasePrice, clientId } = req.body;

        if (!clientId) {
            return res.status(400).json({ message: 'clientId is required' });
        }

        const existingName = await prisma.equipment.findFirst({
            where: { name: name, clientId: parseInt(clientId) }
        });
        if (existingName) {
            return res.status(400).json({ message: 'Оборудование с таким названием уже существует для этого клиента' });
        }

        if (productCode) {
            const existingCode = await prisma.equipment.findFirst({
                where: { productCode: parseInt(productCode), clientId: parseInt(clientId) }
            });
            if (existingCode) {
                return res.status(400).json({ message: 'Оборудование с таким кодом товара уже существует для этого клиента' });
            }
        }

        const newEquipment = await prisma.equipment.create({
            data: {
                name,
                productCode: productCode ? parseInt(productCode) : null,
                sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
                purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
                clientId: parseInt(clientId),
            },
            include: {
                client: true
            }
        });

        res.status(201).json({
            ...newEquipment,
            sellingPrice: newEquipment.sellingPrice ? parseFloat(newEquipment.sellingPrice) : null,
            purchasePrice: newEquipment.purchasePrice ? parseFloat(newEquipment.purchasePrice) : null,
            clientName: newEquipment.client.name
        });
    } catch (error) {
        console.error('Create equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update equipment
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, productCode, sellingPrice, purchasePrice } = req.body;
        const equipmentId = parseInt(req.params.id);

        const currentEquipment = await prisma.equipment.findUnique({
            where: { id: equipmentId }
        });

        if (!currentEquipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }

        if (name !== undefined && name !== currentEquipment.name) {
            const existingName = await prisma.equipment.findFirst({
                where: { name: name }
            });
            if (existingName) {
                return res.status(400).json({ message: 'Оборудование с таким названием уже существует' });
            }
        }

        if (productCode !== undefined && (productCode ? parseInt(productCode) : null) !== currentEquipment.productCode) {
            if (productCode) {
                const existingCode = await prisma.equipment.findFirst({
                    where: { productCode: parseInt(productCode) }
                });
                if (existingCode) {
                    return res.status(400).json({ message: 'Оборудование с таким кодом товара уже существует' });
                }
            }
        }

        const updatedEquipment = await prisma.equipment.update({
            where: { id: equipmentId },
            data: {
                ...(name !== undefined && { name }),
                ...(productCode !== undefined && { productCode: productCode ? parseInt(productCode) : null }),
                ...(sellingPrice !== undefined && { sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null }),
                ...(purchasePrice !== undefined && { purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null }),
            },
        });

        res.json({
            ...updatedEquipment,
            sellingPrice: updatedEquipment.sellingPrice ? parseFloat(updatedEquipment.sellingPrice) : null,
            purchasePrice: updatedEquipment.purchasePrice ? parseFloat(updatedEquipment.purchasePrice) : null,
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Equipment not found' });
        }
        console.error('Update equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Delete equipment
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const deletedEquipment = await prisma.equipment.delete({
            where: { id: parseInt(req.params.id) },
        });

        res.json({
            message: 'Equipment deleted',
            equipment: {
                ...deletedEquipment,
                sellingPrice: deletedEquipment.sellingPrice ? parseFloat(deletedEquipment.sellingPrice) : null,
                purchasePrice: deletedEquipment.purchasePrice ? parseFloat(deletedEquipment.purchasePrice) : null,
            },
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Equipment not found' });
        }
        console.error('Delete equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;