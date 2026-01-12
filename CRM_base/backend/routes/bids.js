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
            equipmentItems: bid.equipmentItems, // Включаем назначенное оборудование
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
                client: {
                    include: {
                        responsible: {
                            select: {
                                id: true,
                                fullName: true,
                            },
                        },
                    },
                }, // Данные клиента с ответственным
                clientObject: true, // Полные данные объекта клиента
                bidType: true, // Данные типа заявки
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
        const responseData = {
            ...bid,
            title: bid.tema, // Для совместимости с фронтендом
            clientName: bid.client.name, // Добавляем имя клиента
            clientResponsibleName: bid.client.responsible ? bid.client.responsible.fullName : 'Не указан', // Добавляем ответственного клиента
            creatorName: bid.creator.fullName, // Добавляем ФИО создателя
            amount: parseFloat(bid.amount), // Преобразуем сумму в число
            bidType: bid.bidType, // Добавляем тип заявки
        };

        console.log('Отправка данных заявки ID:', req.params.id);
        console.log('Данные заявки:', {
            clientId: responseData.clientId,
            clientName: responseData.clientName,
            tema: responseData.title,
            amount: responseData.amount,
            status: responseData.status,
            description: responseData.description,
            clientObjectId: responseData.clientObjectId,
            updNumber: responseData.updNumber,
            updDate: responseData.updDate,
            contract: responseData.contract,
            bidTypeName: responseData.bidType ? responseData.bidType.name : 'Не указан',
            bidTypeStatuses: responseData.bidType ? responseData.bidType.statuses : [],
            clientResponsibleName: responseData.clientResponsibleName,
            creatorName: responseData.creatorName,
            createdAt: responseData.createdAt,
            updatedAt: responseData.updatedAt,
        });

        res.json(responseData);
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
        const { clientId, title, amount, status, description, clientObjectId, bidTypeId, updNumber, updDate, contract } = req.body;

        // Логируем данные, отправленные в заявку
        console.log('Создание новой заявки. Данные, отправленные в заявку:', {
            clientId,
            title,
            amount,
            status: status || 'Открыта',
            description,
            clientObjectId,
            bidTypeId,
            updNumber,
            updDate,
            contract,
            createdBy: req.user.id
        });

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
                bidTypeId: bidTypeId ? parseInt(bidTypeId) : null, // ID типа заявки
                tema: title, // Заголовок заявки
                amount: parseFloat(amount || 0), // Сумма (по умолчанию 0)
                status: status || 'Открыта', // Статус (по умолчанию 'Открыта')
                description, // Описание
                clientObjectId: clientObjectId ? parseInt(clientObjectId) : null, // ID объекта клиента (опционально)
                createdBy: req.user.id, // ID пользователя, создавшего заявку
                updNumber,
                updDate: updDate ? new Date(updDate) : null,
                contract,
            },
            include: { // Включаем связанные данные в ответ
                client: {
                    select: {
                        name: true, // Только имя клиента
                    },
                },
                clientObject: true, // Данные объекта клиента
                bidType: true, // Данные типа заявки
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

        // Определяем, меняется ли клиент
        const isClientChanging = clientId && parseInt(clientId) !== currentBid.clientId;

        // Обновляем заявку в базе данных
        const updatedBid = await prisma.bid.update({
            where: { id: parseInt(req.params.id) },
            data: {
                ...(clientId && { clientId: parseInt(clientId) }), // Обновляем клиента если указано
                ...(title && { tema: title }), // Обновляем заголовок если указано
                ...(amount !== undefined && { amount: parseFloat(amount) }), // Обновляем сумму если указано
                ...(status !== undefined && { status }), // Обновляем статус если указано
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
                bidType: true,
            },
        });


        // Если клиент изменился, возвращаем все оборудование
        if (isClientChanging) {
            await prisma.equipmentItem.updateMany({
                where: { bidId: parseInt(req.params.id) },
                data: { bidId: null },
            });
        }

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
        const { equipmentItemIds, equipmentAssignments } = req.body;

        // Проверяем существование заявки
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        let totalAssigned = 0;

        // Handle equipmentItemIds (for IMEI items)
        if (equipmentItemIds && equipmentItemIds.length > 0) {
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
                data: { bidId, clientId: bid.clientId },
            });

            totalAssigned += items.length;
        }

        // Handle equipmentAssignments (for bulk items)
        if (equipmentAssignments && equipmentAssignments.length > 0) {
            for (const assignment of equipmentAssignments) {
                const { equipmentId, quantity } = assignment;

                // Find available items for this equipment
                const availableItems = await prisma.equipmentItem.findMany({
                    where: {
                        equipmentId,
                        bidId: null,
                    },
                    orderBy: { createdAt: 'asc' }, // Assign oldest first
                });

                const totalAvailable = availableItems.reduce((sum, item) => sum + item.quantity, 0);
                if (quantity > totalAvailable) {
                    return res.status(400).json({ message: `Not enough available quantity for equipment ${equipmentId}. Requested: ${quantity}, Available: ${totalAvailable}` });
                }

                let remaining = quantity;
                for (const item of availableItems) {
                    if (remaining <= 0) break;

                    if (item.quantity <= remaining) {
                        // Assign entire item
                        await prisma.equipmentItem.update({
                            where: { id: item.id },
                            data: { bidId, clientId: bid.clientId },
                        });
                        remaining -= item.quantity;
                        totalAssigned += 1; // Count as one item assigned
                    } else {
                        // Split item: create new item with remaining quantity, assign it, update original
                        await prisma.equipmentItem.create({
                            data: {
                                equipmentId: item.equipmentId,
                                supplierId: item.supplierId,
                                warehouseId: item.warehouseId,
                                clientId: bid.clientId,
                                imei: item.imei,
                                purchasePrice: item.purchasePrice,
                                quantity: remaining,
                                bidId,
                            },
                        });
                        await prisma.equipmentItem.update({
                            where: { id: item.id },
                            data: { quantity: item.quantity - remaining },
                        });
                        remaining = 0;
                        totalAssigned += 1;
                    }
                }
            }
        }

        res.json({ message: `${totalAssigned} equipment items assigned to bid` });
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

// Обновить комментарий к заявке
router.put('/:id/comments/:commentId', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);
        const commentId = parseInt(req.params.commentId);
        const { content } = req.body;

        // Проверяем аутентификацию
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Проверяем существование комментария и что он принадлежит пользователю
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.bidId !== bidId) {
            return res.status(400).json({ message: 'Comment does not belong to this bid' });
        }

        if (comment.userId !== req.user.id) {
            return res.status(403).json({ message: 'You can only edit your own comments' });
        }

        // Проверяем содержание комментария
        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        // Обновляем комментарий
        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: {
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

        res.json(updatedComment);
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Удалить комментарий к заявке
router.delete('/:id/comments/:commentId', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);
        const commentId = parseInt(req.params.commentId);

        // Проверяем аутентификацию
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Проверяем существование комментария и что он принадлежит пользователю
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.bidId !== bidId) {
            return res.status(400).json({ message: 'Comment does not belong to this bid' });
        }

        if (comment.userId !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own comments' });
        }

        // Создаем запись в audit log перед удалением
        await prisma.auditLog.create({
            data: {
                bidId,
                userId: req.user.id,
                action: 'Удален комментарий',
                details: `Комментарий: "${comment.content}"`,
            },
        });

        // Удаляем комментарий
        await prisma.comment.delete({
            where: { id: commentId },
        });

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('Delete comment error:', error);
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
            },
            orderBy: { createdAt: 'asc' },
        });

        // Получаем исполнителей отдельно
        const specIds = specifications.map(s => s.id);
        const executorsData = await prisma.bidSpecification.findMany({
            where: { id: { in: specIds } },
            select: {
                id: true,
                executorIds: true,
            },
        });

        // Создаем карту исполнителей
        const executorsMap = {};
        for (const spec of executorsData) {
            if (spec.executorIds.length > 0) {
                const executors = await prisma.user.findMany({
                    where: { id: { in: spec.executorIds } },
                    select: { id: true, fullName: true },
                });
                executorsMap[spec.id] = executors;
            }
        }

        // Добавляем исполнителей к спецификациям
        const specificationsWithExecutors = specifications.map(spec => ({
            ...spec,
            executors: executorsMap[spec.id] || [],
        }));

        res.json(specificationsWithExecutors);
    } catch (error) {
        console.error('Get specifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Добавить спецификацию к заявке
router.post('/:id/specifications', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);
        const { specificationId, executorIds, comment } = req.body;

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

        // Проверяем исполнителей если указаны
        if (executorIds && executorIds.length > 0) {
            const executors = await prisma.user.findMany({
                where: { id: { in: executorIds.map(id => parseInt(id)) } },
            });
            if (executors.length !== executorIds.length) {
                return res.status(404).json({ message: 'Some executors not found' });
            }
        }

        // Создаем спецификацию заявки
        const bidSpecification = await prisma.bidSpecification.create({
            data: {
                bidId,
                specificationId: parseInt(specificationId),
                executorIds: executorIds ? executorIds.map(id => parseInt(id)) : [],
                comment: comment || null,
            },
            include: {
                specification: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        // Получаем исполнителей
        let executors = [];
        if (bidSpecification.executorIds.length > 0) {
            executors = await prisma.user.findMany({
                where: { id: { in: bidSpecification.executorIds } },
                select: { id: true, fullName: true },
            });
        }

        res.status(201).json({
            ...bidSpecification,
            executors,
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
        const { executorIds, comment } = req.body;

        // Проверяем существование спецификации заявки
        const existingSpec = await prisma.bidSpecification.findUnique({
            where: { id: specId },
        });

        if (!existingSpec || existingSpec.bidId !== bidId) {
            return res.status(404).json({ message: 'Bid specification not found' });
        }

        // Проверяем исполнителей если указаны
        if (executorIds && executorIds.length > 0) {
            const executors = await prisma.user.findMany({
                where: { id: { in: executorIds.map(id => parseInt(id)) } },
            });
            if (executors.length !== executorIds.length) {
                return res.status(404).json({ message: 'Some executors not found' });
            }
        }

        // Обновляем спецификацию
        const updatedSpec = await prisma.bidSpecification.update({
            where: { id: specId },
            data: {
                executorIds: executorIds ? executorIds.map(id => parseInt(id)) : [],
                comment: comment || null,
            },
            include: {
                specification: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        // Получаем исполнителей
        let executors = [];
        if (updatedSpec.executorIds.length > 0) {
            executors = await prisma.user.findMany({
                where: { id: { in: updatedSpec.executorIds } },
                select: { id: true, fullName: true },
            });
        }

        res.json({
            ...updatedSpec,
            executors,
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

// Получить историю заявки
router.get('/:id/history', authMiddleware, async (req, res) => {
    try {
        const bidId = parseInt(req.params.id);

        // Проверяем существование заявки
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
            include: {
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        const history = [];

        // Создание заявки
        history.push({
            date: bid.createdAt,
            user: bid.creator.fullName,
            action: 'Заявка создана',
        });

        // Изменение статуса (упрощенное, используем updatedAt)
        if (bid.updatedAt > bid.createdAt) {
            history.push({
                date: bid.updatedAt,
                user: bid.creator.fullName, // Предполагаем создателя
                action: `Статус изменен на ${bid.status}`,
            });
        }

        // Комментарии
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

        comments.forEach(comment => {
            history.push({
                date: comment.createdAt,
                user: comment.user.fullName,
                action: `Добавлен комментарий: ${comment.content}`,
            });
        });

        // Спецификации
        const specifications = await prisma.bidSpecification.findMany({
            where: { bidId },
            include: {
                specification: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        specifications.forEach(spec => {
            history.push({
                date: spec.createdAt,
                user: bid.creator.fullName, // Предполагаем создателя
                action: `Добавлена спецификация: ${spec.specification.name}`,
            });
            if (spec.updatedAt > spec.createdAt) {
                history.push({
                    date: spec.updatedAt,
                    user: bid.creator.fullName,
                    action: `Спецификация изменена: ${spec.specification.name}`,
                });
            }
        });

        // Оборудование: упрощенное, используем updatedAt для назначения
        if (bid.equipmentItems && bid.equipmentItems.length > 0) {
            // Предполагаем, что оборудование назначено при обновлении
            const totalQuantity = bid.equipmentItems.reduce((sum, item) => sum + item.quantity, 0);
            history.push({
                date: bid.updatedAt,
                user: bid.creator.fullName,
                action: `Оборудование назначено (${totalQuantity} шт.)`,
            });
        }

        // Audit logs
        const auditLogs = await prisma.auditLog.findMany({
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

        auditLogs.forEach(log => {
            history.push({
                date: log.createdAt,
                user: log.user.fullName,
                action: log.action + (log.details ? `: ${log.details}` : ''),
            });
        });

        // Сортируем по дате
        history.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json(history);
    } catch (error) {
        console.error('Get bid history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;