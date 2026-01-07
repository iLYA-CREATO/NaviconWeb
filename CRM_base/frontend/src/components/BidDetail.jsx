/**
 * Компонент BidDetail - отображает детали заявки (bid), позволяет управлять оборудованием,
 * изменять клиента, объект клиента и статус заявки.
 */

// Импорты React хуков для управления состоянием и эффектами
import { useState, useEffect } from 'react';
// Импорты из React Router для получения параметров URL и навигации
import { useParams, useNavigate } from 'react-router-dom';
// Импорты функций API для взаимодействия с сервером
import { getBid, getEquipment, assignEquipmentToBid, returnEquipmentFromBid, getClients, updateBid, getClientObjects, getComments, createComment, getBidSpecifications, createBidSpecification, updateBidSpecification, deleteBidSpecification, getUsers, getSpecifications, getSpecificationCategories, getSpecificationCategoriesTree, createClientObject } from '../services/api';
// Импорт хука аутентификации
import { useAuth } from '../context/AuthContext';

// Основной компонент BidDetail
const BidDetail = () => {
    // Получение ID заявки из параметров URL
    const { id } = useParams();
    // Хук для навигации между страницами
    const navigate = useNavigate();
    // Хук аутентификации
    const { user } = useAuth();
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
    const [searchWarehouse, setSearchWarehouse] = useState('');
    const [showChangeClientModal, setShowChangeClientModal] = useState(false);
    const [availableClients, setAvailableClients] = useState([]);
    const [searchClient, setSearchClient] = useState('');
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [availableClientObjects, setAvailableClientObjects] = useState([]);
    const [selectedClientObjectId, setSelectedClientObjectId] = useState('');
    const [showChangeClientObjectModal, setShowChangeClientObjectModal] = useState(false);
    const [searchClientObject, setSearchClientObject] = useState('');
    const [showCreateClientObjectForm, setShowCreateClientObjectForm] = useState(false);
    const [createClientObjectFormData, setCreateClientObjectFormData] = useState({
        brandModel: '',
        stateNumber: '',
        equipment: '',
    });
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [activeTab, setActiveTab] = useState('comments');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [bidSpecifications, setBidSpecifications] = useState([]);
    const [showAddSpecModal, setShowAddSpecModal] = useState(false);
    const [editingSpec, setEditingSpec] = useState(null);
    const [viewingSpec, setViewingSpec] = useState(null);
    const [showViewSpecModal, setShowViewSpecModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [specifications, setSpecifications] = useState([]);
    const [specCategories, setSpecCategories] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [discount, setDiscount] = useState(0);

    useEffect(() => {
        fetchBid();
        fetchAvailableEquipment();
        fetchAvailableClients();
        fetchComments();
        fetchBidSpecifications();
        fetchUsers();
        fetchSpecifications();
        fetchSpecCategories();
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

    const fetchComments = async () => {
        try {
            const response = await getComments(id);
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const fetchBidSpecifications = async () => {
        try {
            const response = await getBidSpecifications(id);
            setBidSpecifications(response.data);
        } catch (error) {
            console.error('Error fetching bid specifications:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await getUsers();
            setAvailableUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchSpecifications = async () => {
        try {
            const response = await getSpecifications();
            setSpecifications(response.data);
        } catch (error) {
            console.error('Error fetching specifications:', error);
        }
    };

    const fetchSpecCategories = async () => {
        try {
            const response = await getSpecificationCategoriesTree();
            setSpecCategories(response.data);
        } catch (error) {
            console.error('Error fetching specification categories:', error);
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
            setSearchWarehouse('');
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

    const handleCreateClientObject = async (e) => {
        e.preventDefault();
        try {
            await createClientObject({
                clientId: bid.clientId,
                ...createClientObjectFormData,
            });
            setCreateClientObjectFormData({
                brandModel: '',
                stateNumber: '',
                equipment: '',
            });
            setShowCreateClientObjectForm(false);
            fetchAvailableClientObjects();
        } catch (error) {
            console.error('Error creating client object:', error);
            alert('Ошибка при создании объекта обслуживания');
        }
    };

    const handleChangeStatus = async (newStatus) => {
        try {
            await updateBid(id, { status: newStatus });
            setShowStatusModal(false);
            fetchBid();
        } catch (error) {
            console.error('Error changing status:', error);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await createComment(id, { content: newComment });
            setNewComment('');
            fetchComments();
        } catch (error) {
            console.error('Error creating comment:', error);
            alert('Ошибка при добавлении комментария. Возможно, истек срок действия токена.');
        }
    };

    const handleDeleteSpec = async (specId) => {
        if (!confirm('Вы уверены, что хотите удалить эту спецификацию?')) return;
        try {
            await deleteBidSpecification(id, specId);
            fetchBidSpecifications();
        } catch (error) {
            console.error('Error deleting specification:', error);
            alert('Ошибка при удалении спецификации.');
        }
    };

    const handleSaveSpec = async (specData) => {
        try {
            if (editingSpec) {
                await updateBidSpecification(id, editingSpec.id, specData);
            } else {
                await createBidSpecification(id, specData);
            }
            setShowAddSpecModal(false);
            setEditingSpec(null);
            fetchBidSpecifications();
        } catch (error) {
            console.error('Error saving specification:', error);
            alert('Ошибка при сохранении спецификации.');
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
                <div className="flex items-center">
                    <button
                        onClick={() => navigate('/dashboard/bids')}
                        className="w-full text-black text-sm px-2 py-1 flex items-center"
                    >
                        <span className="text-blue-500 mr-1 font-bold">←</span> Назад
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Объект обслуживания</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Заявку составил/ла</label>
                            <p className="text-gray-900 text-lg">{bid.creatorName}</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                        <p className="text-gray-900">{bid.description}</p>
                    </div>
                </div>

                {/* Equipment Section */}
                <div className="bg-white rounded-lg shadow p-4 mt-6">
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
                                        <p className="font-medium">{item.equipment ? item.equipment.name : 'Неизвестное оборудование'}</p>
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

                {/* Tabs Section */}
                <div className="bg-white rounded-lg shadow p-4 mt-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { id: 'comments', label: 'Коментарии' },
                                { id: 'files', label: 'Файлы' },
                                { id: 'nested', label: 'Вложенные заявки' },
                                { id: 'spec', label: 'Спецификация' },
                                { id: 'print', label: 'Печатная форма' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="mt-4">
                        {activeTab === 'comments' && (
                            <div>
                                <div className="mb-4">
                                    <form onSubmit={handleSubmitComment} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Напишите комментарий..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                        >
                                            Добавить
                                        </button>
                                    </form>
                                </div>
                                <div className="space-y-4">
                                    {comments.length > 0 ? (
                                        comments.map(comment => (
                                            <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-medium text-gray-900">{comment.user.fullName}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(comment.createdAt).toLocaleString('ru-RU', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                                <p className="text-gray-700">{comment.content}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">Комментариев пока нет</p>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'files' && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Файлы в разработке</p>
                            </div>
                        )}
                        {activeTab === 'nested' && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Вложенные заявки в разработке</p>
                            </div>
                        )}
                        {activeTab === 'spec' && (
                            <div>
                                <div className="mb-4 flex items-center space-x-4">
                                    <button
                                        onClick={() => setShowAddSpecModal(true)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        Добавить спецификацию
                                    </button>
                                    <div className="flex items-center space-x-2">
                                        <label className="text-sm font-medium text-gray-700">Скидка (%):</label>
                                        <input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                            className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                {bidSpecifications.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="px-4 py-2 border-b text-left">Категория</th>
                                                    <th className="px-4 py-2 border-b text-left">Спецификация</th>
                                                    <th className="px-4 py-2 border-b text-left">Стоимость</th>
                                                    <th className="px-4 py-2 border-b text-left">%</th>
                                                    <th className="px-4 py-2 border-b text-left">Исполнитель</th>
                                                    <th className="px-4 py-2 border-b text-left">Соисполнитель</th>
                                                    <th className="px-4 py-2 border-b text-left">Комментарий</th>
                                                    <th className="px-4 py-2 border-b text-left">Действия</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bidSpecifications.map(spec => (
                                                    <tr
                                                        key={spec.id}
                                                        className="hover:bg-gray-50 cursor-pointer"
                                                        onClick={() => {
                                                            setViewingSpec(spec);
                                                            setShowViewSpecModal(true);
                                                        }}
                                                    >
                                                        <td className="px-4 py-2 border-b">{spec.specification.category.name}</td>
                                                        <td className="px-4 py-2 border-b">{spec.specification.name}</td>
                                                        <td className="px-4 py-2 border-b">{spec.specification.cost} руб.</td>
                                                        <td className="px-4 py-2 border-b">{(spec.specification.cost * discount / 100).toFixed(2)} руб.</td>
                                                        <td className="px-4 py-2 border-b">{spec.executor ? spec.executor.fullName : 'Не назначен'}</td>
                                                        <td className="px-4 py-2 border-b">{spec.coExecutors && spec.coExecutors.length > 0 ? spec.coExecutors.map(ce => ce.fullName).join(', ') : 'Не назначены'}</td>
                                                        <td className="px-4 py-2 border-b">{spec.comment || '-'}</td>
                                                        <td className="px-4 py-2 border-b">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingSpec(spec);
                                                                    setShowAddSpecModal(true);
                                                                }}
                                                                className="text-blue-500 hover:text-blue-700 mr-2"
                                                            >
                                                                Редактировать
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteSpec(spec.id);
                                                                }}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                Удалить
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">Спецификации не добавлены</p>
                                )}

                                {/* Earnings Summary */}
                                {bidSpecifications.length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Сводка заработка</h4>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            {(() => {
                                                const earnings = {};
                                                bidSpecifications.forEach(spec => {
                                                    const cost = spec.specification.cost * (1 + discount / 100);
                                                    const users = [];
                                                    if (spec.executor) users.push(spec.executor);
                                                    if (spec.coExecutors) users.push(...spec.coExecutors);
                                                    const share = cost / users.length;
                                                    users.forEach(user => {
                                                        if (!earnings[user.id]) {
                                                            earnings[user.id] = { user, total: 0 };
                                                        }
                                                        earnings[user.id].total += share;
                                                    });
                                                });
                                                const sortedEarnings = Object.values(earnings).sort((a, b) => b.total - a.total);
                                                return sortedEarnings.length > 0 ? (
                                                    <table className="min-w-full bg-white border border-gray-300">
                                                        <thead>
                                                            <tr className="bg-gray-100">
                                                                <th className="px-4 py-2 border-b text-left">Пользователь</th>
                                                                <th className="px-4 py-2 border-b text-left">Заработок</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {sortedEarnings.map(({ user, total }) => (
                                                                <tr key={user.id} className="hover:bg-gray-50">
                                                                    <td className="px-4 py-2 border-b font-medium">{user.fullName}</td>
                                                                    <td className="px-4 py-2 border-b text-green-600 font-semibold">{total.toFixed(2)} руб.</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <p className="text-gray-500">Нет данных о заработке</p>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'print' && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Печатная форма в разработке</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-64 bg-white shadow pb-4 pt-0 ml-4">
                <div className="mb-4">
                    <div className={`w-full p-2 text-lg text-left text-white cursor-pointer ${
                        bid.status === 'Accepted' ? 'bg-green-500' :
                            bid.status === 'Rejected' ? 'bg-red-500' :
                                'bg-yellow-500'
                    }`} onClick={() => setShowStatusModal(true)}>
                        {bid.status === 'Pending' ? 'В ожидании' :
                         bid.status === 'Accepted' ? 'Принята' :
                         bid.status === 'Rejected' ? 'Отклонена' : bid.status}
                    </div>
                </div>
                <div className='p-2'>
                    <label className="block text-xs text-gray-500 mb-1">Дата и время создания</label>
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
                            <select
                                value={searchWarehouse}
                                onChange={(e) => setSearchWarehouse(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Все склады</option>
                                {Array.from(new Set(availableEquipment.flatMap(eq => eq.availableItems.map(item => item.warehouse?.name)).filter(Boolean))).map(warehouseName => (
                                    <option key={warehouseName} value={warehouseName}>
                                        {warehouseName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-4 max-h-60 overflow-y-auto">
                            {availableEquipment
                                .filter(eq =>
                                    eq.name.toLowerCase().includes(searchName.toLowerCase()) &&
                                    (eq.productCode ? eq.productCode.toString().toLowerCase().includes(searchCode.toLowerCase()) : searchCode === '') &&
                                    (searchWarehouse === '' || eq.availableItems.some(item => item.warehouse?.name === searchWarehouse))
                                )
                                .map(eq => (
                                    <div key={eq.id} className="border-b pb-2">
                                        <h4 className="font-semibold text-gray-800">{eq.name} ({eq.productCode})</h4>
                                        <div className="space-y-1 ml-4">
                                             {eq.availableItems
                                                 .filter(item => searchWarehouse === '' || item.warehouse?.name === searchWarehouse)
                                                 .map(item => (
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
                                                     <span>IMEI: {item.imei || 'N/A'} - Склад: {item.warehouse?.name || 'Не указан'}</span>
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
                                    setSearchWarehouse('');
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
                                    <span>{item.equipment ? item.equipment.name : 'Неизвестное оборудование'} - IMEI: {item.imei || 'N/A'}</span>
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
                            {bid.clientObject ? 'Изменить объект обслуживания' : 'Назначить объект обслуживания'}
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
                                onClick={() => setShowCreateClientObjectForm(!showCreateClientObjectForm)}
                                className="p-2 cursor-pointer rounded bg-green-100 hover:bg-green-200 flex items-center"
                            >
                                <span className="text-green-600 font-medium">+ Создать объект обслуживания</span>
                            </div>
                            {showCreateClientObjectForm && (
                                <form onSubmit={handleCreateClientObject} className="mb-4 p-4 bg-gray-50 rounded-lg mx-2">
                                    <div className="mb-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Марка/Модель</label>
                                        <input
                                            type="text"
                                            value={createClientObjectFormData.brandModel}
                                            onChange={(e) => setCreateClientObjectFormData({ ...createClientObjectFormData, brandModel: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Гос. Номер</label>
                                        <input
                                            type="text"
                                            value={createClientObjectFormData.stateNumber}
                                            onChange={(e) => setCreateClientObjectFormData({ ...createClientObjectFormData, stateNumber: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Оборудование</label>
                                        <textarea
                                            value={createClientObjectFormData.equipment}
                                            onChange={(e) => setCreateClientObjectFormData({ ...createClientObjectFormData, equipment: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="2"
                                            placeholder="Необязательно"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg"
                                        >
                                            Создать
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateClientObjectForm(false);
                                                setCreateClientObjectFormData({
                                                    brandModel: '',
                                                    stateNumber: '',
                                                    equipment: '',
                                                });
                                            }}
                                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg"
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </form>
                            )}
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
                                            setSelectedClientObjectId(obj.id);
                                        }}
                                        className={`p-2 rounded ${
                                            selectedClientObjectId === obj.id
                                                ? 'bg-blue-100 cursor-pointer'
                                                : 'hover:bg-gray-100 cursor-pointer'
                                        }`}
                                    >
                                        <div>
                                            <p className="font-medium">{obj.brandModel}</p>
                                            <p className="text-sm text-gray-600">Гос. номер: {obj.stateNumber || 'N/A'}</p>
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
                                    setShowCreateClientObjectForm(false);
                                    setCreateClientObjectFormData({
                                        brandModel: '',
                                        stateNumber: '',
                                        equipment: '',
                                    });
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

            {/* Status Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Изменить статус</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => handleChangeStatus('Pending')}
                                className="w-full text-left p-2 hover:bg-gray-100"
                            >
                                В ожидании
                            </button>
                            <button
                                onClick={() => handleChangeStatus('Accepted')}
                                className="w-full text-left p-2 hover:bg-gray-100"
                            >
                                Принята
                            </button>
                            <button
                                onClick={() => handleChangeStatus('Rejected')}
                                className="w-full text-left p-2 hover:bg-gray-100"
                            >
                                Отклонена
                            </button>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Specification Modal */}
            {showAddSpecModal && (
                <SpecificationModal
                    isOpen={showAddSpecModal}
                    onClose={() => {
                        setShowAddSpecModal(false);
                        setEditingSpec(null);
                    }}
                    onSave={handleSaveSpec}
                    editingSpec={editingSpec}
                    specCategories={specCategories}
                    specifications={specifications}
                    availableUsers={availableUsers}
                    currentUser={user}
                    expandedCategories={expandedCategories}
                    setExpandedCategories={setExpandedCategories}
                />
            )}

            {/* View Specification Modal */}
            {showViewSpecModal && viewingSpec && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Просмотр спецификации</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                                <p className="text-gray-900">{viewingSpec.specification.category.name}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Спецификация</label>
                                <p className="text-gray-900">{viewingSpec.specification.name}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость</label>
                                <p className="text-gray-900">{viewingSpec.specification.cost} руб.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Исполнитель</label>
                                <p className="text-gray-900">{viewingSpec.executor ? viewingSpec.executor.fullName : 'Не назначен'}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Соисполнители</label>
                                <p className="text-gray-900">
                                    {viewingSpec.coExecutors && viewingSpec.coExecutors.length > 0
                                        ? viewingSpec.coExecutors.map(ce => ce.fullName).join(', ')
                                        : 'Не назначены'
                                    }
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                                <p className="text-gray-900">{viewingSpec.comment || 'Нет комментария'}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Дата создания</label>
                                <p className="text-gray-900">
                                    {new Date(viewingSpec.createdAt).toLocaleString('ru-RU', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={() => {
                                    setShowViewSpecModal(false);
                                    setViewingSpec(null);
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
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

// Specification Modal Component
const SpecificationModal = ({
    isOpen,
    onClose,
    onSave,
    editingSpec,
    specCategories,
    specifications,
    availableUsers,
    currentUser,
    expandedCategories,
    setExpandedCategories
}) => {
    const [selectedSpecId, setSelectedSpecId] = useState(editingSpec?.specificationId || '');
    const [executorId, setExecutorId] = useState(editingSpec?.executorId || currentUser?.id || '');
    const [coExecutorIds, setCoExecutorIds] = useState(editingSpec?.coExecutorIds || []);
    const [selectedCoExecutor, setSelectedCoExecutor] = useState('');
    const [comment, setComment] = useState(editingSpec?.comment || '');

    const selectedSpec = specifications.find(s => s.id === parseInt(selectedSpecId));

    useEffect(() => {
        if (executorId) {
            setCoExecutorIds(coExecutorIds.filter(id => id !== parseInt(executorId)));
        }
    }, [executorId]);

    const addCoExecutor = () => {
        if (selectedCoExecutor && !coExecutorIds.includes(parseInt(selectedCoExecutor))) {
            setCoExecutorIds([...coExecutorIds, parseInt(selectedCoExecutor)]);
            setSelectedCoExecutor('');
        }
    };

    const removeCoExecutor = (id) => {
        setCoExecutorIds(coExecutorIds.filter(coId => coId !== id));
    };

    const handleSave = () => {
        if (!selectedSpecId) {
            alert('Выберите спецификацию');
            return;
        }
        onSave({
            specificationId: selectedSpecId,
            executorId: executorId || null,
            coExecutorIds: coExecutorIds,
            comment: comment.trim() || null,
        });
    };

    const toggleCategory = (categoryId) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const CategoryTree = ({ category, specifications, selectedSpecId, setSelectedSpecId, expandedCategories, toggleCategory, level }) => {
        const categorySpecs = specifications.filter(s => s.categoryId === category.id);
        const hasChildren = category.children && category.children.length > 0;
        const hasSpecs = categorySpecs.length > 0;
        const isExpanded = expandedCategories.has(category.id);

        return (
            <div>
                <div
                    className="flex items-center p-3 bg-gray-50 border-b cursor-pointer hover:bg-gray-100"
                    style={{ paddingLeft: `${12 + level * 20}px` }}
                    onClick={() => toggleCategory(category.id)}
                >
                    {(hasChildren || hasSpecs) && <span className="mr-2">{isExpanded ? '▼' : '▶'}</span>}
                    {!(hasChildren || hasSpecs) && <span className="mr-2 w-4"></span>}
                    <span className="font-medium">{category.name}</span>
                    <span className="ml-auto text-sm text-gray-500">({categorySpecs.length})</span>
                </div>
                {isExpanded && (
                    <div>
                        {categorySpecs.map(spec => (
                            <div
                                key={spec.id}
                                className={`p-2 cursor-pointer hover:bg-blue-50 ${
                                    selectedSpecId === spec.id.toString() ? 'bg-blue-100' : ''
                                }`}
                                style={{ paddingLeft: `${32 + level * 20}px` }}
                                onClick={() => setSelectedSpecId(spec.id.toString())}
                            >
                                <span>{spec.name}</span>
                            </div>
                        ))}
                        {category.children && category.children.map(child => (
                            <CategoryTree
                                key={child.id}
                                category={child}
                                specifications={specifications}
                                selectedSpecId={selectedSpecId}
                                setSelectedSpecId={setSelectedSpecId}
                                expandedCategories={expandedCategories}
                                toggleCategory={toggleCategory}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">
                    {editingSpec ? 'Редактировать спецификацию' : 'Добавить спецификацию'}
                </h3>

                {/* Specification Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Выберите спецификацию</label>
                    <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                        {specCategories.map(category => (
                            <CategoryTree
                                key={category.id}
                                category={category}
                                specifications={specifications}
                                selectedSpecId={selectedSpecId}
                                setSelectedSpecId={setSelectedSpecId}
                                expandedCategories={expandedCategories}
                                toggleCategory={toggleCategory}
                                level={0}
                            />
                        ))}
                    </div>
                </div>

                {/* Cost Display */}
                {selectedSpec && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость</label>
                        <input
                            type="text"
                            value={`${selectedSpec.cost} руб.`}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                    </div>
                )}

                {/* Executor */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Исполнитель</label>
                    <select
                        value={executorId}
                        onChange={(e) => setExecutorId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Не назначен</option>
                        {availableUsers.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.fullName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Co-Executor */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Соисполнители</label>
                    <div className="flex space-x-2 mb-2">
                        <select
                            value={selectedCoExecutor}
                            onChange={(e) => setSelectedCoExecutor(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Выберите соисполнителя</option>
                            {availableUsers.filter(user => user.id !== parseInt(executorId) && !coExecutorIds.includes(user.id)).map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.fullName}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={addCoExecutor}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                            disabled={!selectedCoExecutor}
                        >
                            Добавить
                        </button>
                    </div>
                    {coExecutorIds.length > 0 && (
                        <div className="space-y-1">
                            {coExecutorIds.map(id => {
                                const user = availableUsers.find(u => u.id === id);
                                return (
                                    <div key={id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <span>{user ? user.fullName : 'Неизвестный пользователь'}</span>
                                        <button
                                            onClick={() => removeCoExecutor(id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Comment */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Введите комментарий..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                        {editingSpec ? 'Сохранить' : 'Добавить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BidDetail;