const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../prisma/client');

// Get all bid equipment for a bid
router.get('/bid/:bidId', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.bidId);
        const bidEquipments = await prisma.bidEquipment.findMany({
            where: { bidId },
            include: {
                equipment: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(bidEquipments);
    } catch (error) {
        console.error('Get bid equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create bid equipment
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { bidId, equipmentId, imei, quantity } = req.body;

        // Get bid with client
        const bid = await prisma.bid.findUnique({
            where: { id: parseInt(bidId) },
            include: { client: true }
        });
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Check that equipment belongs to the bid's client
        const equipment = await prisma.equipment.findUnique({
            where: { id: parseInt(equipmentId) }
        });
        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }

        // Check if equipment is assigned to the client
        const clientEquipment = await prisma.clientEquipment.findUnique({
            where: {
                clientId_equipmentId: {
                    clientId: bid.clientId,
                    equipmentId: parseInt(equipmentId)
                }
            }
        });
        if (!clientEquipment) {
            return res.status(400).json({ message: 'Equipment is not assigned to the bid\'s client' });
        }

        // Check IMEI uniqueness if provided
        if (imei) {
            const existing = await prisma.bidEquipment.findFirst({
                where: { imei }
            });
            if (existing) {
                return res.status(400).json({ message: 'Оборудование с таким imei уже есть' });
            }
        }

        const newBidEquipment = await prisma.bidEquipment.create({
            data: {
                bidId: parseInt(bidId),
                equipmentId: parseInt(equipmentId),
                imei: imei || null,
                quantity: quantity ? parseInt(quantity) : 1,
            },
            include: {
                equipment: true
            }
        });

        // Update ClientEquipment with IMEI and bidId if IMEI is provided
        if (imei) {
            await prisma.clientEquipment.updateMany({
                where: {
                    clientId: bid.clientId,
                    equipmentId: parseInt(equipmentId)
                },
                data: {
                    imei: imei,
                    bidId: parseInt(bidId)
                }
            });
        }

        res.status(201).json(newBidEquipment);
    } catch (error) {
        console.error('Create bid equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update bid equipment
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { imei, quantity } = req.body;
        const id = parseInt(req.params.id);

        // Check IMEI uniqueness if provided and not null
        if (imei !== undefined && imei !== null) {
            const existing = await prisma.bidEquipment.findFirst({
                where: { imei, id: { not: id } }
            });
            if (existing) {
                return res.status(400).json({ message: 'Оборудование с таким imei уже есть' });
            }
        }

        const updatedBidEquipment = await prisma.bidEquipment.update({
            where: { id },
            data: {
                imei: imei !== undefined ? imei : undefined,
                quantity: quantity !== undefined ? parseInt(quantity) : undefined,
            },
            include: {
                equipment: true,
                bid: {
                    include: {
                        client: true
                    }
                }
            }
        });

        // Update ClientEquipment with new IMEI if it changed
        if (imei !== undefined) {
            await prisma.clientEquipment.updateMany({
                where: {
                    clientId: updatedBidEquipment.bid.clientId,
                    equipmentId: updatedBidEquipment.equipmentId
                },
                data: {
                    imei: imei
                }
            });
        }

        res.json(updatedBidEquipment);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Bid equipment not found' });
        }
        console.error('Update bid equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete bid equipment
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const deletedBidEquipment = await prisma.bidEquipment.delete({
            where: { id: parseInt(req.params.id) },
            include: {
                equipment: true
            }
        });

        res.json({
            message: 'Bid equipment deleted',
            bidEquipment: deletedBidEquipment,
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Bid equipment not found' });
        }
        console.error('Delete bid equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;