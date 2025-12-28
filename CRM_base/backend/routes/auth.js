const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return res.status(400).json({ message: 'Неверные учетные данные' });
        }

        // Check password (plain text for development)
        if (password !== user.password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }],
            },
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.username === username
                    ? 'Имя пользователя уже существует'
                    : 'Email уже существует'
            });
        }

        // Create user (plain text password for development)
        const newUser = await prisma.user.create({
            data: {
                username,
                password, // Plain text for development ONLY!
                email,
            },
        });

        // Create token
        const token = jwt.sign(
            { id: newUser.id, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;