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
// Импорт иконок из Lucide React
import { Map, Bell, X } from 'lucide-react';

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
        status: '',
        clientObject: '',
    });
    // Состояние для видимых фильтров (сохранение в localStorage)
    const [visibleFilters, setVisibleFilters] = useState(() => {
        const saved = localStorage.getItem('bidsVisibleFilters');
        return saved ? JSON.parse(saved) : { creator: false, bidType: false, client: false, status: false, clientObject: false }; // По умолчанию все фильтры скрыты
    });
    // Состояние для показа модального окна выбора фильтров
    const [showFilterModal, setShowFilterModal] = useState(false);
    // Определение всех возможных колонок
    const allColumns = ['id', 'clientName', 'clientObject', 'tema', 'creatorName', 'status', 'description', 'plannedResolutionDate', 'plannedReactionTimeMinutes', 'assignedAt', 'plannedDurationHours', 'spentTimeHours', 'remainingTime'];
    // Загрузка начальных состояний из localStorage
    const savedColumns = localStorage.getItem('bidsVisibleColumns');
    const defaultVisibleColumns = {
        id: true,
        clientName: true,
        clientObject: true,
        tema: true,
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
    // Состояние для показа окна уведомлений
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationFilter, setNotificationFilter] = useState('all');
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'Новая заявка', message: 'Создана новая заявка №123 от клиента ABC', unread: true, status: 'new' },
        { id: 2, title: 'Заявка к исполнению', message: 'Заявка №124 назначена на исполнение', unread: true, status: 'to_execute' },
        { id: 3, title: 'Заявка выполнена', message: 'Заявка №125 выполнена успешно', unread: false, status: 'completed' },
        { id: 4, title: 'Просроченная заявка', message: 'Заявка №126 просрочена', unread: true, status: 'overdue' },
    ]);
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

    // useEffect to save visible filters to localStorage
    useEffect(() => {
        localStorage.setItem('bidsVisibleFilters', JSON.stringify(visibleFilters));
    }, [visibleFilters]);

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

    // useEffect to handle Ctrl + wheel for horizontal scroll
    useEffect(() => {
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
            const handleWheel = (event) => {
                if (event.ctrlKey) {
                    event.preventDefault();
                    tableContainer.scrollLeft += event.deltaY;
                }
            };
            tableContainer.addEventListener('wheel', handleWheel);
            return () => tableContainer.removeEventListener('wheel', handleWheel);
        }
    }, []);

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
            case 'tema': return 'Тема';
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
    const getStatusColor = (bid) => {
        // Find the status configuration from bidType
        let statusConfig = null;
        if (bid.bidType?.statuses && Array.isArray(bid.bidType.statuses)) {
            statusConfig = bid.bidType.statuses.find(s => s.name === bid.status);
        }

        // Use status config if available, otherwise default
        const color = statusConfig?.color || '#7a7777'; // Default gray

        // Check if color is light/white and adjust text color accordingly
        const isLightColor = color === '#ffffff' || color.toLowerCase() === '#fff';
        const textColor = isLightColor ? '#333333' : '#ffffff'; // Dark text on light bg, white on dark bg

        return {
            backgroundColor: color,
            color: textColor,
            border: isLightColor ? '1px solid #cccccc' : 'none'
        };
    };

    // Функция для получения содержимого ячейки
    const getCellContent = (bid, column) => {
        switch (column) {
            case 'id': return `№ ${bid.id}`;
            case 'clientName': return bid.clientName;
            case 'clientObject': return bid.clientObject ? `${bid.clientObject.brandModel} ${bid.clientObject.stateNumber ? `(${bid.clientObject.stateNumber})` : ''}` : '';
            case 'tema': return bid.title;
            case 'creatorName': return bid.creatorName;
            case 'status': {
                const statusStyle = getStatusColor(bid);
                return (
                    <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={statusStyle}
                    >
                        {bid.status}
                    </span>
                );
            }
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
        const matchesStatus = filters.status === '' || bid.status === filters.status;
        const matchesClientObject = filters.clientObject === '' || (bid.clientObject ? `${bid.clientObject.brandModel} ${bid.clientObject.stateNumber ? `(${bid.clientObject.stateNumber})` : ''}` : '') === filters.clientObject;

        return matchesSearch && matchesCreator && matchesBidType && matchesClient && matchesStatus && matchesClientObject;
    });

    // Определение видимых столбцов в порядке columnOrder
    const displayColumns = columnOrder.filter(col => visibleColumns[col]);

    // Вычисление уникальных значений для фильтров
    const uniqueCreators = [...new Set(bids.map(bid => bid.creatorName))].sort();
    const uniqueClients = [...new Set(bids.map(bid => bid.clientName))].sort();
    // Get all unique status names from all bid types
    const uniqueStatuses = [...new Set(bidTypes.flatMap(bt => (bt.statuses || []).map(s => s.name)))].sort();
    const uniqueClientObjects = [...new Set(bids.map(bid => bid.clientObject ? `${bid.clientObject.brandModel} ${bid.clientObject.stateNumber ? `(${bid.clientObject.stateNumber})` : ''}` : '').filter(Boolean))].sort();

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Заявки</h1>

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
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition whitespace-nowrap flex items-center gap-2"
                                    title="Выбрать на карте"
                                >
                                    <Map size={16} />
                                    Карта
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
                    {/* Карточка с фильтрами и элементами управления */}
                    <div className="bg-gray-200 rounded-lg p-4 mb-6">
                        {/* Кнопка создания новой заявки */}
                        <div className="flex justify-end gap-2 mb-4">
                            <button
                                onClick={() => setShowFilterModal(true)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Добавить фильтр
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setShowColumnSettings(!showColumnSettings)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Настройки столбцов
                                </button>
                                {showColumnSettings && (
                                    <div className="column-settings absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
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
                            {hasPermission('bid_create') && (
                                <button
                                    onClick={() => setShowForm(!showForm)} // Переключение видимости формы
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    {showForm ? 'Отмена' : '+ Новая заявка'} {/* Текст кнопки зависит от состояния формы */}
                                </button>
                            )}
                        </div>
                        {/* Фильтры */}
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                            {visibleFilters.creator && (
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
                            )}
                            {visibleFilters.bidType && (
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
                            )}
                            {visibleFilters.client && (
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
                            )}
                            {visibleFilters.status && (
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Все статусы</option>
                                    {uniqueStatuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            )}
                            {visibleFilters.clientObject && (
                                <select
                                    value={filters.clientObject}
                                    onChange={(e) => setFilters({ ...filters, clientObject: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Все объекты обслуживания</option>
                                    {uniqueClientObjects.map(obj => (
                                        <option key={obj} value={obj}>{obj}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        {/* Поле поиска */}
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Поиск по номеру заявки, клиенту, создателю или статусу..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)} // Обновление поискового запроса
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    {/* Таблица с заявками */}
                    <div className="overflow-x-auto table-container">
                    <table className="divide-y divide-gray-200" style={{ minWidth: `${displayColumns.length * 120}px` }}>
                        <thead className="bg-gray-50">
                        <tr>
                            {displayColumns.map(column => (
                                <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 resize-x overflow-auto" style={{ minWidth: '1px' }}>
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

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-w-full">
                        <h3 className="text-lg font-medium mb-4">Настройки фильтров</h3>
                        <div className="space-y-3">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.creator}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, creator: !visibleFilters.creator })}
                                    className="mr-2"
                                />
                                Фильтр по создателю
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.bidType}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, bidType: !visibleFilters.bidType })}
                                    className="mr-2"
                                />
                                Фильтр по типу заявки
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.client}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, client: !visibleFilters.client })}
                                    className="mr-2"
                                />
                                Фильтр по клиенту
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.status}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, status: !visibleFilters.status })}
                                    className="mr-2"
                                />
                                Фильтр по статусу
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.clientObject}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, clientObject: !visibleFilters.clientObject })}
                                    className="mr-2"
                                />
                                Фильтр по объекту обслуживания
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                            >
                                Закрыть
                            </button>
                        </div>
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
