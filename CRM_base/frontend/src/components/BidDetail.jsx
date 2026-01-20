/**
 * Компонент BidDetail - отображает детали заявки (bid), позволяет
 * изменять клиента, объект клиента и статус заявки.
 */

// Импорты React хуков для управления состоянием и эффектами
import { useState, useEffect } from 'react';
// Импорты из React Router для получения параметров URL и навигации
import { useParams, useNavigate } from 'react-router-dom';
// Импорты функций API для взаимодействия с сервером
import { getBid, getClients, updateBid, getClientObjects, getComments, createComment, updateComment, deleteComment, getBidSpecifications, createBidSpecification, updateBidSpecification, deleteBidSpecification, getUsers, getSpecifications, getSpecificationCategories, getSpecificationCategoriesTree, getBidHistory, getBidStatuses, getEquipment, getBidEquipment, createBidEquipment, updateBidEquipment, deleteBidEquipment } from '../services/api';
// Импорт хука аутентификации
import { useAuth } from '../context/AuthContext';
// Импорт хука для проверки разрешений
import { usePermissions } from '../hooks/usePermissions';
// Импорт компонента карты
import MapModal from './MapModal';

// Основной компонент BidDetail
const BidDetail = () => {
    // Получение ID заявки из параметров URL
    const { id } = useParams();
    // Хук для навигации между страницами
    const navigate = useNavigate();
    // Хук аутентификации
    const { user } = useAuth();
    // Хук для проверки разрешений
    const { hasPermission } = usePermissions();
    const [bid, setBid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [activeTab, setActiveTab] = useState('comments');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');
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
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [history, setHistory] = useState([]);
    const [updNumber, setUpdNumber] = useState('');
    const [updDate, setUpdDate] = useState('');
    const [editingUpd, setEditingUpd] = useState(false);
    const [contract, setContract] = useState('');
    const [editingContract, setEditingContract] = useState(false);
    const [workAddress, setWorkAddress] = useState('');
    const [editingWorkAddress, setEditingWorkAddress] = useState(false);
    const [bidStatuses, setBidStatuses] = useState([]);
    const [bidEquipment, setBidEquipment] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState(null);
    const [showMapModal, setShowMapModal] = useState(false);

    useEffect(() => {
        fetchBid();
        fetchComments();
        fetchBidSpecifications();
        fetchBidEquipment();
        fetchEquipment();
        fetchUsers();
        fetchSpecifications();
        fetchSpecCategories();
        fetchHistory();
    }, [id]);

    useEffect(() => {
        if (bid) {
            fetchBidStatuses();
        }
    }, [bid]);
    useEffect(() => {
        if (bid) {
            setUpdNumber(bid.updNumber || '');
            setUpdDate(bid.updDate ? new Date(bid.updDate).toISOString().split('T')[0] : '');
            setContract(bid.contract || '');
            setWorkAddress(bid.workAddress || '');
        }
    }, [bid]);


    const fetchBid = async () => {
        try {
            const response = await getBid(id);
            setBid(response.data);
            // Логируем данные заявки при открытии
            console.log('Открытие заявки ID:', id);
            console.log('Данные заявки:', {
                clientId: response.data.clientId,
                clientName: response.data.clientName,
                tema: response.data.title,
                amount: response.data.amount,
                status: response.data.status,
                description: response.data.description,
                clientObjectId: response.data.clientObjectId,
                updNumber: response.data.updNumber,
                updDate: response.data.updDate,
                contract: response.data.contract,
                bidTypeName: response.data.bidType ? response.data.bidType.name : 'Не указан',
                creatorName: response.data.creatorName,
                createdAt: response.data.createdAt,
                updatedAt: response.data.updatedAt,
            });
        } catch (error) {
            setError('Заявка не найдена');
            console.error('Error fetching bid:', error);
        } finally {
            setLoading(false);
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

    const fetchBidEquipment = async () => {
        try {
            const response = await getBidEquipment(id);
            setBidEquipment(response.data);
        } catch (error) {
            console.error('Error fetching bid equipment:', error);
        }
    };

    const fetchEquipment = async () => {
        try {
            const response = await getEquipment();
            setEquipment(response.data);
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await getBidHistory(id);
            setHistory(response.data);
        } catch (error) {
            console.error('Error fetching bid history:', error);
        }
    };

    const fetchBidStatuses = async () => {
        if (bid && bid.bidTypeId) {
            try {
                const response = await getBidStatuses(bid.bidTypeId);
                setBidStatuses(response.data);
            } catch (error) {
                console.error('Error fetching bid statuses:', error);
            }
        }
    };





    const handleChangeStatus = async (newStatus) => {
        try {
            await updateBid(id, { status: newStatus });
            setShowStatusModal(false);
            fetchBid();
            fetchHistory();
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
            fetchHistory();
        } catch (error) {
            console.error('Error creating comment:', error);
            alert('Ошибка при добавлении комментария. Возможно, истек срок действия токена.');
        }
    };

    const handleEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditingCommentContent(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditingCommentContent('');
    };

    const handleSaveEdit = async () => {
        if (!editingCommentContent.trim()) return;
        try {
            await updateComment(id, editingCommentId, { content: editingCommentContent.trim() });
            setEditingCommentId(null);
            setEditingCommentContent('');
            fetchComments();
            fetchHistory();
        } catch (error) {
            console.error('Error updating comment:', error);
            alert('Ошибка при обновлении комментария. Возможно, истек срок действия токена.');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) return;
        try {
            await deleteComment(id, commentId);
            fetchComments();
            fetchHistory();
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Ошибка при удалении комментария. Возможно, истек срок действия токена.');
        }
    };

    const handleDeleteSpec = async (specId) => {
        if (!confirm('Вы уверены, что хотите удалить эту спецификацию?')) return;
        try {
            await deleteBidSpecification(id, specId);
            fetchBidSpecifications();
            fetchHistory();
        } catch (error) {
            console.error('Error deleting specification:', error);
            alert('Ошибка при удалении спецификации.');
        }
    };

    const handleDeleteEquipment = async (equipmentId) => {
        if (!confirm('Вы уверены, что хотите удалить это оборудование?')) return;
        try {
            await deleteBidEquipment(equipmentId);
            fetchBidEquipment();
            fetchHistory();
        } catch (error) {
            console.error('Error deleting equipment:', error);
            alert('Ошибка при удалении оборудования.');
        }
    };

    const handleUpdateBid = async (updates) => {
        try {
            await updateBid(id, updates);
            fetchBid();
            fetchHistory();
        } catch (error) {
            console.error('Error updating bid:', error);
            alert('Ошибка при обновлении заявки.');
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
            fetchHistory();
        } catch (error) {
            console.error('Error saving specification:', error);
            alert('Ошибка при сохранении спецификации.');
        }
    };

    const handleSaveEquipment = async (equipmentData) => {
        try {
            if (editingEquipment) {
                await updateBidEquipment(editingEquipment.id, equipmentData);
            } else {
                await createBidEquipment({ ...equipmentData, bidId: id });
            }
            setShowAddEquipmentModal(false);
            setEditingEquipment(null);
            fetchBidEquipment();
            fetchHistory();
        } catch (error) {
            console.error('Error saving equipment:', error);
            alert('Ошибка при сохранении оборудования.');
        }
    };

    // Обработчик выбора адреса с карты
    const handleAddressSelect = (address) => {
        setWorkAddress(address);
        handleUpdateBid({ workAddress: address });
        setEditingWorkAddress(false);
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
                            <p
                                className="text-gray-900 text-lg cursor-pointer hover:text-blue-600 transition"
                                onClick={() => navigate(`/dashboard/clients/${bid.clientId}`)}
                            >
                                {bid.clientName}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Объект обслуживания</label>
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
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Заявку составил/ла</label>
                            <p className="text-gray-900 text-lg">{bid.creatorName}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">№, дата УПД</label>
                            <p className="text-gray-900">{updNumber || 'Не указан'} {updDate ? new Date(updDate).toLocaleDateString('ru-RU') : ''}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Договор</label>
                            {editingContract ? (
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        type="text"
                                        value={contract}
                                        onChange={(e) => setContract(e.target.value)}
                                        className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Номер договора"
                                    />
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => {
                                                handleUpdateBid({ contract });
                                                setEditingContract(false);
                                            }}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg whitespace-nowrap"
                                        >
                                            Сохранить
                                        </button>
                                        <button
                                            onClick={() => {
                                                setContract(bid.contract || '');
                                                setEditingContract(false);
                                            }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg whitespace-nowrap"
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <p className="text-gray-900">{contract || 'Не указан'}</p>
                                    <button
                                        onClick={() => setEditingContract(true)}
                                        className="text-blue-500 hover:text-blue-700"
                                    >
                                        ✏️
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Адрес проведения работ</label>
                            {editingWorkAddress ? (
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        type="text"
                                        value={workAddress}
                                        onChange={(e) => setWorkAddress(e.target.value)}
                                        className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Введите адрес проведения работ"
                                    />
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setShowMapModal(true)}
                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg whitespace-nowrap"
                                            title="Выбрать на карте"
                                        >
                                            🗺️
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleUpdateBid({ workAddress });
                                                setEditingWorkAddress(false);
                                            }}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg whitespace-nowrap"
                                        >
                                            Сохранить
                                        </button>
                                        <button
                                            onClick={() => {
                                                setWorkAddress(bid.workAddress || '');
                                                setEditingWorkAddress(false);
                                            }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg whitespace-nowrap"
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <p className="text-gray-900">{workAddress || 'Не указан'}</p>
                                    <button
                                        onClick={() => setEditingWorkAddress(true)}
                                        className="text-blue-500 hover:text-blue-700"
                                    >
                                        ✏️
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                        <p className="text-gray-900">{bid.description}</p>
                    </div>
                </div>

                {/* Equipment Section */}
                <div className="bg-white rounded-lg shadow p-4 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Оборудование</h3>
                        {hasPermission('bid_equipment_add') && (
                            <button
                                onClick={() => setShowAddEquipmentModal(true)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm"
                            >
                                Добавить оборудование
                            </button>
                        )}
                    </div>
                    {bidEquipment.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 border-b text-left">Оборудование</th>
                                        <th className="px-4 py-2 border-b text-left">IMEI</th>
                                        <th className="px-4 py-2 border-b text-left">Количество</th>
                                        <th className="px-4 py-2 border-b text-left">Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bidEquipment.map(eq => (
                                        <tr
                                            key={eq.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-2 border-b">{eq.equipment.name}</td>
                                            <td className="px-4 py-2 border-b">{eq.imei || '-'}</td>
                                            <td className="px-4 py-2 border-b">{eq.quantity}</td>
                                            <td className="px-4 py-2 border-b">
                                                <button
                                                    onClick={() => {
                                                        setEditingEquipment(eq);
                                                        setShowAddEquipmentModal(true);
                                                    }}
                                                    className="text-blue-500 hover:text-blue-700 mr-2"
                                                >
                                                    Редактировать
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEquipment(eq.id)}
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
                        <p className="text-gray-500 text-center py-4">Оборудование не добавлено</p>
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
                                                     <div className="flex items-center space-x-2">
                                                         <p className="text-sm text-gray-500">
                                                             {new Date(comment.createdAt).toLocaleString('ru-RU', {
                                                                 year: 'numeric',
                                                                 month: 'short',
                                                                 day: '2-digit',
                                                                 hour: '2-digit',
                                                                 minute: '2-digit'
                                                             })}
                                                         </p>
                                                         {user && comment.userId === user.id && (
                                                             <div className="flex space-x-1">
                                                                 <button
                                                                     onClick={() => handleEditComment(comment)}
                                                                     className="text-blue-500 hover:text-blue-700 text-sm"
                                                                     title="Редактировать"
                                                                 >
                                                                     ✏️
                                                                 </button>
                                                                 <button
                                                                     onClick={() => handleDeleteComment(comment.id)}
                                                                     className="text-red-500 hover:text-red-700 text-sm"
                                                                     title="Удалить"
                                                                 >
                                                                     🗑️
                                                                 </button>
                                                             </div>
                                                         )}
                                                     </div>
                                                 </div>
                                                 {editingCommentId === comment.id ? (
                                                     <div className="space-y-2">
                                                         <textarea
                                                             value={editingCommentContent}
                                                             onChange={(e) => setEditingCommentContent(e.target.value)}
                                                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                             rows={3}
                                                         />
                                                         <div className="flex space-x-2">
                                                             <button
                                                                 onClick={handleSaveEdit}
                                                                 className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                                             >
                                                                 Сохранить
                                                             </button>
                                                             <button
                                                                 onClick={handleCancelEdit}
                                                                 className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                                                             >
                                                                 Отмена
                                                             </button>
                                                         </div>
                                                     </div>
                                                 ) : (
                                                     <p className="text-gray-700">{comment.content}</p>
                                                 )}
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
                                                    <th className="px-4 py-2 border-b text-left">Исполнители</th>
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
                                                        <td className="px-4 py-2 border-b">{spec.executors && spec.executors.length > 0 ? spec.executors.map(e => e.fullName).join(', ') : 'Не назначены'}</td>
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
                                                    const users = spec.executors || [];
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
                        bid.status === 'Закрыта' ? 'bg-red-500' :
                        bid.status === 'Открыта' ? 'bg-yellow-500' :
                            'bg-blue-500'
                    }`} onClick={() => setShowStatusModal(true)}>
                        {bid.status}
                    </div>
                </div>
                <div className='p-2'>
                    <label className="block text-xs text-gray-500 mb-1">Дата и время создания</label>
                    <p className="text-gray-900">{formattedCreatedAt}</p>
                </div>
                <div className='p-2'>
                    <label className="block text-xs text-gray-500 mb-1">Тип заявки</label>
                    <p className="text-gray-900">{bid.bidType ? bid.bidType.name : 'Не указан'}</p>
                </div>
                <div className='p-2'>
                    <label className="block text-xs text-gray-500 mb-1">Ответственный</label>
                    <p className="text-gray-900">{bid.bidTypeResponsibleName || 'Не указан'}</p>
                </div>
                <div className='p-2'>
                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        История
                    </button>
                </div>
            </div>






            {/* Status Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Изменить статус</h3>
                        <div className="space-y-2">
                            {bidStatuses.map(status => (
                                <button
                                    key={status.position}
                                    onClick={() => handleChangeStatus(status.name)}
                                    className={`w-full text-left p-2 hover:bg-gray-100 ${
                                        bid.status === status.name ? 'bg-blue-100' : ''
                                    }`}
                                    disabled={bid.status === status.name}
                                >
                                    {status.name}
                                </button>
                            ))}
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

            {/* Add/Edit Equipment Modal */}
            {showAddEquipmentModal && (
                <EquipmentModal
                    isOpen={showAddEquipmentModal}
                    onClose={() => {
                        setShowAddEquipmentModal(false);
                        setEditingEquipment(null);
                    }}
                    onSave={handleSaveEquipment}
                    editingEquipment={editingEquipment}
                    equipment={equipment}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Исполнители</label>
                                <p className="text-gray-900">
                                    {viewingSpec.executors && viewingSpec.executors.length > 0
                                        ? viewingSpec.executors.map(e => e.fullName).join(', ')
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

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">История заявки</h3>
                        {history.length > 0 ? (
                            <div className="space-y-4">
                                {history.map((item, index) => (
                                    <div key={index} className="border-b pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.action}</p>
                                                <p className="text-sm text-gray-600">Кто: {item.user}</p>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {new Date(item.date).toLocaleString('ru-RU', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">История пуста</p>
                        )}
                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={() => setShowHistoryModal(false)}
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

// Компонент модального окна спецификаций
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
    const [executorIds, setExecutorIds] = useState(editingSpec?.executorIds || []);
    const [selectedExecutor, setSelectedExecutor] = useState('');
    const [comment, setComment] = useState(editingSpec?.comment || '');

    const selectedSpec = specifications.find(s => s.id === parseInt(selectedSpecId));


    const addExecutor = () => {
        if (selectedExecutor && !executorIds.includes(parseInt(selectedExecutor))) {
            setExecutorIds([...executorIds, parseInt(selectedExecutor)]);
            setSelectedExecutor('');
        }
    };

    const removeExecutor = (id) => {
        setExecutorIds(executorIds.filter(eId => eId !== id));
    };

    const handleSave = () => {
        if (!selectedSpecId) {
            alert('Выберите спецификацию');
            return;
        }
        onSave({
            specificationId: selectedSpecId,
            executorIds: executorIds,
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

                {/* Executors */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Исполнители</label>
                    <div className="flex space-x-2 mb-2">
                        <select
                            value={selectedExecutor}
                            onChange={(e) => setSelectedExecutor(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Выберите исполнителя</option>
                            {availableUsers.filter(user => !executorIds.includes(user.id)).map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.fullName}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={addExecutor}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                            disabled={!selectedExecutor}
                        >
                            Добавить
                        </button>
                    </div>
                    {executorIds.length > 0 && (
                        <div className="space-y-1">
                            {executorIds.map(id => {
                                const user = availableUsers.find(u => u.id === id);
                                return (
                                    <div key={id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <span>{user ? user.fullName : 'Неизвестный пользователь'}</span>
                                        <button
                                            onClick={() => removeExecutor(id)}
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

// Компонент модального окна оборудования
const EquipmentModal = ({
    isOpen,
    onClose,
    onSave,
    editingEquipment,
    equipment
}) => {
    const [selectedEquipmentId, setSelectedEquipmentId] = useState(editingEquipment?.equipmentId || '');
    const [imei, setImei] = useState(editingEquipment?.imei || '');
    const [quantity, setQuantity] = useState(editingEquipment?.quantity || 1);

    const selectedEquipment = equipment.find(e => e.id === parseInt(selectedEquipmentId));

    const handleSave = () => {
        if (!selectedEquipmentId) {
            alert('Выберите оборудование');
            return;
        }
        onSave({
            equipmentId: selectedEquipmentId,
            imei: imei.trim() || null,
            quantity: parseInt(quantity) || 1,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">
                    {editingEquipment ? 'Редактировать оборудование' : 'Добавить оборудование'}
                </h3>

                {/* Equipment Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Оборудование</label>
                    <select
                        value={selectedEquipmentId}
                        onChange={(e) => setSelectedEquipmentId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Выберите оборудование</option>
                        {equipment.map(eq => (
                            <option key={eq.id} value={eq.id}>
                                {eq.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* IMEI */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">IMEI (необязательно)</label>
                    <input
                        type="text"
                        value={imei}
                        onChange={(e) => setImei(e.target.value)}
                        placeholder="Введите IMEI"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Quantity */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
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
                        {editingEquipment ? 'Сохранить' : 'Добавить'}
                    </button>
                </div>
            </div>

            {/* Map Modal */}
            <MapModal
                isOpen={showMapModal}
                onClose={() => setShowMapModal(false)}
                onAddressSelect={handleAddressSelect}
                initialAddress={workAddress}
            />
        </div>
    );
};

export default BidDetail;