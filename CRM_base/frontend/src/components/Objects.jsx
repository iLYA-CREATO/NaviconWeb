import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientObjects, createClientObject, getClients, getUsers } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import Button from './Button';
import Input from './Input';
import Select from './Select';

const Objects = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [objects, setObjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        client: '',
        brandModel: '',
        responsible: '',
    });
    const [filterExceptMode, setFilterExceptMode] = useState({
        client: false,
        brandModel: false,
        responsible: false,
    });
    const [showFilters, setShowFilters] = useState(false);
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
        
        const matchesClient = filters.client === '' ||
            (filterExceptMode.client ? obj.client.id.toString() !== filters.client : obj.client.id.toString() === filters.client);
        const matchesBrandModel = filters.brandModel === '' ||
            (filterExceptMode.brandModel ? !obj.brandModel.toLowerCase().includes(filters.brandModel.toLowerCase()) : obj.brandModel.toLowerCase().includes(filters.brandModel.toLowerCase()));
        const matchesResponsible = filters.responsible === '' ||
            (obj.client.responsible && obj.client.responsible.id.toString() === filters.responsible);
        
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
                        {/* Кнопка создания нового объекта */}
                        <div className="flex justify-between items-center mb-4">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-2 rounded-lg transition ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
                            >
                                {showFilters ? 'Скрыть фильтры' : 'Фильтры'}
                            </button>
                            {hasPermission('client_object_create') && (
                                <button
                                    onClick={() => setShowForm(!showForm)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    {showForm ? 'Отмена' : '+ Добавить объект'}
                                </button>
                            )}
                        </div>
                        {/* Расширенные фильтры */}
                        {showFilters && (
                            <div className="bg-white p-4 rounded-lg mb-4 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Клиент</label>
                                        <div className="flex">
                                            <select
                                                value={filters.client}
                                                onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                                                className={`flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${filterExceptMode.client ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                            >
                                                <option value="">Все клиенты</option>
                                                {clients.map((client) => (
                                                    <option key={client.id} value={client.id}>
                                                        {client.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => setFilterExceptMode({ ...filterExceptMode, client: !filterExceptMode.client })}
                                                className={`px-3 py-2 border border-l-0 rounded-r-lg ${filterExceptMode.client ? 'bg-red-100 text-red-700 border-red-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}
                                                title={filterExceptMode.client ? 'Кроме выбранного' : 'Только выбранный'}
                                            >
                                                {filterExceptMode.client ? '≠' : '='}
                                            </button>
                                        </div>
                                    </div>
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
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Ответственный</label>
                                        <Select
                                            value={filters.responsible}
                                            onChange={(e) => setFilters({ ...filters, responsible: e.target.value })}
                                            options={users.map(user => ({ value: user.id, label: user.fullName || user.username }))}
                                            placeholder="Все ответственные"
                                        />
                                    </div>
                                </div>
                                <Button variant="ghost" onClick={() => {
                                    setFilters({ client: '', brandModel: '', responsible: '' });
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Клиент</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Марка/Модель</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Гос. Номер</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Ответственный</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredObjects.map((obj) => (
                                    <tr key={obj.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(obj)}>
                                        <td className="px-6 py-4 whitespace-nowrap">{obj.client.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{obj.brandModel}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{obj.stateNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {obj.client.responsible ? (
                                                <span className="text-gray-900">{obj.client.responsible.fullName || 'Не назначен'}</span>
                                            ) : (
                                                <span className="text-gray-500">Не назначен</span>
                                            )}
                                        </td>
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

export default Objects;