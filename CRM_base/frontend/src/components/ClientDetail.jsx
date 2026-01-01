import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClient, getClientObjects } from '../services/api';

const ClientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [clientObjects, setClientObjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('Заявки');

    useEffect(() => {
        fetchClient();
        fetchClientObjects();
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
                <button
                    onClick={() => navigate('/dashboard/clients')}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Назад
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                        <p className="text-gray-900 text-lg">{client.name}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900 text-lg">{client.email}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                        <p className="text-gray-900 text-lg">{client.phone}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ответственный</label>
                        <p className="text-gray-900 text-lg">{client.responsible ? client.responsible.fullName || client.responsible.email : 'Не назначен'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Количество заявок</label>
                        <p className="text-gray-900 text-lg">{client.bids?.length || 0}</p>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex space-x-1 mb-4">
                    {['Заявки', 'Оборудование', 'Файлы', 'Объекты', 'Договоры'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-t-lg font-medium transition ${
                                activeTab === tab
                                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
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
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Заголовок</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {client.bids.map((bid) => (
                                                <tr key={bid.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/dashboard/bids/${bid.id}`)}>
                                                    <td className="px-6 py-4 whitespace-nowrap">№ {bid.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{bid.title}</td>
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
                            <h3 className="text-lg font-semibold mb-4">Оборудование</h3>
                            <p className="text-gray-500">В разработке</p>
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
                                                                        {bid.title}
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
        </div>
    );
};

export default ClientDetail;