/**
 * Внешний API для работы с заявками
 * 
 * Этот модуль содержит endpoints для внешнего доступа к заявкам
 * через API токен.
 */

const express = require('express');
const router = express.Router();
const apiAuthMiddleware = require('../../middleware/apiAuth');
const { requirePermission } = require('../../middleware/apiAuth');
const prisma = require('../../prisma/client');

// Получение списка заявок
router.get('/', apiAuthMiddleware, requirePermission('bids'), async (req, res) => {
    try {
        const { clientId, clientObjectId, status, bidTypeId, limit = 50, offset = 0 } = req.query;
        
        const whereClause = {};
        if (clientId) {
            whereClause.clientId = parseInt(clientId);
        }
        if (clientObjectId) {
            whereClause.clientObjectId = parseInt(clientObjectId);
        }
        if (status) {
            whereClause.status = status;
        }
        if (bidTypeId) {
            whereClause.bidTypeId = parseInt(bidTypeId);
        }

        const bids = await prisma.bid.findMany({
            where: whereClause,
            take: parseInt(limit) || 50,
            skip: parseInt(offset) || 0,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                clientId: true,
                bidTypeId: true,
                tema: true,
                amount: true,
                status: true,
                description: true,
                clientObjectId: true,
                updNumber: true,
                updDate: true,
                workAddress: true,
                contactFullName: true,
                contactPhone: true,
                parentId: true,
                assignedAt: true,
                plannedReactionTimeMinutes: true,
                plannedResolutionDate: true,
                spentTimeHours: true,
                currentResponsibleUserId: true,
                plannedDurationMinutes: true,
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
                clientObject: {
                    select: {
                        id: true,
                        brandModel: true,
                        stateNumber: true,
                    },
                },
                bidType: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                currentResponsible: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        const total = await prisma.bid.count({ where: whereClause });

        // Форматируем данные
        const formattedBids = bids.map(bid => ({
            id: bid.id,
            clientId: bid.clientId,
            clientName: bid.client?.name,
            bidTypeId: bid.bidTypeId,
            bidTypeName: bid.bidType?.name,
            tema: bid.tema,
            amount: parseFloat(bid.amount),
            status: bid.status,
            description: bid.description,
            clientObjectId: bid.clientObjectId,
            clientObject: bid.clientObject,
            updNumber: bid.updNumber,
            updDate: bid.updDate,
            workAddress: bid.workAddress,
            contactFullName: bid.contactFullName,
            contactPhone: bid.contactPhone,
            parentId: bid.parentId,
            assignedAt: bid.assignedAt,
            plannedReactionTimeMinutes: bid.plannedReactionTimeMinutes,
            plannedResolutionDate: bid.plannedResolutionDate,
            spentTimeHours: bid.spentTimeHours ? parseFloat(bid.spentTimeHours) : null,
            currentResponsibleUserId: bid.currentResponsibleUserId,
            currentResponsibleUserName: bid.currentResponsible?.fullName,
            plannedDurationMinutes: bid.plannedDurationMinutes,
            createdBy: bid.creator?.id,
            creatorName: bid.creator?.fullName,
            createdAt: bid.createdAt,
            updatedAt: bid.updatedAt,
        }));

        res.json({
            success: true,
            data: formattedBids,
            pagination: {
                total,
                limit: parseInt(limit) || 50,
                offset: parseInt(offset) || 0,
            }
        });
    } catch (error) {
        console.error('External API - Get bids error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при получении заявок' 
        });
    }
});

// Получение одной заявки по ID
router.get('/:id', apiAuthMiddleware, requirePermission('bids'), async (req, res) => {
    try {
        const bid = await prisma.bid.findUnique({
            where: { id: parseInt(req.params.id) },
            select: {
                id: true,
                clientId: true,
                bidTypeId: true,
                tema: true,
                amount: true,
                status: true,
                description: true,
                clientObjectId: true,
                updNumber: true,
                updDate: true,
                workAddress: true,
                contactFullName: true,
                contactPhone: true,
                parentId: true,
                assignedAt: true,
                plannedReactionTimeMinutes: true,
                plannedResolutionDate: true,
                spentTimeHours: true,
                currentResponsibleUserId: true,
                plannedDurationMinutes: true,
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
                clientObject: {
                    select: {
                        id: true,
                        brandModel: true,
                        stateNumber: true,
                    },
                },
                bidType: true,
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                currentResponsible: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        tema: true,
                    },
                },
                children: {
                    select: {
                        id: true,
                        tema: true,
                        status: true,
                    },
                },
                bidEquipments: {
                    include: {
                        equipment: true,
                    },
                },
                attributeValues: {
                    include: {
                        attribute: true,
                    },
                },
            },
        });

        if (!bid) {
            return res.status(404).json({ 
                success: false,
                error: 'Not Found',
                message: 'Заявка не найдена' 
            });
        }

        // Форматируем данные
        const formattedBid = {
            id: bid.id,
            clientId: bid.clientId,
            client: bid.client,
            bidTypeId: bid.bidTypeId,
            bidType: bid.bidType,
            tema: bid.tema,
            amount: parseFloat(bid.amount),
            status: bid.status,
            description: bid.description,
            clientObjectId: bid.clientObjectId,
            clientObject: bid.clientObject,
            updNumber: bid.updNumber,
            updDate: bid.updDate,
            workAddress: bid.workAddress,
            contactFullName: bid.contactFullName,
            contactPhone: bid.contactPhone,
            parentId: bid.parentId,
            parent: bid.parent,
            children: bid.children,
            assignedAt: bid.assignedAt,
            plannedReactionTimeMinutes: bid.plannedReactionTimeMinutes,
            plannedResolutionDate: bid.plannedResolutionDate,
            spentTimeHours: bid.spentTimeHours ? parseFloat(bid.spentTimeHours) : null,
            currentResponsibleUserId: bid.currentResponsibleUserId,
            currentResponsible: bid.currentResponsible,
            plannedDurationMinutes: bid.plannedDurationMinutes,
            createdBy: bid.creator?.id,
            creator: bid.creator,
            createdAt: bid.createdAt,
            updatedAt: bid.updatedAt,
            bidEquipments: bid.bidEquipments,
            attributeValues: bid.attributeValues,
        };

        res.json({
            success: true,
            data: formattedBid,
        });
    } catch (error) {
        console.error('External API - Get bid error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при получении заявки' 
        });
    }
});

// Создание новой заявки
router.post('/', apiAuthMiddleware, requirePermission('bids'), async (req, res) => {
    try {
        const { 
            clientId, 
            bidTypeId, 
            tema, 
            amount, 
            description, 
            clientObjectId,
            updNumber,
            updDate,
            workAddress,
            contactFullName,
            contactPhone,
            parentId,
            bidEquipments,
            attributes
        } = req.body;

        // Валидация обязательных полей
        if (!clientId) {
            return res.status(400).json({ 
                success: false,
                error: 'Validation Error',
                message: 'ID клиента (clientId) обязательно' 
            });
        }

        if (!bidTypeId) {
            return res.status(400).json({ 
                success: false,
                error: 'Validation Error',
                message: 'ID типа заявки (bidTypeId) обязательно' 
            });
        }

        if (!tema) {
            return res.status(400).json({ 
                success: false,
                error: 'Validation Error',
                message: 'Тема заявки (tema) обязательна' 
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

        // Проверяем, существует ли тип заявки
        const bidType = await prisma.bidType.findUnique({
            where: { id: parseInt(bidTypeId) },
        });

        if (!bidType) {
            return res.status(404).json({ 
                success: false,
                error: 'Not Found',
                message: 'Тип заявки не найден' 
            });
        }

        // Проверяем объект клиента, если предоставлен
        if (clientObjectId) {
            const clientObject = await prisma.clientObject.findUnique({
                where: { id: parseInt(clientObjectId) },
            });
            if (!clientObject) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Not Found',
                    message: 'Объект клиента не найден' 
                });
            }
        }

        // Получаем начальный статус для типа заявки
        const initialStatus = bidType.statuses && Array.isArray(bidType.statuses) && bidType.statuses.length > 0 
            ? bidType.statuses[0].name 
            : 'new';

        // Используем ID пользователя, связанного с API токеном, как создателя
        const createdBy = req.apiUser.id;

        const newBid = await prisma.bid.create({
            data: {
                clientId: parseInt(clientId),
                bidTypeId: parseInt(bidTypeId),
                tema,
                amount: amount || 0,
                status: initialStatus,
                description: description || null,
                clientObjectId: clientObjectId ? parseInt(clientObjectId) : null,
                updNumber: updNumber || null,
                updDate: updDate ? new Date(updDate) : null,
                workAddress: workAddress || null,
                contactFullName: contactFullName || null,
                contactPhone: contactPhone || null,
                parentId: parentId ? parseInt(parentId) : null,
                createdBy,
            },
        });

        // Добавляем оборудование заявки, если предоставлено
        if (bidEquipments && Array.isArray(bidEquipments)) {
            for (const eq of bidEquipments) {
                await prisma.bidEquipment.create({
                    data: {
                        bidId: newBid.id,
                        equipmentId: parseInt(eq.equipmentId),
                        imei: eq.imei || null,
                        quantity: eq.quantity || 1,
                    },
                });
            }
        }

        // Добавляем атрибуты заявки, если предоставлены
        if (attributes && typeof attributes === 'object') {
            for (const [attrId, value] of Object.entries(attributes)) {
                if (value !== '' && value !== undefined && value !== null) {
                    await prisma.bidAttributeValue.create({
                        data: {
                            bidId: newBid.id,
                            attributeId: parseInt(attrId),
                            value: String(value),
                        },
                    });
                }
            }
        }

        // Получаем созданную заявку с полной информацией
        const bid = await prisma.bid.findUnique({
            where: { id: newBid.id },
            include: {
                client: true,
                clientObject: true,
                bidType: true,
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                bidEquipments: {
                    include: {
                        equipment: true,
                    },
                },
                attributeValues: {
                    include: {
                        attribute: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Заявка успешно создана',
            data: bid,
        });
    } catch (error) {
        console.error('External API - Create bid error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при создании заявки' 
        });
    }
});

// Обновление заявки
router.put('/:id', apiAuthMiddleware, requirePermission('bids'), async (req, res) => {
    try {
        const { 
            tema, 
            amount, 
            description, 
            clientObjectId,
            updNumber,
            updDate,
            workAddress,
            contactFullName,
            contactPhone,
            status,
            currentResponsibleUserId,
            plannedResolutionDate,
            plannedDurationMinutes,
            bidEquipments,
            attributes
        } = req.body;
        const bidId = parseInt(req.params.id);

        // Проверяем, существует ли заявка
        const existingBid = await prisma.bid.findUnique({
            where: { id: bidId },
        });

        if (!existingBid) {
            return res.status(404).json({ 
                success: false,
                error: 'Not Found',
                message: 'Заявка не найдена' 
            });
        }

        // Проверяем объект клиента, если предоставлен
        if (clientObjectId !== undefined) {
            if (clientObjectId) {
                const clientObject = await prisma.clientObject.findUnique({
                    where: { id: parseInt(clientObjectId) },
                });
                if (!clientObject) {
                    return res.status(404).json({ 
                        success: false,
                        error: 'Not Found',
                        message: 'Объект клиента не найден' 
                    });
                }
            }
        }

        const updateData = {};
        if (tema !== undefined) updateData.tema = tema;
        if (amount !== undefined) updateData.amount = amount;
        if (description !== undefined) updateData.description = description;
        if (clientObjectId !== undefined) updateData.clientObjectId = clientObjectId ? parseInt(clientObjectId) : null;
        if (updNumber !== undefined) updateData.updNumber = updNumber;
        if (updDate !== undefined) updateData.updDate = updDate ? new Date(updDate) : null;
        if (workAddress !== undefined) updateData.workAddress = workAddress;
        if (contactFullName !== undefined) updateData.contactFullName = contactFullName;
        if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
        if (status !== undefined) updateData.status = status;
        if (currentResponsibleUserId !== undefined) {
            updateData.currentResponsibleUserId = currentResponsibleUserId ? parseInt(currentResponsibleUserId) : null;
            if (currentResponsibleUserId && !existingBid.assignedAt) {
                updateData.assignedAt = new Date();
            }
        }
        if (plannedResolutionDate !== undefined) updateData.plannedResolutionDate = plannedResolutionDate ? new Date(plannedResolutionDate) : null;
        if (plannedDurationMinutes !== undefined) updateData.plannedDurationMinutes = plannedDurationMinutes;

        const updatedBid = await prisma.bid.update({
            where: { id: bidId },
            data: updateData,
        });

        // Обновляем оборудование заявки, если предоставлено
        if (bidEquipments && Array.isArray(bidEquipments)) {
            // Удаляем старое оборудование
            await prisma.bidEquipment.deleteMany({
                where: { bidId },
            });
            
            // Добавляем новое оборудование
            for (const eq of bidEquipments) {
                await prisma.bidEquipment.create({
                    data: {
                        bidId: bidId,
                        equipmentId: parseInt(eq.equipmentId),
                        imei: eq.imei || null,
                        quantity: eq.quantity || 1,
                    },
                });
            }
        }

        // Обновляем атрибуты заявки
        if (attributes && typeof attributes === 'object') {
            for (const [attrId, value] of Object.entries(attributes)) {
                if (value !== '' && value !== undefined && value !== null) {
                    await prisma.bidAttributeValue.upsert({
                        where: {
                            bidId_attributeId: {
                                bidId: bidId,
                                attributeId: parseInt(attrId),
                            },
                        },
                        update: {
                            value: String(value),
                        },
                        create: {
                            bidId: bidId,
                            attributeId: parseInt(attrId),
                            value: String(value),
                        },
                    });
                }
            }
        }

        // Получаем обновленную заявку с полной информацией
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
            include: {
                client: true,
                clientObject: true,
                bidType: true,
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                currentResponsible: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                bidEquipments: {
                    include: {
                        equipment: true,
                    },
                },
                attributeValues: {
                    include: {
                        attribute: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            message: 'Заявка успешно обновлена',
            data: bid,
        });
    } catch (error) {
        console.error('External API - Update bid error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ 
                success: false,
                error: 'Not Found',
                message: 'Заявка не найдена' 
            });
        }
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при обновлении заявки' 
        });
    }
});

// Получение списка типов заявок
router.get('/meta/types', apiAuthMiddleware, requirePermission('bids'), async (req, res) => {
    try {
        const bidTypes = await prisma.bidType.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                statuses: true,
                plannedReactionTimeMinutes: true,
                plannedDurationMinutes: true,
            },
            orderBy: { name: 'asc' },
        });

        res.json({
            success: true,
            data: bidTypes,
        });
    } catch (error) {
        console.error('External API - Get bid types error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при получении типов заявок' 
        });
    }
});

module.exports = router;
