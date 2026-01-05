import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getEquipment, createEquipmentItems, getSuppliers, getArrivalDocuments, getWarehouses } from '../services/api';

const EquipmentArrival = ({ openCustomTab, closeTab }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [equipment, setEquipment] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [items, setItems] = useState([{ equipmentId: '', imei: '', purchasePrice: '' }]);
    const [arrivalDocuments, setArrivalDocuments] = useState([]);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const fetchEquipment = async () => {
        try {
            const response = await getEquipment();
            setEquipment(response.data);
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    };

    const fetchSuppliers = useCallback(async () => {
        try {
            const response = await getSuppliers();
            setSuppliers(response.data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    }, []);

    const fetchWarehouses = useCallback(async () => {
        try {
            const response = await getWarehouses();
            setWarehouses(response.data);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        }
    }, []);

    const fetchArrivalDocuments = useCallback(async () => {
        try {
            const response = await getArrivalDocuments();
            setArrivalDocuments(response.data);
        } catch (error) {
            console.error('Error fetching arrival documents:', error);
        }
    }, []);

    useEffect(() => {
        fetchEquipment();
        fetchSuppliers();
        fetchWarehouses();
        fetchArrivalDocuments();
    }, []);

    // Handle new supplier from creation
    useEffect(() => {
        if (location.state?.newSupplier) {
            fetchSuppliers(); // Refresh suppliers list
            setSelectedSupplier(location.state.newSupplier.id);
            // Clear the state to avoid re-setting on re-render
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, fetchSuppliers]);

    const addItem = () => {
        setItems([...items, { equipmentId: '', imei: '', purchasePrice: '' }]);
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
            const validItems = items.filter(item => item.purchasePrice && item.equipmentId);
            // Group items by equipmentId and create separate API calls
            const equipmentGroups = {};
            validItems.forEach(item => {
                if (!equipmentGroups[item.equipmentId]) {
                    equipmentGroups[item.equipmentId] = [];
                }
                equipmentGroups[item.equipmentId].push({
                    imei: item.imei,
                    purchasePrice: item.purchasePrice
                });
            });

            // Create items for each equipment type
            const promises = Object.entries(equipmentGroups).map(([equipmentId, items]) =>
                createEquipmentItems(equipmentId, { items, supplierId: selectedSupplier, warehouseId: selectedWarehouse })
            );

            await Promise.all(promises);
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
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Выберите склад</label>
                            <select
                                value={selectedWarehouse}
                                onChange={(e) => setSelectedWarehouse(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Выберите склад</option>
                                {warehouses.map((warehouse) => (
                                    <option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Выберите поставщика</label>
                            <select
                                  value={selectedSupplier}
                                  onChange={(e) => {
                                      if (e.target.value === 'create-new') {
                                          openCustomTab('create-supplier', 'Создание поставщика');
                                      } else {
                                          setSelectedSupplier(e.target.value);
                                      }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                              >
                                  <option value="">Выберите поставщика</option>
                                  <option value="create-new" className="font-medium text-green-600">+ Создать нового поставщика</option>
                                  {suppliers.map((supplier) => (
                                      <option key={supplier.id} value={supplier.id}>
                                          {supplier.name}
                                      </option>
                                  ))}
                              </select>
                        </div>
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

                        <div className="bg-white border rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Оборудование</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IMEI</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена закупки</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={item.equipmentId}
                                                    onChange={(e) => updateItem(index, 'equipmentId', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                >
                                                    <option value="">Выберите оборудование</option>
                                                    {equipment.map((eq) => (
                                                        <option key={eq.id} value={eq.id}>
                                                            {eq.name} (Код: {eq.productCode})
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    value={item.imei}
                                                    onChange={(e) => updateItem(index, 'imei', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Опционально"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.purchasePrice}
                                                    onChange={(e) => updateItem(index, 'purchasePrice', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Обязательно"
                                                    required
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
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
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button
                            type="submit"
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
                        >
                            Создать накладную
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCancelModal(true)}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                        >
                            Отмена
                        </button>
                    </div>
                </form>
            </div>

            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg min-w-80">
                        <h3 className="text-lg font-medium mb-4">Вы уверены?</h3>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    closeTab();
                                }}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg text-lg"
                            >
                                Продолжить
                            </button>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-4 rounded-lg text-lg"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentArrival;