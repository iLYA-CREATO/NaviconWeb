require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Получить все роли
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
            details: error.message
        });
    }
});

// Создать роль
app.post('/api/roles', async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        console.log('Creating role:', { name, description, permissions });

        const role = await prisma.role.create({
            data: { name, description, permissions },
        });
        console.log('Role created:', role);
        res.status(201).json(role);
    } catch (error) {
        console.error('Error creating role:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Role name already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Обновить роль
app.put('/api/roles/:id', async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        console.log('Updating role:', req.params.id, { name, description, permissions });

        const role = await prisma.role.update({
            where: { id: parseInt(req.params.id) },
            data: { name, description, permissions },
        });
        console.log('Role updated:', role);
        res.json(role);
    } catch (error) {
        console.error('Error updating role:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Role name already exists' });
        } else if (error.code === 'P2025') {
            res.status(404).json({ error: 'Role not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Test roles server running on port ${PORT}`);
    console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});