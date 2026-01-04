const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../prisma/client');

// Get all equipment
router.get('/', authMiddleware, async (req, res) => {
    try {
        const equipment = await prisma.equipment.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        warehouse: true
                    }
                },
                _count: {
                    select: { items: true }
                }
            }
        });

        // Format response - count only available items (not assigned to bids)
        const formattedEquipment = equipment.map(item => {
            const availableItems = item.items.filter(item => !item.bidId);
            return {
                id: item.id,
                name: item.name,
                description: item.description,
                productCode: item.productCode,
                quantity: availableItems.length, // Only count available items
                createdAt: item.createdAt,
                sellingPrice: item.sellingPrice ? parseFloat(item.sellingPrice) : null,
                items: item.items.map(item => ({
                    ...item,
                    purchasePrice: item.purchasePrice ? parseFloat(item.purchasePrice) : null,
                }))
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
            where: { id: parseInt(req.params.id) },
            include: {
                items: {
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: { items: true }
                }
            }
        });

        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }

        const availableItems = equipment.items.filter(item => !item.bidId);

        res.json({
            ...equipment,
            quantity: availableItems.length, // Only count available items
            sellingPrice: equipment.sellingPrice ? parseFloat(equipment.sellingPrice) : null,
            items: equipment.items.map(item => ({
                ...item,
                purchasePrice: item.purchasePrice ? parseFloat(item.purchasePrice) : null,
            }))
        });
    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create equipment
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description, productCode, sellingPrice } = req.body;

        const newEquipment = await prisma.equipment.create({
            data: {
                name,
                description,
                productCode: productCode ? parseInt(productCode) : null,
                sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
            },
        });

        res.status(201).json({
            ...newEquipment,
            sellingPrice: newEquipment.sellingPrice ? parseFloat(newEquipment.sellingPrice) : null,
        });
    } catch (error) {
        console.error('Create equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update equipment
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, description, productCode, sellingPrice } = req.body;

        const updatedEquipment = await prisma.equipment.update({
            where: { id: parseInt(req.params.id) },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(productCode !== undefined && { productCode: productCode ? parseInt(productCode) : null }),
                ...(sellingPrice !== undefined && { sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null }),
            },
        });

        res.json({
            ...updatedEquipment,
            sellingPrice: updatedEquipment.sellingPrice ? parseFloat(updatedEquipment.sellingPrice) : null,
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Equipment not found' });
        }
        console.error('Update equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add equipment items (Приход)
router.post('/:id/items', authMiddleware, async (req, res) => {
    try {
        const equipmentId = parseInt(req.params.id);
        const { items, supplierId, warehouseId } = req.body; // items: [{ imei, purchasePrice }, ...], supplierId: number, warehouseId: number

        // Check if equipment exists
        const equipment = await prisma.equipment.findUnique({
            where: { id: equipmentId },
        });

        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }

        // Check if supplier exists
        if (supplierId) {
            const supplier = await prisma.supplier.findUnique({
                where: { id: parseInt(supplierId) },
            });

            if (!supplier) {
                return res.status(404).json({ message: 'Supplier not found' });
            }
        }

        // Check if warehouse exists
        if (warehouseId) {
            const warehouse = await prisma.warehouse.findUnique({
                where: { id: parseInt(warehouseId) },
            });

            if (!warehouse) {
                return res.status(404).json({ message: 'Warehouse not found' });
            }
        }

        const newItems = await prisma.equipmentItem.createMany({
            data: items.map(item => ({
                equipmentId,
                supplierId: supplierId ? parseInt(supplierId) : null,
                warehouseId: warehouseId ? parseInt(warehouseId) : null,
                imei: item.imei || null,
                purchasePrice: item.purchasePrice ? parseFloat(item.purchasePrice) : null,
            })),
        });

        res.status(201).json({
            message: `${newItems.count} items added`,
            count: newItems.count,
        });
    } catch (error) {
        console.error('Add equipment items error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get arrival documents
router.get('/arrivals/documents', authMiddleware, async (req, res) => {
    try {
        // Group equipment items by creation date, supplier, and warehouse to simulate arrival documents
        const items = await prisma.equipmentItem.findMany({
            include: {
                supplier: true,
                equipment: true,
                warehouse: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Group by date, supplier, and warehouse (simulating arrival documents)
        const arrivalDocuments = {};
        items.forEach(item => {
            const dateKey = item.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD format
            const supplierKey = item.supplierId || 'no-supplier';
            const warehouseKey = item.warehouseId || 'no-warehouse';
            const key = `${dateKey}-${supplierKey}-${warehouseKey}`;

            if (!arrivalDocuments[key]) {
                arrivalDocuments[key] = {
                    id: Object.keys(arrivalDocuments).length + 1,
                    date: item.createdAt,
                    supplier: item.supplier,
                    warehouse: item.warehouse?.name || 'Не указан',
                    documentNumber: `Д-${String(Object.keys(arrivalDocuments).length + 1).padStart(4, '0')}`,
                    items: [],
                };
            }
            arrivalDocuments[key].items.push(item);
        });

        const documents = Object.values(arrivalDocuments);
        res.json(documents);
    } catch (error) {
        console.error('Get arrival documents error:', error);
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