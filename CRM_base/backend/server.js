require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Prisma routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const bidRoutes = require('./routes/bids');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Navicon API работает с Prisma + PostgreSQL' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📊 Используется Prisma ORM с PostgreSQL`);
});