import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBid } from '../services/api';

const BidDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bid, setBid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBid();
    }, [id]);

    const fetchBid = async () => {
        try {
            const response = await getBid(id);
            setBid(response.data);
        } catch (error) {
            setError('Заявка не найдена');
            console.error('Error fetching bid:', error);
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

    if (error || !bid) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/dashboard/bids')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Вернуться к заявкам
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Информация о заявке</h2>
                <button
                    onClick={() => navigate('/dashboard/bids')}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Назад
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Номер заявки</label>
                        <p className="text-gray-900 text-lg">№ {bid.id}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
                        <p className="text-gray-900 text-lg">{bid.title}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Сумма</label>
                        <p className="text-gray-900 text-lg font-semibold">
                            {new Intl.NumberFormat('ru-RU', {
                                style: 'currency',
                                currency: 'RUB',
                            }).format(bid.amount)}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                        <span className={`px-2 py-1 text-sm rounded-full ${
                            bid.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                                bid.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                        }`}>
                            {bid.status === 'Pending' ? 'В ожидании' :
                             bid.status === 'Accepted' ? 'Принята' :
                             bid.status === 'Rejected' ? 'Отклонена' : bid.status}
                        </span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Клиент</label>
                        <p className="text-gray-900 text-lg">{bid.clientName}</p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                        <p className="text-gray-900">{bid.description}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BidDetail;