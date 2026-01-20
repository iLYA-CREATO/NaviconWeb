const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/api/roles', async (req, res) => {
    try {
        const roles = await prisma.role.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.listen(3000, () => {
    console.log('Test server running on port 3000');
});