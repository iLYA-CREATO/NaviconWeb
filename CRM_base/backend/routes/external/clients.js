/**
 * Внешний API для работы с клиентами
 * 
 * Этот модуль содержит endpoints для внешнего доступа к клиентам
 * через API токен.
 */

const express = require('express');
const router = express.Router();
const apiAuthMiddleware = require('../../middleware/apiAuth');
const { requirePermission } = require('../../middleware/apiAuth');
const prisma = require('../../prisma/client');

// Получение списка клиентов
router.get('/', apiAuthMiddleware, requirePermission('clients'), async (req, res) => {
    try {
        const { name, email, limit = 50, offset = 0 } = req.query;
        
        const whereClause = {};
        if (name) {
            whereClause.name = {
                contains: name,
                mode: 'insensitive'
            };
        }
        if (email) {
            whereClause.email = {
                contains: email,
                mode: 'insensitive'
            };
        }

        const clients = await prisma.client.findMany({
            where: whereClause,
            take: parseInt(limit) || 50,
            skip: parseInt(offset) || 0,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                subjectForm: true,
                responsibleId: true,
                createdAt: true,
                updatedAt: true,
                responsible: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                _count: {
                    select: { bids: true, clientObjects: true },
                },
            },
        });

        const total = await prisma.client.count({ where: whereClause });

        res.json({
            success: true,
            data: clients,
            pagination: {
                total,
                limit: parseInt(limit) || 50,
                offset: parseInt(offset) || 0,
            }
        });
    } catch (error) {
        console.error('External API - Get clients error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при получении клиентов' 
        });
    }
});

// Получение одного клиента по ID
router.get('/:id', apiAuthMiddleware, requirePermission('clients'), async (req, res) => {
    try {
        const client = await prisma.client.findUnique({
            where: { id: parseInt(req.params.id) },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                subjectForm: true,
                responsibleId: true,
                createdAt: true,
                updatedAt: true,
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
                _count: {
                    select: { bids: true, clientObjects: true },
                },
            },
        });

        if (!client) {
            return res.status(404).json({ 
                success: false,
                error: 'Not Found',
                message: 'Клиент не найден' 
            });
        }

        res.json({
            success: true,
            data: client,
        });
    } catch (error) {
        console.error('External API - Get client error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при получении клиента' 
        });
    }
});

// Создание нового клиента
router.post('/', apiAuthMiddleware, requirePermission('clients'), async (req, res) => {
    try {
        const { name, email, phone, subjectForm, responsibleId, attributes } = req.body;

        // Валидация обязательных полей
        if (!name) {
            return res.status(400).json({ 
                success: false,
                error: 'Validation Error',
                message: 'Название клиента (name) обязательно' 
            });
        }

        if (!email) {
            return res.status(400).json({ 
                success: false,
                error: 'Validation Error',
                message: 'Email клиента (email) обязателен' 
            });
        }

        // Проверка уникальности email
        const existingClient = await prisma.client.findUnique({
            where: { email },
        });

        if (existingClient) {
            return res.status(409).json({ 
                success: false,
                error: 'Conflict',
                message: 'Клиент с таким email уже существует' 
            });
        }

        const newClient = await prisma.client.create({
            data: {
                name,
                email,
                phone: phone || null,
                subjectForm: subjectForm || null,
                responsibleId: responsibleId ? parseInt(responsibleId) : null,
            },
        });

        // Добавление атрибутов клиента, если они предоставлены
        if (attributes && typeof attributes === 'object') {
            for (const [attrId, value] of Object.entries(attributes)) {
                if (value !== '' && value !== undefined && value !== null) {
                    await prisma.clientAttributeValue.create({
                        data: {
                            clientId: newClient.id,
                            attributeId: parseInt(attrId),
                            value: String(value),
                        },
                    });
                }
            }
        }

        // Получаем созданного клиента с полной информацией
        const client = await prisma.client.findUnique({
            where: { id: newClient.id },
            include: {
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

        res.status(201).json({
            success: true,
            message: 'Клиент успешно создан',
            data: client,
        });
    } catch (error) {
        console.error('External API - Create client error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при создании клиента' 
        });
    }
});

// Обновление клиента
router.put('/:id', apiAuthMiddleware, requirePermission('clients'), async (req, res) => {
    try {
        const { name, email, phone, subjectForm, responsibleId, attributes } = req.body;
        const clientId = parseInt(req.params.id);

        // Проверяем, существует ли клиент
        const existingClient = await prisma.client.findUnique({
            where: { id: clientId },
        });

        if (!existingClient) {
            return res.status(404).json({ 
                success: false,
                error: 'Not Found',
                message: 'Клиент не найден' 
            });
        }

        // Проверка уникальности email при изменении
        if (email && email !== existingClient.email) {
            const emailExists = await prisma.client.findFirst({
                where: { email, NOT: { id: clientId } },
            });

            if (emailExists) {
                return res.status(409).json({ 
                    success: false,
                    error: 'Conflict',
                    message: 'Клиент с таким email уже существует' 
                });
            }
        }

        const updatedClient = await prisma.client.update({
            where: { id: clientId },
            data: {
                name: name || existingClient.name,
                email: email || existingClient.email,
                phone: phone !== undefined ? phone : existingClient.phone,
                subjectForm: subjectForm !== undefined ? subjectForm : existingClient.subjectForm,
                responsibleId: responsibleId !== undefined ? (responsibleId ? parseInt(responsibleId) : null) : existingClient.responsibleId,
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

        // Обновление атрибутов клиента
        if (attributes && typeof attributes === 'object') {
            for (const [attrId, value] of Object.entries(attributes)) {
                if (value !== '' && value !== undefined && value !== null) {
                    await prisma.clientAttributeValue.upsert({
                        where: {
                            clientId_attributeId: {
                                clientId: clientId,
                                attributeId: parseInt(attrId),
                            },
                        },
                        update: {
                            value: String(value),
                        },
                        create: {
                            clientId: clientId,
                            attributeId: parseInt(attrId),
                            value: String(value),
                        },
                    });
                }
            }
        }

        // Получаем обновленного клиента с атрибутами
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: {
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

        res.json({
            success: true,
            message: 'Клиент успешно обновлен',
            data: client,
        });
    } catch (error) {
        console.error('External API - Update client error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ 
                success: false,
                error: 'Not Found',
                message: 'Клиент не найден' 
            });
        }
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: 'Ошибка при обновлении клиента' 
        });
    }
});

module.exports = router;
