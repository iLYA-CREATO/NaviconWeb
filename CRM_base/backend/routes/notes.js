/**
 * Маршруты для работы с заметками (Notes)
 *
 * Этот модуль содержит все API endpoints для CRUD операций с заметками и колонками канбан-доски.
 */

// Импорт Express для создания маршрутов
const express = require('express');
const router = express.Router();
// Импорт middleware для аутентификации
const authMiddleware = require('../middleware/auth');
// Импорт Prisma клиента для работы с базой данных
const prisma = require('../prisma/client');

// Получить все колонки и заметки пользователя
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        console.log(`Getting notes for user ${userId}`);

        // Получаем все колонки пользователя с их заметками
        const columns = await prisma.noteColumn.findMany({
            where: { userId },
            include: {
                notes: {
                    orderBy: { position: 'asc' },
                },
            },
            orderBy: { position: 'asc' },
        });

        res.json({
            success: true,
            data: columns,
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении заметок',
        });
    }
});

// Создать новую колонку
router.post('/columns', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, color } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                error: 'Название колонки обязательно',
            });
        }

        // Получаем максимальную позицию
        const lastColumn = await prisma.noteColumn.findFirst({
            where: { userId },
            orderBy: { position: 'desc' },
        });

        const newPosition = lastColumn ? lastColumn.position + 1 : 0;

        const column = await prisma.noteColumn.create({
            data: {
                userId,
                title,
                color: color || '#3B82F6',
                position: newPosition,
            },
            include: {
                notes: true,
            },
        });

        res.json({
            success: true,
            data: column,
        });
    } catch (error) {
        console.error('Error creating column:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при создании колонки',
        });
    }
});

// Обновить колонку
router.put('/columns/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, color, position } = req.body;

        // Проверяем, что колонка принадлежит пользователю
        const existingColumn = await prisma.noteColumn.findFirst({
            where: { id: parseInt(id), userId },
        });

        if (!existingColumn) {
            return res.status(404).json({
                success: false,
                error: 'Колонка не найдена',
            });
        }

        const column = await prisma.noteColumn.update({
            where: { id: parseInt(id) },
            data: {
                ...(title && { title }),
                ...(color && { color }),
                ...(position !== undefined && { position }),
            },
            include: {
                notes: {
                    orderBy: { position: 'asc' },
                },
            },
        });

        res.json({
            success: true,
            data: column,
        });
    } catch (error) {
        console.error('Error updating column:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении колонки',
        });
    }
});

// Удалить колонку
router.delete('/columns/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Проверяем, что колонка принадлежит пользователю
        const existingColumn = await prisma.noteColumn.findFirst({
            where: { id: parseInt(id), userId },
        });

        if (!existingColumn) {
            return res.status(404).json({
                success: false,
                error: 'Колонка не найдена',
            });
        }

        // Удаляем колонку (все заметки удалятся каскадно)
        await prisma.noteColumn.delete({
            where: { id: parseInt(id) },
        });

        res.json({
            success: true,
            message: 'Колонка удалена',
        });
    } catch (error) {
        console.error('Error deleting column:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при удалении колонки',
        });
    }
});

// Создать новую заметку
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { columnId, title, content, color } = req.body;

        if (!columnId || !title) {
            return res.status(400).json({
                success: false,
                error: 'ID колонки и название заметки обязательны',
            });
        }

        // Проверяем, что колонка принадлежит пользователю
        const column = await prisma.noteColumn.findFirst({
            where: { id: parseInt(columnId), userId },
        });

        if (!column) {
            return res.status(404).json({
                success: false,
                error: 'Колонка не найдена',
            });
        }

        // Получаем максимальную позицию в колонке
        const lastNote = await prisma.note.findFirst({
            where: { columnId: parseInt(columnId) },
            orderBy: { position: 'desc' },
        });

        const newPosition = lastNote ? lastNote.position + 1 : 0;

        const note = await prisma.note.create({
            data: {
                columnId: parseInt(columnId),
                title,
                content: content || '',
                color: color || '#FFFFFF',
                position: newPosition,
            },
        });

        res.json({
            success: true,
            data: note,
        });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при создании заметки',
        });
    }
});

// Обновить заметку
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, content, color, position, columnId } = req.body;

        // Проверяем, что заметка принадлежит пользователю через колонку
        const note = await prisma.note.findFirst({
            where: { 
                id: parseInt(id),
                column: { userId },
            },
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                error: 'Заметка не найдена',
            });
        }

        // Если указан newColumnId, проверяем, что новая колонка принадлежит пользователю
        let newColumnId = note.columnId;
        if (columnId && columnId !== note.columnId) {
            const newColumn = await prisma.noteColumn.findFirst({
                where: { id: parseInt(columnId), userId },
            });
            if (!newColumn) {
                return res.status(404).json({
                    success: false,
                    error: 'Новая колонка не найдена',
                });
            }
            newColumnId = parseInt(columnId);
        }

        const updatedNote = await prisma.note.update({
            where: { id: parseInt(id) },
            data: {
                ...(title && { title }),
                ...(content !== undefined && { content }),
                ...(color && { color }),
                ...(position !== undefined && { position }),
                ...(columnId && { columnId: newColumnId }),
            },
        });

        res.json({
            success: true,
            data: updatedNote,
        });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении заметки',
        });
    }
});

// Удалить заметку
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Проверяем, что заметка принадлежит пользователю
        const note = await prisma.note.findFirst({
            where: { 
                id: parseInt(id),
                column: { userId },
            },
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                error: 'Заметка не найдена',
            });
        }

        await prisma.note.delete({
            where: { id: parseInt(id) },
        });

        res.json({
            success: true,
            message: 'Заметка удалена',
        });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при удалении заметки',
        });
    }
});

// Переместить заметку в другую колонку или позицию
router.put('/:id/move', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { columnId, position } = req.body;

        // Проверяем, что заметка принадлежит пользователю
        const note = await prisma.note.findFirst({
            where: { 
                id: parseInt(id),
                column: { userId },
            },
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                error: 'Заметка не найдена',
            });
        }

        let newColumnId = note.columnId;
        
        // Если указан columnId, проверяем, что колонка принадлежит пользователю
        if (columnId) {
            const column = await prisma.noteColumn.findFirst({
                where: { id: parseInt(columnId), userId },
            });
            if (!column) {
                return res.status(404).json({
                    success: false,
                    error: 'Колонка не найдена',
                });
            }
            newColumnId = parseInt(columnId);
        }

        // Обновляем заметку
        const updatedNote = await prisma.note.update({
            where: { id: parseInt(id) },
            data: {
                columnId: newColumnId,
                ...(position !== undefined && { position }),
            },
        });

        res.json({
            success: true,
            data: updatedNote,
        });
    } catch (error) {
        console.error('Error moving note:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при перемещении заметки',
        });
    }
});

module.exports = router;
