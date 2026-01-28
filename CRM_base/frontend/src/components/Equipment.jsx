import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEquipment, createEquipment, updateEquipment, deleteEquipment } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

const Equipment = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [equipment, setEquipment] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [showForm, setShowForm] = useState(false);
    // Определение всех возможных колонок для оборудования
    const equipmentAllColumns = ['id', 'name', 'productCode', 'purchasePrice', 'sellingPrice'];
    // Загрузка начальных состояний из localStorage для оборудования
    const savedEquipmentColumns = localStorage.getItem('equipmentVisibleColumns');
    const defaultEquipmentVisibleColumns = {
        id: true,
        name: true,
        productCode: true,
        sellingPrice: true,
        purchasePrice: true,
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
    });
    const [error, setError] = useState('');
    const [customTabs, setCustomTabs] = useState([]);
    const [activeTab, setActiveTab] = useState('nomenclature');

    useEffect(() => {
        fetchEquipment();
    }, []);

    // useEffect для сохранения настроек колонок оборудования в localStorage
    useEffect(() => {
        localStorage.setItem('equipmentVisibleColumns', JSON.stringify(equipmentVisibleColumns));
    }, [equipmentVisibleColumns]);

    // useEffect для сохранения порядка колонок оборудования в localStorage
    useEffect(() => {
        localStorage.setItem('equipmentColumnOrder', JSON.stringify(equipmentColumnOrder));
    }, [equipmentColumnOrder]);

    // useEffect для закрытия выпадающего списка оборудования при клике вне его
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
        try {
            const response = await getEquipment();
            setEquipment(response.data);
        } catch (error) {
            console.error('Error fetching equipment:', error);
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
        const tabId = `equipment-detail-${item.id}`;
        openCustomTab(tabId, item.name);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            productCode: item.productCode || '',
            sellingPrice: item.sellingPrice || '',
            purchasePrice: item.purchasePrice || '',
        });
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
            default:
                return '';
        }
    };

    const baseTabs = [
        { id: 'nomenclature', label: 'Номенклатура' }
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



                <div>
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
                                            onClick={() => openCustomTab('create-equipment', 'Создание оборудования')}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
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
                                                    <td key={column} className="px-6 py-4 whitespace-nowrap">
                                                        {getEquipmentCellContent(item, column)}
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {hasPermission('equipment_edit') && (
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="text-blue-600 hover:text-blue-900 mr-2"
                                                        >
                                                            Редактировать
                                                        </button>
                                                    )}
                                                    {hasPermission('equipment_delete') && (
                                                        <button
                                                            onClick={() => handleDelete(item)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Удалить
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Код товара</label>
                                    <input
                                        type="number"
                                        value={formData.productCode}
                                        onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Цена продажи</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.sellingPrice}
                                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Цена закупки</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.purchasePrice}
                                        onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                    >
                                        {editingItem ? 'Обновить' : 'Создать'}
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
                </div>
        </div>
    );
};

export default Equipment;