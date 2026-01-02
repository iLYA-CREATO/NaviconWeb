import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEquipment, createEquipment } from '../services/api';

const Equipment = () => {
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        productCode: '',
        sellingPrice: '',
    });

    useEffect(() => {
        fetchEquipment();
        setShowForm(false);
    }, []);

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
        try {
            const response = await createEquipment(formData);
            navigate(`/dashboard/equipment/${response.data.id}`);
        } catch (error) {
            console.error('Error saving equipment:', error);
        }
    };

    const handleView = (item) => {
        navigate(`/dashboard/equipment/${item.id}`);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            productCode: '',
            sellingPrice: '',
        });
        setShowForm(false);
    };

    const filteredEquipment = equipment.filter(item =>
        item.id.toString().includes(searchTerm) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Оборудование</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        {showForm ? 'Отмена' : '+ Добавить оборудование'}
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/equipment/arrival')}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        Приход
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Цена продажи</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.sellingPrice}
                                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
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
            )}

            {!showForm && (
                <div>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена продажи</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredEquipment.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(item)}>
                                        <td className="px-6 py-4 whitespace-nowrap">{item.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs truncate">{item.description || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{item.productCode || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{item.sellingPrice ? `${item.sellingPrice} ₽` : '-'}</td>
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

export default Equipment;