import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEquipment, createEquipment, updateEquipment, deleteEquipment, getExpenseHistory, getReturnHistory, getSuppliers, getEquipmentCategories, createEquipmentCategory, updateEquipmentCategory, deleteEquipmentCategory, createSupplier, updateSupplier, deleteSupplier } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import Textarea from './Textarea';

const Equipment = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [equipment, setEquipment] = useState([]);
    const [expenseHistory, setExpenseHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [showForm, setShowForm] = useState(false);
    // Определение всех возможных колонок для оборудования
    const equipmentAllColumns = ['id', 'name', 'productCode', 'purchasePrice', 'sellingPrice', 'category', 'supplier'];
    // Загрузка начальных состояний из localStorage для оборудования
    const savedEquipmentColumns = localStorage.getItem('equipmentVisibleColumns');
    const defaultEquipmentVisibleColumns = {
        id: true,
        name: true,
        productCode: true,
        sellingPrice: true,
        purchasePrice: true,
        category: true,
        supplier: true,
    };
    const initialEquipmentVisibleColumns = savedEquipmentColumns ? { ...defaultEquipmentVisibleColumns, ...JSON.parse(savedEquipmentColumns), sellingPrice: true, purchasePrice: true, productCode: true } : defaultEquipmentVisibleColumns;
    const savedEquipmentOrder = localStorage.getItem('equipmentColumnOrder');
    const initialEquipmentColumnOrder = savedEquipmentOrder ? [...new Set([...JSON.parse(savedEquipmentOrder).filter(col => equipmentAllColumns.includes(col)), ...equipmentAllColumns])] : equipmentAllColumns;
    // Состояние для порядка колонок оборудования
    const [equipmentColumnOrder, setEquipmentColumnOrder] = useState(initialEquipmentColumnOrder);
    // Состояние для видимых колонок оборудования в таблице
    const [equipmentVisibleColumns, setEquipmentVisibleColumns] = useState(initialEquipmentVisibleColumns);
    // Состояние для показа выпадающего списка настроек колонок оборудования
    const [showEquipmentColumnSettings, setShowEquipmentColumnSettings] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        productCode: '',
        sellingPrice: '',
        purchasePrice: '',
        description: '',
        category: '',
        supplierId: '',
    });
    const [suppliers, setSuppliers] = useState([]);
    const [equipmentCategories, setEquipmentCategories] = useState([]);
    const [error, setError] = useState('');
    
    // Состояния для форм поставщиков
    const [supplierFormData, setSupplierFormData] = useState({ name: '', entityType: '', inn: '', phone: '', email: '' });
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    
    // Состояния для форм категорий оборудования
    const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '', parentId: '' });
    const [editingCategory, setEditingCategory] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [customTabs, setCustomTabs] = useState([]);
    const [activeTab, setActiveTab] = useState('nomenclature');
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [showEquipmentModal, setShowEquipmentModal] = useState(false);

    // Expense History column settings
    const expenseHistoryAllColumns = ['bidId', 'bidTema', 'clientObject', 'client', 'equipmentName', 'imei', 'quantity'];
    const savedExpenseHistoryColumns = localStorage.getItem('expenseHistoryVisibleColumns');
    const defaultExpenseHistoryVisibleColumns = {
        bidId: true,
        bidTema: true,
        clientObject: true,
        client: true,
        equipmentName: true,
        imei: true,
        quantity: true,
    };
    const initialExpenseHistoryVisibleColumns = savedExpenseHistoryColumns 
        ? { ...defaultExpenseHistoryVisibleColumns, ...JSON.parse(savedExpenseHistoryColumns) } 
        : defaultExpenseHistoryVisibleColumns;
    const savedExpenseHistoryOrder = localStorage.getItem('expenseHistoryColumnOrder');
    const initialExpenseHistoryColumnOrder = savedExpenseHistoryOrder 
        ? [...new Set([...JSON.parse(savedExpenseHistoryOrder).filter(col => expenseHistoryAllColumns.includes(col)), ...expenseHistoryAllColumns])] 
        : expenseHistoryAllColumns;
    const [expenseHistoryColumnOrder, setExpenseHistoryColumnOrder] = useState(initialExpenseHistoryColumnOrder);
    const [expenseHistoryVisibleColumns, setExpenseHistoryVisibleColumns] = useState(initialExpenseHistoryVisibleColumns);
    const [showExpenseHistoryColumnSettings, setShowExpenseHistoryColumnSettings] = useState(false);
    const [returnHistoryLoading, setReturnHistoryLoading] = useState(false);
    const [returnHistory, setReturnHistory] = useState([]);

    useEffect(() => {
        fetchEquipment();
        fetchSuppliers();
        fetchEquipmentCategories();
    }, []);

    // Fetch expense history when the tab is active
    useEffect(() => {
        if (activeTab === 'expense-history') {
            fetchExpenseHistory();
        }
    }, [activeTab]);

    // Refresh expense history when the page becomes visible (user returns from another tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (activeTab === 'expense-history' && !document.hidden) {
                fetchExpenseHistory();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [activeTab]);

    // Fetch return history when the tab is active
    useEffect(() => {
        if (activeTab === 'return-history') {
            fetchReturnHistory();
        }
    }, [activeTab]);

    // Fetch equipment categories and suppliers when the tab is active
    useEffect(() => {
        if (activeTab === 'other') {
            fetchSuppliers();
            fetchEquipmentCategories();
        }
    }, [activeTab]);

    // Refresh return history when the page becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (activeTab === 'return-history' && !document.hidden) {
                fetchReturnHistory();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [activeTab]);

    // useEffect для сохранения настроек колонок оборудования в localStorage
    useEffect(() => {
        localStorage.setItem('equipmentVisibleColumns', JSON.stringify(equipmentVisibleColumns));
    }, [equipmentVisibleColumns]);

    // useEffect для сохранения порядка колонок оборудования в localStorage
    useEffect(() => {
        localStorage.setItem('equipmentColumnOrder', JSON.stringify(equipmentColumnOrder));
    }, [equipmentColumnOrder]);

    // useEffect для сохранения настроек колонок истории расхода в localStorage
    useEffect(() => {
        localStorage.setItem('expenseHistoryVisibleColumns', JSON.stringify(expenseHistoryVisibleColumns));
    }, [expenseHistoryVisibleColumns]);

    // useEffect для сохранения порядка колонок истории расхода в localStorage
    useEffect(() => {
        localStorage.setItem('expenseHistoryColumnOrder', JSON.stringify(expenseHistoryColumnOrder));
    }, [expenseHistoryColumnOrder]);

    // useEffect для закрытия выпадающего списка настроек колонок истории расхода при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showEquipmentColumnSettings && !event.target.closest('.equipment-column-settings')) {
                setShowEquipmentColumnSettings(false);
            }
            if (showExpenseHistoryColumnSettings && !event.target.closest('.expense-history-column-settings')) {
                setShowExpenseHistoryColumnSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEquipmentColumnSettings, showExpenseHistoryColumnSettings]);

    const fetchEquipment = async () => {
        try {
            const response = await getEquipment();
            setEquipment(response.data);
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await getSuppliers();
            setSuppliers(response.data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const fetchEquipmentCategories = async () => {
        try {
            const response = await getEquipmentCategories();
            setEquipmentCategories(response.data);
        } catch (error) {
            console.error('Error fetching equipment categories:', error);
        }
    };

    const fetchExpenseHistory = async () => {
        try {
            const response = await getExpenseHistory();
            setExpenseHistory(response.data);
        } catch (error) {
            console.error('Error fetching expense history:', error);
        }
    };

    const fetchReturnHistory = async () => {
        try {
            setReturnHistoryLoading(true);
            const response = await getReturnHistory();
            setReturnHistory(response.data);
        } catch (error) {
            console.error('Error fetching return history:', error);
        } finally {
            setReturnHistoryLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingItem) {
                await updateEquipment(editingItem.id, formData);
                fetchEquipment();
                resetForm();
                closeCustomTab('create-equipment');
                setActiveTab('nomenclature');
            } else {
                const response = await createEquipment(formData);
                fetchEquipment();
                navigate(`/dashboard/equipment/${response.data.id}`);
                closeCustomTab('create-equipment');
            }
        } catch (error) {
            console.error('Error saving equipment:', error);
            setError(error.response?.data?.message || 'Ошибка при сохранении оборудования');
        }
    };

    const handleView = (item) => {
        // Загружаем поставщиков и категории если ещё не загружены
        if (suppliers.length === 0) fetchSuppliers();
        if (equipmentCategories.length === 0) fetchEquipmentCategories();
        setSelectedEquipment(item);
        setShowEquipmentModal(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            productCode: item.productCode || '',
            sellingPrice: item.sellingPrice || '',
            purchasePrice: item.purchasePrice || '',
            category: item.category || '',
            supplierId: item.supplierId || '',
        });
        // Загружаем поставщиков и категории если ещё не загружены
        if (suppliers.length === 0) fetchSuppliers();
        if (equipmentCategories.length === 0) fetchEquipmentCategories();
        openCustomTab('create-equipment', 'Редактирование оборудования');
    };

    const handleDelete = async (item) => {
        if (window.confirm(`Вы уверены, что хотите удалить оборудование "${item.name}"?`)) {
            try {
                await deleteEquipment(item.id);
                fetchEquipment();
            } catch (error) {
                console.error('Error deleting equipment:', error);
            }
        }
    };

    // CRUD для поставщиков
    const handleCreateSupplier = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await updateSupplier(editingSupplier.id, supplierFormData);
            } else {
                await createSupplier(supplierFormData);
            }
            fetchSuppliers();
            setSupplierFormData({ name: '', entityType: '', inn: '', phone: '', email: '' });
            setEditingSupplier(null);
            setShowSupplierModal(false);
        } catch (error) {
            console.error('Error saving supplier:', error);
            setError(error.response?.data?.message || 'Ошибка при сохранении поставщика');
        }
    };

    const handleEditSupplier = (supplier) => {
        setEditingSupplier(supplier);
        setSupplierFormData({
            name: supplier.name || '',
            entityType: supplier.entityType || '',
            inn: supplier.inn || '',
            phone: supplier.phone || '',
            email: supplier.email || ''
        });
    };

    const handleDeleteSupplier = async (supplier) => {
        if (window.confirm(`Вы уверены, что хотите удалить поставщика "${supplier.name}"?`)) {
            try {
                await deleteSupplier(supplier.id);
                fetchSuppliers();
            } catch (error) {
                console.error('Error deleting supplier:', error);
                setError(error.response?.data?.message || 'Ошибка при удалении поставщика');
            }
        }
    };

    // CRUD для категорий оборудования
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                name: categoryFormData.name,
                description: categoryFormData.description,
                parentId: categoryFormData.parentId ? parseInt(categoryFormData.parentId) : null
            };
            if (editingCategory) {
                await updateEquipmentCategory(editingCategory.id, dataToSend);
            } else {
                await createEquipmentCategory(dataToSend);
            }
            fetchEquipmentCategories();
            setCategoryFormData({ name: '', description: '', parentId: '' });
            setEditingCategory(null);
            setShowCategoryModal(false);
        } catch (error) {
            console.error('Error saving category:', error);
            setError(error.response?.data?.message || 'Ошибка при сохранении категории');
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryFormData({
            name: category.name || '',
            description: category.description || '',
            parentId: category.parentId || ''
        });
    };

    const handleDeleteCategory = async (category) => {
        if (window.confirm(`Вы уверены, что хотите удалить категорию "${category.name}"?`)) {
            try {
                await deleteEquipmentCategory(category.id);
                fetchEquipmentCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
                setError(error.response?.data?.message || 'Ошибка при удалении категории');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            productCode: '',
            sellingPrice: '',
            purchasePrice: '',
        });
        setEditingItem(null);
        setError('');
    };


    const filteredEquipment = equipment.filter(item =>
        item.id.toString().includes(searchTerm) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productCode?.toString().includes(searchTerm)
    );

    // Определение видимых столбцов оборудования в порядке equipmentColumnOrder
    const displayEquipmentColumns = equipmentColumnOrder.filter(col => equipmentVisibleColumns[col]);

    const handleEquipmentColumnToggle = (column) => {
        setEquipmentVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    const moveEquipmentUp = (index) => {
        if (index > 0) {
            const newOrder = [...equipmentColumnOrder];
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            setEquipmentColumnOrder(newOrder);
        }
    };

    const moveEquipmentDown = (index) => {
        if (index < equipmentColumnOrder.length - 1) {
            const newOrder = [...equipmentColumnOrder];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setEquipmentColumnOrder(newOrder);
        }
    };

    const getEquipmentColumnLabel = (column) => {
        const labels = {
            id: 'ID',
            name: 'Название',
            productCode: 'Код товара',
            sellingPrice: 'Цена продажи',
            purchasePrice: 'Цена закупки',
            category: 'Категория',
            supplier: 'Поставщик',
        };
        return labels[column] || column;
    };

    const getEquipmentCellContent = (item, column) => {
        switch (column) {
            case 'id':
                return item.id;
            case 'name':
                return item.name;
            case 'productCode':
                return item.productCode || '-';
            case 'sellingPrice':
                return item.sellingPrice ? `${item.sellingPrice} ₽` : '-';
            case 'purchasePrice':
                return item.purchasePrice ? `${item.purchasePrice} ₽` : '-';
            case 'category':
                if (!item.category) return '-';
                const cat = equipmentCategories.find(c => String(c.id) === String(item.category));
                return cat ? cat.name : item.category;
            case 'supplier':
                if (!item.supplierId) return '-';
                const sup = suppliers.find(s => s.id === item.supplierId);
                return sup ? sup.name : '-';
            default:
                return '';
        }
    };

    // Expense History column functions
    const handleExpenseHistoryColumnToggle = (column) => {
        setExpenseHistoryVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    const moveExpenseHistoryUp = (index) => {
        if (index > 0) {
            const newOrder = [...expenseHistoryColumnOrder];
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            setExpenseHistoryColumnOrder(newOrder);
        }
    };

    const moveExpenseHistoryDown = (index) => {
        if (index < expenseHistoryColumnOrder.length - 1) {
            const newOrder = [...expenseHistoryColumnOrder];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setExpenseHistoryColumnOrder(newOrder);
        }
    };

    const getExpenseHistoryColumnLabel = (column) => {
        const labels = {
            bidId: 'Номер заявки',
            bidTema: 'Тема заявки',
            clientObject: 'Объект обслуживания',
            client: 'Клиент',
            equipmentName: 'Название оборудования',
            imei: 'IMEI',
            quantity: 'Количество',
        };
        return labels[column] || column;
    };

    const displayExpenseHistoryColumns = expenseHistoryColumnOrder.filter(col => expenseHistoryVisibleColumns[col]);

    const baseTabs = [
        { id: 'nomenclature', label: 'Номенклатура' },
        { id: 'expense-history', label: 'История Расхода' },
        { id: 'return-history', label: 'История возврата' },
        { id: 'other', label: 'Прочее' }
    ];

    const allTabs = [...baseTabs, ...customTabs];

    const openCustomTab = (tabId, tabLabel) => {
        if (!customTabs.find(tab => tab.id === tabId)) {
            setCustomTabs([...customTabs, { id: tabId, label: tabLabel }]);
        }
        setActiveTab(tabId);
    };

    const closeCustomTab = (tabId) => {
        setCustomTabs(customTabs.filter(tab => tab.id !== tabId));
        if (activeTab === tabId) {
            setActiveTab('nomenclature');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Оборудование</h1>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}


                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6 relative">
                        <nav className="tab-nav -mb-px flex space-x-8 overflow-x-auto pl-8 pr-8">
                            {allTabs.map(tab => (
                                <div key={tab.id} className="flex items-center flex-shrink-0">
                                    <button
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                    {customTabs.find(ct => ct.id === tab.id) && (
                                        <button
                                            onClick={() => closeCustomTab(tab.id)}
                                            className="ml-1 text-gray-400 hover:text-gray-600"
                                            title="Закрыть вкладку"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </nav>
                        <button
                            onClick={() => {
                                const nav = document.querySelector('.tab-nav');
                                if (nav) nav.scrollBy({ left: -200, behavior: 'smooth' });
                            }}
                            className="absolute left-0 top-0 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                            title="Прокрутить влево"
                        >
                            ‹
                        </button>
                        <button
                            onClick={() => {
                                const nav = document.querySelector('.tab-nav');
                                if (nav) nav.scrollBy({ left: 200, behavior: 'smooth' });
                            }}
                            className="absolute right-0 top-0 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                            title="Прокрутить вправо"
                        >
                            ›
                        </button>
                    </div>

                    {activeTab === 'nomenclature' && (
                        <>
                            {/* Карточка с элементами управления */}
                            <div className="bg-gray-200 rounded-lg p-4 mb-6">
                                {/* Кнопка создания нового оборудования */}
                                <div className="flex justify-end mb-4">
                                    {hasPermission('equipment_create') && (
                                        <button
                                            onClick={() => {
                                                resetForm();
                                                if (suppliers.length === 0) fetchSuppliers();
                                                if (equipmentCategories.length === 0) fetchEquipmentCategories();
                                                openCustomTab('create-equipment', 'Создание оборудования');
                                            }}
                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                                        >
                                            Новое оборудование
                                        </button>
                                    )}
                                </div>
                                {/* Поле поиска и настройки столбцов */}
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="Поиск по ID, названию или коду..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="relative equipment-column-settings">
                                        <button
                                            onClick={() => setShowEquipmentColumnSettings(!showEquipmentColumnSettings)}
                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                                        >
                                            Настройки столбцов
                                        </button>
                                        {showEquipmentColumnSettings && (
                                            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10 equipment-column-settings">
                                                <div className="p-4">
                                                    <h4 className="font-medium mb-2">Настройки столбцов</h4>
                                                    {equipmentColumnOrder.map((column, index) => (
                                                        <div key={column} className="flex items-center justify-between mb-2">
                                                            <label className="flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={equipmentVisibleColumns[column]}
                                                                    onChange={() => handleEquipmentColumnToggle(column)}
                                                                    className="mr-2"
                                                                />
                                                                {getEquipmentColumnLabel(column)}
                                                            </label>
                                                            {equipmentVisibleColumns[column] && (
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => moveEquipmentUp(index)}
                                                                        disabled={index === 0}
                                                                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs rounded"
                                                                    >
                                                                        ↑
                                                                    </button>
                                                                    <button
                                                                        onClick={() => moveEquipmentDown(index)}
                                                                        disabled={index === equipmentColumnOrder.length - 1}
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
                            </div>
                            <div className="bg-white rounded-lg shadow overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {displayEquipmentColumns.map(column => (
                                                <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>
                                                    {getEquipmentColumnLabel(column)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredEquipment.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(item)}>
                                                {displayEquipmentColumns.map(column => (
                                                    <td key={column} className="px-6 py-4 whitespace-nowrap" onClick={(e) => { e.stopPropagation(); handleView(item); }}>
                                                        {getEquipmentCellContent(item, column)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {activeTab === 'create-equipment' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-xl font-bold mb-4">{editingItem ? 'Редактировать оборудование' : 'Добавить новое оборудование'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    label="Название"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Код товара"
                                    type="number"
                                    value={formData.productCode}
                                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                                />
                                <Select
                                    label="Категория оборудования"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value ? parseInt(e.target.value) : '' })}
                                    options={equipmentCategories.map(cat => ({ value: cat.id, label: (cat.parentId ? '→ ' : '') + cat.name }))}
                                    placeholder="Выберите категорию"
                                />
                                <Select
                                    label="Поставщик"
                                    value={formData.supplierId}
                                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value ? parseInt(e.target.value) : '' })}
                                    options={suppliers.map(sup => ({ value: sup.id, label: sup.name }))}
                                    placeholder="Выберите поставщика"
                                />
                                <Input
                                    label="Цена продажи"
                                    type="number"
                                    step="0.01"
                                    value={formData.sellingPrice}
                                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                />
                                <Input
                                    label="Цена закупки"
                                    type="number"
                                    step="0.01"
                                    value={formData.purchasePrice}
                                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                />
                                <div className="flex gap-2 pt-4">
                                    <Button type="submit" variant="primary" className="flex-1">
                                        {editingItem ? 'Обновить' : 'Создать'}
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => {
                                        closeCustomTab('create-equipment');
                                        resetForm();
                                    }} className="flex-1">
                                        Отмена
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'expense-history' && (
                        <div>
                            {/* Карточка с элементами управления */}
                            <div className="bg-gray-200 rounded-lg p-4 mb-6">
                                <div className="flex justify-end gap-2">
                                    <div className="relative expense-history-column-settings">
                                        <button
                                            onClick={() => setShowExpenseHistoryColumnSettings(!showExpenseHistoryColumnSettings)}
                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                                        >
                                            Настройки столбцов
                                        </button>
                                        {showExpenseHistoryColumnSettings && (
                                            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10 expense-history-column-settings" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                                <div className="p-4">
                                                    <h4 className="font-medium mb-2">Настройки столбцов</h4>
                                                    {expenseHistoryColumnOrder.map((column, index) => (
                                                        <div key={column} className="flex items-center justify-between mb-2">
                                                            <label className="flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={expenseHistoryVisibleColumns[column]}
                                                                    onChange={() => handleExpenseHistoryColumnToggle(column)}
                                                                    className="mr-2"
                                                                />
                                                                {getExpenseHistoryColumnLabel(column)}
                                                            </label>
                                                            {expenseHistoryVisibleColumns[column] && (
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => moveExpenseHistoryUp(index)}
                                                                        disabled={index === 0}
                                                                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs rounded"
                                                                    >
                                                                        ↑
                                                                    </button>
                                                                    <button
                                                                        onClick={() => moveExpenseHistoryDown(index)}
                                                                        disabled={index === expenseHistoryColumnOrder.length - 1}
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
                                        onClick={fetchExpenseHistory}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        Обновить
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {displayExpenseHistoryColumns.map(column => (
                                                <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    {getExpenseHistoryColumnLabel(column)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {expenseHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan={displayExpenseHistoryColumns.length} className="px-6 py-4 text-center text-gray-500">
                                                    Нет данных о расходе оборудования
                                                </td>
                                            </tr>
                                        ) : (
                                            expenseHistory.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    {displayExpenseHistoryColumns.map(column => (
                                                        <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {column === 'bidId' && (
                                                                <button
                                                                    onClick={() => navigate(`/dashboard/bids/${item.bid?.id}`)}
                                                                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                                                                >
                                                                    №{item.bid?.id || '-'}
                                                                </button>
                                                            )}
                                                            {column === 'bidTema' && (item.bid?.tema || '-')}
                                                            {column === 'clientObject' && (
                                                                item.bid?.clientObject?.address || 
                                                                item.bid?.clientObject?.name || 
                                                                item.bid?.clientObject?.brandModel || 
                                                                '-'
                                                            )}
                                                            {column === 'client' && (item.bid?.client?.name || '-')}
                                                            {column === 'equipmentName' && (item.equipment?.name || '-')}
                                                            {column === 'imei' && (item.imei || '-')}
                                                            {column === 'quantity' && (item.quantity || 1)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'return-history' && (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-6 pb-0 flex justify-between items-center">
                                <h3 className="text-xl font-bold">История возврата</h3>
                                <button
                                    onClick={fetchReturnHistory}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Обновить
                                </button>
                            </div>
                            <div className="overflow-x-auto p-6">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Номер заявки</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тема заявки</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Клиент</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Объект</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Оборудование</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IMEI</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Кол-во</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Причина возврата</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Кто вернул</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Кто составил заявку</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата возврата</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {returnHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                                                    Нет записей о возврате оборудования
                                                </td>
                                            </tr>
                                        ) : (
                                            returnHistory.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <button
                                                            onClick={() => navigate(`/dashboard/bids/${item.bidId}`)}
                                                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                                                        >
                                                            №{item.bidId}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.bidTema}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.client}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.clientObject}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.equipmentName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.imei}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.returnReason}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.returnedBy}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.createdBy}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(item.createdAt).toLocaleString('ru-RU')}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Вкладка Прочее - Поставщики и Категории оборудования */}
                    {activeTab === 'other' && (
                        <div className="space-y-8">
                            {/* Секция Поставщики */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold">Поставщики</h3>
                                    <button
                                        onClick={() => {
                                            setEditingSupplier(null);
                                            setSupplierFormData({ name: '', entityType: '', inn: '', phone: '', email: '' });
                                            setShowSupplierModal(true);
                                        }}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        + Добавить поставщика
                                    </button>
                                </div>
                                
                                {/* Форма добавления/редактирования поставщика */}
                                {(editingSupplier || supplierFormData.name) && (
                                    <form onSubmit={handleCreateSupplier} className="mb-6 p-4 bg-gray-50 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Название *"
                                                value={supplierFormData.name}
                                                onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Тип организации (ИП/ООО/АО)"
                                                value={supplierFormData.entityType}
                                                onChange={(e) => setSupplierFormData({ ...supplierFormData, entityType: e.target.value })}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="ИНН"
                                                value={supplierFormData.inn}
                                                onChange={(e) => setSupplierFormData({ ...supplierFormData, inn: e.target.value })}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Телефон"
                                                value={supplierFormData.phone}
                                                onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={supplierFormData.email}
                                                onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                                            >
                                                {editingSupplier ? 'Обновить' : 'Добавить'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingSupplier(null);
                                                    setSupplierFormData({ name: '', entityType: '', inn: '', phone: '', email: '' });
                                                }}
                                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Таблица поставщиков */}
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Поиск поставщиков..."
                                        value={supplierSearch}
                                        onChange={(e) => setSupplierSearch(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ИНН</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {suppliers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                                        Нет поставщиков
                                                    </td>
                                                </tr>
                                            ) : (
                                                suppliers.filter(s => 
                                                    !supplierSearch || 
                                                    s.name?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                                                    s.inn?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                                                    s.phone?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                                                    s.email?.toLowerCase().includes(supplierSearch.toLowerCase())
                                                ).map((supplier) => (
                                                    <tr key={supplier.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.entityType || '-'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.inn || '-'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.phone || '-'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.email || '-'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <button
                                                                onClick={() => handleEditSupplier(supplier)}
                                                                className="text-blue-600 hover:text-blue-900 mr-2"
                                                            >
                                                                Редактировать
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSupplier(supplier)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Удалить
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Секция Категории оборудования */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold">Категории оборудования</h3>
                                    <button
                                        onClick={() => {
                                            setEditingCategory(null);
                                            setCategoryFormData({ name: '', description: '', parentId: '' });
                                            setShowCategoryModal(true);
                                        }}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        + Добавить категорию
                                    </button>
                                </div>
                                
                                {/* Форма добавления/редактирования категории */}
                                {(editingCategory || categoryFormData.name) && (
                                    <form onSubmit={handleCreateCategory} className="mb-6 p-4 bg-gray-50 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Название *"
                                                value={categoryFormData.name}
                                                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Описание"
                                                value={categoryFormData.description}
                                                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <select
                                                value={categoryFormData.parentId}
                                                onChange={(e) => setCategoryFormData({ ...categoryFormData, parentId: e.target.value ? parseInt(e.target.value) : '' })}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Без родителя</option>
                                                {equipmentCategories.filter(c => c.id !== editingCategory?.id).map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.parentId ? '→ ' : ''}{cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                                            >
                                                {editingCategory ? 'Обновить' : 'Добавить'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingCategory(null);
                                                    setCategoryFormData({ name: '', description: '', parentId: '' });
                                                }}
                                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Таблица категорий */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Родительская категория</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {equipmentCategories.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                        Нет категорий оборудования
                                                    </td>
                                                </tr>
                                            ) : (
                                                equipmentCategories.map((category) => (
                                                    <tr key={category.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.id}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {category.parentId ? '→ ' : ''}{category.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {category.parent?.name || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.description || '-'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <button
                                                                onClick={() => handleEditCategory(category)}
                                                                className="text-blue-600 hover:text-blue-900 mr-2"
                                                            >
                                                                Редактировать
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCategory(category)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Удалить
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Модальное окно просмотра/редактирования оборудования */}
                    {showEquipmentModal && selectedEquipment && (
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setShowEquipmentModal(false);
                                    setSelectedEquipment(null);
                                }
                            }}
                        >
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 relative">
                                <button
                                    onClick={() => {
                                        setShowEquipmentModal(false);
                                        setSelectedEquipment(null);
                                    }}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
                                >
                                    ×
                                </button>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold mb-4">{selectedEquipment.name}</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">ID:</span>
                                            <span className="font-medium">{selectedEquipment.id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Код товара:</span>
                                            <span className="font-medium">{selectedEquipment.productCode || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Цена продажи:</span>
                                            <span className="font-medium">{selectedEquipment.sellingPrice ? `${selectedEquipment.sellingPrice} ₽` : '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Цена закупки:</span>
                                            <span className="font-medium">{selectedEquipment.purchasePrice ? `${selectedEquipment.purchasePrice} ₽` : '-'}</span>
                                        </div>
                                        {selectedEquipment.description && (
                                            <div>
                                                <span className="text-gray-600">Описание:</span>
                                                <p className="mt-1 text-gray-900">{selectedEquipment.description}</p>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Категория:</span>
                                            <span className="font-medium">
                                                {selectedEquipment.category 
                                                    ? (equipmentCategories.find(c => c.id === selectedEquipment.category)?.name || selectedEquipment.category)
                                                    : 'Отсутствует'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Поставщик:</span>
                                            <span className="font-medium">
                                                {selectedEquipment.supplierId 
                                                    ? (suppliers.find(s => s.id === selectedEquipment.supplierId)?.name || selectedEquipment.supplierId)
                                                    : 'Отсутствует'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
                                    {hasPermission('equipment_edit') && (
                                        <button
                                            onClick={() => {
                                                setShowEquipmentModal(false);
                                                handleEdit(selectedEquipment);
                                            }}
                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                                        >
                                            Редактировать
                                        </button>
                                    )}
                                    {hasPermission('equipment_delete') && (
                                        <button
                                            onClick={() => {
                                                handleDelete(selectedEquipment);
                                                setShowEquipmentModal(false);
                                                setSelectedEquipment(null);
                                            }}
                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                                        >
                                            Удалить
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                {/* Модальное окно для категории */}
                {showCategoryModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">
                                    {editingCategory ? 'Редактировать категорию' : 'Новая категория'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowCategoryModal(false);
                                        setEditingCategory(null);
                                        setCategoryFormData({ name: '', description: '', parentId: '' });
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleCreateCategory}>
                                <div className="space-y-4">
                                    <Input
                                        label="Название *"
                                        type="text"
                                        placeholder="Название категории"
                                        value={categoryFormData.name}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                        required
                                    />
                                    <Select
                                        label="Родительская категория"
                                        value={categoryFormData.parentId}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, parentId: e.target.value ? parseInt(e.target.value) : '' })}
                                        options={equipmentCategories.filter(c => c.id !== editingCategory?.id).map(cat => ({ value: cat.id, label: (cat.parentId ? '→ ' : '') + cat.name }))}
                                        placeholder="Без родителя (корневая категория)"
                                    />
                                    <Textarea
                                        label="Описание"
                                        placeholder="Описание категории"
                                        value={categoryFormData.description}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div className="mt-6 flex gap-2 justify-end">
                                    <Button type="button" variant="secondary" onClick={() => {
                                        setShowCategoryModal(false);
                                        setEditingCategory(null);
                                        setCategoryFormData({ name: '', description: '', parentId: '' });
                                    }}>
                                        Отмена
                                    </Button>
                                    <Button type="submit" variant="primary">
                                        {editingCategory ? 'Обновить' : 'Создать'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Модальное окно для поставщика */}
                {showSupplierModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">
                                    {editingSupplier ? 'Редактировать поставщика' : 'Новый поставщик'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowSupplierModal(false);
                                        setEditingSupplier(null);
                                        setSupplierFormData({ name: '', entityType: '', inn: '', phone: '', email: '' });
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleCreateSupplier}>
                                <div className="space-y-4">
                                    <Input
                                        label="Название *"
                                        type="text"
                                        placeholder="Название поставщика"
                                        value={supplierFormData.name}
                                        onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Тип организации"
                                        type="text"
                                        placeholder="ИП/ООО/АО"
                                        value={supplierFormData.entityType}
                                        onChange={(e) => setSupplierFormData({ ...supplierFormData, entityType: e.target.value })}
                                    />
                                    <Input
                                        label="ИНН"
                                        type="text"
                                        placeholder="ИНН"
                                        value={supplierFormData.inn}
                                        onChange={(e) => setSupplierFormData({ ...supplierFormData, inn: e.target.value })}
                                    />
                                    <Input
                                        label="Телефон"
                                        type="text"
                                        placeholder="Телефон"
                                        value={supplierFormData.phone}
                                        onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        placeholder="Email"
                                        value={supplierFormData.email}
                                        onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                                    />
                                </div>
                                <div className="mt-6 flex gap-2 justify-end">
                                    <Button type="button" variant="secondary" onClick={() => {
                                        setShowSupplierModal(false);
                                        setEditingSupplier(null);
                                        setSupplierFormData({ name: '', entityType: '', inn: '', phone: '', email: '' });
                                    }}>
                                        Отмена
                                    </Button>
                                    <Button type="submit" variant="primary">
                                        {editingSupplier ? 'Обновить' : 'Создать'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default Equipment;