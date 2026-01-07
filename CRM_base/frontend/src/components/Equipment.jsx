import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEquipment, createEquipment, updateEquipment, deleteEquipment, getSuppliers, createSupplier, updateSupplier, deleteSupplier, getArrivalDocuments, getBids, getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../services/api';
import EquipmentArrival from './EquipmentArrival';
import SupplierCreate from './SupplierCreate';
import ArrivalDetail from './ArrivalDetail';

const Equipment = () => {
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [arrivalDocuments, setArrivalDocuments] = useState([]);
    const [selectedArrivalDocument, setSelectedArrivalDocument] = useState(null);
    const [bids, setBids] = useState([]);
    const [showSupplierForm, setShowSupplierForm] = useState(false);
    const [showWarehouseForm, setShowWarehouseForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [warehouseSearchTerm, setWarehouseSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const [activeTab, setActiveTab] = useState('nomenclature');
    const [customTabs, setCustomTabs] = useState([]);
    // Define all possible columns for equipment
    const equipmentAllColumns = ['id', 'name', 'description', 'productCode', 'quantity'];
    // Load initial states from localStorage for equipment
    const savedEquipmentColumns = localStorage.getItem('equipmentVisibleColumns');
    const initialEquipmentVisibleColumns = savedEquipmentColumns ? JSON.parse(savedEquipmentColumns) : {
        id: true,
        name: true,
        description: true,
        productCode: true,
        quantity: true,
    };
    const savedEquipmentOrder = localStorage.getItem('equipmentColumnOrder');
    const initialEquipmentColumnOrder = savedEquipmentOrder ? JSON.parse(savedEquipmentOrder) : equipmentAllColumns;
    // State for equipment column order
    const [equipmentColumnOrder, setEquipmentColumnOrder] = useState(initialEquipmentColumnOrder);
    // State for visible equipment columns in the table
    const [equipmentVisibleColumns, setEquipmentVisibleColumns] = useState(initialEquipmentVisibleColumns);
    // State for showing equipment column settings dropdown
    const [showEquipmentColumnSettings, setShowEquipmentColumnSettings] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        productCode: '',
    });
    const [supplierFormData, setSupplierFormData] = useState({
        name: '',
        entityType: 'Юр. лицо',
        inn: '',
        phone: '',
        email: '',
    });
    const [warehouseFormData, setWarehouseFormData] = useState({
        name: '',
        description: '',
    });
    const [warehouseError, setWarehouseError] = useState('');
    const [expenseStartDate, setExpenseStartDate] = useState('');
    const [expenseEndDate, setExpenseEndDate] = useState('');
    const [expenseEquipmentFilter, setExpenseEquipmentFilter] = useState('all');
    const [selectedReport, setSelectedReport] = useState(null);
    const [showExpenseReport, setShowExpenseReport] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEquipment();
        fetchSuppliers();
        fetchWarehouses();
        fetchArrivalDocuments();
        fetchBids();
        setShowSupplierForm(false);
        setShowWarehouseForm(false);
    }, []);

    useEffect(() => {
        console.log('useEffect activeTab:', activeTab);
        if (activeTab === 'create-arrival') {
            fetchSuppliers(); // Refresh suppliers list when returning to arrival creation
        }
        if (activeTab === 'nomenclature') {
            fetchEquipment(); // Refresh equipment list when returning to nomenclature
        }
    }, [activeTab]);

    // useEffect to save equipment column preferences to localStorage
    useEffect(() => {
        localStorage.setItem('equipmentVisibleColumns', JSON.stringify(equipmentVisibleColumns));
    }, [equipmentVisibleColumns]);

    // useEffect to save equipment column order to localStorage
    useEffect(() => {
        localStorage.setItem('equipmentColumnOrder', JSON.stringify(equipmentColumnOrder));
    }, [equipmentColumnOrder]);

    // useEffect to close equipment dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showEquipmentColumnSettings && !event.target.closest('.equipment-column-settings')) {
                setShowEquipmentColumnSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEquipmentColumnSettings]);

    const fetchEquipment = async () => {
        console.log('fetchEquipment called');
        try {
            const response = await getEquipment();
            console.log('fetched equipment:', response.data);
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

    const fetchArrivalDocuments = async () => {
        try {
            const response = await getArrivalDocuments();
            setArrivalDocuments(response.data);
        } catch (error) {
            console.error('Error fetching arrival documents:', error);
        }
    };

    const fetchBids = async () => {
        try {
            const response = await getBids();
            setBids(response.data);
        } catch (error) {
            console.error('Error fetching bids:', error);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const response = await getWarehouses();
            setWarehouses(response.data);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
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
            } else {
                const response = await createEquipment(formData);
                navigate(`/dashboard/equipment/${response.data.id}`);
                closeCustomTab('create-equipment');
            }
        } catch (error) {
            console.error('Error saving equipment:', error);
            setError(error.response?.data?.message || 'Ошибка при сохранении оборудования');
        }
    };

    const handleView = (item) => {
        navigate(`/dashboard/equipment/${item.id}`);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            productCode: item.productCode || '',
        });
        setShowForm(true);
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

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            productCode: '',
        });
        setShowForm(false);
        setEditingItem(null);
        setError('');
    };

    const handleSupplierSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await updateSupplier(editingSupplier.id, supplierFormData);
                fetchSuppliers();
                resetSupplierForm();
            } else {
                await createSupplier(supplierFormData);
                fetchSuppliers();
                resetSupplierForm();
            }
        } catch (error) {
            console.error('Error saving supplier:', error);
        }
    };

    const handleSupplierEdit = (supplier) => {
        setEditingSupplier(supplier);
        setSupplierFormData({
            name: supplier.name,
            entityType: supplier.entityType,
            inn: supplier.inn,
            phone: supplier.phone || '',
            email: supplier.email || '',
        });
        setShowSupplierForm(true);
    };

    const handleSupplierDelete = async (supplier) => {
        if (window.confirm(`Вы уверены, что хотите удалить поставщика "${supplier.name}"?`)) {
            try {
                await deleteSupplier(supplier.id);
                fetchSuppliers();
            } catch (error) {
                console.error('Error deleting supplier:', error);
            }
        }
    };

    const resetSupplierForm = () => {
        setSupplierFormData({
            name: '',
            entityType: 'Юр. лицо',
            inn: '',
            phone: '',
            email: '',
        });
        setShowSupplierForm(false);
        setEditingSupplier(null);
    };

    const handleWarehouseSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingWarehouse) {
                await updateWarehouse(editingWarehouse.id, warehouseFormData);
                fetchWarehouses();
                closeCustomTab('edit-warehouse');
            } else {
                await createWarehouse(warehouseFormData);
                fetchWarehouses();
                closeCustomTab('create-warehouse');
            }
        } catch (error) {
            window.alert(error.response?.data?.message || 'Ошибка при сохранении склада');
        }
    };

    const handleWarehouseEdit = (warehouse) => {
        setEditingWarehouse(warehouse);
        setWarehouseFormData({
            name: warehouse.name,
            description: warehouse.description || '',
        });
        openCustomTab('edit-warehouse', `Редактирование склада: ${warehouse.name}`, warehouse);
    };

    const handleWarehouseDelete = async (warehouse) => {
        if (window.confirm(`Вы уверены, что хотите удалить склад "${warehouse.name}"?`)) {
            try {
                await deleteWarehouse(warehouse.id);
                fetchWarehouses();
            } catch (error) {
                console.error('Error deleting warehouse:', error);
            }
        }
    };

    const resetWarehouseForm = () => {
        setWarehouseFormData({
            name: '',
            description: '',
        });
        setShowWarehouseForm(false);
        setEditingWarehouse(null);
    };

    const filteredEquipment = equipment.filter(item =>
        item.id.toString().includes(searchTerm) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.id.toString().includes(supplierSearchTerm) ||
        supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())
    );

    const filteredWarehouses = warehouses.filter(warehouse =>
        warehouse.id.toString().includes(warehouseSearchTerm) ||
        warehouse.name.toLowerCase().includes(warehouseSearchTerm.toLowerCase())
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
            description: 'Описание',
            productCode: 'Код товара',
            quantity: 'Количество',
        };
        return labels[column] || column;
    };

    const getEquipmentCellContent = (item, column) => {
        switch (column) {
            case 'id':
                return item.id;
            case 'name':
                return item.name;
            case 'description':
                return item.description || '-';
            case 'productCode':
                return item.productCode || '-';
            case 'quantity':
                console.log('quantity for item', item.id, item.quantity);
                return item.quantity || 0;
            default:
                return '';
        }
    };

    const baseTabs = [
        { id: 'nomenclature', label: 'Номенклатура' },
        { id: 'arrivals', label: 'Приходы' },
        { id: 'expenses', label: 'Расходы' },
        { id: 'reports', label: 'Отчёты' },
        { id: 'other', label: 'Прочее' }
    ];

    const allTabs = [...baseTabs, ...customTabs];

    const openCustomTab = (tabId, tabLabel, data = null) => {
        if (!customTabs.find(tab => tab.id === tabId)) {
            setCustomTabs([...customTabs, { id: tabId, label: tabLabel }]);
        }
        if (data) {
            setSelectedArrivalDocument(data);
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Оборудование</h2>
            </div>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}


            {showSupplierForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">{editingSupplier ? 'Редактировать поставщика' : 'Добавить нового поставщика'}</h3>
                    <form onSubmit={handleSupplierSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                            <input
                                type="text"
                                value={supplierFormData.name}
                                onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Вид лица</label>
                            <select
                                value={supplierFormData.entityType}
                                onChange={(e) => setSupplierFormData({ ...supplierFormData, entityType: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="Юр. лицо">Юр. лицо</option>
                                <option value="Физ. лицо">Физ. лицо</option>
                                <option value="ИП">ИП</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ИНН</label>
                            <input
                                type="text"
                                value={supplierFormData.inn}
                                onChange={(e) => setSupplierFormData({ ...supplierFormData, inn: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Номер телефона</label>
                            <input
                                type="tel"
                                value={supplierFormData.phone}
                                onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Почта</label>
                            <input
                                type="email"
                                value={supplierFormData.email}
                                onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-2 pt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                            >
                                {editingSupplier ? 'Сохранить' : 'Создать'}
                            </button>
                            <button
                                type="button"
                                onClick={resetSupplierForm}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showWarehouseForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">{editingWarehouse ? 'Редактировать склад' : 'Добавить новый склад'}</h3>
                    <form onSubmit={handleWarehouseSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                            <input
                                type="text"
                                value={warehouseFormData.name}
                                onChange={(e) => setWarehouseFormData({ ...warehouseFormData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                            <textarea
                                value={warehouseFormData.description}
                                onChange={(e) => setWarehouseFormData({ ...warehouseFormData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                            />
                        </div>
                        <div className="flex gap-2 pt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                            >
                                {editingWarehouse ? 'Сохранить' : 'Создать'}
                            </button>
                            <button
                                type="button"
                                onClick={resetWarehouseForm}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!showSupplierForm && (
                <div>
                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-8">
                            {allTabs.map(tab => (
                                <div key={tab.id} className="flex items-center">
                                    <button
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === tab.id
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
                    </div>

                    {activeTab === 'nomenclature' && (
                        <>
                            <div className="mb-4 flex justify-between items-center">
                                <button
                                    onClick={() => openCustomTab('create-equipment', 'Создание оборудования')}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Новое оборудование
                                </button>
                            </div>
                            <div className="mb-4 flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Поиск по ID или названию..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="relative equipment-column-settings">
                                    <button
                                        onClick={() => setShowEquipmentColumnSettings(!showEquipmentColumnSettings)}
                                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
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
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {displayEquipmentColumns.map(column => (
                                                <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    {getEquipmentColumnLabel(column)}
                                                </th>
                                            ))}
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredEquipment.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                {displayEquipmentColumns.map(column => (
                                                    <td key={column} className={`px-6 py-4 ${column === 'description' ? '' : 'whitespace-nowrap'} cursor-pointer`} onClick={() => handleView(item)}>
                                                        {getEquipmentCellContent(item, column)}
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="text-blue-600 hover:text-blue-900 mr-2"
                                                    >
                                                        Редактировать
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Удалить
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {activeTab === 'arrivals' && (
                        <div>
                            <div className="mb-4">
                                <button
                                    onClick={() => openCustomTab('create-arrival', 'Создание прихода')}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Создать приход
                                </button>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-medium mb-4">Список принятых накладных</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата прихода</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Поставщик</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Номер документа</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Склад</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {arrivalDocuments.map((doc) => (
                                                <tr key={doc.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openCustomTab('arrival-detail', `Накладная ${doc.documentNumber}`, doc)}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(doc.date).toLocaleDateString('ru-RU')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {doc.supplier?.name || 'Не указан'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.documentNumber}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.warehouse}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {arrivalDocuments.length === 0 && (
                                        <p className="text-center text-gray-500 py-4">Нет принятых накладных</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'create-arrival' && (
                        <EquipmentArrival openCustomTab={openCustomTab} closeTab={() => closeCustomTab('create-arrival')} refreshEquipment={fetchEquipment} />
                    )}

                    {activeTab === 'create-supplier' && (
                        <SupplierCreate closeTab={() => closeCustomTab('create-supplier')} />
                    )}

                    {activeTab === 'arrival-detail' && (
                        <ArrivalDetail arrivalDocument={selectedArrivalDocument} closeTab={() => closeCustomTab('arrival-detail')} />
                    )}

                    {activeTab === 'create-equipment' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-xl font-bold mb-4">Добавить новое оборудование</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Код товара</label>
                                    <input
                                        type="number"
                                        value={formData.productCode}
                                        onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        onClick={() => {
                                            closeCustomTab('create-equipment');
                                            resetForm();
                                        }}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {(activeTab === 'create-warehouse' || activeTab === 'edit-warehouse') && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-xl font-bold mb-4">{editingWarehouse ? 'Редактировать склад' : 'Добавить новый склад'}</h3>
                            <form onSubmit={handleWarehouseSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input
                                        type="text"
                                        value={warehouseFormData.name}
                                        onChange={(e) => setWarehouseFormData({ ...warehouseFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                    <textarea
                                        value={warehouseFormData.description}
                                        onChange={(e) => setWarehouseFormData({ ...warehouseFormData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                    />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                    >
                                        {editingWarehouse ? 'Сохранить' : 'Создать'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            resetWarehouseForm();
                                            closeCustomTab(activeTab);
                                        }}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium mb-4">Расходы со склада</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название оборудования</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">№ Заявки</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата выдачи</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название клиента</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Склад</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {bids
                                            .filter(bid => bid.equipmentItems && bid.equipmentItems.length > 0)
                                            .flatMap((bid) =>
                                                bid.equipmentItems.map((item) => (
                                                    <tr key={`${bid.id}-${item.id}`}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800" onClick={() => navigate(`/dashboard/bids/${bid.id}`)}>
                                                            {item.equipment?.name || 'Неизвестно'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {bid.id}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(bid.createdAt).toLocaleDateString('ru-RU')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {bid.clientName}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            -
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                    </tbody>
                                </table>
                                {bids.filter(bid => bid.equipmentItems && bid.equipmentItems.length > 0).length === 0 && (
                                    <p className="text-center text-gray-500 py-4">Нет расходов со склада</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium mb-4">Отчёты</h3>
                            <div className="flex flex-col gap-2">
                                <button
                                    className="text-blue-600 hover:text-blue-800 text-left transition"
                                    onClick={() => openCustomTab('expense-report', 'Отчёт по расходам')}
                                >
                                    Отчёты по расходам
                                </button>
                                <button
                                    className="text-blue-600 hover:text-blue-800 text-left transition"
                                    onClick={() => openCustomTab('arrival-report', 'Отчёт по приходам')}
                                >
                                    Отчёты по приходом
                                </button>
                                <button
                                    className="text-blue-600 hover:text-blue-800 text-left transition"
                                    onClick={() => openCustomTab('balance-report', 'Отчёт по остаткам')}
                                >
                                    Отчёты по остатку
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'expense-report' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium mb-4">Отчёт по расходам</h3>
                            <div className="mb-4 flex gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала</label>
                                    <input
                                        type="date"
                                        value={expenseStartDate}
                                        onChange={(e) => setExpenseStartDate(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания</label>
                                    <input
                                        type="date"
                                        value={expenseEndDate}
                                        onChange={(e) => setExpenseEndDate(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Оборудование</label>
                                    <select
                                        value={expenseEquipmentFilter}
                                        onChange={(e) => setExpenseEquipmentFilter(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">Все</option>
                                        {equipment.map(eq => (
                                            <option key={eq.id} value={eq.id}>{eq.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mb-4">
                                <button
                                    onClick={() => setShowExpenseReport(true)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Сформировать отчёт
                                </button>
                            </div>
                            {showExpenseReport && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название оборудования</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">№ Заявки</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата выдачи</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название клиента</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Склад</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {bids
                                                .filter(bid => bid.equipmentItems && bid.equipmentItems.length > 0)
                                                .filter(bid => {
                                                    const bidDate = new Date(bid.createdAt);
                                                    const start = expenseStartDate ? new Date(expenseStartDate) : null;
                                                    const end = expenseEndDate ? new Date(expenseEndDate) : null;
                                                    const dateMatch = (!start || bidDate >= start) && (!end || bidDate <= end);
                                                    const equipmentMatch = expenseEquipmentFilter === 'all' || bid.equipmentItems.some(item => item.equipmentId === parseInt(expenseEquipmentFilter));
                                                    return dateMatch && equipmentMatch;
                                                })
                                                .flatMap((bid) =>
                                                    bid.equipmentItems
                                                        .filter(item => expenseEquipmentFilter === 'all' || item.equipmentId === parseInt(expenseEquipmentFilter))
                                                        .map((item) => (
                                                            <tr key={`${bid.id}-${item.id}`}>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800" onClick={() => navigate(`/dashboard/bids/${bid.id}`)}>
                                                                    {item.equipment?.name || 'Неизвестно'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {bid.id}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {new Date(bid.createdAt).toLocaleDateString('ru-RU')}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {bid.clientName}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {item.warehouse?.name || '-'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                )}
                                        </tbody>
                                    </table>
                                    {bids.filter(bid => bid.equipmentItems && bid.equipmentItems.length > 0).filter(bid => {
                                        const bidDate = new Date(bid.createdAt);
                                        const start = expenseStartDate ? new Date(expenseStartDate) : null;
                                        const end = expenseEndDate ? new Date(expenseEndDate) : null;
                                        const dateMatch = (!start || bidDate >= start) && (!end || bidDate <= end);
                                        const equipmentMatch = expenseEquipmentFilter === 'all' || bid.equipmentItems.some(item => item.equipmentId === parseInt(expenseEquipmentFilter));
                                        return dateMatch && equipmentMatch;
                                    }).length === 0 && (
                                        <p className="text-center text-gray-500 py-4">Нет расходов за выбранный период</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'suppliers' && (
                        <>
                            <div className="mb-4 flex justify-between items-center">
                                <button
                                    onClick={() => setShowSupplierForm(!showSupplierForm)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    {showSupplierForm ? 'Отмена' : 'Добавить поставщика'}
                                </button>
                            </div>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Поиск по ID или названию..."
                                    value={supplierSearchTerm}
                                    onChange={(e) => setSupplierSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Вид лица</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ИНН</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Почта</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredSuppliers.map((supplier) => (
                                            <tr key={supplier.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">{supplier.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{supplier.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{supplier.entityType}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{supplier.inn}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{supplier.phone || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{supplier.email || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleSupplierEdit(supplier)}
                                                        className="text-blue-600 hover:text-blue-900 mr-2"
                                                    >
                                                        Редактировать
                                                    </button>
                                                    <button
                                                        onClick={() => handleSupplierDelete(supplier)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Удалить
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                    {activeTab === 'warehouses' && (
                        <>
                            <div className="mb-4 flex justify-between items-center">
                                <button
                                    onClick={() => openCustomTab('create-warehouse', 'Создание склада')}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Создать склад
                                </button>
                            </div>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Поиск по ID или названию..."
                                    value={warehouseSearchTerm}
                                    onChange={(e) => setWarehouseSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID склада</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredWarehouses.map((warehouse) => (
                                            <tr key={warehouse.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">{warehouse.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{warehouse.name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs truncate">{warehouse.description || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleWarehouseEdit(warehouse)}
                                                        className="text-blue-600 hover:text-blue-900 mr-2"
                                                    >
                                                        Редактировать
                                                    </button>
                                                    <button
                                                        onClick={() => handleWarehouseDelete(warehouse)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Удалить
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                    {activeTab === 'other' && (
                        <div>
                            <div className="mb-4 flex gap-2">
                                <button
                                    onClick={() => openCustomTab('suppliers', 'Поставщики')}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Поставщики
                                </button>
                                <button
                                    onClick={() => openCustomTab('warehouses', 'Склады')}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Склады
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Equipment;