/**
 * Маршруты для управления API токенами
 * 
 * Этот модуль содержит endpoints для создания, просмотра и отзыва API токенов
 * для внешнего доступа к системе.
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../prisma/client');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Генерация случайного токена
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Получение списка API токенов пользователя
router.get('/', authMiddleware, async (req, res) => {
    try {
        const tokens = await prisma.apiToken.findMany({
            where: { userId: req.user.id },
            select: {
                id: true,
                name: true,
                permissions: true,
                expiresAt: true,
                lastUsedAt: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                // Не возвращаем сам токен в списке
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(tokens);
    } catch (error) {
        console.error('Get API tokens error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создание нового API токена
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, permissions, expiresInDays } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Название токена обязательно' });
        }

        // Генерация нового токена
        const token = generateToken();
        
        // Хеширование токена для безопасного хранения
        const hashedToken = await bcrypt.hash(token, 10);

        // Вычисление даты истечения (если указано)
        let expiresAt = null;
        if (expiresInDays && parseInt(expiresInDays) > 0) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
        }

        // Создание токена в базе данных
        const apiToken = await prisma.apiToken.create({
            data: {
                name,
                token: hashedToken,
                userId: req.user.id,
                permissions: permissions || { clients: true, objects: true, bids: true },
                expiresAt,
                isActive: true,
            },
        });

        // Возвращаем токен только один раз - при создании
        res.status(201).json({
            id: apiToken.id,
            name: apiToken.name,
            token: token, // Возвращаем токен только при создании!
            permissions: apiToken.permissions,
            expiresAt: apiToken.expiresAt,
            isActive: apiToken.isActive,
            createdAt: apiToken.createdAt,
            message: 'Токен создан успешно. Сохраните его в безопасном месте - это единственный раз, когда вы его видите!',
        });
    } catch (error) {
        console.error('Create API token error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновление токена (активация/деактивация, изменение прав)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, permissions, isActive } = req.body;
        const tokenId = parseInt(req.params.id);

        // Проверяем, что токен принадлежит пользователю
        const existingToken = await prisma.apiToken.findFirst({
            where: { id: tokenId, userId: req.user.id },
        });

        if (!existingToken) {
            return res.status(404).json({ message: 'Токен не найден' });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (permissions) updateData.permissions = permissions;
        if (typeof isActive === 'boolean') updateData.isActive = isActive;

        const updatedToken = await prisma.apiToken.update({
            where: { id: tokenId },
            data: updateData,
            select: {
                id: true,
                name: true,
                permissions: true,
                expiresAt: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json(updatedToken);
    } catch (error) {
        console.error('Update API token error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удаление (отзыв) токена
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const tokenId = parseInt(req.params.id);

        // Проверяем, что токен принадлежит пользователю
        const existingToken = await prisma.apiToken.findFirst({
            where: { id: tokenId, userId: req.user.id },
        });

        if (!existingToken) {
            return res.status(404).json({ message: 'Токен не найден' });
        }

        await prisma.apiToken.delete({
            where: { id: tokenId },
        });

        res.json({ message: 'Токен успешно удален' });
    } catch (error) {
        console.error('Delete API token error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Регенерация токена (отзыв старого и создание нового)
router.post('/:id/regenerate', authMiddleware, async (req, res) => {
    try {
        const { expiresInDays } = req.body;
        const tokenId = parseInt(req.params.id);

        // Проверяем, что токен принадлежит пользователю
        const existingToken = await prisma.apiToken.findFirst({
            where: { id: tokenId, userId: req.user.id },
        });

        if (!existingToken) {
            return res.status(404).json({ message: 'Токен не найден' });
        }

        // Генерация нового токена
        const token = generateToken();
        const hashedToken = await bcrypt.hash(token, 10);

        // Вычисление даты истечения
        let expiresAt = null;
        if (expiresInDays && parseInt(expiresInDays) > 0) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
        } else if (existingToken.expiresAt) {
            expiresAt = existingToken.expiresAt;
        }

        const updatedToken = await prisma.apiToken.update({
            where: { id: tokenId },
            data: {
                token: hashedToken,
                expiresAt,
            },
        });

        // Возвращаем новый токен
        res.json({
            id: updatedToken.id,
            name: updatedToken.name,
            token: token, // Возвращаем новый токен
            permissions: updatedToken.permissions,
            expiresAt: updatedToken.expiresAt,
            isActive: updatedToken.isActive,
            createdAt: updatedToken.createdAt,
            message: 'Токен обновлен успешно. Сохраните новый токен в безопасном месте!',
        });
    } catch (error) {
        console.error('Regenerate API token error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
