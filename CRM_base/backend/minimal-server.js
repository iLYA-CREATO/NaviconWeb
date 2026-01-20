require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

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

// Получить все роли
app.get('/api/roles', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching roles...');
        const roles = await prisma.role.findMany({
            orderBy: { createdAt: 'desc' },
        });
        console.log('Roles found:', roles.length);
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Тестовый маршрут без аутентификации
app.get('/api/test-roles', async (req, res) => {
    try {
        console.log('Testing roles without auth...');
        const roles = await prisma.role.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(roles);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Minimal server running on port ${PORT}`);
    console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});