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
import { getBids, getBid, createBid, getClients, getClientObjects, getBidTypes, getUsers, getRoles, createClient, createClientObject } from '../services/api';
import { createNotification } from '../services/api';
// Импорт хука для проверки разрешений
import { usePermissions } from '../hooks/usePermissions';
// Импорт иконок из Lucide React
import { X, ChevronLeft, ChevronRight, Plus, Bold, Italic, Underline, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Undo, Redo, RotateCcw } from 'lucide-react';

// Компонент редактора Rich Text
import RichTextEditor from './RichTextEditor';

const Bids = () => {
    // Хук для навигации между маршрутами
    const navigate = useNavigate();
    // Хук для получения состояния маршрута
    const location = useLocation();
    // Хук для проверки разрешений
    const { hasPermission } = usePermissions();

    // Состояние для хранения списка заявок, полученных из API
    const [bids, setBids] = useState([]);
    // Состояние для пагинации
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });
    // Состояние для хранения списка клиентов для выпадающего списка в форме
    const [clients, setClients] = useState([]);
    // Состояние для хранения объектов клиентов (ТС), доступных для выбора
    const [clientObjects, setClientObjects] = useState([]);
    // Состояние для хранения типов заявок, доступных для выбора
    const [bidTypes, setBidTypes] = useState([]);
    const [users, setUsers] = useState([]); // Список пользователей для фильтра по ответственному
    const [roles, setRoles] = useState([]); // Список ролей для фильтра по ответственному
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
        responsible: '',
    });
    // Состояние для видимых фильтров (сохранение в localStorage)
    const [visibleFilters, setVisibleFilters] = useState(() => {
        const saved = localStorage.getItem('bidsVisibleFilters');
        return saved ? JSON.parse(saved) : { creator: false, bidType: false, client: false, status: false, clientObject: false, responsible: false }; // По умолчанию все фильтры скрыты
    });
    // Состояние для показа модального окна выбора фильтров
    const [showFilterModal, setShowFilterModal] = useState(false);
    // Определение всех возможных колонок
    const allColumns = ['id', 'clientName', 'clientObject', 'tema', 'creatorName', 'status', 'description', 'plannedResolutionDate', 'plannedReactionTimeMinutes', 'assignedAt', 'plannedDurationMinutes', 'spentTimeHours', 'remainingTime'];
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
        plannedDurationMinutes: false,
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
        plannedDurationMinutes: '', // Planned duration in minutes
    });
    
    // Состояние для отслеживания режима ручного редактирования SLA
    const [manualEdit, setManualEdit] = useState(false);
    
    // История изменений описания для undo/redo
    const [descHistory, setDescHistory] = useState([]);
    const [descHistoryIndex, setDescHistoryIndex] = useState(-1);

    // Функция добавления в историю описания
    const addToDescHistory = (newValue) => {
        setDescHistory(prev => {
            const newHistory = prev.slice(0, descHistoryIndex + 1);
            return [...newHistory, newValue];
        });
        setDescHistoryIndex(prev => prev + 1);
    };

    // Состояния для модальных окон быстрого создания
    const [showClientModal, setShowClientModal] = useState(false);
    const [showObjectModal, setShowObjectModal] = useState(false);
    // Форма быстрого создания клиента
    const [quickClientForm, setQuickClientForm] = useState({
        name: '',
        email: '',
        phone: '',
    });
    // Форма быстрого создания объекта
    const [quickObjectForm, setQuickObjectForm] = useState({
        brandModel: '',
        stateNumber: '',
    });

    // useEffect для загрузки начальных данных при монтировании компонента
    useEffect(() => {
        fetchBids();      // Load all bids
        fetchClients();   // Load all clients for the form dropdown
        fetchBidTypes();  // Load all bid types for the form dropdown
        fetchUsers();     // Load all users for the responsible filter
        fetchRoles();     // Load all roles for the responsible filter
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

    // useEffect to reload bids when pagination changes
    useEffect(() => {
        fetchBids();
    }, [pagination.page, pagination.limit]);

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

    // useEffect to auto-fill SLA fields when bidTypeId changes
    useEffect(() => {
        if (formData.bidTypeId) {
            const selectedBidType = bidTypes.find(bt => bt.id.toString() === formData.bidTypeId);
            if (selectedBidType) {
                setFormData(prev => ({
                    ...prev,
                    plannedReactionTimeMinutes: selectedBidType.plannedReactionTimeMinutes?.toString() || '',
                    plannedDurationMinutes: selectedBidType.plannedDurationMinutes?.toString() || '',
                }));
            }
        }
    }, [formData.bidTypeId, bidTypes]);

    // Функция для загрузки списка заявок с сервера
    const fetchBids = async () => {
        try {
            const response = await getBids(pagination.page, pagination.limit); // Вызов API для получения заявок с пагинацией
            setBids(response.data.data); // Сохранение данных в состояние
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination.total,
                totalPages: response.data.pagination.totalPages,
            }));
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

    // Функция для загрузки пользователей для фильтра по ответственному
    const fetchUsers = async () => {
        try {
            const response = await getUsers(); // Вызов API для получения пользователей
            setUsers(response.data); // Сохранение данных в состояние
        } catch (error) {
            console.error('Error fetching users:', error); // Логирование ошибки
        }
    };

    // Функция для загрузки ролей для фильтра по ответственному
    const fetchRoles = async () => {
        try {
            const response = await getRoles(); // Вызов API для получения ролей
            setRoles(response.data); // Сохранение данных в состояние
        } catch (error) {
            console.error('Error fetching roles:', error); // Логирование ошибки
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
            case 'plannedDurationMinutes': return 'Плановая продолжительность (мин)';
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
            case 'plannedDurationMinutes': return bid.plannedDurationMinutes || '';
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



    // Обработчик отправки формы для создания новой заявки
    const handleSubmit = async (e) => {
        e.preventDefault(); // Предотвращение перезагрузки страницы
        try {
            const response = await createBid(formData); // Отправка данных на сервер
            
            // Создаем уведомление о новой заявке
            const client = clients.find(c => c.id.toString() === formData.clientId);
            await createNotification({
                userId: response.data.createdBy, // Уведомление создателю заявки
                title: 'Создана новая заявка',
                message: `Создана заявка №${response.data.id} для клиента "${client?.name || 'Клиент'}"`,
                type: 'bid_created',
                bidId: response.data.id,
            });
            
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
            plannedResolutionDate: getDefaultPlannedResolutionDate(),
            plannedReactionTimeMinutes: '',
            assignedAt: '',
            plannedDurationMinutes: '',
        });
        setManualEdit(false); // Сброс режима ручного редактирования
        setClientObjects([]); // Очистка списка объектов
        setShowForm(false); // Скрытие формы
        setDescHistory([]); // Сброс истории описания
        setDescHistoryIndex(-1);
    };

    // Функция форматирования текста описания
    const formatDescription = (action) => {
        const textarea = document.getElementById('description-textarea');
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.description;
        const selectedText = text.substring(start, end);
        
        let newText;
        let cursorPosition = end;
        
        switch (action) {
            case 'bold':
                newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end);
                cursorPosition = end + 4;
                break;
            case 'italic':
                newText = text.substring(0, start) + '_' + selectedText + '_' + text.substring(end);
                cursorPosition = end + 2;
                break;
            case 'underline':
                newText = text.substring(0, start) + '__' + selectedText + '__' + text.substring(end);
                cursorPosition = end + 4;
                break;
            case 'strikeThrough':
                newText = text.substring(0, start) + '~~' + selectedText + '~~' + text.substring(end);
                cursorPosition = end + 4;
                break;
            case 'unorderedList':
                newText = text.substring(0, start) + '• ' + selectedText.replace(/\n/g, '\n• ') + text.substring(end);
                break;
            case 'orderedList':
                newText = text.substring(0, start) + '1. ' + selectedText.replace(/\n/g, (match, offset) => offset > 0 ? '\n' + (selectedText.substring(0, offset).split('\n').length) + '. ' : '1. ') + text.substring(end);
                break;
            case 'alignLeft':
            case 'alignCenter':
            case 'alignRight':
                // Для простого текстового поля выравнивание не применяется
                return;
            default:
                return;
        }
        
        addToDescHistory(newText);
        setFormData(prev => ({ ...prev, description: newText }));
        
        // Восстановление позиции курсора
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(cursorPosition, cursorPosition);
        }, 0);
    };

    // Функция undo для описания
    const undoDescription = () => {
        if (descHistoryIndex > 0) {
            const newIndex = descHistoryIndex - 1;
            setDescHistoryIndex(newIndex);
            setFormData(prev => ({ ...prev, description: descHistory[newIndex] }));
        }
    };

    // Функция redo для описания
    const redoDescription = () => {
        if (descHistoryIndex < descHistory.length - 1) {
            const newIndex = descHistoryIndex + 1;
            setDescHistoryIndex(newIndex);
            setFormData(prev => ({ ...prev, description: descHistory[newIndex] }));
        }
    };

    // Функция очистки форматирования описания
    const clearDescriptionFormatting = () => {
        const text = formData.description;
        // Удаляем markdown-символы форматирования
        const cleanText = text
            .replace(/\*\*/g, '')
            .replace(/__/g, '')
            .replace(/~~/g, '')
            .replace(/_/g, '')
            .replace(/• /g, '')
            .replace(/\d+\. /g, '');
        
        addToDescHistory(cleanText);
        setFormData(prev => ({ ...prev, description: cleanText }));
    };

    // Обновление истории при изменении описания
    const handleDescriptionChange = (e) => {
        const newValue = e.target.value;
        addToDescHistory(newValue);
        setFormData(prev => ({ ...prev, description: newValue }));
    };

    // Обработчик быстрого создания клиента
    const handleQuickClientSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await createClient(quickClientForm);
            const newClient = response.data;
            // Добавляем нового клиента в список
            setClients(prev => [...prev, newClient]);
            // Выбираем созданного клиента в форме
            setFormData(prev => ({ ...prev, clientId: newClient.id.toString() }));
            // Закрываем модальное окно и сбрасываем форму
            setShowClientModal(false);
            setQuickClientForm({ name: '', email: '', phone: '' });
        } catch (error) {
            console.error('Error creating client:', error);
        }
    };

    // Обработчик быстрого создания объекта
    const handleQuickObjectSubmit = async (e) => {
        e.preventDefault();
        try {
            const objectData = {
                clientId: parseInt(formData.clientId),
                brandModel: quickObjectForm.brandModel,
                stateNumber: quickObjectForm.stateNumber,
            };
            const response = await createClientObject(objectData);
            const newObject = response.data;
            // Добавляем новый объект в список
            setClientObjects(prev => [...prev, newObject]);
            // Выбираем созданный объект в форме
            setFormData(prev => ({ ...prev, clientObjectId: newObject.id.toString() }));
            // Закрываем модальное окно и сбрасываем форму
            setShowObjectModal(false);
            setQuickObjectForm({ brandModel: '', stateNumber: '' });
        } catch (error) {
            console.error('Error creating object:', error);
        }
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
        const matchesResponsible = filters.responsible === '' || 
            (filters.responsible.startsWith('Роль: ') ? bid.bidTypeResponsibleName === filters.responsible : bid.currentResponsibleUserName === filters.responsible);

        return matchesSearch && matchesCreator && matchesBidType && matchesClient && matchesStatus && matchesClientObject && matchesResponsible;
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
        <div className="relative">
            {/* Модальное окно создания новой заявки */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Добавить новую заявку</h3>
                                <button
                                    onClick={() => {
                                        if (showForm) {
                                            resetForm(); // Сброс формы перед закрытием
                                        }
                                        setShowForm(!showForm);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Тема */}
                                    <div className="col-span-full">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Тема *</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    {/* Клиент */}
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Клиент *</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={formData.clientId}
                                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="">Выберите</option>
                                                {clients.map((client) => (
                                                    <option key={client.id} value={client.id}>
                                                        {client.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setShowClientModal(true)}
                                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition flex items-center gap-1"
                                                title="Создать клиента"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Объект обслуживания */}
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Объект обслуживания</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={formData.clientObjectId}
                                                onChange={(e) => setFormData({ ...formData, clientObjectId: e.target.value })}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                disabled={!formData.clientId}
                                            >
                                                <option value="">
                                                    {formData.clientId ? 'Выберите объект' : 'Сначала клиента'}
                                                </option>
                                                {clientObjects.map((obj) => (
                                                    <option key={obj.id} value={obj.id}>
                                                        {obj.brandModel} {obj.stateNumber ? `(${obj.stateNumber})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setShowObjectModal(true)}
                                                className={`px-3 py-2 rounded-lg transition flex items-center gap-1 ${formData.clientId ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                                title="Создать объект"
                                                disabled={!formData.clientId}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Тип заявки */}
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Тип заявки *</label>
                                        <select
                                            value={formData.bidTypeId}
                                            onChange={(e) => setFormData({ ...formData, bidTypeId: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Выберите</option>
                                            {bidTypes.map((bidType) => (
                                                <option key={bidType.id} value={bidType.id}>
                                                    {bidType.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Адрес выполнения работ */}
                                    <div className="col-span-full lg:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Адрес выполнения работ</label>
                                        <div className="relative">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.workAddress}
                                                    onChange={(e) => setFormData({ ...formData, workAddress: e.target.value })}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Введите адрес..."
                                                />
                                            </div>

                                        </div>
                                    </div>

                                    {/* Описание и дополнительные поля в одной строке */}
                                    <div className="col-span-full grid grid-cols-2 gap-4">
                                        {/* Описание - узкое поле */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                            <RichTextEditor
                                                value={formData.description || ''}
                                                onChange={(html) => handleDescriptionChange({ target: { value: html } })}
                                                placeholder="Введите описание заявки..."
                                            />
                                        </div>
                                        {/* Поля справа от описания */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Контактное лицо */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">ФИО контакта</label>
                                                <input
                                                    type="text"
                                                    value={formData.contactFullName}
                                                    onChange={(e) => setFormData({ ...formData, contactFullName: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="ФИО"
                                                />
                                            </div>
                                            {/* Телефон контакта */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                                                <input
                                                    type="text"
                                                    value={formData.contactPhone}
                                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Телефон"
                                                />
                                            </div>
                                            {/* Заголовок раздела SLA */}
                                            <div className="col-span-2 mt-2">
                                                <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-300 pb-1">SLA</h4>
                                            </div>
                                            {/* Плановое время реакции */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Время реакции (мин)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={formData.plannedReactionTimeMinutes}
                                                        onChange={(e) => setFormData({ ...formData, plannedReactionTimeMinutes: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        min="0"
                                                        readOnly={!manualEdit}
                                                        disabled={!manualEdit}
                                                    />
                                                    {!manualEdit && formData.plannedReactionTimeMinutes && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setManualEdit(true)}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-700"
                                                        >
                                                            Изменить
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Плановая продолжительность */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">План. длительность (мин)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={formData.plannedDurationMinutes}
                                                        onChange={(e) => setFormData({ ...formData, plannedDurationMinutes: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        min="0"
                                                        readOnly={!manualEdit}
                                                        disabled={!manualEdit}
                                                    />
                                                    {!manualEdit && formData.plannedDurationMinutes && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setManualEdit(true)}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-700"
                                                        >
                                                            Изменить
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Кнопки */}
                                <div className="flex gap-2 mt-6 pt-4 border-t">
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
                    </div>
                </div>
            )}

            {/* Модальное окно быстрого создания клиента */}
            {showClientModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Создать клиента</h3>
                                <button
                                    onClick={() => {
                                        setShowClientModal(false);
                                        setQuickClientForm({ name: '', email: '', phone: '' });
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleQuickClientSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                                        <input
                                            type="text"
                                            value={quickClientForm.name}
                                            onChange={(e) => setQuickClientForm({ ...quickClientForm, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            placeholder="Название клиента"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={quickClientForm.email}
                                            onChange={(e) => setQuickClientForm({ ...quickClientForm, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                                        <input
                                            type="text"
                                            value={quickClientForm.phone}
                                            onChange={(e) => setQuickClientForm({ ...quickClientForm, phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="+7 (999) 123-45-67"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6 pt-4 border-t">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
                                    >
                                        Создать
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowClientModal(false);
                                            setQuickClientForm({ name: '', email: '', phone: '' });
                                        }}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно быстрого создания объекта */}
            {showObjectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Создать объект</h3>
                                <button
                                    onClick={() => {
                                        setShowObjectModal(false);
                                        setQuickObjectForm({ brandModel: '', stateNumber: '' });
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleQuickObjectSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Марка/Модель *</label>
                                        <input
                                            type="text"
                                            value={quickObjectForm.brandModel}
                                            onChange={(e) => setQuickObjectForm({ ...quickObjectForm, brandModel: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            placeholder="Например: КАМАЗ 65115"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Гос. номер</label>
                                        <input
                                            type="text"
                                            value={quickObjectForm.stateNumber}
                                            onChange={(e) => setQuickObjectForm({ ...quickObjectForm, stateNumber: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Например: А123АА 777"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6 pt-4 border-t">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
                                    >
                                        Создать
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowObjectModal(false);
                                            setQuickObjectForm({ brandModel: '', stateNumber: '' });
                                        }}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {!showForm && (
                <div className="flex flex-col h-full">
                    {/* Карточка с фильтрами и элементами управления */}
                    <div className="bg-gray-200 rounded-lg p-4 mb-6 border border-gray-300 flex-none">
                        <h2 className="text-xl font-bold mb-4">Заявки</h2>
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
                                    onClick={() => {
                                        if (showForm) {
                                            resetForm(); // Сброс формы перед закрытием
                                        }
                                        setShowForm(!showForm);
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    {showForm ? 'Отмена' : '+ Новая заявка'}
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
                            {visibleFilters.responsible && (
                                <select
                                    value={filters.responsible}
                                    onChange={(e) => setFilters({ ...filters, responsible: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Все ответственные</option>
                                    <optgroup label="Пользователи">
                                        {users.map(user => (
                                            <option key={user.id} value={user.fullName}>{user.fullName}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Роли">
                                        {roles.map(role => (
                                            <option key={role.id} value={`Роль: ${role.name}`}>{role.name}</option>
                                        ))}
                                    </optgroup>
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
                    <div className="overflow-x-auto table-container flex-1 min-h-0">
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
                    
                    {/* Пагинация */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 flex-none">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Записей на странице:</span>
                            <select
                                value={pagination.limit}
                                onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                                className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                Страница {pagination.page} из {pagination.totalPages || 1} ({pagination.total} записей)
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="p-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition"
                            >
                                <ChevronLeft size={20} className="text-white" />
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition"
                            >
                                <ChevronRight size={20} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px] max-w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-800">Настройки фильтров</h3>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.creator}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, creator: !visibleFilters.creator })}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Фильтр по создателю</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.bidType}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, bidType: !visibleFilters.bidType })}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Фильтр по типу заявки</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.client}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, client: !visibleFilters.client })}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Фильтр по клиенту</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.status}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, status: !visibleFilters.status })}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Фильтр по статусу</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.clientObject}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, clientObject: !visibleFilters.clientObject })}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Фильтр по объекту обслуживания</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.responsible}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, responsible: !visibleFilters.responsible })}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Фильтр по ответственному</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
                            >
                                Закрыть
                            </button>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition shadow-lg shadow-blue-500/30"
                            >
                                Применить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Modal */}

        </div>
    );
};

export default Bids;




