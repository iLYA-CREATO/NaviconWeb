import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBids, createBid, getClients, getClientObjects } from '../services/api';

const Bids = () => {
    const navigate = useNavigate();
    const [bids, setBids] = useState([]);
    const [clients, setClients] = useState([]);
    const [clientObjects, setClientObjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        clientId: '',
        title: '',
        status: 'Pending',
        description: '',
        clientObjectId: '',
    });

    useEffect(() => {
        fetchBids();
        fetchClients();
        setShowForm(false);
    }, []);

    useEffect(() => {
        fetchClientObjects(formData.clientId);
        // Reset selected client object when client changes
        setFormData(prev => ({ ...prev, clientObjectId: '' }));
    }, [formData.clientId]);

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

    const fetchClientObjects = async (clientId) => {
        if (!clientId) {
            setClientObjects([]);
            return;
        }
        try {
            const response = await getClientObjects(clientId);
            // Filter to show only objects not assigned to any bid
            const availableObjects = response.data.filter(obj => !obj.bid);
            setClientObjects(availableObjects);
        } catch (error) {
            console.error('Error fetching client objects:', error);
            setClientObjects([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await createBid(formData);
            navigate(`/dashboard/bids/${response.data.id}`);
        } catch (error) {
            console.error('Error saving bid:', error);
        }
    };

    const handleView = (bid) => {
        navigate(`/dashboard/bids/${bid.id}`);
    };

    const resetForm = () => {
        setFormData({
            clientId: '',
            title: '',
            status: 'Pending',
            description: '',
            clientObjectId: '',
        });
        setClientObjects([]);
        setShowForm(false);
    };

    const filteredBids = bids.filter(bid =>
        bid.id.toString().includes(searchTerm) ||
        bid.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Заявки</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                    {showForm ? 'Отмена' : '+ Добавить заявку'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">Добавить новую заявку</h3>
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
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Объект клиента</label>
                            <select
                                value={formData.clientObjectId}
                                onChange={(e) => setFormData({ ...formData, clientObjectId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">
                                    {formData.clientId ? 'Выберите объект (необязательно)' : 'Сначала выберите клиента'}
                                </option>
                                {clientObjects.map((obj) => (
                                    <option key={obj.id} value={obj.id}>
                                        {obj.brandModel} {obj.stateNumber ? `(${obj.stateNumber})` : ''}
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
                            placeholder="Поиск по номеру заявки или клиенту..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">№</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Клиент</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Заголовок</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredBids.map((bid) => (
                            <tr key={bid.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(bid)}>
                                <td className="px-6 py-4 whitespace-nowrap">№ {bid.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{bid.clientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{bid.title}</td>
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

export default Bids;