/**
 * Внешний API для работы с объектами клиентов
 * 
 * Этот модуль содержит endpoints для внешнего доступа к объектам клиентов
 * через API токен.
 */

const express = require('express');
const router = express.Router();
const apiAuthMiddleware = require('../../middleware/apiAuth');
const { requirePermission } = require('../../middleware/apiAuth');
const prisma = require('../../prisma/client');

// Получение списка объектов клиентов
router.get('/', apiAuthMiddleware, requirePermission('objects'), async (req, res) => {
    try {
        const { clientId, brandModel, stateNumber, limit = 50, offset = 0 } = req.query;
        
        const whereClause = {};
        if (clientId) {
            whereClause.clientId = parseInt(clientId);
        }
        if (brandModel) {
            whereClause.brandModel = {
                contains: brandModel,
                mode: 'insensitive'
            };
        }
        if (stateNumber) {
            whereClause.stateNumber = {
                contains: stateNumber,
                mode: 'insensitive'
            };
        }

        const clientObjects = await prisma.clientObject.findMany({
            where: whereClause,
            take: parseInt(limit) || 50,
            skip: parseInt(offset) || 0,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                clientId: true,
                brandModel: true,
                stateNumber: true,
                distance: true,
                region: true,
                responsibleId: true,
                createdAt: true,
                updatedAt: true,
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                equipment: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: { bids: true },
                },
            },
        });

        const total = await prisma.clientObject.count({ where: whereClause });

        res.json({
            success: true,
            data: clientObjects,
            pagination: {
                total,
                limit: parseInt(limit) || 50,
                offset: parseInt(offset) || 0,
            }
        });
    } catch (error) {
        console.error('External API - Get client objects error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при получении объектов клиентов' 
        });
    }
});

// Получение одного объекта клиента по ID
router.get('/:id', apiAuthMiddleware, requirePermission('objects'), async (req, res) => {
    try {
        const clientObject = await prisma.clientObject.findUnique({
            where: { id: parseInt(req.params.id) },
            select: {
                id: true,
                clientId: true,
                brandModel: true,
                stateNumber: true,
                distance: true,
                region: true,
                responsibleId: true,
                createdAt: true,
                updatedAt: true,
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        responsible: {
                            select: {
                                id: true,
                                fullName: true,
                            },
                        },
                    },
                },
                equipment: true,
                bids: {
                    select: {
                        id: true,
                        tema: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!clientObject) {
            return res.status(404).json({ 
                success: false,
                error: 'Not Found',
                message: 'Объект клиента не найден' 
            });
        }

        res.json({
            success: true,
            data: clientObject,
        });
    } catch (error) {
        console.error('External API - Get client object error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при получении объекта клиента' 
        });
    }
});

// Создание нового объекта клиента
router.post('/', apiAuthMiddleware, requirePermission('objects'), async (req, res) => {
    try {
        const { clientId, brandModel, stateNumber, equipmentId, distance, region, responsibleId } = req.body;

        // Валидация обязательных полей
        if (!clientId) {
            return res.status(400).json({ 
                success: false,
                error: 'Validation Error',
                message: 'ID клиента (clientId) обязательно' 
            });
        }

        if (!brandModel) {
            return res.status(400).json({ 
                success: false,
                error: 'Validation Error',
                message: 'Модель/бренд (brandModel) обязательно' 
            });
        }

        // Проверяем, существует ли клиент
        const client = await prisma.client.findUnique({
            where: { id: parseInt(clientId) },
        });

        if (!client) {
            return res.status(404).json({ 
                success: false,
                error: 'Not Found',
                message: 'Клиент не найден' 
            });
        }

        // Проверяем оборудование, если предоставлено
        let equipment = null;
        if (equipmentId) {
            equipment = await prisma.equipment.findUnique({
                where: { id: parseInt(equipmentId) },
            });
            if (!equipment) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Not Found',
                    message: 'Оборудование не найдено' 
                });
            }
        }

        const newClientObject = await prisma.clientObject.create({
            data: {
                clientId: parseInt(clientId),
                brandModel,
                stateNumber: stateNumber || null,
                equipmentId: equipmentId ? parseInt(equipmentId) : null,
                distance: distance || 0,
                region: region || '68',
                responsibleId: responsibleId ? parseInt(responsibleId) : null,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                equipment: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Объект клиента успешно создан',
            data: newClientObject,
        });
    } catch (error) {
        console.error('External API - Create client object error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при создании объекта клиента' 
        });
    }
});

// Обновление объекта клиента
router.put('/:id', apiAuthMiddleware, requirePermission('objects'), async (req, res) => {
    try {
        const { brandModel, stateNumber, equipmentId, distance, region, responsibleId } = req.body;
        const objectId = parseInt(req.params.id);

        // Проверяем, существует ли объект
        const existingObject = await prisma.clientObject.findUnique({
            where: { id: objectId },
        });

        if (!existingObject) {
            return res.status(404).json({ 
                success: false,
                error: 'Not Found',
                message: 'Объект клиента не найден' 
            });
        }

        // Проверяем оборудование, если предоставлено
        if (equipmentId) {
            const equipment = await prisma.equipment.findUnique({
                where: { id: parseInt(equipmentId) },
            });
            if (!equipment) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Not Found',
                    message: 'Оборудование не найдено' 
                });
            }
        }

        const updatedClientObject = await prisma.clientObject.update({
            where: { id: objectId },
            data: {
                brandModel: brandModel || existingObject.brandModel,
                stateNumber: stateNumber !== undefined ? stateNumber : existingObject.stateNumber,
                equipmentId: equipmentId !== undefined ? (equipmentId ? parseInt(equipmentId) : null) : existingObject.equipmentId,
                distance: distance !== undefined ? distance : existingObject.distance,
                region: region || existingObject.region,
                responsibleId: responsibleId !== undefined ? (responsibleId ? parseInt(responsibleId) : null) : existingObject.responsibleId,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                equipment: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            message: 'Объект клиента успешно обновлен',
            data: updatedClientObject,
        });
    } catch (error) {
        console.error('External API - Update client object error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ 
                success: false,
                error: 'Not Found',
                message: 'Объект клиента не найден' 
            });
        }
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при обновлении объекта клиента' 
        });
    }
});

// Удаление объекта клиента
router.delete('/:id', apiAuthMiddleware, requirePermission('objects'), async (req, res) => {
    try {
        const objectId = parseInt(req.params.id);

        // Проверяем, существует ли объект
        const existingObject = await prisma.clientObject.findUnique({
            where: { id: objectId },
        });

        if (!existingObject) {
            return res.status(404).json({ 
                success: false,
                error: 'Not Found',
                message: 'Объект клиента не найден' 
            });
        }

        await prisma.clientObject.delete({
            where: { id: objectId },
        });

        res.json({
            success: true,
            message: 'Объект клиента успешно удален',
        });
    } catch (error) {
        console.error('External API - Delete client object error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ 
                success: false,
                error: 'Not Found',
                message: 'Объект клиента не найден' 
            });
        }
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при удалении объекта клиента' 
        });
    }
});

module.exports = router;
