/**
 * Middleware для аутентификации по API токену
 * 
 * Этот middleware проверяет валидность API токена из заголовка X-API-Token
 * и предоставляет доступ к защищенным внешним API endpoints.
 */

const prisma = require('../prisma/client');
const bcrypt = require('bcryptjs');

const apiAuthMiddleware = async (req, res, next) => {
    try {
        // Получаем токен из заголовка X-API-Token
        const token = req.headers['x-api-token'];

        if (!token) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'API токен не предоставлен. Используйте заголовок X-API-Token' 
            });
        }

        // Ищем все активные токены в базе данных
        const apiTokens = await prisma.apiToken.findMany({
            where: { isActive: true },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        // Проверяем токен среди всех активных токенов
        let foundToken = null;
        for (const apiToken of apiTokens) {
            const isValidToken = await bcrypt.compare(token, apiToken.token);
            if (isValidToken) {
                foundToken = apiToken;
                break;
            }
        }

        if (!foundToken) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Неверный или неактивный API токен' 
            });
        }

        // Проверяем, не истек ли токен
        if (foundToken.expiresAt && new Date() > foundToken.expiresAt) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Срок действия API токена истек' 
            });
        }

        // Обновляем время последнего использования
        await prisma.apiToken.update({
            where: { id: foundToken.id },
            data: { lastUsedAt: new Date() },
        });

        // Добавляем информацию о токене и пользователе в request
        req.apiToken = {
            id: foundToken.id,
            name: foundToken.name,
            permissions: foundToken.permissions,
        };
        req.apiUser = foundToken.user;

        next();
    } catch (error) {
        console.error('API Auth middleware error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error',
            message: 'Ошибка при проверке API токена' 
        });
    }
};

// Middleware для проверки конкретного разрешения
const requirePermission = (permission) => {
    return (req, res, next) => {
        const permissions = req.apiToken?.permissions || {};
        
        if (!permissions[permission]) {
            return res.status(403).json({ 
                error: 'Forbidden',
                message: `У вас нет разрешения для выполнения этой операции (требуется: ${permission})` 
            });
        }
        
        next();
    };
};

module.exports = apiAuthMiddleware;
module.exports.requirePermission = requirePermission;
