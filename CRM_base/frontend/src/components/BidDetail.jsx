import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBid, getEquipment, assignEquipmentToBid, returnEquipmentFromBid, getClients, updateBid, getClientObjects } from '../services/api';

const BidDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bid, setBid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [availableEquipment, setAvailableEquipment] = useState([]);
    const [selectedAssign, setSelectedAssign] = useState([]);
    const [selectedReturn, setSelectedReturn] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [searchCode, setSearchCode] = useState('');
    const [showChangeClientModal, setShowChangeClientModal] = useState(false);
    const [availableClients, setAvailableClients] = useState([]);
    const [searchClient, setSearchClient] = useState('');
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [availableClientObjects, setAvailableClientObjects] = useState([]);
    const [selectedClientObjectId, setSelectedClientObjectId] = useState('');
    const [showChangeClientObjectModal, setShowChangeClientObjectModal] = useState(false);
    const [searchClientObject, setSearchClientObject] = useState('');

    useEffect(() => {
        fetchBid();
        fetchAvailableEquipment();
        fetchAvailableClients();
    }, [id]);

    useEffect(() => {
        if (bid) {
            fetchAvailableClientObjects();
        }
    }, [bid]);

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

    const fetchAvailableEquipment = async () => {
        try {
            const response = await getEquipment();
            // Group by equipment and filter available items
            const equipmentWithAvailable = response.data.map(eq => ({
                ...eq,
                availableItems: eq.items.filter(item => !item.bidId)
            })).filter(eq => eq.availableItems.length > 0);
            setAvailableEquipment(equipmentWithAvailable);
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    };

    const fetchAvailableClients = async () => {
        try {
            const response = await getClients();
            setAvailableClients(response.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchAvailableClientObjects = async () => {
        if (!bid?.clientId) return;
        try {
            const response = await getClientObjects(bid.clientId);
            // Show all client objects - backend will handle validation for already assigned objects
            setAvailableClientObjects(response.data);
        } catch (error) {
            console.error('Error fetching client objects:', error);
        }
    };

    const handleAssignEquipment = async () => {
        if (selectedAssign.length === 0) return;
        try {
            await assignEquipmentToBid(id, { equipmentItemIds: selectedAssign });
            setSelectedAssign([]);
            setShowAssignModal(false);
            setSearchName('');
            setSearchCode('');
            fetchBid();
            fetchAvailableEquipment();
        } catch (error) {
            console.error('Error assigning equipment:', error);
        }
    };

    const handleReturnEquipment = async () => {
        if (selectedReturn.length === 0) return;
        try {
            await returnEquipmentFromBid(id, { equipmentItemIds: selectedReturn });
            setSelectedReturn([]);
            setShowReturnModal(false);
            fetchBid();
            fetchAvailableEquipment();
        } catch (error) {
            console.error('Error returning equipment:', error);
        }
    };

    const handleChangeClient = async () => {
        if (!selectedClientId) return;
        try {
            await updateBid(id, { clientId: selectedClientId });
            setSelectedClientId(null);
            setShowChangeClientModal(false);
            setSearchClient('');
            fetchBid();
        } catch (error) {
            console.error('Error changing client:', error);
        }
    };

    const handleChangeClientObject = async () => {
        try {
            await updateBid(id, { clientObjectId: selectedClientObjectId || null });
            setSelectedClientObjectId('');
            setShowChangeClientObjectModal(false);
            setSearchClientObject('');
            fetchBid();
            fetchAvailableClientObjects();
        } catch (error) {
            console.error('Error changing client object:', error);
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

    const formattedCreatedAt = bid.createdAt ? new Date(bid.createdAt).toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }) : '';

    return (
        <div className="flex min-h-screen">
            <div className="flex-1 p-4">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => navigate('/dashboard/bids')}
                        className="text-black text-sm px-2 py-1 flex items-center"
                    >
                        <span className="text-blue-500 mr-1 font-bold">←</span> Назад
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Клиент</label>
                            <div className="flex items-center space-x-2">
                                <p
                                    className="text-gray-900 text-lg cursor-pointer hover:text-blue-600 transition"
                                    onClick={() => navigate(`/dashboard/clients/${bid.clientId}`)}
                                >
                                    {bid.clientName}
                                </p>
                                <button
                                    onClick={() => setShowChangeClientModal(true)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                                >
                                    Изменить
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Объект клиента</label>
                            <div className="flex items-center space-x-2">
                                <div className="text-gray-900">
                                    {bid.clientObject ? (
                                        <div>
                                            <p className="font-medium">{bid.clientObject.brandModel}</p>
                                            <p className="text-sm text-gray-600">Гос. номер: {bid.clientObject.stateNumber || 'N/A'}</p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">Не назначен</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowChangeClientObjectModal(true)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                                >
                                    {bid.clientObject ? 'Изменить' : 'Назначить'}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Создатель</label>
                            <p className="text-gray-900 text-lg">{bid.creatorName}</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                        <p className="text-gray-900">{bid.description}</p>
                    </div>
                </div>

                {/* Equipment Section */}
                <div className="bg-white rounded-lg shadow p-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Оборудование</h3>
                        <div className="space-x-2">
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Вставить оборудование
                            </button>
                            <button
                                onClick={() => setShowReturnModal(true)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Вернуть оборудование
                            </button>
                        </div>
                    </div>
                    {bid.equipmentItems && bid.equipmentItems.length > 0 ? (
                        <div className="space-y-2">
                            {bid.equipmentItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{item.equipment.name}</p>
                                        <p className="text-sm text-gray-600">IMEI: {item.imei || 'N/A'}</p>
                                    </div>
                                    <p className="text-sm text-gray-600">Цена: {item.purchasePrice ? `${item.purchasePrice} руб.` : 'N/A'}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">Оборудование не назначено</p>
                    )}
                </div>
            </div>

            <div className="w-64 bg-white shadow p-4 ml-4">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Статус заявки</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Дата и время создания</label>
                    <p className="text-gray-900">{formattedCreatedAt}</p>
                </div>
            </div>


            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <h3 className="text-lg font-semibold mb-4">Вставить оборудование</h3>
                        <div className="mb-4 space-y-2">
                            <input
                                type="text"
                                placeholder="Поиск по названию"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="text"
                                placeholder="Поиск по коду товара"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-4 max-h-60 overflow-y-auto">
                            {availableEquipment
                                .filter(eq =>
                                    eq.name.toLowerCase().includes(searchName.toLowerCase()) &&
                                    (eq.productCode ? eq.productCode.toString().toLowerCase().includes(searchCode.toLowerCase()) : searchCode === '')
                                )
                                .map(eq => (
                                    <div key={eq.id} className="border-b pb-2">
                                        <h4 className="font-semibold text-gray-800">{eq.name} ({eq.productCode})</h4>
                                        <div className="space-y-1 ml-4">
                                            {eq.availableItems.map(item => (
                                                <label key={item.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAssign.includes(item.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedAssign([...selectedAssign, item.id]);
                                                            } else {
                                                                setSelectedAssign(selectedAssign.filter(id => id !== item.id));
                                                            }
                                                        }}
                                                    />
                                                    <span>IMEI: {item.imei || 'N/A'}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSearchName('');
                                    setSearchCode('');
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleAssignEquipment}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                            >
                                Вставить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {showReturnModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Вернуть оборудование</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {bid.equipmentItems && bid.equipmentItems.map(item => (
                                <label key={item.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedReturn.includes(item.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedReturn([...selectedReturn, item.id]);
                                            } else {
                                                setSelectedReturn(selectedReturn.filter(id => id !== item.id));
                                            }
                                        }}
                                    />
                                    <span>{item.equipment.name} - IMEI: {item.imei || 'N/A'}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
                            <button
                                onClick={() => setShowReturnModal(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleReturnEquipment}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                            >
                                Вернуть
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Client Modal */}
            {showChangeClientModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Изменить клиента</h3>
                        <input
                            type="text"
                            placeholder="Поиск клиентов"
                            value={searchClient}
                            onChange={(e) => setSearchClient(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        />
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {availableClients
                                .filter(client => client.name.toLowerCase().includes(searchClient.toLowerCase()))
                                .map(client => (
                                    <div
                                        key={client.id}
                                        onClick={() => setSelectedClientId(client.id)}
                                        className={`p-2 cursor-pointer rounded ${selectedClientId === client.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                                    >
                                        {client.name}
                                    </div>
                                ))}
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
                            <button
                                onClick={() => {
                                    setShowChangeClientModal(false);
                                    setSearchClient('');
                                    setSelectedClientId(null);
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleChangeClient}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                            >
                                Изменить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Client Object Modal */}
            {showChangeClientObjectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">
                            {bid.clientObject ? 'Изменить объект клиента' : 'Назначить объект клиента'}
                        </h3>
                        <input
                            type="text"
                            placeholder="Поиск объектов"
                            value={searchClientObject}
                            onChange={(e) => setSearchClientObject(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        />
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            <div
                                onClick={() => setSelectedClientObjectId('')}
                                className={`p-2 cursor-pointer rounded ${selectedClientObjectId === '' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            >
                                <p className="text-sm text-gray-500">Не назначать объект</p>
                            </div>
                            {availableClientObjects
                                .filter(obj =>
                                    obj.brandModel.toLowerCase().includes(searchClientObject.toLowerCase()) ||
                                    (obj.stateNumber && obj.stateNumber.toLowerCase().includes(searchClientObject.toLowerCase()))
                                )
                                .map(obj => (
                                    <div
                                        key={obj.id}
                                        onClick={() => {
                                            // Only allow selection if object is not assigned to another bid
                                            if (!obj.bid || obj.bid.id === bid.id) {
                                                setSelectedClientObjectId(obj.id);
                                            }
                                        }}
                                        className={`p-2 rounded ${
                                            !obj.bid || obj.bid.id === bid.id
                                                ? selectedClientObjectId === obj.id
                                                    ? 'bg-blue-100 cursor-pointer'
                                                    : 'hover:bg-gray-100 cursor-pointer'
                                                : 'bg-gray-100 cursor-not-allowed opacity-60'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{obj.brandModel}</p>
                                                <p className="text-sm text-gray-600">Гос. номер: {obj.stateNumber || 'N/A'}</p>
                                            </div>
                                            {obj.bid && obj.bid.id !== bid.id && (
                                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                                    Занят другой заявкой
                                                </span>
                                            )}
                                            {obj.bid && obj.bid.id === bid.id && (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                    Текущая заявка
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
                            <button
                                onClick={() => {
                                    setShowChangeClientObjectModal(false);
                                    setSearchClientObject('');
                                    setSelectedClientObjectId('');
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleChangeClientObject}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                            >
                                {bid.clientObject ? 'Изменить' : 'Назначить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BidDetail;