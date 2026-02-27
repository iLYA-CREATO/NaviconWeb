import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientObjects, createClientObject, getClients, getUsers } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import MultiSelectFilter from './MultiSelectFilter';
import { X, Search } from 'lucide-react';

const Objects = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [objects, setObjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        client: [],
        brandModel: '',
        responsible: [],
    });
    const [filterExceptMode, setFilterExceptMode] = useState({
        client: false,
        brandModel: false,
        responsible: false,
    });
    const [showFilters, setShowFilters] = useState(false);
    // Состояние для показа модального окна выбора фильтров
    const [showFilterModal, setShowFilterModal] = useState(false);
    // Состояние для поиска в настройках фильтров
    const [filterSettingsSearch, setFilterSettingsSearch] = useState('');
    // Состояние для видимых фильтров (сохранение в localStorage)
    const [visibleFilters, setVisibleFilters] = useState(() => {
        const saved = localStorage.getItem('objectsVisibleFilters');
        return saved ? JSON.parse(saved) : { client: true, brandModel: true, responsible: true };
    });
    // Определение всех возможных столбцов
    const allColumns = ['client', 'brandModel', 'stateNumber', 'responsible'];
    // Загрузка начальных состояний из localStorage
    const savedColumns = localStorage.getItem('objectsVisibleColumns');
    const defaultVisibleColumns = {
        client: true,
        brandModel: true,
        stateNumber: true,
        responsible: true,
    };
    const initialVisibleColumns = savedColumns ? { ...defaultVisibleColumns, ...JSON.parse(savedColumns) } : defaultVisibleColumns;
    const savedOrder = localStorage.getItem('objectsColumnOrder');
    let initialColumnOrder = savedOrder ? JSON.parse(savedOrder).filter(col => allColumns.includes(col)) : allColumns;

    // Ensure all columns are included in the order
    allColumns.forEach(col => {
        if (!initialColumnOrder.includes(col)) {
            initialColumnOrder.push(col);
        }
    });

    // Состояние для порядка столбцов
    const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
    // Состояние для видимых столбцов в таблице
    const [visibleColumns, setVisibleColumns] = useState(initialVisibleColumns);
    // Состояние для показа выпадающего списка настроек столбцов
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    // Сохранение видимых фильтров в localStorage
    useEffect(() => {
        localStorage.setItem('objectsVisibleFilters', JSON.stringify(visibleFilters));
    }, [visibleFilters]);

    // Сохранение видимых столбцов в localStorage
    useEffect(() => {
        localStorage.setItem('objectsVisibleColumns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    // Сохранение порядка столбцов в localStorage
    useEffect(() => {
        localStorage.setItem('objectsColumnOrder', JSON.stringify(columnOrder));
    }, [columnOrder]);

    // Обработчик клика вне выпадающего списка настроек столбцов
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showColumnSettings && !event.target.closest('.column-settings')) {
                setShowColumnSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColumnSettings]);

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
            case 'client': return 'Клиент';
            case 'brandModel': return 'Марка/Модель';
            case 'stateNumber': return 'Гос. Номер';
            case 'responsible': return 'Ответственный';
            default: return column;
        }
    };

    const [formData, setFormData] = useState({
        clientId: '',
        brandModel: '',
        stateNumber: '',
    });

    useEffect(() => {
        fetchObjects();
        fetchClients();
        fetchUsers();
        setShowForm(false);
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await getUsers();
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchObjects = async () => {
        try {
            const response = await getClientObjects();
            setObjects(response.data);
        } catch (error) {
            console.error('Error fetching objects:', error);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await getClients();
            setClients(response.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await createClientObject(formData);
            navigate(`/dashboard/client-objects/${response.data.id}`);
        } catch (error) {
            console.error('Error saving object:', error);
        }
    };

    const handleView = (obj) => {
        navigate(`/dashboard/client-objects/${obj.id}`);
    };

    const resetForm = () => {
        setFormData({
            clientId: '',
            brandModel: '',
            stateNumber: '',
        });
        setShowForm(false);
    };

    const filteredObjects = objects.filter(obj => {
        const matchesSearch = searchTerm === '' ||
            obj.id.toString().includes(searchTerm) ||
            obj.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            obj.brandModel.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Логика фильтрации с учетом режима "Кроме" и множественного выбора
        const matchesClient = filters.client.length === 0 ||
            (filterExceptMode.client ? !filters.client.includes(obj.client.id.toString()) : filters.client.includes(obj.client.id.toString()));
        const matchesBrandModel = filters.brandModel === '' ||
            (filterExceptMode.brandModel ? !obj.brandModel.toLowerCase().includes(filters.brandModel.toLowerCase()) : obj.brandModel.toLowerCase().includes(filters.brandModel.toLowerCase()));
        const matchesResponsible = filters.responsible.length === 0 ||
            (filters.responsible.some(r => obj.client.responsible && obj.client.responsible.id.toString() === r));
        
        return matchesSearch && matchesClient && matchesBrandModel && matchesResponsible;
    });

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Объекты</h1>

            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">Добавить новый объект</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Select
                            label="Клиент"
                            value={formData.clientId}
                            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                            options={clients.map(client => ({ value: client.id, label: client.name }))}
                            placeholder="Выберите клиента"
                            required
                        />
                        <Input
                            label="Марка/Модель"
                            type="text"
                            value={formData.brandModel}
                            onChange={(e) => setFormData({ ...formData, brandModel: e.target.value })}
                            required
                        />
                        <Input
                            label="Гос. Номер"
                            type="text"
                            value={formData.stateNumber}
                            onChange={(e) => setFormData({ ...formData, stateNumber: e.target.value })}
                            required
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
            )}

            {!showForm && (
                <div>
                    {/* Карточка с элементами управления */}
                    <div className="bg-gray-200 rounded-lg p-4 mb-6">
                        {/* Кнопки управления */}
                        <div className="flex justify-end gap-2 mb-4">
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
                            <button
                                onClick={() => setShowFilterModal(true)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Добавить фильтр
                            </button>
                            {hasPermission('client_object_create') && (
                                <button
                                    onClick={() => setShowForm(!showForm)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    {showForm ? 'Отмена' : '+ Новый объект'}
                                </button>
                            )}
                        </div>
                        {/* Фильтры - показываем только включенные фильтры */}
                        {((visibleFilters.client && filters.client.length > 0) || 
                          (visibleFilters.brandModel && filters.brandModel !== '') || 
                          (visibleFilters.responsible && filters.responsible.length > 0)) && (
                            <div className="bg-white p-4 rounded-lg mb-4 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {visibleFilters.client && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Клиент</label>
                                        <div className="flex">
                                            <div className="flex-1">
                                                <MultiSelectFilter
                                                    value={filters.client}
                                                    onChange={(newValue) => setFilters({ ...filters, client: newValue })}
                                                    options={clients.map(c => ({ value: c.id.toString(), label: c.name }))}
                                                    placeholder={filterExceptMode.client ? 'Все (кроме)' : 'Все клиенты'}
                                                    exceptMode={filterExceptMode.client}
                                                />
                                            </div>
                                            {filters.client.length > 0 && (
                                                <button
                                                    onClick={() => setFilterExceptMode({ ...filterExceptMode, client: !filterExceptMode.client })}
                                                    className={`px-3 py-2 border border-l-0 rounded-r-lg ${filterExceptMode.client ? 'bg-red-100 text-red-700 border-red-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}
                                                    title={filterExceptMode.client ? 'Кроме выбранного' : 'Только выбранный'}
                                                >
                                                    {filterExceptMode.client ? '≠' : '='}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    )}
                                    {visibleFilters.brandModel && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Марка/Модель</label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                value={filters.brandModel}
                                                onChange={(e) => setFilters({ ...filters, brandModel: e.target.value })}
                                                placeholder="Поиск..."
                                                className={`flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${filterExceptMode.brandModel ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                            />
                                            <button
                                                onClick={() => setFilterExceptMode({ ...filterExceptMode, brandModel: !filterExceptMode.brandModel })}
                                                className={`px-3 py-2 border border-l-0 rounded-r-lg ${filterExceptMode.brandModel ? 'bg-red-100 text-red-700 border-red-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}
                                                title={filterExceptMode.brandModel ? 'Кроме введённого' : 'Содержит введённое'}
                                            >
                                                {filterExceptMode.brandModel ? '≠' : '='}
                                            </button>
                                        </div>
                                    </div>
                                    )}
                                    {visibleFilters.responsible && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Ответственный</label>
                                        <div className="flex">
                                            <div className="flex-1">
                                                <MultiSelectFilter
                                                    value={filters.responsible}
                                                    onChange={(newValue) => setFilters({ ...filters, responsible: newValue })}
                                                    options={users.map(u => ({ value: u.id.toString(), label: u.fullName || u.username }))}
                                                    placeholder={filterExceptMode.responsible ? 'Все (кроме)' : 'Все ответственные'}
                                                    exceptMode={filterExceptMode.responsible}
                                                />
                                            </div>
                                            {filters.responsible.length > 0 && (
                                                <button
                                                    onClick={() => setFilterExceptMode({ ...filterExceptMode, responsible: !filterExceptMode.responsible })}
                                                    className={`px-3 py-2 border border-l-0 rounded-r-lg ${filterExceptMode.responsible ? 'bg-red-100 text-red-700 border-red-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}
                                                    title={filterExceptMode.responsible ? 'Кроме выбранного' : 'Только выбранный'}
                                                >
                                                    {filterExceptMode.responsible ? '≠' : '='}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    )}
                                </div>
                                <Button variant="ghost" onClick={() => {
                                    setFilters({ client: [], brandModel: '', responsible: [] });
                                    setFilterExceptMode({ client: false, brandModel: false, responsible: false });
                                }}>
                                    Сбросить фильтры
                                </Button>
                            </div>
                        )}
                        {/* Поле поиска */}
                        <Input
                            type="text"
                            placeholder="Поиск по номеру объекта, клиенту или марке..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                            <thead className="bg-gray-50">
                                <tr>
                                    {columnOrder.map((column) => (
                                        visibleColumns[column] && (
                                            <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>
                                                {getColumnLabel(column)}
                                            </th>
                                        )
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredObjects.map((obj) => (
                                    <tr key={obj.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(obj)}>
                                        {columnOrder.map((column) => (
                                            visibleColumns[column] && (
                                                <td key={column} className="px-6 py-4 whitespace-nowrap">
                                                    {column === 'client' && obj.client.name}
                                                    {column === 'brandModel' && obj.brandModel}
                                                    {column === 'stateNumber' && obj.stateNumber}
                                                    {column === 'responsible' && (
                                                        obj.client.responsible ? (
                                                            <span className="text-gray-900">{obj.client.responsible.fullName || 'Не назначен'}</span>
                                                        ) : (
                                                            <span className="text-gray-500">Не назначен</span>
                                                        )
                                                    )}
                                                </td>
                                            )
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
                        <div className="mb-4">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Поиск фильтров..."
                                    value={filterSettingsSearch}
                                    onChange={(e) => setFilterSettingsSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {(!filterSettingsSearch || 'клиент'.includes(filterSettingsSearch.toLowerCase())) && (
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.client}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, client: !visibleFilters.client })}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Фильтр по клиенту</span>
                            </label>
                            )}
                            {(!filterSettingsSearch || 'марка'.includes(filterSettingsSearch.toLowerCase()) || 'модель'.includes(filterSettingsSearch.toLowerCase())) && (
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.brandModel}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, brandModel: !visibleFilters.brandModel })}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Фильтр по марке/модели</span>
                            </label>
                            )}
                            {(!filterSettingsSearch || 'ответствен'.includes(filterSettingsSearch.toLowerCase())) && (
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.responsible}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, responsible: !visibleFilters.responsible })}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Фильтр по ответственному</span>
                            </label>
                            )}
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

        </div>
    );
};

export default Objects;