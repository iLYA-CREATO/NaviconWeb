const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Без аутентификации для тестирования
app.get('/api/roles', async (req, res) => {
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
            details: error.message,
            stack: error.stack
        });
    }
});

app.listen(5000, () => {
    console.log('Test roles server running on port 5000');
    console.log('Test endpoint: http://localhost:5000/api/roles');
});