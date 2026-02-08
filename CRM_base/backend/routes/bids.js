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
// Импорт fs для логирования
const fs = require('fs');
const path = require('path');

// Функция для логирования данных заявки в файл
const logBidData = (action, data) => {
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    const logFile = path.join(logDir, 'bid_data.log');
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${action}\n${JSON.stringify(data, null, 2)}\n\n`;
    fs.appendFileSync(logFile, logEntry);
};

// Получить все заявки
router.get('/', authMiddleware, async (req, res) => {
    try {
        console.log('Getting all bids');
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
                    include: {
                        equipment: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                creator: { // Данные создателя
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                currentResponsible: { // Текущий ответственный
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                bidType: true, // Включаем тип заявки для получения статусов
            },
        });

        // Форматируем ответ для соответствия ожиданиям фронтенда
        const formattedBids = await Promise.all(bids.map(async (bid) => {
            // Определяем текущий статус
            let currentStatus = null;
            if (bid.bidType?.statuses && Array.isArray(bid.bidType.statuses)) {
                currentStatus = bid.bidType.statuses.find(s => s.name === bid.status) || null;
            }

            // Определяем bidTypeResponsibleName
            let bidTypeResponsibleName = null;
            
            // Сначала проверяем, есть ли назначенный ответственный на заявке
            if (bid.currentResponsibleUserId) {
                bidTypeResponsibleName = bid.currentResponsible ? bid.currentResponsible.fullName : 'Не указан';
            }
            // Если нет, проверяем ответственного пользователя в статусе
            else if (currentStatus?.responsibleUserId) {
                try {
                    const responsibleUser = await prisma.user.findUnique({
                        where: { id: parseInt(currentStatus.responsibleUserId) },
                        select: { fullName: true },
                    });
                    bidTypeResponsibleName = responsibleUser ? responsibleUser.fullName : 'Не указан';
                } catch (error) {
                    console.error('Error finding responsible user:', error);
                    bidTypeResponsibleName = 'Ошибка получения данных';
                }
            }
            // Если нет пользователя, проверяем роль (responsibleRoleId содержит название роли, не ID)
            else if (currentStatus?.responsibleRoleId) {
                try {
                    const role = await prisma.role.findUnique({
                        where: { name: currentStatus.responsibleRoleId },
                        select: { name: true },
                    });
                    bidTypeResponsibleName = role ? `Роль: ${role.name}` : 'Не указан';
                } catch (error) {
                    console.error('Error finding responsible role:', error);
                    bidTypeResponsibleName = 'Ошибка получения данных';
                }
            }

            return {
                id: bid.id,
                clientId: bid.clientId,
                clientName: bid.client ? bid.client.name : 'Клиент не найден',
                title: bid.tema,
                amount: parseFloat(bid.amount),
                status: bid.status,
                description: bid.description,
                clientObject: bid.clientObject,
                creatorName: bid.creator ? bid.creator.fullName : 'Создатель не найден',
                currentResponsibleUserId: bid.currentResponsibleUserId,
                currentResponsibleUserName: bid.currentResponsible ? bid.currentResponsible.fullName : null,
                bidTypeResponsibleName,
                createdAt: bid.createdAt,
                updatedAt: bid.updatedAt,
                workAddress: bid.workAddress,
                plannedResolutionDate: bid.plannedResolutionDate,
                plannedReactionTimeMinutes: bid.plannedReactionTimeMinutes,
                assignedAt: bid.assignedAt,
                plannedDurationMinutes: bid.plannedDurationMinutes,
                spentTimeHours: bid.spentTimeHours ? parseFloat(bid.spentTimeHours) : null,
                parentId: bid.parentId,
                bidType: bid.bidType,
            };
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
        console.log('Getting bid with ID:', req.params.id);
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
                clientObject: {
                    include: {
                        equipment: true,
                    },
                }, // Полные данные объекта клиента
                bidType: true, // Данные типа заявки
                creator: { // Данные создателя
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                parent: { // Родительская заявка
                    select: {
                        id: true,
                        tema: true,
                    },
                },
                children: { // Дочерние заявки
                    select: {
                        id: true,
                        tema: true,
                        status: true,
                        createdAt: true,
                    },
                },
                bidEquipments: {
                    include: {
                        equipment: true,
                    },
                }, // Оборудование заявки
            },
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' }); // Заявка не найдена
        }

        // Получаем спецификации заявки для определения исполнителей
        const specifications = await prisma.bidSpecification.findMany({
            where: { bidId: parseInt(req.params.id) },
            include: {
                specification: true,
            },
        });

        // Получаем всех исполнителей из спецификаций
        const allExecutorIds = specifications.flatMap(spec => spec.executorIds);
        const uniqueExecutorIds = [...new Set(allExecutorIds)];

        let executors = [];
        if (uniqueExecutorIds.length > 0) {
            executors = await prisma.user.findMany({
                where: { id: { in: uniqueExecutorIds } },
                select: {
                    id: true,
                    fullName: true,
                    role: true,
                },
            });
        }

        // Определяем ответственного специалиста
        let responsibleSpecialist = null;
        if (executors.length > 0) {
            responsibleSpecialist = executors[0]; // Первый исполнитель
        } else if (bid.client.responsible) {
            responsibleSpecialist = bid.client.responsible;
        }

        // Определяем текущий статус
        let currentStatus = null;
        if (bid.bidType?.statuses && Array.isArray(bid.bidType.statuses)) {
            currentStatus = bid.bidType.statuses.find(s => s.name === bid.status) || null;
        }

        // Получаем ответственного за текущий статус типа заявки
        let bidTypeResponsibleName = null;
        
        // Сначала проверяем, есть ли назначенный ответственный на заявке
        if (bid.currentResponsibleUserId) {
            try {
                const responsibleUser = await prisma.user.findUnique({
                    where: { id: bid.currentResponsibleUserId },
                    select: { fullName: true },
                });
                bidTypeResponsibleName = responsibleUser ? responsibleUser.fullName : 'Не указан';
            } catch (error) {
                console.error('Error finding responsible user:', error);
                bidTypeResponsibleName = 'Ошибка получения данных';
            }
        }
        // Если нет, проверяем ответственного пользователя в статусе
        else if (currentStatus?.responsibleUserId) {
            try {
                const responsibleUser = await prisma.user.findUnique({
                    where: { id: parseInt(currentStatus.responsibleUserId) },
                    select: { fullName: true },
                });
                bidTypeResponsibleName = responsibleUser ? responsibleUser.fullName : 'Не указан';
            } catch (error) {
                console.error('Error finding responsible user:', error);
                bidTypeResponsibleName = 'Ошибка получения данных';
            }
        }
        // Если нет пользователя, проверяем роль (responsibleRoleId содержит название роли, не ID)
        else if (currentStatus?.responsibleRoleId) {
            try {
                const role = await prisma.role.findUnique({
                    where: { name: currentStatus.responsibleRoleId },
                    select: { name: true },
                });
                bidTypeResponsibleName = role ? `Роль: ${role.name}` : 'Не указан';
            } catch (error) {
                console.error('Error finding responsible role:', error);
                bidTypeResponsibleName = 'Ошибка получения данных';
            }
        }

        // Определяем сроки обработки на основе типа заявки и статуса
        let deadlines = {};
        if (bid.bidType?.name === 'Выдача со склада') {
            if (bid.status === 'Выдача') {
                deadlines = {
                    processingTime: '1 рабочий день',
                    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +1 день
                };
            } else {
                deadlines = {
                    processingTime: '3 рабочих дня',
                    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 дня
                };
            }
        } else {
            deadlines = {
                processingTime: '5 рабочих дней',
                deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // +5 дней
            };
        }

        // Определяем необходимые действия на основе статуса
        let necessaryActions = [];
        if (currentStatus?.allowedActions) {
            necessaryActions = currentStatus.allowedActions.map(action => {
                switch (action) {
                    case 'edit':
                        return 'Редактирование заявки';
                    case 'assign_executor':
                        return 'Назначение исполнителя';
                    case 'close':
                        return 'Закрытие заявки';
                    default:
                        return action;
                }
            });
        }

        // Определяем дополнительные ресурсы и уведомления на основе типа заявки
        let additionalResources = [];
        let notifications = [];

        if (bid.bidType?.name === 'Выдача со склада') {
            additionalResources = ['Складской терминал', 'Документы на оборудование'];
            if (bid.status === 'Выдача') {
                notifications = ['Уведомить клиента о готовности оборудования', 'Отправить подтверждение выдачи'];
            } else {
                notifications = ['Проверить наличие оборудования на складе'];
            }
        } else if (bid.bidType?.name === 'Стандартная заявка') {
            additionalResources = ['Документация', 'Техническая поддержка'];
            notifications = ['Уведомить ответственного менеджера'];
        } else {
            additionalResources = ['Общие ресурсы'];
            notifications = ['Стандартное уведомление'];
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
            bidTypeResponsibleName, // Добавляем ответственного за тип заявки
            statusMetadata: {
                responsibleSpecialist,
                deadlines,
                necessaryActions,
                additionalResources,
                notifications,
            },
        };

        const bidResponseData = {
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
            workAddress: responseData.workAddress,
            bidType: responseData.bidType,
            bidTypeName: responseData.bidType ? responseData.bidType.name : 'Не указан',
            bidTypeStatuses: responseData.bidType ? responseData.bidType.statuses : [],
            bidTypeResponsibleName: responseData.bidTypeResponsibleName,
            currentResponsibleUserId: bid.currentResponsibleUserId,
            clientResponsibleName: responseData.clientResponsibleName,
            creatorName: responseData.creatorName,
            createdAt: responseData.createdAt,
            updatedAt: responseData.updatedAt,
            statusMetadata: responseData.statusMetadata,
        };
        console.log('Отправка данных заявки ID:', req.params.id);
        console.log('Данные заявки:', {
            ...bidResponseData,
        });
        logBidData('Отправка данных заявки ID: ' + req.params.id, bidResponseData);

        res.json({ ...responseData, ...bidResponseData });
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
        const { clientId, title, amount, status, description, clientObjectId, bidTypeId, updNumber, updDate, contract, workAddress, contactFullName, contactPhone, parentId, plannedResolutionDate, plannedReactionTimeMinutes, assignedAt, plannedDurationMinutes, spentTimeHours } = req.body;

        // Логируем данные, отправленные в заявку
        const bidInputData = {
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
            workAddress,
            contactFullName,
            contactPhone,
            parentId,
            createdBy: req.user.id,
            plannedResolutionDate,
            plannedReactionTimeMinutes,
            assignedAt, plannedDurationMinutes,
            spentTimeHours
        };
        console.log('Создание новой заявки. Данные, отправленные в заявку:', bidInputData);
        logBidData('Создание новой заявки', bidInputData);

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

        // Проверяем существование типа заявки и получаем SLA параметры
        let bidType = null;
        let slaReactionTimeMinutes = plannedReactionTimeMinutes;
        let slaDurationMinutes = plannedDurationMinutes;
        
        if (bidTypeId && bidTypeId.trim()) {
            bidType = await prisma.bidType.findUnique({
                where: { id: parseInt(bidTypeId) },
            });
            
            // Если SLA параметры не переданы, берем из типа заявки
            if (!plannedReactionTimeMinutes || !plannedReactionTimeMinutes.trim()) {
                slaReactionTimeMinutes = bidType?.plannedReactionTimeMinutes ? bidType.plannedReactionTimeMinutes.toString() : null;
            }
            if (!plannedDurationMinutes || !plannedDurationMinutes.trim()) {
                slaDurationMinutes = bidType?.plannedDurationMinutes ? bidType.plannedDurationMinutes.toString() : null;
            }
        }

        // Создаем новую заявку в базе данных
        const newBid = await prisma.bid.create({
            data: {
                clientId: parseInt(clientId), // ID клиента
                bidTypeId: bidTypeId && bidTypeId.trim() ? parseInt(bidTypeId) : null, // ID типа заявки
                tema: title, // Заголовок заявки
                amount: (amount !== undefined && amount !== null && amount.toString().trim() !== '') ? parseFloat(amount) : 0, // Сумма (по умолчанию 0)
                status: status || 'Открыта', // Статус (по умолчанию 'Открыта')
                description, // Описание
                clientObjectId: clientObjectId && clientObjectId.trim() ? parseInt(clientObjectId) : null, // ID объекта клиента (опционально)
                parentId: parentId && parentId.toString().trim() ? parseInt(parentId) : null, // ID родительской заявки
                createdBy: req.user.id, // ID пользователя, создавшего заявку
                updNumber,
                updDate: updDate ? new Date(updDate) : null,
                contract,
                workAddress,
                contactFullName,
                contactPhone,
                plannedResolutionDate: plannedResolutionDate && plannedResolutionDate.trim() ? new Date(plannedResolutionDate.length === 16 ? plannedResolutionDate + ':00' : plannedResolutionDate) : null,
                plannedReactionTimeMinutes: slaReactionTimeMinutes && slaReactionTimeMinutes.trim() ? parseInt(slaReactionTimeMinutes) : null,
                assignedAt: assignedAt && assignedAt.trim() ? new Date(assignedAt.length === 16 ? assignedAt + ':00' : assignedAt) : null,
                plannedDurationMinutes: slaDurationMinutes && slaDurationMinutes.trim() ? parseInt(slaDurationMinutes) : null,
                spentTimeHours: spentTimeHours && spentTimeHours.trim() ? parseFloat(spentTimeHours) : null,
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
            workAddress: newBid.workAddress, // Добавляем адрес проведения работ
        });
    } catch (error) {
        console.error('Create bid error:', error);
        console.error('Error details:', error.message, error.code, error.meta);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
});

// Обновить заявку
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { clientId, title, amount, status, description, clientObjectId, bidTypeId, updNumber, updDate, contract, workAddress, contactFullName, contactPhone, plannedResolutionDate, plannedReactionTimeMinutes, assignedAt, plannedDurationMinutes, spentTimeHours, currentResponsibleUserId } = req.body;

        // Логируем данные обновления заявки
        const updateData = { clientId, title, amount, status, description, clientObjectId, bidTypeId, updNumber, updDate, contract, workAddress, contactFullName, contactPhone, plannedResolutionDate, plannedReactionTimeMinutes, assignedAt, plannedDurationMinutes, spentTimeHours, currentResponsibleUserId };
        console.log('Обновление заявки ID:', req.params.id, 'Данные:', updateData);
        logBidData('Обновление заявки ID: ' + req.params.id, updateData);

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
                ...(clientId && clientId.trim() && { clientId: parseInt(clientId) }), // Обновляем клиента если указано
                ...(title && { tema: title }), // Обновляем заголовок если указано
                ...(amount !== undefined && amount !== null && { amount: (amount !== undefined && amount !== null && amount.toString().trim() !== '') ? parseFloat(amount) : 0 }), // Обновляем сумму если указано
                ...(status !== undefined && { status }), // Обновляем статус если указано
                ...(description !== undefined && { description }), // Обновляем описание если указано
                ...(bidTypeId !== undefined && bidTypeId !== null && bidTypeId.trim() && { bidTypeId: parseInt(bidTypeId) }), // Обновляем тип заявки если указано
                clientObjectId: clientObjectId && clientObjectId.trim() ? parseInt(clientObjectId) : null, // Обновляем объект клиента
                ...(updNumber !== undefined && { updNumber }), // Обновляем номер УПД если указано
                ...(updDate !== undefined && { updDate: updDate ? new Date(updDate) : null }), // Обновляем дату УПД если указано
                ...(contract !== undefined && { contract }), // Обновляем контракт если указано
                ...(workAddress !== undefined && { workAddress }), // Обновляем адрес проведения работ если указано
                ...(contactFullName !== undefined && { contactFullName }), // Обновляем ФИО контакта если указано
                ...(contactPhone !== undefined && { contactPhone }), // Обновляем телефон контакта если указано
                ...(plannedResolutionDate !== undefined && { plannedResolutionDate: plannedResolutionDate && plannedResolutionDate.trim() ? new Date(plannedResolutionDate.length === 16 ? plannedResolutionDate + ':00' : plannedResolutionDate) : null }),
                ...(plannedReactionTimeMinutes !== undefined && { plannedReactionTimeMinutes: plannedReactionTimeMinutes && plannedReactionTimeMinutes.trim() ? parseInt(plannedReactionTimeMinutes) : null }),
                ...(assignedAt !== undefined && { assignedAt: assignedAt && assignedAt.trim() ? new Date(assignedAt.length === 16 ? assignedAt + ':00' : assignedAt) : null }),
                ...(plannedDurationMinutes !== undefined && { plannedDurationMinutes: plannedDurationMinutes && plannedDurationMinutes.trim() ? parseInt(plannedDurationMinutes) : null }),
                ...(spentTimeHours !== undefined && { spentTimeHours: spentTimeHours && spentTimeHours.trim() ? parseFloat(spentTimeHours) : null }),
                ...(currentResponsibleUserId !== undefined && { currentResponsibleUserId: currentResponsibleUserId ? parseInt(currentResponsibleUserId) : null }),
            },
            include: {
                client: {
                    select: {
                        name: true,
                    },
                },
                clientObject: true,
                bidType: true,
                creator: {
                    select: {
                        fullName: true,
                    },
                },
            },
        });

        // Логируем изменение статуса в AuditLog
        if (status !== undefined && status !== currentBid.status) {
            await prisma.auditLog.create({
                data: {
                    bidId: parseInt(req.params.id),
                    userId: req.user.id,
                    action: 'Изменение статуса',
                    details: `Статус изменен с "${currentBid.status}" на "${status}"`,
                },
            });
        }




        // Отправляем обновленную заявку
        res.json({
            ...updatedBid,
            title: updatedBid.tema, // Для совместимости с фронтендом
            clientName: updatedBid.client.name,
            creatorName: updatedBid.creator.fullName,
            amount: parseFloat(updatedBid.amount),
            workAddress: updatedBid.workAddress, // Добавляем адрес проведения работ
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
        const { specificationId, executorIds, comment, discount } = req.body;

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
        const discountValue = discount !== undefined ? parseFloat(discount) : 0;
        const bidSpecification = await prisma.$queryRaw`
            INSERT INTO "BidSpecification" ("bidId", "specificationId", "executorIds", "discount", "createdAt", "updatedAt")
            VALUES (${bidId}, ${parseInt(specificationId)}, ${executorIds ? executorIds.map(id => parseInt(id)) : []}, ${discountValue}, NOW(), NOW())
            RETURNING *
        `;

        // Получаем спецификацию с связанными данными
        const specWithDetails = await prisma.bidSpecification.findUnique({
            where: { id: bidSpecification[0].id },
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
        if (specWithDetails.executorIds.length > 0) {
            executors = await prisma.user.findMany({
                where: { id: { in: specWithDetails.executorIds } },
                select: { id: true, fullName: true },
            });
        }

        res.status(201).json({
            ...specWithDetails,
            discount: bidSpecification[0].discount,
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
        const { executorIds, comment, discount } = req.body;

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
        const discountValue = discount !== undefined ? parseFloat(discount) : existingSpec.discount;
        await prisma.$executeRaw`
            UPDATE "BidSpecification"
            SET "executorIds" = ${executorIds ? executorIds.map(id => parseInt(id)) : []},
                "discount" = ${discountValue},
                "updatedAt" = NOW()
            WHERE "id" = ${specId}
        `;

        // Получаем обновленную спецификацию
        const updatedSpec = await prisma.bidSpecification.findUnique({
            where: { id: specId },
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
            discount: discountValue,
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