import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEquipmentById } from '../services/api';

const EquipmentDetail = ({ id: propId, closeTab }) => {
    const { id: paramId } = useParams();
    const navigate = useNavigate();
    const id = propId || paramId;
    const [equipment, setEquipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetchEquipment();
        }
    }, [id]);

    const fetchEquipment = async () => {
        try {
            const response = await getEquipmentById(id);
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
                    onClick={closeTab || (() => navigate('/dashboard/equipment'))}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Цена продажи</label>
                        <p className="text-gray-900 text-lg">{equipment.sellingPrice ? `${equipment.sellingPrice} ₽` : '-'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Цена закупки</label>
                        <p className="text-gray-900 text-lg">{equipment.purchasePrice ? `${equipment.purchasePrice} ₽` : '-'}</p>
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
            </div>
        </div>
    );
};

export default EquipmentDetail;