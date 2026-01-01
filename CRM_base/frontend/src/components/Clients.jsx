import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, createClient, getUsers } from '../services/api';

const Clients = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        responsibleId: '',
    });
    const [searchQuery, setSearchQuery] = useState(localStorage.getItem('clientsSearchQuery') || '');
    const [responsibleFilter, setResponsibleFilter] = useState(localStorage.getItem('clientsResponsibleFilter') || '');
    const [visibleFilters, setVisibleFilters] = useState(() => {
        const saved = localStorage.getItem('clientsVisibleFilters');
        return saved ? JSON.parse(saved) : { responsible: false };
    });
    const [showFilterModal, setShowFilterModal] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => fetchClients(searchQuery, responsibleFilter), 300);
        return () => clearTimeout(timeout);
    }, [searchQuery, responsibleFilter]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getUsers();
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    const fetchClients = async (search = '', responsibleId = '') => {
        console.log('Fetching clients...');
        try {
            const response = await getClients(search, responsibleId);
            console.log('Clients response:', response);
            setClients(response.data);
            console.log('Clients set:', response.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
            console.error('Error details:', error.response);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createClient(formData);
            fetchClients();
            resetForm();
        } catch (error) {
            console.error('Error saving client:', error);
        }
    };

    const handleView = (client) => {
        navigate(`/dashboard/clients/${client.id}`);
    };


    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            responsibleId: '',
        });
        setShowModal(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Клиенты</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                    + Добавить клиента
                </button>
            </div>

            <div className="mb-4 flex gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Поиск по имени..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={() => setShowFilterModal(true)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Добавить фильтр
                </button>
            </div>

            {visibleFilters.responsible && (
                <div className="mb-4 flex items-center gap-2">
                    <select
                        value={responsibleFilter}
                        onChange={(e) => setResponsibleFilter(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Все ответственные</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.fullName || user.username}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => {
                            setVisibleFilters({ ...visibleFilters, responsible: false });
                            setResponsibleFilter('');
                        }}
                        className="text-red-500 hover:text-red-700"
                    >
                        X
                    </button>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ответственный</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(client)}>
                            <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{client.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{client.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{client.responsible ? client.responsible.fullName || client.responsible.email : 'Не назначен'}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {showFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Выберите фильтр</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    setVisibleFilters({ ...visibleFilters, responsible: true });
                                    setShowFilterModal(false);
                                }}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                            >
                                Ответственный
                            </button>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">
                            Добавить нового клиента
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ответственный</label>
                                <select
                                    value={formData.responsibleId}
                                    onChange={(e) => setFormData({ ...formData, responsibleId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Не выбран</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.fullName || user.username}
                                        </option>
                                    ))}
                                </select>
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
                </div>
            )}
        </div>
    );
};

export default Clients;