import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { register, getUsers, createUser, updateUser, deleteUser, getRoles, createRole, updateRole, deleteRole } from '../services/api';

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

    useEffect(() => {
        fetchUsers();
        fetchRoles();
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
        </div>
    );
};

export default Settings;