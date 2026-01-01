import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientObject } from '../services/api';

const ClientObjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [clientObject, setClientObject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('Заявки');

    useEffect(() => {
        fetchClientObject();
    }, [id]);

    const fetchClientObject = async () => {
        try {
            const response = await getClientObject(id);
            setClientObject(response.data);
        } catch (error) {
            setError('Объект не найден');
            console.error('Error fetching client object:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Загрузка...</div>
            </div>
        );
    }

    if (error || !clientObject) {
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
                <h2 className="text-2xl font-bold text-gray-800">Информация об объекте</h2>
                <button
                    onClick={() => navigate(-1)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Назад
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Номер объекта</label>
                        <p className="text-gray-900 text-lg">№ {clientObject.id}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Марка/Модель</label>
                        <p className="text-gray-900 text-lg">{clientObject.brandModel}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Гос. Номер</label>
                        <p className="text-gray-900 text-lg">{clientObject.stateNumber}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Клиент</label>
                        <p className="text-gray-900 text-lg">{clientObject.client.name}</p>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex space-x-1 mb-4">
                    {['Заявки', 'Оборудование'].map((tab) => (
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
                            <h3 className="text-lg font-semibold mb-4">Связанные заявки</h3>
                            {clientObject.bids && clientObject.bids.length > 0 ? (
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
                                            {clientObject.bids.map((bid) => (
                                                <tr key={bid.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/dashboard/bids/${bid.id}`)}>
                                                    <td className="px-6 py-4 whitespace-nowrap">№ {bid.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{bid.title}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            bid.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                                                            bid.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {bid.status === 'Pending' ? 'В ожидании' :
                                                             bid.status === 'Accepted' ? 'Принята' :
                                                             bid.status === 'Rejected' ? 'Отклонена' : bid.status}
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
                                <p className="text-gray-500">Нет связанных заявок</p>
                            )}
                        </div>
                    )}
                    {activeTab === 'Оборудование' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Оборудование</h3>
                            <p className="text-center text-gray-500">Пока в разработке</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientObjectDetail;