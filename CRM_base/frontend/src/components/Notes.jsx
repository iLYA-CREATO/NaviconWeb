/**
 * Notes Component
 *
 * Компонент канбан-доски заметок.
 * Позволяет пользователям создавать колонки и заметки, управлять ими.
 */

import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, GripVertical, StickyNote } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import { 
    getNotes, 
    createNoteColumn, 
    updateNoteColumn, 
    deleteNoteColumn, 
    createNote, 
    updateNote, 
    deleteNote 
} from '../services/api';

const Notes = () => {
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Состояния для создания/редактирования
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [newColumnColor, setNewColumnColor] = useState('#3B82F6');
    
    // Состояния для редактирования заметки (открытая заметка)
    const [expandedNote, setExpandedNote] = useState(null);
    const [expandedNoteContent, setExpandedNoteContent] = useState('');
    
    // Состояния для создания заметки
    const [addingNoteToColumn, setAddingNoteToColumn] = useState(null);
    const [newNoteContent, setNewNoteContent] = useState('');

    // Состояния для подтверждения удаления
    const [confirmDialog, setConfirmDialog] = useState(null);

    // Цветовая палитра для колонок
    const columnColors = [
        { value: '#3B82F6', name: 'Синий' },
        { value: '#10B981', name: 'Зеленый' },
        { value: '#F59E0B', name: 'Оранжевый' },
        { value: '#EF4444', name: 'Красный' },
        { value: '#8B5CF6', name: 'Фиолетовый' },
        { value: '#EC4899', name: 'Розовый' },
        { value: '#6366F1', name: 'Индиго' },
        { value: '#14B8A6', name: 'Бирюзовый' },
    ];

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await getNotes();
            if (response.data.success) {
                setColumns(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching notes:', err);
            setError('Ошибка при загрузке заметок');
        } finally {
            setLoading(false);
        }
    };

    // Создание новой колонки
    const handleCreateColumn = async () => {
        if (!newColumnTitle.trim()) return;
        
        try {
            const response = await createNoteColumn({ 
                title: newColumnTitle.trim(),
                color: newColumnColor
            });
            if (response.data.success) {
                setColumns([...columns, response.data.data]);
                setNewColumnTitle('');
                setNewColumnColor('#3B82F6');
                setIsAddingColumn(false);
            }
        } catch (err) {
            console.error('Error creating column:', err);
            setError('Ошибка при создании колонки');
        }
    };

    // Обновление колонки
    const handleUpdateColumn = async (columnId, newTitle, newColor) => {
        try {
            const response = await updateNoteColumn(columnId, { 
                title: newTitle,
                color: newColor
            });
            if (response.data.success) {
                setColumns(columns.map(col => 
                    col.id === columnId ? response.data.data : col
                ));
            }
        } catch (err) {
            console.error('Error updating column:', err);
            setError('Ошибка при обновлении колонки');
        }
    };

    // Удаление колонки
    const handleDeleteColumn = async (columnId) => {
        try {
            const response = await deleteNoteColumn(columnId);
            if (response.data.success) {
                setColumns(columns.filter(col => col.id !== columnId));
            }
        } catch (err) {
            console.error('Error deleting column:', err);
            setError('Ошибка при удалении колонки');
        }
    };

    // Создание заметки
    const handleCreateNote = async (columnId) => {
        if (!newNoteContent.trim()) return;
        
        try {
            const response = await createNote({
                columnId,
                title: newNoteContent.trim().substring(0, 50),
                content: newNoteContent.trim()
            });
            if (response.data.success) {
                setColumns(columns.map(col => {
                    if (col.id === columnId) {
                        return { ...col, notes: [...col.notes, response.data.data] };
                    }
                    return col;
                }));
                setNewNoteContent('');
                setAddingNoteToColumn(null);
            }
        } catch (err) {
            console.error('Error creating note:', err);
            setError('Ошибка при создании заметки');
        }
    };

    // Обновление заметки (расширенное представление)
    const handleUpdateNote = async (noteId) => {
        if (!expandedNoteContent.trim()) return;
        
        try {
            const response = await updateNote(noteId, {
                title: expandedNoteContent.trim().substring(0, 50),
                content: expandedNoteContent.trim()
            });
            if (response.data.success) {
                setColumns(columns.map(col => ({
                    ...col,
                    notes: col.notes.map(note => 
                        note.id === noteId ? response.data.data : note
                    )
                })));
                setExpandedNote(null);
                setExpandedNoteContent('');
            }
        } catch (err) {
            console.error('Error updating note:', err);
            setError('Ошибка при обновлении заметки');
        }
    };

    // Удаление заметки
    const handleDeleteNote = async (noteId) => {
        try {
            const response = await deleteNote(noteId);
            if (response.data.success) {
                setColumns(columns.map(col => ({
                    ...col,
                    notes: col.notes.filter(note => note.id !== noteId)
                })));
                if (expandedNote === noteId) {
                    setExpandedNote(null);
                    setExpandedNoteContent('');
                }
            }
        } catch (err) {
            console.error('Error deleting note:', err);
            setError('Ошибка при удалении заметки');
        }
    };

    // Открыть заметку для просмотра/редактирования
    const openNote = (note) => {
        setExpandedNote(note.id);
        setExpandedNoteContent(note.content || '');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Загрузка заметок...</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Заметки</h1>
                <Button 
                    onClick={() => setIsAddingColumn(true)}
                    icon={<Plus size={20} />}
                >
                    Добавить колонку
                </Button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                    <button 
                        onClick={() => setError(null)}
                        className="float-right text-red-700 hover:text-red-900"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Модальное окно подтверждения удаления */}
            {confirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Подтверждение удаления</h3>
                        </div>
                        <div className="p-4">
                            <p className="text-gray-600">{confirmDialog.message}</p>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                            <Button 
                                variant="secondary"
                                onClick={() => setConfirmDialog(null)}
                            >
                                Отмена
                            </Button>
                            <Button 
                                variant="danger"
                                onClick={() => {
                                    confirmDialog.onConfirm();
                                    setConfirmDialog(null);
                                }}
                            >
                                Удалить
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно для заметки */}
            {expandedNote && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">Редактирование заметки</h3>
                            <button
                                onClick={() => {
                                    setExpandedNote(null);
                                    setExpandedNoteContent('');
                                }}
                                className="p-1 text-gray-500 hover:text-gray-700 rounded"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-auto">
                            <Textarea
                                value={expandedNoteContent}
                                onChange={(e) => setExpandedNoteContent(e.target.value)}
                                placeholder="Текст заметки..."
                                rows={15}
                                className="w-full h-full min-h-[300px]"
                            />
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-between">
                            <Button 
                                variant="danger"
                                onClick={() => {
                                    setExpandedNote(null);
                                    setExpandedNoteContent('');
                                    setConfirmDialog({
                                        message: 'Вы уверены, что хотите удалить эту заметку?',
                                        onConfirm: () => handleDeleteNote(expandedNote)
                                    });
                                }}
                            >
                                Удалить
                            </Button>
                            <div className="flex gap-2">
                                <Button 
                                    variant="secondary"
                                    onClick={() => {
                                        setExpandedNote(null);
                                        setExpandedNoteContent('');
                                    }}
                                >
                                    Отмена
                                </Button>
                                <Button onClick={() => handleUpdateNote(expandedNote)}>
                                    Сохранить
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Канбан доска */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 h-full min-h-[calc(100vh-200px)] pb-4">
                    {/* Колонки */}
                    {columns.length > 0 ? (
                        <>
                            {columns.map(column => (
                                <div 
                                    key={column.id}
                                    className="flex-shrink-0 w-80 bg-gray-100 rounded-lg flex flex-col"
                                >
                                    {/* Заголовок колонки */}
                                    <div 
                                        className="p-3 rounded-t-lg flex items-center justify-between"
                                        style={{ backgroundColor: column.color + '20', borderLeft: `4px solid ${column.color}` }}
                                    >
                                        <div className="font-semibold text-gray-700 flex-1">
                                            {column.title}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    const newTitle = prompt('Новое название колонки:', column.title);
                                                    if (newTitle && newTitle.trim()) {
                                                        handleUpdateColumn(column.id, newTitle.trim(), column.color);
                                                    }
                                                }}
                                                className="p-1 text-gray-500 hover:text-gray-700 rounded"
                                                title="Переименовать"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setConfirmDialog({
                                                        message: `Вы уверены, что хотите удалить колонку "${column.title}" со всеми заметками?`,
                                                        onConfirm: () => handleDeleteColumn(column.id)
                                                    });
                                                }}
                                                className="p-1 text-gray-500 hover:text-red-600 rounded"
                                                title="Удалить колонку"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Список заметок */}
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                        {column.notes && column.notes.map(note => (
                                            <div 
                                                key={note.id}
                                                onClick={() => openNote(note)}
                                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
                                            >
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">
                                                    {note.content}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(note.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))}

                                        {/* Кнопка добавления заметки */}
                                        {addingNoteToColumn === column.id ? (
                                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 space-y-2">
                                                <Textarea
                                                    value={newNoteContent}
                                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                                    placeholder="Текст заметки..."
                                                    rows={4}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => handleCreateNote(column.id)}
                                                    >
                                                        Добавить
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="secondary"
                                                        onClick={() => {
                                                            setAddingNoteToColumn(null);
                                                            setNewNoteContent('');
                                                        }}
                                                    >
                                                        Отмена
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setAddingNoteToColumn(column.id)}
                                                className="w-full p-2 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                <Plus size={18} />
                                                <span>Добавить заметку</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Счетчик заметок */}
                                    <div className="p-2 text-xs text-gray-500 text-center border-t border-gray-200">
                                        {column.notes?.length || 0} заметок
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : null}

                    {/* Кнопка добавления колонки или форма */}
                    <div className="flex-shrink-0 w-80">
                        {isAddingColumn ? (
                            <div className="bg-gray-100 rounded-lg p-4 space-y-3">
                                <Input
                                    value={newColumnTitle}
                                    onChange={(e) => setNewColumnTitle(e.target.value)}
                                    placeholder="Название колонки"
                                    autoFocus
                                />
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Цвет:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {columnColors.map(color => (
                                            <button
                                                key={color.value}
                                                onClick={() => setNewColumnColor(color.value)}
                                                className={`w-8 h-8 rounded-full transition-transform ${
                                                    newColumnColor === color.value 
                                                        ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' 
                                                        : ''
                                                }`}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleCreateColumn}>
                                        Создать
                                    </Button>
                                    <Button 
                                        variant="secondary"
                                        onClick={() => {
                                            setIsAddingColumn(false);
                                            setNewColumnTitle('');
                                            setNewColumnColor('#3B82F6');
                                        }}
                                    >
                                        Отмена
                                    </Button>
                                </div>
                            </div>
                        ) : columns.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-gray-400">
                                Пусто
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notes;
