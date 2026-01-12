import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { register, getUsers, createUser, updateUser, deleteUser, getRoles, createRole, updateRole, deleteRole, getSpecifications, createSpecification, updateSpecification, deleteSpecification, getSpecificationCategories, getSpecificationCategoriesTree, createSpecificationCategory, updateSpecificationCategory, deleteSpecificationCategory, getBidTypes, createBidType, updateBidType, deleteBidType, getBidStatuses, createBidStatus, updateBidStatus, deleteBidStatus, getBidStatusTransitions, createBidStatusTransition, deleteBidStatusTransition } from '../services/api';

const Settings = () => {
    const { user } = useAuth();
    const { activeSettingsTab } = useOutletContext();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        password: '',
        role: '',
    });
    const [showRoleForm, setShowRoleForm] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleFormData, setRoleFormData] = useState({
        name: '',
        description: '',
    });
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [notification, setNotification] = useState(null);
    const [specifications, setSpecifications] = useState([]);
    const [showSpecificationForm, setShowSpecificationForm] = useState(false);
    const [editingSpecification, setEditingSpecification] = useState(null);
    const [specificationFormData, setSpecificationFormData] = useState({
        categoryId: '',
        name: '',
        discount: '',
        cost: '',
    });
    const [specificationCategories, setSpecificationCategories] = useState([]);
    const [allSpecificationCategories, setAllSpecificationCategories] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [expandedSpecCategories, setExpandedSpecCategories] = useState(new Set());
    const [showSpecificationCategoryForm, setShowSpecificationCategoryForm] = useState(false);
    const [editingSpecificationCategory, setEditingSpecificationCategory] = useState(null);
    const [specificationCategoryFormData, setSpecificationCategoryFormData] = useState({
        name: '',
        description: '',
        parentId: '',
    });
    const [bidTypes, setBidTypes] = useState([]);
    const [showBidTypeForm, setShowBidTypeForm] = useState(false);
    const [editingBidType, setEditingBidType] = useState(null);
    const [bidTypeFormData, setBidTypeFormData] = useState({
        name: '',
        description: '',
        statuses: [],
        transitions: [],
    });
    const [showBidStatusFormInEdit, setShowBidStatusFormInEdit] = useState(false);
    const [editingBidStatusInEdit, setEditingBidStatusInEdit] = useState(null);
    const [bidStatusFormDataInEdit, setBidStatusFormDataInEdit] = useState({
        name: '',
        position: '',
        allowedActions: [],
    });
    const [editingStatusPosition, setEditingStatusPosition] = useState(null);

    const calculateNextPosition = (statuses) => {
        const existingPositions = statuses.map(s => s.position).sort((a, b) => a - b);
        let position = 2;
        while (existingPositions.includes(position) && position < 999) {
            position++;
        }
        return position < 999 ? position : null;
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchSpecifications();
        fetchSpecificationCategories();
        fetchBidTypes();
    }, []);

    useEffect(() => {
        console.log('Debug: Current logged-in user information:', user);
    }, [user]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const fetchUsers = async () => {
        try {
            const response = await getUsers();
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await getRoles();
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
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

    const fetchSpecificationCategories = async () => {
        try {
            const [treeResponse, flatResponse] = await Promise.all([
                getSpecificationCategoriesTree(),
                getSpecificationCategories()
            ]);
            setSpecificationCategories(treeResponse.data);
            setAllSpecificationCategories(flatResponse.data);
        } catch (error) {
            console.error('Error fetching specification categories:', error);
        }
    };

    const fetchBidTypes = async () => {
        try {
            const response = await getBidTypes();
            setBidTypes(response.data);
        } catch (error) {
            console.error('Error fetching bid types:', error);
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await updateUser(editingUser.id, formData);
                setNotification({ type: 'success', message: 'Пользователь обновлен успешно' });
            } else {
                await createUser(formData);
                setNotification({ type: 'success', message: 'Пользователь создан успешно' });
            }
            setFormData({ username: '', fullName: '', email: '', password: '', role: 'user' });
            setEditingUser(null);
            setShowForm(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            setNotification({ type: 'error', message: 'Ошибка при сохранении пользователя' });
        }
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await updateRole(editingRole.id, roleFormData);
                setNotification({ type: 'success', message: 'Роль обновлена успешно' });
            } else {
                await createRole(roleFormData);
                setNotification({ type: 'success', message: 'Роль создана успешно' });
            }
            setRoleFormData({ name: '', description: '' });
            setEditingRole(null);
            setShowRoleForm(false);
            fetchRoles();
        } catch (error) {
            console.error('Error saving role:', error);
            setNotification({ type: 'error', message: 'Ошибка при сохранении роли' });
        }
    };

    const handleEditRole = (role) => {
        setEditingRole(role);
        setRoleFormData({ name: role.name, description: role.description });
        setShowRoleForm(true);
    };

    const handleDeleteRole = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить эту роль?')) {
            try {
                await deleteRole(id);
                setNotification({ type: 'success', message: 'Роль удалена успешно' });
                fetchRoles();
            } catch (error) {
                console.error('Error deleting role:', error);
                setNotification({ type: 'error', message: 'Ошибка при удалении роли' });
            }
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            password: '',
            role: user.role,
        });
        setShowForm(true);
    };

    const handleDeleteUser = async (id) => {
        const userToDelete = users.find(u => u.id === id);
        if (userToDelete.role === 'Админ') {
            setNotification({ type: 'error', message: 'Нельзя удалить администратора' });
            return;
        }
        if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            try {
                await deleteUser(id);
                setNotification({ type: 'success', message: 'Пользователь удален успешно' });
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                setNotification({ type: 'error', message: 'Ошибка при удалении пользователя' });
            }
        }
    };

    const handleSpecificationSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSpecification) {
                await updateSpecification(editingSpecification.id, specificationFormData);
                setNotification({ type: 'success', message: 'Спецификация обновлена успешно' });
            } else {
                await createSpecification(specificationFormData);
                setNotification({ type: 'success', message: 'Спецификация создана успешно' });
            }
            setSpecificationFormData({ categoryId: '', name: '', discount: '', cost: '' });
            setEditingSpecification(null);
            setShowSpecificationForm(false);
            fetchSpecifications();
        } catch (error) {
            console.error('Error saving specification:', error);
            setNotification({ type: 'error', message: 'Ошибка при сохранении спецификации' });
        }
    };

    const handleEditSpecification = (specification) => {
        setEditingSpecification(specification);
        setSpecificationFormData({
            categoryId: specification.categoryId.toString(),
            name: specification.name,
            discount: specification.discount.toString(),
            cost: specification.cost.toString(),
        });
        setShowSpecificationForm(true);
    };

    const handleDeleteSpecification = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить эту спецификацию?')) {
            try {
                await deleteSpecification(id);
                setNotification({ type: 'success', message: 'Спецификация удалена успешно' });
                fetchSpecifications();
            } catch (error) {
                console.error('Error deleting specification:', error);
                setNotification({ type: 'error', message: 'Ошибка при удалении спецификации' });
            }
        }
    };

    const handleSpecificationCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSpecificationCategory) {
                await updateSpecificationCategory(editingSpecificationCategory.id, specificationCategoryFormData);
                setNotification({ type: 'success', message: 'Категория спецификаций обновлена успешно' });
            } else {
                await createSpecificationCategory(specificationCategoryFormData);
                setNotification({ type: 'success', message: 'Категория спецификаций создана успешно' });
            }
            setSpecificationCategoryFormData({ name: '', description: '' });
            setEditingSpecificationCategory(null);
            setShowSpecificationCategoryForm(false);
            fetchSpecificationCategories();
        } catch (error) {
            console.error('Error saving specification category:', error);
            setNotification({ type: 'error', message: 'Ошибка при сохранении категории спецификаций' });
        }
    };

    const handleEditSpecificationCategory = (category) => {
        setEditingSpecificationCategory(category);
        setSpecificationCategoryFormData({
            name: category.name,
            description: category.description || '',
            parentId: category.parentId ? category.parentId.toString() : '',
        });
        setShowSpecificationCategoryForm(true);
    };

    const handleDeleteSpecificationCategory = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить эту категорию спецификаций?')) {
            try {
                await deleteSpecificationCategory(id);
                setNotification({ type: 'success', message: 'Категория спецификаций удалена успешно' });
                fetchSpecificationCategories();
            } catch (error) {
                console.error('Error deleting specification category:', error);
                setNotification({ type: 'error', message: 'Ошибка при удалении категории спецификаций' });
            }
        }
    };

    const handleBidTypeSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBidType) {
                await updateBidType(editingBidType.id, bidTypeFormData);
                setNotification({ type: 'success', message: 'Тип заявки обновлен успешно' });
            } else {
                await createBidType(bidTypeFormData);
                setNotification({ type: 'success', message: 'Тип заявки создан успешно' });
            }
            setBidTypeFormData({ name: '', description: '', statuses: [], transitions: [] });
            setEditingBidType(null);
            setShowBidTypeForm(false);
            setShowBidStatusFormInEdit(false);
            setEditingBidStatusInEdit(null);
            setBidStatusFormDataInEdit({ name: '', position: '', allowedActions: [] });
            setEditingStatusPosition(null);
            fetchBidTypes();
        } catch (error) {
            console.error('Error saving bid type:', error);
            setNotification({ type: 'error', message: 'Ошибка при сохранении типа заявки' });
        }
    };

    const handleEditBidType = (bidType) => {
        setEditingBidType(bidType);
        setBidTypeFormData({
            name: bidType.name,
            description: bidType.description || '',
            statuses: (bidType.statuses || []).map(status => ({
                ...status,
                color: status.color || (status.position === 1 ? '#c75a5a' : status.position === 999 ? '#7a7777' : '#ffffff')
            })),
            transitions: bidType.transitions || [],
        });
        setShowBidTypeForm(true);
        setShowBidStatusFormInEdit(false);
        setEditingBidStatusInEdit(null);
        setBidStatusFormDataInEdit({ name: '', position: '', allowedActions: [] });
        setEditingStatusPosition(null);
    };

    const handleDeleteBidType = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить этот тип заявки?')) {
            try {
                await deleteBidType(id);
                setNotification({ type: 'success', message: 'Тип заявки удален успешно' });
                fetchBidTypes();
            } catch (error) {
                console.error('Error deleting bid type:', error);
                setNotification({ type: 'error', message: 'Ошибка при удалении типа заявки' });
            }
        }
    };


    const handleBidStatusSubmitInEdit = (e) => {
        e.preventDefault();
        const statuses = [...bidTypeFormData.statuses];
        if (editingBidStatusInEdit) {
            const index = statuses.findIndex(s => s.position === editingBidStatusInEdit.position);
            if (index !== -1) {
                statuses[index] = { ...bidStatusFormDataInEdit, position: parseInt(bidStatusFormDataInEdit.position) };
            }
        } else {
            statuses.push({ ...bidStatusFormDataInEdit, position: parseInt(bidStatusFormDataInEdit.position) });
        }
        setBidTypeFormData({ ...bidTypeFormData, statuses });
        setBidStatusFormDataInEdit({ name: '', position: '', allowedActions: [] });
        setEditingBidStatusInEdit(null);
        setShowBidStatusFormInEdit(false);
    };

    const handleEditBidStatusInEdit = (bidStatus) => {
        setEditingBidStatusInEdit(bidStatus);
        setBidStatusFormDataInEdit({
            name: bidStatus.name,
            position: bidStatus.position.toString(),
            allowedActions: bidStatus.allowedActions || [],
        });
        setShowBidStatusFormInEdit(true);
    };

    const handleDeleteBidStatusInEdit = (status) => {
        const statuses = bidTypeFormData.statuses.filter(s => s.position !== status.position);
        setBidTypeFormData({ ...bidTypeFormData, statuses });
    };

    const handleCreateTransitionInEdit = (fromPosition, toPosition) => {
        const transitions = [...bidTypeFormData.transitions];
        if (!transitions.some(t => t.fromPosition === fromPosition && t.toPosition === toPosition)) {
            transitions.push({ fromPosition, toPosition });
            setBidTypeFormData({ ...bidTypeFormData, transitions });
        }
    };

    const handleDeleteTransitionInEdit = (fromPosition, toPosition) => {
        const transitions = bidTypeFormData.transitions.filter(t => !(t.fromPosition === fromPosition && t.toPosition === toPosition));
        setBidTypeFormData({ ...bidTypeFormData, transitions });
    };

    const handleStatusNameChange = (position, newName) => {
        const statuses = bidTypeFormData.statuses.map(s => s.position === position ? { ...s, name: newName } : s);
        setBidTypeFormData({ ...bidTypeFormData, statuses });
    };

    const toggleCategoryExpansion = (categoryId) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const toggleSpecCategoryExpansion = (categoryId) => {
        setExpandedSpecCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const buildSpecificationsTree = (categories, specifications, level = 0) => {
        return categories.map(category => {
            const categorySpecs = specifications.filter(spec => spec.categoryId === category.id);
            const children = category.children ? buildSpecificationsTree(category.children, specifications, level + 1) : [];
            return {
                ...category,
                specifications: categorySpecs,
                children,
                level
            };
        });
    };

    const buildCategoryOptions = (categories, level = 0, excludeId = null) => {
        const options = [];
        categories.forEach(category => {
            if (category.id === excludeId) return;
            options.push({
                id: category.id,
                name: `${'  '.repeat(level)}${category.name}`,
                level
            });
            if (category.children) {
                options.push(...buildCategoryOptions(category.children, level + 1, excludeId));
            }
        });
        return options;
    };

    const CategoryTreeItem = ({ category, level = 0 }) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);

        return (
            <div>
                <div
                    className={`flex items-center py-2 px-4 hover:bg-gray-50 cursor-pointer ${level > 0 ? 'ml-6' : ''}`}
                    style={{ paddingLeft: `${16 + level * 24}px` }}
                >
                    {hasChildren && (
                        <button
                            onClick={() => toggleCategoryExpansion(category.id)}
                            className="mr-2 text-gray-500 hover:text-gray-700"
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    )}
                    {!hasChildren && <span className="mr-2 w-4"></span>}
                    <div className="flex-1">
                        <span className="font-medium">{category.name}</span>
                        {category.description && (
                            <span className="text-gray-500 ml-2">({category.description})</span>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleEditSpecificationCategory(category)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                            Редактировать
                        </button>
                        <button
                            onClick={() => handleDeleteSpecificationCategory(category.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                        >
                            Удалить
                        </button>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div>
                        {category.children.map(child => (
                            <CategoryTreeItem key={child.id} category={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const SpecificationTreeItem = ({ category }) => {
        const hasChildren = category.children && category.children.length > 0;
        const hasSpecs = category.specifications && category.specifications.length > 0;
        const isExpanded = expandedSpecCategories.has(category.id);

        return (
            <div>
                <div
                    className="flex items-center py-2 px-4 hover:bg-gray-50 cursor-pointer"
                    style={{ paddingLeft: `${16 + category.level * 24}px` }}
                >
                    {(hasChildren || hasSpecs) && (
                        <button
                            onClick={() => toggleSpecCategoryExpansion(category.id)}
                            className="mr-2 text-gray-500 hover:text-gray-700"
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    )}
                    {!(hasChildren || hasSpecs) && <span className="mr-2 w-4"></span>}
                    <div className="flex-1">
                        <span className="font-medium">{category.name}</span>
                        {category.description && (
                            <span className="text-gray-500 ml-2">({category.description})</span>
                        )}
                    </div>
                </div>
                {isExpanded && (
                    <div>
                        {category.specifications.map((spec) => (
                            <div
                                key={spec.id}
                                className="flex items-center py-1 px-4 hover:bg-gray-50"
                                style={{ paddingLeft: `${40 + category.level * 24}px` }}
                            >
                                <div className="flex-1 grid grid-cols-3 gap-4">
                                    <span>{spec.name}</span>
                                    <span>{spec.discount}%</span>
                                    <span>{spec.cost} ₽</span>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEditSpecification(spec)}
                                        className="text-blue-600 hover:text-blue-900 text-sm"
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSpecification(spec.id)}
                                        className="text-red-600 hover:text-red-900 text-sm"
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                        {category.children.map(child => (
                            <SpecificationTreeItem key={child.id} category={child} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-8">
            {notification && (
                <div className={`mb-4 p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {notification.message}
                </div>
            )}
            {activeSettingsTab === 'user' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Управление пользователями</h2>
                        {user?.role === 'Админ' && (
                            <button
                                onClick={() => {
                                    setShowForm(!showForm);
                                    setEditingUser(null);
                                    setFormData({ username: '', fullName: '', email: '', password: '', role: '' });
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                {showForm ? 'Отмена' : '+ Добавить пользователя'}
                            </button>
                        )}
                    </div>

                    {!showForm && (
                        <>
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <h3 className="text-lg font-semibold mb-4">Текущий пользователь</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Имя пользователя</label>
                                        <p className="text-gray-900">{user?.username || 'Не указано'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <p className="text-gray-900">{user?.email || 'Не указано'}</p>
                                    </div>
                                </div>

                                {showBidStatusFormInEdit && (
                                    <div className="mt-4 bg-white rounded-lg shadow p-4">
                                        <h5 className="text-md font-semibold mb-4">
                                            {editingBidStatusInEdit ? 'Редактировать статус' : 'Добавить новый статус'}
                                        </h5>
                                        <form onSubmit={handleBidStatusSubmitInEdit} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                                    <input
                                                        type="text"
                                                        value={bidStatusFormDataInEdit.name}
                                                        onChange={(e) => setBidStatusFormDataInEdit({ ...bidStatusFormDataInEdit, name: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Позиция</label>
                                                    <input
                                                        type="number"
                                                        value={bidStatusFormDataInEdit.position}
                                                        onChange={(e) => setBidStatusFormDataInEdit({ ...bidStatusFormDataInEdit, position: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        min="1"
                                                        max="999"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Разрешенные действия</label>
                                                <input
                                                    type="text"
                                                    value={bidStatusFormDataInEdit.allowedActions.join(', ')}
                                                    onChange={(e) => setBidStatusFormDataInEdit({ ...bidStatusFormDataInEdit, allowedActions: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Действие1, Действие2"
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-4">
                                                <button
                                                    type="submit"
                                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                                >
                                                    {editingBidStatusInEdit ? 'Обновить' : 'Создать'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowBidStatusFormInEdit(false)}
                                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                                >
                                                    Отмена
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Логин</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ФИО</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Почта</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                                        {user?.role === 'Админ' && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                        )}
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">{u.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{u.fullName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {u.role === 'Админ' ? 'Администратор' :
                                                 u.role === 'Склад' ? 'Сотрудник склада' :
                                                 u.role === 'Менеджер' ? 'Менеджер' :
                                                 u.role === 'Технический специалист' ? 'Технический специалист' :
                                                 u.role === 'Бухгалтер' ? 'Бухгалтер' :
                                                 u.role === 'Монтажник' ? 'Монтажник' :
                                                 u.role === 'Пользователь' ? 'Пользователь' :
                                                 u.role}
                                            </td>
                                            {user?.role === 'Админ' && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleEditUser(u)}
                                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                                    >
                                                        Редактировать
                                                    </button>
                                                    {u.role !== 'Админ' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Удалить
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {showForm && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingUser ? 'Редактировать пользователя' : 'Добавить нового пользователя'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Почта</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Пароль {editingUser && <span className="text-gray-500">(оставьте пустым, чтобы не менять)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required={!editingUser}
                                        placeholder={editingUser ? "Оставьте пустым, чтобы сохранить текущий пароль" : ""}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {roles.filter(role => role.name !== 'Пользователь').map((role) => (
                                            <option key={role.id} value={role.name}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                    >
                                        {editingUser ? 'Обновить' : 'Создать'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {activeSettingsTab === 'roles' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Управление ролями</h2>
                        {user?.role === 'Админ' && (
                            <button
                                onClick={() => setShowRoleForm(!showRoleForm)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                {showRoleForm ? 'Отмена' : '+ Добавить роль'}
                            </button>
                        )}
                    </div>

                    {!showRoleForm && (
                        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
                                    {user?.role === 'Админ' && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                    )}
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {roles.map((role) => (
                                    <tr key={role.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{role.name}</td>
                                        <td className="px-6 py-4">{role.description}</td>
                                        {user?.role === 'Админ' && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleEditRole(role)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                >
                                                    Редактировать
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRole(role.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Удалить
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {showRoleForm && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingRole ? 'Редактировать роль' : 'Добавить новую роль'}
                            </h3>
                            <form onSubmit={handleRoleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input
                                        type="text"
                                        value={roleFormData.name}
                                        onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                    <textarea
                                        value={roleFormData.description}
                                        onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
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
                                        {editingRole ? 'Обновить' : 'Создать'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowRoleForm(false);
                                            setEditingRole(null);
                                            setRoleFormData({ name: '', description: '' });
                                        }}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {activeSettingsTab === 'specification-categories' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Управление категориями спецификаций</h2>
                        <button
                            onClick={() => {
                                setShowSpecificationCategoryForm(!showSpecificationCategoryForm);
                                setEditingSpecificationCategory(null);
                                setSpecificationCategoryFormData({ name: '', description: '', parentId: '' });
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                        >
                            {showSpecificationCategoryForm ? 'Отмена' : '+ Добавить категорию'}
                        </button>
                    </div>

                    {!showSpecificationCategoryForm && (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="divide-y divide-gray-200">
                                {specificationCategories.map((category) => (
                                    <CategoryTreeItem key={category.id} category={category} />
                                ))}
                            </div>
                        </div>
                    )}

                    {showSpecificationCategoryForm && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingSpecificationCategory ? 'Редактировать категорию' : 'Добавить новую категорию'}
                            </h3>
                            <form onSubmit={handleSpecificationCategorySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input
                                        type="text"
                                        value={specificationCategoryFormData.name}
                                        onChange={(e) => setSpecificationCategoryFormData({ ...specificationCategoryFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Родительская категория</label>
                                    <select
                                        value={specificationCategoryFormData.parentId}
                                        onChange={(e) => setSpecificationCategoryFormData({ ...specificationCategoryFormData, parentId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Нет родителя (корневая категория)</option>
                                        {buildCategoryOptions(specificationCategories, 0, editingSpecificationCategory?.id).map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                    <textarea
                                        value={specificationCategoryFormData.description}
                                        onChange={(e) => setSpecificationCategoryFormData({ ...specificationCategoryFormData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                    />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                    >
                                        {editingSpecificationCategory ? 'Обновить' : 'Создать'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowSpecificationCategoryForm(false)}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {activeSettingsTab === 'bid-types' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Управление типами заявок</h2>
                        <button
                            onClick={() => {
                                setShowBidTypeForm(!showBidTypeForm);
                                setEditingBidType(null);
                                setBidTypeFormData({ name: '', description: '' });
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                        >
                            {showBidTypeForm ? 'Отмена' : '+ Добавить тип заявки'}
                        </button>
                    </div>

                    {!showBidTypeForm && (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {bidTypes.map((bidType) => (
                                    <tr key={bidType.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{bidType.name}</td>
                                        <td className="px-6 py-4">{bidType.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleEditBidType(bidType)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Редактировать
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBidType(bidType.id)}
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
                    )}


                    {showBidTypeForm && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingBidType ? 'Редактировать тип заявки' : 'Добавить новый тип заявки'}
                            </h3>
                            <form onSubmit={handleBidTypeSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input
                                        type="text"
                                        value={bidTypeFormData.name}
                                        onChange={(e) => setBidTypeFormData({ ...bidTypeFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                    <textarea
                                        value={bidTypeFormData.description}
                                        onChange={(e) => setBidTypeFormData({ ...bidTypeFormData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                    />
                                </div>

                                <div className="mt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-lg font-semibold">Управление статусами</h4>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (showBidStatusFormInEdit) {
                                                    // cancel
                                                    setShowBidStatusFormInEdit(false);
                                                    setEditingBidStatusInEdit(null);
                                                    setBidStatusFormDataInEdit({ name: '', position: '', allowedActions: [] });
                                                } else {
                                                    // add
                                                    const nextPos = calculateNextPosition(bidTypeFormData.statuses);
                                                    if (nextPos === null) {
                                                        alert('Нет доступной позиции для нового статуса');
                                                        return;
                                                    }
                                                    const newStatus = { name: 'Новый статус', position: nextPos, allowedActions: [], responsibleUserId: null, color: '#ffffff' };
                                                    setBidTypeFormData({ ...bidTypeFormData, statuses: [...bidTypeFormData.statuses, newStatus] });
                                                }
                                            }}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                        >
                                            {showBidStatusFormInEdit ? 'Отмена' : '+ Добавить статус'}
                                        </button>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Позиция</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Цвет</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ответственный</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                            {(bidTypeFormData.statuses || []).sort((a, b) => a.position - b.position).map((status) => (
                                                <tr key={status.position} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        {editingStatusPosition === status.position ? (
                                                            <input
                                                                type="text"
                                                                value={status.name}
                                                                onChange={(e) => handleStatusNameChange(status.position, e.target.value)}
                                                                onBlur={() => setEditingStatusPosition(null)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        setEditingStatusPosition(null);
                                                                    }
                                                                }}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                autoFocus
                                                            />
                                                        ) : status.position === 1 || status.position === 999 ? (
                                                            <span className="px-1 py-1">
                                                                {status.name}
                                                            </span>
                                                        ) : (
                                                            <span
                                                                onClick={() => setEditingStatusPosition(status.position)}
                                                                className="cursor-pointer hover:underline px-1 py-1 rounded text-blue-600"
                                                            >
                                                                {status.name}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap">{status.position}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        <input
                                                            type="color"
                                                            value={status.color || '#ffffff'}
                                                            onChange={(e) => {
                                                                const newStatuses = bidTypeFormData.statuses.map(s => s.position === status.position ? { ...s, color: e.target.value } : s);
                                                                setBidTypeFormData({ ...bidTypeFormData, statuses: newStatuses });
                                                            }}
                                                            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        <select
                                                            value={status.responsibleUserId || ''}
                                                            onChange={(e) => {
                                                                const newStatuses = bidTypeFormData.statuses.map(s => s.position === status.position ? { ...s, responsibleUserId: e.target.value || null } : s);
                                                                setBidTypeFormData({ ...bidTypeFormData, statuses: newStatuses });
                                                            }}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        >
                                                            <option value="">Не выбран</option>
                                                            {users.map(user => (
                                                                <option key={user.id} value={user.id}>{user.fullName}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        {status.position !== 1 && status.position !== 999 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteBidStatusInEdit(status)}
                                                                className="text-red-600 hover:text-red-900 text-sm"
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

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h5 className="text-md font-semibold mb-4">Переходы между статусами</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(bidTypeFormData.statuses || []).sort((a, b) => a.position - b.position).map((fromStatus) => (
                                                <div key={fromStatus.position} className="border rounded-lg p-4">
                                                    <h6 className="font-medium mb-2">Из: {fromStatus.name}</h6>
                                                    <div className="space-y-2">
                                                        {(bidTypeFormData.statuses || [])
                                                            .filter((toStatus) => toStatus.position !== fromStatus.position)
                                                            .sort((a, b) => a.position - b.position)
                                                            .map((toStatus) => {
                                                                const existingTransition = (bidTypeFormData.transitions || []).find(
                                                                    (t) => t.fromPosition === fromStatus.position && t.toPosition === toStatus.position
                                                                );
                                                                return (
                                                                    <div key={toStatus.position} className="flex items-center justify-between">
                                                                        <span>В: {toStatus.name}</span>
                                                                        {existingTransition ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteTransitionInEdit(fromStatus.position, toStatus.position)}
                                                                                className="text-red-600 hover:text-red-900 text-sm"
                                                                            >
                                                                                Удалить переход
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleCreateTransitionInEdit(fromStatus.position, toStatus.position)}
                                                                                className="text-green-600 hover:text-green-900 text-sm"
                                                                            >
                                                                                Добавить переход
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                    >
                                        {editingBidType ? 'Обновить' : 'Создать'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowBidTypeForm(false);
                                            setShowBidStatusFormInEdit(false);
                                            setEditingBidStatusInEdit(null);
                                            setBidStatusFormDataInEdit({ name: '', position: '', allowedActions: [] });
                                            setEditingStatusPosition(null);
                                        }}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {activeSettingsTab === 'specifications' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Управление спецификациями</h2>
                        <button
                            onClick={() => {
                                setShowSpecificationForm(!showSpecificationForm);
                                setEditingSpecification(null);
                                setSpecificationFormData({ categoryId: '', name: '', discount: '', cost: '' });
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                        >
                            {showSpecificationForm ? 'Отмена' : '+ Добавить спецификацию'}
                        </button>
                    </div>

                    {!showSpecificationForm && (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="divide-y divide-gray-200">
                                {buildSpecificationsTree(specificationCategories, specifications).map((category) => (
                                    <SpecificationTreeItem key={category.id} category={category} />
                                ))}
                            </div>
                        </div>
                    )}

                    {showSpecificationForm && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingSpecification ? 'Редактировать спецификацию' : 'Добавить новую спецификацию'}
                            </h3>
                            <form onSubmit={handleSpecificationSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                                        <select
                                            value={specificationFormData.categoryId}
                                            onChange={(e) => setSpecificationFormData({ ...specificationFormData, categoryId: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Выберите категорию</option>
                                            {allSpecificationCategories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Наименование</label>
                                        <input
                                            type="text"
                                            value={specificationFormData.name}
                                            onChange={(e) => setSpecificationFormData({ ...specificationFormData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Скидка (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={specificationFormData.discount}
                                            onChange={(e) => setSpecificationFormData({ ...specificationFormData, discount: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={specificationFormData.cost}
                                            onChange={(e) => setSpecificationFormData({ ...specificationFormData, cost: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                    >
                                        {editingSpecification ? 'Обновить' : 'Создать'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowSpecificationForm(false)}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Settings;