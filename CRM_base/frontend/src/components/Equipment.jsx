import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEquipment, createEquipment, updateEquipment, deleteEquipment, getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/api';
import EquipmentArrival from './EquipmentArrival';

const Equipment = () => {
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [showSupplierForm, setShowSupplierForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [activeTab, setActiveTab] = useState('nomenclature');
    const [customTabs, setCustomTabs] = useState([]);
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

    useEffect(() => {
        fetchEquipment();
        fetchSuppliers();
        setShowForm(false);
        setShowSupplierForm(false);
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateEquipment(editingItem.id, formData);
                fetchEquipment();
                resetForm();
            } else {
                const response = await createEquipment(formData);
                navigate(`/dashboard/equipment/${response.data.id}`);
            }
        } catch (error) {
            console.error('Error saving equipment:', error);
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

    const filteredEquipment = equipment.filter(item =>
        item.id.toString().includes(searchTerm) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.id.toString().includes(supplierSearchTerm) ||
        supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())
    );

    const baseTabs = [
        { id: 'nomenclature', label: 'Номенклатура' },
        { id: 'arrivals', label: 'Приходы' },
        { id: 'expenses', label: 'Расходы' },
        { id: 'reports', label: 'Отчёты' },
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Оборудование</h2>
            </div>

            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">{editingItem ? 'Редактировать оборудование' : 'Добавить новое оборудование'}</h3>
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
                                {editingItem ? 'Сохранить' : 'Создать'}
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

            {!showForm && !showSupplierForm && (
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
                                    onClick={() => setShowForm(!showForm)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    {showForm ? 'Отмена' : 'Новое оборудование'}
                                </button>
                            </div>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Поиск по ID или названию..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Код товара</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Количество</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredEquipment.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleView(item)}>{item.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleView(item)}>{item.name}</td>
                                                <td className="px-6 py-4 cursor-pointer" onClick={() => handleView(item)}>
                                                    <div className="max-w-xs truncate">{item.description || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleView(item)}>{item.productCode || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleView(item)}>{item.quantity}</td>
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
                            <div className="text-center py-8">
                                <p className="text-gray-500">Приходы в разработке</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'create-arrival' && (
                        <EquipmentArrival />
                    )}

                    {activeTab === 'expenses' && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Расходы в разработке</p>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Отчёты в разработке</p>
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
                    {activeTab === 'other' && (
                        <div>
                            <div className="mb-4">
                                <button
                                    onClick={() => openCustomTab('suppliers', 'Поставщики')}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Поставщики
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