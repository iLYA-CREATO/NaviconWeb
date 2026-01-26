/**
 * Bids Component
 *
 * This component manages the display and creation of bids (заявки).
 * It shows a list of existing bids, allows searching, and provides a form to create new bids.
 * Bids are associated with clients and optionally with client objects (vehicles/equipment).
 */

// Импорт React хуков для управления состоянием и побочными эффектами
import { useState, useEffect } from 'react';
// Импорт хука навигации из React Router для программной навигации
import { useNavigate, useLocation } from 'react-router-dom';
// Импорт функций API для взаимодействия с серверными сервисами
import { getBids, getBid, createBid, getClients, getClientObjects, getBidTypes } from '../services/api';
// Импорт хука для проверки разрешений
import { usePermissions } from '../hooks/usePermissions';
// Импорт компонента карты
import MapModal from './MapModal';

const Bids = () => {
    // Хук для навигации между маршрутами
    const navigate = useNavigate();
    // Хук для получения состояния маршрута
    const location = useLocation();
    // Хук для проверки разрешений
    const { hasPermission } = usePermissions();

    // Состояние для хранения списка заявок, полученных из API
    const [bids, setBids] = useState([]);
    // Состояние для хранения списка клиентов для выпадающего списка в форме
    const [clients, setClients] = useState([]);
    // Состояние для хранения объектов клиентов (ТС), доступных для выбора
    const [clientObjects, setClientObjects] = useState([]);
    // Состояние для хранения типов заявок, доступных для выбора
    const [bidTypes, setBidTypes] = useState([]);
    // Состояние для переключения видимости формы создания заявки
    const [showForm, setShowForm] = useState(false);
    // Состояние для поля поиска для фильтрации заявок
    const [searchTerm, setSearchTerm] = useState('');
    // Состояние для фильтров
    const [filters, setFilters] = useState({
        creator: '',
        bidType: '',
        client: '',
    });
    // Определение всех возможных колонок
    const allColumns = ['id', 'clientName', 'clientObject', 'title', 'creatorName', 'status', 'description', 'plannedResolutionDate', 'plannedReactionTimeMinutes', 'assignedAt', 'plannedDurationHours', 'spentTimeHours', 'remainingTime'];
    // Загрузка начальных состояний из localStorage
    const savedColumns = localStorage.getItem('bidsVisibleColumns');
    const defaultVisibleColumns = {
        id: true,
        clientName: true,
        clientObject: true,
        title: true,
        creatorName: true,
        status: true,
        description: true,
        plannedResolutionDate: false,
        plannedReactionTimeMinutes: false,
        assignedAt: false,
        plannedDurationHours: false,
        spentTimeHours: false,
        remainingTime: false,
    };
    const initialVisibleColumns = savedColumns ? { ...defaultVisibleColumns, ...JSON.parse(savedColumns) } : defaultVisibleColumns;
    const savedOrder = localStorage.getItem('bidsColumnOrder');
    let initialColumnOrder = savedOrder ? JSON.parse(savedOrder).filter(col => allColumns.includes(col)) : allColumns;

    // Ensure all new columns are included in the order
    allColumns.forEach(col => {
        if (!initialColumnOrder.includes(col)) {
            initialColumnOrder.push(col);
        }
    });

    // Убедимся что статус включен в порядок колонок
    if (!initialColumnOrder.includes('status')) {
        initialColumnOrder.splice(4, 0, 'status'); // Вставляем статус после creatorName
    }
    // Состояние для порядка колонок
    const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
    // Состояние для видимых колонок в таблице
    const [visibleColumns, setVisibleColumns] = useState(initialVisibleColumns);
    // Состояние для показа выпадающего списка настроек колонок
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    // Состояние для показа модального окна карты
    const [showMapModal, setShowMapModal] = useState(false);
    // Default planned resolution date to 5 days from now
    const getDefaultPlannedResolutionDate = () => {
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
        return fiveDaysFromNow.toISOString().slice(0, 16); // Format for datetime-local input
    };

    // Состояние для данных формы при создании новой заявки
    const [formData, setFormData] = useState({
        clientId: '',        // ID of the selected client
        title: '',           // Title of the bid
        bidTypeId: '',       // ID of the selected bid type
        description: '',     // Description of the bid
        clientObjectId: '',  // Optional ID of the client object (vehicle)
        workAddress: '',     // Address of work execution
        contactFullName: '', // Contact person's full name
        contactPhone: '',    // Contact person's phone number
        parentId: '',        // ID of the parent bid
        plannedResolutionDate: getDefaultPlannedResolutionDate(), // Planned resolution date (+5 days)
        plannedReactionTimeMinutes: '', // Planned reaction time in minutes
        assignedAt: '',      // Assigned date/time
        plannedDurationHours: '', // Planned duration in hours
    });

    // useEffect для загрузки начальных данных при монтировании компонента
    useEffect(() => {
        fetchBids();      // Load all bids
        fetchClients();   // Load all clients for the form dropdown
        fetchBidTypes();  // Load all bid types for the form dropdown
        // Check if we need to show the form from navigation state
        if (location.state && location.state.showForm) {
            setShowForm(true);
            if (location.state.parentId) {
                setFormData(prev => ({ ...prev, parentId: location.state.parentId }));
                // Fetch parent bid data to pre-fill the form
                fetchParentBid(location.state.parentId);
            }
        } else {
            setShowForm(false); // Ensure form is hidden initially
        }
    }, [location.state]); // Depend on location.state to react to navigation

    // useEffect для сохранения настроек колонок в localStorage
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

    // Функция для загрузки данных родительской заявки для предзаполнения формы
    const fetchParentBid = async (parentId) => {
        try {
            const response = await getBid(parentId); // Вызов API для получения родительской заявки
            const parentBid = response.data;
            // Предзаполнение формы данными из родительской заявки
            setFormData(prev => ({
                ...prev,
                clientId: parentBid.clientId.toString(),
                clientObjectId: parentBid.clientObjectId ? parentBid.clientObjectId.toString() : '',
                bidTypeId: parentBid.bidTypeId ? parentBid.bidTypeId.toString() : '',
                workAddress: parentBid.workAddress || '',
                contactFullName: parentBid.contactFullName || '',
                contactPhone: parentBid.contactPhone || '',
            }));
        } catch (error) {
            console.error('Error fetching parent bid:', error); // Логирование ошибки
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
            // Показывать все объекты клиента
            setClientObjects(response.data); // Сохранение всех объектов
        } catch (error) {
            console.error('Error fetching client objects:', error); // Логирование ошибки
            setClientObjects([]); // Очистка списка при ошибке
        }
    };

    // Функция для загрузки типов заявок
    const fetchBidTypes = async () => {
        try {
            const response = await getBidTypes(); // Вызов API для получения типов заявок
            setBidTypes(response.data); // Сохранение данных в состояние
        } catch (error) {
            console.error('Error fetching bid types:', error); // Логирование ошибки
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
            case 'clientObject': return 'Объект обслуживания';
            case 'title': return 'Тема';
            case 'creatorName': return 'Создатель';
            case 'status': return 'Статус';
            case 'description': return 'Описание';
            case 'plannedResolutionDate': return 'Плановая дата решения';
            case 'plannedReactionTimeMinutes': return 'Плановое время реакции (мин)';
            case 'assignedAt': return 'Назначена на';
            case 'plannedDurationHours': return 'Плановая продолжительность (ч)';
            case 'spentTimeHours': return 'Затраченное время (ч)';
            case 'remainingTime': return 'Остаток времени';
            default: return column;
        }
    };

    // Функция для получения цвета фона статуса
    const getStatusColor = (status) => {
        switch (status) {
            case 'Закрыта': return 'bg-red-100 text-red-800';
            case 'Открыта': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    // Функция для получения содержимого ячейки
    const getCellContent = (bid, column) => {
        switch (column) {
            case 'id': return `№ ${bid.id}`;
            case 'clientName': return bid.clientName;
            case 'clientObject': return bid.clientObject ? `${bid.clientObject.brandModel} ${bid.clientObject.stateNumber ? `(${bid.clientObject.stateNumber})` : ''}` : '';
            case 'title': return bid.title;
            case 'creatorName': return bid.creatorName;
            case 'status': return (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bid.status)}`}>
                    {bid.status}
                </span>
            );
            case 'description': return <div className="max-w-xs truncate">{bid.description}</div>;
            case 'plannedResolutionDate': return bid.plannedResolutionDate ? new Date(bid.plannedResolutionDate).toLocaleString() : '';
            case 'plannedReactionTimeMinutes': return bid.plannedReactionTimeMinutes || '';
            case 'assignedAt': return bid.assignedAt ? new Date(bid.assignedAt).toLocaleString() : '';
            case 'plannedDurationHours': return bid.plannedDurationHours || '';
            case 'spentTimeHours': return bid.spentTimeHours || '';
            case 'remainingTime': {
                if (bid.plannedResolutionDate) {
                    const now = new Date();
                    const planned = new Date(bid.plannedResolutionDate);
                    const diffMs = planned - now;
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    return diffMs > 0 ? `${diffHours}ч ${diffMinutes}м` : 'Просрочено';
                }
                return '';
            }
            default: return '';
        }
    };

    // Обработчик выбора адреса с карты
    const handleAddressSelect = (address) => {
        setFormData({ ...formData, workAddress: address });
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
            bidTypeId: '',
            description: '',
            clientObjectId: '',
            workAddress: '',
            contactFullName: '',
            contactPhone: '',
            parentId: '',
        });
        setClientObjects([]); // Очистка списка объектов
        setShowForm(false); // Скрытие формы
    };

    // Фильтрация заявок на основе поискового запроса и фильтров
    const filteredBids = bids.filter(bid => {
        const matchesSearch = searchTerm === '' ||
            bid.id.toString().includes(searchTerm) || // Поиск по ID заявки
            bid.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || // Поиск по имени клиента (регистронезависимо)
            bid.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) || // Поиск по ФИО создателя (регистронезависимо)
            (bid.status && bid.status.toLowerCase().includes(searchTerm.toLowerCase())); // Поиск по статусу (регистронезависимо)

        const matchesCreator = filters.creator === '' || bid.creatorName === filters.creator;
        const matchesBidType = filters.bidType === '' || bid.bidTypeId === parseInt(filters.bidType);
        const matchesClient = filters.client === '' || bid.clientName === filters.client;

        return matchesSearch && matchesCreator && matchesBidType && matchesClient;
    });

    // Определение видимых столбцов в порядке columnOrder
    const displayColumns = columnOrder.filter(col => visibleColumns[col]);

    // Вычисление уникальных значений для фильтров
    const uniqueCreators = [...new Set(bids.map(bid => bid.creatorName))].sort();
    const uniqueClients = [...new Set(bids.map(bid => bid.clientName))].sort();

    return (
        <div>
            {/* Кнопка для переключения формы */}
            <div className="flex justify-end items-center mb-6">
                {hasPermission('bid_create') && (
                    <button
                        onClick={() => setShowForm(!showForm)} // Переключение видимости формы
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        {showForm ? 'Отмена' : '+ Добавить заявку'} {/* Текст кнопки зависит от состояния формы */}
                    </button>
                )}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Тип заявки</label>
                            <select
                                value={formData.bidTypeId}
                                onChange={(e) => setFormData({ ...formData, bidTypeId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Выберите тип заявки</option>
                                {bidTypes.map((bidType) => (
                                    <option key={bidType.id} value={bidType.id}>
                                        {bidType.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Адрес проведения работ</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.workAddress}
                                    onChange={(e) => setFormData({ ...formData, workAddress: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Введите адрес проведения работ"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowMapModal(true)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition whitespace-nowrap"
                                    title="Выбрать на карте"
                                >
                                    🗺️ Карта
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ФИО и номер телефона</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.contactFullName}
                                    onChange={(e) => setFormData({ ...formData, contactFullName: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="ФИО контактного лица"
                                />
                                <input
                                    type="text"
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Номер телефона"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Плановая дата решения</label>
                            <input
                                type="datetime-local"
                                value={formData.plannedResolutionDate}
                                onChange={(e) => setFormData({ ...formData, plannedResolutionDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Плановое время реакции (мин)</label>
                            <input
                                type="number"
                                value={formData.plannedReactionTimeMinutes}
                                onChange={(e) => setFormData({ ...formData, plannedReactionTimeMinutes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Назначена на</label>
                            <input
                                type="datetime-local"
                                value={formData.assignedAt}
                                onChange={(e) => setFormData({ ...formData, assignedAt: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Плановая продолжительность (ч)</label>
                            <input
                                type="number"
                                step="0.5"
                                value={formData.plannedDurationHours}
                                onChange={(e) => setFormData({ ...formData, plannedDurationHours: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
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
                            value={filters.bidType}
                            onChange={(e) => setFilters({ ...filters, bidType: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Все типы заявок</option>
                            {bidTypes.map(bidType => (
                                <option key={bidType.id} value={bidType.id}>
                                    {bidType.name}
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
                            placeholder="Поиск по номеру заявки, клиенту, создателю или статусу..."
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
                    <div className="overflow-hidden">
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

            {/* Map Modal */}
            <MapModal
                isOpen={showMapModal}
                onClose={() => setShowMapModal(false)}
                onAddressSelect={handleAddressSelect}
                initialAddress={formData.workAddress}
            />
        </div>
    );
};

export default Bids;
