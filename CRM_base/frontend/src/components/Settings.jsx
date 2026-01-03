import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { register, getUsers, createUser, updateUser, deleteUser, getRoles, createRole, updateRole, deleteRole, getSpecifications, createSpecification, updateSpecification, deleteSpecification, getSpecificationCategories, getSpecificationCategoriesTree, createSpecificationCategory, updateSpecificationCategory, deleteSpecificationCategory } from '../services/api';

const Settings = () => {
    const { user } = useAuth();
    const { activeSettingsTab } = useOutletContext();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        password: '',
        role: 'User',
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
        executorId: '',
        quantity: '',
        discount: '',
        cost: '',
        comment: '',
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

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchSpecifications();
        fetchSpecificationCategories();
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
        if (userToDelete.role === 'admin') {
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
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => {
                                    setShowForm(!showForm);
                                    setEditingUser(null);
                                    setFormData({ username: '', fullName: '', email: '', password: '', role: 'user' });
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
                            </div>

                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Логин</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ФИО</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Почта</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                                        {user?.role === 'admin' && (
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
                                            <td className="px-6 py-4 whitespace-nowrap">{u.role === 'admin' ? 'Администратор' : 'Пользователь'}</td>
                                            {user?.role === 'admin' && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleEditUser(u)}
                                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                                    >
                                                        Редактировать
                                                    </button>
                                                    {u.role !== 'admin' && (
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.name.toLowerCase()}>
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
                        {user?.role === 'admin' && (
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
                                    {user?.role === 'admin' && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                    )}
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {roles.map((role) => (
                                    <tr key={role.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{role.name}</td>
                                        <td className="px-6 py-4">{role.description}</td>
                                        {user?.role === 'admin' && (
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