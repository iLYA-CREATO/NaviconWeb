const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Получение всех категорий оборудования
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.equipmentCategory.findMany({
            orderBy: { name: 'asc' },
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
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
            where: { id: parseInt(id) },
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                children: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
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
        const { name, description, parentId } = req.body;
        
        // Проверка на уникальность имени в рамках одной родительской категории
        const existing = await prisma.equipmentCategory.findFirst({
            where: { 
                name,
                parentId: parentId ? parseInt(parentId) : null
            }
        });
        if (existing) {
            return res.status(400).json({ message: 'Категория оборудования с таким названием уже существует в данной категории' });
        }
        
        // Проверка что parentId существует если указан
        if (parentId) {
            const parentCategory = await prisma.equipmentCategory.findUnique({
                where: { id: parseInt(parentId) }
            });
            if (!parentCategory) {
                return res.status(400).json({ message: 'Родительская категория не найдена' });
            }
        }
        
        const category = await prisma.equipmentCategory.create({
            data: {
                name,
                description: description || null,
                parentId: parentId ? parseInt(parentId) : null,
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
        const { name, description, parentId } = req.body;
        
        // Проверка на уникальность имени (если изменяется)
        if (name) {
            const existing = await prisma.equipmentCategory.findFirst({
                where: { 
                    name,
                    parentId: parentId ? parseInt(parentId) : null,
                    NOT: { id: parseInt(id) }
                }
            });
            if (existing) {
                return res.status(400).json({ message: 'Категория оборудования с таким названием уже существует в данной категории' });
            }
        }
        
        // Проверка что parentId существует если указан
        if (parentId) {
            const parentCategory = await prisma.equipmentCategory.findUnique({
                where: { id: parseInt(parentId) }
            });
            if (!parentCategory) {
                return res.status(400).json({ message: 'Родительская категория не найдена' });
            }
            // Проверка на зацикливание (нельзя сделать категорию родителем самой себя или её потомка)
            if (parseInt(parentId) === parseInt(id)) {
                return res.status(400).json({ message: 'Категория не может быть родителем самой себя' });
            }
        }
        
        const category = await prisma.equipmentCategory.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                parentId: parentId ? parseInt(parentId) : null,
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
        
        // Проверка на наличие дочерних категорий
        const childCategories = await prisma.equipmentCategory.findMany({
            where: { parentId: parseInt(id) }
        });
        if (childCategories.length > 0) {
            return res.status(400).json({ message: 'Нельзя удалить категорию, содержащую вложенные категории. Сначала удалите или переместите дочерние категории.' });
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
