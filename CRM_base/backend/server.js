/**
 * Главный серверный файл backend приложения
 *
 * Этот файл настраивает Express сервер, подключает middleware,
 * регистрирует все API маршруты и запускает сервер.
 */

// Загрузка переменных окружения из .env файла
require('dotenv').config();
// Импорт Express.js для создания веб-сервера
const express = require('express');
// Импорт CORS для разрешения кросс-доменных запросов
const cors = require('cors');

// Импорт всех маршрутов API (использующих Prisma ORM)
const authRoutes = require('./routes/auth'); // Маршруты аутентификации
const clientRoutes = require('./routes/clients'); // Маршруты клиентов
const bidRoutes = require('./routes/bids'); // Маршруты заявок
const bidTypeRoutes = require('./routes/bidTypes'); // Маршруты типов заявок
const userRoutes = require('./routes/users'); // Маршруты пользователей
const roleRoutes = require('./routes/roles'); // Маршруты ролей
const clientObjectRoutes = require('./routes/clientObjects'); // Маршруты объектов клиентов
const equipmentRoutes = require('./routes/equipment'); // Маршруты оборудования
const supplierRoutes = require('./routes/suppliers'); // Маршруты поставщиков
const specificationRoutes = require('./routes/specifications'); // Маршруты спецификаций
const specificationCategoryRoutes = require('./routes/specificationCategories'); // Маршруты категорий спецификаций
const salaryRoutes = require('./routes/salary'); // Маршруты зарплаты
const bidEquipmentRoutes = require('./routes/bidEquipment'); // Маршруты оборудования заявок

// Создание экземпляра Express приложения
const app = express();

// === Middleware ===
// Разрешение CORS для всех доменов (в продакшене лучше настроить конкретные домены)
app.use(cors());
// Парсинг JSON тела запросов (увеличен лимит для bulk операций)
app.use(express.json({ limit: '50mb' }));
// Парсинг URL-encoded данных (для форм)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// === Регистрация маршрутов API ===
// Все маршруты доступны по префиксу /api
app.use('/api/auth', authRoutes); // /api/auth/*
app.use('/api/clients', clientRoutes); // /api/clients/*
app.use('/api/bids', bidRoutes); // /api/bids/*
app.use('/api/bid-types', bidTypeRoutes); // /api/bid-types/*
app.use('/api/users', userRoutes); // /api/users/*
app.use('/api/roles', roleRoutes); // /api/roles/*
app.use('/api/client-objects', clientObjectRoutes); // /api/client-objects/*
app.use('/api/equipment', equipmentRoutes); // /api/equipment/*
app.use('/api/suppliers', supplierRoutes); // /api/suppliers/*
app.use('/api/specifications', specificationRoutes); // /api/specifications/*
app.use('/api/specification-categories', specificationCategoryRoutes); // /api/specification-categories/*
app.use('/api/salary', salaryRoutes); // /api/salary/*
app.use('/api/bid-equipment', bidEquipmentRoutes); // /api/bid-equipment/*

// === Health check endpoint ===
// Проверка работоспособности сервера
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Navicon API работает с Prisma + PostgreSQL' });
});

// Получение порта из переменных окружения или значение по умолчанию
const PORT = process.env.PORT || 5000;

// Запуск сервера на указанном порту
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📊 Используется Prisma ORM с PostgreSQL`);
    // Тест перезапуска
});