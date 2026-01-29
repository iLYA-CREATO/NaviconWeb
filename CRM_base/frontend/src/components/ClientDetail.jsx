import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClient, getClientObjects, updateClient, getUsers, getEnabledClientAttributes, getClientEquipmentByClient, createClientEquipment, deleteClientEquipment, getEquipment } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

const ClientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [client, setClient] = useState(null);
    const [clientObjects, setClientObjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('Заявки');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        responsibleId: null,
        attributes: {}
    });
    const [users, setUsers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [enabledAttributes, setEnabledAttributes] = useState([]);
    const [clientEquipment, setClientEquipment] = useState([]);
    const [allEquipment, setAllEquipment] = useState([]);
    const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
    const [imei, setImei] = useState('');

    useEffect(() => {
        fetchClient();
        fetchClientObjects();
        fetchUsers();
        fetchEnabledAttributes();
        fetchClientEquipment();
        fetchAllEquipment();
    }, [id]);

    const fetchClient = async () => {
        try {
            const response = await getClient(id);
            setClient(response.data);
        } catch (error) {
            setError('Клиент не найден');
            console.error('Error fetching client:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClientObjects = async () => {
        try {
            const response = await getClientObjects(id);
            setClientObjects(response.data);
        } catch (error) {
            console.error('Error fetching client objects:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await getUsers();
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchEnabledAttributes = async () => {
        try {
            const response = await getEnabledClientAttributes();
            setEnabledAttributes(response.data);
        } catch (error) {
            console.error('Error fetching enabled attributes:', error);
        }
    };

    const fetchClientEquipment = async () => {
        try {
            const response = await getClientEquipmentByClient(id);
            setClientEquipment(response.data);
        } catch (error) {
            console.error('Error fetching client equipment:', error);
        }
    };

    const fetchAllEquipment = async () => {
        try {
            const response = await getEquipment();
            setAllEquipment(response.data);
        } catch (error) {
            console.error('Error fetching all equipment:', error);
        }
    };

    const handleDeleteClientEquipment = async (clientEquipmentId) => {
        if (!confirm('Вы уверены, что хотите удалить это оборудование у клиента?')) return;
        try {
            await deleteClientEquipment(clientEquipmentId);
            fetchClientEquipment();
        } catch (error) {
            console.error('Error deleting client equipment:', error);
            alert('Ошибка при удалении оборудования.');
        }
    };

    const handleAddClientEquipment = async () => {
        if (!selectedEquipmentId) return;
        try {
            await createClientEquipment({
                clientId: parseInt(id),
                equipmentId: parseInt(selectedEquipmentId),
                imei: imei.trim() || null
            });
            setShowAddEquipmentModal(false);
            setSelectedEquipmentId('');
            setImei('');
            fetchClientEquipment();
        } catch (error) {
            console.error('Error adding client equipment:', error);
            alert('Ошибка при добавлении оборудования.');
        }
    };

    const handleEdit = () => {
        const attributes = {};
        enabledAttributes.forEach(attr => {
            const value = client.attributeValues?.find(av => av.attributeId === attr.id)?.value || '';
            if (attr.type === 'multiselect' && value) {
                try {
                    attributes[attr.id] = JSON.parse(value);
                } catch {
                    attributes[attr.id] = [];
                }
            } else {
                attributes[attr.id] = value;
            }
        });
        setFormData({
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            responsibleId: client.responsibleId || null,
            attributes
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            name: '',
            email: '',
            phone: '',
            responsibleId: null,
            attributes: {}
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await updateClient(id, formData);
            setClient(response.data);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating client:', error);
            setError('Ошибка при сохранении изменений');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('attr_')) {
            const attrId = name.replace('attr_', '');
            setFormData(prev => ({
                ...prev,
                attributes: {
                    ...prev.attributes,
                    [attrId]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'responsibleId' ? (value ? parseInt(value) : null) : value
            }));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Загрузка...</div>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/dashboard/clients')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Вернуться к клиентам
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Информация о клиенте</h2>
                <div className="flex space-x-2">
                    {!isEditing ? (
                        <>
                            {hasPermission('client_edit') && (
                                <button
                                    onClick={handleEdit}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Редактировать
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/dashboard/clients')}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Назад
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                            >
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={saving}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                            >
                                Отмена
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={saving}
                            />
                        ) : (
                            <p className="text-gray-900 text-lg">{client.name}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        {isEditing ? (
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={saving}
                            />
                        ) : (
                            <p className="text-gray-900 text-lg">{client.email}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                        {isEditing ? (
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={saving}
                            />
                        ) : (
                            <p className="text-gray-900 text-lg">{client.phone}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ответственный</label>
                        {isEditing ? (
                            <select
                                name="responsibleId"
                                value={formData.responsibleId || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={saving}
                            >
                                <option value="">Не назначен</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.fullName || user.email}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-gray-900 text-lg">{client.responsible ? client.responsible.fullName || client.responsible.email : 'Не назначен'}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Количество заявок</label>
                        <p className="text-gray-900 text-lg">{client.bids?.length || 0}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Количество объектов</label>
                        <p className="text-gray-900 text-lg">{clientObjects.length}</p>
                    </div>
                    {enabledAttributes.map(attr => {
                        const value = client.attributeValues?.find(av => av.attributeId === attr.id)?.value || '';
                        return (
                            <div key={attr.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{attr.name}</label>
                                {isEditing ? (
                                    attr.type === 'select' ? (
                                        <select
                                            name={`attr_${attr.id}`}
                                            value={formData.attributes[attr.id] || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={saving}
                                        >
                                            <option value="">Не выбрано</option>
                                            {attr.options?.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    ) : attr.type === 'multiselect' ? (
                                        <div className="space-y-2">
                                            {attr.options?.map(option => {
                                                const currentValues = formData.attributes[attr.id] ? JSON.parse(formData.attributes[attr.id]) : [];
                                                return (
                                                    <label key={option} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={currentValues.includes(option)}
                                                            onChange={(e) => {
                                                                const newValues = e.target.checked
                                                                    ? [...currentValues, option]
                                                                    : currentValues.filter(v => v !== option);
                                                                handleInputChange({
                                                                    target: {
                                                                        name: `attr_${attr.id}`,
                                                                        value: JSON.stringify(newValues)
                                                                    }
                                                                });
                                                            }}
                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                            disabled={saving}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">{option}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : attr.type === 'image' ? (
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (event) => {
                                                            handleInputChange({
                                                                target: {
                                                                    name: `attr_${attr.id}`,
                                                                    value: event.target.result
                                                                }
                                                            });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                disabled={saving}
                                            />
                                            {formData.attributes[attr.id] && (
                                                <img
                                                    src={formData.attributes[attr.id]}
                                                    alt="Preview"
                                                    className="mt-2 max-w-full h-32 object-cover rounded"
                                                />
                                            )}
                                        </div>
                                    ) : attr.type === 'boolean' ? (
                                        <input
                                            type="checkbox"
                                            name={`attr_${attr.id}`}
                                            checked={formData.attributes[attr.id] === 'true'}
                                            onChange={(e) => handleInputChange({
                                                target: {
                                                    name: `attr_${attr.id}`,
                                                    value: e.target.checked ? 'true' : 'false'
                                                }
                                            })}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                            disabled={saving}
                                        />
                                    ) : attr.type === 'number' ? (
                                        <input
                                            type="number"
                                            name={`attr_${attr.id}`}
                                            value={formData.attributes[attr.id] || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={saving}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            name={`attr_${attr.id}`}
                                            value={formData.attributes[attr.id] || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={saving}
                                        />
                                    )
                                ) : (
                                    attr.type === 'multiselect' ? (
                                        <p className="text-gray-900 text-lg">
                                            {value ? (() => {
                                                try {
                                                    const parsed = JSON.parse(value);
                                                    return Array.isArray(parsed) ? parsed.join(', ') : 'Не указано';
                                                } catch {
                                                    return 'Не указано';
                                                }
                                            })() : 'Не указано'}
                                        </p>
                                    ) : attr.type === 'image' ? (
                                        value ? (
                                            <img
                                                src={value}
                                                alt={attr.name}
                                                className="max-w-full h-32 object-cover rounded"
                                            />
                                        ) : (
                                            <p className="text-gray-900 text-lg">Не указано</p>
                                        )
                                    ) : (
                                        <p className="text-gray-900 text-lg">{value || 'Не указано'}</p>
                                    )
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6">
                <div className="flex space-x-1 mb-4">
                    {[
                        'Заявки',
                        'Оборудование',
                        'Файлы',
                        'Объекты',
                        'Договоры'
                    ].map((tab) => {
                        let displayTab = tab;
                        if (tab === 'Заявки') {
                            displayTab = `Заявки${client.bids && client.bids.length > 0 ? ` (${client.bids.length})` : ''}`;
                        }
                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    if (tab === 'Оборудование') {
                                        console.log('Оборудование tab clicked');
                                    }
                                    setActiveTab(tab);
                                }}
                                className={`px-4 py-2 rounded-t-lg font-medium transition ${
                                    activeTab === tab
                                        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {displayTab}
                            </button>
                        );
                    })}
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    {activeTab === 'Заявки' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Заявки клиента</h3>
                            {client.bids && client.bids.length > 0 ? (
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">№</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">тема</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {client.bids.map((bid) => (
                                                <tr key={bid.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/dashboard/bids/${bid.id}`)}>
                                                    <td className="px-6 py-4 whitespace-nowrap">№ {bid.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{bid.tema}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            bid.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                            bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {bid.status === 'approved' ? 'Одобрена' :
                                                             bid.status === 'pending' ? 'В ожидании' :
                                                             'Отклонена'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="max-w-xs truncate">{bid.description}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500">У клиента нет заявок</p>
                            )}
                        </div>
                    )}
                    {activeTab === 'Оборудование' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Оборудование клиента</h3>
                                {hasPermission('client_equipment_add') && (
                                    <button
                                        onClick={() => setShowAddEquipmentModal(true)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm"
                                    >
                                        Добавить оборудование
                                    </button>
                                )}
                            </div>
                            {clientEquipment.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white border border-gray-300">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-4 py-2 border-b text-left">Оборудование</th>
                                                <th className="px-4 py-2 border-b text-left">Код товара</th>
                                                <th className="px-4 py-2 border-b text-left">IMEI</th>
                                                <th className="px-4 py-2 border-b text-left">Заявка</th>
                                                <th className="px-4 py-2 border-b text-left">Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clientEquipment.map(ce => (
                                                <tr key={ce.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 border-b">{ce.equipment.name}</td>
                                                    <td className="px-4 py-2 border-b">{ce.equipment.productCode || '-'}</td>
                                                    <td className="px-4 py-2 border-b">{ce.imei || '-'}</td>
                                                    <td className="px-4 py-2 border-b">
                                                        {ce.bid ? (
                                                            <button
                                                                onClick={() => navigate(`/dashboard/bids/${ce.bid.id}`)}
                                                                className="text-blue-500 hover:text-blue-700 underline"
                                                            >
                                                                {ce.bid.id}
                                                            </button>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-2 border-b">
                                                        {hasPermission('client_equipment_delete') && (
                                                            <button
                                                                onClick={() => handleDeleteClientEquipment(ce.id)}
                                                                className="text-red-500 hover:text-red-700"
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
                            ) : (
                                <p className="text-gray-500 text-center py-4">Оборудование не добавлено</p>
                            )}
                        </div>
                    )}
                    {activeTab === 'Файлы' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Файлы</h3>
                            <p className="text-gray-500">В разработке</p>
                        </div>
                    )}
                    {activeTab === 'Объекты' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Объекты клиента</h3>
                            {clientObjects && clientObjects.length > 0 ? (
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Марка/Модель</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Гос. Номер</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Заявки</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {clientObjects.map((obj) => (
                                                <tr key={obj.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/dashboard/client-objects/${obj.id}`)}>
                                                    <td className="px-6 py-4 whitespace-nowrap">{obj.brandModel}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{obj.stateNumber}</td>
                                                    <td className="px-6 py-4">
                                                        {obj.bids && obj.bids.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {obj.bids.map((bid) => (
                                                                    <span key={bid.id} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                                                        {bid.tema}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500">Нет заявок</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500">У клиента нет объектов</p>
                            )}
                        </div>
                    )}
                    {activeTab === 'Договоры' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Договоры</h3>
                            <p className="text-gray-500">В разработке</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Equipment Modal */}
            {showAddEquipmentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Добавить оборудование</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Выберите оборудование</label>
                            <select
                                value={selectedEquipmentId}
                                onChange={(e) => setSelectedEquipmentId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Выберите оборудование</option>
                                {allEquipment
                                    .filter(eq => !clientEquipment.some(ce => ce.equipmentId === eq.id))
                                    .map(eq => (
                                        <option key={eq.id} value={eq.id}>
                                            {eq.name} {eq.productCode ? `(${eq.productCode})` : ''}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">IMEI (необязательно)</label>
                            <input
                                type="text"
                                value={imei}
                                onChange={(e) => setImei(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Введите IMEI"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddClientEquipment}
                                disabled={!selectedEquipmentId}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Добавить
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddEquipmentModal(false);
                                    setSelectedEquipmentId('');
                                    setImei('');
                                }}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDetail;