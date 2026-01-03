/**
 * Bids Component
 *
 * This component manages the display and creation of bids (заявки).
 * It shows a list of existing bids, allows searching, and provides a form to create new bids.
 * Bids are associated with clients and optionally with client objects (vehicles/equipment).
 */

// Import React hooks for state management and side effects
import { useState, useEffect } from 'react';
// Import navigation hook from React Router for programmatic navigation
import { useNavigate } from 'react-router-dom';
// Import API functions for interacting with backend services
import { getBids, createBid, getClients, getClientObjects } from '../services/api';

const Bids = () => {
    // Hook for navigation between routes
    const navigate = useNavigate();

    // State for storing the list of bids fetched from the API
    const [bids, setBids] = useState([]);
    // State for storing the list of clients for the dropdown in the form
    const [clients, setClients] = useState([]);
    // State for storing client objects (vehicles) available for selection
    const [clientObjects, setClientObjects] = useState([]);
    // State to toggle the visibility of the create bid form
    const [showForm, setShowForm] = useState(false);
    // State for the search input to filter bids
    const [searchTerm, setSearchTerm] = useState('');
    // State for filters
    const [filters, setFilters] = useState({
        creator: '',
        status: '',
        client: '',
    });
    // Define all possible columns
    const allColumns = ['id', 'clientName', 'title', 'creatorName', 'status', 'description'];
    // Load initial states from localStorage
    const savedColumns = localStorage.getItem('bidsVisibleColumns');
    const initialVisibleColumns = savedColumns ? JSON.parse(savedColumns) : {
        id: true,
        clientName: true,
        title: true,
        creatorName: true,
        status: true,
        description: true,
    };
    const savedOrder = localStorage.getItem('bidsColumnOrder');
    const initialColumnOrder = savedOrder ? JSON.parse(savedOrder) : allColumns;
    // State for column order
    const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
    // State for visible columns in the table
    const [visibleColumns, setVisibleColumns] = useState(initialVisibleColumns);
    // State for showing column settings dropdown
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    // State for the form data when creating a new bid
    const [formData, setFormData] = useState({
        clientId: '',        // ID of the selected client
        title: '',           // Title of the bid
        status: 'Pending',   // Default status
        description: '',     // Description of the bid
        clientObjectId: '',  // Optional ID of the client object (vehicle)
    });

    // useEffect to load initial data when component mounts
    useEffect(() => {
        fetchBids();      // Load all bids
        fetchClients();   // Load all clients for the form dropdown
        setShowForm(false); // Ensure form is hidden initially
    }, []); // Empty dependency array means this runs only once on mount

    // useEffect to save column preferences to localStorage
    useEffect(() => {
        localStorage.setItem('bidsVisibleColumns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    // useEffect to save column order to localStorage
    useEffect(() => {
        localStorage.setItem('bidsColumnOrder', JSON.stringify(columnOrder));
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

    // useEffect to load client objects when a client is selected
    useEffect(() => {
        fetchClientObjects(formData.clientId); // Load objects for the selected client
        // Reset selected client object when client changes to avoid invalid selections
        setFormData(prev => ({ ...prev, clientObjectId: '' }));
    }, [formData.clientId]); // Runs when clientId changes

    // Функция для загрузки списка заявок с сервера
    const fetchBids = async () => {
        try {
            const response = await getBids(); // Вызов API для получения заявок
            setBids(response.data); // Сохранение данных в состояние
        } catch (error) {
            console.error('Error fetching bids:', error); // Логирование ошибки
        }
    };

    // Функция для загрузки списка клиентов для выпадающего списка
    const fetchClients = async () => {
        try {
            const response = await getClients(); // Вызов API для получения клиентов
            setClients(response.data); // Сохранение данных в состояние
        } catch (error) {
            console.error('Error fetching clients:', error); // Логирование ошибки
        }
    };

    // Функция для загрузки объектов клиента (автомобилей) для выбранного клиента
    const fetchClientObjects = async (clientId) => {
        if (!clientId) {
            setClientObjects([]); // Очистка списка если клиент не выбран
            return;
        }
        try {
            const response = await getClientObjects(clientId); // Вызов API для получения объектов клиента
            // Фильтрация: показывать только объекты, не назначенные ни на одну заявку
            const availableObjects = response.data.filter(obj => !obj.bid);
            setClientObjects(availableObjects); // Сохранение доступных объектов
        } catch (error) {
            console.error('Error fetching client objects:', error); // Логирование ошибки
            setClientObjects([]); // Очистка списка при ошибке
        }
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
            case 'id': return '№';
            case 'clientName': return 'Клиент';
            case 'title': return 'Тема';
            case 'creatorName': return 'Создатель';
            case 'status': return 'Статус';
            case 'description': return 'Описание';
            default: return column;
        }
    };

    // Функция для получения содержимого ячейки
    const getCellContent = (bid, column) => {
        switch (column) {
            case 'id': return `№ ${bid.id}`;
            case 'clientName': return bid.clientName;
            case 'title': return bid.title;
            case 'creatorName': return bid.creatorName;
            case 'status':
                return (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                        bid.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                        bid.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                        {bid.status}
                    </span>
                );
            case 'description': return <div className="max-w-xs truncate">{bid.description}</div>;
            default: return '';
        }
    };

    // Обработчик отправки формы для создания новой заявки
    const handleSubmit = async (e) => {
        e.preventDefault(); // Предотвращение перезагрузки страницы
        try {
            const response = await createBid(formData); // Отправка данных на сервер
            navigate(`/dashboard/bids/${response.data.id}`); // Переход на страницу созданной заявки
        } catch (error) {
            console.error('Error saving bid:', error); // Логирование ошибки
        }
    };

    // Обработчик клика по заявке для просмотра деталей
    const handleView = (bid) => {
        navigate(`/dashboard/bids/${bid.id}`); // Переход на страницу деталей заявки
    };

    // Функция сброса формы к начальному состоянию
    const resetForm = () => {
        setFormData({ // Сброс данных формы
            clientId: '',
            title: '',
            status: 'Pending',
            description: '',
            clientObjectId: '',
        });
        setClientObjects([]); // Очистка списка объектов
        setShowForm(false); // Скрытие формы
    };

    // Фильтрация заявок на основе поискового запроса и фильтров
    const filteredBids = bids.filter(bid => {
        const matchesSearch = searchTerm === '' ||
            bid.id.toString().includes(searchTerm) || // Поиск по ID заявки
            bid.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || // Поиск по имени клиента (регистронезависимо)
            bid.creatorName.toLowerCase().includes(searchTerm.toLowerCase()); // Поиск по ФИО создателя (регистронезависимо)

        const matchesCreator = filters.creator === '' || bid.creatorName === filters.creator;
        const matchesStatus = filters.status === '' || bid.status === filters.status;
        const matchesClient = filters.client === '' || bid.clientName === filters.client;

        return matchesSearch && matchesCreator && matchesStatus && matchesClient;
    });

    // Определение видимых столбцов в порядке columnOrder
    const displayColumns = columnOrder.filter(col => visibleColumns[col]);

    // Вычисление уникальных значений для фильтров
    const uniqueCreators = [...new Set(bids.map(bid => bid.creatorName))].sort();
    const uniqueClients = [...new Set(bids.map(bid => bid.clientName))].sort();
    const uniqueStatuses = ['Pending', 'Accepted', 'Rejected'];

    return (
        <div>
            {/* Кнопка для переключения формы */}
            <div className="flex justify-end items-center mb-6">
                <button
                    onClick={() => setShowForm(!showForm)} // Переключение видимости формы
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                    {showForm ? 'Отмена' : '+ Добавить заявку'} {/* Текст кнопки зависит от состояния формы */}
                </button>
            </div>

            {/* Форма создания новой заявки, показывается только если showForm = true */}
            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">Добавить новую заявку</h3>
                    <form onSubmit={handleSubmit} className="space-y-4"> {/* Форма с обработчиком отправки */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Клиент</label>
                            <select
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Выберите клиента</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Объект обслуживания</label>
                            <select
                                value={formData.clientObjectId}
                                onChange={(e) => setFormData({ ...formData, clientObjectId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">
                                    {formData.clientId ? 'Выберите объект (необязательно)' : 'Сначала выберите клиента'}
                                </option>
                                {clientObjects.map((obj) => (
                                    <option key={obj.id} value={obj.id}>
                                        {obj.brandModel} {obj.stateNumber ? `(${obj.stateNumber})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Тема</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Pending">В ожидании</option>
                                <option value="Accepted">Принята</option>
                                <option value="Rejected">Отклонена</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                                required
                            />
                        </div>
                        <div className="flex gap-2 pt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                            >
                                Создать
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Список заявок, показывается только если форма скрыта */}
            {!showForm && (
                <div>
                    {/* Фильтры */}
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select
                            value={filters.creator}
                            onChange={(e) => setFilters({ ...filters, creator: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Все создатели</option>
                            {uniqueCreators.map(creator => (
                                <option key={creator} value={creator}>{creator}</option>
                            ))}
                        </select>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Все статусы</option>
                            {uniqueStatuses.map(status => (
                                <option key={status} value={status}>
                                    {status === 'Pending' ? 'В ожидании' : status === 'Accepted' ? 'Принята' : 'Отклонена'}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.client}
                            onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Все клиенты</option>
                            {uniqueClients.map(client => (
                                <option key={client} value={client}>{client}</option>
                            ))}
                        </select>
                    </div>
                    {/* Поле поиска и настройки столбцов */}
                    <div className="mb-4 flex gap-4">
                        <input
                            type="text"
                            placeholder="Поиск по номеру заявки или клиенту..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} // Обновление поискового запроса
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="relative column-settings">
                            <button
                                onClick={() => setShowColumnSettings(!showColumnSettings)}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                            >
                                Настройки столбцов
                            </button>
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
                    </div>
                    {/* Таблица с заявками */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            {displayColumns.map(column => (
                                <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                    {getColumnLabel(column)}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {/* Отображение отфильтрованных заявок */}
                        {filteredBids.map((bid) => (
                            <tr key={bid.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(bid)}>
{displayColumns.map(column => (
                                    <td key={column} className={`px-6 py-4 ${column === 'description' ? '' : 'whitespace-nowrap'}`}>
                                        {getCellContent(bid, column)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Bids;