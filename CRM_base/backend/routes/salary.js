const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Получить отчет по зарплате для пользователя(ей) за период
router.get('/report', authenticateToken, async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.query;

        let whereClause = {
            createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        };

        if (userId && userId !== 'all') {
            whereClause.executorId = parseInt(userId);
        }

        const bidSpecifications = await prisma.bidSpecification.findMany({
            where: whereClause,
            include: {
                specification: {
                    include: {
                        category: true,
                    },
                },
                bid: {
                    include: {
                        client: true,
                        clientObject: true,
                        creator: true,
                    },
                },
                executor: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json(bidSpecifications);
    } catch (error) {
        console.error('Error fetching salary report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;