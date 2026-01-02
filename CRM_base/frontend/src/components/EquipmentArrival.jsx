import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEquipment, createEquipmentItems } from '../services/api';

const EquipmentArrival = () => {
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState('');
    const [items, setItems] = useState([{ imei: '', purchasePrice: '' }]);

    useEffect(() => {
        fetchEquipment();
    }, []);

    const fetchEquipment = async () => {
        try {
            const response = await getEquipment();
            setEquipment(response.data);
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    };

    const addItem = () => {
        setItems([...items, { imei: '', purchasePrice: '' }]);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const validItems = items.filter(item => item.purchasePrice);
            await createEquipmentItems(selectedEquipment, { items: validItems });
            navigate('/dashboard/equipment');
        } catch (error) {
            console.error('Error adding items:', error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Приход оборудования</h2>
                <button
                    onClick={() => navigate('/dashboard/equipment')}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Назад
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Выберите оборудование</label>
                        <select
                            value={selectedEquipment}
                            onChange={(e) => setSelectedEquipment(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Выберите тип оборудования</option>
                            {equipment.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} (Код: {item.productCode})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Элементы оборудования</h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                            >
                                + Добавить элемент
                            </button>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} className="flex gap-4 items-end mb-4 p-4 border rounded-lg">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">IMEI</label>
                                    <input
                                        type="text"
                                        value={item.imei}
                                        onChange={(e) => updateItem(index, 'imei', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Опционально"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Цена закупки</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.purchasePrice}
                                        onChange={(e) => updateItem(index, 'purchasePrice', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Обязательно"
                                        required
                                    />
                                </div>
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                                    >
                                        Удалить
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button
                            type="submit"
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
                        >
                            Добавить оборудование
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard/equipment')}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                        >
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EquipmentArrival;