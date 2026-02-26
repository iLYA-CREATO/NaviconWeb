/**
 * Clients Component
 *
 * Этот компонент управляет отображением и созданием клиентов.
 * Показывает список клиентов, позволяет искать и фильтровать, а также добавлять новых клиентов.
 * Сохраняет настройки поиска, фильтров и столбцов в localStorage.
 */

// Импорт хуков React для управления состоянием и эффектами
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, createClient, getUsers, getEnabledClientAttributes } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { usePermissions } from '../hooks/usePermissions';
import Button from './Button';
import Input from './Input';
import Select from './Select';

const Clients = () => {
    // Хук для навигации
    const navigate = useNavigate();
    // Хук для проверки разрешений
    const { hasPermission } = usePermissions();
    // Хук для получения текущего пользователя
    const { user: currentUser } = useAuth();

    // Состояние для списка клиентов
    const [clients, setClients] = useState([]);
    // Состояние для списка пользователей (для выбора ответственного)
    const [users, setUsers] = useState([]);
    // Состояние для показа модального окна создания клиента
    const [showModal, setShowModal] = useState(false);
    // Состояние для данных формы создания клиента
    const [formData, setFormData] = useState({
        name: '',         // Имя клиента
        email: '',        // Email клиента
        phone: '',        // Телефон клиента
        responsibleId: '', // ID ответственного пользователя
    });
    // Состояние для поискового запроса (сохранение в localStorage)
    const [searchQuery, setSearchQuery] = useState(localStorage.getItem('clientsSearchQuery') || '');
    // Состояние для фильтра по ответственному (сохранение в localStorage)
    const [responsibleFilter, setResponsibleFilter] = useState(localStorage.getItem('clientsResponsibleFilter') || '');
    // Состояние для режима "Кроме" для фильтра ответственного
    const [responsibleExceptMode, setResponsibleExceptMode] = useState(false);
    // Состояние для видимых фильтров (сохранение в localStorage)
    const [visibleFilters, setVisibleFilters] = useState(() => {
        const saved = localStorage.getItem('clientsVisibleFilters');
        return saved ? JSON.parse(saved) : { responsible: false }; // По умолчанию фильтр ответственного скрыт
    });
    // Состояние для показа модального окна выбора фильтров
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Определение всех возможных колонок
    const allColumns = ['name', 'email', 'phone', 'responsible', 'bidsCount', 'objectsCount'];
    // Загрузка начальных состояний из localStorage
    const savedColumns = localStorage.getItem('clientsVisibleColumns');
    const defaultVisibleColumns = {
        name: true,
        email: true,
        phone: true,
        responsible: true,
        bidsCount: true,
        objectsCount: true,
    };
    const initialVisibleColumns = savedColumns ? { ...defaultVisibleColumns, ...JSON.parse(savedColumns) } : defaultVisibleColumns;
    const savedOrder = localStorage.getItem('clientsColumnOrder');
    let initialColumnOrder = savedOrder ? JSON.parse(savedOrder).filter(col => allColumns.includes(col)) : allColumns;

    // Ensure all new columns are included in the order
    allColumns.forEach(col => {
        if (!initialColumnOrder.includes(col)) {
            initialColumnOrder.push(col);
        }
    });

    // Состояние для порядка колонок
    const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
    // Состояние для видимых колонок в таблице
    const [visibleColumns, setVisibleColumns] = useState(initialVisibleColumns);
    // Состояние для показа выпадающего списка настроек колонок
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    // useEffect для загрузки клиентов с debounce при изменении поиска или фильтра
    useEffect(() => {
        const timeout = setTimeout(() => fetchClients(searchQuery, responsibleFilter), 300); // Задержка 300мс для оптимизации
        return () => clearTimeout(timeout); // Очистка таймера при изменении зависимостей
    }, [searchQuery, responsibleFilter]); // Зависимости: поиск и фильтр

    // useEffect для загрузки списка пользователей при монтировании компонента
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getUsers(); // Получение пользователей с сервера
                setUsers(response.data); // Сохранение в состояние
            } catch (error) {
                console.error('Error fetching users:', error); // Логирование ошибки
            }
        };
        fetchUsers(); // Вызов функции
    }, []); // Пустой массив зависимостей - выполняется один раз при монтировании

    // useEffect для сохранения настроек колонок в localStorage
    useEffect(() => {
        localStorage.setItem('clientsVisibleColumns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    // useEffect to save column order to localStorage
    useEffect(() => {
        localStorage.setItem('clientsColumnOrder', JSON.stringify(columnOrder));
    }, [columnOrder]);

    // useEffect to close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showColumnSettings && !event.target.closest('.column-settings')) {
                setShowColumnSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColumnSettings]);

    // Функция для загрузки клиентов с параметрами поиска и фильтра
    const fetchClients = async (search = '', responsibleId = '') => {
        console.log('Fetching clients...'); // Логирование начала загрузки
        try {
            const response = await getClients(search, responsibleId); // Вызов API с параметрами
            console.log('Clients response:', response); // Логирование ответа
            setClients(response.data); // Сохранение данных в состояние
            console.log('Clients set:', response.data); // Логирование установки данных
        } catch (error) {
            console.error('Error fetching clients:', error); // Логирование ошибки
            console.error('Error details:', error.response); // Детали ошибки
        }
    };

    // Обработчик отправки формы создания клиента
    const handleSubmit = async (e) => {
        e.preventDefault(); // Предотвращение перезагрузки страницы
        try {
            await createClient(formData); // Отправка данных на сервер
            fetchClients(); // Перезагрузка списка клиентов
            resetForm(); // Сброс формы
        } catch (error) {
            console.error('Error saving client:', error); // Логирование ошибки
        }
    };

    // Обработчик клика по клиенту для просмотра деталей
    const handleView = (client) => {
        navigate(`/dashboard/clients/${client.id}`); // Переход на страницу деталей клиента
    };

    // Функция открытия модального окна создания клиента
    const openCreateModal = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            responsibleId: currentUser?.id || '',
        });
        setShowModal(true);
    };

    // Функция сброса формы к начальному состоянию
    const resetForm = () => {
        setFormData({ // Сброс данных формы
            name: '',
            email: '',
            phone: '',
            responsibleId: '',
        });
        setShowModal(false); // Скрытие модального окна
    };

    // Обработчик изменения видимости столбцов
    const handleColumnToggle = (column) => {
        setVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    // Функции для изменения порядка столбцов
    const moveUp = (index) => {
        if (index > 0) {
            const newOrder = [...columnOrder];
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            setColumnOrder(newOrder);
        }
    };

    const moveDown = (index) => {
        if (index < columnOrder.length - 1) {
            const newOrder = [...columnOrder];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setColumnOrder(newOrder);
        }
    };

    // Функция для получения названия столбца
    const getColumnLabel = (column) => {
        switch (column) {
            case 'name': return 'Имя';
            case 'email': return 'Email';
            case 'phone': return 'Телефон';
            case 'responsible': return 'Ответственный';
            case 'bidsCount': return 'Заявок';
            case 'objectsCount': return 'Объектов';
            default: return column;
        }
    };

    // Функция для получения содержимого ячейки
    const getCellContent = (client, column) => {
        switch (column) {
            case 'name': return client.name;
            case 'email': return client.email;
            case 'phone': return client.phone;
            case 'responsible': return client.responsible ? client.responsible.fullName || client.responsible.email : 'Не назначен';
            case 'bidsCount': return client._count?.bids || 0;
            case 'objectsCount': return client._count?.clientObjects || 0;
            default: return '';
        }
    };

    // Определение видимых столбцов в порядке columnOrder
    const displayColumns = columnOrder.filter(col => visibleColumns[col]);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Клиенты</h1>

            {/* Карточка с фильтрами и элементами управления */}
            <div className="bg-gray-200 rounded-lg p-4 mb-6">
                {/* Кнопка создания нового клиента */}
                <div className="flex justify-end mb-4">
                    {hasPermission('client_create') && (
                        <Button variant="primary" onClick={openCreateModal}>
                            + Добавить клиента
                        </Button>
                    )}
                </div>
                {/* Панель поиска и фильтров */}
                <div className="mb-4 flex gap-4">
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder="Поиск по имени..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="relative column-settings">
                        <Button variant="secondary" onClick={() => setShowColumnSettings(!showColumnSettings)}>
                            Настройки столбцов
                        </Button>
                        {showColumnSettings && (
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10 column-settings">
                                <div className="p-4">
                                    <h4 className="font-medium mb-2">Настройки столбцов</h4>
                                    {columnOrder.map((column, index) => (
                                        <div key={column} className="flex items-center justify-between mb-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns[column]}
                                                    onChange={() => handleColumnToggle(column)}
                                                    className="mr-2"
                                                />
                                                {getColumnLabel(column)}
                                            </label>
                                            {visibleColumns[column] && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => moveUp(index)}
                                                        disabled={index === 0}
                                                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs rounded"
                                                    >
                                                        ↑
                                                    </button>
                                                    <button
                                                        onClick={() => moveDown(index)}
                                                        disabled={index === columnOrder.length - 1}
                                                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs rounded"
                                                    >
                                                        ↓
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <Button variant="secondary" onClick={() => setShowFilterModal(true)}>
                        Добавить фильтр
                    </Button>
                </div>

                {/* Фильтр по ответственному, показывается если включен */}
                {visibleFilters.responsible && (
                    <div className="flex items-center gap-2">
                        <Select
                            value={responsibleFilter}
                            onChange={(e) => setResponsibleFilter(e.target.value)}
                            options={users.map(user => ({ value: user.id, label: user.fullName || user.username }))}
                            placeholder="Все ответственные"
                        />
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setVisibleFilters({ ...visibleFilters, responsible: false }); // Скрытие фильтра
                                setResponsibleFilter(''); // Сброс фильтра
                            }}
                            title="Удалить фильтр"
                        >
                            X
                        </Button>
                    </div>
                )}
            </div>

            {/* Таблица с клиентами */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                    <thead className="bg-gray-50">
                    <tr>
                        {displayColumns.map(column => (
                            <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>
                                {getColumnLabel(column)}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {/* Отображение списка клиентов */}
                    {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(client)}>
                            {displayColumns.map(column => (
                                <td key={column} className="px-6 py-4 whitespace-nowrap">
                                    {getCellContent(client, column)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Модальное окно выбора фильтров */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Выберите фильтр</h3>
                        <div className="space-y-2">
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setVisibleFilters({ ...visibleFilters, responsible: true }); // Включение фильтра по ответственному
                                    setShowFilterModal(false); // Закрытие модального окна
                                }}
                                className="w-full"
                            >
                                Ответственный
                            </Button>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button variant="secondary" onClick={() => setShowFilterModal(false)} className="flex-1">
                                Закрыть
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Модальное окно создания нового клиента */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">
                            Добавить нового клиента
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4"> {/* Форма с обработчиком отправки */}
                            <Input
                                label="Имя"
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <Input
                                label="Телефон"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                            <Select
                                label="Ответственный"
                                value={formData.responsibleId}
                                onChange={(e) => setFormData({ ...formData, responsibleId: e.target.value })}
                                options={users.map(user => ({ value: user.id, label: user.fullName || user.username }))}
                                placeholder="Не выбран"
                            />
                            <div className="flex gap-2 pt-4">
                                <Button type="submit" variant="primary" className="flex-1">
                                    Создать
                                </Button>
                                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                                    Отмена
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;