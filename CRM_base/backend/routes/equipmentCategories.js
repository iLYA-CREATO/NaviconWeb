const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Получение всех категорий оборудования
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.equipmentCategory.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching equipment categories:', error);
        res.status(500).json({ message: 'Ошибка при получении категорий оборудования' });
    }
});

// Получение категории оборудования по ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.equipmentCategory.findUnique({
            where: { id: parseInt(id) }
        });
        if (!category) {
            return res.status(404).json({ message: 'Категория оборудования не найдена' });
        }
        res.json(category);
    } catch (error) {
        console.error('Error fetching equipment category:', error);
        res.status(500).json({ message: 'Ошибка при получении категории оборудования' });
    }
});

// Создание новой категории оборудования
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        // Проверка на уникальность имени
        const existing = await prisma.equipmentCategory.findUnique({
            where: { name }
        });
        if (existing) {
            return res.status(400).json({ message: 'Категория оборудования с таким названием уже существует' });
        }
        
        const category = await prisma.equipmentCategory.create({
            data: {
                name,
                description: description || null,
                updatedAt: new Date()
            }
        });
        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating equipment category:', error);
        res.status(500).json({ message: 'Ошибка при создании категории оборудования' });
    }
});

// Обновление категории оборудования
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        
        // Проверка на уникальность имени (если изменяется)
        if (name) {
            const existing = await prisma.equipmentCategory.findFirst({
                where: { 
                    name,
                    NOT: { id: parseInt(id) }
                }
            });
            if (existing) {
                return res.status(400).json({ message: 'Категория оборудования с таким названием уже существует' });
            }
        }
        
        const category = await prisma.equipmentCategory.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                updatedAt: new Date()
            }
        });
        res.json(category);
    } catch (error) {
        console.error('Error updating equipment category:', error);
        res.status(500).json({ message: 'Ошибка при обновлении категории оборудования' });
    }
});

// Удаление категории оборудования
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Проверка, используется ли категория в оборудовании
        const equipmentWithCategory = await prisma.equipment.findFirst({
            where: { category: parseInt(id) }
        });
        if (equipmentWithCategory) {
            return res.status(400).json({ message: 'Нельзя удалить категорию, используемую в оборудовании' });
        }
        
        await prisma.equipmentCategory.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Категория оборудования удалена' });
    } catch (error) {
        console.error('Error deleting equipment category:', error);
        res.status(500).json({ message: 'Ошибка при удалении категории оборудования' });
    }
});

module.exports = router;
