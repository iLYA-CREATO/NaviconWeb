const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../prisma/client');

// Get all client equipment
router.get('/', authMiddleware, async (req, res) => {
    try {
        const clientEquipment = await prisma.clientEquipment.findMany({
            include: {
                client: true,
                equipment: true,
                bid: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(clientEquipment);
    } catch (error) {
        console.error('Get client equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get equipment for a specific client
router.get('/client/:clientId', authMiddleware, async (req, res) => {
    try {
        const clientEquipment = await prisma.clientEquipment.findMany({
            where: { clientId: parseInt(req.params.clientId) },
            include: {
                equipment: true,
                bid: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(clientEquipment);
    } catch (error) {
        console.error('Get client equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create client equipment
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { clientId, equipmentId, imei, bidId } = req.body;

        // Check if this combination already exists
        const existing = await prisma.clientEquipment.findUnique({
            where: {
                clientId_equipmentId: {
                    clientId: parseInt(clientId),
                    equipmentId: parseInt(equipmentId)
                }
            }
        });

        if (existing) {
            return res.status(400).json({ message: 'This equipment is already assigned to this client' });
        }

        const clientEquipment = await prisma.clientEquipment.create({
            data: {
                clientId: parseInt(clientId),
                equipmentId: parseInt(equipmentId),
                imei: imei || null,
                bidId: bidId ? parseInt(bidId) : null
            },
            include: {
                client: true,
                equipment: true,
                bid: true
            }
        });

        res.json(clientEquipment);
    } catch (error) {
        console.error('Create client equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete client equipment
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { returnReason } = req.body;
        
        // Get the equipment info before deletion for audit log
        const clientEquipment = await prisma.clientEquipment.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                equipment: true,
                client: true
            }
        });
        
        if (!clientEquipment) {
            return res.status(404).json({ message: 'Client equipment not found' });
        }

        await prisma.clientEquipment.delete({
            where: { id: parseInt(req.params.id) }
        });

        // Create audit log for equipment deletion with return reason
        await prisma.auditLog.create({
            data: {
                clientId: clientEquipment.clientId,
                userId: req.user.id,
                action: 'client_equipment_removed',
                details: JSON.stringify({
                    equipmentId: clientEquipment.equipmentId,
                    equipmentName: clientEquipment.equipment.name,
                    clientName: clientEquipment.client.name,
                    imei: clientEquipment.imei || '',
                    returnReason: returnReason || 'Причина не указана'
                })
            }
        });

        res.json({ 
            message: 'Client equipment deleted successfully',
            returnReason 
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Client equipment not found' });
        }
        console.error('Delete client equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;