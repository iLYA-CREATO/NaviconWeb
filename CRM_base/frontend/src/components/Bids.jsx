import { useState, useEffect } from 'react';
import { getBids, createBid, updateBid, deleteBid, getClients } from '../services/api';

const Bids = () => {
    const [bids, setBids] = useState([]);
    const [clients, setClients] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingBid, setEditingBid] = useState(null);
    const [formData, setFormData] = useState({
        clientId: '',
        title: '',
        amount: '',
        status: 'Pending',
        description: '',
    });

    useEffect(() => {
        fetchBids();
        fetchClients();
    }, []);

    const fetchBids = async () => {
        try {
            const response = await getBids();
            setBids(response.data);
        } catch (error) {
            console.error('Error fetching bids:', error);
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
            if (editingBid) {
                await updateBid(editingBid.id, formData);
            } else {
                await createBid(formData);
            }
            fetchBids();
            resetForm();
        } catch (error) {
            console.error('Error saving bid:', error);
        }
    };

    const handleEdit = (bid) => {
        setEditingBid(bid);
        setFormData({
            clientId: bid.clientId,
            title: bid.title,
            amount: bid.amount,
            status: bid.status,
            description: bid.description,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить эту заявку?')) {
            try {
                await deleteBid(id);
                fetchBids();
            } catch (error) {
                console.error('Error deleting bid:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            clientId: '',
            title: '',
            amount: '',
            status: 'Pending',
            description: '',
        });
        setEditingBid(null);
        setShowModal(false);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH',
        }).format(amount);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Заявки</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                    + Добавить заявку
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Клиент</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Заголовок</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {bids.map((bid) => (
                        <tr key={bid.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{bid.clientName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{bid.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap font-semibold">{formatCurrency(bid.amount)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                      bid.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                          bid.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                  }`}>
                    {bid.status}
                  </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="max-w-xs truncate">{bid.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                    onClick={() => handleEdit(bid)}
                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                    Редактировать
                                </button>
                                <button
                                    onClick={() => handleDelete(bid.id)}
                                    className="text-red-600 hover:text-red-900"
                                >
                                    Удалить
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">
                            {editingBid ? 'Редактировать заявку' : 'Добавить новую заявку'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Клиент</label>
                                <select
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Выберите клиента</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.name} - {client.company}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (UAH)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Pending">В ожидании</option>
                                    <option value="Accepted">Принята</option>
                                    <option value="Rejected">Отклонена</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    required
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                >
                                    {editingBid ? 'Обновить' : 'Создать'}
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

export default Bids;