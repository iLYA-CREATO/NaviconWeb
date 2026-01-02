import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEquipmentItem } from '../services/api';

const EquipmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEquipment();
    }, [id]);

    const fetchEquipment = async () => {
        try {
            const response = await getEquipmentItem(id);
            setEquipment(response.data);
        } catch (error) {
            setError('Оборудование не найдено');
            console.error('Error fetching equipment:', error);
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

    if (error || !equipment) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/dashboard/equipment')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Вернуться к оборудованию
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Информация об оборудовании</h2>
                <button
                    onClick={() => navigate('/dashboard/equipment')}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Назад
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                        <p className="text-gray-900 text-lg">{equipment.id}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                        <p className="text-gray-900 text-lg">{equipment.name}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Код товара</label>
                        <p className="text-gray-900 text-lg">{equipment.productCode || '-'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
                        <p className="text-gray-900 text-lg">{equipment.quantity}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Цена продажи</label>
                        <p className="text-gray-900 text-lg">{equipment.sellingPrice ? `${equipment.sellingPrice} ₽` : '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                        <p className="text-gray-900">{equipment.description || '-'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Дата создания</label>
                        <p className="text-gray-900 text-lg">{new Date(equipment.createdAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                </div>

                {equipment.items && equipment.items.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-xl font-bold mb-4">Элементы оборудования</h3>
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IMEI</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена закупки</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата добавления</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {equipment.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{item.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{item.imei || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{item.purchasePrice ? `${item.purchasePrice} ₽` : '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString('ru-RU')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EquipmentDetail;