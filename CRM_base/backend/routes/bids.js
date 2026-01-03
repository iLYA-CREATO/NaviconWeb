/**
 * Маршруты для работы с заявками (Bids)
 *
 * Этот модуль содержит все API endpoints для CRUD операций с заявками,
 * а также для назначения и возврата оборудования на заявки.
 */

// Импорт Express для создания маршрутов
const express = require('express');
const router = express.Router();
// Импорт middleware для аутентификации
const authMiddleware = require('../middleware/auth');
// Импорт Prisma клиента для работы с базой данных
const prisma = require('../prisma/client');

// Получить все заявки
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Получаем все заявки из базы данных, сортируем по дате создания (новые сначала)
        const bids = await prisma.bid.findMany({
            orderBy: { createdAt: 'desc' }, // Сортировка по убыванию даты
            include: { // Включаем связанные данные
                client: { // Данные клиента
                    select: {
                        id: true,
                        name: true,
                    },
                },
                clientObject: { // Данные объекта клиента (автомобиль)
                    select: {
                        id: true,
                        brandModel: true,
                        stateNumber: true,
                        equipment: true,
                    },
                },
                creator: { // Данные создателя
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                equipmentItems: { // Назначенное оборудование
                    include: {
                        equipment: {
                            select: {
                                name: true, // Название типа оборудования
                            },
                        },
                    },
                },
            },
        });

        // Форматируем ответ для соответствия ожиданиям фронтенда
        const formattedBids = bids.map(bid => ({
            id: bid.id,
            clientId: bid.clientId,
            clientName: bid.client.name, // Добавляем имя клиента отдельно
            title: bid.tema,
            amount: parseFloat(bid.amount), // Преобразуем в число
            status: bid.status,
            description: bid.description,
            clientObject: bid.clientObject,
            creatorName: bid.creator.fullName, // Добавляем ФИО создателя
            createdAt: bid.createdAt,
            updatedAt: bid.updatedAt,
        }));

        res.json(formattedBids); // Отправляем отформатированные данные
    } catch (error) {
        console.error('Get bids error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Получить одну заявку по ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        // Ищем заявку по ID с полными связанными данными
        const bid = await prisma.bid.findUnique({
            where: { id: parseInt(req.params.id) }, // Преобразуем ID в число
            include: {
                client: true, // Полные данные клиента
                clientObject: true, // Полные данные объекта клиента
                creator: { // Данные создателя
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                equipmentItems: { // Назначенное оборудование
                    include: {
                        equipment: true, // Полные данные типа оборудования
                    },
                },
            },
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' }); // Заявка не найдена
        }

        // Отправляем данные заявки с дополнительными полями
        res.json({
            ...bid,
            title: bid.tema, // Для совместимости с фронтендом
            clientName: bid.client.name, // Добавляем имя клиента
            creatorName: bid.creator.fullName, // Добавляем ФИО создателя
            amount: parseFloat(bid.amount), // Преобразуем сумму в число
        });
    } catch (error) {
        console.error('Get bid error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Создать новую заявку
router.post('/', authMiddleware, async (req, res) => {
    try {
        // Проверяем аутентификацию пользователя
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Извлекаем данные из тела запроса
        const { clientId, title, amount, status, description, clientObjectId } = req.body;

        // Проверяем существование клиента
        const client = await prisma.client.findUnique({
            where: { id: parseInt(clientId) },
        });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' }); // Клиент не найден
        }

        // Если указан объект клиента, проверяем его принадлежность и доступность
        if (clientObjectId) {
            const clientObject = await prisma.clientObject.findUnique({
                where: { id: parseInt(clientObjectId) },
            });

            // Проверяем, что объект принадлежит этому клиенту
            if (!clientObject || clientObject.clientId !== parseInt(clientId)) {
                return res.status(400).json({ message: 'Client object does not belong to this client' });
            }

            // Проверяем, что объект не назначен на другую заявку
            if (clientObject.bidId) {
                return res.status(400).json({ message: 'Client object is already assigned to another bid' });
            }
        }

        // Создаем новую заявку в базе данных
        const newBid = await prisma.bid.create({
            data: {
                clientId: parseInt(clientId), // ID клиента
                tema: title, // Заголовок заявки
                amount: parseFloat(amount || 0), // Сумма (по умолчанию 0)
                status: status || 'Pending', // Статус (по умолчанию 'Pending')
                description, // Описание
                clientObjectId: clientObjectId ? parseInt(clientObjectId) : null, // ID объекта клиента (опционально)
                createdBy: req.user.id, // ID пользователя, создавшего заявку
            },
            include: { // Включаем связанные данные в ответ
                client: {
                    select: {
                        name: true, // Только имя клиента
                    },
                },
                clientObject: true, // Данные объекта клиента
            },
        });

        // Отправляем созданную заявку с дополнительными полями
        res.status(201).json({
            ...newBid,
            clientName: newBid.client.name, // Добавляем имя клиента
            amount: parseFloat(newBid.amount), // Преобразуем сумму в число
        });
    } catch (error) {
        console.error('Create bid error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Обновить заявку
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { clientId, title, amount, status, description, clientObjectId } = req.body;

        // Если меняется клиент, проверяем его существование
        if (clientId) {
            const client = await prisma.client.findUnique({
                where: { id: parseInt(clientId) },
            });

            if (!client) {
                return res.status(404).json({ message: 'Client not found' });
            }
        }

        // Получаем текущую заявку для проверки
        const currentBid = await prisma.bid.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { client: true },
        });

        if (!currentBid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Определяем целевой ID клиента (новый или текущий)
        const targetClientId = clientId ? parseInt(clientId) : currentBid.clientId;

        // Если указан объект клиента, проверяем его принадлежность и доступность
        if (clientObjectId) {
            const clientObject = await prisma.clientObject.findUnique({
                where: { id: parseInt(clientObjectId) },
            });

            // Проверяем принадлежность целевому клиенту
            if (!clientObject || clientObject.clientId !== targetClientId) {
                return res.status(400).json({ message: 'Client object does not belong to the target client' });
            }

            // Проверяем, что объект не назначен на другую заявку (кроме текущей)
            if (clientObject.bidId && clientObject.bidId !== parseInt(req.params.id)) {
                return res.status(400).json({ message: 'Client object is already assigned to another bid' });
            }
        }

        // Обновляем заявку в базе данных
        const updatedBid = await prisma.bid.update({
            where: { id: parseInt(req.params.id) },
            data: {
                ...(clientId && { clientId: parseInt(clientId) }), // Обновляем клиента если указано
                ...(title && { tema: title }), // Обновляем заголовок если указано
                ...(amount !== undefined && { amount: parseFloat(amount) }), // Обновляем сумму если указано
                ...(status && { status }), // Обновляем статус если указано
                ...(description !== undefined && { description }), // Обновляем описание если указано
                clientObjectId: clientObjectId ? parseInt(clientObjectId) : null, // Обновляем объект клиента
            },
            include: {
                client: {
                    select: {
                        name: true,
                    },
                },
                clientObject: true,
            },
        });

        // Отправляем обновленную заявку
        res.json({
            ...updatedBid,
            clientName: updatedBid.client.name,
            amount: parseFloat(updatedBid.amount),
        });
    } catch (error) {
        if (error.code === 'P2025') { // Ошибка Prisma: запись не найдена
            return res.status(404).json({ message: 'Bid not found' });
        }
        console.error('Update bid error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Удалить заявку
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const deletedBid = await prisma.bid.delete({
            where: { id: parseInt(req.params.id) },
        });

        res.json({
            message: 'Bid deleted',
            bid: {
                ...deletedBid,
                amount: parseFloat(deletedBid.amount),
            },
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Bid not found' });
        }
        console.error('Delete bid error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Назначить оборудование на заявку
router.post('/:id/equipment', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);
        const { equipmentItemIds } = req.body;

        // Проверяем существование заявки
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Проверяем существование и доступность элементов оборудования
        const items = await prisma.equipmentItem.findMany({
            where: {
                id: { in: equipmentItemIds },
                bidId: null, // Назначаем только неназначенные элементы
            },
        });

        if (items.length !== equipmentItemIds.length) {
            return res.status(400).json({ message: 'Some equipment items not found or already assigned' });
        }

        // Назначаем элементы на заявку
        await prisma.equipmentItem.updateMany({
            where: { id: { in: equipmentItemIds } },
            data: { bidId },
        });

        res.json({ message: `${items.length} equipment items assigned to bid` });
    } catch (error) {
        console.error('Assign equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Вернуть оборудование с заявки
router.post('/:id/equipment/return', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);
        const { equipmentItemIds } = req.body;

        // Проверяем существование заявки
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Проверяем, что элементы назначены на эту заявку
        const items = await prisma.equipmentItem.findMany({
            where: {
                id: { in: equipmentItemIds },
                bidId: bidId,
            },
        });

        if (items.length !== equipmentItemIds.length) {
            return res.status(400).json({ message: 'Some equipment items not found or not assigned to this bid' });
        }

        // Возвращаем элементы (устанавливаем bidId в null)
        await prisma.equipmentItem.updateMany({
            where: { id: { in: equipmentItemIds } },
            data: { bidId: null },
        });

        res.json({ message: `${items.length} equipment items returned from bid` });
    } catch (error) {
        console.error('Return equipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Получить комментарии к заявке
router.get('/:id/comments', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);

        // Проверяем существование заявки
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Получаем комментарии с данными пользователя
        const comments = await prisma.comment.findMany({
            where: { bidId },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        res.json(comments);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Добавить комментарий к заявке
router.post('/:id/comments', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);
        const { content } = req.body;

        // Проверяем аутентификацию
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Проверяем существование заявки
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Проверяем содержание комментария
        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        // Создаем комментарий
        const comment = await prisma.comment.create({
            data: {
                bidId,
                userId: req.user.id,
                content: content.trim(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        res.status(201).json(comment);
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Получить спецификации заявки
router.get('/:id/specifications', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);

        // Проверяем существование заявки
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Получаем спецификации с данными
        const specifications = await prisma.bidSpecification.findMany({
            where: { bidId },
            include: {
                specification: {
                    include: {
                        category: true,
                    },
                },
                executor: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Получаем соисполнителей отдельно
        const specIds = specifications.map(s => s.id);
        const coExecutorsData = await prisma.bidSpecification.findMany({
            where: { id: { in: specIds } },
            select: {
                id: true,
                coExecutorIds: true,
            },
        });

        // Создаем карту соисполнителей
        const coExecutorsMap = {};
        for (const spec of coExecutorsData) {
            if (spec.coExecutorIds.length > 0) {
                const coExecutors = await prisma.user.findMany({
                    where: { id: { in: spec.coExecutorIds } },
                    select: { id: true, fullName: true },
                });
                coExecutorsMap[spec.id] = coExecutors;
            }
        }

        // Добавляем соисполнителей к спецификациям
        const specificationsWithCoExecutors = specifications.map(spec => ({
            ...spec,
            coExecutors: coExecutorsMap[spec.id] || [],
        }));

        res.json(specifications);
    } catch (error) {
        console.error('Get specifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Добавить спецификацию к заявке
router.post('/:id/specifications', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);
        const { specificationId, executorId, coExecutorIds, comment } = req.body;

        // Проверяем аутентификацию
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Проверяем существование заявки
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Проверяем существование спецификации
        const specification = await prisma.specification.findUnique({
            where: { id: parseInt(specificationId) },
        });

        if (!specification) {
            return res.status(404).json({ message: 'Specification not found' });
        }

        // Проверяем исполнителя если указан
        if (executorId) {
            const executor = await prisma.user.findUnique({
                where: { id: parseInt(executorId) },
            });
            if (!executor) {
                return res.status(404).json({ message: 'Executor not found' });
            }
        }

        // Проверяем соисполнителей если указаны
        if (coExecutorIds && coExecutorIds.length > 0) {
            const coExecutors = await prisma.user.findMany({
                where: { id: { in: coExecutorIds.map(id => parseInt(id)) } },
            });
            if (coExecutors.length !== coExecutorIds.length) {
                return res.status(404).json({ message: 'Some co-executors not found' });
            }
        }

        // Создаем спецификацию заявки
        const bidSpecification = await prisma.bidSpecification.create({
            data: {
                bidId,
                specificationId: parseInt(specificationId),
                executorId: executorId ? parseInt(executorId) : null,
                coExecutorIds: coExecutorIds ? coExecutorIds.map(id => parseInt(id)) : [],
                comment: comment || null,
            },
            include: {
                specification: {
                    include: {
                        category: true,
                    },
                },
                executor: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        // Получаем соисполнителей
        let coExecutors = [];
        if (bidSpecification.coExecutorIds.length > 0) {
            coExecutors = await prisma.user.findMany({
                where: { id: { in: bidSpecification.coExecutorIds } },
                select: { id: true, fullName: true },
            });
        }

        res.status(201).json({
            ...bidSpecification,
            coExecutors,
        });
    } catch (error) {
        console.error('Create bid specification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Обновить спецификацию заявки
router.put('/:id/specifications/:specId', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);
        const specId = parseInt(req.params.specId);
        const { executorId, coExecutorIds, comment } = req.body;

        // Проверяем существование спецификации заявки
        const existingSpec = await prisma.bidSpecification.findUnique({
            where: { id: specId },
        });

        if (!existingSpec || existingSpec.bidId !== bidId) {
            return res.status(404).json({ message: 'Bid specification not found' });
        }

        // Проверяем исполнителя если указан
        if (executorId) {
            const executor = await prisma.user.findUnique({
                where: { id: parseInt(executorId) },
            });
            if (!executor) {
                return res.status(404).json({ message: 'Executor not found' });
            }
        }

        // Проверяем соисполнителей если указаны
        if (coExecutorIds && coExecutorIds.length > 0) {
            const coExecutors = await prisma.user.findMany({
                where: { id: { in: coExecutorIds.map(id => parseInt(id)) } },
            });
            if (coExecutors.length !== coExecutorIds.length) {
                return res.status(404).json({ message: 'Some co-executors not found' });
            }
        }

        // Обновляем спецификацию
        const updatedSpec = await prisma.bidSpecification.update({
            where: { id: specId },
            data: {
                executorId: executorId ? parseInt(executorId) : null,
                coExecutorIds: coExecutorIds ? coExecutorIds.map(id => parseInt(id)) : [],
                comment: comment || null,
            },
            include: {
                specification: {
                    include: {
                        category: true,
                    },
                },
                executor: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        // Получаем соисполнителей
        let coExecutors = [];
        if (updatedSpec.coExecutorIds.length > 0) {
            coExecutors = await prisma.user.findMany({
                where: { id: { in: updatedSpec.coExecutorIds } },
                select: { id: true, fullName: true },
            });
        }

        res.json({
            ...updatedSpec,
            coExecutors,
        });
    } catch (error) {
        console.error('Update bid specification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Удалить спецификацию заявки
router.delete('/:id/specifications/:specId', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);
        const specId = parseInt(req.params.specId);

        // Проверяем существование спецификации заявки
        const existingSpec = await prisma.bidSpecification.findUnique({
            where: { id: specId },
        });

        if (!existingSpec || existingSpec.bidId !== bidId) {
            return res.status(404).json({ message: 'Bid specification not found' });
        }

        // Удаляем спецификацию
        await prisma.bidSpecification.delete({
            where: { id: specId },
        });

        res.json({ message: 'Bid specification deleted' });
    } catch (error) {
        console.error('Delete bid specification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;